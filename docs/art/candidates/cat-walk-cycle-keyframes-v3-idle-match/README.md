# Cat Walk Cycle Keyframe Candidate V3 Idle Match

This candidate is designed to match the current runtime idle cat more closely
than the previous walk attempts.

## Files

- `cat-walk-cycle-keyframes-v3-idle-match-chromakey.png`: generated source board.
- `cat-walk-cycle-keyframes-v3-idle-match-alpha.png`: transparent source.
- `normalized-96/pose-01.png` through `pose-08.png`: extracted 96x96 walk poses.
- `normalized-96/contact-sheet.png`: normalized pose preview.
- `sprite-sheets-96/walk.png`: runtime-sized 8-frame walk sheet.

## Assessment

This is the current runtime walk candidate because it keeps:

- round face and visible muzzle closer to the idle cat;
- fuller body mass closer to the idle cat;
- eight-frame leg movement for a more believable walk;
- stable 96x96 runtime frame contract.

Remaining work:

- hand-clean small edge pixels around whiskers and paws;
- tune the transition from idle to walk if the state switch still feels abrupt.
