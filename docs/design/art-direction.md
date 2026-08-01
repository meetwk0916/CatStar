# CatStar Art Direction

**Status:** Current visual direction

Last updated: 2026-07-29

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

- Style: refined indie pixel art with stylized-natural cat anatomy, not raw
  block placeholders or mascot-like chibi proportions.
- Mood: cozy night room, window light, soft amber lamp light, deep blue outside sky.
- Scene: a familiar home corner with a window bench, cushion, plant, folded blanket, bowl, and subtle pawprint memory details.
- Cat: a familiar domestic cat with believable anatomy and motion, lightly
  softened facial features for mobile readability, one locked Phase 0.1
  silhouette with six curated coat appearances, and no angel or
  religious treatment.
- Life stage: a familiar healthy adult in Phase 0.1, without illness, injury,
  or end-of-life frailty.
- Accessories: none in Phase 0.1. Future **纪念配饰** may reproduce a simple
  real collar, name tag, or bandana, but never become costumes, collectibles,
  paid skins, wings, or halos.
- Animation: small physical motion should feel grounded: walking, jumping, landing, resting, and light click/tap feedback.
- Gaze: the cat may briefly acknowledge the user during idle, rest, or touch
  response, but should not continuously face outward or wait for commands.

## Avoid

- angel wings
- halos
- heaven/ascension imagery
- spooky grief imagery
- medical or therapy claims
- overt game UI such as levels, coins, score, quests, or rewards
- overly busy center floor that leaves no room for the cat to move
- autoplayed cat vocalization or ambient audio in Phase 0.1

## Scene Asset Targets

Base scene: `640x360` Phaser logical canvas.

Current source assets can be larger than 640x360, but they must be composed for clean downscaling into a 16:9 H5 scene.

Keep the cat at a believable scale within the room. Improve mobile readability
first through silhouette, face pixels, background contrast, lighting at routine
anchors, and a forgiving transparent hit area. If those measures remain
insufficient, increase the cat's display size by no more than roughly 10%
before considering any camera or composition change. Do not use interaction
zoom or a following camera in Phase 0.1.

Recommended final structure:

```text
public/assets/scenes/window-room/
  background.png
  collision.json
  cat/
    cat.animations.json
    gray-white-tabby/
      idle.png
      sit.png
      walk.png
      jump.png
      eat.png
      lie.png
      sleep.png
      groom.png
      stretch.png
      interact.png
    {five-other-coat-presets}/
      {same-ten-action-sheets}
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
- Keep the gray-and-white tabby as the locked motion master across the complete
  ten-action repertoire when refining the other five **毛色预设**.
- Before producing all ten actions, approve a three-action quality slice:
  `sit/idle` for identity and gaze, `walk` for anatomy and grounded motion, and
  `interact` for gentle emotional expression. A static mother image alone is
  not an approval gate.
- Do not use code-drawn cat sprites as production art.
  `scripts/generate_cat_animation_assets.py` is only an experiment for frame
  counts, anchors, and metadata. The dedicated eat and lie production
  candidates remain owned by `scripts/compose_product_cat_eat_v3.py` and
  `scripts/compose_product_cat_lie_v4.py`.
- Preserve `96x96` frame size and bottom-center anchor unless the Phaser scene is recalibrated.
- Follow `docs/specs/cat-animation.md` for character consistency, motion breakdown, frame counts, anchors, and Phaser integration.
- Follow `docs/specs/environment-interaction.md` when tying walk, jump, rest, food, crouch, or future run states to room props.
