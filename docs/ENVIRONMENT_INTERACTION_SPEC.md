# Environment Interaction Spec

Last updated: 2026-06-10

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
cat can walk within the bench surface, pause, and sit before jumping back to the
floor. If free-form bench/bed landing is needed later, implement
one-way/top-only platform behavior rather than turning the full prop rectangle
into a normal collider.

`catBed` is a small floor-level rest surface. The cat walks to the bed opening,
steps into a chosen rest position inside the bed, plays the lying/rest loop, then
walks back out through the opening before returning to the floor routine.

`rightTray` currently stands for the food bowl area. The cat walks to the bowl
side and holds a calm sniff/eat pose using stable idle frames and a tiny body
dip until a fully hand-authored eating sheet exists.

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
   move gently within the surface, then sit before jumping down;
2. cat bed: walk to the bed opening, step into a rest position inside the bed,
   lie down briefly, then walk back out;
3. food bowl: walk to the bowl side and cycle a short sniff/eat hold;
4. plant: walk to the plant edge and pause in a short inspection hold;
5. folded blankets: walk to takeoff, jump to the blanket rest anchor, lie down
   briefly, then jump back down;
6. floor pause: return to a calm floor point before the next object.

This replaces purely random floor roaming with a repeatable room habit. It is a
Phase 0.1 animation behavior, not a game reward loop.

## Current Action Behavior

- `WALKING`: walks toward the active routine target.
- `JUMPING`: uses a scripted arc for window-bench and blanket up/down travel.
- `LYING`: plays on the cat bed or blanket surface.
- `EATING`: uses a stable idle-based sniff/eat hold at the food bowl until a
  production eating sheet exists.
- `INTERACTING`: plays the tap response in place, without a vertical hop.

## Next Upgrade Path

The next behavior pass should move from state-only choices to zone-aware actions:

- `EATING` should replace the current transition sheet with a dedicated
  hand-authored eating/sniffing animation.
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
