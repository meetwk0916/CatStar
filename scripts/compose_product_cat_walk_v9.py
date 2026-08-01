#!/usr/bin/env python3
"""Extract the product-action v9 slow cat-step walk sheet."""

from __future__ import annotations

import json

from PIL import Image

from artifact_paths import ARTIFACTS_ART_ROOT


FRAME = 96
OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "archive" / "product-cat-actions-v9"
SOURCE = OUT_DIR / "sources" / "walk-slow-cat-step-source.png"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
NORMALIZED_DIR = OUT_DIR / "normalized-96"


def is_green(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _a = pixel
    return g > 130 and g > r * 1.45 and g > b * 1.45


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
    if image.width >= 1200:
        segment_width = image.width / 8
        return [
            (round(index * segment_width), round((index + 1) * segment_width))
            for index in range(8)
        ]

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
        if end - start < 24:
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


def keep_largest_subject(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(image.height):
        for x in range(image.width):
            if (x, y) in visited or alpha.getpixel((x, y)) <= 24:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []

            while stack:
                current_x, current_y = stack.pop()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    if (
                        next_x < 0
                        or next_y < 0
                        or next_x >= image.width
                        or next_y >= image.height
                        or (next_x, next_y) in visited
                        or alpha.getpixel((next_x, next_y)) <= 24
                    ):
                        continue
                    visited.add((next_x, next_y))
                    stack.append((next_x, next_y))

            if len(component) >= 64:
                components.append(component)

    if not components:
        return image

    largest = max(components, key=len)
    mask = Image.new("L", image.size, 0)
    mask_pixels = mask.load()
    for x, y in largest:
        mask_pixels[x, y] = alpha.getpixel((x, y))

    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    output.alpha_composite(image)
    output.putalpha(mask)
    return output


def normalize(subject: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    subject = crop_alpha(keep_largest_subject(subject))
    max_width = 86
    max_height = 76
    scale = min(max_width / max(1, subject.width), max_height / max(1, subject.height))
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 6
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
    if len(groups) != 8:
        raise SystemExit(f"Expected 8 walk frames, found {len(groups)} groups: {groups}")

    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for index, (start, end) in enumerate(groups, start=1):
        crop = alpha.crop((start, 0, end, alpha.height))
        frame, info = normalize(crop)
        frames.append(frame)
        frame.save(NORMALIZED_DIR / f"walk-{index:02d}.png")
        metadata.append({"frame": index, "source_x": [start, end], **info})

    sheet = make_sheet(frames)
    sheet.save(SHEET_DIR / "walk.png")

    preview = Image.new("RGBA", (FRAME * len(frames), FRAME), (24, 24, 24, 255))
    preview.alpha_composite(sheet, (0, 0))
    preview.save(SHEET_DIR / "walk-preview.png")

    (OUT_DIR / "metadata.json").write_text(json.dumps({"walk": metadata}, indent=2) + "\n")
    (OUT_DIR / "README.md").write_text(
        "# Product Cat Actions v9\n\n"
        "Slow cat-step walk candidate generated as an eight-frame chroma-key source and normalized to the CatStar `96x96` action contract.\n\n"
        "This candidate is intended to replace the earlier walk loop with a more clearly feline four-beat walking gait: slower foot contact, steadier face shape, and consistent body scale.\n",
    )
    print(f"Wrote {SHEET_DIR / 'walk.png'}")


if __name__ == "__main__":
    main()
