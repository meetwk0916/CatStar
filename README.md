# 喵星来信

Phase 0 web demo for **喵星来信** / **Letters from Cat Star**: a local-first memorial companionship experience for people grieving a real cat who has died.

## What Phase 0 Includes

- One local **护照** for one deceased real cat.
- Minimal onboarding fields: cat name, family address name, coat color, personality, favorite snack, and passed date.
- Pure-code 16x16 pixel cat rendering with palette-based coat colors.
- A small Cat Star island scene with ordinary companionship expressions.
- A **时光信箱** with prewritten letters, not AI-generated text.
- Letter delivery rules:
  - Letter 1 arrives immediately after passport creation.
  - Later letters arrive at 8:00 AM device-local time, starting the next calendar day.
  - Delivery accumulates even if the app is closed.
- Final-letter flow:
  - The final letter must be opened last.
  - Opening a delivered normal letter marks it read.
  - The final letter can be read, but **星河陪伴** starts only after the farewell choice at the end.
- Local-only data: passport and reading progress stay on the current device.

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL printed by the dev server, usually:

```text
http://127.0.0.1:5173/
```

## Verify

```bash
npm run build
```

This runs TypeScript build checks and Vite production bundling.

## Project Structure

```text
src/
  components/              UI components
  data/letters.json         Phase 0 prewritten test letters
  domain/                   Product rules kept out of UI components
  storage/passportStorage.ts local passport persistence
  types.ts                  Shared domain types
```

## Domain Docs

- [CONTEXT.md](./CONTEXT.md): glossary and domain language.
- [SPEC-Phase0.md](./SPEC-Phase0.md): Phase 0 product and implementation spec.
- [docs/PROGRESS.md](./docs/PROGRESS.md): current implementation state, verification, and remaining work.
- [docs/ART_DIRECTION.md](./docs/ART_DIRECTION.md): Phase 0.1A visual quality direction and asset rules.
- [docs/QA.md](./docs/QA.md): Phase 0.1 manual QA checklist.
- [docs/adr/0001-local-memorial-data-for-phase-0.md](./docs/adr/0001-local-memorial-data-for-phase-0.md): why Phase 0 stores memorial data locally.
