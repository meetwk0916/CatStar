# Cat Walk Cycle Keyframe Candidate V3 Idle Match

> Historical candidate retained for review traceability. Current runtime
> selection is recorded in `docs/art/runtime-map.md`.

This candidate was designed to match the runtime idle cat used at the time more
closely than the previous walk attempts.

## Files

- `cat-walk-cycle-keyframes-v3-idle-match-chromakey.png`: generated source board.
- `cat-walk-cycle-keyframes-v3-idle-match-alpha.png`: transparent source.
- `normalized-96/pose-01.png` through `pose-08.png`: extracted 96x96 walk poses.
- `normalized-96/contact-sheet.png`: normalized pose preview.
- `sprite-sheets-96/walk.png`: runtime-sized 8-frame walk sheet.

## Assessment

This was selected as a runtime walk candidate because it kept:

- round face and visible muzzle closer to the idle cat;
- fuller body mass closer to the idle cat;
- eight-frame leg movement for a more believable walk;
- stable 96x96 runtime frame contract.

Historical assessment gaps:

- hand-clean small edge pixels around whiskers and paws;
- tune the transition from idle to walk if the state switch still feels abrupt.
