# ADR-0001: Use local memorial data for Phase 0

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

CatStar handles sensitive memorial information for one deceased cat. Phase 0
needs to preserve a passport and letter-reading progress, but introducing
accounts, uploads, or cross-device synchronization would expand both privacy risk
and implementation scope.

## Decision

Keep the passport and letter-reading progress on the user's current device.
Store no memorial data in an account, cloud service, or remote database during
Phase 0.

## Consequences

- Memorial information remains private to the current device.
- The first memorial experience stays small and direct.
- Losing browser storage or changing devices can lose the passport and reading progress.
- Cross-device continuity, backup, and recovery require a separate future decision.
