# Rights snapshots

Immutable, hashable evidence records referenced by
[`../rights-and-provenance.md`](../rights-and-provenance.md). Each subdirectory-style
prefix names the provider record being archived. Files are never edited after
being committed; a corrected capture is added as a new dated file.

## openai-row-terms-of-use.wayback-20260809225319.*

**What:** OpenAI **Terms of Use**, Published/Effective **January 1, 2026** — the
terms record cited as "Terms evidence" by the rounded short-haired model sheet,
v12 quality-slice, quiet-motion v1, daily-life v1, and jump v6 intake records in
[`../rights-and-provenance.md`](../rights-and-provenance.md).

| Field | Record |
| --- | --- |
| Original source | `https://openai.com/policies/row-terms-of-use/` |
| Live retrieval | Blocked to automated fetches (HTTP 403), observed 2026-08-09 and again 2026-08-23 |
| Archive capture | Wayback Machine snapshot `20260809225319` UTC, HTTP 200 |
| Archive URL | `https://web.archive.org/web/20260809225319id_/https://openai.com/policies/row-terms-of-use/` |
| Retrieval date/time | 2026-08-23 ~17:45 CST (Asia/Shanghai), by Jesse (agent) on behalf of the project owner |
| Retrieval method | `id_` raw-byte replay (no toolbar rewriting); response body served gzip-wrapped exactly as originally crawled; decompressed locally |

### Files and SHA-256

| File | Bytes | SHA-256 | What it is |
| --- | --- | --- | --- |
| `openai-row-terms-of-use.wayback-20260809225319.raw.gz` | 49,992 | `bc54688fcb91a97976ad9821f050c59fa399e88cb05a381e83526429d9348594` | Exact bytes returned by the Wayback `id_` replay (the archived crawl payload, gzip form) |
| `openai-row-terms-of-use.wayback-20260809225319.html` | 389,635 | `056a65aa8ed8891ae8cf776e8b3fd46201423990393c4fcf62fd49283992f12e` | The same payload after gzip decompression (full HTML of the terms page) |
| `openai-row-terms-of-use.wayback-20260809225319.txt` | 22,187 | `6216bc359b277976d43789de2f4429c8dedb3f274588ba2b0d6c1f2572481462` | Tag-stripped plain-text extraction of the HTML body for review and diffing |

The **authoritative immutable artifact is the `.raw.gz` file**: it reproduces,
byte for byte, what the Internet Archive recorded on 2026-08-09 22:53:19 UTC.
Anyone can re-derive it:

```bash
curl -L "https://web.archive.org/web/20260809225319id_/https://openai.com/policies/row-terms-of-use/" \
  -o check.raw.gz && shasum -a 256 check.raw.gz
```

(The archive may serve an uncompressed copy depending on client headers;
decompress before comparing if the magic bytes are not `1f 8b`.)

### Why this capture date

The project's intake records reviewed these terms on **2026-08-08 / 2026-08-09**
(see the approval records in `rights-and-provenance.md`). This snapshot,
captured 2026-08-09 22:53 UTC, is the closest surviving immutable record of the
exact terms state those reviews consulted, closing the gap noted in
`../rights-chain-checklist.md` §6 ("Direct retrieval returned HTTP 403").

### Currency check (2026-08-23)

A second Wayback snapshot (`20260820212026`, captured 2026-08-20 21:20 UTC) was
also retrieved and compared: its extracted terms text is **identical word-for-word**
(difference ratio 1.0000 over 3,611 words; zero changed regions). Raw-file hashes
differ only because page-framework assets (Next.js build fingerprints) changed.
No terms revision occurred between 2026-01-01 publication and at least
2026-08-20. This currency check is recorded here only; no second snapshot file
is retained to keep the gate single-authority.

### Scope note

Archiving this snapshot completes one evidence field (immutable terms record)
for the groups that cite OpenAI's Terms of Use. It does not by itself flip any
group's distribution classification; the canonical gate remains
[`../rights-and-provenance.md`](../rights-and-provenance.md).
