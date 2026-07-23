# CatStar Art Direction

**Status:** Current visual direction
Last updated: 2026-07-23

## Priority

CatStar's highest Phase 0.1A priority is the first scene quality slice. The mailbox and letter logic are important, but the product will not work unless the first screen feels warm, finished, and worth staying with.

## Product Position

CatStar is a local-first memorial companion tool, not a game-first product. The visual direction should feel like a quiet pixel-art keepsake:

- tender
- warm
- quiet
- nostalgic
- mobile-friendly
- polished enough for a paid or App Store-quality product

## Visual Language

- Style: refined indie pixel art, not raw block placeholders.
- Mood: cozy night room, window light, soft amber lamp light, deep blue outside sky.
- Scene: a familiar home corner with a window bench, cushion, plant, folded blanket, bowl, and subtle pawprint memory details.
- Cat: soft domestic cat, readable at small mobile scale, gentle expression, no angel or religious treatment.
- Animation: small physical motion should feel grounded: walking, jumping, landing, resting, and light click/tap feedback.

## Avoid

- angel wings
- halos
- heaven/ascension imagery
- spooky grief imagery
- medical or therapy claims
- overt game UI such as levels, coins, score, quests, or rewards
- overly busy center floor that leaves no room for the cat to move

## Scene Asset Targets

Base scene: `640x360` Phaser logical canvas.

Current source assets can be larger than 640x360, but they must be composed for clean downscaling into a 16:9 H5 scene.

Recommended final structure:

```text
public/assets/scenes/window-room/
  background.png
  collision.json
  cat/
    idle.png
    walk.png
    jump.png
    eat.png
    lie.png
    sleep.png
    interact.png
  props/
  particles/
```

## Asset Sources and Status

- Runtime assets live under `public/assets/scenes/window-room/`.
- Current runtime-to-candidate mapping lives in
  [`../art/runtime-map.md`](../art/runtime-map.md).
- Generated sources, candidates, and review evidence live under `artifacts/art/`.
- This document defines visual direction and intentionally does not duplicate the
  mutable list of current candidate versions.

## Integration Rule

The Phaser scene should load runtime PNG assets from `public/assets/scenes/window-room/`. Code-generated graphics are acceptable only for invisible physics helpers, temporary particles, or debug-only tools.

## Asset Production Rules

- Use `docs/art/runtime-map.md` to resolve the currently active candidate for each action.
- Do not use code-drawn cat sprites as production art. `scripts/generate_cat_animation_assets.py` is only an experiment for the `idle`, `walk`, `jump`, `sleep`, and `interact` subset; the six-frame `eat` and four-frame `lie` production sheets are owned by `scripts/compose_product_cat_eat_v3.py` and `scripts/compose_product_cat_lie_v4.py`.
- Preserve `96x96` frame size and bottom-center anchor unless the Phaser scene is recalibrated.
- Follow `docs/specs/cat-animation.md` for character consistency, motion breakdown, frame counts, anchors, and Phaser integration.
- Follow `docs/specs/environment-interaction.md` when tying walk, jump, rest, food, crouch, or future run states to room props.
