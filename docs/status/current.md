# CatStar Current Status

**Status:** Living implementation ledger
**Last aligned:** 2026-07-27

This is the only document that should summarize mutable project-wide
implementation status. Specs define contracts; the art runtime map owns exact
asset provenance; Git history owns completed change history.

## Current release

CatStar Phase 0.1 is a working local-first internal H5 prototype for
**喵星来信** / **Letters from Cat Star**. It is not yet a public beta or
production-quality release.

The current implementation includes:

- React, TypeScript, Vite, and Tailwind CSS application shell.
- Lazy-loaded Phaser room scene embedded in React.
- One local memorial passport and local letter-reading progress.
- Prewritten Phase 0.1 letter script with delayed device-local delivery.
- Final-letter ordering, farewell choice, **星河陪伴**, and **信箱封存**.
- Re-registration with confirmation.
- Runtime image assets under `public/assets/scenes/window-room/`.
- Environment-aware floor, window-bench, cat-bed, food-bowl, and blanket routines.
- Personality-specific routine order, duration, and movement pace behind a
  testable domain policy.
- Dedicated idle, walk, jump, eat, awake-rest, sleep, and interaction animation contracts.
- Focus-managed dialogs, keyboard cat interaction, and mobile layouts covered
  by browser regression tests.
- Repository configuration adds browser regression and bundle-budget checks
  plus weekly npm/Actions Dependabot updates. These run on GitHub only after
  the configuration is committed and integrated there.

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

Last verified on 2026-07-27:

- Runtime cat asset structure passed.
- Five browser-review screenshots were regenerated and bound to the current
  runtime-input fingerprint.
- Vitest passed 6 test files and 31 tests.
- Playwright passed 10 flows, including 320, 375, 414, and 768 px layouts,
  persistence, mailbox/farewell, reset, focus, and keyboard interaction.
- TypeScript and the Vite production build passed.
- `npm audit` reports zero known vulnerabilities after moving the build chain
  to Vite 8.1.5 and `@vitejs/plugin-react` 6.0.4.
- The entry JavaScript is about 69 kB gzip. The lazy Phaser scene is about
  323 kB gzip and remains within ADR-0002's internal-prototype budget.
- Runtime assets were reduced from about 4.4 MB to about 0.8 MB by storing the
  room layers at their actual 640x360 runtime size.

The 2026-07-27 internal-prototype blockers found by the audit are fixed. No
automated check substitutes for the manual emotional-tone and low-end-device
review in the QA checklist.

Record durable behavior decisions as ADRs rather than adding historical commit
hashes or branch information to this file.

## Work before broader release

- Complete manual QA on representative low-end phones and review the grief
  language with humans before any public beta.
- Re-evaluate whether Phaser remains the long-term H5 scene engine using
  ADR-0002's public-beta exit criteria.
- Replace generated candidate motion with hand-authored final art.
- Complete or replace every unresolved art rights-chain record before public,
  paid, marketing, or app-store distribution.
- Expand zone-aware actions while preserving the current environment contract.
- Add one-way/top-only platform support before enabling free-form landings.
- Complete manual pixel cleanup and interaction timing polish before art lock.
- Split foreground occlusion elements after the scene composition stabilizes.
- Revisit collision rectangles after the final background is approved on mobile.
- Migrate or prune the 30+ MB candidate archive only through an explicit,
  recoverable asset-retention change; do not add more retired binaries by default.
