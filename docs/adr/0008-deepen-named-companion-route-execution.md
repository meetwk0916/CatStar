# ADR-0008: Deepen named companion-route execution inside the renderer

- **Status:** Accepted
- **Date:** 2026-08-12

CatStar will keep Phaser as the Phase 0.1 renderer while decomposing its
implementation at the named **陪伴路线** seam. A pure renderer-internal route
module under `src/game/` owns authored route geometry, easing, arrival/contact
timing, cancellation settling, and one-active-route enforcement; it returns
execution frames without importing Phaser. `CatRoomScene.ts` remains the Phaser
adapter that owns scene lifecycle, sprites, animation playback, and physics,
while `src/domain/catFsm.ts` continues to own **陪伴意图**, temperament pacing,
and reaction policy.

The first migration is only the food-bowl round trip: floor-to-food-bowl and
food-bowl-to-floor. Scripted jumps, plant routines, and **主动靠近** stay in
their existing implementation until another destination demonstrates shared
needs. This decomposition must not become general
pathfinding, a random route graph, or a domain-level coordinate model. It
amends ADR-0004's earlier assignment of all coordinate and motion execution to
`CatRoomScene.ts` without changing the decision to retain Phaser.
