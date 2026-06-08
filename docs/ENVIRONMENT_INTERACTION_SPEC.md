# Environment Interaction Spec

Last updated: 2026-06-08

## Purpose

CatStar's cat should not choose actions in empty space. Movement and companion
states should be grounded in the room: floor, bed, window bench, tray, plant,
and future props.

This spec captures the current Phase 0.1 interaction model and the next upgrade
path.

## Current Runtime Model

Runtime scene:

```text
src/components/PhaserCatScene.tsx
public/assets/scenes/window-room/collision.json
```

The scene now separates:

- physical surfaces: places the cat can stand or land;
- environment zones: places the cat can choose as walk/jump/rest targets;
- visual blockers: props that should affect path choice without becoming
  invisible air walls.

## Current Physical Surfaces

The Phaser Arcade Physics colliders are currently limited to:

- `floor`

`windowBench`, `catBed`, `plant`, and `rightTray` are not physical walking
blockers in Phase 0.1 because generic Arcade Physics rectangles create invisible
side walls. They should become interaction zones first. If the cat needs to land
on bench/bed later, implement one-way/top-only platform behavior rather than
turning the full prop rectangle into a normal collider.

## Current Environment Zones

The current scene defines zones in code:

- `floor-left`: walkable floor
- `floor-center`: walkable floor
- `windowBench`: perch/jump target
- `catBed`: rest/jump target
- `rightTray`: future food/eating target
- `plant`: blocker/avoidance target

Walk targets currently choose only walkable floor zones. This prevents the cat
from walking into prop rectangles or stopping against invisible props.

Jump targets currently choose floor zones and enforce a clear horizontal travel
distance. The jump has anticipation compression, horizontal travel, airborne
frames, and landing recovery. Bench/bed jumping should wait for one-way platform
support.

## Current Action Behavior

- `WALKING`: chooses a floor-zone target and walks horizontally.
- `JUMPING`: chooses a floor/perch/rest target, compresses, launches with
  vertical and horizontal velocity, and lands before returning to idle.
- `SLEEPING`: plays sleep animation, currently not yet tied to bed occupancy.
- `EATING`: plays idle animation, currently reserved for future tray behavior.
- `INTERACTING`: plays the tap response in place, without a vertical hop.

## Next Upgrade Path

The next behavior pass should move from state-only choices to zone-aware actions:

- `SLEEPING` should prefer `catBed` or `windowBench`, then play sleep only after
  the cat reaches the zone.
- `EATING` should move toward `rightTray`, then play a dedicated eating/sniffing
  animation.
- `CROUCHING` should exist as a transition/action near jump, plant inspection,
  or playful pause.
- `LYING` should be separate from deep sleep and usable on bed/window bench.
- `RUNNING` should be a higher-speed variant restricted to open floor zones,
  not near blockers or props.
- `PLANT_INSPECTING` or similar future behavior should let the cat approach the
  plant edge without colliding with an invisible wall.

## Acceptance Criteria

Before adding a new movement state:

- it must name the target environment zone;
- it must define whether the zone is physical, walkable, restable, or visual;
- it must avoid invisible collision rectangles in the cat's normal route;
- it must describe entry, loop, and exit behavior;
- it must preserve gentle companion tone and avoid game-like reward behavior.
