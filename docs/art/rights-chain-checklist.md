# Art rights-chain checklist

**Status:** Current checklist; internal-prototype gate remains in force
**Scope:** Every runtime art group entering the first public web release
**Owner:** Walter
**Last reviewed:** 2026-08-24

This checklist records evidence needed for a distribution decision. Completing
it does not itself grant public, paid, marketing, beta, or app-store rights.
The canonical gate remains [`rights-and-provenance.md`](rights-and-provenance.md).

## 1. Choose the distribution target

Record the narrowest target being evaluated. Do not treat one target as
approval for another.

- [ ] Internal prototype review only
- [ ] Private user testing / closed beta
- [x] Public web release (free)
- [ ] Paid distribution
- [ ] Marketing or promotional use
- [ ] App-store submission

**Selected target:** First public web release, completely free. Current allowed
use remains internal-only until the project-wide gate closes.
**Decision owner:** Walter
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
| Rounded short-haired model sheet v1 | Production identity record, terms snapshot, enlarged review, and runtime/room derivative | Project-wide public-target decision (Issue #61) | Internal only |
| v12 `sit`, `walk`, `interact` | Source prompts, lineage, terms snapshot, and current fingerprint-bound scoped review | Sixty-combination release review and project-wide gate (Issues #60/#61) | Internal only |
| Quiet-motion v1 `idle`, `lie`, `sleep` | Source prompts, lineage, terms snapshot, and eight approved historical motion decisions | Current sixty-combination release review and project-wide gate (Issues #60/#61) | Internal only |
| Daily-life v1 `eat`, `groom`, `stretch` | Source prompts, lineage, terms snapshot, structural checks, and six-entry historical gray-white review | Current sixty-combination release review and project-wide gate (Issues #60/#61) | Internal only |
| Jump v6 | Production-identity source, lineage, terms snapshot, and approved historical desktop/mobile evidence | Current sixty-combination release review and project-wide gate (Issues #60/#61) | Internal only |
| Orange-tabby preset | Internal preview plus approved production brief | Independent production source, intake record, release review, and project-wide gate (Issues #56/#60/#61) | Internal only |
| Four deterministic coat derivatives | Complete deterministic lineage and inherited terms evidence | Per-combination release review and project-wide gate (Issues #60/#61) | Internal only |
| Room background/foreground | Completed owner record, lineage, terms snapshot, and current desktop/mobile review | Project-wide public-target decision (Issue #61) | Internal only |
| Plant interaction leaf | Completed owner record, prompt, lineage, terms snapshot, and runtime review | Project-wide public-target decision (Issue #61) | Internal only |
| Runtime review evidence | Fingerprint-bound screenshots and manifests | Inherits every source group's gate | Internal only |

## 4. Project-wide public-web closure checklist

Close the project-wide gate only when every applicable box is checked and the
linked records are reviewable by someone other than the person who generated
the art. These boxes record the second reviewer's closure confirmations, not
the underlying evidence inventory. An unchecked box can therefore coexist with
a verified fact recorded above, and remains unchecked until that reviewer
confirms the complete package and signs the decision below.

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

## 5. Next action for Issue #61

1. Review every group above against the public-web target.
2. Record the sixty-combination result and orange-tabby production intake.
3. Complete the second-person review and sign the decision below.
4. Change the canonical gate only when every applicable box passes; otherwise
   record the exact blocker list and keep the internal-only classification.

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
  every group citing OpenAI's Terms of Use. Remaining gate fields include the
  sixty-combination review, orange-tabby production intake, public-target
  decision, and second-person confirmation.
