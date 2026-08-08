#!/usr/bin/env python3
"""Validate CatStar runtime cat action sheets.

The checks are intentionally structural. They do not claim that generated art is
final, but they catch common product-asset regressions: wrong sheet dimensions,
empty frames, floating baselines, accidental pixel islands, and extreme frame
mass changes.
"""

from __future__ import annotations

import argparse
import json
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from statistics import median

from PIL import Image, UnidentifiedImageError


FRAME = 96
ALPHA_THRESHOLD = 24
MIN_FRAME_AREA = 2_000
MAX_SMALL_COMPONENT_AREA = 64
MAX_BOTTOM_RANGE = 6
MAX_AREA_RANGE_RATIO = 0.28
MAX_REFINED_PIXEL_COLORS = 128
MIN_ROUNDED_IDLE_HEIGHT = 68
MIN_IDLE_TO_WALK_MASS_RATIO = 0.85
REFINED_PIXEL_ACTIONS = {"idle", "sit", "walk", "interact"}
SCENE_ASSET_DIR = Path("public/assets/scenes/window-room")
CURRENT_CAT_PRESETS = (
    "gray-white-tabby",
    "orange-tabby",
    "solid-black",
    "solid-white",
    "calico",
    "tuxedo",
)
FIRST_RELEASE_CAT_PRESETS = CURRENT_CAT_PRESETS + (
    "brown-tabby",
    "solid-gray",
    "tortoiseshell",
    "colorpoint",
)


@dataclass(frozen=True)
class AssetProfile:
    name: str
    presets: tuple[str, ...]


ASSET_PROFILES = {
    "prototype": AssetProfile("prototype", CURRENT_CAT_PRESETS),
    "first-release": AssetProfile("first-release", FIRST_RELEASE_CAT_PRESETS),
}
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
EXPECTED_ACTION_FRAMES = {
    "idle": 4,
    "sit": 4,
    "walk": 8,
    "jump": 6,
    "sleep": 4,
    "interact": 6,
    "eat": 6,
    "lie": 4,
    "groom": 8,
    "stretch": 6,
}


def validate_environment_assets(scene_asset_dir: Path) -> list[str]:
    failures: list[str] = []
    background_path = scene_asset_dir / "background.png"
    leaf_path = scene_asset_dir / "plant-leaf.png"

    if not background_path.exists():
        failures.append(f"missing scene background {background_path}")
    else:
        try:
            with Image.open(background_path) as background:
                if background.size != (640, 360):
                    failures.append("background.png: expected 640x360 runtime composition")
        except (OSError, UnidentifiedImageError) as error:
            failures.append(f"background.png: unable to decode image: {error}")

    if not leaf_path.exists():
        failures.append(f"missing plant interaction leaf {leaf_path}")
        return failures

    try:
        with Image.open(leaf_path) as source_leaf:
            leaf = source_leaf.convert("RGBA")
    except (OSError, UnidentifiedImageError) as error:
        failures.append(f"plant-leaf.png: unable to decode image: {error}")
        return failures
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


