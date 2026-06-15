#!/usr/bin/env python3
"""Capture browser review screenshots for CatStar room interactions.

This script is a repeatable version of the manual runtime review pass. It starts
the Vite dev server, injects a local-only passport into browser storage, and
uses the Playwright CLI to capture key room interaction states.
"""

from __future__ import annotations

import json
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


HOST = "127.0.0.1"
PORT = int(os.environ.get("CATSTAR_REVIEW_PORT", "5191"))
BASE_URL = f"http://{HOST}:{PORT}"
OUT_DIR = Path(os.environ.get("CATSTAR_REVIEW_OUT", f"docs/art/runtime-review/{datetime.now():%Y-%m-%d}"))
CHANNEL = os.environ.get("CATSTAR_PLAYWRIGHT_CHANNEL", "chrome")
VIEWPORT = os.environ.get("CATSTAR_REVIEW_VIEWPORT", "1280,720")
EXPECTED_VIEWPORT = tuple(int(value) for value in VIEWPORT.split(",", maxsplit=1))
ROOM_REVIEW_REGION = (64, 248, 744, 634)
MIN_ROOM_UNIQUE_COLORS = 10_000
MIN_ROOM_MEAN_LUMINANCE = 40
MAX_ROOM_MEAN_LUMINANCE = 140

REVIEW_PASSPORT = {
    "id": "runtime-review",
    "catName": "小灰",
    "ownerName": "家人",
    "colorPalette": "ORANGE",
    "personality": "CLINGY",
    "favoriteSnack": "小鱼干",
    "passedDate": "2026-06-01",
    "createdAt": 1781456400000,
    "readLetters": [],
    "isFarewellCompleted": False,
}

SHOTS = [
    ("default-walk-4s.png", "/", 4500),
    ("window-bench-6s.png", "/?catstarRoutine=approachWindowBench", 6000),
    ("catbed-rest-10s.png", "/?catstarRoutine=approachCatBed", 10000),
    ("food-bowl-eat-8s.png", "/?catstarRoutine=approachFoodBowl", 8000),
    ("blanket-rest-10s.png", "/?catstarRoutine=approachBlanket", 10000),
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
    playwright = shutil.which("playwright")
    if not playwright:
        raise RuntimeError("Missing Playwright CLI. Install or expose `playwright` on PATH.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for filename, route, timeout in SHOTS:
        command = [
            playwright,
            "screenshot",
            "--load-storage",
            str(storage_state),
            "--viewport-size",
            VIEWPORT,
            "--wait-for-timeout",
            str(timeout),
        ]
        if CHANNEL:
            command.extend(["--channel", CHANNEL])
        command.extend([f"{BASE_URL}{route}", str(OUT_DIR / filename)])

        print(f"Capturing {filename} ...", flush=True)
        subprocess.run(command, check=True)
        validate_screenshot(OUT_DIR / filename)


def mean_luminance(image: Image.Image) -> float:
    histogram = image.convert("L").histogram()
    pixels = image.width * image.height
    return sum(value * count for value, count in enumerate(histogram)) / pixels


def validate_screenshot(path: Path) -> None:
    image = Image.open(path).convert("RGB")
    if image.size != EXPECTED_VIEWPORT:
        raise RuntimeError(f"{path}: expected viewport {EXPECTED_VIEWPORT}, got {image.size}")

    room = image.crop(ROOM_REVIEW_REGION)
    unique_colors = len(room.getcolors(maxcolors=room.width * room.height) or [])
    luminance = mean_luminance(room)

    if unique_colors < MIN_ROOM_UNIQUE_COLORS:
        raise RuntimeError(f"{path}: room region looks blank; only {unique_colors} unique colors")
    if not (MIN_ROOM_MEAN_LUMINANCE <= luminance <= MAX_ROOM_MEAN_LUMINANCE):
        raise RuntimeError(f"{path}: room luminance out of range: {luminance:.1f}")


def main() -> None:
    server = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", HOST, "--port", str(PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
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


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Runtime review capture failed: {error}", file=sys.stderr)
        raise SystemExit(1)
