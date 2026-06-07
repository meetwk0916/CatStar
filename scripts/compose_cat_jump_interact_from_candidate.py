#!/usr/bin/env python3
"""Compose improved CatStar jump/interact sheets from dedicated key poses."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


FRAME = 96
POSE_DIR = Path("docs/art/candidates/cat-jump-interact-keyframes/normalized-96")
OUT_DIR = Path("docs/art/candidates/cat-jump-interact-keyframes/sprite-sheets-96")


def load_pose(index: int) -> Image.Image:
    return Image.open(POSE_DIR / f"pose-{index:02d}.png").convert("RGBA")


def crop_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return image
    return image.crop(bbox)


def resize_subject(image: Image.Image, scale_x: float = 1.0, scale_y: float = 1.0) -> Image.Image:
    subject = crop_alpha(image)
    size = (
        max(1, round(subject.size[0] * scale_x)),
        max(1, round(subject.size[1] * scale_y)),
    )
    return subject.resize(size, Image.Resampling.LANCZOS)


def place(subject: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    subject = crop_alpha(subject)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - subject.size[0]) // 2 + dx
    y = FRAME - subject.size[1] - 6 + dy
    frame.alpha_composite(subject, (x, y))
    return frame


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

    jump_frames = [
        place(resize_subject(load_pose(1), 1.03, 0.96), 0, 1),
        place(resize_subject(load_pose(2), 1.00, 1.00), 0, -10),
        place(resize_subject(load_pose(3), 0.98, 0.98), 0, -22),
        place(resize_subject(load_pose(4), 1.00, 1.00), 0, -6),
        place(resize_subject(load_pose(5), 1.04, 0.94), 0, 1),
    ]
    interact_frames = [
        place(resize_subject(load_pose(8), 1.00, 1.00), 0, 0),
        place(resize_subject(load_pose(6), 1.00, 1.00), 0, 0),
        place(resize_subject(load_pose(7), 1.02, 1.00), 0, 0),
        place(resize_subject(load_pose(7), 1.00, 0.98), 0, 1),
        place(resize_subject(load_pose(8), 1.00, 1.00), 0, 0),
    ]

    actions = {"jump": jump_frames, "interact": interact_frames}
    for action, frames in actions.items():
        sheet(frames).save(OUT_DIR / f"{action}.png")

    preview = Image.new("RGBA", (FRAME * 5, FRAME * len(actions)), (0, 0, 0, 0))
    for row, action in enumerate(actions):
        preview.alpha_composite(Image.open(OUT_DIR / f"{action}.png").convert("RGBA"), (0, row * FRAME))
    preview.save(OUT_DIR / "jump-interact-preview.png")

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
        "note": "Dedicated jump/interact candidate assembled from generated key poses; still needs final hand cleanup.",
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote improved jump/interact candidates to {OUT_DIR}")


if __name__ == "__main__":
    main()
