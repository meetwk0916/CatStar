# Product Cat Quality Slice v11

**Status:** Active internal-prototype motion source

This candidate applies the approved rounded short-haired gray-and-white
identity to the first production quality slice:

- `sit`: 4 relaxed long-dwell frames distinct from standing `idle`
- `walk`: 8 grounded right-facing gait frames
- `interact`: 6 in-place acknowledgement frames using a lean, held slow blink,
  and return to ordinary posture

The three chroma-key generation sources live under `sources/`. Background-
removed review sources live under `alpha/`; normalized frames and assembled
transparent `96x96` sheets live under `normalized-96/` and
`sprite-sheets-96/`. `metadata.json` records source boxes and placement.

`scripts/compose_product_cat_quality_slice_v11.py` deterministically extracts
the exact 4/8/6 distinct poses, uses nearest-neighbor scaling, removes detached
edge islands, hardens alpha, limits each action to one 64-color palette, and
assembles the runtime candidates. `scripts/build_cat_coat_presets.py`
derives the six currently implemented coat presets from these three sheets
while leaving the other seven action sources unchanged.

The earlier `quality-slice-concept-v1.png` is retained as a rejected combined
layout experiment because its walk row contained only seven poses. It is not a
runtime source.

These generated assets remain internal-prototype-only pending complete rights
and provenance clearance.
