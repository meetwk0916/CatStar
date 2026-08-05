#!/usr/bin/env python3
"""Derive the split plant leaf and repaired runtime background.

The source is the reviewed 640x360 runtime background before the leaf split.
Keeping this derivation deterministic ensures the resting composition is pixel
identical while the small exposed area behind the animated leaf is repaired.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE_PATH = Path(
    "artifacts/art/sources/plant-interaction-v1/background-before-leaf-split.png"
)
LEAF_SOURCE_PATH = Path("artifacts/art/sources/plant-interaction-v1/generated-leaf-alpha.png")
RUNTIME_DIR = Path("public/assets/scenes/window-room")
LEAF_POLYGON = (
    (493, 157),
    (500, 148),
    (511, 145),
    (522, 149),
    (535, 158),
    (523, 164),
    (510, 163),
    (500, 161),
)
LEAF_PIVOT = (534, 158)
PADDING = 2


def derive_assets(
    source: Image.Image,
    leaf_source: Image.Image,
) -> tuple[Image.Image, Image.Image, tuple[int, int]]:
    source = source.convert("RGBA")
    if source.size != (640, 360):
        raise ValueError(f"expected 640x360 source, got {source.size}")

    mask = Image.new("L", source.size, 0)
    ImageDraw.Draw(mask).polygon(LEAF_POLYGON, fill=255)
    mask_bbox = mask.getbbox()
    if mask_bbox is None:
        raise ValueError("leaf mask is empty")

    left = max(mask_bbox[0] - PADDING, 0)
    top = max(mask_bbox[1] - PADDING, 0)
    right = min(mask_bbox[2] + PADDING, source.width)
    bottom = min(mask_bbox[3] + PADDING, source.height)

    leaf_source = leaf_source.convert("RGBA")
    source_bbox = leaf_source.getchannel("A").getbbox()
    if source_bbox is None:
        raise ValueError("generated leaf source is empty")
    leaf_pixels = leaf_source.crop(source_bbox)
    leaf_pixels.thumbnail((right - left - 2, bottom - top - 2), Image.Resampling.LANCZOS)
    leaf = Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0))
    leaf.paste(leaf_pixels, (0, (leaf.height - leaf_pixels.height) // 2), leaf_pixels)

    repaired = source.copy()
    repaired_pixels = repaired.load()
    source_pixels = source.load()
    mask_pixels = mask.load()
    for y in range(top, bottom):
        masked_x = [x for x in range(left, right) if mask_pixels[x, y] > 0]
        if not masked_x:
            continue
        safe_left = source_pixels[480, y]
        safe_right = source_pixels[542, y]
        for x in masked_x:
            progress = (x - 480) / (542 - 480)
            repaired_pixels[x, y] = tuple(
                round(safe_left[channel] + (safe_right[channel] - safe_left[channel]) * progress)
                for channel in range(4)
            )

    origin = (LEAF_PIVOT[0] - left, LEAF_PIVOT[1] - top)
    return repaired, leaf, origin


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=SOURCE_PATH)
    parser.add_argument("--leaf-source", type=Path, default=LEAF_SOURCE_PATH)
    parser.add_argument("--output-dir", type=Path, default=RUNTIME_DIR)
    parser.add_argument("--debug-mask", type=Path)
    parser.add_argument("--debug-composite", type=Path)
    args = parser.parse_args()

    source = Image.open(args.source)
    if args.debug_mask:
        debug = source.convert("RGBA")
        ImageDraw.Draw(debug).line((*LEAF_POLYGON, LEAF_POLYGON[0]), fill=(255, 0, 0, 255), width=2)
        debug.save(args.debug_mask)

    repaired, leaf, origin = derive_assets(source, Image.open(args.leaf_source))
    if args.debug_composite:
        composite = repaired.copy()
        composite.alpha_composite(leaf, (LEAF_PIVOT[0] - origin[0], LEAF_PIVOT[1] - origin[1]))
        composite.save(args.debug_composite)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    repaired.save(args.output_dir / "background.png", optimize=True)
    leaf.save(args.output_dir / "plant-leaf.png", optimize=True)
    print(
        f"Wrote background.png and plant-leaf.png; leaf={leaf.size}, "
        f"pivot={LEAF_PIVOT}, local-origin={origin}"
    )


if __name__ == "__main__":
    main()
