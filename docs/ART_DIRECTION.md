# CatStar Art Direction

Last updated: 2026-06-06

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
    sleep.png
    interact.png
  props/
  particles/
```

## Current Phase 0.1A Assets

- Concept reference: `docs/art/catstar-window-room-concept-01.png`
- Background source: `docs/art/sources/window-room-background-source.png`
- Cat chroma-key source: `docs/art/sources/cat-idle-chromakey-source.png`
- Sleep chroma-key source: `docs/art/sources/cat-sleep-chromakey-source.png`
- Cat action keyframe candidate: `docs/art/candidates/cat-action-keyframes/cat-action-keyframes-01-alpha.png`
- Cat 96x96 pose preview: `docs/art/candidates/cat-action-keyframes/normalized-96/contact-sheet.png`
- Runtime background: `public/assets/scenes/window-room/background.png`
- Runtime cat action sprite sheets:
  - `public/assets/scenes/window-room/cat/idle.png`
  - `public/assets/scenes/window-room/cat/walk.png`
  - `public/assets/scenes/window-room/cat/jump.png`
  - `public/assets/scenes/window-room/cat/sleep.png`
  - `public/assets/scenes/window-room/cat/interact.png`
- Runtime animation metadata: `public/assets/scenes/window-room/cat/cat.animations.json`
- Runtime collision config: `public/assets/scenes/window-room/collision.json`

## Integration Rule

The Phaser scene should load runtime PNG assets from `public/assets/scenes/window-room/`. Code-generated graphics are acceptable only for invisible physics helpers, temporary particles, or debug-only tools.

## Next Asset Work

- Current action sheets use `docs/art/candidates/cat-action-keyframes/` as the first art-directed visual baseline.
- Replace assembled candidate motion with hand-authored sprite sheets or atlas before final product art lock.
- Do not use code-drawn cat sprites as production art. `scripts/generate_cat_animation_assets.py` is only an experiment for frame counts, anchors, and metadata.
- Preserve `96x96` frame size and bottom-center anchor unless the Phaser scene is recalibrated.
- Follow `docs/CAT_ANIMATION_SPEC.md` for character consistency, motion breakdown, frame counts, anchors, and Phaser integration.
- Split foreground occlusion elements after the scene composition stabilizes.
- Revisit collision rectangles after the final background is approved on mobile.
