# Window Room Runtime Assets

These files are consumed directly by `src/game/CatRoomScene.ts`.

- `background.png`: full 16:9 room background, displayed into the Phaser `640x360` logical scene.
- `foreground-cat-bed.png`: transparent foreground occlusion layer for the cat bed front rim, rendered above the cat so entering/resting in the bed does not read as walking through the prop.
- `foreground-blanket.png`: transparent foreground occlusion layer for the folded blanket stack, rendered above the cat so blanket-top resting reads correctly.
- `cat/{coat-preset}/{action}.png`: one horizontal sprite sheet per action
  and coat preset. The six preset directories are `gray-white-tabby`,
  `orange-tabby`, `solid-black`, `solid-white`, `calico`, and `tuxedo`.
- The ten actions are `idle`, `sit`, `walk`, `jump`, `eat`, `lie`, `sleep`,
  `groom`, `stretch`, and `interact`; every frame is `96x96`.
- `cat/cat.animations.json`: Phaser animation metadata.
- `collision.json`: hand-authored Arcade Physics rectangles in Phaser logical coordinates.

Source/reference images are kept under `artifacts/art/` so generated and runtime assets stay separate.
Run `npm run check:assets` after changing any cat sheet. The check validates
all 60 runtime sheets against the shared ten-action contract.

The current action sheets use the higher-fidelity visual cat mother asset as a stopgap. They preserve the cat identity better than code-drawn technical sprites, but they are still derived candidates rather than final hand-authored frame-by-frame animation.

Replace them with hand-authored frame-by-frame sprite sheets when commissioning final product art, but preserve the same action contract unless Phaser is recalibrated. `scripts/generate_cat_animation_assets.py` is retained only for local motion experiments and must not be treated as production art source.

Room behavior should follow `docs/specs/environment-interaction.md`: props like the plant and tray should be modeled as interaction/avoidance zones before they become physical collision blockers.

Runtime action-source mapping is tracked in `docs/art/runtime-map.md`.
The current candidate index lives in `docs/art/README.md`, and the latest
browser review screenshots live in the latest dated directory under
`artifacts/art/runtime-review/`.
Run `npm run review:runtime` after changing Phaser timing, target anchors, or
foreground occlusion layers.
