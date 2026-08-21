# Big-Ginger Shape Preview v2

This is an internal, non-release ten-action appearance prototype for Issue #23.
It asks whether the approved big-ginger identity remains coherent across the
complete CatStar action repertoire at `96x96` runtime scale.

Unlike the earlier palette preview, all ten sheets are newly drawn from the
approved direction prototype. The existing gray-white action rows supplied
motion-phase order only; they did not supply the orange cat's silhouette, face,
markings, or palette.

The built-in ImageGen source strips are recorded in `sources/`. The deterministic
composer removes the chroma key, extracts separated poses, applies one shared
appearance-level source calibration and fixed contact baseline to `idle`,
`sit`, and `walk`, hardens alpha, limits the palette, and writes the
runtime-format sheets plus `contact-sheet.png`. The frozen calibration fails
if replacement art does not fit at the reviewed body scale; it never shrinks an
action to its local maximum bounds. Pose-aware `idle`/`walk` and `sit`/`walk`
measurements supplement that source authority. The authority and measured
ratios are recorded in `metadata.json`.

The walk source was redrawn on 2026-08-20 with a compact stride and raised tail
so the approved big-ginger head and body scale fit the existing `96x96` cell.
The superseded pre-fix strip is retained as
`sources/walk-source-chromakey-v1.png` for before/after diagnosis.

This package is a visual prototype, not rights-cleared production authority. It
must not make the orange preset selectable for release or close Issue #23.

Rebuild:

```bash
sh scripts/run_python_with_pillow.sh scripts/compose_orange_tabby_shape_preview_v2.py
```

The prototype asset profile explicitly recognizes this declared internal
preview, so normal internal validation and scoped motion capture do not need a
hidden environment bypass:

```bash
npm run check:assets
npm run review:motion -- \
  --preset orange-tabby
```

`npm run check:assets:release` must continue to reject this independent
silhouette until Issue #23's production contract is satisfied.
