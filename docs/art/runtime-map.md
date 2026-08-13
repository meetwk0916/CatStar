# Product Cat Actions Runtime Map

Last updated: 2026-08-13

This file maps runtime cat sheets to their reviewed source candidates. Runtime
paths follow:

Rights and distribution status are tracked separately in
[`rights-and-provenance.md`](rights-and-provenance.md); the assembled runtime
remains internal-prototype-only while any required asset evidence is
incomplete.

```text
public/assets/scenes/window-room/cat/{coat-preset}/{action}.png
```

The six coat preset directories are `gray-white-tabby`, `orange-tabby`,
`solid-black`, `solid-white`, `calico`, and `tuxedo`.

## Environment Interaction Assets

| Runtime asset | Current source | Status |
| --- | --- | --- |
| `background.png` | `artifacts/art/sources/plant-interaction-v1/background-before-leaf-split.png` via `scripts/derive_plant_interaction_assets.py` | Local repair under the split leaf; room composition otherwise unchanged. |
| `plant-leaf.png` | `artifacts/art/sources/plant-interaction-v1/generated-leaf-alpha.png` via `scripts/derive_plant_interaction_assets.py` | `47x24` transparent internal-prototype prop with a fixed Phaser pivot. |

## Motion Master

| Runtime action | Current source | Status |
| --- | --- | --- |
| `idle` | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` | Four-frame production-model redraw with restrained breathing, one slow blink, and a stable rounded standing identity. |
| `sit` | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` | Four-frame production-model redraw with a relaxed long-dwell loop distinct from `idle`. |
| `walk` | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` | Eight-frame production-model redraw with planted gait phases and restrained body movement. |
| `interact` | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` | Six-frame production-model redraw with one in-place lean, held slow blink, and return response. |
| `groom` | `artifacts/art/candidates/active/product-cat-daily-life-v1/` | Eight-frame production-model-derived paw-and-face grooming loop with stable seated mass. |
| `stretch` | `artifacts/art/candidates/active/product-cat-daily-life-v1/` | Six-frame production-model-derived foreleg stretch, hold, and recovery action. |
| `eat` | `artifacts/art/candidates/active/product-cat-daily-life-v1/` | Six-frame production-model-derived bowl-oriented head-lowering loop; the room supplies the bowl prop. |
| `lie` | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` | Four-frame production-model awake rest with elevated head, open-eye return, and stable cat-bed/blanket contact. |
| `jump` | `artifacts/art/candidates/active/product-cat-actions-v5/` | Five generated key poses plus one held settle frame to satisfy the six-frame runtime contract. |
| `sleep` | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` | Four-frame production-model deep curled sleep with closed eyes and restrained breathing. |

The reviewed gray-white tabby is the motion master. The other five coat
presets are deterministic working derivatives built by
`scripts/build_cat_coat_presets.py`; their shared alpha, anchors, anatomy, and
timing prevent coat choice from changing behavior.

## Runtime Behavior Notes

- `lie` and `sleep` are separate: `lie` is awake companionship on rest
  surfaces, while `sleep` is deeper sleep and is not eligible during the first
  30 seconds of a session.
- The companion planner weights ordinary room intents by temperament, avoids
  the two most recent intents, lightly considers current zone and local hour,
  and keeps every action reachable for every temperament.
- Touch always produces a visible response. Companion whisper text is
  intentionally occasional rather than guaranteed.
- `approach-user` reuses `walk` and `interact`; it does not alert, demand, or
  wait for acknowledgement.
- `plant-touch` remains distinct from ordinary `plant-inspect`; it reuses
  `walk` and `interact`, moves only the split leaf, and resets on user touch.
- Regenerate runtime evidence with `npm run review:runtime`.

The browser evidence root is
`artifacts/art/runtime-review/2026-08-13/`, covering default movement,
window-bench, cat-bed, food-bowl, blanket, grooming, stretching, deep sleep,
active approach, pointer interactions on both sides of the cat, plant touch,
and the enlarged cat at a `390x844` mobile viewport. Its manifest has been
regenerated after the latest purposeful-route code change and passes
`npm run review:runtime:check`.
The dedicated food-bowl continuous motion evidence is separate at
`artifacts/art/runtime-motion-review/2026-08-12-food-bowl-acceptance/`; it is
structurally valid for desktop and mobile; meetwk0916 approved both entries on
2026-08-13, and the scoped release-grade human-review gate passes.
The plant-touch desktop evidence lives under
`artifacts/art/runtime-review/2026-08-04/`; the matching `375x812` evidence
lives under `artifacts/art/runtime-review-mobile/2026-08-04/`. Each
accompanying `manifest.json` binds its screenshots to the exact runtime input
fingerprint; `npm run review:runtime:check` fails after those inputs change.
The quiet-motion continuous evidence lives under
`artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1/` and
`artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1-blanket/`.
Together they cover `idle`, cat-bed and blanket `lie`, and `sleep` from entry
through exit at `1280x720` and `390x844`; wakun approved all eight
human-review entries on 2026-08-09, and both manifests pass the release-grade
human-review gate.

The named plant-inspection and plant-touch approach evidence lives under
`artifacts/art/runtime-motion-review/2026-08-13-plant-inspect-route/` and
`artifacts/art/runtime-motion-review/2026-08-13-plant-touch-route/`. Each set
covers the gray-white motion master at `1280x720` and `390x844` and is bound to
the current route-source fingerprint. All four regenerated entries await
explicit review by meetwk0916.

The foreground approach-and-return evidence lives under
`artifacts/art/runtime-motion-review/2026-08-13-approach-user-route/`. It covers
the complete gray-white round trip at `1280x720` and `390x844`, is bound to the
current route-source fingerprint, and awaits explicit review by meetwk0916.
Dedicated touch-interruption evidence lives under
`artifacts/art/runtime-motion-review/2026-08-13-approach-user-interruption/`
with the same viewport coverage and pending review state.

## Candidate Retention

- Active motion sources: v5, daily-life v1, quiet-motion v1, and quality-slice
  v12. Quiet-motion v1 supplies `idle`, `lie`, and `sleep`; daily-life v1
  supplies `eat`, `groom`, and `stretch`; v12 supplies `sit`, `walk`, and
  `interact`. Product-cat-idle v1/v2/v3, action v3/v4/v8, and quality-slice
  v10/v11 are retained as review and motion-planning history.
- Active coat derivation evidence: `cat-coat-presets-v1`.
- Retired review-history candidates remain under `artifacts/art/candidates/`
  for trace history and must not be wired back into runtime without review.
