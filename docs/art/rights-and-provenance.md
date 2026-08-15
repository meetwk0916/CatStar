# Art rights and provenance

**Status:** Internal-prototype gate
**Last reviewed:** 2026-08-09

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
| Remaining cat action sheets outside the records below | Active candidate packages listed in `runtime-map.md` | Unknown | Missing | Internal prototype only |
| Rounded short-haired production model sheet v1 | `artifacts/art/candidates/active/product-cat-model-sheet-v1/` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below; immutable terms snapshot still missing | Production identity authority recorded; public clearance pending |
| Rounded short-haired v12 `sit`, `walk`, and `interact` sources | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` plus `scripts/compose_product_cat_quality_slice_v12.py` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below; final human confirmation and immutable terms snapshot still missing | Internal quality-slice evidence; not public-release clearance |
| Rounded short-haired quiet-motion v1 `idle`, `lie`, and `sleep` sources | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` plus `scripts/compose_product_cat_quiet_motion_v1.py` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below; human confirmation complete; immutable terms snapshot still missing | Internal quiet-motion evidence; not public-release clearance |
| Rounded short-haired daily-life v1 `eat`, `groom`, and `stretch` sources | `artifacts/art/candidates/active/product-cat-daily-life-v1/` plus `scripts/compose_product_cat_daily_life_v1.py` | Built-in ImageGen; provider did not expose the underlying model version | Source hashes and transformation lineage recorded below; immutable terms snapshot still missing | Internal daily-life evidence; not public-release clearance |
| Rounded short-haired idle v3 source | `artifacts/art/candidates/active/product-cat-idle-v3/` plus `scripts/compose_product_cat_idle.py` | Built-in ImageGen; provider did not expose the underlying model version | Recorded below; immutable terms snapshot still missing | Historical internal support; not current runtime or release art |
| Runtime-review screenshots | Locally captured from CatStar | CatStar code plus the applicable runtime asset groups above | Inherits the reviewed assets' source status | Internal review only |

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

The linked Terms page is a mutable web document. A dated review note is not an
immutable terms snapshot; archive the applicable text or provider record in the
repository before relying on it for public, paid, marketing, or app-store use.

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
| Scale review | The source sheet was approved enlarged. The mobile review derivative at `artifacts/art/review/rounded-short-haired-model-sheet-v1/mobile-review-375w.png` combines the dedicated model sheet, a `96x96` runtime strip, and room crops from the fingerprint-bound desktop and `390x844` mobile review screenshots; separately recorded v12 action evidence covers the derived action cells in continuous desktop and mobile motion. |
| Creator and account owner | Project owner (self-attested) |
| Design reviewer | wakun |
| Formal approval | Approved by wakun on 2026-08-08 as CatStar's production model sheet and the sole identity and visual baseline for subsequent cat action work. |
| Tool | ImageGen; exact version not exposed |
| Final generation date | 2026-08-08, before the v12 action sources were generated. |
| Source brief | Gray-and-white tabby, healthy adult, rounded short-haired domestic cat; natural proportions rather than chibi; broad chest, compact torso, short sturdy legs, wider cheeks; calm curious expression; controlled pixel clusters and soft indoor light. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or another person's photo was used as a reference input or imitation target. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. The page is mutable and no immutable repository snapshot is recorded yet; the owner-use statement remains subject to applicable law and the Terms. |
| Distribution status | Production identity authority recorded for internal work. Public distribution clearance remains pending an immutable terms snapshot and complete runtime rights-chain review. |

## Rounded short-haired moving quality-slice approval record

