# Product Cat Quality Slice v12

**Status:** Production-model redraw; desktop and mobile motion approved

This package replaces v11 as the `sit`, `walk`, and `interact` motion source.
Unlike v11, all three source sheets were generated after the dedicated
production model sheet was approved, with that sheet as the sole identity,
anatomy, face, marking, lighting, and pixel-density authority. v11 was used
only as permitted motion-breakdown reference.

The chroma-key sources are retained under `sources/`, with background-removed
copies under `alpha/`. `scripts/compose_product_cat_quality_slice_v12.py`
deterministically extracts and normalizes the poses into `96x96` runtime
sheets. Its reviewed `sit` and `walk` source calibrations share the rounded
short-haired body-scale and bottom-center registration authority with the
quiet-motion `idle`; replacement art that does not fit at that scale fails
instead of being action-locally shrunk. `scripts/build_cat_coat_presets.py`
derives each current coat preset from the same alpha shapes, except for the
explicit internal orange appearance preview documented in the runtime map.

## Generation and provenance

- Generated on 2026-08-08 with built-in ImageGen in the project owner's Codex
  session; the provider did not expose a specific underlying model version.
- Identity authority:
  `product-cat-model-sheet-v1/sources/model-sheet-chromakey.png`, approved by
  wakun on 2026-08-08 before these action sources were generated.
- Motion references: the matching v11 action source for phase ordering only.
- The normalized production requests are retained in `generation-prompts.md`.
- No third-party character, brand, illustration, or photograph was requested
  as an input or imitation target.
- wakun approved all six desktop/mobile continuous-motion entries on
  2026-08-08 in `2026-08-08-quality-slice-v5`.
