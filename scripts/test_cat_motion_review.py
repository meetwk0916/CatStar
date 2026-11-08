#!/usr/bin/env python3
"""Behavior tests for continuous motion and runtime screenshot evidence."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageDraw


SCRIPT_PATH = Path(__file__).with_name("capture_cat_motion_review.py")
SPEC = importlib.util.spec_from_file_location("capture_cat_motion_review", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load {SCRIPT_PATH}")
REVIEW = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = REVIEW
SPEC.loader.exec_module(REVIEW)


class MotionReviewTests(unittest.TestCase):
    def test_matrix_keys_cover_every_preset_action_and_viewport(self) -> None:
        keys = REVIEW.matrix_keys(
            ["gray-white-tabby", "solid-black"],
            ["sit", "walk"],
            ["1280x720", "390x844"],
        )
        self.assertEqual(len(keys), 8)
        self.assertIn(("solid-black", "walk", "390x844"), keys)

    def test_required_human_pass_matrix_comes_from_external_scope(self) -> None:
        required = REVIEW.required_human_pass_matrix(
            ["gray-white-tabby"],
            ["idle", "lie", "sleep"],
            ["1280x720", "390x844"],
        )

        self.assertEqual(len(required), 6)
        self.assertIn(("gray-white-tabby", "sleep", "390x844"), required)

    def test_route_override_requires_one_action_and_keeps_its_duration(self) -> None:
        scenarios = REVIEW.selected_action_scenarios(
            ["lie"],
            "/?catstarRoutine=approachBlanket",
        )

        self.assertEqual(
            scenarios,
            {"lie": ("/?catstarRoutine=approachBlanket", 11_000)},
        )
        with self.assertRaisesRegex(ValueError, "exactly one action"):
            REVIEW.selected_action_scenarios(
                ["idle", "lie"],
                "/?catstarRoutine=approachBlanket",
            )

    def test_named_route_scenarios_do_not_expand_the_default_action_matrix(self) -> None:
        self.assertNotIn("approach-user-route", REVIEW.ACTION_SCENARIOS)
        self.assertEqual(
            REVIEW.selected_action_scenarios(["approach-user-route"]),
            {"approach-user-route": ("/?catstarRoutine=approachUser", 12_000)},
        )
        self.assertEqual(
            REVIEW.selected_action_scenarios(["approach-user-interruption"]),
            {
                "approach-user-interruption": (
                    "/?catstarRoutine=approachUser&catstarTouchInterrupt=1",
                    12_000,
                )
            },
        )

    def test_manifest_validation_reports_missing_matrix_entries(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-manifest-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        manifest = {
            "schemaVersion": 1,
            "profile": "prototype",
            "presets": ["gray-white-tabby", "solid-black"],
            "actions": ["sit", "walk"],
            "viewports": ["1280x720", "390x844"],
            "entries": [],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }
        failures = REVIEW.validate_manifest_data(manifest, output_dir)
        self.assertTrue(any("missing motion evidence" in failure for failure in failures))

    def test_complete_manifest_with_files_passes(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-manifest-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        entries = []
        for preset in ("gray-white-tabby", "solid-black"):
            for action in ("sit", "walk"):
                for viewport in ("1280x720", "390x844"):
                    paths = {
                        "video": f"videos/{preset}/{viewport}/{action}.webm",
                        "entryPoster": f"posters/{preset}/{viewport}/{action}-entry.png",
                        "exitPoster": f"posters/{preset}/{viewport}/{action}-exit.png",
                    }
                    for relative in paths.values():
                        path = output_dir / relative
                        path.parent.mkdir(parents=True, exist_ok=True)
                        path.write_bytes(b"review evidence")
                    entry = {
                        "coatPreset": preset,
                        "runtimeCoatPreset": REVIEW.preset_to_runtime_value(preset),
                        "action": action,
                        "viewport": viewport,
                        "motionState": "complete",
                        "humanReview": {
                            "status": "pending",
                            "reviewer": "",
                            "notes": "",
                        },
                        **paths,
                    }
                    entry["evidenceSha256"] = REVIEW.evidence_digests(entry, output_dir)
                    entries.append(entry)
        manifest = {
            "schemaVersion": 1,
            "profile": "prototype",
            "presets": ["gray-white-tabby", "solid-black"],
            "actions": ["sit", "walk"],
            "viewports": ["1280x720", "390x844"],
            "entries": entries,
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }
        self.assertEqual(REVIEW.validate_manifest_data(manifest, output_dir), [])
        entries[0]["humanReview"] = {"status": "pass", "reviewer": "", "notes": ""}
        failures = REVIEW.validate_manifest_data(manifest, output_dir)
        self.assertTrue(any("human reviewer is required" in failure for failure in failures))

    def test_manifest_validation_rejects_duplicate_entries(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-duplicate-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        evidence = output_dir / "sit.webm"
        evidence.write_bytes(b"review evidence")
        digest = REVIEW.file_sha256(evidence)
        entry = {
            "coatPreset": "gray-white-tabby",
            "runtimeCoatPreset": "GRAY_WHITE_TABBY",
            "action": "sit",
            "viewport": "1280x720",
            "motionState": "complete",
            "video": "sit.webm",
            "entryPoster": "sit.webm",
            "exitPoster": "sit.webm",
            "evidenceSha256": {field: digest for field in REVIEW.EVIDENCE_FIELDS},
            "humanReview": {"status": "pending", "reviewer": "", "notes": ""},
        }
        manifest = {
            "schemaVersion": 1,
            "presets": ["gray-white-tabby"],
            "actions": ["sit"],
            "viewports": ["1280x720"],
            "entries": [entry, entry.copy()],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }

        failures = REVIEW.validate_manifest_data(manifest, output_dir)

        self.assertTrue(any("duplicate motion evidence" in failure for failure in failures))

    def test_human_pass_rejects_manifest_missing_external_matrix(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-required-matrix-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        manifest = {
            "schemaVersion": 1,
            "presets": [],
            "actions": [],
            "viewports": [],
            "entries": [],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }
        (output_dir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

        required = frozenset({("gray-white-tabby", "idle", "1280x720")})
        with self.assertRaisesRegex(RuntimeError, "missing required human-review evidence"):
            REVIEW.validate_existing(output_dir, required_matrix=required)

    def test_manifest_validation_rejects_changed_evidence(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-digest-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        evidence = output_dir / "sit.webm"
        evidence.write_bytes(b"approved evidence")
        entry = {
            "coatPreset": "gray-white-tabby",
            "runtimeCoatPreset": "GRAY_WHITE_TABBY",
            "action": "sit",
            "viewport": "1280x720",
            "motionState": "complete",
            "video": "sit.webm",
            "entryPoster": "sit.webm",
            "exitPoster": "sit.webm",
            "humanReview": {"status": "pending", "reviewer": "", "notes": ""},
        }
        entry["evidenceSha256"] = REVIEW.evidence_digests(entry, output_dir)
        evidence.write_bytes(b"changed evidence")
        manifest = {
            "schemaVersion": 1,
            "presets": ["gray-white-tabby"],
            "actions": ["sit"],
            "viewports": ["1280x720"],
            "entries": [entry],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }

        failures = REVIEW.validate_manifest_data(manifest, output_dir)

        self.assertTrue(any("digest mismatch" in failure for failure in failures))

    def test_manifest_validation_rejects_runtime_coat_mismatch(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-runtime-coat-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        entry = {
            "coatPreset": "gray-white-tabby",
            "runtimeCoatPreset": "ORANGE_TABBY",
            "action": "sit",
            "viewport": "1280x720",
            "motionState": "complete",
            "video": "sit.webm",
            "entryPoster": "entry.png",
            "exitPoster": "exit.png",
            "humanReview": {"status": "pending", "reviewer": "", "notes": ""},
        }
        for field in ("video", "entryPoster", "exitPoster"):
            (output_dir / entry[field]).write_bytes(b"review evidence")
        entry["evidenceSha256"] = REVIEW.evidence_digests(entry, output_dir)
        manifest = {
            "schemaVersion": 1,
            "profile": "prototype",
            "presets": ["gray-white-tabby"],
            "actions": ["sit"],
            "viewports": ["1280x720"],
            "entries": [entry],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }

        failures = REVIEW.validate_manifest_data(manifest, output_dir)

        self.assertTrue(any("runtime coat mismatch" in failure for failure in failures))

    def test_manifest_validation_requires_recorded_touch_interruption(self) -> None:
        output_dir = Path(tempfile.mkdtemp(prefix="catstar-motion-touch-test-"))
        fingerprint, source_files = REVIEW.source_fingerprint()
        evidence = output_dir / "eat.webm"
        evidence.write_bytes(b"review evidence")
        digest = REVIEW.file_sha256(evidence)
        entry = {
            "coatPreset": "gray-white-tabby",
            "runtimeCoatPreset": "GRAY_WHITE_TABBY",
            "action": "eat",
            "viewport": "1280x720",
            "route": "/?catstarRoutine=approachFoodBowl&catstarTouchInterrupt=1",
            "motionState": "complete",
            "video": "eat.webm",
            "entryPoster": "eat.webm",
            "exitPoster": "eat.webm",
            "evidenceSha256": {field: digest for field in REVIEW.EVIDENCE_FIELDS},
            "humanReview": {"status": "pending", "reviewer": "", "notes": ""},
        }
        manifest = {
            "schemaVersion": 1,
            "presets": ["gray-white-tabby"],
            "actions": ["eat"],
            "viewports": ["1280x720"],
            "entries": [entry],
            "boards": [],
            "sourceFingerprint": fingerprint,
            "sourceFiles": source_files,
        }

        failures = REVIEW.validate_manifest_data(manifest, output_dir)

        self.assertTrue(any("missing touch interruption evidence" in failure for failure in failures))
        entry["scenario"] = "route-and-touch-interruption"
        entry["touchInterruption"] = {
            "triggeredAfterMs": 1_800,
            "finalRoutine": "floorPause",
            "motionState": "complete",
        }
        self.assertEqual(REVIEW.validate_manifest_data(manifest, output_dir), [])

    def test_pending_human_review_is_not_a_human_pass(self) -> None:
        manifest = {
            "entries": [
                {"humanReview": {"status": "pending"}},
                {"humanReview": {"status": "pass"}},
                {"humanReview": {"status": "fail"}},
            ]
        }

        self.assertEqual(REVIEW.human_review_counts(manifest), {"pending": 1, "pass": 1, "fail": 1})


class RuntimeScreenshotReviewTests(unittest.TestCase):
    def test_validates_a_canvas_shifted_away_from_the_old_page_coordinates(self) -> None:
        runtime = REVIEW.screenshot_review
        bounds = {"x": 310, "y": 80, "width": 640, "height": 360}
        with tempfile.TemporaryDirectory(prefix="catstar-screenshot-test-") as directory:
            path = Path(directory) / "shifted.png"
            image = Image.new("RGB", (1280, 720), "white")
            image.paste(Image.open(runtime.BACKGROUND_PATH).convert("RGB"), (310, 80))
            image.save(path)
            with self.assertRaisesRegex(RuntimeError, "cat is not visibly present"):
                runtime.validate_screenshot(path, (1280, 720), bounds)

            ImageDraw.Draw(image).rectangle((620, 340, 640, 360), fill="white")
            image.save(path)
            runtime.validate_screenshot(path, (1280, 720), bounds)

    def test_mobile_check_rejects_blank_canvas_on_colorful_page(self) -> None:
        runtime = REVIEW.screenshot_review
        bounds = {"x": 10, "y": 300, "width": 370, "height": 210}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "mobile.png"
            image = Image.open(runtime.BACKGROUND_PATH).convert("RGB").resize((390, 844))
            ImageDraw.Draw(image).rectangle((10, 300, 379, 509), fill="black")
            image.save(path)
            with self.assertRaisesRegex(RuntimeError, "canvas looks blank"):
                runtime.validate_screenshot(path, (390, 844), bounds)

    def test_rejects_invalid_canvas_bounds(self) -> None:
        runtime = REVIEW.screenshot_review
        bounds = {"x": 310, "y": 80, "width": 640, "height": 360}
        for bad_bounds in (
            None, {}, {**bounds, "x": "310"}, {**bounds, "x": True},
            {**bounds, "x": -1}, {**bounds, "width": 0},
            {**bounds, "width": float("nan")}, {**bounds, "height": float("inf")},
            {**bounds, "width": 971}, {**bounds, "height": 641},
            {"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.2},
        ):
            with self.subTest(bounds=bad_bounds), self.assertRaisesRegex(RuntimeError, "canvas bounds"):
                runtime.canvas_region(Path("review.png"), bad_bounds, (1280, 720))

    def test_manifest_requires_bounds_for_every_shot(self) -> None:
        runtime = REVIEW.screenshot_review
        bounds = {filename: {"x": 12, "y": 20, "width": 350, "height": 195}
                  for filename in runtime.SHOT_FILENAMES}
        with tempfile.TemporaryDirectory() as directory, patch.object(runtime, "OUT_DIR", Path(directory)):
            runtime.write_manifest(bounds)
            self.assertEqual(runtime.validate_manifest(), bounds)
            bounds.pop(runtime.SHOT_FILENAMES[0])
            runtime.write_manifest(bounds)
            with self.assertRaisesRegex(RuntimeError, "per-shot canvas bounds"):
                runtime.validate_manifest()

    def test_failed_preflight_does_not_capture_other_shots_or_publish(self) -> None:
        runtime = REVIEW.screenshot_review

        def capture_blank_frame(command, **_kwargs):
            shot = json.loads(command[-1])
            Image.new("RGB", (1280, 720), "black").save(Path(command[4]) / shot["filename"])
            bounds = {"x": 310, "y": 80, "width": 640, "height": 360}
            return runtime.subprocess.CompletedProcess(command, 0, json.dumps({shot["filename"]: bounds}))

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "review"
            with (
                patch.object(runtime, "OUT_DIR", output),
                patch.object(runtime.subprocess, "run", side_effect=capture_blank_frame) as browser,
                self.assertRaisesRegex(RuntimeError, "canvas looks blank"),
            ):
                runtime.capture(Path(directory) / "storage.json")
            browser.assert_called_once()
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
