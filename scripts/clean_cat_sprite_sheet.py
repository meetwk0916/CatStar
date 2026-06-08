#!/usr/bin/env python3
"""Clean isolated edge artifacts from CatStar 96x96 cat sprite sheets."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


FRAME = 96
ALPHA_THRESHOLD = 20


def alpha_components(image: Image.Image) -> list[list[tuple[int, int]]]:
    width, height = image.size
    alpha = image.getchannel("A")
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or alpha.getpixel((x, y)) <= ALPHA_THRESHOLD:
                continue

            stack = [(x, y)]
            component: list[tuple[int, int]] = []
            seen.add((x, y))
            while stack:
                px, py = stack.pop()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if (
                        nx < 0
                        or ny < 0
                        or nx >= width
                        or ny >= height
                        or (nx, ny) in seen
                        or alpha.getpixel((nx, ny)) <= ALPHA_THRESHOLD
                    ):
                        continue
                    seen.add((nx, ny))
                    stack.append((nx, ny))
            components.append(component)

    return components


def clean_frame(image: Image.Image, min_area: int, keep_largest: bool) -> tuple[Image.Image, int]:
    image = image.copy()
    pixels = image.load()
    components = alpha_components(image)
    if not components:
        return image, 0

    largest = max(components, key=len)
    removed = 0
    for component in components:
        should_remove = len(component) < min_area or (keep_largest and component is not largest)
        if not should_remove:
            continue
        removed += len(component)
        for x, y in component:
            pixels[x, y] = (0, 0, 0, 0)
    return image, removed


def clean_sheet(input_path: Path, output_path: Path, min_area: int, keep_largest: bool) -> None:
    source = Image.open(input_path).convert("RGBA")
    if source.height != FRAME or source.width % FRAME != 0:
        raise SystemExit(f"{input_path} is not a horizontal 96x96 sprite sheet: {source.size}")

    frame_count = source.width // FRAME
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    total_removed = 0
    for index in range(frame_count):
        frame = source.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME))
        cleaned, removed = clean_frame(frame, min_area=min_area, keep_largest=keep_largest)
        total_removed += removed
        output.alpha_composite(cleaned, (index * FRAME, 0))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)
    print(f"Wrote {output_path}; removed {total_removed} pixels across {frame_count} frames")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--min-area", type=int, default=90)
    parser.add_argument("--keep-largest", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    clean_sheet(
        input_path=args.input,
        output_path=args.output,
        min_area=args.min_area,
        keep_largest=args.keep_largest,
    )


if __name__ == "__main__":
    main()