**Status:** Rights source recorded; runtime evidence recorded, final human confirmation pending

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08; no immutable repository snapshot is recorded yet. The owner-use statement remains subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`, covering the production-model-derived `sit`, `walk`, and `interact` on desktop and mobile from entry through exit. Structural validation passed; the manifest's human-review entries require a fresh confirmation against the v5 boards before they are treated as final release approval. |
| Distribution status | Internal rounded short-haired moving quality-slice evidence only. This record does not clear the room art, the other seven action sources, or public distribution. |

## Rounded short-haired daily-life v1 intake record

**Status:** Internal daily-life evidence; structural asset review passed

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-daily-life-v1/` |
| Identity authority | `artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png` is the sole anatomy, face, marking, palette, and pixel-style authority. |
| Generated source SHA-256 | `sources/eat-source-chromakey.png`: `b95a09da6c5026355826dda493b52aa708662d0d0cd3b08a439b1e1e245f8a45`; `sources/groom-source-chromakey.png`: `c12f199476a28ac0449b5c5b878c493538f66922ab465db7ea9d64503fe56eed`; `sources/stretch-source-chromakey.png`: `fddb03629bcd5f10f5fb8542ca8dd0e5faeee62363b2205571266e76936234ae`. |
| Derived alpha SHA-256 | `alpha/eat-source.png`: `52ff176e31fbc63ca02c43535cb10b322390a10f43885fb565124d6b92058e4f`; `alpha/groom-source.png`: `b6043bea44a9b761de5df2655ea56659de854b05d56f113933c01f46a78bd045`; `alpha/stretch-source.png`: `a4d0d5711e6445afaf759e24406747ed27c3475d79168814bcb9c0615aab9fd7`. |
| Creator and account context | Generated with built-in ImageGen in the project owner's Codex session. |
| Tool and date | Built-in ImageGen; exact version not exposed; generated 2026-08-09. |
| Source brief | Six bowl-oriented `eat` poses, eight seated paw-and-face `groom` poses, and six grounded foreleg `stretch` poses, all preserving the approved production identity and contact convention. Exact prompt set is retained in `generation-prompts.md`. |
| Third-party source assertion | No third-party character, brand, illustration, or photograph was requested as an input or imitation target. |
| Transformation lineage | Chroma-key sources → local alpha removal → fixed-grid subject extraction → action-level scale normalization → transparent `96x96` sheets via `scripts/compose_product_cat_daily_life_v1.py` → deterministic current coat derivatives via `scripts/build_cat_coat_presets.py`. |
| Structural evidence | `npm run check:assets` and `npm run test:assets` pass for all six current coat presets and the ten-action contract. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-daily-life-v3/` covers `eat`, sustained `groom`, and phase-weighted `stretch` for the gray-white motion master at `1280x720` and `390x844` from entry through exit. All six entries were approved by meetwk0916 on 2026-08-15 and pass the release-grade motion-review gate. The v1 and v2 directories retain the earlier short-stretch and short-grooming iterations for comparison. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; no immutable repository snapshot is recorded yet, subject to applicable law and the Terms. |
| Distribution status | Internal daily-life evidence only. Public distribution remains blocked by the immutable terms snapshot and complete runtime rights-chain requirements. |

## Rounded short-haired jump v6 intake record

**Status:** Internal jump evidence; structural and human runtime review passed

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-jump-v6/` |
| Identity authority | `artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png` is the sole anatomy, face, marking, palette, and pixel-style authority. |
| Motion reference | The prior `product-cat-actions-v5/sources/jump-natural-source.png` supplied motion-phase context only. |
| Generated source SHA-256 | `sources/jump-six-phase-source.png`: `0fb878d4719fcfa22d8803dcfd5c10bbddbb5838537a77dd25edeea7899c97ac`. |
| Creator and account context | Generated with built-in ImageGen in the project owner's Codex session. |
| Tool and date | Built-in ImageGen; exact version not exposed; generated 2026-08-15. |
| Source brief | Six right-facing phases: grounded anticipation, rear-leg launch, rising, apex balance, prepared descent, and four-paw landing recovery. The initial request and targeted sixth-frame correction are retained in `generation-prompt.md`. |
| Third-party source assertion | No third-party character, brand, illustration, or photograph was requested as an input or imitation target. |
| Transformation lineage | Chroma-key source → connected-pose extraction → shared alpha-area normalization → six transparent `96x96` phases via `scripts/compose_product_cat_jump_v6.py` → deterministic current coat derivatives via `scripts/build_cat_coat_presets.py` → phase-synchronized scripted arc via `src/game/scriptedJump.ts`. |
| Structural evidence | `npm run check:assets` passes for all six current coat presets; `tests/jump-motion.test.ts` records six distinct frames, stable body mass, runtime wiring, and the approved evidence matrix. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-jump-v2/` covers the complete floor-to-window-bench and return route at `1280x720` and `390x844`. meetwk0916 approved both entries on 2026-08-15, and the release-grade motion-review gate passes. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; no immutable repository snapshot is recorded yet, subject to applicable law and the Terms. |
| Distribution status | Internal jump evidence only. Public distribution remains blocked by the immutable terms snapshot and complete runtime rights-chain requirements. |

## Rounded short-haired quiet-motion v1 intake record

**Status:** Rights source recorded; structural and human runtime review passed

| Field | Record |
| --- | --- |
| Candidate package | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` |
| Source SHA-256 | `idle-source-chromakey.png`: `40c0dbe49df82902ad781a6df03061e1f790555005ba31e4b4853b83dad1bb87`; `lie-source-chromakey.png`: `209b532f4a913e2d3a3a8b7353e81f85bd91ad08fdc1a196ba7adf8934912e00`; `sleep-source-chromakey.png`: `5a2a56eca3058c3e347b42aa43cb63bd7d0a6312aac100728fdb7fbd4743f4bf`. |
| Runtime-master SHA-256 | `idle.png`: `3ee5f6047f00084a5371961b58130c447e0b9de27a9436f0d673f0513bd82a06`; `lie.png`: `8e09e93453620821f88b653fd5e2fbe80bbf64e68d00b1519524845ac6eac0df`; `sleep.png`: `7d35254ca6c811071543cf4c17207e43c0f3742bc60471f4a699a35840c896d4`. |
| Creator and account context | Generated with built-in ImageGen in the project owner's Codex session. |
| Tool and date | Built-in ImageGen; exact version not exposed; generated 2026-08-09. |
| Identity authority | The approved `product-cat-model-sheet-v1` was the sole anatomy, face, marking, palette, and pixel-style authority. The approved v12 `sit` source supplied production-action identity context. |
| Source brief | Four-frame `idle` with restrained breathing and blink; four-frame awake-rest `lie` with raised head and open-eye return; four-frame curled `sleep` with closed eyes and minimal breathing. Earlier action sources supplied motion layout only. The exact normalized requests are retained in `generation-prompts.md`. |
| Third-party source assertion | No third-party character, brand, illustration, or photograph was requested as an input or imitation target. |
| Transformation lineage | Built-in ImageGen chroma-key sources → recorded chroma-key removal → connected-pose extraction → nearest-neighbor normalization → binary-alpha, 64-color `96x96` sheets via `scripts/compose_product_cat_quiet_motion_v1.py` → deterministic current coat derivatives via `scripts/build_cat_coat_presets.py`. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; no immutable repository snapshot is recorded yet, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1/` and `artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1-blanket/`, covering `idle`, cat-bed and blanket awake-rest `lie`, and deep `sleep` at `1280x720` and `390x844` from entry through exit. Both release-grade structural gates pass; wakun approved all eight human-review decisions on 2026-08-09. |
| Distribution status | Internal quiet-motion evidence only. Public distribution remains blocked by an immutable terms snapshot and the remaining runtime rights chain. |

## Rounded short-haired idle v3 intake record

**Status:** Rights source recorded; historical compatibility evidence only

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08; no immutable repository snapshot is recorded yet, subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`; structural validation passed and the manifest records desktop and mobile `sit` entries, but a fresh human confirmation against the v5 boards is still required. |
| Distribution status | Historical internal quality-slice support for the `sit` exit, not current runtime art or public distribution clearance. The production-model-derived quiet-motion v1 package now supplies runtime `idle`. |
