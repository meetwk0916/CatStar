# CatStar Art Candidates

This folder documents the generated-art workflow for the current Phaser room.
Generated binaries and processing evidence live under `artifacts/art/`.

## Runtime Contract

Runtime cat sheets live in:

```text
public/assets/scenes/window-room/cat/{coat-preset}/
```

Each runtime sheet must follow the `96x96` bottom-center action contract defined
by `public/assets/scenes/window-room/cat/cat.animations.json`.

Run this after replacing any runtime cat sheet:

```bash
npm run check:assets
```

The checker validates sheet dimensions, non-empty alpha frames, stable baselines,
reasonable visible-area changes, and the absence of small detached pixel islands.
`npm run check:assets:release` applies the future first-release profile with all
ten coat presets; it is not evidence that the incomplete release set already
passes.

## Candidate Layout

Candidate packages are split between `active/` and `archive/` under
`artifacts/art/candidates/`. Their layout and retention rules are documented in
[`../../artifacts/art/README.md`](../../artifacts/art/README.md).

The exact runtime-to-candidate selection lives only in
[`runtime-map.md`](runtime-map.md). Candidate indexes and archived package notes
must point there rather than restating which version is current.

Technical lineage does not establish distribution rights. The current
rights-chain gate and production intake requirements live in
[`rights-and-provenance.md`](rights-and-provenance.md).
The Issue #17 evidence draft lives in
[`rights-chain-checklist.md`](rights-chain-checklist.md); it does not change
the gate.

The approved Issue #23 orange-tabby production handoff lives at
[`../../artifacts/art/production-briefs/orange-tabby-v1/README.md`](../../artifacts/art/production-briefs/orange-tabby-v1/README.md).
It locks appearance and delivery requirements only. Until its intake checklist
is completed and the resulting ten-action package passes review, the current
orange appearance preview remains internal comparison art rather than a release
asset.

## Production model-sheet review

Regenerate the mobile review derivative for the approved rounded short-haired
production model sheet with:

```bash
npm run review:model-sheet
```

The output is
`artifacts/art/review/rounded-short-haired-model-sheet-v1/mobile-review-375w.png`.
It combines the dedicated production model source, a `96x96` runtime strip,
and room crops from the fingerprint-bound desktop and `390x844` mobile review
screenshots. It is review evidence only and does not change the rights gate or
grant public distribution clearance.

## Daily-life motion source workflow

The internal `eat`, `groom`, and `stretch` source package is recorded at
`artifacts/art/candidates/active/product-cat-daily-life-v1/`. Rebuild its
transparent normalized sheets with:

```bash
sh scripts/run_python_with_pillow.sh \
  scripts/compose_product_cat_daily_life_v1.py
sh scripts/run_python_with_pillow.sh scripts/build_cat_coat_presets.py
```

The package is derived from the dedicated production model sheet and remains
internal prototype evidence. It does not change the rights gate.

## Runtime Review Workflow

Browser review evidence is stored by capture date under:

```text
artifacts/art/runtime-review/YYYY-MM-DD/
```

The accepted evidence set is listed in [`runtime-map.md`](runtime-map.md).

Regenerate browser review screenshots with:

```bash
npm run review:runtime
```

The capture command requires a `playwright` CLI on `PATH`; it uses the Chrome
channel by default and can be overridden with `CATSTAR_PLAYWRIGHT_CHANNEL`.
It starts a local Vite server, injects a review-only local passport, and
captures ten states: default movement, window bench, cat bed, food bowl,
blanket, grooming, stretching, deep sleep, active approach, and plant touch.

For the accepted narrow mobile pass, run the same capture contract with an
explicit viewport and separate evidence root:

```bash
CATSTAR_REVIEW_VIEWPORT=375,812 \
CATSTAR_REVIEW_OUT=artifacts/art/runtime-review-mobile/YYYY-MM-DD \
npm run review:runtime
```

Validate the existing screenshots without starting a browser with:

```bash
npm run review:runtime:check
```

That command validates the latest desktop evidence. Validate a mobile evidence
directory with its matching viewport explicitly:

```bash
CATSTAR_REVIEW_VIEWPORT=375,812 \
CATSTAR_REVIEW_OUT=artifacts/art/runtime-review-mobile/YYYY-MM-DD \
npm run review:runtime:check
```

## Continuous Motion Review Workflow

Capture entry-through-exit video, posters, and review boards for the selected
actions on desktop and mobile with:

```bash
npm run review:motion -- \
  --output artifacts/art/runtime-motion-review/YYYY-MM-DD-candidate
```

The manifest binds the evidence to its runtime inputs. Record explicit human
decisions with `npm run review:motion:record` and its required `--manifest`,
`--status`, and `--reviewer` arguments; optional preset, action, and viewport
filters limit the decision to matching entries. Structural validation permits
pending decisions. The release gate requires the complete approval matrix to
be supplied independently with preset, action, and named-viewport selectors;
it never treats the manifest's own declared scope as the release contract:

```bash
npm run review:motion:check -- \
  --output artifacts/art/runtime-motion-review/YYYY-MM-DD-candidate
npm run review:motion:check:release -- \
  --preset gray-white-tabby \
  --action sit --action walk --action interact \
  --viewport desktop --viewport mobile \
  --output artifacts/art/runtime-motion-review/YYYY-MM-DD-candidate
```
