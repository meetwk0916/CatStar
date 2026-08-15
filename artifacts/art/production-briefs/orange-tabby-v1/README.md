# Orange Tabby Production Brief v1

**Issue:** #23

**Status:** Approved appearance direction; production art not yet received

**Runtime target:** Rounded short-haired, ten-action CatStar package
**Identity authority:** `artifacts/art/candidates/active/product-cat-model-sheet-v1/`

This brief defines the first release-quality orange-tabby **毛色预设**. It is
an art-production handoff, not permission to ship the current deterministic
orange derivative. The gray-white motion master supplies anatomy, pose,
timing, frame composition, alpha geometry, anchors, and contact conventions
only. Final orange-tabby pixels must come from one rights-cleared,
identity-consistent production process and receive their own review.

## Approved Appearance Lock

The approved direction is a warm orange tabby with:

- white muzzle and chin;
- a continuous white chest bib;
- restrained white belly coverage;
- four white lower legs and paws, reading as short white socks;
- medium warm-orange body fur;
- deep rust-brown tabby markings;
- amber-green irises that remain distinct from the orange coat;
- a muted brick-pink nose and coordinated muted brick-pink paw pads.

Neutral palette anchors below describe relationships, not a flat fill. The
artist may shift values for the model sheet's cool window light and warm lamp
light while preserving the ordering and identity.

| Role | Neutral anchor | Requirement |
| --- | --- | --- |
| Orange midtone | `#C97832` | Warm, natural ginger; never neon or mascot-yellow. |
| Orange light | `#E9A557` | Keeps facial planes and limbs readable near the lamp. |
| Tabby stripe | `#713B28` | Clearly darker than the coat without reading as black bands. |
| White marking | `#F3E4D5` | Warm off-white; retains form against pale and amber surfaces. |
| Iris | `#A6A04D` | Amber-green, stable across all awake actions. |
| Nose | `#B96862` | Muted brick pink, not candy pink. |
| Paw pad | `#965451` | Deeper companion tone to the nose. |
| Soft outline | `#4B302B` | Restrained dark warm outline consistent with the motion master. |

## Marking Lock

Markings must describe one cat rather than being redrawn opportunistically per
pose.

- The forehead carries one readable tabby `M`, with the center aligned to the
  nose bridge and two inner strokes remaining narrower than the outer crown
  strokes.
- Each visible cheek carries two short tapered stripes. They may compress in
  perspective but must not cross the eye or merge into a face mask.
- Two broken collar bands wrap the upper neck. Their visible length changes
  with head rotation; their order does not reverse.
- Shoulder and flank stripes taper toward the belly. Preserve their relative
  order across standing, sitting, resting, and stretched poses instead of
  copying screen-space bands from another frame.
- The tail carries six readable rings plus a dark rust tip. Foreshortening may
  occlude rings, but may not create or reorder them.
- White muzzle, chest, socks, and paws remain the same identity boundaries in
  every action. Occlusion is the only acceptable reason for a boundary to
  disappear.
- Do not add freckles, accessories, glow, halo, cast shadow, loose particles,
  or baked room props.

## Locked Motion And Raster Contract

Do not redraw anatomy or alter timing while applying the coat. Preserve the
gray-white master's exact canvas geometry, right-facing default orientation,
bottom-center alignment, alpha silhouette, frame composition, and contact
line. The machine-readable contract is in
[`production-contract.json`](production-contract.json).

Every delivered sheet must:

- use `96x96` transparent cells in one horizontal PNG strip;
- retain the exact action frame count and order;
- match the gray-white master alpha geometry pixel-for-pixel unless a reviewed
  pixel-level exception is recorded before import;
- keep the face, body mass, ears, tail, paws, outline thickness, pixel density,
  and lighting direction stable;
- contain no detached pixel islands, baked shadow, background, guide, label,
  or source-layer residue.

## Action Review Notes

| Action | Orange-tabby-specific review |
| --- | --- |
| `idle` | M mark, cheek stripes, four socks, and tail-ring count remain stable through breathing and blinking. |
| `sit` | Chest bib stays centered; flank stripes wrap the seated mass rather than becoming straight vertical bars. |
| `walk` | Socks remain attached to the same legs through the gait; stripes do not slide across the torso. |
| `jump` | Belly white and tail rings remain coherent through foreshortening; bright paws retain separation near the bench. |
| `eat` | Lowered head keeps the M mark and cheek-stripe order; muzzle remains readable beside the bowl. |
| `lie` | Folded legs do not merge the socks into one white slab; awake iris color remains visible. |
| `sleep` | Closed eyes remain distinct from face stripes; curled tail rings retain their order. |
| `groom` | Raised paw preserves its sock and paw-pad colors; face markings do not migrate during contact. |
| `stretch` | Lengthened torso keeps stripe spacing anatomical; foreleg socks retain separate silhouettes. |
| `interact` | Slow blink and head turn preserve the same M mark, cheek stripes, iris, and nose. |

## Room-Lighting Gate

The appearance must pass in the real Phaser room, not only on a transparent
sheet.

- Under cool window light, orange midtones must not turn muddy brown and the
  face must remain separate from the dark window and bench.
- Under warm lamp light, coat highlights must not merge with the floor, lamp,
  bowl, or blanket; the white muzzle, chest, and paws must retain volume.
- At `390x844`, the M mark, eye line, paw separation, and action silhouette must
  remain readable without enlarging the cat.
- Desktop and mobile review must cover entry, full motion, and exit for all ten
  actions. Static boards support this review but do not replace motion.

## Delivery Layout

Deliver the production source package as:

```text
artifacts/art/candidates/active/product-cat-orange-tabby-v1/
  README.md
  rights/
  sources/
  sprite-sheets-96/
    idle.png
    sit.png
    walk.png
    jump.png
    eat.png
    lie.png
    sleep.png
    groom.png
    stretch.png
    interact.png
```

`sources/` must contain the editable layered authority used for all ten
actions. `rights/` must contain the completed evidence listed in
[`intake-checklist.md`](intake-checklist.md). Do not overwrite runtime assets
until the source package, rights record, and structural checks are reviewable.

## Acceptance Sequence

1. Review enlarged source art and representative `96x96` cells for the locked
   appearance and marking map.
2. Complete every field in `intake-checklist.md`; unresolved fields keep the
   package internal-only and block Issue #23.
3. Copy the ten approved sheets into
   `public/assets/scenes/window-room/cat/orange-tabby/`.
4. Run `npm run check:assets` and verify exact alpha geometry against the
   gray-white master for all ten actions.
5. Verify passport selection, local persistence, and runtime loading through
   the existing end-to-end seam.
6. Capture the exact preset matrix:

   ```bash
   npm run review:motion -- \
     --preset orange-tabby \
     --output artifacts/art/runtime-motion-review/YYYY-MM-DD-orange-tabby-vN
   ```

7. Record a human pass or defect for every desktop/mobile action entry. Review
   marking continuity, eye/nose/paw-pad harmony, room contrast, and identity.
8. Run the full repository gates from `AGENTS.md`. Any source, asset, test,
   build, or configuration change invalidates stale fingerprint-bound evidence.
9. Update `docs/art/runtime-map.md`, `docs/art/rights-and-provenance.md`, and
   `docs/status/current.md` only after the accepted package is the actual
   runtime source.

## Current Comparison Evidence

The current deterministic derivative may be captured with the command above to
compare room scale and lighting. Keep every such entry pending or explicitly
failed: it is defect/comparison evidence only and must not be relabeled as
production approval or committed as the accepted Issue #23 evidence set.
