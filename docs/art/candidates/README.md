# CatStar Art Candidates

This folder keeps generated art candidates and processing evidence for the
current Phaser room.

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

The active runtime source map is:

```text
docs/art/candidates/product-cat-actions-runtime.md
```

## Active Product-Action Candidates

These directories are the current source chain for runtime assets:

| Candidate | Runtime action | Notes |
| --- | --- | --- |
| `product-cat-actions-v3/` | `eat` | Bowl-aligned source. Runtime loops only the light head-lower frames. |
| `product-cat-actions-v4/` | `lie` | Awake bed/blanket resting. |
| `product-cat-actions-v5/` | `jump` | Dedicated crouch/launch/air/landing candidate. |
| `product-cat-actions-v6/` | `interact` | Tap response; skips the seated source pose. |
| `product-cat-actions-v7/` | `idle` | Current identity baseline. |
| `product-cat-actions-v8/` | `sleep` | Deep sleep reserved for explicit sleep moments. |
| `product-cat-actions-v9/` | `walk` | Slow cat-step walk loop with steadier face/body mass. |

## Retired Product-Action Candidates

These are retained only as review history. Do not wire them back into runtime
without a new visual review.

| Candidate | Reason retired |
| --- | --- |
| `product-cat-actions-v1/` | Walk and eat were replaced by v9 and v3. |
| `product-cat-actions-v2/` | Jump/interact stabilization was replaced by dedicated v5/v6 sources. |

Older `cat-*-keyframes*` directories predate the product-action source chain and
are research references, not current runtime sources.

## Runtime Review Evidence

Current browser screenshots are kept in:

```text
docs/art/runtime-review/2026-06-15/
```

They verify the active cat bed, food bowl, and blanket interactions after the
v9 walk and interaction-anchor tuning pass.

Regenerate browser review screenshots with:

```bash
npm run review:runtime
```

The script starts a local Vite server, injects a review-only local passport, and
captures default walking plus the window bench, cat bed, food bowl, and blanket
debug routines.
