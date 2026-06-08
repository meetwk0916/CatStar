#!/usr/bin/env python3
"""Compose CatStar's improved walk sheet from dedicated walk key poses."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


FRAME = 96
POSE_DIR = Path("docs/art/candidates/cat-walk-cycle-keyframes/normalized-96")
OUT_DIR = Path("docs/art/candidates/cat-walk-cycle-keyframes/sprite-sheets-96")


def visible_size(image: Image.Image) -> tuple[int, int]:
    bbox = image.getbbox()
    if bbox is None:
        return (0, 0)
    return (bbox[2] - bbox[0], bbox[3] - bbox[1])


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = [Image.open(POSE_DIR / f"pose-{index:02d}.png").convert("RGBA") for index in range(1, 9)]
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME, 0))
    sheet.save(OUT_DIR / "walk.png")

    metadata = {
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "anchor": "bottom-center",
        "source": str(POSE_DIR),
        "actions": {
            "walk": {
                "file": "walk.png",
                "frames": len(frames),
                "visibleSizes": [visible_size(frame) for frame in frames],
            }
        },
        "note": "Dedicated 8-frame walk candidate assembled from generated key poses; still needs final foot-contact cleanup.",
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote improved walk candidate to {OUT_DIR}")


if __name__ == "__main__":
    main()
