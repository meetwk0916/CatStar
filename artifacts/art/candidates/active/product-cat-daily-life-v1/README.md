# Product Cat Daily Life v1

Internal-prototype daily-life action sources derived from the approved
`product-cat-model-sheet-v1` identity authority.

Actions in this package:

- `eat`: six grounded bowl-oriented head-lowering frames
- `groom`: eight seated paw-and-face grooming frames
- `stretch`: six grounded foreleg-stretch and recovery frames

The three source images were generated with the built-in ImageGen surface on
2026-08-09 using the production model sheet as the sole visual reference. Each
source uses a flat `#00ff00` chroma-key background, then follows this
deterministic lineage:

```text
chroma-key source -> local alpha removal -> fixed-grid subject extraction
-> action-level scale normalization -> transparent 96x96 sprite sheet
-> four deterministic ordinary coat derivatives
```

`scripts/compose_product_cat_daily_life_v1.py` rebuilds the alpha, normalized,
and gray-white sprite-sheet outputs. `scripts/build_cat_coat_presets.py`
consumes the three sheets for the four ordinary derivatives. The internal
orange appearance preview has separate source lineage documented in
`docs/art/runtime-map.md`.

The distribution gate remains internal prototype only. This package is internal
quality evidence only. It does not establish public,
commercial, marketing, beta, or app-store distribution rights.
