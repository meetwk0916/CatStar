# Art rights and provenance

**Status:** Internal-prototype gate
**Last reviewed:** 2026-08-08

Unless a specific record below clears it, the current room and cat art may be
used only for CatStar internal prototype review. The repository records
technical lineage, but several asset groups still lack their original
generation provider, model/version, account owner, applicable terms, or
commercial-use evidence. That is an incomplete rights chain, not proof of
production rights.

## Current asset groups

| Runtime group | Technical source | Provider/model | License or terms evidence | Allowed use |
| --- | --- | --- | --- | --- |
| Window-room background and foreground layers | `artifacts/art/sources/` plus local composition scripts | Unknown | Missing | Internal prototype only |
| Plant interaction leaf | `artifacts/art/sources/plant-interaction-v1/` plus `scripts/derive_plant_interaction_assets.py` | Codex built-in ImageGen; exact model/version and terms snapshot not recorded | Incomplete | Internal prototype only |
| Cat action sheets | Active candidate packages listed in `runtime-map.md` | Unknown | Missing | Internal prototype only |
| Rounded short-haired production model sheet v1 | `artifacts/art/candidates/active/product-cat-model-sheet-v1/` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below | Approved production authority |
| Rounded short-haired v12 `sit`, `walk`, and `interact` sources | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` plus `scripts/compose_product_cat_quality_slice_v12.py` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below | Approved for the moving quality slice |
| Rounded short-haired idle v3 source | `artifacts/art/candidates/active/product-cat-idle-v3/` plus `scripts/compose_product_cat_idle.py` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below | Approved supporting transition; not release art |
| Runtime-review screenshots | Locally captured from CatStar | CatStar code plus the two groups above | Inherits unresolved source status | Internal review only |

## Production intake requirements

Before any public beta, paid distribution, marketing use, or app-store
submission, every runtime asset must have:

- creator or generation provider and account owner;
- model/tool version and creation date when the provider exposes them; when a
  managed product surface does not expose its underlying model version, record
  the provider-facing tool name, the unavailability, and the creation date;
- source prompt or commission brief where applicable;
- source file and transformation lineage;
- license or terms snapshot that covers the intended distribution;
- human approval and any attribution requirements;
- confirmation that the asset does not imitate a protected character or brand.

Replace unresolved assets or complete their records before changing the
“internal prototype only” classification. `runtime-map.md` remains the
technical runtime-to-source map; this document owns the rights gate.

## Rounded short-haired model-sheet approval record

**Status:** Approved production model sheet

| Field | Record |
| --- | --- |
| Candidate | `artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png` |
| Source SHA-256 | `6bc7d12110c7e793d23bc98c96e8cd6b16e6ee89704c82832571ab25f1180a7c` |
| Direction reference | `artifacts/art/candidates/active/product-cat-prototypes-v1/concept-sheet-a-v2.png` remained direction-only. Only its left-column rounded short-haired design informed the dedicated production sheet; the slender and fluffy columns were excluded. |
| Selected model | One gray-and-white rounded short-haired identity across right and left standing views, front and rear standing views, two seated views, awake rest, and a face study. |
| Anatomy baseline | Healthy adult domestic cat with natural, non-chibi proportions: broad chest, compact torso, short sturdy legs, and wider cheeks. This body plan must remain stable across every future action. |
| Identity anchors | Natural small triangular ears, amber eyes, a wider white muzzle, and a calm curious expression; four white-socked paws with clear floor contact; and a medium gray-and-white tabby ringed tail that rests naturally on the floor or around the body. |
| Gray-and-white marking map | White muzzle, chest through belly, lower legs, and paws; gray tabby across crown, back, flank, and tail. Pose perspective may reshape the marks, but may not remove the white chest, relocate the white socks, or reverse the back-and-tail color relationship. |
| Rendering baseline | Controlled pixel clusters and a restrained dark soft outline; no blurred paint, photographic texture, or excessive shine. Warm nighttime interior light must preserve readability of the gray-and-white coat and amber eyes. |
| Scale review | The source sheet was approved enlarged. Its derived v12 action cells were approved at `96x96` and continuously in the desktop and `390x844` mobile rooms through `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`. |
| Creator and account owner | Project owner (self-attested) |
| Design reviewer | wakun |
| Formal approval | Approved by wakun on 2026-08-08 as CatStar's production model sheet and the sole identity and visual baseline for subsequent cat action work. |
| Tool | ImageGen; exact version not exposed |
| Final generation date | 2026-08-08, before the v12 action sources were generated. |
| Source brief | Gray-and-white tabby, healthy adult, rounded short-haired domestic cat; natural proportions rather than chibi; broad chest, compact torso, short sturdy legs, wider cheeks; calm curious expression; controlled pixel clusters and soft indoor light. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or another person's photo was used as a reference input or imitation target. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. The project owner records that, as between the owner and OpenAI, the output is owned by the owner, subject to applicable law and the Terms. |
| Distribution status | Cleared for the project owner's public distribution as this production model sheet and action identity baseline. This approval does not clear the separate current runtime asset groups whose provenance remains unresolved above. |

## Rounded short-haired moving quality-slice approval record

**Status:** Rights source recorded; motion approved

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` |
| Source SHA-256 | `sit-source-chromakey.png`: `4158976a933a0e87c5d1b5206ea3bf078360602ba33a173232ea806f1bd0cfd4`; `walk-source-chromakey.png`: `cb538dbc982789fa7285f36b8f140544b6b50a4e19931a9298877ee4d6abadbf`; `interact-source-chromakey.png`: `341c9eb22ddcce1f891943afdf9c40f41472464f7a1f091abdc46f6e7701767b`. |
| Creator and account owner | Project owner (self-attested) |
| Tool | ImageGen; exact version not exposed |
| Final generation date | 2026-08-08, after wakun approved the dedicated production model sheet. |
| Source brief | Redraw every visible pose from the approved production model sheet: a stable long-dwell `sit`, a grounded eight-pose `walk`, and one calm `interact` acknowledgement that leans, holds a slow blink, and returns to ordinary posture. v11 was permitted only as a motion-phase reference. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or another person's photo was used as a reference input or imitation target. |
| Transformation lineage | The three chroma-key sources are background-removed into `alpha/`, then deterministically extracted, nearest-neighbor normalized, alpha-hardened, palette-limited, and assembled into transparent `96x96` sheets by `scripts/compose_product_cat_quality_slice_v12.py`. Runtime coat derivatives are built separately by `scripts/build_cat_coat_presets.py`. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. The project owner records that, as between the owner and OpenAI, the output is owned by the owner, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`, covering the production-model-derived `sit`, `walk`, and `interact` on desktop and mobile from entry through exit. Structural validation passed, and wakun approved all six entries on 2026-08-08. |
| Distribution status | Approved for the rounded short-haired moving quality slice. This record does not clear the room art or the other seven action sources. |

## Rounded short-haired idle v3 intake record

**Status:** Rights source recorded; transition approved

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-idle-v3/` |
| Source SHA-256 | `idle-source-chromakey.png`: `879b822ef06620d631bd8688f131dac4911e1f4157e7dd742e727b762640d908` |
| Runtime-master SHA-256 | `idle.png`: `ebdd5d564f2a24ad17096046c538da9051eddad0de165760a974e252ec005cc6` |
| Creator and account context | Generated with built-in ImageGen in the project owner's Codex session. |
| Tool and date | Built-in ImageGen; exact version not exposed; generated 2026-08-08. |
| Source brief | Four right-facing standing idle poses redrawn directly as the approved low, broad, deep-bodied rounded short-haired adult, with restrained breathing, one slow blink, a small close-tail shift, and one shared ground line. The exact normalized request is retained in `generation-prompt.md`. |
| Reference inputs | The direction-only rounded concept plus the project-owned v11 `sit` and `walk` sources. This supporting idle predates the dedicated production model sheet and is not represented as model-sheet-derived release art. Rejected idle v1 and v2 were explicitly excluded as generation inputs. No third-party character, brand, illustration, or photograph was requested as an input or imitation target. |
| Transformation lineage | Built-in ImageGen chroma-key source → recorded chroma-key removal → shared-scale nearest-neighbor normalization → binary-alpha, 64-color `96x96` sheet via `scripts/compose_product_cat_idle.py` → deterministic coat derivatives via `scripts/build_cat_coat_presets.py`. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`; structural validation passed, and wakun approved both desktop and mobile `sit` exits on 2026-08-08. |
| Distribution status | Approved as the supporting `sit` exit for the moving quality slice, but not as final release art. The later full ten-action production master must redraw idle from the production model sheet. |
