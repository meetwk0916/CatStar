#!/usr/bin/env python3
"""Extract the product-action v7 calm idle sheet."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


FRAME = 96
OUT_DIR = Path("docs/art/candidates/product-cat-actions-v7")
SOURCE = OUT_DIR / "sources" / "idle-calm-source.png"
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
    max_width = 84
    max_height = 78
    scale = min(max_width / max(1, subject.width), max_height / max(1, subject.height))
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 6
    if frame_index == 2:
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
    if len(groups) != 4:
        raise SystemExit(f"Expected 4 idle frames, found {len(groups)} groups: {groups}")

    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for index, (start, end) in enumerate(groups, start=1):
        crop = alpha.crop((start, 0, end, alpha.height))
        frame, info = normalize(crop, index)
        frames.append(frame)
        frame.save(NORMALIZED_DIR / f"idle-{index:02d}.png")
        metadata.append({"frame": index, "source_x": [start, end], **info})

    sheet = make_sheet(frames)
    sheet.save(SHEET_DIR / "idle.png")

    preview = Image.new("RGBA", (FRAME * len(frames), FRAME), (24, 24, 24, 255))
    preview.alpha_composite(sheet, (0, 0))
    preview.save(SHEET_DIR / "idle-preview.png")

    (OUT_DIR / "metadata.json").write_text(json.dumps({"idle": metadata}, indent=2) + "\n")
    (OUT_DIR / "README.md").write_text(
        "# Product Cat Actions v7\n\n"
        "Calm standing idle candidate generated as a four-frame chroma-key source and normalized to the CatStar `96x96` action contract.\n\n"
        "This replaces the earlier baseline idle with a dedicated product-action idle loop: attentive stand, subtle breathing, blink, and return.\n",
    )
    print(f"Wrote {SHEET_DIR / 'idle.png'}")


if __name__ == "__main__":
    main()
