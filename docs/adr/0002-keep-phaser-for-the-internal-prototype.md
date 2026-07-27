# ADR-0002: Keep Phaser for the Phase 0.1 internal prototype

- **Status:** Accepted
- **Date:** 2026-07-27

## Context

CatStar needs a small room with sprite animation, anchored jumps, occlusion,
particles, and pointer interaction. Phaser already implements this slice, but
its lazy production chunk is about 1.21 MB minified and 323 kB gzip. Replacing
the engine now would consume prototype effort and could destabilize the
environment routines without proving a user benefit.

The React entry chunk is independent of Phaser and the scene loads lazily.

## Decision

Keep Phaser for the Phase 0.1 internal prototype. Preserve the React/Phaser
boundary in `src/components/PhaserCatScene.tsx`, keep product policy outside
Phaser, and enforce these production-build budgets:

- React entry JavaScript: at most 120 kB gzip;
- lazy Phaser scene: at most 1.25 MB minified and 350 kB gzip.

Re-evaluate the engine before public beta if low-end mobile interaction,
memory, startup, or production-art profiling cannot meet the agreed targets.

## Consequences

- The existing room behavior remains available for internal validation.
- Phaser cost is deferred until the user opens the room chunk, but remains a
  material download and parse cost.
- `npm run check:bundle` makes growth beyond the accepted prototype envelope a
  failing check.
- This decision does not approve Phaser as the permanent production engine.
