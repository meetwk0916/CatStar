# Product Cat Idle v1

**Status:** Rejected review history; do not wire into runtime

This package tested a four-frame standing `idle` loop for the approved
gray-and-white rounded short-haired model. It replaces the legacy narrow v10
standing silhouette that became visibly thinner when the v11 `sit` review
exited to the ordinary floor pause.

The four poses keep one standing baseline and use restrained breathing, one
slow blink, and a small tail shift. The generated chroma-key source is retained
under `sources/`; `alpha/idle-source-alpha.png` is the background-removed
source. `scripts/compose_product_cat_idle.py --candidate product-cat-idle-v1`
applies one shared scale across all poses, then uses nearest-neighbor resizing, binary alpha, a single
64-color palette, and bottom-center placement to build the transparent `96x96`
runtime candidate. `scripts/build_cat_coat_presets.py` derives every current
coat preset from that one alpha shape.

## Generation and provenance

- Generated on 2026-08-08 with built-in ImageGen in the project owner's Codex
  session; the exact model/version was not exposed.
- Identity references: the left-column model in
  `product-cat-prototypes-v1/concept-sheet-a-v2.png`, plus the v11 `sit` and
  `walk` chroma-key sources.
- The generation request used only CatStar's approved original character
  direction and the project-owned reference assets above; it did not request
  imitation of a third-party character, brand, illustration, or photograph.
- The exact normalized generation request is stored in `generation-prompt.md`.
- Human review rejected this v1 candidate because its long horizontal tail
  forced normalization down to 59px standing height and 71.34% of the v11
  `walk` visible mass, producing a visibly smaller standing cat. v2 supersedes
  it; this package remains only to preserve the failed experiment and its
  provenance.
