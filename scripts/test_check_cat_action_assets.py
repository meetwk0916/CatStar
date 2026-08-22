#!/usr/bin/env python3
"""Behavior tests for the public cat asset validation profiles."""

from __future__ import annotations

import importlib.util
import io
import json
import re
import struct
import sys
import tempfile
import unittest
from unittest import mock
import zipfile
import zlib
from pathlib import Path

from PIL import Image

import cat_cross_action_scale as SCALE


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


def make_openraster(path: Path) -> None:
    layer_buffer = io.BytesIO()
    Image.new("RGBA", (96, 96), (220, 130, 40, 255)).save(layer_buffer, format="PNG")
    layer = layer_buffer.getvalue()
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("mimetype", "image/openraster", compress_type=zipfile.ZIP_STORED)
        archive.writestr(
            "stack.xml",
            '<image version="0.0.1" w="96" h="96"><stack><layer name="cat" src="data/cat.png"/></stack></image>',
        )
        archive.writestr("data/cat.png", layer)
        archive.writestr("mergedimage.png", layer)


def lzf_literal_encode(payload: bytes) -> bytes:
    encoded = bytearray()
    for offset in range(0, len(payload), 32):
        chunk = payload[offset : offset + 32]
        encoded.append(len(chunk) - 1)
        encoded.extend(chunk)
    return bytes(encoded)


def make_krita(path: Path) -> None:
    image_buffer = io.BytesIO()
    Image.new("RGBA", (96, 96), (220, 130, 40, 255)).save(image_buffer, format="PNG")
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("mimetype", "application/x-krita", compress_type=zipfile.ZIP_STORED)
        archive.writestr(
            "maindoc.xml",
            '<DOC><IMAGE><layers><layer name="cat" filename="layer2" nodetype="paintlayer"/></layers></IMAGE></DOC>',
        )
        encoded_tile = lzf_literal_encode(bytes(16384))
        archive.writestr(
            "layers/layer2",
            b"VERSION 2\nTILEWIDTH 64\nTILEHEIGHT 64\nPIXELSIZE 4\nDATA 1\n"
            + f"0,0,LZF,{len(encoded_tile)}\n".encode("ascii")
            + encoded_tile,
        )
        archive.writestr("mergedimage.png", image_buffer.getvalue())


def make_photoshop(path: Path, compression: int = 0, encoded_channel: bytes = b"\xff") -> None:
    header = b"8BPS" + struct.pack(">H6xHIIHH", 1, 3, 1, 1, 8, 3)
    layer_extra = struct.pack(">II", 0, 0) + b"\x03cat"
    layer_record = (
        struct.pack(">iiiiHhI", 0, 0, 1, 1, 1, 0, len(encoded_channel) + 2)
        + b"8BIMnorm"
        + bytes((255, 0, 0, 0))
        + struct.pack(">I", len(layer_extra))
        + layer_extra
    )
    channel_payload = struct.pack(">H", compression) + encoded_channel
    layer_info = struct.pack(">h", 1) + layer_record + channel_payload
    if len(layer_info) % 2:
        layer_info += b"\x00"
    layer_data = struct.pack(">I", len(layer_info)) + layer_info
    payload = (
        header
        + struct.pack(">I", 0)
        + struct.pack(">I", 0)
        + struct.pack(">I", len(layer_data))
        + layer_data
        + struct.pack(">H", 0)
        + b"\x00\x00\x00"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def make_aseprite(path: Path) -> None:
    layer_body = struct.pack("<HHHHHHB3xH", 3, 0, 0, 0, 0, 0, 255, 3) + b"cat"
    cel_body = struct.pack("<HhhBHh5xHH", 0, 0, 0, 255, 0, 0, 1, 1) + b"\xdc\x82\x28\xff"
    chunks = (
        struct.pack("<IH", 6 + len(layer_body), 0x2004)
        + layer_body
        + struct.pack("<IH", 6 + len(cel_body), 0x2005)
        + cel_body
    )
    frame = struct.pack("<IHHH2xI", 16 + len(chunks), 0xF1FA, 2, 100, 2) + chunks
    header = bytearray(128)
    struct.pack_into("<IHHHHH", header, 0, 128 + len(frame), 0xA5E0, 1, 96, 96, 32)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes(header) + frame)


