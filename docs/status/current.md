# CatStar Current Status

**Status:** Living implementation ledger

**Last aligned:** 2026-08-13

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

- React, TypeScript, Vite, and Tailwind CSS application shell, with a
  Sites-compatible Vinext/Cloudflare Worker production build.
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
- A low-frequency plant-leaf touch vertical slice with a split prop layer,
  temperament weighting, 30-second opening protection, 90-second plus
  five-other-intent cooldown, and safe touch interruption.
- Reliable visible touch response, occasional **陪伴轻语**, and low-probability
  waking from deep sleep.
- The rounded short-haired v12 quality slice now supplies distinct
  `sit`, grounded eight-frame `walk`, and six-frame `interact` runtime sheets,
  all redrawn after approval of the dedicated production model sheet.
  It remains internal quality-slice evidence while final human confirmation and
  the complete rights-chain gate are pending.
- The production-model-derived quiet-motion v1 candidate supplies `idle`,
  awake-rest `lie`, and deep `sleep` across all six current coat presets.
  Structural asset validation and fingerprint-bound desktop/mobile continuous
  evidence pass; all eight floor, cat-bed, and blanket motion entries were
  approved by wakun on 2026-08-09.
- The production-model-derived daily-life v1 candidate now supplies `eat`,
  `groom`, and `stretch` across all six current coat presets. Structural asset
  validation passes, and dedicated gray-white master continuous desktop/mobile
  evidence is recorded; six human-review entries remain pending.
- The first purposeful **陪伴路线** slice now carries the cat from the floor
  to the food bowl through two authored foreground waypoints, continuous
  walking velocity through the turns, a 200 ms arrival deceleration, and a
  150 ms stable contact before eating. The return follows the same path in
  reverse at the same walking pace. Touch cancels this route without resuming
  it.
- Plant inspection and plant touch now use the same renderer-independent named
  route module, with their authored approach waypoint, 200 ms arrival
  deceleration, 150 ms stable contact, and touch cancellation owned behind the
  route interface. Their destination behavior and plant-leaf lifecycle remain
  in the Phaser adapter. Dedicated gray-white desktop/mobile continuous
  evidence exists for both approaches; all four regenerated entries await
  explicit review by meetwk0916.
- Foreground approach and return now use the named-route module for the floor
  approach, stable contact, 760 ms perspective transition, scale/depth handoff,
  reverse return, and touch cancellation. CatRoomScene applies the returned
  frames and owns only the acknowledgement action. Dedicated gray-white
  desktop/mobile continuous evidence covers the complete round trip and touch
  interruption; all four regenerated entries await explicit review by
  meetwk0916.
- Dedicated food-bowl motion evidence is present at
  `artifacts/art/runtime-motion-review/2026-08-12-food-bowl-acceptance/` and
  is structurally valid for desktop and mobile; both regenerated human-review
  entries await explicit review by meetwk0916. The broader runtime screenshot evidence
  under `artifacts/art/runtime-review/2026-08-13/` has been regenerated with
  the latest route input and passes `npm run review:runtime:check`.
- The production identity authority is
  `artifacts/art/candidates/active/product-cat-model-sheet-v1/`; the older
  three-prototype comparison remains visual-direction reference only.

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
- Complete rounded short-haired's remaining `jump` action through the same
  rights-recorded production process as the v12 quality slice. The daily-life
  `eat`, `groom`, and `stretch` candidate and dedicated continuous evidence now
  exist, but human review remains pending. Then produce independent
  ten-action masters for slender short-haired and fluffy long-haired before
  exposing those prototypes in the passport; they do not block the first
  release.
- Complete or replace every unresolved art rights-chain record before public,
  paid, marketing, or app-store distribution.
- Replace the six current deterministic coat derivatives with ten reviewed
  complete appearances after the new motion master is approved, adding brown
  tabby, solid gray, tortoiseshell, and colorpoint and reviewing matching eye,
  nose, and paw-pad colors without enabling free mixing or local markings.
- Defer bespoke **自发玩耍** sheets until after the ten core action classes;
  reuse walk and interact motion for Phase 0.1 **主动靠近**.
- Keep the first-release repertoire frozen at the ten core action classes;
  kneading, belly-up, chase, zoomie, and additional bespoke play motions are
  follow-up scope rather than release blockers.
- Use the plant-touch lifecycle as evidence before extracting a general prop
  interaction framework or expanding other zones.
- Add one-way/top-only platform support before enabling free-form landings.
- Complete manual pixel cleanup and interaction timing polish before art lock.
- Split foreground occlusion elements after the scene composition stabilizes.
- Revisit collision rectangles after the final background is approved on mobile.
- Review Phaser chunk size after final sprite sheets are introduced.
- Remove the external Playwright CLI dependency from runtime screenshot
  regeneration, or add it as an explicit project-managed development tool.
