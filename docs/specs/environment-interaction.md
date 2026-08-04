# Environment Interaction Spec

**Status:** Current specialized behavior contract

Last updated: 2026-08-05

## Purpose

CatStar's cat should not choose actions in empty space. Movement and companion
states should be grounded in the room: floor, bed, window bench, tray, plant,
and future props.

This spec captures the current Phase 0.1 interaction model and the next upgrade
path.

## Current Runtime Model

Runtime scene:

```text
src/domain/catFsm.ts
src/game/CatRoomScene.ts
src/components/PhaserCatScene.tsx
public/assets/scenes/window-room/collision.json
```

`catFsm.ts` owns companion intent, pacing, and reaction policy.
`CatRoomScene.ts` translates that policy into Phaser coordinates, animation,
physics, and scene timing. `PhaserCatScene.tsx` owns only the React lifecycle
that creates, starts, and destroys the scene.

Runtime review evidence is indexed in the
[runtime asset map](../art/runtime-map.md#runtime-behavior-notes).

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

Eating remains self-directed companionship behavior. The bowl never creates a
hunger state, empties, asks the user to refill it, or implies that the cat
suffered because the user was absent. Phase 0.1 has no feeding or ongoing care
mechanic.

Cat behavior remains independent of mailbox delivery and unread-letter count.
The cat does not lead the user toward the mailbox, repeat an attention gesture,
or change mood because a delivered letter remains unread.

The folded blanket stack is a small rest surface. It uses a lightweight
foreground occlusion layer (`foreground-blanket.png`) so the blanket front can
cover the cat's lower body and make the cat read as resting on top instead of
standing in front of it. Because the surface is narrow, the cat jumps onto a
fixed rest anchor and lies down rather than walking around on the blanket.

`plant` is a blocker/avoidance zone with an inspection point at its left edge.
The cat can approach and inspect it without walking into the plant rectangle.
Ordinary `plant-inspect` remains repeatable and does not move the prop. A
separate low-frequency `plant-touch` intent reuses walking and interaction
motion: the cat observes for roughly 800 ms, lightly touches once, watches one
split leaf sway with damping, settles, and leaves after a roughly three-second
contact phase. The leaf is a transparent runtime layer derived from the room
background; it has no collider or pointer interaction.

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

Walk targets choose only purposeful floor positions that serve a room intent.
This prevents the cat from wandering into prop rectangles or stopping against
invisible props.

The implemented **陪伴例程** planner selects among window watching, cat-bed
rest, blanket rest, eating, plant inspection, rare plant touching, floor sitting, grooming, deep
sleep, stretching, and active approach. Selection:

- weights preference and pace by **陪伴气质**;
- keeps every intent reachable for every temperament;
- suppresses the two most recent intents as short-term memory;
- lightly avoids selecting another intent for the current zone;
- blocks deep sleep during the first 30 seconds of a session;
- lets device-local hour bias sleep without controlling the encounter.

`plant-touch` is unavailable during the first 30 seconds. After it occurs, it
requires both 90 elapsed seconds and five completed non-touch intents before it
can be selected again. It has no per-session maximum and remains probabilistic
after cooldown. Every temperament can select it; curious cats receive the
highest weight without exclusive access.

This replaces both a deterministic patrol order and unbounded random floor
roaming. The selected intent owns a meaningful dwell window; Phaser owns its
coordinates, tweens, and action playback.

## Current Action Behavior

- `IDLE` / `SIT`: use the calm seated loop for ordinary floor and perch pauses.
- `WALKING`: walks toward the active routine target with the
  product-cat-quality-slice v10 slow cat-step loop.
- `JUMPING`: uses a scripted arc for window-bench and blanket up/down travel.
- `LYING`: uses awake rest on the cat bed and blanket.
- `SLEEPING`: uses deep sleep only after the session opening.
- `EATING`: uses the dedicated bowl-side sniff/eat loop.
- `GROOMING` and `STRETCHING`: use dedicated floor actions.
- `INTERACTING`: acknowledges touch in place or active approach at the
  foreground stop.

If touch interrupts a scripted jump, cancel the jump, settle the cat
immediately at the consistent floor height, and then play the response. The cat
must not remain airborne until a later routine snaps it back into place.

If touch interrupts the plant-touch lifecycle, reset the leaf to its resting
angle, cancel the prop routine, acknowledge the user in place, and enter the
full plant-touch cooldown. Do not resume or immediately retry the prop action.

## Companion Temperament

Every supported **陪伴气质** uses the same core action repertoire. Temperament
changes preference, frequency, pacing, and response likelihood; it does not
lock or unlock exclusive actions.

- quiet cats favor awake rest, window watching, and slower transitions;
- curious cats favor plant inspection and room observation;
- affectionate cats approach the foreground and play the fuller existing
  acknowledgement sequence more often;
- lively cats walk and make short grounded jumps more often without becoming
  game-like or hyperactive.

Important actions must remain reachable for every temperament so remembered
**陪伴气质** does not hide core companionship or art content.

Every awake touch uses the available acknowledgement frames: a brief head-turn
baseline is guaranteed, while temperament weights whether the fuller head-turn
and blink sequence plays. The domain also varies optional-whisper likelihood
and deep-sleep wake likelihood by temperament, but must not claim distinct
gestures that the production motion assets do not render. Do not use
hissing, fleeing, startling, or rejection as touch feedback.

Every valid touch produces a visible **陪伴反应**. An occasional
**陪伴轻语** may accompany it, but text must not appear after every touch or
describe invented places, experiences, or memories.

During deep sleep, touch produces a small sign of life such as an ear flick,
tail-tip movement, brief eye opening, or posture adjustment. It does not
guarantee that the cat stands up; fully waking remains a low-probability
transition.

Session rhythm takes priority over strict device-local day and night. On entry,
the cat remains awake long enough to establish visible companionship before
rest or deep sleep becomes eligible. Device-local time may lightly bias sleep
probability, but must not make a nighttime visitor encounter only a sleeping
cat.

On **归来相遇**, begin with the cat already in a plausible ordinary activity
such as window watching, awake rest, grooming, or slow walking. Do not use a
fixed greeting animation or replay actions that might have occurred while the
scene was closed. A brief glance toward the user may occur with low
probability.

The repertoire includes rare **主动靠近**. The cat may move toward the
foreground, pause, briefly look toward the user, blink or lift its tail, and
then resume ordinary room activity. This routine must not display an alert,
repeat until acknowledged, or punish the user for not interacting.

The repertoire may also include rare **自发玩耍**, such as touching a plant
leaf, watching a window light, making one gentle pounce at a slow shadow, or
kneading the blanket. These routines remain brief and low-intensity, require no
user participation, and do not create rewards, tasks, or repeated high-energy
movement.

**自发玩耍** is a post-Phase 0.1 enhancement, not a required asset for the
current ten-action production target. Phase 0.1 **主动靠近** should reuse walking
and interaction motion rather than add another bespoke action class.

## Future Upgrade Path

Future behavior work may deepen the current zone-targeted intent model:

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
- it must define interruption and prop-reset behavior;
- it must preserve gentle companion tone and avoid game-like reward behavior.
