# Window Room Runtime Assets

These files are consumed directly by `src/components/PhaserCatScene.tsx`.

- `background.png`: full 16:9 room background, displayed into the Phaser `640x360` logical scene.
- `foreground-cat-bed.png`: transparent foreground occlusion layer for the cat bed front rim, rendered above the cat so entering/resting in the bed does not read as walking through the prop.
- `foreground-blanket.png`: transparent foreground occlusion layer for the folded blanket stack, rendered above the cat so blanket-top resting reads correctly.
- `cat/idle.png`: 4-frame idle sprite sheet, `96x96` per frame.
- `cat/walk.png`: 8-frame walk sprite sheet, `96x96` per frame.
- `cat/jump.png`: 5-frame jump sprite sheet, `96x96` per frame.
- `cat/sleep.png`: 4-frame sleep sprite sheet, `96x96` per frame.
- `cat/interact.png`: 5-frame click/tap reaction sprite sheet, `96x96` per frame.
- `cat/eat.png`: 6-frame food-bowl sniff/eat sprite sheet, `96x96` per frame.
- `cat/lie.png`: 4-frame awake lying/rest sheet for bed and blanket routines, `96x96` per frame.
- `cat/cat.animations.json`: Phaser animation metadata.
- `collision.json`: hand-authored Arcade Physics rectangles in Phaser logical coordinates.

Source/reference images are kept under `docs/art/` so generated and runtime assets stay separate.
Run `npm run check:assets` after changing any `cat/*.png` sheet.

The current action sheets use the higher-fidelity visual cat mother asset as a stopgap. They preserve the cat identity better than code-drawn technical sprites, but they are still derived candidates rather than final hand-authored frame-by-frame animation.

Replace them with hand-authored frame-by-frame sprite sheets when commissioning final product art, but preserve the same action contract unless Phaser is recalibrated. `scripts/generate_cat_animation_assets.py` is retained only for local motion experiments and must not be treated as production art source.

Room behavior should follow `docs/ENVIRONMENT_INTERACTION_SPEC.md`: props like the plant and tray should be modeled as interaction/avoidance zones before they become physical collision blockers.

Runtime action-source mapping is tracked in `docs/art/candidates/product-cat-actions-runtime.md`.
The current candidate index lives in `docs/art/candidates/README.md`, and the
latest browser review screenshots live in `docs/art/runtime-review/2026-06-15/`.
