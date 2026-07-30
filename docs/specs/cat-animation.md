# Cat Animation Spec

**Status:** Current production animation contract  
Last updated: 2026-07-29

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

The Phase 0.1 production target uses one locked silhouette and face across six
curated **毛色预设** corresponding to the current passport choices. Each
preset is an art-reviewed combination of color and pattern, not one axis in an
unrestricted appearance mixer.

The initial **圆润短毛** prototype supports:

1. orange tabby
2. solid black
3. solid white
4. calico
5. black-and-white tuxedo
6. gray-and-white tabby
Coat variation must preserve:

- face and body proportions
- ear and tail shape
- paw placement and contact lines
- action timing and frame composition
- outline thickness, pixel density, and lighting direction

The current motion master identity:

- small gray-and-white domestic cat
- moderately rounded face with believable muzzle and ear placement
- readable warm amber eyes without mascot-like oversizing
- gray tabby cap and back
- white muzzle, chest, and front legs
- soft but anatomically believable domestic-cat body
- medium-length striped tail
- gentle, slightly curious expression

The production style is stylized-natural: motion and body structure should read
as a real domestic cat first, with only enough facial simplification and
softening to remain warm and legible at mobile scale. Avoid chibi head size,
toy-like short legs, and exaggerated eye-to-face ratios.

The gray-and-white master remains the shape and motion reference; it is not the
only acceptable Phase 0.1 coat appearance.

Phase 0.1 does not vary **体态**. A future body type must be produced as a
complete motion master across every supported action. Do not stretch, squash,
or non-uniformly scale an existing sheet to imitate a different body type.
Future shape expansion should be organized as observable **外形原型**, not cat
breed selection. Each prototype needs its own complete, art-directed motion
master before coat presets are applied.

The Phase 0.1 motion master presents a familiar, healthy adult cat. Future
**纪念年龄感** options may include young, adult, and older appearances selected
by the user, but must not recreate illness, injury, or end-of-life frailty.

Phase 0.1 has no accessories. Future **纪念配饰** must reproduce a familiar real
item and remain visually consistent across the complete action repertoire; do
not introduce costume or collectible layers.

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

## Gaze And Orientation

- Walking, jumping, and eating use a side view so anatomy and contact remain
  physically believable.
- Idle and awake rest may use a gentle three-quarter view and occasionally
  glance toward the user.
- Interaction may briefly turn the cat toward the user for a blink, head tilt,
  or soft approach before returning naturally to the prior activity.
- Do not make the cat stare continuously out of the scene or read as if it is
  waiting for a command.

## Sprite Sheet Standard

Runtime sheets live in one directory per coat preset:

```text
public/assets/scenes/window-room/cat/{coat-preset}/
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
sit.png       4 frames  -> 384x96
walk.png      8 frames  -> 768x96
jump.png      6 frames  -> 576x96
eat.png       6 frames  -> 576x96
lie.png       4 frames  -> 384x96
sleep.png     4 frames  -> 384x96
groom.png     8 frames  -> 768x96
stretch.png   6 frames  -> 576x96
interact.png  6 frames  -> 576x96
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

### Sit / Loaf

Purpose: the main quiet stationary posture so the cat does not spend long
periods standing.

Target frames: `4`

Loop: yes

Frame intent:

1. settles into a seated or loaf posture
2. shows a small breath or ear movement
3. returns near neutral
4. gives a slow blink or tail-tip movement

Constraints:

- remain awake and gently attentive
- keep the body grounded without vertical bobbing
- preserve a readable silhouette at mobile scale
- transition cleanly to idle, groom, or walking

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

Target frames: `6`

Loop: no

Frame intent:

1. crouch/anticipation, body compresses
2. launch, rear legs extend
3. rising air frame, body stretched
4. top/float frame, tail balances
5. descending, front paws prepare for landing
6. landing/recovery, body compresses then can return to idle

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
- a touch response may add an ear flick, tail-tip motion, brief eye opening, or
  small posture adjustment without forcing the cat to stand
- waking fully remains a low-probability outcome rather than a guaranteed
  response to touch

### Groom

Purpose: add familiar self-directed domestic-cat behavior during quiet room
time.

Target frames: `8`

Loop: yes

Frame intent:

1. settles into a stable seated posture
2. lifts a front paw
3. licks the paw
4. brings the paw toward the face
5. wipes the cheek or ear
6. returns the paw for another light lick
7. lowers the paw
8. settles back into a loop-compatible seated pose

Constraints:

- keep the body mass and planted contact stable
- use restrained head and paw motion rather than fast repetitive scrubbing
- do not let the action read as scratching, injury, or distress
- support a natural exit to sit or idle

### Stretch

Purpose: connect sleep or rest to walking with a grounded waking transition.

Target frames: `6`

Loop: no

Frame intent:

1. rises from rest
2. reaches the front paws forward
3. lowers the chest while the hindquarters remain raised
4. holds a brief full-body stretch
5. shifts weight forward and releases
6. returns to a walk-compatible standing pose

Constraints:

- show believable shoulder, spine, and rear-leg extension
- keep the front paws anchored during the stretch
- avoid elastic or cartoon deformation
- transition cleanly from rest and into walking

### Interact

Purpose: short response when the user taps/clicks the cat.

Target frames: `6`

Loop: no

Frame intent:

1. notices user/tap, head turns toward the user or ears perk
2. leans forward into a gentle three-quarter view
3. soft rub/nuzzle or happy blink
4. tail or cheek follow-through
5. returns toward neutral
6. settles back to idle-compatible pose

Constraints:

- must feel like companionship, not performance
- support a shared response repertoire such as slow blink, curious sniff,
  gentle nuzzle, and tail-lift or turning variants
- let **陪伴气质** weight response likelihood rather than assigning exclusive
  responses
- do not depict hissing, fleeing, startling, or rejection
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

`src/game/CatRoomScene.ts` expects:

- one PNG sprite sheet per action for each of the six coat presets, including
  the current `sit`, `groom`, and `stretch` sheets
- `96x96` frames by default
- animation metadata in `cat.animations.json`
- bottom-center visual alignment
- default right-facing cat

`src/components/PhaserCatScene.tsx` only owns the React lifecycle for the
Phaser game and does not define animation, coordinate, physics, or companion
policy.

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

The **外形原型** and curated **毛色预设** model is recorded in
[`ADR-0003`](../adr/0003-build-cat-identity-from-appearance-prototypes.md).

`scripts/generate_cat_animation_assets.py` is retained only as a technical
experiment for validating frame counts, anchors, and Phaser metadata. It must
not be used as the source of production runtime cat art. Production work should
start from an approved high-fidelity cat mother asset, then create hand-authored
or art-directed keyframes for each action while preserving the same frame size,
anchor, and character lock unless Phaser is recalibrated.

Production order:

1. approve the stylized-natural gray-and-white tabby mother asset;
2. validate a three-action quality slice in the real room at mobile scale:
   `sit/idle`, `walk`, and `interact`;
3. after the slice passes, complete and validate the remaining seven action
   classes;
4. lock face, anatomy, anchors, lighting, and motion timing;
5. derive the remaining five **毛色预设** without changing the motion master.
