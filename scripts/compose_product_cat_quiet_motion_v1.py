#!/usr/bin/env python3
"""Normalize the production-model CatStar quiet motion group into 96px sheets."""

from __future__ import annotations

import json
from pathlib import Path

from artifact_paths import ARTIFACTS_ART_ROOT
from cat_cross_action_scale import ROUNDED_SHORT_HAIR_SCALE_AUTHORITY
from compose_product_cat_quality_slice_v11 import ActionRow, extract_action


OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-quiet-motion-v1"
ACTION_ROWS = (
    ActionRow("idle", "idle-source-alpha.png", 4, 90, 84),
    ActionRow("lie", "lie-source-alpha.png", 4, 90, 68),
    ActionRow("sleep", "sleep-source-alpha.png", 4, 90, 62),
)


def compose(output_dir: Path = OUT_DIR) -> None:
    source_dir = output_dir / "alpha"
    normalized_dir = output_dir / "normalized-96"
    sheet_dir = output_dir / "sprite-sheets-96"
    normalized_dir.mkdir(parents=True, exist_ok=True)
    sheet_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        row.action: extract_action(
            row,
            source_dir,
            normalized_dir,
            sheet_dir,
            ROUNDED_SHORT_HAIR_SCALE_AUTHORITY,
        )
        for row in ACTION_ROWS
    }
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Wrote {len(ACTION_ROWS)} quiet-motion sheets to {sheet_dir}")


if __name__ == "__main__":
    compose()
