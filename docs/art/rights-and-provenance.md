# Art rights and provenance

**Status:** Internal-prototype gate
**Last reviewed:** 2026-08-23

Unless a specific record below clears it, the current room and cat art may be
used only for CatStar internal prototype review. Every current asset group now
holds a provenance record below covering creator, tool, dates, lineage,
third-party assertions, and terms evidence. Records alone do not flip the
distribution gate: the project-wide rights-gate closing review (Issue #61)
owns that decision. An incomplete or missing record is an open rights chain,
not proof of production rights.

## Current asset groups

| Runtime group | Technical source | Provider/model | License or terms evidence | Allowed use |
| --- | --- | --- | --- | --- |
| Window-room background and foreground layers | `artifacts/art/sources/` plus local composition scripts | Codex built-in ImageGen; contemporaneous docs archived 2026-07-10 identify `gpt-image-2` (record below) | Recorded below; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Rights lineage recorded; public use gated on the Issue #61 rights-gate closure |
| Plant interaction leaf | `artifacts/art/sources/plant-interaction-v1/` plus `scripts/derive_plant_interaction_assets.py` | Codex built-in ImageGen; contemporaneous docs archived 2026-08-12/14 identify `gpt-image-2` (record below) | Recorded below; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Rights lineage recorded; public use gated on the Issue #61 rights-gate closure |
| Deterministic coat derivatives (solid black, solid white, calico, tuxedo) | `public/assets/scenes/window-room/cat/solid-black/` etc., built by `scripts/build_cat_coat_presets.py` from the gray-white master | No new generation — deterministic per-pixel recolor of recorded upstream sources (record below) | Recorded below; inherits each upstream component's OpenAI terms coverage and the immutable archived snapshot | Rights lineage complete; public use gated on the Issue #60 review pass and Issue #61 rights-gate closure |
| Remaining cat action sheets outside the records below | Internal orange-tabby appearance-preview sheets listed in `runtime-map.md` | Independent internal preview; release-grade replacement owned by Issues #23/#56 | Not cleared for any release use | Internal prototype only |
| Rounded short-haired production model sheet v1 | `artifacts/art/candidates/active/product-cat-model-sheet-v1/` | Built-in ImageGen; per-generation version not exposed; contemporaneous official docs (archived 2026-08-12/14, see Rights snapshots sources) identify `gpt-image-2` | Recorded below; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Production identity authority recorded; public clearance pending |
| Rounded short-haired v12 `sit`, `walk`, and `interact` sources | `artifacts/art/candidates/active/product-cat-quality-slice-v12/` plus `scripts/compose_product_cat_quality_slice_v12.py` | Built-in ImageGen; per-generation version not exposed; contemporaneous official docs (archived 2026-08-12/14, see Rights snapshots sources) identify `gpt-image-2` | Recorded below; current human confirmation complete; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Included in the locked internal motion master; not public-release clearance |
| Rounded short-haired quiet-motion v1 `idle`, `lie`, and `sleep` sources | `artifacts/art/candidates/active/product-cat-quiet-motion-v1/` plus `scripts/compose_product_cat_quiet_motion_v1.py` | Built-in ImageGen; per-generation version not exposed; contemporaneous official docs (archived 2026-08-12/14, see Rights snapshots sources) identify `gpt-image-2` | Recorded below; human confirmation complete; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Internal quiet-motion evidence; not public-release clearance |
| Rounded short-haired daily-life v1 `eat`, `groom`, and `stretch` sources | `artifacts/art/candidates/active/product-cat-daily-life-v1/` plus `scripts/compose_product_cat_daily_life_v1.py` | Built-in ImageGen; per-generation version not exposed; contemporaneous official docs (archived 2026-08-12/14, see Rights snapshots sources) identify `gpt-image-2` | Source hashes and transformation lineage recorded below; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Internal daily-life evidence; not public-release clearance |
| Rounded short-haired idle v3 source | `artifacts/art/candidates/active/product-cat-idle-v3/` plus `scripts/compose_product_cat_idle.py` | Built-in ImageGen; per-generation version not exposed; contemporaneous official docs (archived 2026-08-12/14, see Rights snapshots sources) identify `gpt-image-2` | Recorded below; immutable terms snapshot archived 2026-08-23 (see Rights snapshots) | Historical internal support; not current runtime or release art |
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

For the OpenAI Terms of Use cited throughout this document, the required
immutable snapshot now exists:
[`rights-snapshots/openai-row-terms-of-use.wayback-20260809225319.raw.gz`](rights-snapshots/openai-row-terms-of-use.wayback-20260809225319.raw.gz)
(Wayback Machine capture `20260809225319` UTC of
<https://openai.com/policies/row-terms-of-use/>, SHA-256
`bc54688fcb91a97976ad9821f050c59fa399e88cb05a381e83526429d9348594`;
currency-checked against the 2026-08-20 snapshot — identical terms text).
Records below refer to it as the archived OpenAI terms snapshot.

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08. Immutable repository snapshot archived 2026-08-23 (see Rights snapshots); the owner-use statement remains subject to applicable law and the Terms. |
| Distribution status | Production identity authority recorded for internal work. The immutable terms snapshot is archived; public distribution clearance remains pending the complete runtime rights-chain review and project-wide gate (Issue #61). |

## Rounded short-haired moving quality-slice approval record

**Status:** Rights source recorded; historical full-master review retained

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08; immutable repository snapshot archived 2026-08-23 (see Rights snapshots). The owner-use statement remains subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-motion-master-v1/` is historical ten-action desktop/mobile evidence captured before the current `idle`, `sit`, and `walk` inputs and scale registration changed. meetwk0916 approved all 20 entries against that capture-time fingerprint on 2026-08-15. It is not current release acceptance. The earlier `2026-08-08-quality-slice-v5/` directory remains scoped iteration history. |
| Distribution status | Internal rounded short-haired moving quality-slice evidence only. This record does not clear the room art, the other seven action sources, or public distribution. |

## Rounded short-haired ten-action historical motion-master record

**Status:** Historical internal approval; current release acceptance and public rights clearance pending

| Field | Record |
| --- | --- |
| Identity authority | `artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png` remains the sole anatomy, face, marking, palette, lighting, and pixel-style authority. |
| Current action sources | `product-cat-quality-slice-v12` supplies `sit`, `walk`, and `interact`; `product-cat-quiet-motion-v1` supplies `idle`, `lie`, and `sleep`; `product-cat-daily-life-v1` supplies `eat`, `groom`, and `stretch`; `product-cat-jump-v6` supplies `jump`. |
| Runtime derivation | `scripts/build_cat_coat_presets.py` wires the four approved production-identity candidates into the gray-white master and deterministic working coat derivatives without changing alpha geometry or timing. |
| Structural evidence | `npm run check:assets`, the complete test suite, and `tests/motion-master.test.ts` verify the ten-action contract, exact gray-white runtime-to-source wiring, evidence matrix, and evidence hashes. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-motion-master-v1/` contains 20 historical recordings: all ten actions at `1280x720` and `390x844`, bound to its capture-time source fingerprint `821a28c7793d4a5bae119dd1f959b1c8d56f0e137359b55b3a21a92214a3542f`. Current `idle`, `sit`, and `walk` inputs and scale registration postdate this evidence, so it is not a current release matrix. |
| Human approval | meetwk0916 approved all 20 desktop/mobile entries in Codex on 2026-08-15 against that historical fingerprint after reviewing identity consistency, readable action semantics, grounded room contacts, believable scale, and touch readability. The approval does not transfer to changed source inputs. |
| Terms evidence | The component records below retain their applicable OpenAI Terms review dates. Immutable repository snapshot archived 2026-08-23 (see Rights snapshots); commercial-use review at [`codex-imagegen-rights-review.md`](codex-imagegen-rights-review.md). |
| Distribution status | Locked for CatStar internal production work only. The immutable terms snapshot is archived; public, paid, marketing, and app-store distribution remain blocked by the current release review and project-wide rights gate (Issues #60/#61). |

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
| Transformation lineage | Chroma-key sources → local alpha removal → fixed-grid subject extraction → action-level scale normalization → transparent `96x96` gray-white sheets via `scripts/compose_product_cat_daily_life_v1.py` → four deterministic ordinary coat derivatives via `scripts/build_cat_coat_presets.py`. The internal orange preview has separate source lineage in `runtime-map.md`. |
| Structural evidence | `npm run check:assets` and `npm run test:assets` pass for all six current coat presets and the ten-action contract. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-daily-life-v3/` covers `eat`, sustained `groom`, and phase-weighted `stretch` for the gray-white motion master at `1280x720` and `390x844` from entry through exit. All six entries were approved by meetwk0916 on 2026-08-15 and pass the release-grade motion-review gate. The v1 and v2 directories retain the earlier short-stretch and short-grooming iterations for comparison. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; immutable repository snapshot archived 2026-08-23 (see Rights snapshots), subject to applicable law and the Terms. |
| Distribution status | Internal daily-life evidence only. The immutable terms snapshot is archived; public distribution remains blocked by the current release review and project-wide rights gate (Issues #60/#61). |

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
| Transformation lineage | Chroma-key source → connected-pose extraction → shared alpha-area normalization → six transparent `96x96` gray-white phases via `scripts/compose_product_cat_jump_v6.py` → four deterministic ordinary coat derivatives via `scripts/build_cat_coat_presets.py` → phase-synchronized scripted arc in the Phaser adapter `src/game/CatRoomScene.ts`. The internal orange preview has separate source lineage in `runtime-map.md`. |
| Structural evidence | `npm run check:assets` passes for all six current coat presets; `tests/jump-motion.test.ts` records six distinct frames, stable body mass, runtime wiring, and the approved evidence matrix. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-15-jump-v3/` covers the final post-review floor-to-window-bench and return route at `1280x720` and `390x844`. meetwk0916 approved both entries on 2026-08-15, and the release-grade motion-review gate passes. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; immutable repository snapshot archived 2026-08-23 (see Rights snapshots), subject to applicable law and the Terms. |
| Distribution status | Internal jump evidence only. The immutable terms snapshot is archived; public distribution remains blocked by the current release review and project-wide rights gate (Issues #60/#61). |

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-09; immutable repository snapshot archived 2026-08-23 (see Rights snapshots), subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1/` and `artifacts/art/runtime-motion-review/2026-08-09-quiet-motion-v1-blanket/`, covering `idle`, cat-bed and blanket awake-rest `lie`, and deep `sleep` at `1280x720` and `390x844` from entry through exit. Both release-grade structural gates pass; wakun approved all eight human-review decisions on 2026-08-09. |
| Distribution status | Internal quiet-motion evidence only. The immutable terms snapshot is archived; public distribution remains blocked by the current release review and project-wide rights gate (Issues #60/#61). |

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
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01 and reviewed 2026-08-08; immutable repository snapshot archived 2026-08-23 (see Rights snapshots), subject to applicable law and the Terms. |
| Continuous runtime evidence | `artifacts/art/runtime-motion-review/2026-08-08-quality-slice-v5/`; structural validation passed and the manifest records desktop and mobile `sit` entries, but a fresh human confirmation against the v5 boards is still required. |
| Distribution status | Historical internal quality-slice support for the `sit` exit, not current runtime art or public distribution clearance. The production-model-derived quiet-motion v1 package now supplies runtime `idle`. |

## Deterministic coat-preset derivative records (solid black, solid white, calico, black-and-white tuxedo)

**Status:** Rights lineage complete; release use gated on the sixty-combination human review

Per ADR-0010 these four 毛色预设 are the shipping deterministic derivatives.
They contain no independently generated art: every runtime sheet is a pure
local transform of the reviewed gray-white motion master, so their rights
chain is the upstream master's chain plus this recorded derivation.

| Field | Record |
| --- | --- |
| Runtime groups | `public/assets/scenes/window-room/cat/solid-black/`, `solid-white/`, `calico/`, and `tuxedo/` — ten action sheets each |
| Upstream authority | The locked gray-white rounded short-haired motion master: quiet-motion v1 (`idle`, `lie`, `sleep`), quality-slice v12 (`sit`, `walk`, `interact`), daily-life v1 (`eat`, `groom`, `stretch`), and jump v6 (`jump`), each with its own intake record above |
| Derivation tool | `scripts/build_cat_coat_presets.py` — project-owned, deterministic, version-controlled; authored and maintained by the project owner (first committed 2026-07-29, continuously in-repo since) |
| Transformation lineage | Per-pixel recolor of the gray-white master sheets only, preserving alpha geometry, anchors, frame counts, and timing exactly: luminance-preserving charcoal mapping (tuxedo keeps the master's white markings; solid-black remaps all coat pixels), warm-white mapping (solid-white), and a fixed three-patch orange-over-charcoal map (calico). Gold and pink accent pixels — eyes, nose, paw pads — pass through unchanged from the master. Orange tabby is excluded: its runtime directory holds the separately lined internal appearance preview, and its release intake is Issue #56. |
| Creator and account owner | The deriving script was written by the project owner; all upstream generated art is the project owner's own Codex built-in ImageGen output per the component intake records above |
| Third-party source assertion | The transform introduces no third-party artwork. The creator confirms that no third-party character, brand, illustration, or photograph was used as an input or imitation target, in either the upstream generation or the recolor rules. |
| Terms evidence | Inherits each upstream record's OpenAI Terms of Use coverage; immutable repository snapshot archived 2026-08-23 (see Rights snapshots). The owner-use statement remains subject to applicable law and the Terms. |
| Structural evidence | `npm run check:assets` validates all six current coat presets across the ten-action contract, and the motion-master tests assert exact runtime-to-source wiring and shared alpha geometry for the four derivatives. |
| Human approval slot | Reserved for the sixty-combination release-matrix review (Issue #60). Per the pragmatic derivative policy and ADR-0010, each of the four presets ships only if its combinations pass; any failing preset switches to independent production art instead. |
| Distribution status | Rights lineage recorded for internal production work. Public distribution additionally requires the Issue #60 review pass and closure of the project-wide art rights gate (Issue #61). |

## Window-room background and foreground intake record

**Status:** Owner self-attestation + contemporaneous model evidence; rights-gate closing review pending

| Field | Record |
| --- | --- |
| Runtime groups | `public/assets/scenes/window-room/background.png`, `foreground-cat-bed.png`, `foreground-blanket.png` (the cat-bed and blanket occlusion layers were locally derived from the same room art; see lineage below) |
| Source files | `artifacts/art/sources/window-room-background-source.png` (SHA-256 `c50e20590b33970cfe86df96e1a1039349b7602440c9d5e70fedc36a0bae5d2f`); concept sheet `artifacts/art/sources/catstar-window-room-concept-01.png` (SHA-256 `b5a3b77c3a83cf38c17a2d8c642353b5bfb3052d017fb7fd7a7286ba5fc35730`); early cat cutout references `cat-idle-chromakey-source.png`, `cat-idle-cutout-source.png`, `cat-sleep-chromakey-source.png` under the same directory. All four source files carry a 2026-06-16 creation timestamp. |
| Creator and account context | Generated with built-in ImageGen in the project owner's own Codex sessions; owner self-attested on 2026-08-23. Same self-attestation pattern as the approved production model-sheet record above. |
| Tool and date | Built-in ImageGen; per-generation version not exposed; generated ≈2026-06-16 (source-file timestamps). Contemporaneous official documentation — Wayback capture of learn.chatgpt.com/docs/image-generation at 2026-07-10 (`rights-snapshots/imagegen-rights-review-sources/learn-imagegen-wayback-20260710.html`, SHA-256 `cd62f05c6b24e642757a5586d34a7a60d5622000545ffca83cfd4c4f3d8403c1`) — states "Built-in image generation uses `gpt-image-2`"; gpt-image-2 became available in Codex in April 2026 with no intervening model change, so it is the best-supported identification for this window. A supporting help-center capture of 2026-06-23 is archived alongside. |
| Prompt availability | The original room-generation prompts are **not recoverable**: local Codex session history begins 2026-07-23, so June session logs no longer exist on this machine. This gap is recorded honestly; generation-window dating therefore rests on source-file timestamps plus owner attestation. The concept sheet and background are visually consistent with one another and with all later runtime art derived from them. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or photograph was used as an input or imitation target for the room background, concept sheet, or foreground derivations. |
| Transformation lineage | Background source → local downscale/composition into the `640x360` runtime `background.png`; cat-bed and blanket occlusion layers cut from the same room art during the June room-interaction work (first committed 2026-06-10/11); the later plant-leaf split repaired a small region via `scripts/derive_plant_interaction_assets.py` without changing the rest of the composition. Early cat cutouts informed positioning only and feed no current runtime pixel. |
| Terms evidence | [OpenAI Terms of Use](https://openai.com/es-US/policies/row-terms-of-use/), effective 2026-01-01; the immutable repository snapshot (Wayback capture 20260809225319, SHA-256 `bc54688fcb91a97976ad9821f050c59fa399e88cb05a381e83526429d9348594`) was currency-checked identical through ≥2026-08-20, covering both the June generation window and today. See also [`codex-imagegen-rights-review.md`](codex-imagegen-rights-review.md). The owner-use statement remains subject to applicable law and the Terms. |
| Human review | Room visuals reviewed across every fingerprint-bound desktop/mobile evidence round culminating in the 19-entry set approved by meetwk0916 on 2026-08-23. |
| Distribution status | Rights lineage recorded for internal production work. Public distribution additionally requires closure of the project-wide art rights gate (Issue #61). If that review rejects this self-attestation pattern, the remake fallback in wayfinder Issue #58 applies. |

## Plant interaction leaf intake record

**Status:** Owner self-attestation + full prompt record; rights-gate closing review pending

| Field | Record |
| --- | --- |
| Runtime groups | `public/assets/scenes/window-room/plant-leaf.png` (and the leaf-split region of `background.png`) |
| Source files | `artifacts/art/sources/plant-interaction-v1/generated-leaf-alpha.png` (SHA-256 `7f97dfc21c2a1375eadde2088c4038ab1fa27063829096d355545c58f55a3f09`); pre-split background `background-before-leaf-split.png` (SHA-256 `e67a9036dac63ae741db00abd1e1c17f00fb80e4b527a4bdb01cda89d600639c`), itself a reviewed derivative of the June window-room source above. Both files carry a 2026-08-07 timestamp. |
| Creator and account context | Generated with built-in ImageGen in the project owner's own Codex session; owner self-attested on 2026-08-23. |
| Tool and date | Built-in ImageGen; per-generation version not exposed; generated 2026-08-07. Contemporaneous official Wayback captures of learn.chatgpt.com/docs/image-generation at **2026-08-12 and 2026-08-14** (archived under `rights-snapshots/imagegen-rights-review-sources/`) identify the built-in tool as `gpt-image-2`. |
| Source prompt | Fully retained: the isolated-leaf chroma-key extraction prompt is recorded verbatim in [`../../../artifacts/art/sources/plant-interaction-v1/README.md`](../../artifacts/art/sources/plant-interaction-v1/README.md), including the rejected whole-room-regeneration attempt (discarded, never committed). No prompt archaeology needed. |
| Third-party source assertion | The creator confirms that no third-party character, brand, illustration, or photograph was used as an input or imitation target; the only reference input was the project's own room art. |
| Transformation lineage | Chroma-key candidate → bundled `remove_chroma_key.py` alpha conversion → `generated-leaf-alpha.png` → deterministic split/repair by the project-owned `scripts/derive_plant_interaction_assets.py` (committed 2026-08-04) → runtime `plant-leaf.png` plus the locally repaired background region. |
| Structural evidence | `npm run check:assets` validates the split leaf and background dimensions/alpha together with the ten-action contract. Continuous plant-touch evidence exists under `artifacts/art/runtime-review/`. |
| Terms evidence | Same OpenAI consumer Terms coverage as the component records: immutable snapshot archived 2026-08-23 covers the 2026-08-07 generation window; commercial-use analysis in [`codex-imagegen-rights-review.md`](codex-imagegen-rights-review.md). Subject to applicable law and the Terms. |
| Distribution status | Rights lineage recorded for internal production work. Public distribution additionally requires closure of the project-wide art rights gate (Issue #61); the remake fallback in wayfinder Issue #58 applies if that review rejects the record. |

## Early cat cutout archive record

**Status:** Historical direction reference; feeds no current runtime asset

| Field | Record |
| --- | --- |
| Files | `cat-idle-chromakey-source.png` (SHA-256 `2010b19bdc353c47b3d48019a308bd0f38ed6f588236278aad857e1d0e92e3a8`), `cat-idle-cutout-source.png` (SHA-256 `3d68964185f7083f22be789244833642414eef00e039ae38a526b0c2647e8ea7`), `cat-sleep-chromakey-source.png` (SHA-256 `a43052a1e44e34f3b55938d9b062ac80daaecb48869ec5f13a7c3ed38e27e7c3`), all under `artifacts/art/sources/` with 2026-06-16 timestamps |
| Role | Earliest June cat experiments; visual-direction history only. No script or runtime path consumes them — they are superseded by the production-model-derived master chain recorded above. Kept as provenance archives, not as release candidates. |
| Tool and date | Built-in ImageGen in the project owner's Codex sessions, ≈2026-06-16, under the same contemporaneous-evidence and terms coverage as the window-room record above. |
| Distribution status | Not eligible for any release use regardless of gate state; retained for lineage completeness. |
