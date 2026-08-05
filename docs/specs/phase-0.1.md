# CatStar Phase 0.1 Current Specification

**Status:** Current

**Last aligned:** 2026-08-01

This document is the current implementation specification for the CatStar web
internal prototype. It supersedes the runtime architecture described in
[`phase-0.md`](./phase-0.md) while preserving the product and language boundaries
defined in [`../../CONTEXT.md`](../../CONTEXT.md).

## Release posture

Phase 0.1 validates the memorial ritual, local-only data model, letter pacing,
and first interactive room slice. It is not a public beta, paid release, or
evidence that current generated art is approved for production.

## Document precedence

When documents disagree, use this order:

1. `CONTEXT.md` and `AGENTS.md` for domain language and non-negotiable product boundaries.
2. This document for the current Phase 0.1 implementation scope and architecture.
3. Specialized specs under `docs/specs/` for animation and environment behavior.
4. `docs/status/current.md` and `docs/art/runtime-map.md` for mutable implementation status.
5. `phase-0.md` only as historical background.

## Product scope

- Support one real deceased cat and one local memorial passport.
- Keep passport data and letter progress on the current device.
- Use prewritten letters from `src/data/letters.json`; do not add generated letters or chat.
- Preserve delayed, device-local letter delivery and the final-letter farewell flow.
- Keep the cat present in **星河陪伴** after **告别选择**.
- Keep Phase 0.1 silent by default; do not autoplay meows, purring, or ambient
  audio.
- Use the vocabulary and gentle grief boundaries in `CONTEXT.md`.

## Current architecture

- React, TypeScript, Vite, and Tailwind CSS provide the application shell.
- Phaser remains the Phase 0.1 renderer for the interactive room scene inside
  the React application, subject to the mobile performance gate in
  [`../qa/phase-0.1.md`](../qa/phase-0.1.md).
- **陪伴例程** planning belongs to CatStar domain logic; Phaser only renders
  the scene and executes engine-specific motion.
- The planner emits engine-independent **陪伴意图**, such as visiting the
  window bench and returning to the floor. Coordinates, tweens, and animation
  keys remain renderer details.
- CatStar domain logic owns companionship pacing, including meaningful dwell
  windows. The renderer owns travel and animation timing derived from scene
  geometry.
- Maintain that boundary when adding another room zone or companion action.
- Runtime scene and animation assets live under `public/assets/scenes/window-room/`.
- Generated source art, candidates, and runtime-review evidence live under `artifacts/art/`.
- Product rules stay outside UI components:
  - `src/domain/time.ts`
  - `src/domain/letters.ts`
  - `src/domain/catFsm.ts`
  - `src/domain/passport.ts`
  - `src/storage/passportStorage.ts`
- Runtime art must follow [`cat-animation.md`](./cat-animation.md).
- Environment-bound movement must follow
  [`environment-interaction.md`](./environment-interaction.md).
- The renderer decision and exit condition are recorded in
  [`ADR-0004`](../adr/0004-retain-phaser-for-phase-0.1-scene-rendering.md).

## Runtime behavior

- The cat uses environment-aware routines for the floor, window bench, cat bed,
  food bowl, and blanket.
- Idle/sit, walking, jumping, eating, awake rest, deep sleep, grooming,
  stretching, and interaction use the shared ten-action animation contract.
- The approved production target offers three art-directed **外形原型**:
  rounded short-haired, slender short-haired, and fluffy long-haired. The user
  chooses an observable silhouette rather than a breed, and every available
  prototype must have the complete ten-action repertoire before it can be
  selected in the product.
- Ten curated **毛色预设** cover orange tabby, solid black, solid white,
  calico, black-and-white tuxedo, gray-and-white tabby, brown tabby, solid
  gray, tortoiseshell, and colorpoint. Each is a reviewed complete appearance,
  not an unrestricted color or marking mixer.
- Appearance selection is manual and bounded. Phase 0.1 does not upload cat
  photos, generate a replica, or promise exact visual reproduction.
- Each prototype preserves its own anchors, timing, and behavior availability
  across coat presets; do not stretch or reuse another prototype's body art.
- The domain planner weights intent by temperament, suppresses recent
  repetition, protects the awake session opening, and hands engine-independent
  intent plus dwell time to Phaser.
- Clicking or tapping the cat produces an in-place companion reaction; it does
  not create new story content or require a vertical jump.
- Runtime asset provenance is tracked in
  [`../art/runtime-map.md`](../art/runtime-map.md).

## Data and delivery

- The first letter is delivered immediately after passport creation.
- Later letters arrive from the next device-local 8:00 AM and accumulate by date.
- Opening a delivered letter marks it read.
- The final letter remains blocked until every ordinary letter has been read.
- **星河陪伴** and **信箱封存** begin only after the farewell choice.

## Mailbox presentation and ordering

- Determine delivery eligibility and list order by `deliveryIndex`, then by
  ascending `id` within the same delivery index.
- Show only delivered letters. Do not render placeholders for future letters or
  expose the full script length in advance.
- Once a letter has been read, device-clock rollback must not lock it again.
  After farewell, the complete delivered archive remains available for review.
- The mailbox entrance shows only the unread delivered-letter count; avoid
  urgent badges, reward language, or pressuring copy.
- Cat behavior does not react to delivery or unread count; the mailbox alone
  communicates that a letter is waiting.
- `id === 99` is the final letter. Once delivered, it may appear in a waiting
  state, but it remains unavailable until every ordinary letter has been read.
- While the final letter is waiting, hide its full title and use the gentle
  placeholder `远方的星光` with `还有几封旧信在等你`.
- Ordinary delivered letters may be read in any order. Opening one marks it
  read without a second confirmation step.
- Reading the final letter does not complete **告别** by itself. If it is closed
  before the farewell choice, it remains read and offers the choice again when
  reopened.

## Verification

Before committing code or runtime asset changes, run:

```bash
npm run check:assets
npm run review:runtime:check
npm test
npm run test:e2e
npm run build
npm run check:bundle
```

The living implementation ledger is [`../status/current.md`](../status/current.md).
