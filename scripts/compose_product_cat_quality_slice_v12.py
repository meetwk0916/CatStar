#!/usr/bin/env python3
"""Normalize the production-model CatStar v12 quality slice into 96px sheets."""

from artifact_paths import ARTIFACTS_ART_ROOT
from cat_cross_action_scale import (
    ROUNDED_SHORT_HAIR_SCALE_AUTHORITY,
    require_stationary_walk_scale,
)
from compose_product_cat_quality_slice_v11 import ActionRow, compose


OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-quality-slice-v12"
ACTION_ROWS = (
    ActionRow("sit", "sit-source-alpha.png", 4, 82, 84),
    ActionRow("walk", "walk-source-alpha.png", 8, 92, 84),
    ActionRow("interact", "interact-source-alpha.png", 6, 86, 84),
)


if __name__ == "__main__":
    compose(OUT_DIR, ROUNDED_SHORT_HAIR_SCALE_AUTHORITY, ACTION_ROWS)
    for stationary_action, frame_count, path in (
        (
            "idle",
            4,
            ARTIFACTS_ART_ROOT
            / "candidates/active/product-cat-quiet-motion-v1/sprite-sheets-96/idle.png",
        ),
        ("sit", 4, OUT_DIR / "sprite-sheets-96/sit.png"),
    ):
        require_stationary_walk_scale(
            path,
            frame_count,
            OUT_DIR / "sprite-sheets-96/walk.png",
            8,
            stationary_action=stationary_action,
            label=ROUNDED_SHORT_HAIR_SCALE_AUTHORITY.name,
        )
