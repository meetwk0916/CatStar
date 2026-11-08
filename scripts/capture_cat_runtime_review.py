#!/usr/bin/env python3
"""Capture browser review screenshots for CatStar room interactions.

This script is a repeatable version of the manual runtime review pass. It starts
the Vite dev server, injects a local-only passport into browser storage, and
uses the project's Playwright installation to capture key room interaction states.
"""

from __future__ import annotations

import json
import hashlib
import math
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener

from PIL import Image

from artifact_paths import ARTIFACTS_ART_ROOT, REPO_ROOT


HOST = "127.0.0.1"
PORT = int(os.environ.get("CATSTAR_REVIEW_PORT", "5191"))
BASE_URL = f"http://{HOST}:{PORT}"
OUT_DIR_ENV = os.environ.get("CATSTAR_REVIEW_OUT")
RUNTIME_REVIEW_DIR = ARTIFACTS_ART_ROOT / "runtime-review"
OUT_DIR = (
    Path(OUT_DIR_ENV)
    if OUT_DIR_ENV
    else RUNTIME_REVIEW_DIR / f"{datetime.now():%Y-%m-%d}"
)
CHANNEL = os.environ.get("CATSTAR_PLAYWRIGHT_CHANNEL", "chrome")
VIEWPORT = os.environ.get("CATSTAR_REVIEW_VIEWPORT", "1280,720")
EXPECTED_VIEWPORT = tuple(int(value) for value in VIEWPORT.split(",", maxsplit=1))
MOBILE_VIEWPORT = os.environ.get("CATSTAR_REVIEW_MOBILE_VIEWPORT", "390,844")
EXPECTED_MOBILE_VIEWPORT = tuple(int(value) for value in MOBILE_VIEWPORT.split(",", maxsplit=1))
MIN_ROOM_UNIQUE_COLORS = 10_000
MIN_ROOM_MEAN_LUMINANCE = 40
MAX_ROOM_MEAN_LUMINANCE = 140
CAT_DIFF_THRESHOLD = 75
# Dark coat presets intentionally have lower luminance contrast against parts
# of the night room; 90px still rejects a missing cat while keeping tuxedo and
# solid-black food-bowl poses testable.
MIN_CAT_DIFF_COMPONENT = 90
BACKGROUND_PATH = Path("public/assets/scenes/window-room/background.png")

REVIEW_PASSPORT = {
    "schemaVersion": 1,
    "id": "runtime-review",
    "catName": "小灰",
    "ownerName": "家人",
    "coatPreset": "GRAY_WHITE_TABBY",
    "temperament": "AFFECTIONATE",
    "favoriteSnack": "小鱼干",
    "createdAt": 1781456400000,
    "readLetters": [],
    "isFarewellCompleted": False,
}

SHOTS = [
    ("default-walk-4s.png", "/", 4500, VIEWPORT),
    ("window-bench-6s.png", "/?catstarRoutine=approachWindowBench", 6000, VIEWPORT),
    ("catbed-rest-10s.png", "/?catstarRoutine=approachCatBed", 10000, VIEWPORT),
    ("food-bowl-eat-14s.png", "/?catstarRoutine=approachFoodBowl", 14000, VIEWPORT),
    ("blanket-rest-10s.png", "/?catstarRoutine=approachBlanket", 10000, VIEWPORT),
    ("floor-groom-2s.png", "/?catstarRoutine=floorGroom", 1800, VIEWPORT),
    ("floor-stretch-1s.png", "/?catstarRoutine=floorStretch", 550, VIEWPORT),
    ("floor-sleep-2s.png", "/?catstarRoutine=floorSleep", 1800, VIEWPORT),
    ("approach-user-4s.png", "/?catstarRoutine=approachUser", 4000, VIEWPORT),
    ("plant-touch-1s.png", "/?catstarRoutine=touchPlant", 1100, VIEWPORT),
    ("mobile-sit-2s.png", "/?catstarRoutine=floorSit", 1800, MOBILE_VIEWPORT),
]
INTERACTION_SHOTS = [
    f"interaction-{side}-{frame:02d}.png"
    for side in ("left", "right")
    for frame in range(1, 5)
]
SHOT_FILENAMES = [filename for filename, _route, _timeout, _viewport in SHOTS] + INTERACTION_SHOTS
SHOT_VIEWPORTS = {
    filename: [int(value) for value in viewport.split(",", maxsplit=1)]
    for filename, _route, _timeout, viewport in SHOTS
}
SHOT_VIEWPORTS.update({filename: list(EXPECTED_VIEWPORT) for filename in INTERACTION_SHOTS})
MANIFEST_FILENAME = "manifest.json"
CAPTURE_SCRIPT = REPO_ROOT / "scripts/capture_cat_runtime_review.mjs"
FINGERPRINT_PATHS = [
    REPO_ROOT / "index.html",
    REPO_ROOT / "package.json",
    REPO_ROOT / "package-lock.json",
    REPO_ROOT / "vite.config.ts",
    REPO_ROOT / "scripts/capture_cat_runtime_review.py",
    CAPTURE_SCRIPT,
]
FINGERPRINT_TREES = [
    REPO_ROOT / "src",
    REPO_ROOT / "public/assets/scenes/window-room",
]


