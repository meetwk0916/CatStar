# CatStar Art Direction

**Status:** Current visual direction

Last updated: 2026-08-08

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

- Style: refined indie pixel art built from deliberate crisp pixel clusters,
  a controlled palette, and nearest-neighbor display. Preserve nuanced light
  without antialiased edges, painterly downsampling, raw block placeholders,
  or mascot-like chibi proportions.
- Mood: cozy night room, window light, soft amber lamp light, deep blue outside sky.
- Scene: a familiar home corner with a window bench, cushion, plant, folded blanket, bowl, and subtle pawprint memory details.
- Cat: a familiar domestic cat with believable anatomy and motion, lightly
  simplified facial features for mobile readability, three art-directed
  **外形原型**, ten curated **毛色预设**, and no angel or religious treatment.
- Acceptance priority: when cuteness conflicts with believable domestic-cat
  anatomy, contact, or weight, physical credibility wins. Warmth comes from
  restrained expression, timing, lighting, and pixel treatment rather than
  chibi proportions or toy-like motion.
- Identity priority: the cat is first a gentle approximation of the user's
  remembered cat, not a fixed brand mascot. Unify art style, calm demeanor,
  and motion quality rather than imposing one shared face across prototypes.
- Prototypes: rounded short-haired, slender short-haired, and fluffy
  long-haired. Their face, ear, body, tail, and coat-length structures may
  differ naturally, but none uses breed labels or body-value language.
- Default demeanor: relaxed ordinary life with mild curiosity. The cat may
  notice the user occasionally, but does not continuously smile, grieve,
  perform comfort, or wait for a command.
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

Keep the cat at a believable scale within the room. Use the current `96x96`
display as the production baseline, and confirm every new master on mobile
through silhouette, face pixels, background contrast, lighting at routine
anchors, and a forgiving transparent hit area. Do not enlarge it further
without repeating that review. Do not use interaction zoom or a following
camera in Phase 0.1.

Recommended final structure:

```text
public/assets/scenes/window-room/
  background.png
  plant-leaf.png
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
- The first three-prototype static review candidate is
  `artifacts/art/candidates/active/product-cat-prototypes-v1/concept-sheet-a-v2.png`;
  it is not approved runtime art.
- This document defines visual direction and intentionally does not duplicate the
  mutable list of current candidate versions.

## Integration Rule

The Phaser scene should load runtime PNG assets from `public/assets/scenes/window-room/`. Code-generated graphics are acceptable only for invisible physics helpers, temporary particles, or debug-only tools.

## Asset Production Rules

- Use `docs/art/runtime-map.md` to resolve the currently active candidate for each action.
- Begin with one gray-and-white concept sheet that compares rounded
  short-haired, slender short-haired, and fluffy long-haired prototypes under
  identical color and lighting. Each prototype must include enlarged design
  poses, `96x96` key-pose previews, and in-room desktop and mobile previews so
  silhouette preference is not confused with coat preference.
- Treat the current generated prototype comparison as direction approval only.
  Before batch animation, approve a rights-cleared production model sheet that
  locks principal views, anatomy, facial landmarks, tail, marking boundaries,
  contact lines, `96x96` pixel treatment, and in-room scale.
- After the static prototype review, produce rounded short-haired first as the
  new complete motion master. Retain the validated frame counts, timing,
  `96x96` cells, anchors, and contact lines, but redraw every visible frame from
  the approved character sheet rather than polishing mismatched source batches.
- Approve `sit`, `walk`, and `interact` as a moving quality slice before
  completing the remaining actions. Static approval alone does not authorize
  the full action set.
- The first release may ship with only the complete rounded short-haired
  prototype. Slender short-haired and fluffy long-haired remain part of the
  product direction but do not block that release. Each prototype must receive
  its own complete ten-action motion master before becoming selectable; never
  stretch, squash, or reuse another prototype's body art.
- After a motion master passes review, apply ten complete **毛色预设**: orange
  tabby, solid black, solid white, calico, black-and-white tuxedo,
  gray-and-white tabby, brown tabby, solid gray, tortoiseshell, and colorpoint.
  Each preset owns reviewed coat, eye, nose, and paw-pad colors; Phase 0.1 does
  not offer free color mixing or independent local-marking edits. All ten are
  required for the first release; deterministic recoloring alone does not pass
  the art-review gate.
- Human art review covers all hundred coat-preset/action combinations. Use
  side-by-side loops or review boards to make full coverage practical; do not
  substitute sampling or automated structural checks for visual approval.
- Do not use code-drawn cat sprites as production art.
  `scripts/generate_cat_animation_assets.py` is only an experiment for frame
  counts, anchors, and metadata. The current runtime action selection and its
  source chain are recorded in the [runtime asset map](../art/runtime-map.md).
- Treat current AI-generated cat candidates as design, motion-planning, and
  engineering references only. Final release sheets must come from one
  rights-cleared, identity-consistent production process across all ten
  actions; do not ship an incrementally repaired mix of the current candidates.
- Preserve `96x96` frame size and bottom-center anchor unless the Phaser scene is recalibrated.
- Follow `docs/specs/cat-animation.md` for character consistency, motion breakdown, frame counts, anchors, and Phaser integration.
- Follow `docs/specs/environment-interaction.md` when tying walk, jump, rest, food, crouch, or future run states to room props.
