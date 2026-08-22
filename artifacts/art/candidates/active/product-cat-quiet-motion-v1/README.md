# Product Cat Quiet Motion v1

**Status:** Production-model redraw; continuous desktop and mobile motion approved

This package redraws `idle`, awake-rest `lie`, and deep `sleep` from the
approved rounded short-haired production model. The three actions preserve one
adult identity while remaining behaviorally distinct: `idle` is a brief
attentive standing transition, `lie` keeps the head raised for awake quiet
presence, and `sleep` curls down with closed eyes and restrained breathing.

The chroma-key sources are retained under `sources/`, with background-removed
copies under `alpha/`. `scripts/compose_product_cat_quiet_motion_v1.py`
deterministically extracts and normalizes the poses into `96x96` runtime
sheets. The `idle` source uses the same rounded short-haired body-scale and
bottom-center registration authority as the v12 `sit` and `walk` sources;
replacement art that does not fit at that scale fails instead of being
action-locally shrunk. `scripts/build_cat_coat_presets.py` derives the ordinary
coat presets from the same alpha shapes.

## Generation and provenance

- Generated on 2026-08-09 with built-in ImageGen in the project owner's Codex
  session; the provider did not expose a specific underlying model version.
- Identity authority:
  `product-cat-model-sheet-v1/sources/model-sheet-chromakey.png`.
- Approved production-action identity reference:
  `product-cat-quality-slice-v12/sources/sit-source-chromakey.png`.
- The prior idle, lie, and sleep sources were used only as motion-layout
  references; every pose was redrawn from the production identity.
- Normalized generation requests are retained in `generation-prompts.md`.
- No third-party character, brand, illustration, or photograph was requested
  as an input or imitation target.
