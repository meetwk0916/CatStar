# AGENTS.md — CatStar

Read this before changing CatStar.

## Canonical Docs

- `CONTEXT.md` is the domain glossary. Keep it implementation-free.
- `docs/README.md` is the documentation map and precedence guide.
- `docs/specs/phase-0.1.md` is the current product and architecture specification.
- `docs/specs/phase-0.md` is a historical baseline and must not override current architecture.
- `README.md` is the human handoff and run guide.
- `docs/status/current.md` is the only project-wide mutable implementation ledger.
- `docs/design/art-direction.md` is the current visual quality direction.
- `docs/specs/cat-animation.md` is the production target for cat motion assets.
- `docs/specs/environment-interaction.md` is the room-zone behavior contract.
- `docs/qa/phase-0.1.md` is the Phase 0.1 manual QA checklist.
- ADRs live in `docs/adr/`.

When documents conflict, use `CONTEXT.md` and this file for product boundaries,
then the current Phase 0.1 spec, then the relevant specialized spec. Historical
specs and mutable status notes never override those sources.

## Product Boundaries

- Phase 0 supports only a real deceased cat. Do not generalize to pets, dogs, or `petType`.
- Letters are prewritten scripts from `src/data/letters.json`; do not add AI-generated letters or chat behavior.
- Do not collect concrete memories or long personal stories in Phase 0.
- User-facing copy should say `家人称呼`, not `主人姓名`.
- Use gentle grief language. Avoid commands like `别难过了`, `快点走出来`, or `你一定要快乐`.
- The final visual marker is `星尘标记`; avoid `光环`, `天使`, `升天`, or similar religious/ascension language.

## Engineering Rules

- Keep product logic out of UI components:
  - `src/domain/time.ts`: delivery time calculations.
  - `src/domain/letters.ts`: mailbox, delivery, read/final-letter rules.
  - `src/domain/passport.ts`: passport validation, migration, read/farewell invariants.
  - `src/domain/catFsm.ts`: cat routine policy and companion reactions.
  - `src/game/CatRoomScene.ts`: Phaser coordinates, animation, and physics adapter.
  - `src/storage/passportStorage.ts`: local storage persistence.
- Phase 0 data stays local. Do not add accounts, upload, sync, or remote storage.
- Do not commit `node_modules/`, `dist/`, or TypeScript build info.

## Commands

```bash
npm install
npm run dev
npm run check:assets
npm run review:runtime:check
npm test
npm run test:e2e
npm run build
npm run check:bundle
```

Run `npm run check:assets`, `npm run review:runtime:check`, `npm test`,
`npm run test:e2e`, `npm run build`, and `npm run check:bundle` before
committing code or runtime asset changes.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

This is a single-context repository using root-level `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
