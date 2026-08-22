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
import json
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
EDITABLE_AUTHORITY_SUFFIXES = {
    ".ase",
    ".aseprite",
    ".blend",
    ".kra",
    ".psd",
    ".svg",
    ".xcf",
}
CANONICAL_INTAKE_CHECK_COUNT = 33
CANONICAL_INTAKE_SECTIONS = (
    "## Source Identity",
    "## Authorship And References",
    "## Rights Grant",
    "## Visual And Technical Review",
    "## Final Decision",
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
    except (OSError, json.JSONDecodeError) as error:
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


def validate_completed_intake(record: object, record_dir: Path) -> list[str]:
    intake_path, failures = resolve_hashed_file(record, record_dir, "canonicalIntake")
    if intake_path is None or failures:
        return failures
    intake = intake_path.read_text(encoding="utf-8")
    if intake_path.name != "intake-checklist.md" or "# Orange Tabby v1 Production Intake" not in intake:
        failures.append("first-release rights record: canonicalIntake must be the Issue #23 intake")
    if "**Issue:** #23" not in intake:
        failures.append("first-release rights record: canonicalIntake must identify Issue #23")
    if any(section not in intake for section in CANONICAL_INTAKE_SECTIONS):
        failures.append("first-release rights record: canonicalIntake sections are incomplete")
    checked_count = sum(
        line.startswith(("- [x]", "- [X]")) for line in intake.splitlines()
    )
    if checked_count != CANONICAL_INTAKE_CHECK_COUNT:
        failures.append(
            "first-release rights record: canonicalIntake must complete all "
            f"{CANONICAL_INTAKE_CHECK_COUNT} checks"
        )
    if "**Status:** Complete" not in intake or "**Decision:** `approved-for-target`" not in intake:
        failures.append("first-release rights record: canonicalIntake is not approved and complete")
    if "- [ ]" in intake or "___" in intake or "**Status:** Not received" in intake:
        failures.append("first-release rights record: canonicalIntake still has incomplete fields")
    return failures


def validate_intake_bindings(
    intake_record: object,
    editable_authority: object,
    runtime_exports: object,
    terms_evidence: object,
    record_dir: Path,
) -> list[str]:
    intake_path, failures = resolve_hashed_file(
        intake_record,
        record_dir,
        "canonicalIntake",
    )
    if intake_path is None or failures:
        return failures
    intake = intake_path.read_text(encoding="utf-8")
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
            and (relative not in intake or expected_hash not in intake)
        ):
            failures.append(
                f"first-release rights record: canonicalIntake does not bind {label}"
            )
    return failures


def validate_editable_authority(record: object, record_dir: Path) -> list[str]:
    authority_path, failures = resolve_hashed_file(record, record_dir, "editableAuthority")
    if not isinstance(record, dict):
        return failures
    authority_format = record.get("format")
    governed_actions, collection_failures = string_collection(
        record.get("governsActions"),
        "first-release rights record: editableAuthority.governsActions",
    )
    failures.extend(collection_failures)
    if not isinstance(authority_format, str) or not authority_format.strip():
        failures.append("first-release rights record: editableAuthority.format is required")
    if authority_path is not None and authority_path.suffix.lower() not in EDITABLE_AUTHORITY_SUFFIXES:
        failures.append("first-release rights record: editableAuthority must use an editable format")
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
    if not isinstance(release_preset, str) or release_preset not in profile.presets:
        failures.append("first-release rights record: releasePreset must name a release preset")
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

    failures.extend(validate_completed_intake(record.get("canonicalIntake"), path.parent))
    failures.extend(
        validate_intake_bindings(
            record.get("canonicalIntake"),
            record.get("editableAuthority"),
            record.get("runtimeExports"),
            record.get("termsEvidence"),
            path.parent,
        )
    )
    failures.extend(validate_editable_authority(record.get("editableAuthority"), path.parent))
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
