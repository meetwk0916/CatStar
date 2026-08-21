#!/usr/bin/env python3
"""Normalize the approved CatStar v11 quality-slice sources into 96px sheets."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops

from artifact_paths import ARTIFACTS_ART_ROOT
from cat_cross_action_scale import CrossActionScaleAuthority


FRAME = 96
OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-quality-slice-v11"
SOURCE_DIR = OUT_DIR / "alpha"
NORMALIZED_DIR = OUT_DIR / "normalized-96"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"


@dataclass(frozen=True)
class ActionRow:
    action: str
    source: str
    frames: int
    max_width: int
    max_height: int


ACTION_ROWS = (
    ActionRow("sit", "sit-source-alpha.png", 4, 82, 84),
    ActionRow("walk", "walk-source-alpha.png", 8, 88, 70),
    ActionRow("interact", "interact-source-alpha.png", 6, 86, 84),
)

V11_SCALE_AUTHORITY = CrossActionScaleAuthority(
    name="rounded-short-haired v11 candidate",
    source_scale_by_action={
        "idle": 0.22277227722772278,
        "sit": 0.20240963855421687,
        "walk": 0.38461538461538464,
        "interact": 0.26875,
    },
)


def connected_components(alpha: Image.Image) -> list[list[tuple[int, int]]]:
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(alpha.height):
        for x in range(alpha.width):
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
                        or next_x >= alpha.width
                        or next_y >= alpha.height
                        or neighbor in visited
                        or alpha.getpixel(neighbor) <= 24
                    ):
                        continue
                    visited.add(neighbor)
                    stack.append(neighbor)
            components.append(component)

    return components


def keep_largest_subject(cell: Image.Image) -> Image.Image:
    alpha = cell.getchannel("A")
    components = connected_components(alpha)

    if not components:
        raise ValueError("Expected a visible cat pose, found an empty cell")

    mask = Image.new("L", cell.size, 0)
    mask_pixels = mask.load()
    for x, y in max(components, key=len):
        mask_pixels[x, y] = 255
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
    boxes: list[tuple[int, int, int, int]] = []

    for component in connected_components(alpha):
        if len(component) < 100:
            continue
        xs = [point[0] for point in component]
        ys = [point[1] for point in component]
        boxes.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))

    return sorted(boxes, key=lambda box: box[0])


def harden_pixel_edges(frame: Image.Image) -> Image.Image:
    cleaned = keep_largest_subject(frame)
    alpha = cleaned.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    result = cleaned.copy()
    result.putalpha(alpha)
    return keep_largest_subject(result)


def quantize_pixel_palette(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    rgb = Image.new("RGB", image.size, (0, 255, 0))
    rgb.paste(image.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(
        colors=64,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = quantized.convert("RGBA")
    result.putalpha(alpha)
    return result


def normalize(subject: Image.Image, max_width: int, max_height: int) -> tuple[Image.Image, dict[str, object]]:
    scale = min(max_width / subject.width, max_height / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.NEAREST,
    )

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 4
    frame.alpha_composite(resized, (x, y))
    return harden_pixel_edges(frame), {"sprite_size": list(resized.size), "paste": [x, y]}


def make_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME, 0))
    return sheet


def make_preview(sheet: Image.Image) -> Image.Image:
    preview = Image.new("RGBA", sheet.size, (24, 24, 24, 255))
    preview.alpha_composite(sheet)
    return preview


def extract_action(
    row: ActionRow,
    source_dir: Path,
    normalized_dir: Path,
    sheet_dir: Path,
    scale_authority: CrossActionScaleAuthority,
) -> list[dict[str, object]]:
    source = Image.open(source_dir / row.source).convert("RGBA")
    subject_boxes = find_subject_boxes(source)
    if len(subject_boxes) != row.frames:
        raise ValueError(
            f"{row.action}: expected {row.frames} connected poses, found {len(subject_boxes)}"
        )
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []

    action_dir = normalized_dir / row.action
    action_dir.mkdir(parents=True, exist_ok=True)

    subjects: list[Image.Image] = []
    crop_boxes: list[list[int]] = []
    for x_min, local_y_min, x_max, local_y_max in subject_boxes:
        padding = 4
        crop_box = (
            max(0, x_min - padding),
            max(0, local_y_min - padding),
            min(source.width, x_max + padding),
            min(source.height, local_y_max + padding),
        )
        cell = source.crop(crop_box)
        subjects.append(crop_subject(cell))
        crop_boxes.append(list(crop_box))

    authority_poses = (
        scale_authority.normalize(row.action, subjects)
        if scale_authority.has_action(row.action)
        else None
    )
    for index, subject in enumerate(subjects):
        if authority_poses is None:
            frame, info = normalize(subject, row.max_width, row.max_height)
        else:
            pose = authority_poses[index]
            frame = harden_pixel_edges(pose.image)
            info = {
                "sprite_size": list(pose.sprite_size),
                "paste": list(pose.paste),
                "source_scale": pose.source_scale,
                "scale_authority": scale_authority.name,
            }
        frames.append(frame)
        metadata.append(
            {
                "frame": index + 1,
                "source_box": crop_boxes[index],
                **info,
            }
        )

    sheet = quantize_pixel_palette(make_sheet(frames))
    for index in range(row.frames):
        sheet.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME)).save(
            action_dir / f"{row.action}-{index + 1:02d}.png"
        )
    sheet.save(sheet_dir / f"{row.action}.png")
    make_preview(sheet).save(sheet_dir / f"{row.action}-preview.png")
    return metadata


def compose(
    output_dir: Path,
    scale_authority: CrossActionScaleAuthority,
    action_rows: tuple[ActionRow, ...] = ACTION_ROWS,
) -> None:
    source_dir = output_dir / "alpha"
    normalized_dir = output_dir / "normalized-96"
    sheet_dir = output_dir / "sprite-sheets-96"
    normalized_dir.mkdir(parents=True, exist_ok=True)
    sheet_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        row.action: extract_action(
            row,
            source_dir,
            normalized_dir,
            sheet_dir,
            scale_authority,
        )
        for row in action_rows
    }
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote {len(action_rows)} quality-slice sheets to {sheet_dir}")


def main() -> None:
    compose(OUT_DIR, V11_SCALE_AUTHORITY)


if __name__ == "__main__":
    main()