def validate_action(
    asset_dir: Path,
    preset: str,
    action: str,
    config: dict[str, object],
) -> list[str]:
    failures: list[str] = []
    label = f"{preset}/{action}"
    file_name = config.get("file")
    frame_value = config.get("frames")
    if (
        not isinstance(file_name, str)
        or not file_name
        or not isinstance(frame_value, int)
        or isinstance(frame_value, bool)
        or frame_value <= 0
    ):
        return [f"{label}: invalid action metadata; expected file and positive integer frames"]

    frame_count = frame_value
    expected_frames = EXPECTED_ACTION_FRAMES.get(action)
    if expected_frames is not None and frame_count != expected_frames:
        failures.append(
            f"{label}: expected {expected_frames} frames in the ten-action contract, got {frame_count}"
        )

    image_path = asset_dir / preset / file_name
    expected_size = (FRAME * frame_count, FRAME)

    if not image_path.exists():
        return [f"{label}: missing sheet {image_path}"]

    try:
        with Image.open(image_path) as source_image:
            image = source_image.convert("RGBA")
    except (OSError, UnidentifiedImageError) as error:
        return [f"{label}: unable to decode sheet {image_path}: {error}"]
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
    heights: list[int] = []
    frame_payloads: list[bytes] = []

    for frame_index in range(frame_count):
        frame = image.crop((frame_index * FRAME, 0, (frame_index + 1) * FRAME, FRAME))
        frame_payloads.append(frame.tobytes())
        alpha = frame.getchannel("A")
        bbox = alpha.getbbox()
        if bbox is None:
            failures.append(f"{label}[{frame_index}]: empty frame")
            continue
        if alpha.getextrema()[0] > 0:
            failures.append(f"{label}[{frame_index}]: expected transparent background")

        area = visible_area(alpha)
        components = sorted(iter_component_sizes(alpha), reverse=True)
        small_island_area = sum(size for size in components[1:] if size < MAX_SMALL_COMPONENT_AREA)

        if area < MIN_FRAME_AREA:
            failures.append(f"{label}[{frame_index}]: visible area too small: {area}")
        if small_island_area:
            failures.append(f"{label}[{frame_index}]: small detached pixel islands: {small_island_area}px")

        areas.append(area)
        bottoms.append(bbox[3])
        heights.append(bbox[3] - bbox[1])

    if areas:
        min_area = min(areas)
        max_area = max(areas)
        area_range_ratio = (max_area - min_area) / max_area
        if area_range_ratio > MAX_AREA_RANGE_RATIO:
            failures.append(f"{label}: frame area range too high: {area_range_ratio:.2%}")

    if bottoms and max(bottoms) - min(bottoms) > MAX_BOTTOM_RANGE:
        failures.append(f"{label}: baseline range too high: {max(bottoms) - min(bottoms)}px")
    if preset == "gray-white-tabby" and action == "idle" and heights:
        shortest_height = min(heights)
        if shortest_height < MIN_ROUNDED_IDLE_HEIGHT:
            failures.append(
                f"{label}: rounded short-haired idle standing height is too short: "
                f"{shortest_height}px; minimum is {MIN_ROUNDED_IDLE_HEIGHT}px"
            )
    if action in REFINED_PIXEL_ACTIONS and len(set(frame_payloads)) != frame_count:
        failures.append(f"{label}: refined pixel action must not contain duplicate frames")

    return failures


def validate_distinct_stationary_actions(
    asset_dir: Path,
    preset: str,
    spec: dict[str, object],
) -> list[str]:
    idle_config = spec["actions"]["idle"]
    sit_config = spec["actions"]["sit"]
    try:
        with Image.open(asset_dir / preset / str(idle_config["file"])) as idle_source:
            idle = idle_source.convert("RGBA")
        with Image.open(asset_dir / preset / str(sit_config["file"])) as sit_source:
            sit = sit_source.convert("RGBA")
    except (OSError, UnidentifiedImageError):
        return []
    if idle.tobytes() == sit.tobytes():
        return [f"{preset}: idle and sit must use distinct visible motion sheets"]
    return []


def validate_shared_idle_alpha(
    asset_dir: Path,
    presets: tuple[str, ...],
    config: dict[str, object],
) -> list[str]:
    file_name = config.get("file")
    if not isinstance(file_name, str) or not file_name:
        return []
    master_path = asset_dir / "gray-white-tabby" / file_name
    try:
        with Image.open(master_path) as source:
            master_alpha = source.convert("RGBA").getchannel("A").tobytes()
    except (OSError, UnidentifiedImageError):
        return []

    failures: list[str] = []
    for preset in presets:
        if preset == "gray-white-tabby":
            continue
        candidate_path = asset_dir / preset / file_name
        try:
            with Image.open(candidate_path) as source:
                candidate_alpha = source.convert("RGBA").getchannel("A").tobytes()
        except (OSError, UnidentifiedImageError):
            continue
        if candidate_alpha != master_alpha:
            failures.append(f"{preset}/idle: idle alpha must match gray-white-tabby")
    return failures


def action_frame_areas(
    asset_dir: Path,
    preset: str,
    config: dict[str, object],
) -> list[int]:
    file_name = config.get("file")
    frame_count = config.get("frames")
    if not isinstance(file_name, str) or not isinstance(frame_count, int):
        return []
    try:
        with Image.open(asset_dir / preset / file_name) as source:
            image = source.convert("RGBA")
    except (OSError, UnidentifiedImageError):
        return []
    if image.size != (FRAME * frame_count, FRAME):
        return []
    return [
        visible_area(
            image.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME)).getchannel("A")
        )
        for index in range(frame_count)
    ]


