# Cat Walk Cycle Keyframe Candidate 01

This folder contains a dedicated CatStar walk-cycle candidate.

## Files

- `cat-walk-cycle-keyframes-01-chromakey.png`: generated source board.
- `cat-walk-cycle-keyframes-01-alpha.png`: transparent-background version.
- `normalized-96/pose-01.png` through `pose-08.png`: extracted walk poses.
- `normalized-96/contact-sheet.png`: 8-frame `96x96` pose preview.
- `normalized-96/metadata.json`: extraction metadata.
- `sprite-sheets-96/walk.png`: assembled 8-frame runtime-sized walk candidate.
- `sprite-sheets-96/metadata.json`: assembled sheet metadata.

## Assessment

This candidate is stronger than the prior 6-frame walk baseline:

- it uses eight poses, matching the target in `docs/CAT_ANIMATION_SPEC.md`;
- paws alternate more clearly across the loop;
- the body has more forward gait and less repeated-pose sliding;
- tail position changes across the cycle.

Remaining work:

- manually clean small edge artifacts from the extracted frames;
- tune paw contact positions to reduce foot sliding;
- reconcile this leaner walk body with the rounder idle/sleep cat before final
  art lock.

## Generation Prompt

```text
Use case: stylized-concept
Asset type: CatStar pixel cat walk cycle keyframe board for animation cleanup, not final runtime asset
Primary request: Create one clean horizontal pixel-art walk cycle board of the same gray-and-white CatStar cat identity, showing exactly 8 separate right-facing walking poses for a grounded domestic cat walk loop.
Character lock: same small gray tabby and white domestic cat, amber eyes, white muzzle/chest/front legs, gray tabby cap and back, pink inner ears, soft rounded body, medium striped tail, gentle memorial companion mood. Same outline thickness, pixel density, proportions, lighting, and scale in every pose.
Eight poses in one row, evenly spaced, full body visible, right-facing:
1 front right paw begins lifting, body slightly lowered
2 front right paw reaches forward, rear left paw pushes
3 weight transfers onto front right paw, head follows body
4 rear left paw steps through, tail counterbalances
5 front left paw begins lifting, body slightly lowered
6 front left paw reaches forward, rear right paw pushes
7 weight transfers onto front left paw, rear right paw catches up
8 neutral stride return, loop-compatible with pose 1
Motion requirements: real leg movement, alternating paws, subtle body bob, tail counter-movement, consistent foot contact line, no sliding pose duplication.
Style: refined cozy indie pixel art, realistic domestic cat anatomy, high-quality painterly pixel clusters, warm healing tone, readable at mobile size, not mascot, not abstract.
Technical constraints: perfectly flat solid #00ff00 chroma-key background, no shadows, no floor, no labels, no text, no watermark. Generous padding between poses. Do not use #00ff00 anywhere on the cat.
Avoid: different cats across frames, sitting poses, frozen legs, deformed limbs, horse/dog gait, floating magical effects, hearts, halo, wings, toy/plush look, code-drawn icon look, oversized head, cropped tail or paws.
```
