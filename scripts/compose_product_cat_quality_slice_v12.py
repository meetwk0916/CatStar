#!/usr/bin/env python3
"""Normalize the production-model CatStar v12 quality slice into 96px sheets."""

from artifact_paths import ARTIFACTS_ART_ROOT
from compose_product_cat_quality_slice_v11 import compose


OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-quality-slice-v12"


if __name__ == "__main__":
    compose(OUT_DIR)
