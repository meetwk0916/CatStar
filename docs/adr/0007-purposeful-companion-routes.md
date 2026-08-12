# ADR-0007: Use purposeful companion routes instead of general pathfinding

- **Status:** Accepted
- **Date:** 2026-08-09

CatStar's **陪伴场景** needs movement that feels intentional without becoming a
pet simulator or navigation game. The current anchored room zones already give
each **陪伴意图** a meaningful destination, so CatStar will use named
**陪伴路线** with at most one or two authored **航点** rather than a general
pathfinding system, random patrol, or free roaming.

Each route uses restrained easing and optional hesitation, followed by an
**到达过渡** that preserves contact and pace before the destination action
starts. The first **归来相遇** may begin directly in a plausible activity;
subsequent purposeful travel should show the route. A user touch cancels the
route, settles the cat at its current place, and plays the response without
resuming the cancelled route. Scripted jumps remain the route form for raised
surfaces. The first validation route is floor-to-food-bowl.

## Consequences

- New room destinations need a named route and authored waypoints, not a
  generic navigation graph.
- Route tests must cover easing, contact/baseline continuity, arrival handoff,
  and safe interruption.
- The design stays calm and purposeful, at the cost of not supporting arbitrary
  wandering or obstacle avoidance.
