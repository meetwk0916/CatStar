# Cat Action Keyframe Candidate 01

This folder contains an art-direction candidate for the CatStar cat motion set.
It is not a runtime sprite sheet yet.

## Files

- `cat-action-keyframes-01-chromakey.png`: generated source board on green screen.
- `cat-action-keyframes-01-alpha.png`: transparent-background version.
- `normalized-96/pose-01.png`: neutral right-facing standing pose.
- `normalized-96/pose-02.png`: walk key pose A.
- `normalized-96/pose-03.png`: walk key pose B.
- `normalized-96/pose-04.png`: jump/crouch anticipation.
- `normalized-96/pose-05.png`: landing or tap-response crouch.
- `normalized-96/pose-06.png`: curled sleeping pose.
- `normalized-96/contact-sheet.png`: 96x96 pose preview sheet.
- `normalized-96/metadata.json`: extraction metadata.
- `sprite-sheets-96/idle.png`: assembled 4-frame idle candidate.
- `sprite-sheets-96/walk.png`: assembled 6-frame walk candidate.
- `sprite-sheets-96/jump.png`: assembled 4-frame jump candidate.
- `sprite-sheets-96/sleep.png`: assembled 4-frame sleep candidate.
- `sprite-sheets-96/interact.png`: assembled 5-frame interact candidate.
- `sprite-sheets-96/all-actions-preview.png`: stacked action preview.
- `sprite-sheets-96/metadata.json`: assembled sheet metadata.

## Assessment

This candidate is directionally stronger than code-drawn technical sprites:

- it preserves a recognizable gray-and-white cat identity;
- it has a more believable face, fur volume, body mass, and limb anatomy;
- it gives usable standing, walking, crouching, and sleeping key poses;
- it remains readable when normalized into the current `96x96` frame contract.

Remaining gaps:

- it is a keyframe board, not full animation;
- walk still needs in-between frames and foot-contact cleanup;
- jump needs separate launch, air, descent, and recovery frames;
- interact needs a dedicated nuzzle/blink response rather than reusing crouch;
- final art needs manual cleanup to remove residual edge artifacts and keep
  pixel clusters consistent.

## Generation Prompt

```text
Use case: stylized-concept
Asset type: art-direction candidate sheet for CatStar pixel cat animation, not final runtime asset
Input image role: The existing CatStar cat is the identity reference. Preserve the same gray tabby cap/back, white muzzle/chest/front legs, amber eyes, pink ears, soft rounded body, gentle memorial companion mood.
Primary request: Create one clean pixel-art character keyframe board for the same cat identity, showing 6 separate poses in a single horizontal row: 1 neutral right-facing standing pose, 2 mid-walk pose A with front paw forward and rear paw pushing, 3 mid-walk pose B with opposite paws, 4 jump anticipation crouch, 5 soft landing/recovery crouch, 6 curled sleeping pose.
Style: refined cozy indie pixel art, high-quality painterly pixel clusters, realistic domestic cat anatomy, warm healing tone, readable at mobile game size, not mascot, not abstract. Match a quiet night-room memorial app, gentle and grounded.
Composition: Each pose separated with equal spacing, same scale, same lighting direction, same outline thickness, same pixel density, same character proportions. Cat faces right except sleeping pose can curl naturally. Full body visible, no cropping.
Technical constraints: perfectly flat solid #00ff00 chroma-key background, no shadows, no floor, no text, no labels, no watermark, generous padding around each pose. Do not use #00ff00 anywhere on the cat.
Avoid: abstract code-drawn look, emoji cat, toy/plush look, different cats across poses, deformed legs, extra accessories, hearts, halo, angel wings, magical aura, speech bubbles.
```

## Next Step

The assembled sheets are suitable as the current visual baseline because they
are more coherent than the older runtime stopgap and avoid code-drawn cat art.
They are still not final production animation.

Next, manually clean the action sheets required by `docs/CAT_ANIMATION_SPEC.md`:
walk contact frames, jump launch/air/descent frames, and a dedicated tap
response with a true nuzzle or blink.
