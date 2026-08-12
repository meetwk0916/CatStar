# Issue #17 rights-chain checklist (draft)

**Status:** Draft; internal-prototype gate remains in force
**Scope:** Rounded short-haired production model sheet and the runtime art that
would depend on it
**Owner:** ____________________
**Last reviewed:** 2026-08-09

This checklist records evidence needed for a distribution decision. Completing
it does not itself grant public, paid, marketing, beta, or app-store rights.
The canonical gate remains [`rights-and-provenance.md`](rights-and-provenance.md).

## 1. Choose the distribution target

Record the narrowest target being evaluated. Do not treat one target as
approval for another.

- [x] Internal prototype review only
- [ ] Private user testing / closed beta
- [ ] Public beta
- [ ] Paid distribution
- [ ] Marketing or promotional use
- [ ] App-store submission

**Selected target:** Internal prototype review only (user direction: “ok” after target clarification)
**Decision owner:** ____________________
**Decision date:** ____________________

## 2. Evidence required for every runtime asset group

Create one completed record for every source that can reach a public build.
If any required field is unknown, keep that group classified as internal-only.

| Evidence field | Required record |
| --- | --- |
| Runtime group | Exact runtime asset family and preset/action scope |
| Source path | Source file or candidate package, with SHA-256 |
| Creator/account owner | Attributable person, provider, or account |
| Provider/tool | Product-facing tool name |
| Model/version | Exact version when exposed; record “not exposed” when it is not |
| Creation date | Date and timezone when known |
| Prompt/brief | Archived source prompt, commission brief, or equivalent |
| Transformation lineage | Every background removal, extraction, normalization, recolor, and assembly step |
| Terms snapshot | Archived applicable terms/provider record, retrieval date, URL, and SHA-256 |
| Third-party assertion | Confirmation that no protected character, brand, illustration, or photograph was imitated |
| Human approval | Reviewer, date, artifact/board, and pass/fail decision |
| Distribution decision | Allowed target, restrictions, attribution, and decision owner |

## 3. Current CatStar inventory

Use this table as a work queue. It is not a clearance decision.

| Runtime group | Current evidence | Remaining blocker | Gate |
| --- | --- | --- | --- |
| Rounded short-haired model sheet v1 | `product-cat-model-sheet-v1/`; enlarged and runtime/room review derivative exists | Immutable terms snapshot; final target decision | Internal only |
| v12 `sit`, `walk`, `interact` | Source prompts, lineage, and fingerprint-bound desktop/mobile review | Final human confirmation; immutable terms snapshot | Internal only |
| Quiet-motion v1 `idle`, `lie`, `sleep` | Source prompts, lineage, and eight approved motion decisions | Immutable terms snapshot; remaining runtime rights chain | Internal only |
| Daily-life v1 `eat`, `groom`, `stretch` | Production-model-derived source prompts, lineage, structural checks, and six-entry gray-white desktop/mobile motion evidence | Human review entries; immutable terms snapshot | Internal only |
| Remaining cat actions | Mixed candidate packages in `runtime-map.md` | Unified production source and complete rights records | Internal only |
| Room background/foreground | `artifacts/art/sources/` and composition scripts | Provider, terms, and commercial-use evidence | Internal only |
| Plant interaction leaf | `plant-interaction-v1/` and derivation script | Provider/model and immutable terms snapshot | Internal only |
| Runtime review evidence | Fingerprint-bound screenshots and manifests | Inherits every source group's gate | Internal only |

## 4. #17 closure checklist

Close #17 only when every applicable box is checked and the linked records are
reviewable by someone other than the person who generated the art.

- [ ] Distribution target is explicitly selected.
- [ ] The dedicated production model sheet is the sole identity authority.
- [ ] Principal views, anatomy, landmarks, markings, contact lines, lighting,
      outline, pixel treatment, and in-room scale are recorded.
- [ ] Enlarged model-sheet review is recorded.
- [ ] `96x96` runtime-cell review is recorded.
- [ ] Desktop room review is recorded.
- [ ] Mobile room review is recorded at the supported viewport.
- [ ] Every runtime asset group in the intended distribution has a completed
      evidence record from section 2.
- [ ] Applicable terms/provider records are archived immutably and hashed.
- [ ] Human approval and attribution requirements are recorded.
- [ ] The runtime map contains no unresolved asset that can enter the intended
      distribution build.
- [ ] A second reviewer confirms the package and signs the decision below.

**Reviewer:** ____________________
**Review date:** ____________________
**Decision:** `internal-only` / `approved-for-target` / `blocked`
**Decision notes:**

______________________________________________________________________________

## 5. Next action for #17

1. Keep the selected target limited to internal prototype review.
2. Treat public/commercial clearance as a separate future release gate.
3. If the target changes later, archive the applicable provider/terms record and
   record its hash.
4. Request a second-person review before changing the rights status.

Closing or completing the internal review does not clear any public,
commercial, marketing, beta, or app-store distribution. Keep the repository's
**Internal-prototype gate** unchanged.

## 6. Current terms-page observation (not an archive)

This is a source pointer for the next evidence pass, not a completed terms
snapshot or legal conclusion.

- **Source:** <https://openai.com/es-US/policies/row-terms-of-use/>
- **Published/effective:** January 1, 2026
- **Observed:** 2026-08-09
- **Relevant sections to archive and review:** content ownership and input
  responsibility, output evaluation, publication/sharing policies, and terms
  changes.
- **Local immutable archive:** Not completed. Direct retrieval returned HTTP
  403, so no content hash is recorded.
- **Gate result:** Terms evidence remains unchecked; no public-beta target is
  selected or cleared by this observation.
