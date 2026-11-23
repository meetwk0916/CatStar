# 喵星来信

Phase 0.1 internal web prototype for **喵星来信** / **Letters from Cat Star**:
a local-first memorial companionship experience for people grieving a real cat
who has died. It is not yet a public beta or production-art build. The current
destination is an invited beta
([ADR-0011](./docs/adr/0011-first-external-milestone-is-an-invited-beta.md)).

## What Phase 0.1 Includes

- One local **护照** for one deceased real cat.
- Minimal onboarding fields: cat name, family address name, coat preset,
  companion temperament, and favorite snack. Registration does not ask for or
  display a departure date; passport creation time starts the letter ritual.
- Six passport-selectable coat presets. Orange tabby currently renders as a
  visibly labelled internal appearance preview, not production or release art;
  the other five use the rounded short-haired motion authority.
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
(
  export CATSTAR_REVIEW_OUT="$(mktemp -d "${TMPDIR:-/tmp}/catstar-runtime-review.XXXXXX")"
  test -n "$CATSTAR_REVIEW_OUT" || exit 1
  npm run review:runtime && npm run review:runtime:check
)
npm test
npm run test:e2e
npm run build
npm run check:bundle
```

This checks runtime cat sprite-sheet structure, captures and validates browser
review screenshots in the same temporary directory, runs domain and browser
regression tests, builds the OpenAI Sites-compatible Vinext app and its
Cloudflare Worker output, and enforces the accepted internal-prototype bundle
budget.

## Hosting

The production build targets the existing OpenAI Sites project identified by
`.openai/hosting.json`. A successful build or Sites deployment does not by
itself mean the public site is reachable. The current hosting route, public
HTTP status, and release blockers are maintained in
[`docs/status/current.md`](./docs/status/current.md).

For a candidate that will be exposed outside the owner-only preview, including
a temporary HTTP probe, check the exact assembled `dist/client/assets/` tree
against the inventory signed off in the
[target rights review](./docs/art/rights-chain-checklist.md):

```bash
python3 scripts/check_beta_assets.py --approved /path/to/approved-assets.json
```

Package the same checked output without rebuilding. Hiding a coat from the UI
does not remove its files. If hosting can be diagnosed with a probe containing
no project art, prefer that over opening the product candidate.

For read-only Sites verification, use the native `get_site` tool in a
Sites-enabled session for the existing project ID in `.openai/hosting.json`.
If a deployment ID is known, use `get_deployment_status` for that deployment;
record its version/source commit and the current audience separately. Verify
the exact hosted root and a real generated asset with ordinary requests;
record HTTP status separately from the deployment result. If the Sites tools
are unavailable, mark the version and audience unverified; HTTP alone cannot
establish either. The Sites identity reference states that private browser
access requires sign-in; verify the specific external-visitor flow separately
if needed, without changing the audience for a read-only check.

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
build/ and worker/          OpenAI Sites build adapter and Worker entry
```

## Documentation

- [CONTEXT.md](./CONTEXT.md): glossary and domain language.
- [docs/README.md](./docs/README.md): documentation map and precedence.
- [docs/specs/phase-0.1.md](./docs/specs/phase-0.1.md): current product and architecture spec.
- [docs/status/current.md](./docs/status/current.md): living implementation state and remaining work.
- [docs/qa/phase-0.1.md](./docs/qa/phase-0.1.md): Phase 0.1 manual QA checklist.
- [docs/adr/0001-local-memorial-data-for-phase-0.md](./docs/adr/0001-local-memorial-data-for-phase-0.md): why Phase 0 stores memorial data locally.
