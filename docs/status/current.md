# CatStar Current Status

**Status:** Living implementation ledger

**Last aligned:** 2026-11-21

This is the only document that should summarize mutable project-wide
implementation status. Specs define contracts; the art runtime map owns exact
asset provenance; Git history owns completed change history.

## Current local implementation

The mobile companionship experience is in implementation. The runnable
CatStar Phase 0.1 build is a local-first internal H5 prototype for
**喵星来信** / **Letters from Cat Star**.

This ledger describes the locally verified implementation. Git integration,
pull-request, deployment, and production status are separate release facts and
must not be inferred from this document.

The local Issue #79 implementation opens directly to a full-screen
**陪伴场景** in a narrow portrait viewport. **时光信箱** and **护照** open
from the lower corners. Desktop uses the landscape room and its existing
controls. Both layouts use the same passport, letter, and companionship
rules. The planner picks an opening activity and the cat moves between
routine destinations during the visit. The portrait room aligns the blanket
rest position with the painted surface for both opening and jump arrival.

Walter confirmed the phone layout in the 390 × 844 prototype on 2026-11-08,
after the earlier portrait extension was retired. The implementation follows
[the approved layout spec](https://github.com/meetwk0916/CatStar/issues/79).
Walter accepted the revised portrait artwork on 2026-11-10 after reviewing
the 390 × 844 browser capture. Follow the
[manual QA checklist](../qa/phase-0.1.md#mobile-companionship-home) for
the remaining physical-phone checks tracked under
[the experience implementation ticket](https://github.com/meetwk0916/CatStar/issues/77).

## Current destination and hosting state

On 2026-11-21 Walter moved the project destination from a public launch to an
invited beta, recorded in
[`ADR-0011`](../adr/0011-first-external-milestone-is-an-invited-beta.md) and
tracked on
[Wayfinder map: 喵星来信邀请内测](https://github.com/meetwk0916/CatStar/issues/48).
This lifts the 2026-11-06 execution pause. Milestones: by 2026-12-05 settle the
Sites `403` fallback and the invitees' cat coats; by 2026-12-19 be invite-ready
or narrow preset breadth to gray-white only without cutting letter, environment,
form-and-motion, or rights gates.

To preview the local build, follow the [run guide](../../README.md). The
invited beta reuses the repository's existing OpenAI Sites project without
purchasing a custom `.com` domain; direct Cloudflare Workers deployment is the
2026-12-05 fallback if Sites external delivery cannot be cleared (custom `.com`
binding moves to post-beta public-release scope).

As verified on 2026-08-24, the Sites project is active behind owner-only
`custom` access (`version 4`, rollback `version 3`), has no custom domain, and
its deployed version predates the current `main`. Unauthenticated requests
return Cloudflare-edge `HTTP 403` with no matching recent Worker error, so
external delivery is not yet live-verified; the open verification owner is
[Prove Sites public delivery and clear the current edge 403](https://github.com/meetwk0916/CatStar/issues/69).

The hosted configuration has no D1 or R2 binding. Passport and letter state
remain device-local browser data; selecting Sites as the host does not change
the Phase 0 local-data boundary.

The current implementation includes:

- React, TypeScript, Vite, and Tailwind CSS application shell, with a
  Sites-compatible Vinext/Cloudflare Worker production build.
- Lazy-loaded Phaser room scene embedded in React.
- One local memorial passport and local letter-reading progress.
- Registration collects no departure date and displays none. New passports use
  their system-created timestamp to start the letter ritual; older local date
  data remains hidden compatibility data and does not affect delivery.
- Prewritten Phase 0 letter script with delayed device-local delivery.
- Final-letter ordering, farewell choice, **星河陪伴**, and **信箱封存**.
- Re-registration with confirmation.
- Runtime image assets under `public/assets/scenes/window-room/`.
- Six passport-selectable **毛色预设** with stable action timing. Four ordinary
  derivatives share the gray-white alpha geometry; orange-tabby currently uses
  an independent, visibly labelled internal appearance preview and is not
  release-approved. Runtime art authority is separate from the persisted coat
  choice, so existing local passports do not require migration.
- A ten-action runtime contract: idle, sit, walk, jump, eat, awake rest, deep
  sleep, groom, stretch, and interact.
- The gray-white rounded short-haired ten-action motion master is locked for
  internal production work. Its 2026-08-15 ten-action matrix remains historical
  evidence because later scale normalization changed runtime inputs. Historical
  capture-time fingerprint-bound evidence covers gray-white and the internal
  orange
  preview across `idle`, `sit`, and `walk` at `1280x720` and `390x844`;
  meetwk0916 approved all 12 entries on 2026-08-22 for the internal-preview
  boundary and cross-action stability. This scoped approval does not accept the
  current full source tree, renew the full-master lock, accept Issue #23 release
  art, or clear public distribution rights.
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
  Shared source calibration and bottom-center registration now keep apparent
  body scale stable across `idle`, `sit`, and `walk`; source art that cannot fit
  the frozen calibration fails generation instead of being silently shrunk.
  The complete public rights-chain gate remains pending.
- The production-identity jump v6 candidate supplies six distinct phases for
  anticipation, launch, rise, apex balance, prepared descent, and grounded
  recovery. The scene binds those poses to the scripted arc instead of playing
  an unsynchronized fixed-rate animation. Capture-time fingerprint-bound desktop and
  mobile evidence covers the full window-bench round trip; meetwk0916 approved
  both entries on 2026-08-15.
- The production-model-derived quiet-motion v1 candidate supplies the
  gray-white `idle`, awake-rest `lie`, and deep `sleep` authority used by the
  master and four ordinary coat derivatives. Orange uses its separately
  declared internal preview package.
  Structural asset validation and fingerprint-bound desktop/mobile continuous
  evidence pass; all eight floor, cat-bed, and blanket motion entries were
  approved by wakun on 2026-08-09.
- The production-model-derived daily-life v1 candidate now supplies the
  gray-white `eat`, `groom`, and `stretch` authority used by the master and four
  ordinary coat derivatives. Orange uses its separately declared internal
  preview package. Structural asset validation passes. Capture-time
  fingerprint-bound gray-white master evidence at
  desktop and mobile sizes records the complete food route, an 8–12 second
  grooming dwell, and phase-weighted stretch timing; meetwk0916 approved all
  six entries on 2026-08-15.
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
  evidence exists for both approaches; its review state is recorded in the
  runtime asset map.
- Foreground approach and return now use the named-route module for the floor
  approach, stable contact, 760 ms perspective transition, scale/depth handoff,
  reverse return, and touch cancellation. CatRoomScene applies the returned
  frames and owns only the acknowledgement action. Dedicated gray-white
  desktop/mobile continuous evidence covers the complete round trip and touch
  interruption; its review state is recorded in the runtime asset map.
- Current runtime screenshot and continuous-motion evidence sets, fingerprints,
  and per-set human review status are owned solely by
  [`../art/runtime-map.md`](../art/runtime-map.md).
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

The current runtime-evidence set is owned by
[`../art/runtime-map.md`](../art/runtime-map.md). Current test and build results
belong in the gate or CI output rather than this mutable implementation ledger.

Record durable behavior decisions as ADRs rather than adding historical commit
hashes or branch information to this file.

## Remaining work

Invited-beta gates ([`ADR-0011`](../adr/0011-first-external-milestone-is-an-invited-beta.md)):

- Rewrite and approve the eight prewritten **信件** in `src/data/letters.json`
  (currently Phase 0 test copy).
- Calibrate and approve `390 × 844` portrait environment-art cohesion and
  six-zone interaction quality (full-zone portrait captures, room/leaf/cat
  pixel and shadow cohesion, prop scale/anchors/foreground occlusion, and tap
  interruption behavior).
- Capture current-fingerprint continuous-motion evidence (`390 × 844` portrait
  room and `1280 × 720` desktop) and pass Walter's per-entry form-and-motion
  review across all ten actions and room routes — gray-white first, then any
  derivative preset chosen for the invitees' cats — and lock the runtime coat
  selector to approved presets (excluding the internal orange preview).
- Verify browser safe areas and cat, **时光信箱**, and **护照** touch targets on
  a physical phone against the approved `390 × 844` composition.
- Close the art rights gate for every asset group exposed in the invited beta.
- Verify whether the Sites external-visitor allowlist requires invitees to hold
  an OpenAI account, clear the Sites `HTTP 403` (or switch to the Cloudflare
  Workers fallback by 2026-12-05), and write the beta privacy note and
  invitation copy.
- Complete Walter's test-passport walk-through, invite at least three people
  who have lost a cat through **告别选择**, and record whether to pursue a
  public release.

Post-beta and follow-up scope:

- If a public release is chosen after the beta: produce and intake independent
  release-grade orange-tabby art (`artifacts/art/production-briefs/orange-tabby-v1/`,
  Issue #23), complete the six-preset sixty-combination human review
  (`ADR-0010`), close the public-distribution rights gate (including AI-art
  disclosure in public copy), and register/bind a `.com` domain.
- Representative mid-range physical-phone performance evidence was waived on
  2026-08-24 and must be recorded as `waived`, never `passed`; `ADR-0004` still
  requires repeated measured failures before considering a Phaser migration.
- Slender short-haired and fluffy long-haired **外形原型**, plus brown tabby,
  solid gray, tortoiseshell, and colorpoint presets (`ADR-0005` / `ADR-0010`).
- Action classes beyond the ten core actions (kneading, belly-up, chase,
  zoomie, bespoke **自发玩耍** sheets), general prop-interaction extraction,
  one-way/top-only free-form landings, collision rectangle revisit, and Phaser
  chunk-size review after final sprite sheets land.
