#!/usr/bin/env python3
"""Normalize the CatStar v10 gray-white quality slice into 96px action sheets."""

from __future__ import annotations

import json
from dataclasses import dataclass

from PIL import Image, ImageChops, ImageFilter

from artifact_paths import ARTIFACTS_ART_ROOT


FRAME = 96
OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-quality-slice-v10"
SOURCE_DIR = OUT_DIR / "sources"
NORMALIZED_DIR = OUT_DIR / "normalized-96"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"


@dataclass(frozen=True)
class ActionRow:
    action: str
    source: str
    y_min: int
    y_max: int
    frames: int
    max_width: int
    max_height: int


ACTION_ROWS = (
    ActionRow("sit", "cat-quality-slice.png", 20, 360, 4, 82, 84),
    ActionRow("walk", "cat-quality-slice.png", 380, 620, 8, 88, 70),
    ActionRow("interact", "cat-quality-slice.png", 640, 1000, 6, 82, 84),
    ActionRow("groom", "cat-groom-stretch.png", 150, 450, 8, 82, 84),
    ActionRow("stretch", "cat-groom-stretch.png", 540, 820, 6, 88, 74),
)


def keep_largest_subject(cell: Image.Image) -> Image.Image:
    alpha = cell.getchannel("A")
    threshold = alpha.point(lambda value: 255 if value > 24 else 0)
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(cell.height):
        for x in range(cell.width):
            if (x, y) in visited or threshold.getpixel((x, y)) == 0:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            while stack:
                current = stack.pop()
                component.append(current)
                current_x, current_y = current
                for neighbor in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    next_x, next_y = neighbor
                    if (
                        next_x < 0
                        or next_y < 0
                        or next_x >= cell.width
                        or next_y >= cell.height
                        or neighbor in visited
                        or threshold.getpixel(neighbor) == 0
                    ):
                        continue
                    visited.add(neighbor)
                    stack.append(neighbor)
            components.append(component)

    if not components:
        raise ValueError("Expected a visible cat pose, found an empty cell")

    mask = Image.new("L", cell.size, 0)
    mask_pixels = mask.load()
    for x, y in max(components, key=len):
        mask_pixels[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(5))

    result = cell.copy()
    result.putalpha(ImageChops.multiply(alpha, mask))
    return result


def crop_subject(cell: Image.Image) -> Image.Image:
    cell = keep_largest_subject(cell)
    alpha = cell.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Expected a visible cat pose, found an empty cell")
    return cell.crop(bbox)


def find_subject_boxes(row_image: Image.Image) -> list[tuple[int, int, int, int]]:
    alpha = row_image.getchannel("A")
    visited: set[tuple[int, int]] = set()
    boxes: list[tuple[int, int, int, int]] = []

    for y in range(row_image.height):
        for x in range(row_image.width):
            if (x, y) in visited or alpha.getpixel((x, y)) <= 24:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            while stack:
                current = stack.pop()
                component.append(current)
                current_x, current_y = current
                for neighbor in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    next_x, next_y = neighbor
                    if (
                        next_x < 0
                        or next_y < 0
                        or next_x >= row_image.width
                        or next_y >= row_image.height
                        or neighbor in visited
                        or alpha.getpixel(neighbor) <= 24
                    ):
                        continue
                    visited.add(neighbor)
                    stack.append(neighbor)

            if len(component) < 100:
                continue
            xs = [point[0] for point in component]
            ys = [point[1] for point in component]
            boxes.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))

    return sorted(boxes, key=lambda box: box[0])


def normalize(subject: Image.Image, max_width: int, max_height: int) -> tuple[Image.Image, dict[str, object]]:
    scale = min(max_width / subject.width, max_height / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 4
    frame.alpha_composite(resized, (x, y))
    return frame, {"sprite_size": list(resized.size), "paste": [x, y]}


def make_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME, 0))
    return sheet


def make_preview(sheet: Image.Image) -> Image.Image:
    preview = Image.new("RGBA", sheet.size, (24, 24, 24, 255))
    preview.alpha_composite(sheet)
    return preview


def extract_action(row: ActionRow) -> list[dict[str, object]]:
    source = Image.open(SOURCE_DIR / row.source).convert("RGBA")
    row_image = source.crop((0, row.y_min, source.width, row.y_max))
    subject_boxes = find_subject_boxes(row_image)
    if len(subject_boxes) != row.frames:
        raise ValueError(
            f"{row.action}: expected {row.frames} connected poses, found {len(subject_boxes)}"
        )
    if row.action == "stretch":
        # The fourth generated pose exceeds the 96px contract by so much that
        # fitting it would make the cat visibly shrink. Hold the deepest usable
        # stretch for one extra frame instead.
        subject_boxes = [
            subject_boxes[0],
            subject_boxes[1],
            subject_boxes[2],
            subject_boxes[2],
            subject_boxes[4],
            subject_boxes[5],
        ]
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []

    action_dir = NORMALIZED_DIR / row.action
    action_dir.mkdir(parents=True, exist_ok=True)

    for index, (x_min, local_y_min, x_max, local_y_max) in enumerate(subject_boxes):
        padding = 4
        crop_box = (
            max(0, x_min - padding),
            max(0, local_y_min - padding),
            min(row_image.width, x_max + padding),
            min(row_image.height, local_y_max + padding),
        )
        cell = row_image.crop(crop_box)
        subject = crop_subject(cell)
        frame, info = normalize(subject, row.max_width, row.max_height)
        frames.append(frame)
        frame.save(action_dir / f"{row.action}-{index + 1:02d}.png")
        metadata.append(
            {
                "frame": index + 1,
                "source_box": [
                    crop_box[0],
                    crop_box[1] + row.y_min,
                    crop_box[2],
                    crop_box[3] + row.y_min,
                ],
                **info,
            }
        )

    sheet = make_sheet(frames)
    sheet.save(SHEET_DIR / f"{row.action}.png")
    make_preview(sheet).save(SHEET_DIR / f"{row.action}-preview.png")
    return metadata


def main() -> None:
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)
    SHEET_DIR.mkdir(parents=True, exist_ok=True)

    metadata = {row.action: extract_action(row) for row in ACTION_ROWS}
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote {len(ACTION_ROWS)} quality-slice sheets to {SHEET_DIR}")


if __name__ == "__main__":
    main()
