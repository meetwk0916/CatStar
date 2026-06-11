# Window Room Runtime Assets

These files are consumed directly by `src/components/PhaserCatScene.tsx`.

- `background.png`: full 16:9 room background, displayed into the Phaser `640x360` logical scene.
- `foreground-blanket.png`: transparent foreground occlusion layer for the folded blanket stack, rendered above the cat so blanket-top resting reads correctly.
- `cat/idle.png`: 4-frame idle sprite sheet, `96x96` per frame.
- `cat/walk.png`: 8-frame walk sprite sheet, `96x96` per frame.
- `cat/jump.png`: 5-frame jump sprite sheet, `96x96` per frame.
- `cat/sleep.png`: 4-frame sleep sprite sheet, `96x96` per frame.
- `cat/interact.png`: 5-frame click/tap reaction sprite sheet, `96x96` per frame.
- `cat/eat.png`: 6-frame food-bowl sniff/eat transition sheet, `96x96` per frame.
- `cat/lie.png`: 4-frame lying/rest sheet for bed and blanket routines, `96x96` per frame.
- `cat/cat.animations.json`: Phaser animation metadata.
- `collision.json`: hand-authored Arcade Physics rectangles in Phaser logical coordinates.

Source/reference images are kept under `docs/art/` so generated and runtime assets stay separate.

The current action sheets use the higher-fidelity visual cat mother asset as a stopgap. They preserve the cat identity better than code-drawn technical sprites, but walk, jump, and interact are still derived MVP motion rather than production frame-by-frame animation.

Replace them with hand-authored frame-by-frame sprite sheets when commissioning final product art, but preserve the same action contract unless Phaser is recalibrated. `scripts/generate_cat_animation_assets.py` is retained only for local motion experiments and must not be treated as production art source.

Room behavior should follow `docs/ENVIRONMENT_INTERACTION_SPEC.md`: props like the plant and tray should be modeled as interaction/avoidance zones before they become physical collision blockers.

Runtime walk currently uses the v3 idle-match 8-frame candidate under `docs/art/candidates/cat-walk-cycle-keyframes-v3-idle-match/`.
