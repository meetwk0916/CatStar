# Product Cat Actions Runtime Map

Last updated: 2026-07-27

This file maps the current runtime cat action sheets to their candidate sources.
It is the review checklist for the current product-asset pass.
Rights and distribution status are tracked separately in
[`rights-and-provenance.md`](rights-and-provenance.md); all current generated
assets remain internal-prototype-only while that evidence is incomplete.

## Runtime Sheets

| Runtime sheet | Current source | Status |
| --- | --- | --- |
| `public/assets/scenes/window-room/cat/idle.png` | `artifacts/art/candidates/active/product-cat-actions-v7/` | Product candidate: calm 4-frame standing idle with subtle breathing and blink. |
| `public/assets/scenes/window-room/cat/walk.png` | `artifacts/art/candidates/active/product-cat-actions-v9/` | Product candidate: 8-frame slow cat-step walk with clearer four-foot gait. |
| `public/assets/scenes/window-room/cat/eat.png` | `artifacts/art/candidates/active/product-cat-actions-v3/` | Product candidate: bowl-aligned 6-frame sniff/eat loop. |
| `public/assets/scenes/window-room/cat/lie.png` | `artifacts/art/candidates/active/product-cat-actions-v4/` | Product candidate: awake resting loop for cat bed and blanket. |
| `public/assets/scenes/window-room/cat/jump.png` | `artifacts/art/candidates/active/product-cat-actions-v5/` | Product candidate: 5-frame crouch, launch, air, landing, settle jump. |
| `public/assets/scenes/window-room/cat/interact.png` | `artifacts/art/candidates/active/product-cat-actions-v6/` | Product candidate: affectionate nuzzle/blink response. |
| `public/assets/scenes/window-room/cat/sleep.png` | `artifacts/art/candidates/active/product-cat-actions-v8/` | Product candidate: deep curled sleeping loop for explicit sleep moments. |

## Runtime Behavior Notes

- `walk`, `jump`, `eat`, `lie`, and `interact` now have dedicated action intent.
- Runtime `eat` intentionally loops only the light head-lower frames from the
  v3 sheet. The deepest crouch frames read as lying/sniffing the floor in the
  room and should not be used in the default food-bowl loop.
- `lie` and `sleep` are intentionally separate: `lie` is awake companionship on
  rest surfaces, while `sleep` is deeper sleep for future explicit sleep moments.
- `idle` remains the main baseline identity reference. Because it is now a
  product-action candidate, all other action sheets should be checked against
  its face/body mass during final art review.
- Current runtime review screenshots are stored under
  `artifacts/art/runtime-review/2026-07-27/`:
  - `default-walk-4s.png`
  - `window-bench-6s.png`
  - `catbed-rest-10s.png`
  - `food-bowl-eat-8s.png`
  - `blanket-rest-10s.png`
- Regenerate the set with `npm run review:runtime`.
- `manifest.json` binds the accepted screenshots to the exact runtime input
  fingerprint; `npm run review:runtime:check` fails after those inputs change.

## Candidate Retention

- Active runtime source candidates: v3, v4, v5, v6, v7, v8, v9.
- Retired review-history candidates: v1 and v2. They are retained for trace
  history only and should not be wired back into runtime without a new visual
  review.
