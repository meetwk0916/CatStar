#!/usr/bin/env python3
"""Behavior tests for the public cat asset validation profiles."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image


SCRIPT_PATH = Path(__file__).with_name("check_cat_action_assets.py")
SPEC = importlib.util.spec_from_file_location("check_cat_action_assets", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load {SCRIPT_PATH}")
CHECKER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = CHECKER
SPEC.loader.exec_module(CHECKER)


ACTION_FRAMES = {
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


def make_sheet(path: Path, frame_count: int, action_index: int, preset_index: int) -> None:
    sheet = Image.new("RGBA", (96 * frame_count, 96), (0, 0, 0, 0))
    for frame_index in range(frame_count):
        color = (
            40 + ((action_index * 13 + preset_index * 7 + frame_index) % 180),
            60 + ((action_index * 17 + frame_index * 3) % 150),
            80 + ((preset_index * 19 + frame_index * 5) % 130),
            255,
        )
        frame = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        frame.paste(color, (12, 12, 84, 84))
        sheet.alpha_composite(frame, (frame_index * 96, 0))
    sheet.save(path)


def make_fixture(presets: tuple[str, ...]) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="catstar-asset-profile-test-"))
    scene_dir = temp_dir / "scene"
    cat_dir = scene_dir / "cat"
    cat_dir.mkdir(parents=True)
    Image.new("RGBA", (640, 360), (20, 30, 40, 255)).save(scene_dir / "background.png")
    leaf = Image.new("RGBA", (47, 24), (0, 0, 0, 0))
    leaf.paste((20, 120, 30, 255), (5, 4, 42, 20))
    leaf.save(scene_dir / "plant-leaf.png")

    spec = {
        "frameWidth": 96,
        "frameHeight": 96,
        "anchor": "bottom-center",
        "actions": {
            action: {
                "file": f"{action}.png",
                "frames": frame_count,
                "frameRate": 4,
                "repeat": -1,
            }
            for action, frame_count in ACTION_FRAMES.items()
        },
    }
    (cat_dir / "cat.animations.json").write_text(json.dumps(spec), encoding="utf-8")

    for preset_index, preset in enumerate(presets):
        preset_dir = cat_dir / preset
        preset_dir.mkdir()
        for action_index, (action, frame_count) in enumerate(ACTION_FRAMES.items()):
            make_sheet(preset_dir / f"{action}.png", frame_count, action_index, preset_index)
    return scene_dir


class AssetProfileTests(unittest.TestCase):
    def test_current_profile_accepts_the_internal_prototype_preset_set(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])
        self.assertEqual(failures, [])

    def test_first_release_profile_names_each_missing_preset(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["first-release"])
        self.assertTrue(any("brown-tabby" in failure for failure in failures))
        self.assertTrue(any("solid-gray" in failure for failure in failures))
        self.assertTrue(any("tortoiseshell" in failure for failure in failures))
        self.assertTrue(any("colorpoint" in failure for failure in failures))

    def test_first_release_profile_accepts_all_ten_presets(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["first-release"])
        self.assertEqual(failures, [])

    def test_prototype_profile_allows_release_presets_already_in_the_asset_root(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])
        self.assertEqual(failures, [])

    def test_malformed_action_metadata_reports_contract_errors(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        spec_path = scene_dir / "cat" / "cat.animations.json"
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        spec["anchor"] = "center"
        spec["actions"]["idle"] = {"file": "idle.png", "frames": 3, "frameRate": 0, "repeat": -2}
        spec_path.write_text(json.dumps(spec), encoding="utf-8")

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("bottom-center anchor" in failure for failure in failures))
        self.assertTrue(any("expected 4 frames" in failure for failure in failures))
        self.assertTrue(any("invalid frameRate" in failure for failure in failures))
        self.assertTrue(any("invalid repeat" in failure for failure in failures))

    def test_corrupt_sheet_reports_the_affected_preset_and_action(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        corrupt_sheet = scene_dir / "cat" / "gray-white-tabby" / "idle.png"
        corrupt_sheet.write_bytes(b"not a png")

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("gray-white-tabby/idle" in failure for failure in failures))
        self.assertTrue(any("unable to decode sheet" in failure for failure in failures))

    def test_rounded_short_haired_idle_rejects_a_short_standing_silhouette(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        idle_path = scene_dir / "cat" / "gray-white-tabby" / "idle.png"
        short_idle = Image.new("RGBA", (96 * 4, 96), (0, 0, 0, 0))
        for frame_index in range(4):
            short_idle.paste(
                (90 + frame_index, 100, 110, 255),
                (frame_index * 96 + 7, 33, frame_index * 96 + 89, 92),
            )
        short_idle.save(idle_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(
            any("rounded short-haired idle standing height" in failure for failure in failures)
        )

    def test_idle_requires_one_shared_alpha_shape_across_coat_presets(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        orange_idle_path = scene_dir / "cat" / "orange-tabby" / "idle.png"
        orange_idle = Image.open(orange_idle_path).convert("RGBA")
        orange_idle.putpixel((12, 12), (0, 0, 0, 0))
        orange_idle.save(orange_idle_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("idle alpha must match gray-white-tabby" in failure for failure in failures))

    def test_rounded_short_haired_idle_rejects_low_mass_relative_to_walk(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        idle_path = scene_dir / "cat" / "gray-white-tabby" / "idle.png"
        low_mass_idle = Image.new("RGBA", (96 * 4, 96), (0, 0, 0, 0))
        for frame_index in range(4):
            low_mass_idle.paste(
                (100 + frame_index, 110, 120, 255),
                (frame_index * 96 + 28, 20, frame_index * 96 + 68, 92),
            )
        low_mass_idle.save(idle_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(
            any("idle visible mass is too low relative to walk" in failure for failure in failures)
        )


if __name__ == "__main__":
    unittest.main()
