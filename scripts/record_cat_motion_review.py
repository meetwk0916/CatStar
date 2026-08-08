#!/usr/bin/env python3
"""Record explicit human pass/fail decisions in a motion review manifest."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import capture_cat_motion_review as motion_review


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--status", choices=("pass", "fail"), required=True)
    parser.add_argument("--reviewer", required=True)
    parser.add_argument("--notes", default="")
    parser.add_argument("--preset")
    parser.add_argument("--action")
    parser.add_argument("--viewport")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    reviewer = args.reviewer.strip()
    notes = args.notes.strip()
    if not reviewer:
        raise ValueError("--reviewer must not be empty")
    if args.status == "fail" and not notes:
        raise ValueError("--notes is required when recording a failed review")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    updated = 0
    for entry in manifest.get("entries", []):
        if args.preset and entry.get("coatPreset") != args.preset:
            continue
        if args.action and entry.get("action") != args.action:
            continue
        if args.viewport and entry.get("viewport") != args.viewport:
            continue
        entry["humanReview"] = {
            "status": args.status,
            "reviewer": reviewer,
            "notes": notes,
            "reviewedAt": datetime.now().astimezone().isoformat(),
        }
        updated += 1

    if updated == 0:
        raise ValueError("No motion review entries matched the requested filters")

    failures = motion_review.validate_manifest_data(manifest, args.manifest.parent)
    if failures:
        raise RuntimeError("\n".join(failures))
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Recorded {args.status} human review for {updated} motion entries")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Motion review recording failed: {error}", file=sys.stderr)
        raise SystemExit(1)
