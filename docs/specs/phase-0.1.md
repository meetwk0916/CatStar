# CatStar Phase 0.1 Current Specification

**Status:** Current  
**Last aligned:** 2026-07-23

This document is the current implementation specification for the CatStar web
demo. It supersedes the runtime architecture described in
[`phase-0.md`](./phase-0.md) while preserving the product and language boundaries
defined in [`../../CONTEXT.md`](../../CONTEXT.md).

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
- Use the vocabulary and gentle grief boundaries in `CONTEXT.md`.

## Current architecture

- React, TypeScript, Vite, Tailwind CSS, and Motion provide the application shell.
- Phaser renders the interactive room scene inside the React application.
- Runtime scene and animation assets live under `public/assets/scenes/window-room/`.
- Generated source art, candidates, and runtime-review evidence live under `artifacts/art/`.
- Product rules stay outside UI components:
  - `src/domain/time.ts`
  - `src/domain/letters.ts`
  - `src/domain/catFsm.ts`
  - `src/storage/passportStorage.ts`
- Runtime art must follow [`cat-animation.md`](./cat-animation.md).
- Environment-bound movement must follow
  [`environment-interaction.md`](./environment-interaction.md).

## Runtime behavior

- The cat uses environment-aware routines for the floor, window bench, cat bed,
  food bowl, and blanket.
- Walking, jumping, eating, awake resting, sleeping, and interaction use dedicated
  animation contracts.
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
- The mailbox entrance shows only the unread delivered-letter count; avoid
  urgent badges, reward language, or pressuring copy.
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
npm run build
```

The living implementation ledger is [`../status/current.md`](../status/current.md).
