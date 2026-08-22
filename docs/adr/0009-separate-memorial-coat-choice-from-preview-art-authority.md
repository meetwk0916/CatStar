---
status: accepted
---

# ADR-0009: Separate memorial coat choice from preview art authority

The passport keeps `ORANGE_TABBY` as the user's bounded **毛色预设** choice, but
the current independent big-ginger pixels are classified as an **内部外形预览**,
not the release implementation of that preset. CatStar records runtime art
authority separately from persisted memorial data: internal builds may expose
the preview for real-room evaluation, while release validation must reject it
until Issue #23 supplies rights-cleared art that preserves the rounded
short-haired prototype contract and passes the complete review matrix. This
avoids breaking existing local passports or pretending that a promising visual
experiment has crossed the production gate.

## Considered Options

- Reclassifying `ORANGE_TABBY` as a new persisted prototype would contradict
  Issue #23 and conflate body shape with remembered coat.
- Silently exempting orange from the shared-alpha gate would erase the release
  boundary and allow preview pixels to appear production-ready.

## Consequences

- Prototype and release asset profiles intentionally enforce different alpha
  contracts for the declared preview.
- The registration UI identifies the current orange rendering as an internal
  preview without changing the stored passport schema.
- Replacing the preview with accepted production art changes its authority,
  not the user's memorial coat choice.
