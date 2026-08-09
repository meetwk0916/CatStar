# Product Cat Idle v3

**Status:** Historical rounded short-haired quality-slice evidence

This package replaces the rejected v1 and v2 standing-idle experiments. v1
was normalized too small because of its long tail. v2 corrected scale and tail
placement but retained v1's slender torso, long-legged stance, and narrow
head-to-body relationship. Human review therefore still read the `sit` exit
as a different, thinner cat.

v3 is a direct redraw from the approved rounded short-haired direction in the
three-prototype comparison and the v11 `sit` and `walk` identity references.
It predates the dedicated production model sheet and does not use v1 or v2 as
an edit target. The four right-facing poses keep a low, broad, deep-bodied
adult silhouette, short sturdy legs, wide cheeks, a short neck, and a tail
close to the hindquarters. Motion remains limited to breathing, one slow blink,
and a small close-tail shift.

The generated chroma-key source is retained under `sources/`;
`alpha/idle-source-alpha.png` is the background-removed source.
`scripts/compose_product_cat_idle.py --candidate product-cat-idle-v3` applies
one shared scale across all four poses, then uses nearest-neighbor resizing,
binary alpha, a single 64-color palette, and bottom-center placement to build
the transparent `96x96` candidate. `scripts/build_cat_coat_presets.py` can
derive every supported coat preset from the same alpha shape. The
production-model-derived quiet-motion v1 package now owns runtime `idle`; see
[`../../../../../docs/art/runtime-map.md`](../../../../../docs/art/runtime-map.md)
for the current selection.

## Generation and provenance

- Generated on 2026-08-08 with built-in ImageGen in the project owner's Codex
  session; the exact model/version was not exposed.
- Direct identity references: the left-column approved model in
  `product-cat-prototypes-v1/concept-sheet-a-v2.png`, plus the project-owned
  v11 `sit` and `walk` sources.
- The retained generation request used “approved model sheet” for that
  direction-only comparison; v3 is not represented as derived from the later
  production model sheet or as final release art.
- Rejected v1 and v2 were explicitly excluded as generation inputs.
- The exact normalized generation request is stored in `generation-prompt.md`.
- wakun approved the desktop and mobile continuous `sit` exits on 2026-08-08;
  both preserve one rounded cat identity.
