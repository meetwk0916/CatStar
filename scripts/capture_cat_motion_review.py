#!/usr/bin/env python3
"""Capture and validate continuous CatStar action review evidence."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import signal
import subprocess
import sys
import tempfile
from collections import Counter
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

import capture_cat_runtime_review as screenshot_review  # noqa: E402
import check_cat_action_assets as asset_checker  # noqa: E402


HOST = "127.0.0.1"
PORT = int(os.environ.get("CATSTAR_MOTION_REVIEW_PORT", "5192"))
BASE_URL = f"http://{HOST}:{PORT}"
OUT_ROOT = REPO_ROOT / "artifacts" / "art" / "runtime-motion-review"
NODE_CAPTURE_SCRIPT = SCRIPT_DIR / "capture_cat_motion_review.mjs"
PYTHON_CAPTURE_SCRIPT = Path(__file__).resolve()
REVIEW_RECORDER_SCRIPT = SCRIPT_DIR / "record_cat_motion_review.py"
ACTION_SCENARIOS = {
    "idle": ("/?catstarRoutine=floorIdle", 4_000),
    "sit": ("/?catstarRoutine=floorSit", 4_000),
    "walk": ("/?catstarRoutine=floorWalk", 4_000),
    "jump": ("/?catstarRoutine=approachWindowBench", 6_000),
    "eat": ("/?catstarRoutine=approachFoodBowl", 9_000),
    "lie": ("/?catstarRoutine=approachCatBed", 11_000),
    "sleep": ("/?catstarRoutine=floorSleep", 4_000),
    "groom": ("/?catstarRoutine=floorGroom", 4_000),
    "stretch": ("/?catstarRoutine=floorStretch", 4_000),
    "interact": ("/?catstarRoutine=floorSit&catstarFullTouch=1", 4_000),
}
EVIDENCE_FIELDS = ("video", "entryPoster", "exitPoster")


def preset_to_runtime_value(preset: str) -> str:
    """Convert a public asset directory name to the runtime enum spelling."""

    return preset.replace("-", "_").upper()


def parse_viewports(value: str) -> dict[str, tuple[int, int]]:
    viewports: dict[str, tuple[int, int]] = {}
    for item in value.split(","):
        name, dimensions = item.split("=", maxsplit=1)
        width, height = (int(part) for part in dimensions.split("x", maxsplit=1))
        if width <= 0 or height <= 0:
            raise ValueError(f"Viewport dimensions must be positive: {item}")
        viewports[name] = (width, height)
    if not viewports:
        raise ValueError("At least one review viewport is required")
    return viewports


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--profile",
        choices=tuple(asset_checker.ASSET_PROFILES),
        default="prototype",
        help="asset profile to review (default: prototype)",
    )
    parser.add_argument("--preset", action="append", help="limit review to a preset directory")
    parser.add_argument("--action", action="append", choices=tuple(ACTION_SCENARIOS), help="limit review to an action")
    parser.add_argument(
        "--route-override",
        help="capture one selected action against a different real room route",
    )
    parser.add_argument("--viewport", action="append", help="limit review to a viewport name")
    parser.add_argument(
        "--viewports",
        default="desktop=1280x720,mobile=390x844",
        help="named viewports for the complete review matrix",
    )
    parser.add_argument("--output", type=Path, help="output directory for the review evidence")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="validate an existing motion review directory without launching a browser",
    )
    parser.add_argument(
        "--require-human-pass",
        action="store_true",
        help="require every matrix entry to carry a recorded human pass decision",
    )
    return parser.parse_args()


def selected_matrix(args: argparse.Namespace) -> tuple[list[str], list[str], dict[str, tuple[int, int]]]:
    profile = asset_checker.ASSET_PROFILES[args.profile]
    presets = args.preset or list(profile.presets)
    unknown_presets = sorted(set(presets) - set(profile.presets))
    if unknown_presets:
        raise ValueError(f"Presets are not part of the {args.profile} profile: {', '.join(unknown_presets)}")

    actions = args.action or list(ACTION_SCENARIOS)
    viewports = parse_viewports(args.viewports)
    if args.viewport:
        unknown_viewports = sorted(set(args.viewport) - set(viewports))
        if unknown_viewports:
            raise ValueError(f"Unknown review viewport: {', '.join(unknown_viewports)}")
        viewports = {name: viewports[name] for name in args.viewport}
    return presets, actions, viewports


def selected_action_scenarios(
    actions: list[str], route_override: str | None = None
) -> dict[str, tuple[str, int]]:
    if route_override and len(actions) != 1:
        raise ValueError("A route override requires exactly one action")
    scenarios = {action: ACTION_SCENARIOS[action] for action in actions}
    if route_override:
        action = actions[0]
        _route, duration_ms = scenarios[action]
        scenarios[action] = (route_override, duration_ms)
    return scenarios


def matrix_keys(
    presets: Iterable[str], actions: Iterable[str], viewports: Iterable[str]
) -> set[tuple[str, str, str]]:
    return {(preset, action, viewport) for preset in presets for action in actions for viewport in viewports}


def required_human_pass_matrix(manifest: dict[str, object]) -> frozenset[tuple[str, str, str]]:
    return frozenset(
        matrix_keys(
            [str(value) for value in manifest.get("presets", [])],
            [str(value) for value in manifest.get("actions", [])],
            [str(value) for value in manifest.get("viewports", [])],
        )
    )


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def evidence_digests(entry: dict[str, object], output_dir: Path) -> dict[str, str]:
    return {
        field: file_sha256(output_dir / str(entry[field]))
        for field in EVIDENCE_FIELDS
    }


def make_storage_state(path: Path, coat_preset: str) -> None:
    state = {
        "cookies": [],
        "origins": [
            {
                "origin": BASE_URL,
                "localStorage": [
                    {
                        "name": "catstar.passport.v1",
                        "value": json.dumps(
                            {
                                "schemaVersion": 1,
                                "id": "runtime-motion-review",
                                "catName": "小灰",
                                "ownerName": "家人",
                                "coatPreset": preset_to_runtime_value(coat_preset),
                                "temperament": "AFFECTIONATE",
                                "favoriteSnack": "小鱼干",
                                "passedDate": "2026-06-01",
                                "createdAt": 1781456400000,
                                "readLetters": [],
                                "isFarewellCompleted": False,
                            },
                            ensure_ascii=False,
                            separators=(",", ":"),
                        ),
                    }
                ],
            }
        ],
    }
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def source_fingerprint() -> tuple[str, list[str]]:
    base_fingerprint, base_files = screenshot_review.source_fingerprint()
    digest = hashlib.sha256(base_fingerprint.encode("utf-8"))
    source_files = list(base_files)
    for path in (PYTHON_CAPTURE_SCRIPT, NODE_CAPTURE_SCRIPT, REVIEW_RECORDER_SCRIPT):
        relative = path.relative_to(REPO_ROOT).as_posix()
        source_files.append(relative)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest(), sorted(set(source_files))


def run_capture(
    output_dir: Path,
    presets: list[str],
    action_scenarios: dict[str, tuple[str, int]],
    viewports: dict[str, tuple[int, int]],
) -> list[dict[str, object]]:
    server = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", HOST, "--port", str(PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    entries: list[dict[str, object]] = []
    try:
        screenshot_review.BASE_URL = BASE_URL
        screenshot_review.wait_for_server()
        with tempfile.TemporaryDirectory(prefix="catstar-motion-review-") as temp_dir:
            storage_directory = Path(temp_dir)
            for preset in presets:
                storage_state = storage_directory / f"{preset}.json"
                make_storage_state(storage_state, preset)
                for action, (route, duration_ms) in action_scenarios.items():
                    review_route = f"{route}&catstarMotionReview=1"
                    for viewport_name, (width, height) in viewports.items():
                        viewport = f"{width}x{height}"
                        command = [
                            "node",
                            str(NODE_CAPTURE_SCRIPT),
                            BASE_URL,
                            str(storage_state),
                            str(output_dir),
                            preset,
                            preset_to_runtime_value(preset),
                            action,
                            review_route,
                            str(duration_ms),
                            viewport,
                        ]
                        channel = os.environ.get("CATSTAR_PLAYWRIGHT_CHANNEL", "chrome")
                        if channel:
                            command.append(channel)
                        result = subprocess.run(command, check=True, capture_output=True, text=True)
                        entry = json.loads(result.stdout)
                        entry["humanReview"] = {
                            "status": "pending",
                            "reviewer": "",
                            "notes": "",
                        }
                        entry["evidenceSha256"] = evidence_digests(entry, output_dir)
                        entries.append(entry)
    finally:
        if server.poll() is None:
            server.send_signal(signal.SIGINT)
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
    return entries


def build_review_boards(
    output_dir: Path,
    entries: list[dict[str, object]],
    presets: list[str],
    actions: list[str],
    viewports: dict[str, tuple[int, int]],
) -> list[str]:
    boards: list[str] = []
    for viewport_name in viewports:
        for action in actions:
            action_entries = {
                str(entry["coatPreset"]): entry
                for entry in entries
                if entry["viewport"] == f"{viewports[viewport_name][0]}x{viewports[viewport_name][1]}"
                and entry["action"] == action
            }
            columns = min(5, max(len(presets), 1))
            rows = (len(presets) + columns - 1) // columns
            cell_width, cell_height = (320, 210) if viewport_name == "desktop" else (180, 270)
            board = Image.new("RGB", (columns * cell_width, rows * cell_height), (24, 24, 24))
            draw = ImageDraw.Draw(board)
            for index, preset in enumerate(presets):
                entry = action_entries.get(preset)
                if not entry:
                    continue
                poster = Image.open(output_dir / str(entry["entryPoster"])).convert("RGB")
                poster.thumbnail((cell_width - 8, cell_height - 30), Image.Resampling.LANCZOS)
                x = (index % columns) * cell_width
                y = (index // columns) * cell_height
                board.paste(poster, (x + (cell_width - poster.width) // 2, y + 24))
                draw.text((x + 6, y + 6), preset, fill=(255, 255, 255))
            board_path = output_dir / "boards" / viewport_name / f"{action}.png"
            board_path.parent.mkdir(parents=True, exist_ok=True)
            board.save(board_path)
            boards.append(board_path.relative_to(output_dir).as_posix())

            video_board_path = output_dir / "boards" / viewport_name / f"{action}.html"
            cards = []
            for preset in presets:
                entry = action_entries.get(preset)
                if not entry:
                    continue
                video = html.escape(str(entry["video"]))
                entry_poster = html.escape(str(entry["entryPoster"]))
                exit_poster = html.escape(str(entry["exitPoster"]))
                cards.append(
                    "<article>"
                    f"<h2>{html.escape(preset)}</h2>"
                    f'<video controls loop muted preload="metadata" poster="../../{entry_poster}" src="../../{video}"></video>'
                    f'<p><img alt="entry" src="../../{entry_poster}"> '
                    f'<img alt="exit" src="../../{exit_poster}"></p>'
                    "</article>"
                )
            video_board_path.write_text(
                "<!doctype html>\n"
                '<meta charset="utf-8">\n'
                f"<title>CatStar {html.escape(action)} motion review ({html.escape(viewport_name)})</title>\n"
                "<style>body{font-family:system-ui;background:#181818;color:#fff;margin:1rem}"
                "main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}"
                "article{background:#292929;padding:.75rem}h2{font-size:1rem;margin:.1rem 0 .5rem}"
                "video{display:block;width:100%;background:#000}p{display:flex;gap:.5rem;margin:.5rem 0 0}"
                "p img{width:calc(50% - .25rem);height:auto;object-fit:contain;background:#000}</style>\n"
                f"<main>{''.join(cards)}</main>\n",
                encoding="utf-8",
            )
            boards.append(video_board_path.relative_to(output_dir).as_posix())
    return boards


def validate_manifest_data(
    manifest: dict[str, object],
    output_dir: Path,
    required_matrix: frozenset[tuple[str, str, str]] | None = None,
) -> list[str]:
    failures: list[str] = []
    if manifest.get("schemaVersion") != 1:
        failures.append("manifest: expected schemaVersion 1")
    presets = [str(value) for value in manifest.get("presets", [])]
    actions = [str(value) for value in manifest.get("actions", [])]
    viewports = [str(value) for value in manifest.get("viewports", [])]
    expected = matrix_keys(presets, actions, viewports)
    entries = manifest.get("entries", [])
    actual_keys = [
        (str(entry.get("coatPreset")), str(entry.get("action")), str(entry.get("viewport")))
        for entry in entries
    ]
    actual = set(actual_keys)
    duplicates = sorted(key for key, count in Counter(actual_keys).items() if count > 1)
    if duplicates:
        failures.append(f"manifest: duplicate motion evidence {duplicates}")
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        if missing:
            failures.append(f"manifest: missing motion evidence {missing}")
        if extra:
            failures.append(f"manifest: unexpected motion evidence {extra}")
    if required_matrix is not None and actual != required_matrix:
        missing = sorted(required_matrix - actual)
        extra = sorted(actual - required_matrix)
        if missing:
            failures.append(f"manifest: missing required human-review evidence {missing}")
        if extra:
            failures.append(f"manifest: unexpected human-review evidence {extra}")
    for entry in entries:
        coat_preset = entry.get("coatPreset")
        expected_runtime_value = (
            preset_to_runtime_value(coat_preset) if isinstance(coat_preset, str) else None
        )
        if entry.get("runtimeCoatPreset") != expected_runtime_value:
            failures.append(
                f"manifest: runtime coat mismatch for {coat_preset}/{entry.get('action')}: "
                f"expected {expected_runtime_value}, got {entry.get('runtimeCoatPreset')}"
            )
        if entry.get("motionState") != "complete":
            failures.append(
                f"manifest: incomplete motion state for {coat_preset}/{entry.get('action')}"
            )
        recorded_digests = entry.get("evidenceSha256")
        for field in EVIDENCE_FIELDS:
            relative = entry.get(field)
            evidence_path = output_dir / relative if isinstance(relative, str) else None
            if evidence_path is None or not evidence_path.is_file():
                failures.append(f"manifest: missing {field} for {entry.get('coatPreset')}/{entry.get('action')}")
                continue
            recorded_digest = (
                recorded_digests.get(field) if isinstance(recorded_digests, dict) else None
            )
            if not isinstance(recorded_digest, str) or recorded_digest != file_sha256(evidence_path):
                failures.append(
                    f"manifest: {field} digest mismatch for "
                    f"{entry.get('coatPreset')}/{entry.get('action')}/{entry.get('viewport')}"
                )
        human_review = entry.get("humanReview")
        if not isinstance(human_review, dict) or human_review.get("status") not in {"pending", "pass", "fail"}:
            failures.append(
                f"manifest: invalid human review status for {entry.get('coatPreset')}/{entry.get('action')}"
            )
        elif not isinstance(human_review.get("reviewer", ""), str) or not isinstance(
            human_review.get("notes", ""), str
        ):
            failures.append(
                f"manifest: invalid human review details for {entry.get('coatPreset')}/{entry.get('action')}"
            )
        elif human_review.get("status") in {"pass", "fail"}:
            reviewer = human_review.get("reviewer", "")
            reviewed_at = human_review.get("reviewedAt")
            if not reviewer.strip():
                failures.append(
                    f"manifest: human reviewer is required for {entry.get('coatPreset')}/{entry.get('action')}"
                )
            if not isinstance(reviewed_at, str) or not reviewed_at.strip():
                failures.append(
                    f"manifest: reviewedAt is required for {entry.get('coatPreset')}/{entry.get('action')}"
                )
            if human_review.get("status") == "fail" and not human_review.get("notes", "").strip():
                failures.append(
                    f"manifest: failure notes are required for {entry.get('coatPreset')}/{entry.get('action')}"
                )
    for board in manifest.get("boards", []):
        if not isinstance(board, str) or not (output_dir / board).exists():
            failures.append(f"manifest: missing review board {board}")
    fingerprint, source_files = source_fingerprint()
    if manifest.get("sourceFingerprint") != fingerprint or manifest.get("sourceFiles") != source_files:
        failures.append("manifest: motion review inputs changed; regenerate evidence")
    return failures


def human_review_counts(manifest: dict[str, object]) -> dict[str, int]:
    counts = {"pending": 0, "pass": 0, "fail": 0}
    for entry in manifest.get("entries", []):
        human_review = entry.get("humanReview", {})
        status = human_review.get("status") if isinstance(human_review, dict) else None
        if status in counts:
            counts[status] += 1
    return counts


def write_manifest(
    output_dir: Path,
    profile: str,
    presets: list[str],
    actions: list[str],
    viewports: dict[str, tuple[int, int]],
    entries: list[dict[str, object]],
    boards: list[str],
) -> None:
    fingerprint, source_files = source_fingerprint()
    manifest = {
        "schemaVersion": 1,
        "reviewKind": "continuous-motion",
        "profile": profile,
        "capturedAt": datetime.now().astimezone().isoformat(),
        "presets": presets,
        "actions": actions,
        "viewports": [f"{width}x{height}" for width, height in viewports.values()],
        "entries": entries,
        "boards": boards,
        "sourceFingerprint": fingerprint,
        "sourceFiles": source_files,
    }
    path = output_dir / "manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    failures = validate_manifest_data(manifest, output_dir)
    if failures:
        raise RuntimeError("\n".join(failures))


def latest_output_dir() -> Path:
    candidates = sorted(path for path in OUT_ROOT.iterdir() if path.is_dir())
    if not candidates:
        raise RuntimeError(f"No motion review directories found under {OUT_ROOT}")
    return candidates[-1]


def validate_existing(output_dir: Path, require_human_pass: bool = False) -> None:
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.exists():
        raise RuntimeError(f"Missing motion review manifest: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    required_matrix = required_human_pass_matrix(manifest) if require_human_pass else None
    failures = validate_manifest_data(manifest, output_dir, required_matrix)
    counts = human_review_counts(manifest)
    if require_human_pass and not required_matrix:
        failures.append("manifest: human-review matrix is empty")
    if require_human_pass and (counts["pending"] or counts["fail"]):
        failures.append(
            "manifest: human pass required; "
            f"pending={counts['pending']} fail={counts['fail']}"
        )
    elif counts["fail"]:
        failures.append(f"manifest: human review contains {counts['fail']} failed entries")
    if failures:
        raise RuntimeError("\n".join(failures))
    if counts["pending"]:
        print(
            "Continuous motion evidence structurally valid; "
            f"human review pending for {counts['pending']} entries: {output_dir}"
        )
    else:
        print(f"Continuous motion evidence structurally valid with human passes: {output_dir}")


def main() -> None:
    args = parse_args()
    if args.validate_only:
        output_dir = args.output or latest_output_dir()
        validate_existing(output_dir, args.require_human_pass)
        return

    presets, actions, viewports = selected_matrix(args)
    action_scenarios = selected_action_scenarios(actions, args.route_override)
    profile = asset_checker.ASSET_PROFILES[args.profile]
    failures = asset_checker.validate_assets(REPO_ROOT / "public/assets/scenes/window-room", profile)
    if failures:
        print(f"Motion review asset preflight failed ({args.profile} profile):", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        raise SystemExit(1)

    output_dir = args.output or OUT_ROOT / datetime.now().strftime("%Y-%m-%d")
    output_dir.mkdir(parents=True, exist_ok=True)
    entries = run_capture(output_dir, presets, action_scenarios, viewports)
    boards = build_review_boards(output_dir, entries, presets, actions, viewports)
    write_manifest(output_dir, args.profile, presets, actions, viewports, entries, boards)
    print(f"Continuous motion review written to {output_dir}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Continuous motion review failed: {error}", file=sys.stderr)
        raise SystemExit(1)
