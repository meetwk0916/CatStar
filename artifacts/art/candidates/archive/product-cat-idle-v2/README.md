# Product Cat Idle v2

**Status:** Rejected review history; do not wire into runtime

This package corrects the rejected v1 standing idle. Every pose keeps the
ringed tail close to the hindquarters so normalization can preserve the same
standing height and visible body mass as the approved v11 `walk`, rather than
letting a long horizontal tail shrink the whole cat.

The four right-facing poses remain on one ground line and use restrained
breathing, one slow blink, and a small close-tail shift. The generated
chroma-key source is retained under `sources/`; `alpha/idle-source-alpha.png`
is the background-removed source. `scripts/compose_product_cat_idle.py`
applies one shared scale across the four poses, nearest-neighbor resizing,
binary alpha, a single 64-color palette, and bottom-center placement to build
the transparent `96x96` runtime candidate. `scripts/build_cat_coat_presets.py`
derives every current coat preset from the same alpha shape.

## Generation and provenance

- Generated on 2026-08-08 with built-in ImageGen in the project owner's Codex
  session; the exact model/version was not exposed.
- Edit target: the rejected `product-cat-idle-v1` chroma-key source.
- Identity references: the left-column approved model in
  `product-cat-prototypes-v1/concept-sheet-a-v2.png`, plus the project-owned v11
  `walk` and `sit` sources.
- The exact normalized edit request is stored in `generation-prompt.md`.
- Human review rejected this candidate because changing the tail and scale did
  not change v1's slender torso, long-legged stance, and narrow head-to-body
  relationship. v3 supersedes it with a direct redraw from the approved model
  sheet; this package remains only as review and provenance history.
