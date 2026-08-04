# Plant interaction v1 source record

**Status:** Internal prototype only

This package records the source inputs for the first animated environment prop.

## Files

- `background-before-leaf-split.png`: reviewed `640x360` runtime background before the local plant edit.
- `generated-leaf-alpha.png`: alpha source derived from the built-in ImageGen leaf candidate.
- `scripts/derive_plant_interaction_assets.py`: deterministic project script that writes the repaired runtime background and `plant-leaf.png`.

## Image generation record

Tool: Codex built-in ImageGen.

The first precise-object-edit attempt was rejected because it regenerated the
whole room and changed the composition and resolution. It was not copied into
the repository. The accepted generation was restricted to an isolated leaf on
a flat chroma-key background, then converted to alpha with the bundled ImageGen
`remove_chroma_key.py` helper.

Final leaf prompt:

```text
Use case: background-extraction
Asset type: one small animated pixel-art plant leaf sprite for the CatStar 640x360 Phaser scene
Input image: visual reference for exact pixel-art style, palette, lighting, and leaf shape. Recreate only the low left-facing yellow-green leaf on the tall plant, the leaf located nearest the open floor at approximately global scene x=489, y=174.
Primary request: Produce exactly one opaque yellow-green leaf with a very short dark-green stem at its right-side pivot, matching the reference plant's pixel-art rendering. The leaf points left and is viewed from the same angle as the reference.
Composition: one isolated leaf centered with generous padding; no other leaves or objects.
Background: perfectly flat solid #ff00ff chroma-key background, uniform edge to edge, with no shadows, gradients, texture, reflections, or lighting variation.
Constraints: crisp pixel-art edges, no blur, no cast shadow, no text, no watermark; do not use #ff00ff in the leaf.
```

The generated leaf is a derived internal-prototype asset. No public or
commercial distribution rights are inferred from this technical record.
