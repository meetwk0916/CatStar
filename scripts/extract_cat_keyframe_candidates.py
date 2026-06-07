#!/usr/bin/env python3
"""Extract CatStar cat keyframe candidates into 96x96 preview frames.

This is an art-review helper, not a production sprite generator. It takes a
transparent keyframe board, separates poses by vertical alpha gaps, then scales
each pose into CatStar's current 96x96 frame contract for visual review.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image


FRAME_SIZE = 96
ALPHA_THRESHOLD = 20
DEFAULT_INPUT = Path(
    "docs/art/candidates/cat-action-keyframes/cat-action-keyframes-01-alpha.png"
)
DEFAULT_OUTPUT = Path("docs/art/candidates/cat-action-keyframes/normalized-96")


@dataclass(frozen=True)
class ExtractedPose:
    name: str
    source_bbox: tuple[int, int, int, int]
    output_file: str
    source_size: tuple[int, int]
    placed_size: tuple[int, int]
    anchor: str = "bottom-center"


def alpha_columns(image: Image.Image) -> list[bool]:
    alpha = image.getchannel("A")
    width, height = image.size
    columns: list[bool] = []
    for x in range(width):
        has_alpha = any(alpha.getpixel((x, y)) > ALPHA_THRESHOLD for y in range(height))
        columns.append(has_alpha)
    return columns


def split_column_runs(columns: list[bool], min_gap: int) -> list[tuple[int, int]]:
    runs: list[tuple[int, int]] = []
    start: int | None = None
    last_seen: int | None = None
    gap = 0

    for x, has_alpha in enumerate(columns):
        if has_alpha:
            if start is None:
                start = x
            last_seen = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap and last_seen is not None:
                runs.append((start, last_seen + 1))
                start = None
                last_seen = None
                gap = 0

    if start is not None and last_seen is not None:
        runs.append((start, last_seen + 1))
    return runs


def visible_x_range(columns: list[bool]) -> tuple[int, int]:
    filled = [index for index, has_alpha in enumerate(columns) if has_alpha]
    if not filled:
        raise ValueError("No visible columns found")
    return (min(filled), max(filled) + 1)


def split_evenly(columns: list[bool], expected_count: int) -> list[tuple[int, int]]:
    x0, x1 = visible_x_range(columns)
    width = x1 - x0
    return [
        (round(x0 + width * index / expected_count), round(x0 + width * (index + 1) / expected_count))
        for index in range(expected_count)
    ]


def parse_x_ranges(value: str) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    for item in value.split(","):
        start, end = item.split(":", maxsplit=1)
        ranges.append((int(start), int(end)))
    return ranges


def bbox_for_run(image: Image.Image, x0: int, x1: int) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    width, height = image.size
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for x in range(x0, x1):
        for y in range(height):
            if alpha.getpixel((x, y)) > ALPHA_THRESHOLD:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if min_x > max_x or min_y > max_y:
        raise ValueError(f"No visible pixels in run {x0}:{x1}")
    return (min_x, min_y, max_x + 1, max_y + 1)


def expand_bbox(
    bbox: tuple[int, int, int, int],
    image_size: tuple[int, int],
    padding: int,
) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = bbox
    width, height = image_size
    return (
        max(0, x0 - padding),
        max(0, y0 - padding),
        min(width, x1 + padding),
        min(height, y1 + padding),
    )


def remove_small_alpha_components(image: Image.Image, min_area: int) -> Image.Image:
    if min_area <= 0:
        return image

    width, height = image.size
    alpha = image.getchannel("A")
    pixels = image.load()
    seen: set[tuple[int, int]] = set()

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

            if len(component) < min_area:
                for px, py in component:
                    pixels[px, py] = (0, 0, 0, 0)

    return image


def fit_into_frame(source: Image.Image, max_occupancy: float) -> Image.Image:
    max_size = int(FRAME_SIZE * max_occupancy)
    source_width, source_height = source.size
    scale = min(max_size / source_width, max_size / source_height)
    target_size = (
        max(1, round(source_width * scale)),
        max(1, round(source_height * scale)),
    )
    resized = source.resize(target_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    x = (FRAME_SIZE - target_size[0]) // 2
    y = FRAME_SIZE - target_size[1] - 5
    frame.alpha_composite(resized, (x, y))
    return frame


def make_contact_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_SIZE, 0))
    return sheet


def visible_size(image: Image.Image) -> tuple[int, int]:
    bbox = image.getbbox()
    if bbox is None:
        return (0, 0)
    return (bbox[2] - bbox[0], bbox[3] - bbox[1])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--min-gap", type=int, default=45)
    parser.add_argument("--padding", type=int, default=18)
    parser.add_argument("--max-occupancy", type=float, default=0.86)
    parser.add_argument("--min-component-area", type=int, default=80)
    parser.add_argument(
        "--expected-count",
        type=int,
        default=None,
        help="Split the visible source width evenly into this many poses.",
    )
    parser.add_argument(
        "--x-ranges",
        default=None,
        help="Comma-separated manual x ranges, for example 35:350,370:737.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    image = Image.open(args.input).convert("RGBA")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for old_file in args.out_dir.glob("pose-*.png"):
        old_file.unlink()

    columns = alpha_columns(image)
    if args.x_ranges:
        runs = parse_x_ranges(args.x_ranges)
    elif args.expected_count:
        runs = split_evenly(columns, args.expected_count)
    else:
        runs = split_column_runs(columns, min_gap=args.min_gap)
    if not runs:
        raise SystemExit(f"No pose columns found in {args.input}")

    frames: list[Image.Image] = []
    metadata: list[ExtractedPose] = []
    for index, run in enumerate(runs, start=1):
        bbox = expand_bbox(bbox_for_run(image, *run), image.size, padding=args.padding)
        crop = remove_small_alpha_components(image.crop(bbox), min_area=args.min_component_area)
        frame = fit_into_frame(crop, max_occupancy=args.max_occupancy)
        name = f"pose-{index:02d}.png"
        frame.save(args.out_dir / name)
        frames.append(frame)
        metadata.append(
            ExtractedPose(
                name=f"pose-{index:02d}",
                source_bbox=bbox,
                output_file=name,
                source_size=crop.size,
                placed_size=visible_size(frame),
            )
        )

    make_contact_sheet(frames).save(args.out_dir / "contact-sheet.png")
    (args.out_dir / "metadata.json").write_text(
        json.dumps([asdict(item) for item in metadata], indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Extracted {len(frames)} poses into {args.out_dir}")


if __name__ == "__main__":
    main()
