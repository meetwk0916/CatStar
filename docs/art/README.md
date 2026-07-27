# CatStar Art Candidates

This folder documents the generated-art workflow for the current Phaser room.
Generated binaries and processing evidence live under `artifacts/art/`.

## Runtime Contract

Runtime cat sheets live in:

```text
public/assets/scenes/window-room/cat/
```

Each runtime sheet must follow the `96x96` bottom-center action contract defined
by `public/assets/scenes/window-room/cat/cat.animations.json`.

Run this after replacing any runtime cat sheet:

```bash
npm run check:assets
```

The checker validates sheet dimensions, non-empty alpha frames, stable baselines,
reasonable visible-area changes, and the absence of small detached pixel islands.

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

The script starts a local Vite server, injects a review-only local passport, and
captures default walking plus the window bench, cat bed, food bowl, and blanket
debug routines.

Validate the existing screenshots without starting a browser with:

```bash
npm run review:runtime:check
```
