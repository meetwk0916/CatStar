# Art rights-chain checklist

**Status:** Current checklist; internal-prototype gate remains in force
**Scope:** Every runtime art group entering the invited beta (`ADR-0011`), with public-release-only groups tracked separately
**Owner:** Walter
**Last reviewed:** 2026-11-21

This checklist records evidence needed for a distribution decision. Completing
it does not itself grant public, paid, marketing, beta, or app-store rights.
The canonical gate remains [`rights-and-provenance.md`](rights-and-provenance.md).

## 1. Choose the distribution target

Record the narrowest target being evaluated. Do not treat one target as
approval for another.

- [ ] Internal prototype review only
- [x] Private user testing / closed beta
- [ ] Public web release (free)
- [ ] Paid distribution
- [ ] Marketing or promotional use
- [ ] App-store submission

**Selected target:** Invited beta of **喵星来信** ([`ADR-0011`](../adr/0011-first-external-milestone-is-an-invited-beta.md)), completely free. If external visitors cannot open Sites without an OpenAI account and the beta uses an unadvertised link, every asset reachable in the beta build must meet the free public-web standard before access opens. Current allowed use remains internal-only until [Close the invited-beta art rights gate](https://github.com/meetwk0916/CatStar/issues/61) closes.
**Decision owner:** Walter
**Decision date:** 2026-11-21

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
| Rounded short-haired model sheet v1 | Production identity record, terms snapshot, enlarged review, and runtime/room derivative | Beta rights-gate decision ([Close the invited-beta art rights gate](https://github.com/meetwk0916/CatStar/issues/61)) | Internal only |
| v12 `sit`, `walk`, `interact` | Source prompts, lineage, terms snapshot, and historical scoped review | Current-fingerprint form/motion review ([完成内测毛色的形态与连续动作逐项验收并锁死可选预设](https://github.com/meetwk0916/CatStar/issues/84)) and beta rights gate | Internal only |
| Quiet-motion v1 `idle`, `lie`, `sleep` | Source prompts, lineage, terms snapshot, and eight approved historical motion decisions | Current-fingerprint form/motion review (`#84`) and beta rights gate (`#61`) | Internal only |
| Daily-life v1 `eat`, `groom`, `stretch` | Source prompts, lineage, terms snapshot, structural checks, and six-entry historical gray-white review | Current-fingerprint form/motion review (`#84`) and beta rights gate (`#61`) | Internal only |
| Jump v6 | Production-identity source, lineage, terms snapshot, and approved historical desktop/mobile evidence | Current-fingerprint form/motion review (`#84`) and beta rights gate (`#61`) | Internal only |
| Orange-tabby preset | Internal preview plus approved production brief (`artifacts/art/production-briefs/orange-tabby-v1/`) | Excluded from the invited beta (`ADR-0011`, runtime selector gated by `#84`); post-beta public release requires independent production source, intake, and full review | Internal only (post-beta) |
| Four deterministic coat derivatives | Complete deterministic lineage and inherited terms evidence | Per-entry form/motion review for any preset selected for invitees (`#84`) and beta rights gate (`#61`); full sixty-combination review deferred to post-beta public release | Internal only |
| Landscape room background/foreground | Completed owner record, lineage, terms snapshot, and desktop/mobile review | Beta rights-gate decision (`#61`) | Internal only |
| Portrait room background (and any derived foreground/prop layers) | Owner ImageGen record (`artifacts/art/sources/portrait-room-v2.md`) and 2026-11-10 artwork acceptance | Portrait environment/prop cohesion calibration ([校准并验收竖屏环境背景融合与全区域交互质量](https://github.com/meetwk0916/CatStar/issues/88)), lineage update if modified, and beta rights gate (`#61`) | Internal only |
| Plant interaction leaf | Completed owner record, prompt, lineage, terms snapshot, and runtime review | Portrait leaf cohesion check (`#88`) and beta rights gate (`#61`) | Internal only |
| Runtime review evidence | Fingerprint-bound screenshots/videos and manifests | Inherits every source group's gate | Internal only |

## 4. Target closure checklist

Close the gate for the selected target only when every applicable box is checked
and the linked records are reviewable by someone other than the person who
generated the art. These boxes record the second reviewer's closure
confirmations, not the underlying evidence inventory. An unchecked box can
therefore coexist with a verified fact recorded above, and remains unchecked
until that reviewer confirms the complete package and signs the decision below.

- [ ] Distribution target is explicitly selected.
- [ ] The dedicated production model sheet is the sole identity authority.
- [ ] Principal views, anatomy, landmarks, markings, contact lines, lighting,
      outline, pixel treatment, and in-room scale are recorded.
- [ ] Enlarged model-sheet review is recorded.
- [ ] `96x96` runtime-cell review is recorded.
- [ ] Desktop room review is recorded.
- [ ] Mobile portrait room review (`390 × 844`) is recorded across all active zones.
- [ ] Every runtime asset group reachable in the intended build has a completed
      evidence record from section 2. Excluded groups are absent from the
      assembled client assets, not just hidden from the coat selector.
- [ ] Applicable terms/provider records are archived immutably and hashed.
- [ ] Human approval and attribution requirements are recorded.
- [ ] User-facing note / copy discloses AI-generated art where applicable to the
      selected target.
- [ ] The runtime map contains no unresolved asset that can enter the intended
      distribution build.
- [ ] A second reviewer confirms the package and signs the decision below.

**Reviewer:** ____________________
**Review date:** ____________________
**Decision:** `internal-only` / `approved-for-target` / `blocked`
**Decision notes:**

______________________________________________________________________________

## 5. Next action for [Close the invited-beta art rights gate](https://github.com/meetwk0916/CatStar/issues/61)

1. Finish portrait environment/prop cohesion calibration (`#88`) and ensure any
   adjusted room, foreground, or leaf layer has updated hashes and lineage in
   `rights-and-provenance.md`.
2. Review every runtime group exposed in the invited beta (excluding the
   runtime-disabled orange preview) against the selected target above.
3. Complete the confirmation and sign the decision block in section 4.
4. Attach the reviewed client asset path-to-SHA-256 inventory to the decision.
   Generate a review candidate with `python3 scripts/check_beta_assets.py --inventory`.
   This is an inventory, not an approval. See the [hosting check](../../README.md#hosting)
   before exposing the exact package.
5. Change the canonical gate in `rights-and-provenance.md` only for the invited
   beta scope when every applicable box passes; a future public release still
   requires a fresh public-target closure covering orange-tabby production art
   and all sixty six-preset combinations.

Closing or completing the internal review does not clear any public,
commercial, marketing, beta, or app-store distribution. Keep the repository's
**Internal-prototype gate** unchanged.

## 6. Terms-page observation — now archived

The previously open observation is closed by an immutable repository archive.

- **Source:** <https://openai.com/policies/row-terms-of-use/> (the
  `es-US` URL earlier recorded here serves the same ROW terms)
- **Published/effective:** January 1, 2026
- **First observed:** 2026-08-09 (direct retrieval returned HTTP 403)
- **Archived:** 2026-08-23 via Wayback Machine capture `20260809225319` UTC
  (`rights-snapshots/openai-row-terms-of-use.wayback-20260809225319.raw.gz`,
  SHA-256 `bc54688fcb91a97976ad9821f050c59fa399e88cb05a381e83526429d9348594`;
  readable copies alongside). Currency-checked against the 2026-08-20
  snapshot: identical terms text.
- **Relevant sections reviewed:** content ownership ("you own the Output";
  assignment of right, title, and interest), input responsibility, output
  evaluation obligations, publication/sharing policies, and terms changes —
  all present in the archived text.
- **Gate result:** The immutable-terms-snapshot evidence field is complete for
  every group citing OpenAI's Terms of Use. Remaining gate fields for the
  invited beta (`ADR-0011`) are portrait environment/prop cohesion (`#88`),
  current-fingerprint form-and-motion review on the beta preset subset (`#84`),
  and target closure in section 4 (`#61`); orange-tabby production intake and
  sixty-combination review apply to a post-beta public release.
