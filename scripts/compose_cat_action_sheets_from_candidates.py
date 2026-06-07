#!/usr/bin/env python3
"""Compose CatStar cat action sheet candidates from art-directed pose frames.

This script does not draw the cat. It only assembles existing 96x96 pose
candidates into reviewable sprite sheets, with small offsets for breathing and
impact timing. Output stays under docs/art/candidates/ until manually approved.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


FRAME = 96
POSE_DIR = Path("docs/art/candidates/cat-action-keyframes/normalized-96")
OUT_DIR = Path("docs/art/candidates/cat-action-keyframes/sprite-sheets-96")


def load_pose(name: str) -> Image.Image:
    return Image.open(POSE_DIR / name).convert("RGBA")


def offset_frame(source: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    frame.alpha_composite(source, (dx, dy))
    return frame


def crop_alpha(source: Image.Image) -> Image.Image:
    bbox = source.getbbox()
    if bbox is None:
        return source
    return source.crop(bbox)


def place_bottom_center(subject: Image.Image, y_offset: int = 0) -> Image.Image:
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    subject = crop_alpha(subject)
    x = (FRAME - subject.size[0]) // 2
    y = FRAME - subject.size[1] - 6 + y_offset
    frame.alpha_composite(subject, (x, y))
    return frame


def resize_subject(source: Image.Image, scale_x: float = 1.0, scale_y: float = 1.0) -> Image.Image:
    subject = crop_alpha(source)
    width = max(1, round(subject.size[0] * scale_x))
    height = max(1, round(subject.size[1] * scale_y))
    return subject.resize((width, height), Image.Resampling.LANCZOS)


def sheet(frames: list[Image.Image]) -> Image.Image:
    output = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        output.alpha_composite(frame, (index * FRAME, 0))
    return output


def visible_size(image: Image.Image) -> tuple[int, int]:
    bbox = image.getbbox()
    if bbox is None:
        return (0, 0)
    return (bbox[2] - bbox[0], bbox[3] - bbox[1])


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stand = load_pose("pose-01.png")
    walk_a = load_pose("pose-02.png")
    walk_b = load_pose("pose-03.png")
    crouch = load_pose("pose-04.png")
    land = load_pose("pose-05.png")
    sleep = load_pose("pose-06.png")

    idle_frames = [
        place_bottom_center(resize_subject(stand, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(stand, 1.00, 1.015), -1),
        place_bottom_center(resize_subject(stand, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(stand, 0.995, 0.995), 0),
    ]

    walk_frames = [
        offset_frame(walk_a, -1, 0),
        offset_frame(walk_a, 0, -1),
        offset_frame(walk_b, 1, 0),
        offset_frame(walk_b, 0, -1),
        offset_frame(walk_a, 1, 0),
        offset_frame(walk_b, -1, 0),
    ]

    jump_frames = [
        place_bottom_center(resize_subject(crouch, 1.03, 0.95), 1),
        place_bottom_center(resize_subject(land, 0.98, 1.05), -12),
        place_bottom_center(resize_subject(land, 0.97, 1.02), -23),
        place_bottom_center(resize_subject(crouch, 1.04, 0.93), 1),
    ]

    sleep_frames = [
        place_bottom_center(resize_subject(sleep, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(sleep, 1.01, 1.015), -1),
        place_bottom_center(resize_subject(sleep, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(sleep, 0.995, 0.995), 0),
    ]

    interact_frames = [
        place_bottom_center(resize_subject(stand, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(land, 0.98, 1.02), 0),
        place_bottom_center(resize_subject(land, 1.00, 1.00), 0),
        place_bottom_center(resize_subject(crouch, 1.02, 0.96), 1),
        place_bottom_center(resize_subject(stand, 1.00, 1.00), 0),
    ]

    actions = {
        "idle": idle_frames,
        "walk": walk_frames,
        "jump": jump_frames,
        "sleep": sleep_frames,
        "interact": interact_frames,
    }
    for action, frames in actions.items():
        sheet(frames).save(OUT_DIR / f"{action}.png")

    contact = Image.new("RGBA", (FRAME * 6, FRAME * len(actions)), (0, 0, 0, 0))
    for row, action in enumerate(actions):
        action_sheet = Image.open(OUT_DIR / f"{action}.png").convert("RGBA")
        contact.alpha_composite(action_sheet, (0, row * FRAME))
    contact.save(OUT_DIR / "all-actions-preview.png")

    metadata = {
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "anchor": "bottom-center",
        "source": str(POSE_DIR),
        "actions": {
            action: {
                "file": f"{action}.png",
                "frames": len(frames),
                "visibleSizes": [visible_size(frame) for frame in frames],
            }
            for action, frames in actions.items()
        },
        "note": "Art-directed candidate assembled from pose frames; review before replacing runtime assets.",
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote action sheet candidates to {OUT_DIR}")


if __name__ == "__main__":
    main()
