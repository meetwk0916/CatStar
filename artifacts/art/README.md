# Art Artifacts

This directory contains generated or review-oriented art material. It is kept
outside `docs/` so documentation remains lightweight and navigable.

## Layout

```text
candidates/
  active/      Current production inputs and retained working/reference packages
  archive/     Rejected or retired review-history packages
production-briefs/
  <name>/      Approved art direction, delivery contract, and intake checklist
runtime-motion-review/
  <dated-name>/ Continuous desktop/mobile motion evidence and decisions
runtime-review/
  YYYY-MM-DD/  Browser screenshots captured by the runtime review script
sources/       Generated source and concept images
```

Current runtime provenance is documented in
[`../../docs/art/runtime-map.md`](../../docs/art/runtime-map.md). Runtime assets
consumed by the application remain under `public/assets/scenes/window-room/`.

Do not wire an archived candidate back into runtime without updating the runtime
map and completing a new visual review.

Production briefs define work that has been approved for external or manual art
production. They are not runtime provenance and do not imply that the described
source, rights, or review evidence has been received.
