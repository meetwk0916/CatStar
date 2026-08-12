# CatStar Documentation

This index defines the repository's documentation structure and precedence.

## Read first

1. [`../CONTEXT.md`](../CONTEXT.md) — canonical domain vocabulary and language boundaries.
2. [`specs/phase-0.1.md`](specs/phase-0.1.md) — current product and architecture specification.
3. [`status/current.md`](status/current.md) — living implementation status.

When documents disagree, `CONTEXT.md` and `AGENTS.md` win for product boundaries;
the current Phase 0.1 spec wins for architecture; specialized specs win within
their subject. The historical Phase 0 spec never overrides current documents.

## Product and technical specs

- [`specs/phase-0.1.md`](specs/phase-0.1.md) — current Phase 0.1 scope and architecture.
- [`specs/environment-interaction.md`](specs/environment-interaction.md) — room zones and grounded movement.
- [`specs/cat-animation.md`](specs/cat-animation.md) — production animation contract.
- [`specs/phase-0.md`](specs/phase-0.md) — historical pure-code Phase 0 baseline.

## Status and acceptance

- [`status/current.md`](status/current.md) — the only project-wide mutable status summary.
- [`qa/phase-0.1.md`](qa/phase-0.1.md) — current manual acceptance checklist.

## Design and art

- [`design/art-direction.md`](design/art-direction.md) — durable visual direction.
- [`art/README.md`](art/README.md) — generated-art workflow and evidence index.
- [`art/runtime-map.md`](art/runtime-map.md) — current runtime asset provenance.
- [`art/rights-and-provenance.md`](art/rights-and-provenance.md) — rights-chain
  gate for internal versus public use.
- [`art/rights-chain-checklist.md`](art/rights-chain-checklist.md) — draft
  evidence checklist for Issue #17; it does not grant distribution rights.

Generated sources, candidate sheets, and browser-review evidence live under
`artifacts/art/`, not under `docs/`.

## Decisions and agent configuration

- [`adr/`](adr/) — accepted architectural decisions.
- [`adr/0006-release-with-one-complete-appearance-prototype.md`](adr/0006-release-with-one-complete-appearance-prototype.md) — accepted first-release boundary for one complete rounded short-haired appearance prototype.
- [`agents/domain.md`](agents/domain.md) — how engineering skills consume domain docs.
- [`agents/issue-tracker.md`](agents/issue-tracker.md) — GitHub issue workflow.
- [`agents/triage-labels.md`](agents/triage-labels.md) — canonical triage roles and their current tracker availability.

## Maintenance rules

- Keep mutable implementation status in `status/current.md`.
- Keep exact runtime asset selection in `art/runtime-map.md`.
- Specs define required behavior and should not duplicate mutable status tables.
- Put generated binaries and review evidence under `artifacts/`.
- Add decisions with durable tradeoffs under `adr/`.
