# CatStar Current Status

**Status:** Living implementation ledger  
**Last aligned:** 2026-07-23

This is the only document that should summarize mutable project-wide
implementation status. Specs define contracts; the art runtime map owns exact
asset provenance; Git history owns completed change history.

## Current release

CatStar Phase 0.1 is a working local-first H5 demo for **喵星来信** /
**Letters from Cat Star**.

The current implementation includes:

- React, TypeScript, Vite, Tailwind CSS, and Motion application shell.
- Lazy-loaded Phaser room scene embedded in React.
- One local memorial passport and local letter-reading progress.
- Prewritten Phase 0 letter script with delayed device-local delivery.
- Final-letter ordering, farewell choice, **星河陪伴**, and **信箱封存**.
- Re-registration with confirmation.
- Runtime image assets under `public/assets/scenes/window-room/`.
- Environment-aware floor, window-bench, cat-bed, food-bowl, and blanket routines.
- Dedicated idle, walk, jump, eat, awake-rest, sleep, and interaction animation contracts.

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
npm run build
```

Last verified on 2026-07-23:

- Runtime cat asset structure passed.
- Five saved browser-review screenshots passed validation.
- Vitest passed 2 test files and 9 tests.
- TypeScript and the Vite production build passed.
- Vite continues to warn that the lazy Phaser chunk exceeds 500 kB; chunk-size
  review remains listed below.

Record durable behavior decisions as ADRs rather than adding historical commit
hashes or branch information to this file.

## Remaining work

- Polish responsive layout after browser review on mobile and desktop.
- Decide whether Phaser remains the long-term H5 scene engine.
- Replace generated candidate motion with hand-authored final art.
- Expand zone-aware actions while preserving the current environment contract.
- Add one-way/top-only platform support before enabling free-form landings.
- Complete manual pixel cleanup and interaction timing polish before art lock.
- Split foreground occlusion elements after the scene composition stabilizes.
- Revisit collision rectangles after the final background is approved on mobile.
- Review Phaser chunk size after final sprite sheets are introduced.
