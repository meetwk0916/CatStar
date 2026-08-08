# Triage Labels

The issue-tracker skills use five canonical triage roles. This table records
the label availability observed in the CatStar repository on 2026-08-08; check
the tracker before applying a label because labels can change independently of
the repository.

| Skill role | Tracker label | Availability and meaning |
| --- | --- | --- |
| `needs-triage` | — | **Missing** from the tracker; maintainer evaluation is needed before this role can be applied. |
| `needs-info` | — | **Missing** from the tracker; waiting on reporter information is not currently represented by a dedicated label. |
| `ready-for-agent` | `ready-for-agent` | Configured; fully specified and ready for an AFK agent. |
| `ready-for-human` | `ready-for-human` | Configured; requires human implementation. |
| `wontfix` | `wontfix` | Configured; will not be actioned. |

The two missing labels must be created by an authorized repository maintainer
before a workflow may apply them. Until then, use the issue body or an existing
label without pretending that the role is configured.
