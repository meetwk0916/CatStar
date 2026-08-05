# CatStar Current Status

**Status:** Living implementation ledger

**Last aligned:** 2026-08-01

This is the only document that should summarize mutable project-wide
implementation status. Specs define contracts; the art runtime map owns exact
asset provenance; Git history owns completed change history.

## Current local implementation

CatStar Phase 0.1 is a working local-first internal H5 prototype for
**喵星来信** / **Letters from Cat Star**. It is not yet a public beta or
production-quality release.

This ledger describes the locally verified implementation. Git integration,
pull-request, deployment, and production status are separate release facts and
must not be inferred from this document.

The current implementation includes:

- React, TypeScript, Vite, and Tailwind CSS application shell.
- Lazy-loaded Phaser room scene embedded in React.
- One local memorial passport and local letter-reading progress.
- Prewritten Phase 0 letter script with delayed device-local delivery.
- Final-letter ordering, farewell choice, **星河陪伴**, and **信箱封存**.
- Re-registration with confirmation.
- Runtime image assets under `public/assets/scenes/window-room/`.
- Six passport-selectable **毛色预设** sharing one locked gray-white motion
  master and stable action timing.
- A ten-action runtime contract: idle, sit, walk, jump, eat, awake rest, deep
  sleep, groom, stretch, and interact.
- An engine-independent **陪伴例程** planner with temperament weighting,
  recent-intent suppression, awake session opening, dwell windows, and
  zone-aware rendering.
- Environment-aware floor, window-bench, cat-bed, food-bowl, blanket, plant,
  and one-shot foreground-approach routines.
- Reliable visible touch response, occasional **陪伴轻语**, and low-probability
  waking from deep sleep.
- The approved rounded short-haired v11 quality slice now supplies distinct
  `sit`, grounded eight-frame `walk`, and six-frame `interact` runtime sheets;
  the cat displays at `96x96`, approximately 9% larger than the prior runtime.
- The approved static appearance direction is
  `artifacts/art/candidates/active/product-cat-prototypes-v1/concept-sheet-a-v2.png`,
  comparing rounded short-haired, slender short-haired, and fluffy long-haired.

Exact runtime art provenance is maintained in
[`../art/runtime-map.md`](../art/runtime-map.md).

## Canonical references

- [`../../CONTEXT.md`](../../CONTEXT.md): domain vocabulary and language boundaries.
- [`../specs/phase-0.1.md`](../specs/phase-0.1.md): current product and architecture specification.
- [`../specs/environment-interaction.md`](../specs/environment-interaction.md): room-zone behavior contract.
- [`../specs/cat-animation.md`](../specs/cat-animation.md): production animation contract.
- [`../design/art-direction.md`](../design/art-direction.md): visual direction.
- [`../qa/phase-0.1.md`](../qa/phase-0.1.md): manual acceptance checklist.

## Verification

Required before committing code or runtime asset changes:

```bash
npm run check:assets
npm run review:runtime:check
npm test
npm run test:e2e
npm run build
npm run check:bundle
```

The accepted runtime-evidence set is owned by
[`../art/runtime-map.md`](../art/runtime-map.md). Current test and build results
belong in the gate or CI output rather than this mutable implementation ledger.

Record durable behavior decisions as ADRs rather than adding historical commit
hashes or branch information to this file.

## Remaining work

- Polish responsive layout after browser review on mobile and desktop.
- Validate Phaser against the mobile scene-performance gate before treating
  engine migration as active work.
- Replace the reviewed generated motion candidates with commissioned
  hand-authored final art while preserving the validated contract.
- Complete rounded short-haired's remaining seven actions from the approved
  character direction, then produce independent ten-action masters for slender
  short-haired and fluffy long-haired before exposing those prototypes in the
  passport.
- Complete or replace every unresolved art rights-chain record before public,
  paid, marketing, or app-store distribution.
- Replace the six current deterministic coat derivatives with ten reviewed
  complete appearances after the new motion master is approved, adding brown
  tabby, solid gray, tortoiseshell, and colorpoint and reviewing matching eye,
  nose, and paw-pad colors without enabling free mixing or local markings.
- Defer bespoke **自发玩耍** sheets until after the ten core action classes;
  reuse walk and interact motion for Phase 0.1 **主动靠近**.
- Expand zone-aware actions while preserving the current environment contract.
- Add one-way/top-only platform support before enabling free-form landings.
- Complete manual pixel cleanup and interaction timing polish before art lock.
- Split foreground occlusion elements after the scene composition stabilizes.
- Revisit collision rectangles after the final background is approved on mobile.
- Review Phaser chunk size after final sprite sheets are introduced.
- Remove the external Playwright CLI dependency from runtime screenshot
  regeneration, or add it as an explicit project-managed development tool.
