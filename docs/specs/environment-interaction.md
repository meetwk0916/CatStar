# Environment Interaction Spec

**Status:** Current specialized behavior contract
Last updated: 2026-06-15

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

Runtime review evidence:

```text
artifacts/art/runtime-review/2026-06-15/
```

The scene now separates:

- physical surfaces: places the cat can stand or land;
- environment zones: places the cat can choose as walk/rest/perch targets;
- visual blockers: props that should affect path choice without becoming
  invisible air walls.

The implemented interaction points are the window bench, cat bed, food bowl,
plant edge, and folded blanket stack. None of them are normal Arcade Physics
colliders; the cat reaches them through anchored routines so props do not create
invisible side walls.

## Current Physical Surfaces

The Phaser Arcade Physics colliders are currently limited to:

- `floor`

`windowBench`, `catBed`, `plant`, and `rightTray` are not physical walking
blockers in Phase 0.1 because generic Arcade Physics rectangles create invisible
side walls. They should become interaction zones first.

`windowBench` is currently reachable through a scripted jump/perch routine. It
is modeled as a bounded visual surface, not a single point: after landing, the
cat can walk within the bench surface, pause in the idle loop, and then jump
back to the floor. If free-form bench/bed landing is needed later, implement
one-way/top-only platform behavior rather than turning the full prop rectangle
into a normal collider.

`catBed` is a small floor-level rest surface. The cat walks to the bed opening,
then uses a short scripted hop into a chosen rest position inside the bed. This
keeps the cat from reading as if it walked through the bed rim. After the
lying/rest loop, it hops back out through the opening before returning to the
floor routine.

`rightTray` currently stands for the food bowl area. The cat walks to the bowl
side and plays the dedicated `eat` sniff/eat sheet at a stable bowl-side
anchor. Because the food bowl sits on the foreground tray, its eating anchor is
slightly below the normal walking baseline and horizontally aligned to the main
food bowl so the cat reads as standing behind the tray and lowering its head to
the bowl rim.

The folded blanket stack is a small rest surface. It uses a lightweight
foreground occlusion layer (`foreground-blanket.png`) so the blanket front can
cover the cat's lower body and make the cat read as resting on top instead of
standing in front of it. Because the surface is narrow, the cat jumps onto a
fixed rest anchor and lies down rather than walking around on the blanket.

`plant` is a blocker/avoidance zone with an inspection point at its left edge.
The cat can approach and inspect it without walking into the plant rectangle.

The active window-bench routine uses fixed visual anchors for floor and perch
positions. It does not rely on Arcade gravity for routine landing because the
floor collider sits lower than the visible walkable floor and makes the cat
appear to drop into the foreground.

## Current Environment Zones

The current scene defines zones in code:

- `floor-left`: walkable floor
- `floor-center`: walkable floor
- `windowBench`: perch/jump target
- `catBed`: floor-level rest surface
- `rightTray`: food/eating target
- `plant`: blocker/avoidance target

Walk targets currently choose only purposeful floor positions that serve an
environment routine. This prevents the cat from wandering into prop rectangles
or stopping against invisible props.

The current whole-room routine cycles through:

1. window bench: walk to takeoff, jump to a target inside the bench surface,
   move gently within the surface, then pause before jumping down;
2. cat bed: walk to the bed opening, hop into a rest position inside the bed,
   lie down briefly, then hop back out;
3. folded blankets: walk to takeoff, jump to the blanket rest anchor, lie down
   briefly, then jump back down;
4. food bowl: walk to the bowl side and cycle a stable sniff/eat hold;
5. plant: walk to the plant edge and pause in a short inspection hold;
6. floor pause: return to a calm floor point before the next object.

This replaces purely random floor roaming with a repeatable room habit. It is a
Phase 0.1 animation behavior, not a game reward loop.

## Current Action Behavior

- `WALKING`: walks toward the active routine target with the dedicated slow
  cat-step loop documented in the runtime map.
- `JUMPING`: uses a scripted arc for window-bench and blanket up/down travel.
- `LYING`: awake resting/lying loop for the cat bed or blanket surface.
- `SLEEPING`: deeper sleep loop reserved for future long-rest or explicit sleep
  moments, not the default environmental rest pose.
- `EATING`: uses the dedicated `eat` sniff/eat sheet at the food bowl.
- `INTERACTING`: plays the tap response in place, without a vertical hop.

## Next Upgrade Path

The next behavior pass should move from state-only choices to zone-aware actions:

- `EATING` should keep improving toward a fully hand-authored eating/sniffing
  animation if commissioned final art becomes available.
- `CROUCHING` should exist as a transition/action near jump, plant inspection,
  or playful pause.
- `LYING` should keep diverging from deep sleep and support more rest surfaces.
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
