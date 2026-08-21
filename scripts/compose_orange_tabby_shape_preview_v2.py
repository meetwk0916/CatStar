#!/usr/bin/env python3
"""Normalize the approved big-ginger ten-action prototype into 96px sheets."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict
from pathlib import Path

from PIL import Image, ImageDraw

from cat_cross_action_scale import (
    ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY,
    require_stationary_walk_scale,
)
from compose_product_cat_daily_life_v1 import remove_chroma_key
import compose_product_cat_quality_slice_v11 as quality
from compose_product_cat_quality_slice_v11 import ActionRow


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "artifacts/art/candidates/active/product-cat-orange-tabby-preview-v2"
SOURCE_DIR = OUT_DIR / "sources"
ALPHA_DIR = OUT_DIR / "alpha"
NORMALIZED_DIR = OUT_DIR / "normalized-96"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
FRAME = 96

ACTION_ROWS = (
    ActionRow("idle", "idle-source-alpha.png", 4, 90, 84),
    ActionRow("sit", "sit-source-alpha.png", 4, 82, 84),
    ActionRow("walk", "walk-source-alpha.png", 8, 90, 84),
    ActionRow("jump", "jump-source-alpha.png", 6, 90, 78),
    ActionRow("eat", "eat-source-alpha.png", 6, 90, 84),
    ActionRow("lie", "lie-source-alpha.png", 4, 90, 68),
    ActionRow("sleep", "sleep-source-alpha.png", 4, 90, 62),
    ActionRow("groom", "groom-source-alpha.png", 8, 82, 84),
    ActionRow("stretch", "stretch-source-alpha.png", 6, 92, 74),
    ActionRow("interact", "interact-source-alpha.png", 6, 90, 84),
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_action(row: ActionRow) -> list[dict[str, object]]:
    source = Image.open(ALPHA_DIR / row.source).convert("RGBA")
    subject_boxes = quality.find_subject_boxes(source)
    if len(subject_boxes) != row.frames:
        raise ValueError(
            f"{row.action}: expected {row.frames} connected poses, "
            f"found {len(subject_boxes)}"
        )

    subjects: list[Image.Image] = []
    crop_boxes: list[list[int]] = []
    for x_min, y_min, x_max, y_max in subject_boxes:
        crop_box = (
            max(0, x_min - 4),
            max(0, y_min - 4),
            min(source.width, x_max + 4),
            min(source.height, y_max + 4),
        )
        subjects.append(quality.crop_subject(source.crop(crop_box)))
        crop_boxes.append(list(crop_box))

    authority_poses = (
        ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY.normalize(row.action, subjects)
        if ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY.has_action(row.action)
        else None
    )
    shared_scale = (
        authority_poses[0].source_scale
        if authority_poses is not None
        else min(
            row.max_width / max(subject.width for subject in subjects),
            row.max_height / max(subject.height for subject in subjects),
        )
    )
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    action_dir = NORMALIZED_DIR / row.action
    action_dir.mkdir(parents=True, exist_ok=True)

    for index, subject in enumerate(subjects):
        if authority_poses is None:
            resized = subject.resize(
                (
                    max(1, round(subject.width * shared_scale)),
                    max(1, round(subject.height * shared_scale)),
                ),
                Image.Resampling.NEAREST,
            )
            frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
            paste = ((FRAME - resized.width) // 2, FRAME - resized.height - 4)
            frame.alpha_composite(resized, paste)
            sprite_size = resized.size
        else:
            pose = authority_poses[index]
            frame = pose.image
            paste = pose.paste
            sprite_size = pose.sprite_size
        frames.append(quality.harden_pixel_edges(frame))
        metadata.append(
            {
                "frame": index + 1,
                "source_box": crop_boxes[index],
                "sprite_size": list(sprite_size),
                "paste": list(paste),
                "shared_scale": shared_scale,
                "scale_authority": (
                    ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY.name
                    if authority_poses is not None
                    else None
                ),
            }
        )

    sheet = quality.quantize_pixel_palette(quality.make_sheet(frames))
    for index in range(row.frames):
        sheet.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME)).save(
            action_dir / f"{row.action}-{index + 1:02d}.png"
        )
    sheet.save(SHEET_DIR / f"{row.action}.png")
    quality.make_preview(sheet).save(SHEET_DIR / f"{row.action}-preview.png")
    return metadata


def make_contact_sheet() -> None:
    label_width = 56
    sheet = Image.new(
        "RGBA",
        (label_width + FRAME * 8, FRAME * len(ACTION_ROWS)),
        (24, 24, 24, 255),
    )
    draw = ImageDraw.Draw(sheet)
    for row_index, action_row in enumerate(ACTION_ROWS):
        row = Image.open(SHEET_DIR / f"{action_row.action}.png").convert("RGBA")
        y = row_index * FRAME
        draw.text((8, y + 40), action_row.action, fill=(235, 235, 235, 255))
        sheet.alpha_composite(row, (label_width, y))
    sheet.save(OUT_DIR / "contact-sheet.png")


def main() -> None:
    for directory in (ALPHA_DIR, NORMALIZED_DIR, SHEET_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    metadata: dict[str, object] = {
        "status": "internal ten-action appearance prototype",
        "identityAuthority": (
            "artifacts/art/production-briefs/orange-tabby-v1/"
            "approved-direction-prototype.png"
        ),
        "actions": {},
    }
    for row in ACTION_ROWS:
        source_path = SOURCE_DIR / f"{row.action}-source-chromakey.png"
        alpha_path = ALPHA_DIR / row.source
        remove_chroma_key(source_path, alpha_path)
        frames = extract_action(row)
        metadata["actions"][row.action] = {
            "contract": asdict(row),
            "source": source_path.relative_to(ROOT).as_posix(),
            "sourceSha256": sha256(source_path),
            "alpha": alpha_path.relative_to(ROOT).as_posix(),
            "sheet": (SHEET_DIR / f"{row.action}.png").relative_to(ROOT).as_posix(),
            "frames": frames,
        }

    make_contact_sheet()
    scale_ratios = {}
    for stationary_action, frame_count in (("idle", 4), ("sit", 4)):
        scale_ratios[stationary_action] = require_stationary_walk_scale(
            SHEET_DIR / f"{stationary_action}.png",
            frame_count,
            SHEET_DIR / "walk.png",
            8,
            stationary_action=stationary_action,
            label=ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY.name,
        )
    metadata["crossActionScaleAuthority"] = {
        "stationaryAction": "idle",
        "walkingAction": "walk",
        "measurement": "square root of median visible-pixel mass ratio",
        "minimumLinearScaleRatio": {"idle": 0.88, "sit": 0.86},
        "measuredLinearScaleRatio": scale_ratios,
        "registration": "bottom-center with 4px contact margin",
    }
    (OUT_DIR / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Wrote {len(ACTION_ROWS)} big-ginger prototype sheets to {SHEET_DIR}")


if __name__ == "__main__":
    main()
