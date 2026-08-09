#!/usr/bin/env python3
"""Behavior tests for continuous motion review matrix and manifest validation."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


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

    def test_pending_human_review_is_not_a_human_pass(self) -> None:
        manifest = {
            "entries": [
                {"humanReview": {"status": "pending"}},
                {"humanReview": {"status": "pass"}},
                {"humanReview": {"status": "fail"}},
            ]
        }

        self.assertEqual(REVIEW.human_review_counts(manifest), {"pending": 1, "pass": 1, "fail": 1})


if __name__ == "__main__":
    unittest.main()
