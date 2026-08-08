#!/usr/bin/env python3
"""Normalize an approved-model CatStar idle candidate into one 96px sheet."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

import compose_product_cat_quality_slice_v11 as quality


FRAME = 96
FRAME_COUNT = 4
MAX_SUBJECT_WIDTH = 90
MAX_SUBJECT_HEIGHT = 84
CANDIDATE_DIRS = {
    "product-cat-idle-v1": Path("artifacts/art/candidates/archive/product-cat-idle-v1"),
    "product-cat-idle-v2": Path("artifacts/art/candidates/archive/product-cat-idle-v2"),
    "product-cat-idle-v3": Path("artifacts/art/candidates/active/product-cat-idle-v3"),
}


def normalize_subjects(subjects: list[Image.Image]) -> tuple[list[Image.Image], list[dict[str, object]]]:
    source_width = max(subject.width for subject in subjects)
    source_height = max(subject.height for subject in subjects)
    scale = min(MAX_SUBJECT_WIDTH / source_width, MAX_SUBJECT_HEIGHT / source_height)
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []

    for subject in subjects:
        resized = subject.resize(
            (
                max(1, round(subject.width * scale)),
                max(1, round(subject.height * scale)),
            ),
            Image.Resampling.NEAREST,
        )
        frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        x = (FRAME - resized.width) // 2
        y = FRAME - resized.height - 4
        frame.alpha_composite(resized, (x, y))
        frames.append(quality.harden_pixel_edges(frame))
        metadata.append({"sprite_size": list(resized.size), "paste": [x, y]})

    return frames, metadata


def compose(candidate: str) -> None:
    output_dir = CANDIDATE_DIRS[candidate]
    source_path = output_dir / "alpha/idle-source-alpha.png"
    normalized_dir = output_dir / "normalized-96/idle"
    sheet_dir = output_dir / "sprite-sheets-96"
    source = Image.open(source_path).convert("RGBA")
    subject_boxes = quality.find_subject_boxes(source)
    if len(subject_boxes) != FRAME_COUNT:
        raise ValueError(f"idle: expected {FRAME_COUNT} connected poses, found {len(subject_boxes)}")

    subjects: list[Image.Image] = []
    crop_boxes: list[list[int]] = []
    for x_min, y_min, x_max, y_max in subject_boxes:
        padding = 4
        crop_box = (
            max(0, x_min - padding),
            max(0, y_min - padding),
            min(source.width, x_max + padding),
            min(source.height, y_max + padding),
        )
        subjects.append(quality.crop_subject(source.crop(crop_box)))
        crop_boxes.append(list(crop_box))

    frames, frame_metadata = normalize_subjects(subjects)
    sheet = quality.quantize_pixel_palette(quality.make_sheet(frames))
    normalized_dir.mkdir(parents=True, exist_ok=True)
    sheet_dir.mkdir(parents=True, exist_ok=True)
    for index in range(FRAME_COUNT):
        sheet.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME)).save(
            normalized_dir / f"idle-{index + 1:02d}.png"
        )
    sheet.save(sheet_dir / "idle.png")
    quality.make_preview(sheet).save(sheet_dir / "idle-preview.png")
    metadata = [
        {"frame": index + 1, "source_box": crop_boxes[index], **frame_metadata[index]}
        for index in range(FRAME_COUNT)
    ]
    (output_dir / "metadata.json").write_text(json.dumps({"idle": metadata}, indent=2) + "\n")
    print(f"Wrote {FRAME_COUNT} idle frames to {sheet_dir}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--candidate",
        choices=tuple(CANDIDATE_DIRS),
        default="product-cat-idle-v3",
        help="idle candidate package to rebuild (default: product-cat-idle-v3)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    compose(parse_args().candidate)
