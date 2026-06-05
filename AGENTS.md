# AGENTS.md — CatStar

Read this before changing CatStar.

## Canonical Docs

- `CONTEXT.md` is the domain glossary. Keep it implementation-free.
- `SPEC-Phase0.md` is the Phase 0 implementation target.
- `README.md` is the human handoff and run guide.
- `docs/PROGRESS.md` is the current implementation ledger.
- ADRs live in `docs/adr/`.

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
  - `src/domain/catFsm.ts`: cat state selection and companion reactions.
  - `src/storage/passportStorage.ts`: local storage persistence.
- Phase 0 data stays local. Do not add accounts, upload, sync, or remote storage.
- Do not commit `node_modules/`, `dist/`, or TypeScript build info.

## Commands

```bash
npm install
npm run dev
npm run build
```

Run `npm run build` before committing code changes.
