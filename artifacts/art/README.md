# Art Artifacts

This directory contains generated or review-oriented art material. It is kept
outside `docs/` so documentation remains lightweight and navigable.

## Layout

```text
candidates/
  active/      Current candidate source packages referenced by the runtime map
  archive/     Retired or research-only candidate packages
runtime-review/
  YYYY-MM-DD/  Browser screenshots captured by the runtime review script
sources/       Generated source and concept images
```

Current runtime provenance is documented in
[`../../docs/art/runtime-map.md`](../../docs/art/runtime-map.md). Runtime assets
consumed by the application remain under `public/assets/scenes/window-room/`.

Do not wire an archived candidate back into runtime without updating the runtime
map and completing a new visual review.
