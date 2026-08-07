#!/usr/bin/env python3
"""Validate CatStar runtime cat action sheets.

The checks are intentionally structural. They do not claim that generated art is
final, but they catch common product-asset regressions: wrong sheet dimensions,
empty frames, floating baselines, accidental pixel islands, and extreme frame
mass changes.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path

from PIL import Image


FRAME = 96
ALPHA_THRESHOLD = 24
MIN_FRAME_AREA = 2_000
MAX_SMALL_COMPONENT_AREA = 64
MAX_BOTTOM_RANGE = 6
MAX_AREA_RANGE_RATIO = 0.28
MAX_REFINED_PIXEL_COLORS = 128
REFINED_PIXEL_ACTIONS = {"sit", "walk", "interact"}
SCENE_ASSET_DIR = Path("public/assets/scenes/window-room")
ASSET_DIR = SCENE_ASSET_DIR / "cat"
SPEC_PATH = ASSET_DIR / "cat.animations.json"
CAT_PRESETS = (
    "gray-white-tabby",
    "orange-tabby",
    "solid-black",
    "solid-white",
    "calico",
    "tuxedo",
)
REQUIRED_ACTIONS = {
    "idle",
    "sit",
    "walk",
    "jump",
    "sleep",
    "interact",
    "eat",
    "lie",
    "groom",
    "stretch",
}


def validate_environment_assets() -> list[str]:
    failures: list[str] = []
    background_path = SCENE_ASSET_DIR / "background.png"
    leaf_path = SCENE_ASSET_DIR / "plant-leaf.png"

    if not background_path.exists():
        failures.append(f"missing scene background {background_path}")
    elif Image.open(background_path).size != (640, 360):
        failures.append("background.png: expected 640x360 runtime composition")

    if not leaf_path.exists():
        failures.append(f"missing plant interaction leaf {leaf_path}")
        return failures

    leaf = Image.open(leaf_path).convert("RGBA")
    if leaf.size != (47, 24):
        failures.append(f"plant-leaf.png: expected 47x24, got {leaf.size}")
    alpha = leaf.getchannel("A")
    if alpha.getbbox() is None:
        failures.append("plant-leaf.png: leaf is fully transparent")
    if any(alpha.getpixel(corner) > 0 for corner in ((0, 0), (46, 0), (0, 23), (46, 23))):
        failures.append("plant-leaf.png: expected transparent corners")
    return failures


def iter_component_sizes(alpha: Image.Image) -> Iterable[int]:
    visited: set[tuple[int, int]] = set()

    for y in range(alpha.height):
        for x in range(alpha.width):
            if (x, y) in visited or alpha.getpixel((x, y)) <= ALPHA_THRESHOLD:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            size = 0

            while stack:
                current_x, current_y = stack.pop()
                size += 1
                for next_x, next_y in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    if (
                        next_x < 0
                        or next_y < 0
                        or next_x >= alpha.width
                        or next_y >= alpha.height
                        or (next_x, next_y) in visited
                        or alpha.getpixel((next_x, next_y)) <= ALPHA_THRESHOLD
                    ):
                        continue

                    visited.add((next_x, next_y))
                    stack.append((next_x, next_y))

            yield size


def visible_area(alpha: Image.Image) -> int:
    return sum(alpha.histogram()[ALPHA_THRESHOLD + 1 :])


def validate_action(preset: str, action: str, config: dict[str, object]) -> list[str]:
    failures: list[str] = []
    frame_count = int(config["frames"])
    label = f"{preset}/{action}"
    image_path = ASSET_DIR / preset / str(config["file"])
    expected_size = (FRAME * frame_count, FRAME)

    if not image_path.exists():
        return [f"{label}: missing sheet {image_path}"]

    image = Image.open(image_path).convert("RGBA")
    if image.size != expected_size:
        failures.append(f"{label}: expected {expected_size}, got {image.size}")
        return failures

    if action in REFINED_PIXEL_ACTIONS:
        alpha_values = set(image.getchannel("A").get_flattened_data())
        if not alpha_values.issubset({0, 255}):
            failures.append(f"{label}: refined pixel sheet must use binary alpha")
        opaque_colors = {
            pixel[:3]
            for pixel in image.get_flattened_data()
            if pixel[3] == 255
        }
        if len(opaque_colors) > MAX_REFINED_PIXEL_COLORS:
            failures.append(
                f"{label}: refined pixel sheet uses {len(opaque_colors)} colors; "
                f"maximum is {MAX_REFINED_PIXEL_COLORS}"
            )

    areas: list[int] = []
    bottoms: list[int] = []
    frame_payloads: list[bytes] = []

    for frame_index in range(frame_count):
        frame = image.crop((frame_index * FRAME, 0, (frame_index + 1) * FRAME, FRAME))
        frame_payloads.append(frame.tobytes())
        alpha = frame.getchannel("A")
        bbox = alpha.getbbox()
        if bbox is None:
            failures.append(f"{label}[{frame_index}]: empty frame")
            continue

        area = visible_area(alpha)
        components = sorted(iter_component_sizes(alpha), reverse=True)
        small_island_area = sum(size for size in components[1:] if size < MAX_SMALL_COMPONENT_AREA)

        if area < MIN_FRAME_AREA:
            failures.append(f"{label}[{frame_index}]: visible area too small: {area}")
        if small_island_area:
            failures.append(f"{label}[{frame_index}]: small detached pixel islands: {small_island_area}px")

        areas.append(area)
        bottoms.append(bbox[3])

    if areas:
        min_area = min(areas)
        max_area = max(areas)
        area_range_ratio = (max_area - min_area) / max_area
        if area_range_ratio > MAX_AREA_RANGE_RATIO:
            failures.append(f"{label}: frame area range too high: {area_range_ratio:.2%}")

    if bottoms and max(bottoms) - min(bottoms) > MAX_BOTTOM_RANGE:
        failures.append(f"{label}: baseline range too high: {max(bottoms) - min(bottoms)}px")
    if action in REFINED_PIXEL_ACTIONS and len(set(frame_payloads)) != frame_count:
        failures.append(f"{label}: refined pixel action must not contain duplicate frames")

    return failures


def validate_distinct_stationary_actions(preset: str, spec: dict[str, object]) -> list[str]:
    idle_config = spec["actions"]["idle"]
    sit_config = spec["actions"]["sit"]
    idle = Image.open(ASSET_DIR / preset / str(idle_config["file"])).convert("RGBA")
    sit = Image.open(ASSET_DIR / preset / str(sit_config["file"])).convert("RGBA")
    if idle.tobytes() == sit.tobytes():
        return [f"{preset}: idle and sit must use distinct visible motion sheets"]
    return []


def main() -> None:
    spec = json.loads(SPEC_PATH.read_text())
    failures = validate_environment_assets()

    if spec.get("frameWidth") != FRAME or spec.get("frameHeight") != FRAME:
        failures.append(f"cat.animations.json: expected {FRAME}x{FRAME} frame contract")
    if set(spec.get("actions", {})) != REQUIRED_ACTIONS:
        failures.append(
            "cat.animations.json: expected exactly ten actions: "
            + ", ".join(sorted(REQUIRED_ACTIONS))
        )

    for preset in CAT_PRESETS:
        for action, config in spec["actions"].items():
            failures.extend(validate_action(preset, action, config))
        failures.extend(validate_distinct_stationary_actions(preset, spec))

    if failures:
        print("Cat action asset check failed:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print("Cat action asset check passed.")


if __name__ == "__main__":
    main()
