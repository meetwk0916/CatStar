# Environment Interaction Spec

Last updated: 2026-06-09

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
- environment zones: places the cat can choose as walk/rest/perch targets;
- visual blockers: props that should affect path choice without becoming
  invisible air walls.

The first implemented interaction point is the window bench. It is not a normal
Arcade Physics collider; the cat reaches it through a scripted perch routine so
the prop does not create invisible side walls.

## Current Physical Surfaces

The Phaser Arcade Physics colliders are currently limited to:

- `floor`

`windowBench`, `catBed`, `plant`, and `rightTray` are not physical walking
blockers in Phase 0.1 because generic Arcade Physics rectangles create invisible
side walls. They should become interaction zones first.

`windowBench` is currently reachable through a scripted jump/perch routine. If
free-form bench/bed landing is needed later, implement one-way/top-only platform
behavior rather than turning the full prop rectangle into a normal collider.

The active window-bench routine uses fixed visual anchors for floor and perch
positions. It does not rely on Arcade gravity for routine landing because the
floor collider sits lower than the visible walkable floor and makes the cat
appear to drop into the foreground.

## Current Environment Zones

The current scene defines zones in code:

- `floor-left`: walkable floor
- `floor-center`: walkable floor
- `windowBench`: perch/jump target
- `catBed`: rest/jump target
- `rightTray`: future food/eating target
- `plant`: blocker/avoidance target

Walk targets currently choose only purposeful floor positions that serve an
environment routine. This prevents the cat from wandering into prop rectangles
or stopping against invisible props.

The current window-bench routine is:

1. rest briefly on the floor;
2. walk to the bench-side takeoff point;
3. jump in a fixed arc to the window bench perch point;
4. sit or sleep on the bench for a short hold;
5. jump back down to the floor;
6. walk to a floor pause point before the next cycle.

This replaces purely random floor roaming with a repeatable room habit. It is a
Phase 0.1 animation behavior, not a game reward loop.

## Current Action Behavior

- `WALKING`: walks toward the active routine target.
- `JUMPING`: uses a scripted arc for window-bench up/down travel.
- `SLEEPING`: plays on the window bench during the perch hold.
- `EATING`: plays idle animation, currently reserved for future tray behavior.
- `INTERACTING`: plays the tap response in place, without a vertical hop.

## Next Upgrade Path

The next behavior pass should move from state-only choices to zone-aware actions:

- `SLEEPING` should later support `catBed` as well as the current
  `windowBench` perch.
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
