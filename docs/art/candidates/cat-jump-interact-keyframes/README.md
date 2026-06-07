# Cat Jump And Interact Keyframe Candidate 01

This folder contains a dedicated CatStar candidate board for the weakest runtime
motions: jump and tap interaction.

## Files

- `cat-jump-interact-keyframes-01-chromakey.png`: generated source board.
- `cat-jump-interact-keyframes-01-alpha.png`: transparent-background version.
- `normalized-96/pose-01.png`: jump anticipation crouch.
- `normalized-96/pose-02.png`: jump launch.
- `normalized-96/pose-03.png`: jump air frame.
- `normalized-96/pose-04.png`: jump descent.
- `normalized-96/pose-05.png`: soft landing.
- `normalized-96/pose-06.png`: tap notice.
- `normalized-96/pose-07.png`: tap nuzzle/blink.
- `normalized-96/pose-08.png`: settle pose.
- `sprite-sheets-96/jump.png`: assembled 5-frame runtime-sized jump candidate.
- `sprite-sheets-96/interact.png`: assembled 5-frame runtime-sized interact candidate.
- `sprite-sheets-96/jump-interact-preview.png`: stacked preview.
- `sprite-sheets-96/metadata.json`: assembled sheet metadata.

## Assessment

This candidate is stronger than the first assembled baseline for jump and
interact:

- jump now includes launch and air frames instead of only crouch/landing poses;
- interact now has a dedicated notice and nuzzle/blink response;
- the cat identity stays consistent with the gray-and-white visual baseline;
- frame sizes stay within the current `96x96` runtime contract.

Remaining work:

- manually clean small edge artifacts around the interact frames;
- tune jump landing timing in Phaser after browser review;
- hand-polish pixel clusters before final art lock.

## Generation Prompt

```text
Use case: stylized-concept
Asset type: CatStar pixel cat action keyframe board for animation cleanup, not final runtime asset
Primary request: Create one clean horizontal pixel-art keyframe board of the same gray-and-white CatStar cat identity, focused only on jump and tap interaction poses.
Character lock: same small gray tabby and white domestic cat, amber eyes, white muzzle/chest/front legs, gray tabby cap and back, pink inner ears, soft rounded body, medium striped tail, gentle memorial companion mood. Same outline thickness, pixel density, proportions, lighting, and scale in every pose.
Poses in one row, evenly spaced, full body visible:
1 jump anticipation crouch facing right, rear legs compressed, front paws ready
2 jump launch facing right, rear legs extending, front paws lifting, body stretched forward-up
3 jump air frame facing right, all paws off ground, body elongated but natural, tail balancing
4 jump descent facing right, front paws preparing to land, tail counterbalancing
5 soft landing/recovery crouch facing right, body compressed and stable
6 tap interaction notice pose facing right, ears perked, eyes attentive, head slightly lifted
7 tap interaction nuzzle pose facing right, cat leans forward with soft happy blink, cheek/face gently extended
8 tap interaction settle pose facing right, relaxed posture returning to idle
Style: refined cozy indie pixel art, realistic domestic cat anatomy, high-quality painterly pixel clusters, warm healing tone, readable at mobile size, not mascot, not abstract.
Technical constraints: perfectly flat solid #00ff00 chroma-key background, no shadows, no floor, no labels, no text, no watermark. Generous padding between poses. Do not use #00ff00 anywhere on the cat.
Avoid: different cats across frames, deformed limbs, floating magical effects, hearts, halo, wings, speech bubble, toy/plush look, code-drawn icon look, oversized head, cropped tail or paws.
```
