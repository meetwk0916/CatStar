# ADR-0004: Retain Phaser for Phase 0.1 scene rendering

- **Status:** Accepted
- **Date:** 2026-07-29

## Context

CatStar's room is a quiet **陪伴场景**, not an interactive simulation. Phaser
already renders the current sprite animation, room layers, grounded movement,
and touch reaction, but the existing scene component also owns too much
**陪伴例程** planning. Replacing the engine before measuring a user-visible
problem would add migration risk while final art and interaction polish remain
unfinished.

## Decision

Retain Phaser as the Phase 0.1 scene renderer. CatStar domain logic owns
engine-independent **陪伴意图** and companionship pacing; Phaser owns
coordinates, tweens, animation keys, and motion execution. Maintain this
boundary when adding another room zone or companion action.

Do not start an engine migration unless the scene repeatedly fails the mobile
performance checks in `docs/qa/phase-0.1.md`. Choosing a replacement renderer is
deferred until that evidence exists.

## Consequences

- Current art and interaction work can continue without an engine rewrite.
- Scene behavior becomes independently testable and portable.
- `PhaserCatScene.tsx` must not resume accumulating domain-level routine
  decisions.
- Phaser remains conditional on measured mobile performance rather than
  becoming a permanent product boundary.
