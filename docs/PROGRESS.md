# CatStar Progress

Last aligned: 2026-06-05

## Current State

CatStar Phase 0.1 is a working local-first H5 demo for **喵星来信** / **Letters from Cat Star**.

The current implementation includes:

- React + TypeScript + Vite + Tailwind CSS + Motion app scaffold.
- Lazy-loaded Phaser 3 room-scene spike embedded inside the React shell.
- Local-only passport creation and persistence through `localStorage`.
- Minimum onboarding fields: cat name, family address name, coat color, personality, favorite snack, and passed date.
- Runtime image-asset room scene under `public/assets/scenes/window-room/`.
- Generated empty room background, first art-directed cat action baseline, animation metadata, and hand-authored Arcade Physics collision config.
- Cat action keyframe candidate under `docs/art/candidates/cat-action-keyframes/`, with transparent source, normalized `96x96` preview poses, and assembled runtime-sized action sheets.
- Dedicated walk-cycle candidate under `docs/art/candidates/cat-walk-cycle-keyframes/`, archived for cleanup; runtime `walk` currently uses the rounder-face baseline to avoid side-face clipping artifacts.
- Dedicated jump/interact candidate under `docs/art/candidates/cat-jump-interact-keyframes/`, now used for runtime `jump` and `interact`.
- Room-zone movement: walk targets use floor zones; jump has anticipation and clear floor-to-floor travel distance while prop landing waits for one-way platform support.
- Autonomous cat movement with idle, walk, jump, sleep, and click/tap companion animations.
- Prewritten Phase 0 letter script in `src/data/letters.json`; no AI-generated letters or chat.
- Development-only time preview controls for delivery-day QA.
- Mailbox delivery logic:
  - Letter 1 is delivered immediately after passport creation.
  - Later letters are delivered at 8:00 AM device-local time starting the next calendar day.
  - Delivery accumulates while the app is closed.
  - Mailbox entrance shows only unread count.
  - Mailbox list shows only delivered letters.
- Final-letter flow:
  - Final letter must be opened last.
  - Normal letters mark read on open.
  - Final letter can be read, but **星河陪伴** and **信箱封存** begin only after the farewell choice at the end.
- Re-registration flow that clears local passport and reading progress after confirmation.

## Key Files

- `README.md`: run and handoff guide.
- `AGENTS.md`: rules for future agents.
- `CONTEXT.md`: domain glossary and language boundaries.
- `SPEC-Phase0.md`: Phase 0 target specification.
- `docs/adr/0001-local-memorial-data-for-phase-0.md`: local-data decision.
- `docs/ART_DIRECTION.md`: visual quality direction and asset rules.
- `docs/CAT_ANIMATION_SPEC.md`: production target for consistent cat motion assets.
- `docs/ENVIRONMENT_INTERACTION_SPEC.md`: room-zone behavior model for grounded cat actions.
- `docs/QA.md`: Phase 0.1 manual QA checklist.
- `src/domain/time.ts`: delivery time calculation and dev preview delivery-index helper.
- `src/domain/letters.ts`: mailbox, read-state, and final-letter rules.
- `src/domain/catFsm.ts`: cat state weights and companion reactions.
- `src/storage/passportStorage.ts`: local passport persistence.
- `src/components/PhaserCatScene.tsx`: Phaser room scene spike.
- `public/assets/scenes/window-room/`: current runtime scene assets.

## Verification

Validated on 2026-06-05:

```bash
npm test
npm run build
```

Result: domain unit tests, TypeScript build, and Vite production build passed.

Previously validated after Phase 0 implementation:

```bash
curl -I http://127.0.0.1:5173/
```

Result: local Vite dev server returned `HTTP/1.1 200 OK`.

## Git

- Remote: `https://github.com/meetwk0916/CatStar.git`
- Branch: `main`
- Phase 0 implementation commit: `45a1e6e feat: implement CatStar phase 0 demo`
- Documentation handoff commit: `aae9db0 docs: sync CatStar phase 0 handoff`

## Remaining Work

- Polish responsive layout after browser review on mobile and desktop.
- Decide whether to keep Phaser as the long-term H5 scene engine or use this spike only to validate motion feel.
- Replace assembled candidate cat action sheets with hand-authored final art following `docs/CAT_ANIMATION_SPEC.md`.
- Move sleep/eat/rest states onto environment zones following `docs/ENVIRONMENT_INTERACTION_SPEC.md`.
- Add one-way/top-only platform support before enabling true bed/window-bench landings.
- Manually clean the 8-frame walk candidate while preserving the rounder face, then revisit jump landing timing and interact edge/pixel clusters before final art lock.
- Add foreground/midground split assets after the first scene composition is approved.
- Review Phaser chunk size after real sprite sheets are introduced.
