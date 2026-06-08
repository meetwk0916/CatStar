# Cat Walk Cycle Keyframe Candidate V2 Round Face

This candidate replaces the previous runtime walk compromise. It keeps an
8-frame gait while preserving the round visible face that users preferred in the
6-frame baseline.

## Files

- `cat-walk-cycle-keyframes-v2-round-face-chromakey.png`: generated source board.
- `cat-walk-cycle-keyframes-v2-round-face-alpha.png`: transparent source.
- `normalized-96/pose-01.png` through `pose-08.png`: extracted 96x96 poses.
- `normalized-96/contact-sheet.png`: normalized pose preview.
- `sprite-sheets-96/walk.png`: runtime-sized 8-frame walk sheet.

## Assessment

This is the current runtime walk candidate because it balances:

- visible round face across the full loop;
- eight-frame leg movement closer to the target walk spec;
- stable 96x96 frame contract;
- no obvious side-face clipping.

Remaining work:

- manually polish paw contact and small edge pixels;
- reconcile final gait with idle/sleep body mass during art lock.
