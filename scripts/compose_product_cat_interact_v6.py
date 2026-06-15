#!/usr/bin/env python3
"""Extract the product-action v6 affectionate interaction sheet."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


FRAME = 96
OUT_DIR = Path("docs/art/candidates/product-cat-actions-v6")
SOURCE = OUT_DIR / "sources" / "interact-affection-source.png"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
NORMALIZED_DIR = OUT_DIR / "normalized-96"


def is_green(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _a = pixel
    return g > 120 and g > r * 1.35 and g > b * 1.35


def remove_green(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            if is_green(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return image


def column_has_subject(image: Image.Image, x: int) -> bool:
    alpha = image.getchannel("A")
    for y in range(image.height):
        if alpha.getpixel((x, y)) > 24:
            return True
    return False


def split_frame_groups(image: Image.Image) -> list[tuple[int, int]]:
    raw_groups: list[tuple[int, int]] = []
    in_group = False
    start = 0

    for x in range(image.width):
        occupied = column_has_subject(image, x)
        if occupied and not in_group:
            start = x
            in_group = True
        elif not occupied and in_group:
            raw_groups.append((start, x))
            in_group = False

    if in_group:
        raw_groups.append((start, image.width))

    groups: list[tuple[int, int]] = []
    for start, end in raw_groups:
        if end - start < 16:
            continue
        if groups and start - groups[-1][1] < 24:
            groups[-1] = (groups[-1][0], end)
        else:
            groups.append((start, end))
    return groups


def crop_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return image
    return image.crop(bbox)


def normalize(subject: Image.Image, frame_index: int) -> tuple[Image.Image, dict[str, object]]:
    subject = crop_alpha(subject)
    max_width = 82
    max_height = 76
    scale = min(max_width / max(1, subject.width), max_height / max(1, subject.height))
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    # The generated interaction frames sit taller than the runtime idle sheet;
    # keep their feet on the same bottom anchor so click feedback does not pop.
    y = FRAME - resized.height - 6
    if frame_index in {2, 3, 4}:
        y -= 1
    frame.alpha_composite(resized, (x, y))
    return frame, {"sprite_size": list(resized.size), "paste": [x, y]}


def make_sheet(frames: list[Image.Image]) -> Image.Image:
    output = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        output.alpha_composite(frame, (index * FRAME, 0))
    return output


def main() -> None:
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGBA")
    alpha = remove_green(source)
    groups = split_frame_groups(alpha)
    if len(groups) != 5:
        raise SystemExit(f"Expected 5 interaction frames, found {len(groups)} groups: {groups}")

    # Source frame 4 is a seated pose. Skip it to keep interaction as a small
    # in-place affectionate response rather than a state transition into sitting.
    source_order = [1, 2, 3, 2, 5]
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for output_index, source_index in enumerate(source_order, start=1):
        start, end = groups[source_index - 1]
        crop = alpha.crop((start, 0, end, alpha.height))
        frame, info = normalize(crop, output_index)
        frames.append(frame)
        frame.save(NORMALIZED_DIR / f"interact-{output_index:02d}.png")
        metadata.append(
            {
                "frame": output_index,
                "sourceFrame": source_index,
                "source_x": [start, end],
                **info,
            },
        )

    sheet = make_sheet(frames)
    sheet.save(SHEET_DIR / "interact.png")

    preview = Image.new("RGBA", (FRAME * len(frames), FRAME), (24, 24, 24, 255))
    preview.alpha_composite(sheet, (0, 0))
    preview.save(SHEET_DIR / "interact-preview.png")

    (OUT_DIR / "metadata.json").write_text(json.dumps({"interact": metadata}, indent=2) + "\n")
    (OUT_DIR / "README.md").write_text(
        "# Product Cat Actions v6\n\n"
        "Affectionate interaction candidate generated as a five-frame chroma-key source and normalized to the CatStar `96x96` action contract.\n\n"
        "The seated source pose is intentionally skipped so click feedback stays as a small nuzzle/blink response rather than changing into a sitting state.\n",
    )
    print(f"Wrote {SHEET_DIR / 'interact.png'}")


if __name__ == "__main__":
    main()
