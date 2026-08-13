# ADR-0008: Use a renderer-independent named companion-route executor

- **Status:** Accepted
- **Date:** 2026-08-12
- **Last amended:** 2026-08-13

CatStar will keep Phaser as the Phase 0.1 renderer while decomposing its
implementation at the named **陪伴路线** seam. A renderer-independent route
module under `src/game/` owns authored route geometry, easing, arrival/contact
timing, cancellation settling, and one-active-route enforcement; it returns
execution frames without importing Phaser. `CatRoomScene.ts` remains the Phaser
adapter that owns scene lifecycle, sprites, animation playback, and physics,
while `src/domain/catFsm.ts` continues to own **陪伴意图**, temperament pacing,
and reaction policy.

The migration covers the food-bowl round trip, plant inspection, plant touch,
and foreground approach and return. The interface owns their geometry,
arrival/contact timing, perspective scale/depth transition, and non-resuming
cancellation. `CatRoomScene.ts` owns destination actions and the split-leaf
lifecycle. Scripted jumps remain in the Phaser adapter. This decomposition must
not become general pathfinding, a random route graph, or a domain-level
coordinate model. It amends ADR-0004's earlier assignment of all coordinate and
motion execution to `CatRoomScene.ts` without changing the decision to retain
Phaser.
