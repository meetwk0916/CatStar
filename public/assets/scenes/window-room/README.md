# Window Room Runtime Assets

These files are consumed directly by `src/components/PhaserCatScene.tsx`.

- `background.png`: full 16:9 room background, displayed into the Phaser `640x360` logical scene.
- `cat/idle.png`: 4-frame idle sprite sheet, `96x96` per frame.
- `cat/walk.png`: 6-frame walk sprite sheet, `96x96` per frame.
- `cat/jump.png`: 4-frame jump sprite sheet, `96x96` per frame.
- `cat/sleep.png`: 4-frame sleep sprite sheet, `96x96` per frame.
- `cat/interact.png`: 5-frame click/tap reaction sprite sheet, `96x96` per frame.
- `cat/cat.animations.json`: Phaser animation metadata.
- `collision.json`: hand-authored Arcade Physics rectangles in Phaser logical coordinates.

Source/reference images are kept under `docs/art/` so generated and runtime assets stay separate.

The current action sheets are MVP derived sheets for motion validation. Replace them with hand-authored frame-by-frame sprite sheets after the CatStar visual direction is approved.