def validate_idle_walk_mass(
    asset_dir: Path,
    idle_config: dict[str, object],
    walk_config: dict[str, object],
) -> list[str]:
    idle_areas = action_frame_areas(asset_dir, "gray-white-tabby", idle_config)
    walk_areas = action_frame_areas(asset_dir, "gray-white-tabby", walk_config)
    if not idle_areas or not walk_areas:
        return []
    ratio = min(idle_areas) / median(walk_areas)
    if ratio < MIN_IDLE_TO_WALK_MASS_RATIO:
        return [
            "gray-white-tabby/idle: idle visible mass is too low relative to walk: "
            f"{ratio:.2%}; minimum is {MIN_IDLE_TO_WALK_MASS_RATIO:.0%}"
        ]
    return []


def validate_assets(scene_asset_dir: Path, profile: AssetProfile) -> list[str]:
    asset_dir = scene_asset_dir / "cat"
    spec_path = asset_dir / "cat.animations.json"
    if not spec_path.exists():
        return [f"missing animation metadata {spec_path}"]

    try:
        spec = json.loads(spec_path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        return [f"invalid animation metadata {spec_path}: {error}"]
    if not isinstance(spec, dict):
        return [f"invalid animation metadata {spec_path}: expected an object"]
    failures = validate_environment_assets(scene_asset_dir)

    if spec.get("frameWidth") != FRAME or spec.get("frameHeight") != FRAME:
        failures.append(f"cat.animations.json: expected {FRAME}x{FRAME} frame contract")
    if spec.get("anchor") != "bottom-center":
        failures.append("cat.animations.json: expected bottom-center anchor")

    actions = spec.get("actions")
    if not isinstance(actions, dict):
        return failures + ["cat.animations.json: actions must be an object"]
    if set(actions) != REQUIRED_ACTIONS:
        failures.append(
            "cat.animations.json: expected exactly ten actions: "
            + ", ".join(sorted(REQUIRED_ACTIONS))
        )

    actual_presets = {
        path.name for path in asset_dir.iterdir() if path.is_dir()
    }
    allowed_presets = (
        set(FIRST_RELEASE_CAT_PRESETS)
        if profile.name == "prototype"
        else set(profile.presets)
    )
    unexpected_presets = sorted(actual_presets - allowed_presets)
    if unexpected_presets:
        failures.append(
            f"{profile.name} profile: unexpected coat presets: "
            + ", ".join(unexpected_presets)
        )

    for action in sorted(REQUIRED_ACTIONS):
        config = actions.get(action)
        if not isinstance(config, dict):
            failures.append(f"{action}: invalid action metadata; expected an object")
            continue
        frame_rate = config.get("frameRate")
        if (
            not isinstance(frame_rate, (int, float))
            or isinstance(frame_rate, bool)
            or frame_rate <= 0
        ):
            failures.append(f"{action}: invalid frameRate; expected a positive number")
        repeat = config.get("repeat")
        if not isinstance(repeat, int) or isinstance(repeat, bool) or repeat < -1:
            failures.append(f"{action}: invalid repeat; expected -1 or a non-negative integer")

    for preset in profile.presets:
        for action in sorted(REQUIRED_ACTIONS):
            config = actions.get(action)
            if isinstance(config, dict):
                failures.extend(validate_action(asset_dir, preset, action, config))
        preset_dir = asset_dir / preset
        idle_config = actions.get("idle")
        sit_config = actions.get("sit")
        if (
            isinstance(idle_config, dict)
            and isinstance(sit_config, dict)
            and isinstance(idle_config.get("file"), str)
            and isinstance(sit_config.get("file"), str)
        ):
            idle_file = preset_dir / idle_config["file"]
            sit_file = preset_dir / sit_config["file"]
        else:
            idle_file = sit_file = None
        if idle_file is not None and sit_file is not None and idle_file.exists() and sit_file.exists():
            failures.extend(validate_distinct_stationary_actions(asset_dir, preset, spec))

    idle_config = actions.get("idle")
    if isinstance(idle_config, dict):
        failures.extend(validate_shared_idle_alpha(asset_dir, profile.presets, idle_config))
        walk_config = actions.get("walk")
        if isinstance(walk_config, dict):
            failures.extend(validate_idle_walk_mass(asset_dir, idle_config, walk_config))

    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--profile",
        choices=tuple(ASSET_PROFILES),
        default="prototype",
        help="asset contract to validate (default: prototype)",
    )
    parser.add_argument(
        "--scene-asset-dir",
        type=Path,
        default=SCENE_ASSET_DIR,
        help="scene asset root, primarily for isolated contract tests",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    profile = ASSET_PROFILES[args.profile]
    failures = validate_assets(args.scene_asset_dir, profile)

    if failures:
        print(f"Cat action asset check failed ({profile.name} profile):")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(f"Cat action asset check passed ({profile.name} profile).")


if __name__ == "__main__":
    main()
