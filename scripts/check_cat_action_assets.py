#!/usr/bin/env python3
"""Validate CatStar runtime cat action sheets.

The checks are intentionally structural. They do not claim that generated art is
final, but they catch common product-asset regressions: wrong sheet dimensions,
empty frames, floating baselines, accidental pixel islands, and extreme frame
mass changes.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import struct
import warnings
import zipfile
import zlib
import xml.etree.ElementTree as ET
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from statistics import median

from PIL import Image, UnidentifiedImageError

from cat_cross_action_scale import (
    MIN_STATIONARY_TO_WALK_LINEAR_SCALE_RATIO,
    apparent_linear_scale_ratio,
    sheet_frame_masses,
)


FRAME = 96
ALPHA_THRESHOLD = 24
MIN_FRAME_AREA = 2_000
MAX_SMALL_COMPONENT_AREA = 64
MAX_BOTTOM_RANGE = 6
MAX_AREA_RANGE_RATIO = 0.28
MAX_REFINED_PIXEL_COLORS = 128
MIN_ROUNDED_IDLE_HEIGHT = 68
REFINED_PIXEL_ACTIONS = {"idle", "sit", "walk", "interact", "lie", "sleep"}
SCENE_ASSET_DIR = Path("public/assets/scenes/window-room")
RELEASE_RIGHTS_RECORD = Path("artifacts/art/release/cat-rights-and-provenance.json")
RELEASE_MOTION_REVIEW = Path("artifacts/art/runtime-motion-review/first-release/manifest.json")
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
    independent_alpha_previews: frozenset[str] = frozenset()


ASSET_PROFILES = {
    "prototype": AssetProfile(
        "prototype",
        CURRENT_CAT_PRESETS,
        independent_alpha_previews=frozenset({"orange-tabby"}),
    ),
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
RELEASE_VIEWPORTS = {"1280x720", "390x844"}
RELEASE_EVIDENCE_FIELDS = ("video", "entryPoster", "exitPoster")
REQUIRED_RIGHTS_GRANTS = (
    "modify",
    "publicBeta",
    "paidDistribution",
    "marketing",
    "appStore",
    "worldwideDigitalDistribution",
)
CANONICAL_ORANGE_AUTHORITY_DIR = Path(
    "artifacts/art/candidates/active/product-cat-orange-tabby-v1/sources"
)
MAX_AUTHORITY_DECODED_BYTES = 64 * 1024 * 1024
REQUIRED_INTAKE_ITEMS = (
    "source.creator",
    "source.account",
    "source.creation",
    "source.editable_authority",
    "source.authority_sha256",
    "source.runtime_exports",
    "source.rounded_identity",
    "source.single_authority",
    "authorship.human_process",
    "authorship.ai_disclosure",
    "authorship.third_party_inputs",
    "authorship.no_imitation",
    "authorship.preview_comparison_only",
    "authorship.direction_reference_only",
    "rights.agreement",
    "rights.modify",
    "rights.public_beta",
    "rights.paid_distribution",
    "rights.marketing",
    "rights.app_store",
    "rights.scope_terms",
    "rights.restrictions",
    "rights.immutable_evidence",
    "review.appearance_lock",
    "review.marking_identity",
    "review.production_contract",
    "review.alpha_geometry",
    "review.structural_assets",
    "review.passport_runtime",
    "review.motion_evidence",
    "review.human_decisions",
    "review.scene_contrast",
    "review.repository_gates",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def current_motion_source_fingerprint() -> str:
    import capture_cat_runtime_review as screenshot_review

    base_fingerprint, _ = screenshot_review.source_fingerprint()
    digest = hashlib.sha256(base_fingerprint.encode("utf-8"))
    script_dir = Path(__file__).resolve().parent
    for path in (
        script_dir / "capture_cat_motion_review.py",
        script_dir / "capture_cat_motion_review.mjs",
        script_dir / "record_cat_motion_review.py",
    ):
        relative = path.relative_to(script_dir.parent).as_posix()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def load_json_record(path: Path, label: str) -> tuple[dict[str, object] | None, list[str]]:
    if not path.exists():
        return None, [f"first-release profile: missing {label} {path}"]
    try:
        record = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        return None, [f"first-release profile: invalid {label} {path}: {error}"]
    if not isinstance(record, dict):
        return None, [f"first-release profile: invalid {label} {path}: expected an object"]
    return record, []


def string_collection(
    value: object,
    label: str,
) -> tuple[set[str] | None, list[str]]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        return None, [f"{label} must be an array of strings"]
    return set(value), []


def resolve_hashed_file(
    record: object,
    record_dir: Path,
    label: str,
) -> tuple[Path | None, list[str]]:
    if not isinstance(record, dict):
        return None, [f"first-release rights record: {label} must be an object"]
    relative = record.get("path")
    expected_hash = record.get("sha256")
    if not isinstance(relative, str) or not relative or not isinstance(expected_hash, str):
        return None, [f"first-release rights record: {label} requires path and sha256"]
    path = (record_dir / relative).resolve()
    if not path.is_file():
        return None, [f"first-release rights record: missing {label} file {path}"]
    if sha256_file(path) != expected_hash:
        return path, [f"first-release rights record: {label} hash mismatch for {path}"]
    return path, []


def validate_hashed_files(
    records: object,
    record_dir: Path,
    label: str,
) -> list[str]:
    if not isinstance(records, list) or not records:
        return [f"first-release rights record: {label} must contain hashed files"]
    failures: list[str] = []
    for index, record in enumerate(records):
        _, record_failures = resolve_hashed_file(record, record_dir, f"{label}[{index}]")
        failures.extend(record_failures)
    return failures


def load_hashed_text(
    record: object,
    record_dir: Path,
    label: str,
) -> tuple[Path | None, str | None, list[str]]:
    if not isinstance(record, dict):
        return None, None, [f"first-release rights record: {label} must be an object"]
    relative = record.get("path")
    expected_hash = record.get("sha256")
    if not isinstance(relative, str) or not relative or not isinstance(expected_hash, str):
        return None, None, [f"first-release rights record: {label} requires path and sha256"]
    path = (record_dir / relative).resolve()
    try:
        payload = path.read_bytes()
    except OSError as error:
        return None, None, [f"first-release rights record: unable to read {label} {path}: {error}"]
    if hashlib.sha256(payload).hexdigest() != expected_hash:
        return path, None, [f"first-release rights record: {label} hash mismatch for {path}"]
    try:
        return path, payload.decode("utf-8"), []
    except UnicodeDecodeError as error:
        return path, None, [f"first-release rights record: invalid UTF-8 in {label} {path}: {error}"]


def validate_completed_intake(
    intake_path: Path,
    intake: str,
    intake_items: object,
) -> list[str]:
    failures: list[str] = []
    if intake_path.name != "intake-checklist.md" or "# Orange Tabby v1 Production Intake" not in intake:
        failures.append("first-release rights record: canonicalIntake must be the Issue #23 intake")
    if "**Issue:** #23" not in intake:
        failures.append("first-release rights record: canonicalIntake must identify Issue #23")
    if not isinstance(intake_items, dict):
        failures.append("first-release rights record: intakeItems must be an object")
    elif set(intake_items) != set(REQUIRED_INTAKE_ITEMS):
        failures.append("first-release rights record: intakeItems must match the canonical schema")
    elif any(intake_items[item] is not True for item in REQUIRED_INTAKE_ITEMS):
        failures.append("first-release rights record: every canonical intake item must be complete")
    if "**Status:** Complete" not in intake or "**Decision:** `approved-for-target`" not in intake:
        failures.append("first-release rights record: canonicalIntake is not approved and complete")
    if "- [ ]" in intake or "___" in intake or "**Status:** Not received" in intake:
        failures.append("first-release rights record: canonicalIntake still has incomplete fields")
    return failures


def validate_intake_bindings(
    intake: str,
    editable_authority: object,
    runtime_exports: object,
    terms_evidence: object,
) -> list[str]:
    failures: list[str] = []
    heading = "## Bound Delivery Hashes"
    _, separator, binding_section = intake.partition(heading)
    if not separator:
        return ["first-release rights record: canonicalIntake lacks structured bindings"]
    binding_lines = set(binding_section.splitlines())
    bindings: list[tuple[str, object]] = [("editableAuthority", editable_authority)]
    if isinstance(runtime_exports, dict):
        bindings.extend(
            (f"runtimeExports.{action}", runtime_exports[action])
            for action in sorted(runtime_exports)
        )
    if isinstance(terms_evidence, list):
        bindings.extend(
            (f"termsEvidence[{index}]", record)
            for index, record in enumerate(terms_evidence)
        )
    for label, binding in bindings:
        if not isinstance(binding, dict):
            continue
        relative = binding.get("path")
        expected_hash = binding.get("sha256")
        if (
            isinstance(relative, str)
            and isinstance(expected_hash, str)
            and f"- `{relative}`: `{expected_hash}`" not in binding_lines
        ):
            failures.append(
                f"first-release rights record: canonicalIntake does not bind {label}"
            )
    return failures


def read_authority_image(payload: bytes) -> None:
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(payload)) as image:
            image.load()


def validate_krita_layer_payload(payload: bytes) -> bool:
    stream = io.BytesIO(payload)
    fields: dict[str, int] = {}
    for expected_key in ("VERSION", "TILEWIDTH", "TILEHEIGHT", "PIXELSIZE", "DATA"):
        line = stream.readline()
        try:
            key, raw_value = line.decode("ascii").rstrip("\n").split(" ", 1)
            value = int(raw_value)
        except (UnicodeDecodeError, ValueError) as error:
            raise ValueError("invalid Krita tile header") from error
        if key != expected_key:
            raise ValueError("invalid Krita tile header")
        fields[key] = value
    if (
        fields["VERSION"] != 2
        or fields["TILEWIDTH"] != 64
        or fields["TILEHEIGHT"] != 64
        or not 1 <= fields["PIXELSIZE"] <= 64
        or not 0 <= fields["DATA"] <= len(payload)
    ):
        raise ValueError("invalid Krita tile geometry")
    raw_tile_size = fields["TILEWIDTH"] * fields["TILEHEIGHT"] * fields["PIXELSIZE"]
    for _ in range(fields["DATA"]):
        try:
            raw_x, raw_y, compression, raw_size = (
                part.decode("ascii") for part in stream.readline().rstrip(b"\n").split(b",")
            )
            int(raw_x)
            int(raw_y)
            tile_size = int(raw_size)
        except (UnicodeDecodeError, ValueError) as error:
            raise ValueError("invalid Krita tile record") from error
        if compression not in {"NONE", "LZF"} or tile_size <= 0:
            raise ValueError("invalid Krita tile record")
        encoded_tile = stream.read(tile_size)
        if len(encoded_tile) != tile_size:
            raise ValueError("truncated Krita tile payload")
        if compression == "NONE":
            if tile_size != raw_tile_size:
                raise ValueError("invalid Krita raw tile size")
        else:
            decompress_lzf_exact(encoded_tile, raw_tile_size)
    if stream.read(1):
        raise ValueError("unexpected Krita layer payload data")
    return fields["DATA"] > 0


def decompress_exact(payload: bytes, expected_size: int) -> None:
    if expected_size < 0 or expected_size > MAX_AUTHORITY_DECODED_BYTES:
        raise ValueError("decoded payload exceeds authority limit")
    decompressor = zlib.decompressobj()
    decoded = decompressor.decompress(payload, expected_size + 1)
    if len(decoded) != expected_size or not decompressor.eof or decompressor.unused_data:
        raise ValueError("invalid compressed payload")


def decompress_lzf_exact(payload: bytes, expected_size: int) -> None:
    if expected_size < 0 or expected_size > MAX_AUTHORITY_DECODED_BYTES:
        raise ValueError("decoded payload exceeds authority limit")
    decoded = bytearray()
    offset = 0
    while offset < len(payload):
        control = payload[offset]
        offset += 1
        if control < 32:
            literal_length = control + 1
            if offset + literal_length > len(payload):
                raise ValueError("truncated LZF literal")
            decoded.extend(payload[offset : offset + literal_length])
            offset += literal_length
        else:
            match_length = control >> 5
            reference = len(decoded) - ((control & 0x1F) << 8) - 1
            if match_length == 7:
                if offset >= len(payload):
                    raise ValueError("truncated LZF match length")
                match_length += payload[offset]
                offset += 1
            if offset >= len(payload):
                raise ValueError("truncated LZF match offset")
            reference -= payload[offset]
            offset += 1
            match_length += 2
            if reference < 0:
                raise ValueError("invalid LZF match offset")
            for _ in range(match_length):
                if reference >= len(decoded):
                    raise ValueError("invalid LZF match")
                decoded.append(decoded[reference])
                reference += 1
        if len(decoded) > expected_size:
            raise ValueError("LZF payload exceeds expected size")
    if len(decoded) != expected_size:
        raise ValueError("invalid LZF decoded size")


def decode_packbits_exact(payload: bytes, expected_size: int) -> None:
    decoded_size = 0
    offset = 0
    while offset < len(payload):
        control = payload[offset]
        offset += 1
        if control <= 127:
            run_length = control + 1
            if offset + run_length > len(payload):
                raise ValueError("truncated Photoshop PackBits literal")
            offset += run_length
        elif control == 128:
            continue
        else:
            run_length = 257 - control
            if offset >= len(payload):
                raise ValueError("truncated Photoshop PackBits run")
            offset += 1
        decoded_size += run_length
        if decoded_size > expected_size:
            raise ValueError("Photoshop PackBits row exceeds expected size")
    if decoded_size != expected_size:
        raise ValueError("invalid Photoshop PackBits row size")


def validate_zip_authority(path: Path, authority_format: str) -> list[str]:
    format_contracts = {
        "openraster": {
            "mimetype": b"image/openraster",
            "document": "stack.xml",
            "merged": "mergedimage.png",
            "layerTag": "layer",
            "layerAttribute": "src",
        },
        "krita": {
            "mimetype": b"application/x-krita",
            "document": "maindoc.xml",
            "merged": "mergedimage.png",
            "layerTag": "layer",
            "layerAttribute": None,
        },
    }
    contract = format_contracts[authority_format]
    try:
        with zipfile.ZipFile(path) as archive:
            first_entry = archive.infolist()[0] if archive.infolist() else None
            if (
                first_entry is None
                or first_entry.filename != "mimetype"
                or first_entry.compress_type != zipfile.ZIP_STORED
            ):
                return [f"first-release rights record: editableAuthority has invalid {authority_format} layout"]
            if archive.testzip() is not None:
                return [f"first-release rights record: editableAuthority {authority_format} is corrupt"]
            if archive.read("mimetype") != contract["mimetype"]:
                return [f"first-release rights record: editableAuthority has invalid {authority_format} mimetype"]
            stack = ET.fromstring(archive.read(str(contract["document"])))
            layers = list(stack.iter(str(contract["layerTag"])))
            if not layers:
                return [f"first-release rights record: editableAuthority {authority_format} has no layers"]
            layer_attribute = contract["layerAttribute"]
            layer_paths = (
                {
                    layer.attrib[str(layer_attribute)]
                    for layer in layers
                    if str(layer_attribute) in layer.attrib
                }
                if layer_attribute is not None
                else set()
            )
            if layer_attribute is not None and len(layer_paths) != len(layers):
                return [f"first-release rights record: editableAuthority {authority_format} has invalid layers"]
            for layer_path in layer_paths:
                read_authority_image(archive.read(layer_path))
            if authority_format == "krita":
                declared_paths = [layer.attrib["filename"] for layer in layers if layer.attrib.get("filename")]
                if not declared_paths:
                    return ["first-release rights record: editableAuthority krita has no layer payloads"]
                has_content = False
                for declared_path in declared_paths:
                    if declared_path.startswith("/") or ".." in declared_path.split("/"):
                        raise ValueError("invalid Krita layer path")
                    member_path = (
                        declared_path if declared_path.startswith("layers/") else f"layers/{declared_path}"
                    )
                    has_content |= validate_krita_layer_payload(archive.read(member_path))
                if not has_content:
                    return ["first-release rights record: editableAuthority krita has no editable layer data"]
            read_authority_image(archive.read(str(contract["merged"])))
    except (
        OSError,
        KeyError,
        RuntimeError,
        NotImplementedError,
        ET.ParseError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        zipfile.BadZipFile,
        ValueError,
    ) as error:
        return [
            f"first-release rights record: editableAuthority is not parseable "
            f"{authority_format}: {error}"
        ]
    return []


def validate_photoshop(path: Path) -> list[str]:
    try:
        payload = path.read_bytes()
        if len(payload) < 40 or payload[:4] != b"8BPS":
            raise ValueError("missing Photoshop signature")
        version, channels, height, width, depth, color_mode = struct.unpack(">H6xHIIHH", payload[4:26])
        if version == 2:
            raise ValueError("Photoshop PSB is not supported")
        if version != 1 or not 1 <= channels <= 56:
            raise ValueError("invalid Photoshop header")
        if width <= 0 or height <= 0 or depth not in {1, 8, 16, 32} or color_mode > 15:
            raise ValueError("invalid Photoshop canvas")
        offset = 26
        for section_name in ("color mode", "image resources"):
            if offset + 4 > len(payload):
                raise ValueError(f"missing {section_name} section")
            section_length = struct.unpack(">I", payload[offset : offset + 4])[0]
            offset += 4
            offset += section_length
            if offset > len(payload):
                raise ValueError(f"truncated {section_name} section")
        if offset + 4 > len(payload):
            raise ValueError("missing layer and mask section")
        section_length = struct.unpack(">I", payload[offset : offset + 4])[0]
        offset += 4
        section_end = offset + section_length
        if section_length < 6 or section_end > len(payload):
            raise ValueError("Photoshop authority has no complete layer data")
        layer_info_length = struct.unpack(">I", payload[offset : offset + 4])[0]
        layer_info_start = offset + 4
        layer_info_end = layer_info_start + layer_info_length
        if layer_info_length < 2 or layer_info_end > section_end:
            raise ValueError("truncated Photoshop layer info")
        layer_count = abs(struct.unpack(">h", payload[layer_info_start : layer_info_start + 2])[0])
        if layer_count == 0:
            raise ValueError("Photoshop authority has no layers")
        record_offset = layer_info_start + 2
        channel_records: list[tuple[int, int, int]] = []
        for _ in range(layer_count):
            if record_offset + 18 > layer_info_end:
                raise ValueError("truncated Photoshop layer record")
            top, left, bottom, right = struct.unpack(">iiii", payload[record_offset : record_offset + 16])
            if bottom <= top or right <= left:
                raise ValueError("invalid Photoshop layer bounds")
            channel_count = struct.unpack(">H", payload[record_offset + 16 : record_offset + 18])[0]
            layer_width = right - left
            layer_height = bottom - top
            row_bytes = (layer_width * depth + 7) // 8
            record_offset += 18
            if channel_count == 0 or record_offset + channel_count * 6 + 16 > layer_info_end:
                raise ValueError("invalid Photoshop layer channels")
            for _ in range(channel_count):
                channel_length = struct.unpack(">I", payload[record_offset + 2 : record_offset + 6])[0]
                if channel_length < 2:
                    raise ValueError("invalid Photoshop channel data")
                channel_records.append((channel_length, row_bytes, layer_height))
                record_offset += 6
            if payload[record_offset : record_offset + 4] != b"8BIM":
                raise ValueError("invalid Photoshop layer signature")
            record_offset += 12
            extra_length = struct.unpack(">I", payload[record_offset : record_offset + 4])[0]
            record_offset += 4
            extra_end = record_offset + extra_length
            if extra_end > layer_info_end:
                raise ValueError("truncated Photoshop layer extra data")
            for _ in range(2):
                if record_offset + 4 > extra_end:
                    raise ValueError("truncated Photoshop layer extra data")
                block_length = struct.unpack(">I", payload[record_offset : record_offset + 4])[0]
                record_offset += 4 + block_length
                if record_offset > extra_end:
                    raise ValueError("truncated Photoshop layer extra data")
            if record_offset >= extra_end:
                raise ValueError("missing Photoshop layer name")
            name_length = payload[record_offset]
            padded_name_length = (name_length + 4) & ~3
            if record_offset + padded_name_length > extra_end:
                raise ValueError("truncated Photoshop layer name")
            record_offset = extra_end
        channel_data_end = record_offset + sum(channel_length for channel_length, _, _ in channel_records)
        if channel_data_end > layer_info_end or layer_info_end - channel_data_end > 1:
            raise ValueError("truncated Photoshop layer channel payload")
        channel_offset = record_offset
        for channel_length, row_bytes, row_count in channel_records:
            channel_end = channel_offset + channel_length
            compression = struct.unpack(">H", payload[channel_offset : channel_offset + 2])[0]
            encoded = payload[channel_offset + 2 : channel_end]
            expected_size = row_bytes * row_count
            if expected_size > MAX_AUTHORITY_DECODED_BYTES:
                raise ValueError("Photoshop channel exceeds authority limit")
            if compression == 0:
                if len(encoded) != expected_size:
                    raise ValueError("invalid Photoshop raw channel payload")
            elif compression == 1:
                table_size = row_count * 2
                if len(encoded) < table_size:
                    raise ValueError("truncated Photoshop RLE row table")
                row_lengths = struct.unpack(f">{row_count}H", encoded[:table_size])
                row_offset = table_size
                for row_length in row_lengths:
                    row_end = row_offset + row_length
                    if row_end > len(encoded):
                        raise ValueError("truncated Photoshop RLE row")
                    decode_packbits_exact(encoded[row_offset:row_end], row_bytes)
                    row_offset = row_end
                if row_offset != len(encoded):
                    raise ValueError("unexpected Photoshop RLE channel data")
            elif compression == 2:
                decompress_exact(encoded, expected_size)
            else:
                raise ValueError("unsupported Photoshop channel compression")
            channel_offset = channel_end
        offset = section_end
        if offset + 2 > len(payload) or struct.unpack(">H", payload[offset : offset + 2])[0] > 3:
            raise ValueError("invalid Photoshop image data")
    except (OSError, struct.error, ValueError) as error:
        return [f"first-release rights record: editableAuthority is not parseable photoshop: {error}"]
    return []


def validate_aseprite(path: Path) -> list[str]:
    try:
        payload = path.read_bytes()
        if len(payload) < 144:
            raise ValueError("truncated Aseprite file")
        file_size, magic, frame_count, width, height, depth = struct.unpack("<IHHHHH", payload[:14])
        if file_size != len(payload) or magic != 0xA5E0 or frame_count <= 0:
            raise ValueError("invalid Aseprite header")
        if width <= 0 or height <= 0 or depth not in {8, 16, 32}:
            raise ValueError("invalid Aseprite canvas")
        offset = 128
        layer_types: list[int] = []
        cel_links: set[tuple[int, int]] = set()
        for frame_index in range(frame_count):
            if offset + 16 > len(payload):
                raise ValueError("truncated Aseprite frame")
            frame_size, frame_magic, old_chunk_count = struct.unpack("<IHH", payload[offset : offset + 8])
            new_chunk_count = struct.unpack("<I", payload[offset + 12 : offset + 16])[0]
            if frame_magic != 0xF1FA or frame_size < 16 or offset + frame_size > len(payload):
                raise ValueError("invalid Aseprite frame")
            chunk_count = new_chunk_count or old_chunk_count
            chunk_offset = offset + 16
            for _ in range(chunk_count):
                if chunk_offset + 6 > offset + frame_size:
                    raise ValueError("truncated Aseprite chunk")
                chunk_size, chunk_type = struct.unpack("<IH", payload[chunk_offset : chunk_offset + 6])
                if chunk_size < 6 or chunk_offset + chunk_size > offset + frame_size:
                    raise ValueError("invalid Aseprite chunk")
                body = payload[chunk_offset + 6 : chunk_offset + chunk_size]
                if chunk_type == 0x2004:
                    if len(body) < 18:
                        raise ValueError("truncated Aseprite layer chunk")
                    layer_type = struct.unpack("<H", body[2:4])[0]
                    name_length = struct.unpack("<H", body[16:18])[0]
                    required_length = 18 + name_length + (4 if layer_type == 2 else 0)
                    if layer_type not in {0, 1, 2} or len(body) < required_length:
                        raise ValueError("invalid Aseprite layer chunk")
                    body[18 : 18 + name_length].decode("utf-8")
                    layer_types.append(layer_type)
                elif chunk_type == 0x2005:
                    if len(body) < 16:
                        raise ValueError("truncated Aseprite cel chunk")
                    layer_index = struct.unpack("<H", body[:2])[0]
                    cel_type = struct.unpack("<H", body[7:9])[0]
                    if layer_index >= len(layer_types) or layer_types[layer_index] == 1:
                        raise ValueError("Aseprite cel references an invalid layer")
                    if cel_type in {0, 2}:
                        if len(body) < 20 or layer_types[layer_index] != 0:
                            raise ValueError("invalid Aseprite image cel")
                        cel_width, cel_height = struct.unpack("<HH", body[16:20])
                        if cel_width == 0 or cel_height == 0 or cel_width > width or cel_height > height:
                            raise ValueError("invalid Aseprite cel bounds")
                        expected_size = cel_width * cel_height * (depth // 8)
                        image_data = body[20:]
                        if cel_type == 0:
                            if len(image_data) != expected_size:
                                raise ValueError("invalid Aseprite raw cel payload")
                        else:
                            decompress_exact(image_data, expected_size)
                    elif cel_type == 1:
                        if len(body) != 18:
                            raise ValueError("invalid Aseprite linked cel")
                        linked_frame = struct.unpack("<H", body[16:18])[0]
                        if linked_frame >= frame_index or (linked_frame, layer_index) not in cel_links:
                            raise ValueError("Aseprite linked cel has no source")
                    elif cel_type == 3:
                        if len(body) < 48 or layer_types[layer_index] != 2:
                            raise ValueError("invalid Aseprite tilemap cel")
                        tile_width, tile_height, bits_per_tile = struct.unpack("<HHH", body[16:22])
                        if (
                            tile_width == 0
                            or tile_height == 0
                            or tile_width > width
                            or tile_height > height
                            or bits_per_tile != 32
                        ):
                            raise ValueError("invalid Aseprite tilemap cel")
                        decompress_exact(body[48:], tile_width * tile_height * 4)
                    else:
                        raise ValueError("unsupported Aseprite cel type")
                    cel_links.add((frame_index, layer_index))
                chunk_offset += chunk_size
            if chunk_offset != offset + frame_size:
                raise ValueError("Aseprite frame size mismatch")
            offset += frame_size
        if offset != len(payload) or not layer_types or not cel_links:
            raise ValueError("Aseprite authority requires layer and cel chunks")
    except (OSError, struct.error, UnicodeDecodeError, ValueError, zlib.error) as error:
        return [f"first-release rights record: editableAuthority is not parseable aseprite: {error}"]
    return []


def validate_editable_authority(
    record: object,
    record_dir: Path,
    canonical_authority_dir: Path,
) -> list[str]:
    authority_path, failures = resolve_hashed_file(record, record_dir, "editableAuthority")
    if not isinstance(record, dict):
        return failures
    authority_format = record.get("format")
    governed_actions, collection_failures = string_collection(
        record.get("governsActions"),
        "first-release rights record: editableAuthority.governsActions",
    )
    failures.extend(collection_failures)
    format_validators = {
        "openraster": (".ora", validate_zip_authority),
        "krita": (".kra", validate_zip_authority),
        "photoshop": (".psd", validate_photoshop),
        "aseprite": (".aseprite", validate_aseprite),
    }
    if authority_format not in format_validators:
        failures.append(
            "first-release rights record: editableAuthority.format must be one of "
            "openraster, krita, photoshop, or aseprite"
        )
    if authority_path is not None:
        if not authority_path.is_relative_to(canonical_authority_dir.resolve()):
            failures.append(
                "first-release rights record: editableAuthority must come from the canonical "
                "product-cat-orange-tabby-v1/sources package"
            )
        if authority_format in format_validators:
            expected_suffix, validator = format_validators[authority_format]
            if authority_path.suffix.lower() != expected_suffix:
                failures.append(
                    f"first-release rights record: editableAuthority {authority_format} "
                    f"must use {expected_suffix}"
                )
            elif authority_format in {"openraster", "krita"}:
                failures.extend(validator(authority_path, authority_format))
            else:
                failures.extend(validator(authority_path))
    if governed_actions is not None and governed_actions != REQUIRED_ACTIONS:
        failures.append("first-release rights record: editableAuthority must govern all ten actions")
    return failures


def validate_runtime_export_hashes(
    records: object,
    record_dir: Path,
    asset_dir: Path,
    release_preset: str | None,
    action_configs: dict[str, object],
) -> list[str]:
    if not isinstance(records, dict):
        return ["first-release rights record: runtimeExports must be an object"]
    action_names, collection_failures = string_collection(
        list(records),
        "first-release rights record: runtimeExports actions",
    )
    failures = list(collection_failures)
    if action_names is None or action_names != REQUIRED_ACTIONS:
        failures.append("first-release rights record: runtimeExports must cover all ten actions")
        return failures
    if release_preset is None:
        return failures
    for action in sorted(REQUIRED_ACTIONS):
        export_path, export_failures = resolve_hashed_file(
            records[action],
            record_dir,
            f"runtimeExports.{action}",
        )
        failures.extend(export_failures)
        config = action_configs.get(action)
        file_name = config.get("file") if isinstance(config, dict) else None
        if not isinstance(file_name, str):
            continue
        expected_path = (asset_dir / release_preset / file_name).resolve()
        if export_path is not None and export_path != expected_path:
            failures.append(
                f"first-release rights record: runtimeExports.{action} must bind {expected_path}"
            )
    return failures


def validate_release_rights_record(
    path: Path,
    profile: AssetProfile,
    asset_dir: Path,
    action_configs: dict[str, object],
    canonical_authority_dir: Path,
) -> tuple[str | None, list[str]]:
    record, failures = load_json_record(path, "rights/provenance record")
    if record is None:
        return None, failures
    if record.get("schemaVersion") != 1:
        failures.append("first-release rights record: expected schemaVersion 1")
    if record.get("status") != "approved-for-target":
        failures.append("first-release rights record: status must be approved-for-target")
    presets, collection_failures = string_collection(
        record.get("presets"),
        "first-release rights record: presets",
    )
    failures.extend(collection_failures)
    if presets is not None and (
        presets != set(profile.presets) or len(record["presets"]) != len(profile.presets)
    ):
        failures.append("first-release rights record: presets must cover the release profile")
    actions, collection_failures = string_collection(
        record.get("actions"),
        "first-release rights record: actions",
    )
    failures.extend(collection_failures)
    if actions is not None and (
        actions != REQUIRED_ACTIONS or len(record["actions"]) != len(REQUIRED_ACTIONS)
    ):
        failures.append("first-release rights record: actions must cover all ten actions")

    release_preset = record.get("releasePreset")
    if release_preset != "orange-tabby":
        failures.append(
            "first-release rights record: releasePreset must be orange-tabby for the Issue #23 intake"
        )
        release_preset = None

    for field in (
        "creator",
        "accountOwner",
        "creationDate",
        "sourceBrief",
        "transformationLineage",
        "reviewer",
        "reviewDate",
        "approvedTarget",
    ):
        if not isinstance(record.get(field), str) or not str(record[field]).strip():
            failures.append(f"first-release rights record: {field} is required")
    third_party_inputs = record.get("thirdPartyInputs")
    if not isinstance(third_party_inputs, list):
        failures.append("first-release rights record: thirdPartyInputs must be recorded")
    rights_grant = record.get("rightsGrant")
    if not isinstance(rights_grant, dict):
        failures.append("first-release rights record: rightsGrant is required")
    else:
        for grant in REQUIRED_RIGHTS_GRANTS:
            if rights_grant.get(grant) is not True:
                failures.append(f"first-release rights record: rightsGrant.{grant} must be true")

    intake_path, intake, intake_failures = load_hashed_text(
        record.get("canonicalIntake"),
        path.parent,
        "canonicalIntake",
    )
    failures.extend(intake_failures)
    if intake_path is not None and intake is not None:
        failures.extend(
            validate_completed_intake(
                intake_path,
                intake,
                record.get("intakeItems"),
            )
        )
        failures.extend(
            validate_intake_bindings(
                intake,
                record.get("editableAuthority"),
                record.get("runtimeExports"),
                record.get("termsEvidence"),
            )
        )
    failures.extend(
        validate_editable_authority(
            record.get("editableAuthority"),
            path.parent,
            canonical_authority_dir,
        )
    )
    failures.extend(
        validate_runtime_export_hashes(
            record.get("runtimeExports"),
            path.parent,
            asset_dir,
            release_preset,
            action_configs,
        )
    )
    failures.extend(validate_hashed_files(record.get("termsEvidence"), path.parent, "termsEvidence"))
    return release_preset, failures


def validate_release_motion_review(
    path: Path,
    release_preset: str | None,
    expected_fingerprint: str,
) -> list[str]:
    manifest, failures = load_json_record(path, "motion-review manifest")
    if manifest is None:
        return failures
    if release_preset is None:
        return failures
    if manifest.get("schemaVersion") != 1:
        failures.append("first-release motion review: expected schemaVersion 1")
    if manifest.get("profile") != "first-release":
        failures.append("first-release motion review: profile must be first-release")
    presets = manifest.get("presets")
    if not isinstance(presets, list) or any(not isinstance(item, str) for item in presets):
        failures.append("first-release motion review: presets must be an array of strings")
    elif presets != [release_preset]:
        failures.append("first-release motion review: must cover the declared release preset")
    actions, collection_failures = string_collection(
        manifest.get("actions"),
        "first-release motion review: actions",
    )
    failures.extend(collection_failures)
    if actions is not None and (
        actions != REQUIRED_ACTIONS or len(manifest["actions"]) != len(REQUIRED_ACTIONS)
    ):
        failures.append("first-release motion review: must cover all ten actions")
    viewports, collection_failures = string_collection(
        manifest.get("viewports"),
        "first-release motion review: viewports",
    )
    failures.extend(collection_failures)
    if viewports is not None and (
        viewports != RELEASE_VIEWPORTS or len(manifest["viewports"]) != len(RELEASE_VIEWPORTS)
    ):
        failures.append("first-release motion review: must cover desktop and mobile")
    if manifest.get("sourceFingerprint") != expected_fingerprint:
        failures.append("first-release motion review: source fingerprint is stale")

    entries = manifest.get("entries")
    if not isinstance(entries, list):
        return failures + ["first-release motion review: entries must be an array"]
    expected_matrix = {
        (release_preset, action, viewport)
        for action in REQUIRED_ACTIONS
        for viewport in RELEASE_VIEWPORTS
    }
    actual_matrix: set[tuple[object, object, object]] = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            failures.append(f"first-release motion review: entry {index} must be an object")
            continue
        actual_matrix.add((entry.get("coatPreset"), entry.get("action"), entry.get("viewport")))
        human_review = entry.get("humanReview")
        if entry.get("motionState") != "complete":
            failures.append(f"first-release motion review: entry {index} is incomplete")
        if (
            not isinstance(human_review, dict)
            or human_review.get("status") != "pass"
            or not isinstance(human_review.get("reviewer"), str)
            or not human_review["reviewer"].strip()
            or not isinstance(human_review.get("reviewedAt"), str)
            or not human_review["reviewedAt"].strip()
        ):
            failures.append(f"first-release motion review: entry {index} lacks a human pass")
        hashes = entry.get("evidenceSha256")
        for field in RELEASE_EVIDENCE_FIELDS:
            relative = entry.get(field)
            expected_hash = hashes.get(field) if isinstance(hashes, dict) else None
            if not isinstance(relative, str) or not isinstance(expected_hash, str):
                failures.append(
                    f"first-release motion review: entry {index} lacks hashed {field} evidence"
                )
                continue
            evidence_path = path.parent / relative
            if not evidence_path.is_file() or sha256_file(evidence_path) != expected_hash:
                failures.append(
                    f"first-release motion review: entry {index} has invalid {field} evidence"
                )
    if actual_matrix != expected_matrix or len(entries) != len(expected_matrix):
        failures.append("first-release motion review: expected a complete 20-entry matrix")
    return failures


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


def validate_shared_action_alpha(
    asset_dir: Path,
    profile: AssetProfile,
    action: str,
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
    for preset in profile.presets:
        if preset == "gray-white-tabby":
            continue
        if preset in profile.independent_alpha_previews:
            continue
        candidate_path = asset_dir / preset / file_name
        try:
            with Image.open(candidate_path) as source:
                candidate_alpha = source.convert("RGBA").getchannel("A").tobytes()
        except (OSError, UnidentifiedImageError):
            continue
        if candidate_alpha != master_alpha:
            failures.append(
                f"{preset}/{action}: {action} alpha must match gray-white-tabby"
            )
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
        return sheet_frame_masses(asset_dir / preset / file_name, frame_count)
    except (OSError, UnidentifiedImageError, ValueError):
        return []


def validate_stationary_walk_scale(
    asset_dir: Path,
    preset: str,
    stationary_action: str,
    stationary_config: dict[str, object],
    walk_config: dict[str, object],
) -> list[str]:
    stationary_areas = action_frame_areas(asset_dir, preset, stationary_config)
    walk_areas = action_frame_areas(asset_dir, preset, walk_config)
    if not stationary_areas or not walk_areas:
        return []
    minimum = MIN_STATIONARY_TO_WALK_LINEAR_SCALE_RATIO[stationary_action]
    linear_scale_ratio = apparent_linear_scale_ratio(stationary_areas, walk_areas)
    if linear_scale_ratio < minimum:
        stationary_mass = median(stationary_areas)
        walk_mass = median(walk_areas)
        smaller_action = "walk" if walk_mass < stationary_mass else stationary_action
        return [
            f"{preset}/{smaller_action}: apparent linear scale is too low across "
            f"{stationary_action}/walk: {linear_scale_ratio:.2%}; minimum is "
            f"{minimum:.0%}"
        ]
    return []


def validate_assets(
    scene_asset_dir: Path,
    profile: AssetProfile,
    *,
    release_rights_record: Path = RELEASE_RIGHTS_RECORD,
    release_motion_review: Path = RELEASE_MOTION_REVIEW,
    expected_release_fingerprint: str | None = None,
    canonical_authority_dir: Path = CANONICAL_ORANGE_AUTHORITY_DIR,
) -> list[str]:
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

    for action in sorted(REQUIRED_ACTIONS):
        config = actions.get(action)
        if isinstance(config, dict):
            failures.extend(validate_shared_action_alpha(asset_dir, profile, action, config))

    walk_config = actions.get("walk")
    if isinstance(walk_config, dict):
        for stationary_action in MIN_STATIONARY_TO_WALK_LINEAR_SCALE_RATIO:
            stationary_config = actions.get(stationary_action)
            if isinstance(stationary_config, dict):
                for preset in profile.presets:
                    failures.extend(
                        validate_stationary_walk_scale(
                            asset_dir,
                            preset,
                            stationary_action,
                            stationary_config,
                            walk_config,
                        )
                    )

    if profile.name == "first-release":
        release_preset, rights_failures = validate_release_rights_record(
            release_rights_record,
            profile,
            asset_dir,
            actions,
            canonical_authority_dir,
        )
        failures.extend(rights_failures)
        failures.extend(
            validate_release_motion_review(
                release_motion_review,
                release_preset,
                expected_release_fingerprint or current_motion_source_fingerprint(),
            )
        )

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
    parser.add_argument(
        "--release-rights-record",
        type=Path,
        default=RELEASE_RIGHTS_RECORD,
        help="machine-readable first-release rights and provenance approval",
    )
    parser.add_argument(
        "--release-motion-review",
        type=Path,
        default=RELEASE_MOTION_REVIEW,
        help="fingerprint-bound first-release ten-action review manifest",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    profile = ASSET_PROFILES[args.profile]
    failures = validate_assets(
        args.scene_asset_dir,
        profile,
        release_rights_record=args.release_rights_record,
        release_motion_review=args.release_motion_review,
    )

    if failures:
        print(f"Cat action asset check failed ({profile.name} profile):")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(f"Cat action asset check passed ({profile.name} profile).")


if __name__ == "__main__":
    main()
