# Product Cat Actions v1

> Historical candidate retained for review traceability. Current runtime
> selection is recorded in `docs/art/runtime-map.md`.

This was the first product-quality runtime candidate for CatStar cat actions.

## Sources

- `sources/walk-source.png`: generated walk sprite-sheet source, 8 poses on green key.
- `sources/eat-source.png`: generated food sniff/eat source, 6 poses on green key without bowl props.

The generated originals are also retained under the Codex generated-images cache for traceability.

## Processing

The source sheets were chroma-keyed locally, split by detected non-green frame groups, normalized to `96x96`, and composed into:

- `sprite-sheets-96/walk.png`
- `sprite-sheets-96/eat.png`

Copies were promoted to `public/assets/scenes/window-room/cat/` during this
candidate's evaluation; it is no longer the current source set.

## Acceptance Notes

- Walk removes the previous crouch/sit-looking gait frames and keeps the same cat identity across all 8 frames.
- Eat removes the previous distorted interact-derived frames and avoids drawing a bowl, so it can be layered against the room's existing food bowl.
- This is still generated candidate art. Final commissioned art should preserve the same `96x96` action contract.
