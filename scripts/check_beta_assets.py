#!/usr/bin/env python3
"""Compare the actual assembled client asset tree to approved paths and hashes."""

import argparse
import hashlib
import json
from pathlib import Path


def inventory(client):
    assets = client / "assets"
    if not assets.is_dir() or assets.is_symlink():
        raise ValueError(f"Expected built asset directory: {assets}")
    result = {}
    for path in sorted(assets.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlink in built assets: {path}")
        if path.is_file():
            with path.open("rb") as source:
                result[path.relative_to(client).as_posix()] = hashlib.file_digest(source, "sha256").hexdigest()
    if not result:
        raise ValueError(f"No built assets in {assets}")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", type=Path, default=Path("dist/client"))
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--inventory", action="store_true", help="Print inventory for review; does not approve it")
    mode.add_argument("--approved", type=Path, help="JSON path-to-SHA-256 inventory approved for this target")
    args = parser.parse_args()
    try:
        actual = inventory(args.client)
        if args.inventory:
            print(json.dumps(actual, indent=2))
            return
        approved = json.loads(args.approved.read_text(encoding="utf-8"))
        if not isinstance(approved, dict) or not approved:
            raise ValueError("Expected a nonempty approved path-to-SHA-256 object")
        problems = [
            f"{path}: {reason}"
            for paths, reason in (
                (actual.keys() - approved.keys(), "not approved"),
                (approved.keys() - actual.keys(), "missing from build"),
                ({p for p in actual.keys() & approved.keys() if actual[p] != approved[p]}, "hash mismatch"),
            )
            for path in sorted(paths)
        ]
        if problems:
            raise ValueError("\n".join(problems))
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(f"Verified {len(actual)} built asset files against the approved inventory.")


if __name__ == "__main__":
    main()
