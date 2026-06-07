#!/usr/bin/env python3
"""Generate CatStar's default cat animation sprite sheets.

The assets intentionally follow docs/CAT_ANIMATION_SPEC.md:
- 96x96 transparent frames
- right-facing cat
- bottom-center anchor
- same gray/white character design across actions
- frame-by-frame pose changes rather than transforming one idle cutout
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Literal

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/assets/scenes/window-room/cat"
FRAME = 96

Action = Literal["idle", "walk", "jump", "sleep", "interact"]

COLORS = {
    "outline": (55, 47, 52, 255),
    "dark": (74, 73, 78, 255),
    "gray": (105, 105, 110, 255),
    "light_gray": (142, 139, 139, 255),
    "white": (246, 238, 224, 255),
    "warm_light": (255, 214, 177, 255),
    "cool_light": (184, 200, 222, 255),
    "pink": (231, 144, 137, 255),
    "amber": (232, 179, 88, 255),
    "black": (34, 31, 34, 255),
}


@dataclass(frozen=True)
class Pose:
    body_x: int = 43
    body_y: int = 55
    body_w: int = 34
    body_h: int = 27
    head_x: int = 67
    head_y: int = 43
    head_w: int = 26
    head_h: int = 25
    tail: tuple[tuple[int, int], ...] = ((35, 59), (25, 54), (17, 58), (12, 66))
    tail_tip: tuple[int, int, int, int] = (10, 63, 17, 72)
    ear_lift: int = 0
    blink: bool = False
    eye_shift: int = 0
    mouth: str = "neutral"
    leg_offsets: tuple[int, int, int, int] = (0, 0, 0, 0)
    paw_lift: tuple[int, int, int, int] = (0, 0, 0, 0)
    back_arch: int = 0
    chest_shift: int = 0


def new_frame() -> Image.Image:
    return Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))


def draw_poly(draw: ImageDraw.ImageDraw, points: Iterable[tuple[int, int]], fill: str) -> None:
    draw.polygon(list(points), fill=COLORS[fill])


def draw_tail(draw: ImageDraw.ImageDraw, pose: Pose) -> None:
    points = list(pose.tail)
    for width, color in [(9, "outline"), (6, "gray"), (3, "light_gray")]:
        draw.line(points, fill=COLORS[color], width=width, joint="curve")
    draw.ellipse(pose.tail_tip, fill=COLORS["outline"])
    inner_tip = (
        pose.tail_tip[0] + 2,
        pose.tail_tip[1] + 2,
        pose.tail_tip[2] - 1,
        pose.tail_tip[3] - 1,
    )
    draw.ellipse(inner_tip, fill=COLORS["gray"])

    # Stripes sit on the same tail path in every action.
    for x, y in points[1:3]:
        draw.rectangle((x - 2, y - 4, x + 1, y + 4), fill=COLORS["dark"])


def draw_body(draw: ImageDraw.ImageDraw, pose: Pose) -> None:
    bx, by, bw, bh = pose.body_x, pose.body_y + pose.back_arch, pose.body_w, pose.body_h
    draw.ellipse((bx - 4, by - 9, bx + bw + 5, by + bh + 5), fill=COLORS["outline"])
    draw.ellipse((bx, by - 6, bx + bw, by + bh), fill=COLORS["gray"])
    draw.ellipse((bx + 11, by + 2, bx + bw + 1, by + bh + 3), fill=COLORS["white"])
    draw.rectangle((bx + 4, by + 2, bx + 18, by + 9), fill=COLORS["light_gray"])
    draw.rectangle((bx + 11, by - 3, bx + 15, by + 20), fill=COLORS["dark"])
    draw.rectangle((bx + 21, by - 2, bx + 25, by + 18), fill=COLORS["dark"])
    draw.rectangle((bx + 28, by + 2, bx + 31, by + 22), fill=COLORS["dark"])
    draw.rectangle((bx + 21, by - 7, bx + 28, by - 4), fill=COLORS["warm_light"])
    draw.rectangle((bx + 1, by + 4, bx + 5, by + 11), fill=COLORS["cool_light"])


def draw_leg(draw: ImageDraw.ImageDraw, x: int, y: int, lift: int, front: bool, visible: bool = True) -> None:
    if not visible:
        return
    top = y - lift
    paw_y = 83 - lift
    color = "white" if front else "light_gray"
    draw.rectangle((x - 3, top, x + 4, paw_y), fill=COLORS["outline"])
    draw.rectangle((x - 1, top + 2, x + 3, paw_y), fill=COLORS[color])
    draw.rectangle((x - 4, paw_y - 1, x + 7, paw_y + 3), fill=COLORS["outline"])
    draw.rectangle((x - 2, paw_y, x + 6, paw_y + 2), fill=COLORS["white"])


def draw_legs(draw: ImageDraw.ImageDraw, pose: Pose) -> None:
    # Hind far, hind near, front far, front near.
    base_xs = [43, 53, 67, 76]
    base_ys = [66, 66, 62, 62]
    fronts = [False, False, True, True]
    for i, (x, y, front) in enumerate(zip(base_xs, base_ys, fronts)):
        draw_leg(draw, x + pose.leg_offsets[i], y, pose.paw_lift[i], front=front)


def draw_head(draw: ImageDraw.ImageDraw, pose: Pose) -> None:
    hx, hy, hw, hh = pose.head_x + pose.chest_shift, pose.head_y, pose.head_w, pose.head_h
    ear_up = pose.ear_lift
    draw_poly(draw, [(hx + 1, hy + 5), (hx + 7, hy - 10 - ear_up), (hx + 13, hy + 7)], "outline")
    draw_poly(draw, [(hx + 15, hy + 6), (hx + 23, hy - 7 - ear_up), (hx + 27, hy + 9)], "outline")
    draw_poly(draw, [(hx + 4, hy + 4), (hx + 8, hy - 5 - ear_up), (hx + 11, hy + 6)], "pink")
    draw_poly(draw, [(hx + 17, hy + 5), (hx + 22, hy - 3 - ear_up), (hx + 24, hy + 7)], "pink")

    draw.ellipse((hx - 2, hy, hx + hw, hy + hh), fill=COLORS["outline"])
    draw.ellipse((hx + 1, hy + 2, hx + hw - 2, hy + hh - 1), fill=COLORS["gray"])
    draw.pieslice((hx + 2, hy + 5, hx + hw - 1, hy + hh + 6), 45, 185, fill=COLORS["white"])
    draw.rectangle((hx + 2, hy + 5, hx + 10, hy + 10), fill=COLORS["light_gray"])
    draw.rectangle((hx + 10, hy + 3, hx + 13, hy + 17), fill=COLORS["dark"])
    draw.rectangle((hx + 17, hy + 4, hx + 20, hy + 16), fill=COLORS["dark"])

    eye_y = hy + 12
    if pose.blink:
      draw.rectangle((hx + 15 + pose.eye_shift, eye_y + 2, hx + 20 + pose.eye_shift, eye_y + 3), fill=COLORS["black"])
    else:
      draw.rectangle((hx + 15 + pose.eye_shift, eye_y, hx + 20 + pose.eye_shift, eye_y + 6), fill=COLORS["black"])
      draw.rectangle((hx + 16 + pose.eye_shift, eye_y + 1, hx + 19 + pose.eye_shift, eye_y + 5), fill=COLORS["amber"])
      draw.point((hx + 18 + pose.eye_shift, eye_y + 1), fill=COLORS["white"])

    draw.rectangle((hx + 23, hy + 17, hx + 26, hy + 20), fill=COLORS["pink"])
    if pose.mouth == "nuzzle":
        draw.rectangle((hx + 19, hy + 21, hx + 25, hy + 22), fill=COLORS["outline"])
    else:
        draw.point((hx + 22, hy + 21), fill=COLORS["outline"])

    # Whiskers, short enough to remain mobile-readable.
    draw.line((hx + 20, hy + 18, hx + 10, hy + 16), fill=COLORS["white"], width=1)
    draw.line((hx + 20, hy + 20, hx + 9, hy + 21), fill=COLORS["white"], width=1)


def draw_standing_cat(pose: Pose) -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img)
    draw_tail(draw, pose)
    draw_body(draw, pose)
    draw_legs(draw, pose)
    draw_head(draw, pose)
    return img


def draw_sleeping_cat(frame: int) -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img)
    breathe = 1 if frame in (1, 3) else 0
    twitch = frame == 3

    draw.ellipse((16, 58, 83, 86 + breathe), fill=COLORS["outline"])
    draw.ellipse((19, 56, 80, 82 + breathe), fill=COLORS["gray"])
    draw.ellipse((35, 61, 72, 82 + breathe), fill=COLORS["white"])
    draw.line([(72, 71), (84, 73), (88, 80)], fill=COLORS["outline"], width=8)
    draw.line([(72, 71), (83, 73), (86, 80)], fill=COLORS["dark"], width=5)
    draw.rectangle((49, 54, 55, 78), fill=COLORS["dark"])
    draw.rectangle((59, 56, 64, 78), fill=COLORS["dark"])

    hx, hy = 23, 52
    ear = -2 if twitch else 0
    draw_poly(draw, [(hx + 1, hy + 7), (hx + 9, hy - 6 + ear), (hx + 15, hy + 8)], "outline")
    draw_poly(draw, [(hx + 4, hy + 6), (hx + 9, hy - 1 + ear), (hx + 12, hy + 7)], "pink")
    draw.ellipse((hx - 3, hy, hx + 27, hy + 24), fill=COLORS["outline"])
    draw.ellipse((hx, hy + 2, hx + 24, hy + 22), fill=COLORS["gray"])
    draw.pieslice((hx, hy + 7, hx + 25, hy + 25), 20, 185, fill=COLORS["white"])
    draw.rectangle((hx + 8, hy + 13, hx + 18, hy + 14), fill=COLORS["black"])
    draw.rectangle((hx + 22, hy + 17, hx + 25, hy + 19), fill=COLORS["pink"])
    return img


def make_sheet(frames: list[Image.Image], name: str) -> None:
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME, 0))
    sheet.save(OUT_DIR / f"{name}.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    idle = [
        Pose(),
        Pose(body_y=54, head_y=42, tail=((35, 58), (25, 53), (17, 58), (12, 66)), tail_tip=(10, 63, 17, 72)),
        Pose(),
        Pose(blink=True, tail=((35, 59), (25, 56), (17, 60), (12, 67)), tail_tip=(10, 64, 17, 73)),
    ]

    walk = [
        Pose(body_y=56, head_y=44, tail=((35, 60), (25, 54), (17, 57), (12, 64)), leg_offsets=(-1, 0, 1, 0), paw_lift=(2, 0, 8, 0)),
        Pose(body_y=55, head_y=43, tail=((35, 59), (25, 53), (17, 58), (12, 66)), leg_offsets=(-2, 1, 3, -1), paw_lift=(0, 2, 5, 0)),
        Pose(body_y=54, head_y=42, tail=((35, 58), (25, 55), (18, 61), (13, 68)), leg_offsets=(-1, 2, 4, -2), paw_lift=(0, 5, 1, 0)),
        Pose(body_y=55, head_y=43, tail=((35, 59), (24, 57), (17, 62), (11, 69)), leg_offsets=(1, 3, 2, -3), paw_lift=(0, 8, 0, 3)),
        Pose(body_y=56, head_y=44, tail=((35, 60), (25, 56), (18, 59), (12, 66)), leg_offsets=(2, -1, 0, 1), paw_lift=(8, 0, 0, 2)),
        Pose(body_y=55, head_y=43, tail=((35, 59), (26, 54), (19, 57), (14, 64)), leg_offsets=(3, -2, -1, 3), paw_lift=(5, 0, 2, 0)),
        Pose(body_y=54, head_y=42, tail=((35, 58), (27, 55), (20, 61), (15, 68)), leg_offsets=(2, -3, -2, 4), paw_lift=(1, 0, 5, 0)),
        Pose(body_y=55, head_y=43, tail=((35, 59), (26, 57), (19, 62), (13, 69)), leg_offsets=(0, -1, -3, 2), paw_lift=(0, 3, 8, 0)),
    ]

    jump = [
        Pose(body_y=60, body_h=23, head_y=48, tail=((35, 63), (24, 62), (15, 66), (10, 72)), leg_offsets=(0, 0, 0, 0), paw_lift=(0, 0, 0, 0), back_arch=2),
        Pose(body_y=52, body_h=30, head_y=40, tail=((35, 53), (25, 47), (17, 49), (12, 56)), leg_offsets=(-2, 2, 3, 4), paw_lift=(10, 8, 12, 8), back_arch=-1),
        Pose(body_y=45, body_h=32, head_y=35, tail=((35, 44), (25, 40), (17, 43), (12, 50)), leg_offsets=(-1, 2, 2, 3), paw_lift=(18, 16, 18, 15), back_arch=-2),
        Pose(body_y=43, body_h=31, head_y=34, tail=((35, 43), (25, 45), (17, 50), (12, 57)), leg_offsets=(0, 0, 1, 2), paw_lift=(18, 18, 18, 17), back_arch=-2),
        Pose(body_y=50, body_h=29, head_y=39, tail=((35, 50), (25, 53), (17, 59), (12, 66)), leg_offsets=(1, -1, 4, -1), paw_lift=(10, 8, 8, 6), back_arch=0),
        Pose(body_y=59, body_h=23, head_y=47, tail=((35, 62), (25, 59), (17, 63), (12, 70)), leg_offsets=(0, 0, 0, 0), paw_lift=(0, 0, 0, 0), back_arch=2),
    ]

    interact = [
        Pose(ear_lift=1, eye_shift=-1),
        Pose(body_x=45, head_x=69, head_y=42, tail=((35, 58), (25, 52), (18, 54), (13, 61)), ear_lift=2, eye_shift=-1, chest_shift=1),
        Pose(body_x=47, head_x=71, head_y=43, tail=((35, 58), (27, 51), (20, 52), (15, 58)), blink=True, mouth="nuzzle", chest_shift=2),
        Pose(body_x=46, head_x=70, head_y=42, tail=((35, 58), (25, 53), (17, 58), (12, 66)), blink=True, mouth="nuzzle", chest_shift=1),
        Pose(body_x=44, head_x=68, head_y=43, tail=((35, 59), (25, 56), (17, 60), (12, 67)), ear_lift=1),
        Pose(),
    ]

    make_sheet([draw_standing_cat(pose) for pose in idle], "idle")
    make_sheet([draw_standing_cat(pose) for pose in walk], "walk")
    make_sheet([draw_standing_cat(pose) for pose in jump], "jump")
    make_sheet([draw_sleeping_cat(i) for i in range(4)], "sleep")
    make_sheet([draw_standing_cat(pose) for pose in interact], "interact")

    animations = {
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "anchor": "bottom-center",
        "actions": {
            "idle": {"file": "idle.png", "frames": 4, "frameRate": 3, "repeat": -1},
            "walk": {"file": "walk.png", "frames": 8, "frameRate": 8, "repeat": -1},
            "jump": {"file": "jump.png", "frames": 6, "frameRate": 7, "repeat": 0},
            "sleep": {"file": "sleep.png", "frames": 4, "frameRate": 2, "repeat": -1},
            "interact": {"file": "interact.png", "frames": 6, "frameRate": 10, "repeat": 0},
        },
        "note": "Spec-compliant generated sheets: consistent character lock, 96x96 frames, bottom-center anchor, right-facing default.",
    }
    (OUT_DIR / "cat.animations.json").write_text(json.dumps(animations, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