def wait_for_server(timeout_seconds: float = 20) -> None:
    opener = build_opener(ProxyHandler({}))
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            with opener.open(BASE_URL, timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, URLError) as error:
            last_error = error
        time.sleep(0.25)

    raise RuntimeError(f"Vite dev server did not become ready at {BASE_URL}: {last_error}")


def make_storage_state(path: Path) -> None:
    state = {
        "cookies": [],
        "origins": [
            {
                "origin": BASE_URL,
                "localStorage": [
                    {
                        "name": "catstar.passport.v1",
                        "value": json.dumps(REVIEW_PASSPORT, ensure_ascii=False, separators=(",", ":")),
                    }
                ],
            }
        ],
    }
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")


def capture(storage_state: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="catstar-screenshot-staging-") as temp_dir:
        staged = Path(temp_dir)
        bounds = {}
        for index, (filename, route, timeout, viewport) in enumerate(SHOTS):
            print(f"Capturing {'preflight ' if index == 0 else ''}{filename} ...", flush=True)
            frame = {"filename": filename, "route": route, "waitMs": timeout}
            bounds[filename] = capture_browser_frames(storage_state, staged, viewport, frame).get(filename)
            validate_screenshot(staged / filename, tuple(SHOT_VIEWPORTS[filename]), bounds[filename])
            if index == 0:
                print("Preflight passed.", flush=True)

        print("Capturing real-pointer interaction sequences ...", flush=True)
        interactions = capture_browser_frames(storage_state, staged, VIEWPORT)
        for filename in INTERACTION_SHOTS:
            bounds[filename] = interactions.get(filename)
            validate_screenshot(staged / filename, EXPECTED_VIEWPORT, bounds[filename])

        OUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUT_DIR / MANIFEST_FILENAME).unlink(missing_ok=True)
        for filename in SHOT_FILENAMES:
            shutil.move(staged / filename, OUT_DIR / filename)
        write_manifest(bounds)


def capture_browser_frames(
    storage_state: Path, output: Path, viewport: str, shot: dict | None = None
) -> dict:
    command = [
        "node",
        str(CAPTURE_SCRIPT),
        BASE_URL,
        str(storage_state),
        str(output),
        CHANNEL,
        viewport,
    ]
    if shot is not None:
        command.append(json.dumps(shot))
    result = subprocess.run(command, check=True, cwd=REPO_ROOT, stdout=subprocess.PIPE, text=True)
    bounds = json.loads(result.stdout)
    if not isinstance(bounds, dict):
        raise RuntimeError("Browser did not return canvas bounds")
    return bounds


def validate_existing_screenshots() -> None:
    bounds = validate_manifest()
    for filename in SHOT_FILENAMES:
        path = OUT_DIR / filename
        if not path.exists():
            raise RuntimeError(f"Missing runtime review screenshot: {path}")
        validate_screenshot(path, tuple(SHOT_VIEWPORTS[filename]), bounds[filename])
        print(f"Validated {path}", flush=True)


def fingerprint_files() -> list[Path]:
    files = list(FINGERPRINT_PATHS)
    for tree in FINGERPRINT_TREES:
        files.extend(path for path in tree.rglob("*") if path.is_file())
    return sorted(set(files))


def source_fingerprint() -> tuple[str, list[str]]:
    digest = hashlib.sha256()
    relative_paths: list[str] = []
    for path in fingerprint_files():
        relative = path.relative_to(REPO_ROOT).as_posix()
        relative_paths.append(relative)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest(), relative_paths


def write_manifest(bounds: dict) -> None:
    fingerprint, source_files = source_fingerprint()
    manifest = {
        "schemaVersion": 3,
        "capturedAt": datetime.now().astimezone().isoformat(),
        "viewport": list(EXPECTED_VIEWPORT),
        "shotViewports": SHOT_VIEWPORTS,
        "canvasBounds": bounds,
        "sourceFingerprint": fingerprint,
        "sourceFiles": source_files,
        "screenshots": SHOT_FILENAMES,
    }
    (OUT_DIR / MANIFEST_FILENAME).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_manifest() -> dict:
    path = OUT_DIR / MANIFEST_FILENAME
    if not path.exists():
        raise RuntimeError(f"Missing runtime review manifest: {path}; regenerate runtime evidence")

    manifest = json.loads(path.read_text(encoding="utf-8"))
    fingerprint, source_files = source_fingerprint()
    if manifest.get("schemaVersion") != 3:
        raise RuntimeError(f"{path}: unsupported manifest schema")
    if manifest.get("viewport") != list(EXPECTED_VIEWPORT):
        raise RuntimeError(f"{path}: viewport does not match {list(EXPECTED_VIEWPORT)}")
    if manifest.get("shotViewports") != SHOT_VIEWPORTS:
        raise RuntimeError(f"{path}: per-shot viewports do not match the current review contract")
    if manifest.get("screenshots") != SHOT_FILENAMES:
        raise RuntimeError(f"{path}: screenshot set does not match the current review contract")
    if manifest.get("sourceFiles") != source_files or manifest.get("sourceFingerprint") != fingerprint:
        raise RuntimeError(f"{path}: runtime inputs changed; regenerate runtime evidence")
    bounds = manifest.get("canvasBounds")
    if not isinstance(bounds, dict) or set(bounds) != set(SHOT_FILENAMES):
        raise RuntimeError(f"{path}: missing or unexpected per-shot canvas bounds")
    return bounds


