# ADR-0003: Build cat identity from appearance prototypes

- **Status:** Accepted
- **Date:** 2026-07-29

## Context

CatStar needs the scene cat to resemble a real remembered cat without turning
memorial setup into breed identification or free-form avatar creation. Every
new silhouette also multiplies the cost of coherent frame-by-frame motion, so
unrestricted body, coat, and accessory combinations would undermine character
consistency before the first production motion set is stable.

## Decision

Build **纪念外形** from observable **外形原型** and art-reviewed **毛色预设**,
not breed labels or an unrestricted appearance mixer.

Phase 0.1 uses one stylized-natural, rounded short-haired, familiar healthy
adult silhouette. Complete the gray-and-white tabby ten-action motion master
first, then derive five additional coat presets without changing anatomy,
anchors, lighting, or timing. Approve `sit/idle`, `walk`, and `interact` as the
first in-scene mobile quality slice before producing the remaining actions.

Future body types and **纪念年龄感** require complete motion masters of their
own. Future **纪念配饰** may reproduce simple real items, but CatStar does not
offer breed claims, free-form stretching, costume collection, or fantasy
decoration.

## Consequences

- The first production pass prioritizes coherent anatomy and motion over breadth.
- Six curated coat presets can respond to remembered appearance while sharing
  one validated motion master.
- Phase 0.1 cannot approximate every real cat silhouette.
- Each future appearance prototype carries the explicit cost of a complete
  art-directed action repertoire.
- Registration copy and data must describe visible appearance rather than
  pedigree or game customization.
