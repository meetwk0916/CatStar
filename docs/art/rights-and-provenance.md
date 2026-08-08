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
| Rounded short-haired v11 `sit`, `walk`, and `interact` sources | `artifacts/art/candidates/active/product-cat-quality-slice-v11/` plus `scripts/compose_product_cat_quality_slice_v11.py` | ImageGen; specific model/version not exposed | Recorded below | Approved for the moving quality slice |
| Rounded short-haired idle v3 source | `artifacts/art/candidates/active/product-cat-idle-v3/` plus `scripts/compose_product_cat_idle.py` | Built-in ImageGen; specific model/version not exposed | Recorded below | Approved for the moving quality slice |
| Runtime-review screenshots | Locally captured from CatStar | CatStar code plus the two groups above | Inherits unresolved source status | Internal review only |

## Production intake requirements

Before any public beta, paid distribution, marketing use, or app-store
submission, every runtime asset must have:

- creator or generation provider and account owner;
- model/tool version and creation date;
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
| Candidate | `artifacts/art/candidates/active/product-cat-prototypes-v1/concept-sheet-a-v2.png` |
| Source SHA-256 | `d6319f186aa8722c8228d834b15698aa1c008a5fa0d19a280353f1da63494c78` |
| Mobile review derivative | `artifacts/art/review/rounded-short-haired-model-sheet-v1/mobile-review-375w.png`, deterministically rendered from the candidate's left column; review-only, not a runtime asset. |
| Selected model | Left-column gray-and-white rounded short-haired prototype; the slender and fluffy columns remain comparison references only. |
| Anatomy baseline | Healthy adult domestic cat with natural, non-chibi proportions: broad chest, compact torso, short sturdy legs, and wider cheeks. This body plan must remain stable across every future action. |
| Identity anchors | Natural small triangular ears, amber eyes, a wider white muzzle, and a calm curious expression; four white-socked paws with clear floor contact; and a medium gray-and-white tabby ringed tail that rests naturally on the floor or around the body. |
| Gray-and-white marking map | White muzzle, chest through belly, lower legs, and paws; gray tabby across crown, back, flank, and tail. Pose perspective may reshape the marks, but may not remove the white chest, relocate the white socks, or reverse the back-and-tail color relationship. |
| Rendering baseline | Controlled pixel clusters and a restrained dark soft outline; no blurred paint, photographic texture, or excessive shine. Warm nighttime interior light must preserve readability of the gray-and-white coat and amber eyes. |
| Scale review | Approved by the project owner at enlarged, 96px, desktop-room, and 375px-wide mobile-room scales. The 375px review uses the deterministic mobile review derivative above. |
| Creator and account owner | Project owner (self-attested) |
| Design reviewer | wakun |
| Formal approval | Approved by wakun on 2026-08-08 as CatStar's production model sheet and the sole identity and visual baseline for subsequent cat action work. |
| Tool | ImageGen; exact version not exposed |
| Final generation date | 2026-08-07 |
| Source brief | Gray-and-white tabby, healthy adult, rounded short-haired domestic cat; natural proportions rather than chibi; broad chest, compact torso, short sturdy legs, wider cheeks; calm curious expression; controlled pixel clusters and soft indoor light. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or another person's photo was used as a reference input or imitation target. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. The project owner records that, as between the owner and OpenAI, the output is owned by the owner, subject to applicable law and the Terms. |
| Distribution status | Cleared for the project owner's public distribution as this production model sheet and action identity baseline. This approval does not clear the separate current runtime asset groups whose provenance remains unresolved above. |

## Rounded short-haired moving quality-slice approval record

**Status:** Rights source recorded; motion approved

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-quality-slice-v11/` |
| Source SHA-256 | `sit-source-chromakey.png`: `ea64683e7000d35c1564dd0fce334c12f8d47d7767069c01e47631e39f64bc2a`; `walk-source-chromakey.png`: `e12c2f3d6362687fcd4d56316a8b4b81bcda8ae4008e87ebc948fb651fad576b`; `interact-source-chromakey.png`: `9e1d8d745f4b6fe22959e64de3c807259d39d54ae8a09b7d0793f7fd43702f3d`. |
| Creator and account owner | Project owner (self-attested) |
| Tool | ImageGen; exact version not exposed |
| Final generation date | 2026-08-06 |
| Source brief | Apply the approved gray-and-white rounded short-haired identity to a stable long-dwell `sit`, a grounded eight-pose `walk`, and one calm `interact` acknowledgement that leans, holds a slow blink, and returns to ordinary posture. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or another person's photo was used as a reference input or imitation target. |
| Transformation lineage | The three chroma-key sources are background-removed into `alpha/`, then deterministically extracted, nearest-neighbor normalized, alpha-hardened, palette-limited, and assembled into transparent `96x96` sheets by `scripts/compose_product_cat_quality_slice_v11.py`. Runtime coat derivatives are built separately by `scripts/build_cat_coat_presets.py`. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. The project owner records that, as between the owner and OpenAI, the output is owned by the owner, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v4/`, covering `sit`, `walk`, and `interact` on desktop and mobile from entry through exit, including the v3 standing idle on `sit` exit. Structural validation passed, and wakun approved all six entries on 2026-08-08. |
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
| Reference inputs | The approved model sheet plus the project-owned v11 `sit` and `walk` sources as identity, scale, contact, and body-mass authorities. Rejected idle v1 and v2 were explicitly excluded as generation inputs. No third-party character, brand, illustration, or photograph was requested as an input or imitation target. |
| Transformation lineage | Built-in ImageGen chroma-key source → recorded chroma-key removal → shared-scale nearest-neighbor normalization → binary-alpha, 64-color `96x96` sheet via `scripts/compose_product_cat_idle.py` → deterministic coat derivatives via `scripts/build_cat_coat_presets.py`. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v4/`; structural validation passed, and wakun approved both desktop and mobile `sit` exits on 2026-08-08. |
| Distribution status | Approved for the rounded short-haired moving quality slice. This does not clear the room art or the other seven action sources. |