def canonical_authority_dir(scene_dir: Path) -> Path:
    return (
        scene_dir.parent
        / "artifacts/art/candidates/active/product-cat-orange-tabby-v1/sources"
    )


def validate_release_fixture(
    scene_dir: Path,
    rights_path: Path,
    manifest_path: Path,
    *,
    fingerprint: str = "fixture-fingerprint",
) -> list[str]:
    return CHECKER.validate_assets(
        scene_dir,
        CHECKER.ASSET_PROFILES["first-release"],
        release_rights_record=rights_path,
        release_motion_review=manifest_path,
        expected_release_fingerprint=fingerprint,
        canonical_authority_dir=canonical_authority_dir(scene_dir),
    )


def make_release_records(
    scene_dir: Path,
    *,
    fingerprint: str = "fixture-fingerprint",
) -> tuple[Path, Path]:
    release_dir = scene_dir.parent / "release"
    evidence_dir = release_dir / "motion"
    evidence_dir.mkdir(parents=True)
    source_path = canonical_authority_dir(scene_dir) / "orange-tabby-production.ora"
    terms_path = release_dir / "distribution-terms.txt"
    intake_path = release_dir / "intake-checklist.md"
    make_openraster(source_path)
    terms_path.write_text("distribution terms", encoding="utf-8")
    runtime_exports = {}
    for action in ACTION_FRAMES:
        export_path = scene_dir / "cat" / "orange-tabby" / f"{action}.png"
        runtime_exports[action] = {
            "path": f"../{scene_dir.name}/cat/orange-tabby/{action}.png",
            "sha256": CHECKER.sha256_file(export_path),
        }
    intake_template = (
        Path(__file__).resolve().parents[1]
        / "artifacts/art/production-briefs/orange-tabby-v1/intake-checklist.md"
    ).read_text(encoding="utf-8")
    completed_intake = re.sub(
        r"_{3,}",
        "recorded",
        intake_template.replace("**Status:** Not received", "**Status:** Complete")
        .replace("- [ ]", "- [x]")
        .replace(
            "**Decision:** `internal-only` / `approved-for-target` / `blocked`",
            "**Decision:** `approved-for-target`",
        ),
    )
    binding_records = [
        (
            f"../{source_path.relative_to(scene_dir.parent)}",
            CHECKER.sha256_file(source_path),
        ),
        *[
            (record["path"], record["sha256"])
            for record in runtime_exports.values()
        ],
        (terms_path.name, CHECKER.sha256_file(terms_path)),
    ]
    completed_intake += "\n## Bound Delivery Hashes\n\n" + "\n".join(
        f"- `{path}`: `{digest}`" for path, digest in binding_records
    )
    intake_path.write_text(completed_intake, encoding="utf-8")
    rights_path = release_dir / "cat-rights-and-provenance.json"
    rights_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "status": "approved-for-target",
                "presets": list(CHECKER.FIRST_RELEASE_CAT_PRESETS),
                "actions": list(ACTION_FRAMES),
                "releasePreset": "orange-tabby",
                "creator": "CatStar artist",
                "accountOwner": "CatStar",
                "creationDate": "2026-08-22",
                "sourceBrief": "rounded short-haired release cat",
                "transformationLineage": "editable source to ten runtime sheets",
                "thirdPartyInputs": [],
                "reviewer": "release reviewer",
                "reviewDate": "2026-08-22",
                "approvedTarget": "public release",
                "rightsGrant": {
                    grant: True for grant in CHECKER.REQUIRED_RIGHTS_GRANTS
                },
                "intakeItems": {
                    item: True for item in CHECKER.REQUIRED_INTAKE_ITEMS
                },
                "canonicalIntake": {
                    "path": intake_path.name,
                    "sha256": CHECKER.sha256_file(intake_path),
                },
                "editableAuthority": {
                    "path": f"../{source_path.relative_to(scene_dir.parent)}",
                    "sha256": CHECKER.sha256_file(source_path),
                    "format": "openraster",
                    "governsActions": list(ACTION_FRAMES),
                },
                "runtimeExports": runtime_exports,
                "termsEvidence": [
                    {"path": terms_path.name, "sha256": CHECKER.sha256_file(terms_path)}
                ],
            }
        ),
        encoding="utf-8",
    )

    entries = []
    for action in ACTION_FRAMES:
        for viewport in CHECKER.RELEASE_VIEWPORTS:
            evidence = {}
            hashes = {}
            for field, suffix in (
                ("video", ".webm"),
                ("entryPoster", "-entry.png"),
                ("exitPoster", "-exit.png"),
            ):
                relative = f"evidence/{viewport}/{action}{suffix}"
                path = evidence_dir / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(f"{action}/{viewport}/{field}".encode())
                evidence[field] = relative
                hashes[field] = CHECKER.sha256_file(path)
            entries.append(
                {
                    "coatPreset": "orange-tabby",
                    "action": action,
                    "viewport": viewport,
                    "motionState": "complete",
                    "humanReview": {
                        "status": "pass",
                        "reviewer": "release reviewer",
                        "reviewedAt": "2026-08-22T12:00:00+08:00",
                    },
                    "evidenceSha256": hashes,
                    **evidence,
                }
            )
    manifest_path = evidence_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "profile": "first-release",
                "presets": ["orange-tabby"],
                "actions": list(ACTION_FRAMES),
                "viewports": sorted(CHECKER.RELEASE_VIEWPORTS),
                "sourceFingerprint": fingerprint,
                "entries": entries,
            }
        ),
        encoding="utf-8",
    )
    return rights_path, manifest_path


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

    def test_first_release_profile_rejects_assets_without_release_records(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["first-release"])
        self.assertTrue(any("missing rights/provenance record" in failure for failure in failures))
        self.assertTrue(any("missing motion-review manifest" in failure for failure in failures))

    def test_first_release_profile_accepts_cleared_rights_and_current_human_matrix(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertEqual(failures, [])

    def test_first_release_profile_rejects_stale_or_incomplete_acceptance(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        rights["rightsGrant"]["paidDistribution"] = False
        rights_path.write_text(json.dumps(rights), encoding="utf-8")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["entries"][0]["humanReview"]["status"] = "pending"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        failures = validate_release_fixture(
            scene_dir,
            rights_path,
            manifest_path,
            fingerprint="different-fingerprint",
        )

        self.assertTrue(any("rightsGrant.paidDistribution" in failure for failure in failures))
        self.assertTrue(any("source fingerprint is stale" in failure for failure in failures))
        self.assertTrue(any("lacks a human pass" in failure for failure in failures))

    def test_release_human_pass_requires_a_review_timestamp(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["entries"][0]["humanReview"].pop("reviewedAt")
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("entry 0 lacks a human pass" in failure for failure in failures))

    def test_first_release_profile_binds_editable_authority_and_each_runtime_export(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        arbitrary_source = rights_path.parent / "production-source.txt"
        arbitrary_source.write_text("not editable", encoding="utf-8")
        rights["editableAuthority"].update(
            {
                "path": arbitrary_source.name,
                "sha256": CHECKER.sha256_file(arbitrary_source),
                "format": "text",
            }
        )
        rights["runtimeExports"]["idle"] = rights["termsEvidence"][0]
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("editableAuthority.format must be one of" in failure for failure in failures))
        self.assertTrue(any("must come from the canonical" in failure for failure in failures))
        self.assertTrue(any("runtimeExports.idle must bind" in failure for failure in failures))

    def test_first_release_profile_rejects_an_incomplete_canonical_intake(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        intake_path = rights_path.parent / rights["canonicalIntake"]["path"]
        intake = intake_path.read_text(encoding="utf-8").replace("- [x]", "- [ ]", 1)
        intake_path.write_text(intake, encoding="utf-8")
        rights["canonicalIntake"]["sha256"] = CHECKER.sha256_file(intake_path)
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("canonicalIntake still has incomplete fields" in failure for failure in failures))

    def test_release_record_requires_every_stable_intake_item(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        rights["intakeItems"].pop("source.creator")
        rights["intakeItems"]["substitute.arbitrary"] = True
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("intakeItems must match the canonical schema" in failure for failure in failures))

    def test_release_record_rejects_an_incomplete_structured_intake_item(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        rights["intakeItems"]["rights.paid_distribution"] = False
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("every canonical intake item must be complete" in failure for failure in failures))

    def test_editable_authority_requires_parseable_openraster(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        authority = rights["editableAuthority"]
        authority_path = (rights_path.parent / authority["path"]).resolve()
        previous_hash = authority["sha256"]
        authority_path.write_bytes(b"not an openraster package")
        authority["sha256"] = CHECKER.sha256_file(authority_path)
        intake_path = rights_path.parent / rights["canonicalIntake"]["path"]
        intake = intake_path.read_text(encoding="utf-8").replace(
            f"- `{authority['path']}`: `{previous_hash}`",
            f"- `{authority['path']}`: `{authority['sha256']}`",
        )
        intake_path.write_text(intake, encoding="utf-8")
        rights["canonicalIntake"]["sha256"] = CHECKER.sha256_file(intake_path)
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("not parseable openraster" in failure for failure in failures))

    def test_editable_authority_dispatches_supported_layered_formats(self) -> None:
        makers = {
            "openraster": (".ora", make_openraster),
            "krita": (".kra", make_krita),
            "photoshop": (".psd", make_photoshop),
            "aseprite": (".aseprite", make_aseprite),
        }
        for authority_format, (suffix, maker) in makers.items():
            with self.subTest(authority_format=authority_format):
                root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
                record_dir = root / "release"
                canonical_dir = root / "product-cat-orange-tabby-v1/sources"
                authority_path = canonical_dir / "nested" / f"orange-tabby{suffix}"
                record_dir.mkdir(parents=True)
                maker(authority_path)
                record = {
                    "path": f"../{authority_path.relative_to(root)}",
                    "sha256": CHECKER.sha256_file(authority_path),
                    "format": authority_format,
                    "governsActions": list(ACTION_FRAMES),
                }

                failures = CHECKER.validate_editable_authority(
                    record,
                    record_dir,
                    canonical_dir,
                )

                self.assertEqual(failures, [])

    def test_krita_authority_requires_declared_layer_payload(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        path = root / "orange-tabby.kra"
        image_buffer = io.BytesIO()
        Image.new("RGBA", (1, 1), (0, 0, 0, 255)).save(image_buffer, format="PNG")
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("mimetype", "application/x-krita", compress_type=zipfile.ZIP_STORED)
            archive.writestr(
                "maindoc.xml",
                '<DOC><IMAGE><layers><layer filename="layer2" nodetype="paintlayer"/></layers></IMAGE></DOC>',
            )
            archive.writestr("mergedimage.png", image_buffer.getvalue())

        failures = CHECKER.validate_zip_authority(path, "krita")

        self.assertTrue(any("not parseable krita" in failure for failure in failures))

    def test_krita_lzf_requires_exact_decoded_tile(self) -> None:
        CHECKER.decompress_lzf_exact(b"\x02abc\x80\x02", 9)

        with self.assertRaisesRegex(ValueError, "exceeds expected size"):
            CHECKER.decompress_lzf_exact(b"\x02abc\x80\x02\x00x", 9)

    def test_photoshop_authority_requires_complete_layer_record(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        path = root / "orange-tabby.psd"
        header = b"8BPS" + struct.pack(">H6xHIIHH", 1, 3, 1, 1, 8, 3)
        layer_data = struct.pack(">Ih", 2, 1)
        path.write_bytes(
            header
            + struct.pack(">I", 0)
            + struct.pack(">I", 0)
            + struct.pack(">I", len(layer_data))
            + layer_data
            + struct.pack(">H", 0)
            + b"\x00\x00\x00"
        )

        failures = CHECKER.validate_photoshop(path)

        self.assertTrue(any("not parseable photoshop" in failure for failure in failures))

    def test_photoshop_authority_validates_channel_encodings(self) -> None:
        fixtures = {
            "raw": (0, b"\xff"),
            "rle": (1, b"\x00\x02\x00\xff"),
            "zip": (2, zlib.compress(b"\xff")),
        }
        for name, (compression, encoded) in fixtures.items():
            with self.subTest(name=name):
                root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
                path = root / "orange-tabby.psd"
                make_photoshop(path, compression, encoded)

                self.assertEqual(CHECKER.validate_photoshop(path), [])

    def test_photoshop_authority_rejects_invalid_channel_encoding(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        path = root / "orange-tabby.psd"
        make_photoshop(path, 4, b"arbitrary")

        failures = CHECKER.validate_photoshop(path)

        self.assertTrue(any("unsupported Photoshop channel compression" in failure for failure in failures))

    def test_aseprite_authority_requires_layer_and_cel_bodies(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        path = root / "orange-tabby.aseprite"
        chunks = struct.pack("<IH", 6, 0x2004) + struct.pack("<IH", 6, 0x2005)
        frame = struct.pack("<IHHH2xI", 16 + len(chunks), 0xF1FA, 2, 100, 2) + chunks
        header = bytearray(128)
        struct.pack_into("<IHHHHH", header, 0, 128 + len(frame), 0xA5E0, 1, 1, 1, 32)
        path.write_bytes(bytes(header) + frame)

        failures = CHECKER.validate_aseprite(path)

        self.assertTrue(any("not parseable aseprite" in failure for failure in failures))

    def test_aseprite_authority_bounds_compressed_cel_size(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        path = root / "orange-tabby.aseprite"
        layer_body = struct.pack("<HHHHHHB3xH", 3, 0, 0, 0, 0, 0, 255, 3) + b"cat"
        cel_body = (
            struct.pack("<HhhBHh5xHH", 0, 0, 0, 255, 2, 0, 65535, 65535)
            + zlib.compress(b"")
        )
        chunks = (
            struct.pack("<IH", 6 + len(layer_body), 0x2004)
            + layer_body
            + struct.pack("<IH", 6 + len(cel_body), 0x2005)
            + cel_body
        )
        frame = struct.pack("<IHHH2xI", 16 + len(chunks), 0xF1FA, 2, 100, 2) + chunks
        header = bytearray(128)
        struct.pack_into("<IHHHHH", header, 0, 128 + len(frame), 0xA5E0, 1, 65535, 65535, 32)
        path.write_bytes(bytes(header) + frame)

        failures = CHECKER.validate_aseprite(path)

        self.assertTrue(any("decoded payload exceeds authority limit" in failure for failure in failures))

    def test_openraster_expected_parse_failures_do_not_escape(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="catstar-editable-authority-test-"))
        record_dir = root / "release"
        canonical_dir = root / "product-cat-orange-tabby-v1/sources"
        authority_path = canonical_dir / "orange-tabby.ora"
        record_dir.mkdir(parents=True)
        make_openraster(authority_path)
        record = {
            "path": f"../{authority_path.relative_to(root)}",
            "sha256": CHECKER.sha256_file(authority_path),
            "format": "openraster",
            "governsActions": list(ACTION_FRAMES),
        }

        for error in (
            RuntimeError("encrypted member"),
            NotImplementedError("unsupported compression"),
        ):
            with self.subTest(error=type(error).__name__):
                with mock.patch.object(CHECKER.zipfile, "ZipFile", side_effect=error):
                    failures = CHECKER.validate_editable_authority(
                        record,
                        record_dir,
                        canonical_dir,
                    )
                self.assertTrue(any("not parseable openraster" in failure for failure in failures))

        with mock.patch.object(
            CHECKER.Image,
            "open",
            side_effect=CHECKER.Image.DecompressionBombError("oversized image"),
        ):
            failures = CHECKER.validate_editable_authority(
                record,
                record_dir,
                canonical_dir,
            )
        self.assertTrue(any("not parseable openraster" in failure for failure in failures))

    def test_canonical_intake_rejects_swapped_delivery_hashes(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        intake_path = rights_path.parent / rights["canonicalIntake"]["path"]
        idle = rights["runtimeExports"]["idle"]
        sit = rights["runtimeExports"]["sit"]
        intake = intake_path.read_text(encoding="utf-8")
        idle_line = f"- `{idle['path']}`: `{idle['sha256']}`"
        sit_line = f"- `{sit['path']}`: `{sit['sha256']}`"
        intake = intake.replace(idle_line, "SWAPPED_BINDING", 1)
        intake = intake.replace(sit_line, f"- `{sit['path']}`: `{idle['sha256']}`", 1)
        intake = intake.replace("SWAPPED_BINDING", f"- `{idle['path']}`: `{sit['sha256']}`", 1)
        intake_path.write_text(intake, encoding="utf-8")
        rights["canonicalIntake"]["sha256"] = CHECKER.sha256_file(intake_path)
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("does not bind runtimeExports.idle" in failure for failure in failures))
        self.assertTrue(any("does not bind runtimeExports.sit" in failure for failure in failures))

    def test_orange_intake_rejects_another_release_preset_identity(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        rights["releasePreset"] = "solid-black"
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("releasePreset must be orange-tabby" in failure for failure in failures))

    def test_invalid_utf8_intake_returns_an_actionable_failure(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        intake_path = rights_path.parent / rights["canonicalIntake"]["path"]
        intake_path.write_bytes(b"\xff\xfe\xfd")
        rights["canonicalIntake"]["sha256"] = CHECKER.sha256_file(intake_path)
        rights_path.write_text(json.dumps(rights), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("invalid UTF-8 in canonicalIntake" in failure for failure in failures))

    def test_invalid_utf8_release_json_returns_actionable_failures(self) -> None:
        for record_name in ("rights", "motion review"):
            with self.subTest(record=record_name):
                scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
                rights_path, manifest_path = make_release_records(scene_dir)
                target = rights_path if record_name == "rights" else manifest_path
                target.write_bytes(b"\xff\xfe\xfd")

                failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

                expected = (
                    "invalid rights/provenance record"
                    if record_name == "rights"
                    else "invalid motion-review manifest"
                )
                self.assertTrue(any(expected in failure for failure in failures))

    def test_release_records_report_malformed_collections_without_crashing(self) -> None:
        scene_dir = make_fixture(CHECKER.FIRST_RELEASE_CAT_PRESETS)
        rights_path, manifest_path = make_release_records(scene_dir)
        rights = json.loads(rights_path.read_text(encoding="utf-8"))
        rights["presets"] = None
        rights["actions"] = None
        rights["editableAuthority"]["governsActions"] = None
        rights_path.write_text(json.dumps(rights), encoding="utf-8")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["presets"] = None
        manifest["actions"] = None
        manifest["viewports"] = None
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        failures = validate_release_fixture(scene_dir, rights_path, manifest_path)

        self.assertTrue(any("rights record: presets must be an array" in failure for failure in failures))
        self.assertTrue(any("rights record: actions must be an array" in failure for failure in failures))
        self.assertTrue(any("governsActions must be an array" in failure for failure in failures))
        self.assertTrue(any("motion review: presets must be an array" in failure for failure in failures))
        self.assertTrue(any("motion review: actions must be an array" in failure for failure in failures))
        self.assertTrue(any("motion review: viewports must be an array" in failure for failure in failures))

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

    def test_prototype_profile_allows_the_declared_orange_shape_preview(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        for action in ACTION_FRAMES:
            orange_path = scene_dir / "cat" / "orange-tabby" / f"{action}.png"
            orange = Image.open(orange_path).convert("RGBA")
            orange.putpixel((12, 12), (0, 0, 0, 0))
            orange.save(orange_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertFalse(any("alpha must match gray-white-tabby" in failure for failure in failures))

    def test_release_contract_rejects_the_orange_preview_alpha(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        for action in ACTION_FRAMES:
            orange_path = scene_dir / "cat" / "orange-tabby" / f"{action}.png"
            orange = Image.open(orange_path).convert("RGBA")
            orange.putpixel((12, 12), (0, 0, 0, 0))
            orange.save(orange_path)
        release_contract = CHECKER.AssetProfile("release-contract", CHECKER.CURRENT_CAT_PRESETS)

        failures = CHECKER.validate_assets(scene_dir, release_contract)

        for action in ACTION_FRAMES:
            self.assertTrue(
                any(
                    f"orange-tabby/{action}: {action} alpha must match gray-white-tabby"
                    in failure
                    for failure in failures
                ),
                action,
            )

    def test_prototype_still_requires_shared_alpha_for_an_ordinary_derivative(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        black_idle_path = scene_dir / "cat" / "solid-black" / "idle.png"
        black_idle = Image.open(black_idle_path).convert("RGBA")
        black_idle.putpixel((12, 12), (0, 0, 0, 0))
        black_idle.save(black_idle_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("idle alpha must match gray-white-tabby" in failure for failure in failures))

    def test_awake_rest_requires_binary_alpha_for_pixel_finish(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        lie_path = scene_dir / "cat" / "gray-white-tabby" / "lie.png"
        lie = Image.open(lie_path).convert("RGBA")
        lie.putpixel((20, 20), (90, 100, 110, 128))
        lie.save(lie_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("gray-white-tabby/lie: refined pixel sheet" in failure for failure in failures))

    def test_deep_sleep_requires_binary_alpha_for_pixel_finish(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        sleep_path = scene_dir / "cat" / "gray-white-tabby" / "sleep.png"
        sleep = Image.open(sleep_path).convert("RGBA")
        sleep.putpixel((20, 20), (90, 100, 110, 128))
        sleep.save(sleep_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(any("gray-white-tabby/sleep: refined pixel sheet" in failure for failure in failures))

    def test_cross_action_scale_rejects_low_idle_mass_relative_to_walk(self) -> None:
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
            any(
                "gray-white-tabby/idle: apparent linear scale is too low across idle/walk"
                in failure
                for failure in failures
            )
        )

    def test_cross_action_scale_rejects_low_walk_mass_relative_to_idle(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        walk_path = scene_dir / "cat" / "gray-white-tabby" / "walk.png"
        low_mass_walk = Image.new("RGBA", (96 * 8, 96), (0, 0, 0, 0))
        for frame_index in range(8):
            low_mass_walk.paste(
                (100 + frame_index, 110, 120, 255),
                (frame_index * 96 + 28, 32, frame_index * 96 + 68, 92),
            )
        low_mass_walk.save(walk_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(
            any(
                "gray-white-tabby/walk: apparent linear scale is too low across idle/walk"
                in failure
                for failure in failures
            )
        )

    def test_cross_action_scale_rejects_low_sit_mass_relative_to_walk(self) -> None:
        scene_dir = make_fixture(CHECKER.CURRENT_CAT_PRESETS)
        sit_path = scene_dir / "cat" / "gray-white-tabby" / "sit.png"
        low_mass_sit = Image.new("RGBA", (96 * 4, 96), (0, 0, 0, 0))
        for frame_index in range(4):
            low_mass_sit.paste(
                (100 + frame_index, 110, 120, 255),
                (frame_index * 96 + 30, 34, frame_index * 96 + 66, 92),
            )
        low_mass_sit.save(sit_path)

        failures = CHECKER.validate_assets(scene_dir, CHECKER.ASSET_PROFILES["prototype"])

        self.assertTrue(
            any(
                "gray-white-tabby/sit: apparent linear scale is too low across sit/walk"
                in failure
                for failure in failures
            )
        )

    def test_source_authority_uses_fixed_scale_and_bottom_center_registration(self) -> None:
        authority = SCALE.CrossActionScaleAuthority(
            name="test appearance",
            source_scale_by_action={"idle": 0.5, "sit": 0.5, "walk": 0.5},
        )
        subject = Image.new("RGBA", (40, 80), (80, 90, 100, 255))

        pose = authority.normalize("walk", [subject])[0]

        self.assertEqual(pose.sprite_size, (20, 40))
        self.assertEqual(pose.paste, (38, 52))
        self.assertEqual(pose.source_scale, 0.5)

    def test_source_authority_rejects_oversize_art_instead_of_refitting(self) -> None:
        authority = SCALE.CrossActionScaleAuthority(
            name="test appearance",
            source_scale_by_action={"idle": 1, "sit": 1, "walk": 1},
        )

        with self.assertRaisesRegex(ValueError, "re-author the source composition"):
            authority.normalize(
                "walk",
                [Image.new("RGBA", (93, 80), (0, 0, 0, 255))],
            )

    def test_pre_fix_cross_action_measurement_remains_a_failing_record(self) -> None:
        baseline_path = (
            Path(__file__).resolve().parents[1]
            / "artifacts/art/runtime-motion-review/2026-08-20-cross-action-scale-v1"
            / "baseline-measurement.json"
        )
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))

        for result in baseline["results"]:
            ratio = SCALE.apparent_linear_scale_ratio(
                result["stationaryFrameMasses"],
                result["walkingFrameMasses"],
            )
            self.assertAlmostEqual(ratio, result["linearScaleRatio"])
            self.assertLess(ratio, result["minimumLinearScaleRatio"])
            self.assertEqual(result["result"], "fail")


if __name__ == "__main__":
    unittest.main()
