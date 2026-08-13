# 喵星来信

Phase 0.1 internal web prototype for **喵星来信** / **Letters from Cat Star**:
a local-first memorial companionship experience for people grieving a real cat
who has died. It is not yet a public beta or production-art build.

## What Phase 0.1 Includes

- One local **护照** for one deceased real cat.
- Minimal onboarding fields: cat name, family address name, coat preset,
  companion temperament, favorite snack, and optional passed date.
- Six curated coat presets on one stylized-natural, rounded short-haired appearance prototype.
- A Phaser-rendered window room with runtime assets under `public/assets/`.
- Ten dedicated cat action classes and weighted, zone-aware room routines for ordinary companionship.
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

Prerequisites: Node.js 20.19 or newer (or 22.12 or newer), Python 3.12 with
Pillow for art checks, and a local Chrome installation for browser/runtime
review.

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
npm run check:assets
npm run review:runtime:check
npm test
npm run test:e2e
npm run build
npm run check:bundle
```

This checks runtime cat sprite-sheet structure, validates saved browser review
screenshots, runs domain and browser regression tests, builds the
Sites-compatible Vinext/Cloudflare Worker app, and enforces the accepted
internal-prototype bundle budget.

## Project Structure

```text
app/                        Vinext production entry
src/
  components/              UI components
  data/letters.json         Phase 0 prewritten test letters
  domain/                   Product rules kept out of UI components
  game/                     Named-route execution and Phaser scene adapter
  storage/passportStorage.ts local passport persistence
  types.ts                  Shared domain types
docs/                       Specifications, status, QA, ADRs, and documentation indexes
artifacts/art/              Generated art sources, candidates, and review evidence
public/assets/              Runtime assets consumed by the app
build/ and worker/          Sites build adapter and Cloudflare Worker entry
```

## Documentation

- [CONTEXT.md](./CONTEXT.md): glossary and domain language.
- [docs/README.md](./docs/README.md): documentation map and precedence.
- [docs/specs/phase-0.1.md](./docs/specs/phase-0.1.md): current product and architecture spec.
- [docs/status/current.md](./docs/status/current.md): living implementation state and remaining work.
- [docs/qa/phase-0.1.md](./docs/qa/phase-0.1.md): Phase 0.1 manual QA checklist.
- [docs/adr/0001-local-memorial-data-for-phase-0.md](./docs/adr/0001-local-memorial-data-for-phase-0.md): why Phase 0 stores memorial data locally.