def mean_luminance(image: Image.Image) -> float:
    histogram = image.convert("L").histogram()
    pixels = image.width * image.height
    return sum(value * count for value, count in enumerate(histogram)) / pixels


def canvas_region(path: Path, bounds: object, viewport: tuple[int, int]) -> tuple[int, int, int, int]:
    if not isinstance(bounds, dict):
        raise RuntimeError(f"{path}: missing or invalid canvas bounds")
    values = [bounds.get(key) for key in ("x", "y", "width", "height")]
    if any(type(value) not in (int, float) or not math.isfinite(value) for value in values):
        raise RuntimeError(f"{path}: invalid canvas bounds: {bounds}")
    x, y, width, height = values
    if x < 0 or y < 0 or width <= 0 or height <= 0 or x + width > viewport[0] or y + height > viewport[1]:
        raise RuntimeError(f"{path}: canvas bounds empty or outside viewport: {bounds}")
    left, top, right, bottom = math.ceil(x), math.ceil(y), math.floor(x + width), math.floor(y + height)
    if left >= right or top >= bottom:
        raise RuntimeError(f"{path}: canvas bounds contain no whole pixels: {bounds}")
    return left, top, right, bottom


def validate_screenshot(path: Path, expected_viewport: tuple[int, int], bounds: object) -> None:
    image = Image.open(path).convert("RGB")
    if image.size != expected_viewport:
        raise RuntimeError(f"{path}: expected viewport {expected_viewport}, got {image.size}")

    room = image.crop(canvas_region(path, bounds, expected_viewport))
    unique_colors = len(room.getcolors(maxcolors=room.width * room.height) or [])
    if unique_colors < MIN_ROOM_UNIQUE_COLORS:
        raise RuntimeError(f"{path}: canvas looks blank; only {unique_colors} unique colors")
    if expected_viewport == EXPECTED_MOBILE_VIEWPORT:
        return

    luminance = mean_luminance(room)
    if not (MIN_ROOM_MEAN_LUMINANCE <= luminance <= MAX_ROOM_MEAN_LUMINANCE):
        raise RuntimeError(f"{path}: room luminance out of range: {luminance:.1f}")

    cat_component = largest_cat_diff_component(room)
    if cat_component < MIN_CAT_DIFF_COMPONENT:
        raise RuntimeError(f"{path}: cat is not visibly present; largest cat diff component is {cat_component}px")


def largest_cat_diff_component(canvas: Image.Image) -> int:
    background = Image.open(BACKGROUND_PATH).convert("RGB").resize(canvas.size, Image.Resampling.BICUBIC)
    width, height = canvas.size
    diff_pixels = []

    screenshot_pixels = canvas.load()
    background_pixels = background.load()
    for y in range(height):
        row: list[bool] = []
        for x in range(width):
            sr, sg, sb = screenshot_pixels[x, y]
            br, bg, bb = background_pixels[x, y]
            diff = round(0.299 * abs(sr - br) + 0.587 * abs(sg - bg) + 0.114 * abs(sb - bb))
            row.append(diff > CAT_DIFF_THRESHOLD)
        diff_pixels.append(row)

    visited: set[tuple[int, int]] = set()
    largest = 0
    for y in range(height):
        for x in range(width):
            if (x, y) in visited or not diff_pixels[y][x]:
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
                        or next_x >= width
                        or next_y >= height
                        or (next_x, next_y) in visited
                        or not diff_pixels[next_y][next_x]
                    ):
                        continue
                    visited.add((next_x, next_y))
                    stack.append((next_x, next_y))

            largest = max(largest, size)

    return largest


def main() -> None:
    if os.environ.get("CATSTAR_REVIEW_VALIDATE_ONLY") == "1":
        if not OUT_DIR_ENV:
            use_latest_review_dir()
        validate_existing_screenshots()
        return

    server = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", HOST, "--port", str(PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )

    try:
        wait_for_server()
        with tempfile.TemporaryDirectory(prefix="catstar-runtime-review-") as temp_dir:
            storage_state = Path(temp_dir) / "storage.json"
            make_storage_state(storage_state)
            capture(storage_state)
    finally:
        if server.poll() is None:
            server.send_signal(signal.SIGINT)
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()

    print(f"Runtime review screenshots written to {OUT_DIR}")


def use_latest_review_dir() -> None:
    global OUT_DIR

    candidates = sorted(path for path in RUNTIME_REVIEW_DIR.iterdir() if path.is_dir())
    if not candidates:
        raise RuntimeError(f"No runtime review directories found under {RUNTIME_REVIEW_DIR}")
    OUT_DIR = candidates[-1]


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Runtime review capture failed: {error}", file=sys.stderr)
        raise SystemExit(1)
