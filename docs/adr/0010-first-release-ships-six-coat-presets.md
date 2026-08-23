---
status: accepted
---

# ADR-0010: First public release ships six coat presets, not ten

The first public release of **喵星来信** ships exactly six reviewed **毛色预设**:
gray-and-white tabby, orange tabby, solid black, solid white, calico, and
black-and-white tuxedo. Brown tabby, solid gray, tortoiseshell, and colorpoint
remain product-scope appearances under the memorial-appearance direction of
ADR-0005, but move to post-release work and may not enter the first-release
asset profile. This supersedes the ten-preset first-release requirement set by
ADR-0005 and ADR-0006.

- **Date:** 2026-08-23
- **Status:** Accepted

## Considered Options

- **Ship all ten presets** (ADR-0006 stance): maximizes recognition coverage at
  first release, but requires one hundred preset-action combinations to be
  reviewed, four additional rights-chain groups to be cleared, and four more
  appearances to reach release-grade art before anything ships.
- **Ship six presets** (chosen): the four deterministic ordinary derivatives
  (solid black, solid white, calico, black-and-white tuxedo) inherit the locked
  gray-white motion master and reduce new review volume to sixty combinations;
  orange tabby already has an approved production brief. The remaining four
  presets defer to post-release, keeping the first release quality- and
  rights-gated without holding the whole launch hostage to their completion.
- **Ship fewer than six**: under-delivers on the recognition promise the
  memorial experience needs and would force the internal orange preview or an
  untested derivative into the release, which the pragmatic derivative policy
  does not permit.

## Consequences

- The release review matrix shrinks from one hundred to sixty combinations
  (six presets × ten actions); Issue #32 and Issue #33 now reference the
  six-preset profile.
- Issues #28 (brown tabby), #29 (solid gray), #30 (tortoiseshell), and #31
  (colorpoint) are annotated as post-release scope, not first-release
  blockers.
- The derivative policy still governs the four deterministic derivatives: they
  may ship only if per-combination human review passes and their rights rows
  are complete; any failing preset receives independent production art instead.
- The spec, status ledger, and README consistently describe the six-preset
  first-release boundary; ADR-0005's ten-preset product direction remains the
  post-release target rather than a first-release commitment.
