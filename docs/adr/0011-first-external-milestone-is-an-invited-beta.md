---
status: accepted
---

# ADR-0011: The first external milestone is an invited beta, not a public launch

The project destination moves from the first public release to an invited beta
of **喵星来信**, re-charted on
[Wayfinder map: 喵星来信邀请内测](https://github.com/meetwk0916/CatStar/issues/48).
Most public-launch cost (sixty-combination review,
project-wide rights closure, domain, public delivery) proves the product can
answer to strangers; it does not prove the memorial ritual actually holds real
grief. The invited beta tests that first, then records an explicit decision
about whether to pursue a public release.

- **Date:** 2026-11-21
- **Status:** Accepted (Walter-confirmed after three grilling rounds)

## Destination

The invited beta is complete when all three are true:

1. Walter walks a test **护照** from registration to the **告别选择**; a
   development time shortcut is allowed for this walk-through only.
2. At least three invited people who have actually lost a cat complete the
   whole letter ritual in real time, through the **告别选择**.
3. Walter records, from their feedback, whether to pursue a public release.

## Gates before any invitation

- The eight **信件** are rewritten and approved by Walter; count and daily
  8:00 AM pacing stay unchanged. Drafting may be assisted; runtime letters stay
  prewritten.
- The approved phone-first companion home is the primary surface, passes
  portrait environment-art cohesion and six-zone interaction calibration (full
  `390 × 844` zone capture, unified pixel/edge/shadow treatment across room,
  leaf prop, and cat, calibrated prop scale/anchors/foreground occlusion, and
  clean tap/interruption behavior), and passes physical-phone checks. This
  lifts the 2026-11-06 execution pause.
- Coat presets come only from the five that share the locked gray-white motion
  master, chosen by the invitees' real cats; gray-white is reviewed first.
  Orange tabby is not part of the beta.
- Every preset shipped to invitees must pass current-fingerprint
  continuous-motion capture and Walter's per-entry human review across all ten
  core actions plus room routes at `390 × 844` (portrait room) and
  `1280 × 720` (`docs/specs/cat-animation.md`,
  `docs/specs/environment-interaction.md`): consistent domestic-cat identity,
  believable anatomy and scale, marking and eye/nose/paw-pad harmony,
  night-room silhouette readability, planted paw/surface contacts without
  sliding or hovering, jump-arc landing registration, and clean transitions.
  Static screenshots never substitute for continuous motion; any defect blocks
  until fixed and re-verified.
- The art rights gate closes for exactly the assets the beta shows (room,
  plant, selected presets and their ten actions) before anyone outside the
  owner can open the site.
- Access is per-person through the Sites external-visitor allowlist if invitees
  need no OpenAI account; otherwise an unadvertised public link, which counts as
  distribution and therefore waits for the rights gate. No domain purchase.
- The Sites edge `403` is cleared; if it is not cleared by 2026-12-05, use the
  direct Cloudflare Workers fallback.
- A short privacy note and invitation copy state: early version, about seven
  days with one letter per day, data lives only on the invitee's device, and
  they may stop at any time without giving feedback.
- Feedback is gathered privately by Walter; no telemetry or upload, consistent
  with ADR-0001.

## Timebox

Invite-ready by 2026-12-19. If missed, cut preset breadth to gray-white only.
Letter quality, form and continuous-motion quality across all ten actions, the
rights line, and the phone home are never cut.

## Considered Options

- **Keep the public launch, smaller:** still pays for strangers-facing gates
  before learning whether the ritual works.
- **Invited beta (chosen):** smallest external test that keeps the rights and
  grief-language boundaries.
- **Portfolio demo or archive:** never tests the product with grieving people.

## Consequences

- ADR-0010's six-preset boundary becomes the public-release target, not a beta
  requirement.
- Public-release Wayfinder tickets (domain, orange-tabby production,
  sixty-combination boards and review, final release spec, and `.com` launch)
  are closed as out of scope on the map; preset delivery issues wait until a
  post-beta public release is chosen.
- Runtime coat selection is restricted to presets that have passed invited-beta
  review and rights closure before any external or unadvertised link opens.
