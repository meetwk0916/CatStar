#!/usr/bin/env python3
"""Compose product-action v2 sheets from the most consistent current frames."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image


FRAME = 96
RUNTIME_DIR = Path("public/assets/scenes/window-room/cat")
OUT_DIR = Path("docs/art/candidates/product-cat-actions-v2")
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
SOURCE_DIR = OUT_DIR / "sources"


def load_action_frame(action: str, index: int) -> Image.Image:
    source = Image.open(RUNTIME_DIR / f"{action}.png").convert("RGBA")
    return source.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME))


def crop_alpha(source: Image.Image) -> Image.Image:
    bbox = source.getbbox()
    if bbox is None:
        return source
    return source.crop(bbox)


def place(subject: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    subject = crop_alpha(subject)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - subject.width) // 2 + dx
    y = FRAME - subject.height - 6 + dy
    frame.alpha_composite(subject, (x, y))
    return frame


def resize_subject(source: Image.Image, scale_x: float = 1.0, scale_y: float = 1.0) -> Image.Image:
    subject = crop_alpha(source)
    size = (
        max(1, round(subject.width * scale_x)),
        max(1, round(subject.height * scale_y)),
    )
    return subject.resize(size, Image.Resampling.LANCZOS)


def rotate_subject(source: Image.Image, degrees: float) -> Image.Image:
    subject = crop_alpha(source)
    return subject.rotate(degrees, expand=True, resample=Image.Resampling.BICUBIC)


def sheet(frames: list[Image.Image]) -> Image.Image:
    output = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        output.alpha_composite(frame, (index * FRAME, 0))
    return output


def visible_bbox(frame: Image.Image) -> tuple[int, int, int, int] | None:
    return frame.getbbox()


def copy_runtime_source(action: str) -> None:
    shutil.copy2(RUNTIME_DIR / f"{action}.png", SOURCE_DIR / f"{action}-runtime-source.png")


def main() -> None:
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    for action in ["idle", "walk", "eat"]:
        copy_runtime_source(action)

    idle_1 = load_action_frame("idle", 0)
    idle_2 = load_action_frame("idle", 1)
    walk_2 = load_action_frame("walk", 1)
    walk_4 = load_action_frame("walk", 3)
    walk_6 = load_action_frame("walk", 5)
    eat_2 = load_action_frame("eat", 1)
    eat_3 = load_action_frame("eat", 2)

    jump_frames = [
        place(resize_subject(eat_3, 1.00, 0.98), 0, 1),
        place(rotate_subject(resize_subject(walk_2, 0.99, 1.00), 7), 0, 0),
        place(rotate_subject(resize_subject(walk_4, 0.98, 0.99), 11), 0, -1),
        place(rotate_subject(resize_subject(walk_6, 0.99, 1.00), -4), 0, 0),
        place(resize_subject(eat_2, 1.01, 0.98), 0, 1),
    ]

    interact_frames = [
        place(idle_1, 0, 0),
        place(resize_subject(idle_2, 1.00, 1.01), 1, -1),
        place(rotate_subject(resize_subject(idle_1, 1.00, 1.00), -3), 1, 0),
        place(rotate_subject(resize_subject(idle_2, 1.00, 1.00), 3), -1, 0),
        place(idle_1, 0, 0),
    ]

    actions = {
        "jump": jump_frames,
        "interact": interact_frames,
    }
    for action, frames in actions.items():
        sheet(frames).save(SHEET_DIR / f"{action}.png")

    preview = Image.new("RGBA", (FRAME * 5, FRAME * 2), (24, 24, 24, 255))
    preview.alpha_composite(sheet(jump_frames), (0, 0))
    preview.alpha_composite(sheet(interact_frames), (0, FRAME))
    preview.save(SHEET_DIR / "jump-interact-preview.png")

    metadata = {
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "actions": {
            action: {
                "file": f"{action}.png",
                "frames": len(frames),
                "visibleBboxes": [visible_bbox(frame) for frame in frames],
            }
            for action, frames in actions.items()
        },
        "source": "Derived from runtime idle/walk/eat product-action frames to preserve cat identity while image generation is unavailable.",
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")

    (OUT_DIR / "README.md").write_text(
        "# Product Cat Actions v2\n\n"
        "Deterministic jump/interact cleanup derived from the current most consistent runtime frames.\n\n"
        "This candidate reduces the old jump size popping and replaces the distorted interact frames with a subtle idle-based response.\n"
        "It is a stabilization pass, not a final hand-authored animation pass.\n",
    )
    print(f"Wrote {SHEET_DIR}")


if __name__ == "__main__":
    main()
