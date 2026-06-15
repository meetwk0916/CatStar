# Product Cat Actions Runtime Map

Last updated: 2026-06-15

This file maps the current runtime cat action sheets to their candidate sources.
It is the review checklist for the current product-asset pass.

## Runtime Sheets

| Runtime sheet | Current source | Status |
| --- | --- | --- |
| `public/assets/scenes/window-room/cat/idle.png` | `docs/art/candidates/product-cat-actions-v7/` | Product candidate: calm 4-frame standing idle with subtle breathing and blink. |
| `public/assets/scenes/window-room/cat/walk.png` | `docs/art/candidates/product-cat-actions-v9/` | Product candidate: 8-frame slow cat-step walk with clearer four-foot gait. |
| `public/assets/scenes/window-room/cat/eat.png` | `docs/art/candidates/product-cat-actions-v3/` | Product candidate: bowl-aligned 6-frame sniff/eat loop. |
| `public/assets/scenes/window-room/cat/lie.png` | `docs/art/candidates/product-cat-actions-v4/` | Product candidate: awake resting loop for cat bed and blanket. |
| `public/assets/scenes/window-room/cat/jump.png` | `docs/art/candidates/product-cat-actions-v5/` | Product candidate: 5-frame crouch, launch, air, landing, settle jump. |
| `public/assets/scenes/window-room/cat/interact.png` | `docs/art/candidates/product-cat-actions-v6/` | Product candidate: affectionate nuzzle/blink response. |
| `public/assets/scenes/window-room/cat/sleep.png` | `docs/art/candidates/product-cat-actions-v8/` | Product candidate: deep curled sleeping loop for explicit sleep moments. |

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
  `docs/art/runtime-review/2026-06-15/`:
  - `default-walk-2s.png`
  - `window-bench-6s.png`
  - `catbed-rest-10s.png`
  - `food-bowl-eat-8s.png`
  - `blanket-rest-10s.png`
- Regenerate the set with `npm run review:runtime`.

## Candidate Retention

- Active runtime source candidates: v3, v4, v5, v6, v7, v8, v9.
- Retired review-history candidates: v1 and v2. They are retained for trace
  history only and should not be wired back into runtime without a new visual
  review.

## Remaining Product-Art Risks

- The current sheets are generated and normalized candidates, not hand-authored
  final animation.
- Small edge and pixel-cluster cleanup is still expected before final art lock.
- Browser runtime review should be repeated after any timing, scale, or Phaser
  anchor changes.
