# Cat Animation Spec

**Status:** Current production animation contract
Last updated: 2026-07-23

## Purpose

This spec defines the production target for CatStar cat animation assets.

The current runtime sheets under `public/assets/scenes/window-room/cat/` are MVP derived motion sheets. They prove the Phaser animation pipeline, but they are not production-quality motion assets. Production cat animation must be drawn as coherent frame-by-frame motion of the same cat.

## Product Role

The cat is the emotional center of CatStar. Its animation should make the scene feel quietly alive without turning the product into a game.

Animation goals:

- gentle companionship
- grounded physical motion
- warm domestic cat behavior
- readable mobile-scale silhouette
- calm pacing

Animation non-goals:

- slapstick exaggeration
- combat or challenge motion
- reward/level-up effects
- magical ascension, angel, halo, or religious movement language

## Character Lock

All action sheets must depict the same cat.

The current default cat identity:

- small gray-and-white domestic cat
- round face
- large warm amber eyes
- gray tabby cap and back
- white muzzle, chest, and front legs
- soft rounded body
- medium-length striped tail
- gentle, slightly curious expression

Do not change between actions:

- face shape
- eye color and size
- ear size and placement
- gray/white pattern layout
- tail length and striping
- body mass
- paw color
- outline thickness
- pixel density
- lighting direction

## Scene Lighting

The cat must match the window-room scene:

- warm amber lamp light from camera-right
- cool blue night/window light from camera-left/back
- soft shadow under body
- no hard stage spotlight
- no glow, halo, wings, or sacred aura

## Sprite Sheet Standard

Runtime sheets live in:

```text
public/assets/scenes/window-room/cat/
```

Frame standard:

- frame size: `96x96`
- file format: PNG with alpha
- background: fully transparent
- orientation: cat faces right by default
- Phaser mirrors left movement with `flipX`
- anchor: bottom-center
- foot contact line: consistent across all standing/walking/jumping frames
- sleeping contact line: consistent with floor/cushion placement
- no cast shadow baked into the sprite sheet; scene-level shadow can be handled separately

All frames in one sheet must have identical dimensions and be laid out horizontally:

```text
idle.png      4 frames  -> 384x96
walk.png      8 frames  -> 768x96
jump.png      5 frames  -> 480x96
eat.png       6 frames  -> 576x96
lie.png       4 frames  -> 384x96
sleep.png     4 frames  -> 384x96
interact.png  5 frames  -> 480x96
```

If a different frame count is used, update:

```text
public/assets/scenes/window-room/cat/cat.animations.json
```

## Animation List

### Idle

Purpose: make the cat feel present while waiting.

Target frames: `4`

Loop: yes

Frame intent:

1. neutral standing/sitting pose
2. subtle chest rise, tiny ear or whisker movement
3. return near neutral
4. subtle blink or tail-tip movement

Constraints:

- no large body translation
- paws remain planted
- head and body proportions remain stable
- motion should read as breathing or soft attention

### Walk

Purpose: grounded small-room walking.

Target frames: `8`

Loop: yes

Frame intent:

1. front paw starts lifting, body slightly lowers
2. front paw reaches forward, rear paw pushes
3. weight shifts forward, head follows body
4. rear paw steps through, tail counterbalances
5. opposite front paw lifts
6. opposite front paw reaches forward
7. rear paw catches up
8. body returns to neutral stride

Constraints:

- real leg motion is required
- tail should counterbalance, not remain frozen
- body center should bob slightly but not bounce like a toy
- foot contact line must stay stable enough to avoid sliding
- do not fake walk by rotating or translating one idle pose

### Eat

Purpose: a calm sniff/eat loop at the food-bowl anchor.

Target frames: `6`

Loop: yes

Frame intent:

1. notices or sniffs toward the bowl
2. lowers the head slightly
3. reaches the bowl rim
4. holds a small bite or lap
5. lifts slightly while staying engaged
6. returns to a loop-compatible sniff pose

Constraints:

- keep the body stable at the bowl-side anchor
- do not bake the bowl or tray into the cat sheet
- avoid a deep floor-level crouch that reads as lying down
- keep head motion gentle and the paws grounded

### Jump

Purpose: short domestic-cat hop between floor and cushion/bench.

Target frames: `5`

Loop: no

Frame intent:

1. crouch/anticipation, body compresses
2. launch, rear legs extend
3. rising air frame, body stretched
4. descending, front paws prepare for landing
5. landing/recovery, body compresses then can return to idle

Constraints:

- include anticipation and landing compression
- tail should help show balance
- body should not simply translate upward
- avoid acrobatic or cartoon jump exaggeration

### Lie

Purpose: awake companionship while resting on the cat bed or blanket.

Target frames: `4`

Loop: yes

Frame intent:

1. settles into an awake resting pose
2. shows a small breath or ear movement
3. returns near neutral
4. gives a soft blink or tail-tip response

Constraints:

- remain visibly awake or softly attentive
- stay distinct from the deeper curled `sleep` action
- keep the rest-surface contact line stable
- avoid body translation that looks like sliding

### Sleep

Purpose: quiet presence after cat chooses a resting state.

Target frames: `4`

Loop: yes

Frame intent:

1. curled or loafing sleep pose
2. slow breathing expansion
3. return near neutral
4. tiny ear/tail twitch or deeper breath

Constraints:

- no dramatic movement
- eyes closed or mostly closed
- breathing should be subtle
- posture should fit on cushion or floor without clipping

### Interact

Purpose: short response when the user taps/clicks the cat.

Target frames: `5`

Loop: no

Frame intent:

1. notices user/tap, head turns or ears perk
2. leans forward
3. soft rub/nuzzle or happy blink
4. returns toward neutral
5. settles back to idle-compatible pose

Constraints:

- must feel like companionship, not performance
- avoid hearts, rewards, sparkles from the cat itself
- no speech bubble baked into art
- final frame should transition cleanly back to idle

## Consistency Checklist

Before accepting a sheet, verify:

- same cat identity across all actions
- same frame size and horizontal layout
- transparent background
- bottom-center anchor consistency
- no foot sliding in walk
- no size jump between actions
- lighting matches window-room scene
- no religious/ascension imagery
- no game reward language
- readable at mobile scale
- Phaser can play it without recalibrating collision unless intentionally changed

## Phaser Integration Contract

`src/components/PhaserCatScene.tsx` expects:

- one PNG sprite sheet per action
- `96x96` frames by default
- animation metadata in `cat.animations.json`
- bottom-center visual alignment
- default right-facing cat

Physics body currently assumes a standing cat frame:

```text
body size: 48x76
body offset: 24,18
display size: 88x88
```

If production art changes frame composition, update body size/offset in Phaser and verify:

- floor landing
- cushion landing
- plant collision
- click/tap hit target
- sleeping placement

## Runtime Status

This document owns the production animation contract, not the mutable choice of
candidate source sheets. Current runtime-to-source mapping lives in
[`../art/runtime-map.md`](../art/runtime-map.md), and the current implementation
state lives in [`../status/current.md`](../status/current.md).

`scripts/generate_cat_animation_assets.py` is retained only as a technical
experiment for validating frame counts, anchors, and Phaser metadata. It must
not be used as the source of production runtime cat art. Production work should
start from an approved high-fidelity cat mother asset, then create hand-authored
or art-directed keyframes for each action while preserving the same frame size,
anchor, and character lock unless Phaser is recalibrated.
