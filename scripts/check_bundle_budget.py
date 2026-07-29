#!/usr/bin/env python3
"""Fail when the internal prototype exceeds its accepted JavaScript budgets."""

from __future__ import annotations

import gzip
from pathlib import Path


DIST_ASSETS = Path("dist/assets")
ENTRY_GZIP_LIMIT = 120_000
PHASER_GZIP_LIMIT = 350_000
PHASER_RAW_LIMIT = 1_250_000


def gzip_size(path: Path) -> int:
    return len(gzip.compress(path.read_bytes(), compresslevel=9))


def main() -> None:
    javascript = sorted(DIST_ASSETS.glob("*.js"))
    if not javascript:
        raise RuntimeError("No built JavaScript found; run `npm run build` first")

    phaser_chunks = [path for path in javascript if path.name.startswith("PhaserCatScene-")]
    entry_chunks = [path for path in javascript if path not in phaser_chunks]
    if len(phaser_chunks) != 1 or len(entry_chunks) != 1:
        raise RuntimeError(f"Unexpected JavaScript chunk layout: {[path.name for path in javascript]}")

    entry = entry_chunks[0]
    phaser = phaser_chunks[0]
    measurements = {
        "entry gzip": (gzip_size(entry), ENTRY_GZIP_LIMIT),
        "Phaser raw": (phaser.stat().st_size, PHASER_RAW_LIMIT),
        "Phaser gzip": (gzip_size(phaser), PHASER_GZIP_LIMIT),
    }

    failures = []
    for label, (actual, limit) in measurements.items():
        print(f"{label}: {actual / 1000:.1f} kB (limit {limit / 1000:.1f} kB)")
        if actual > limit:
            failures.append(f"{label} is {actual} bytes, above {limit}")

    if failures:
        raise RuntimeError("; ".join(failures))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Bundle budget check failed: {error}")
        raise SystemExit(1)
