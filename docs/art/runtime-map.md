# Product Cat Actions Runtime Map

Last updated: 2026-07-29

This file maps runtime cat sheets to their reviewed source candidates. Runtime
paths follow:

Rights and distribution status are tracked separately in
[`rights-and-provenance.md`](rights-and-provenance.md); current generated
assets remain internal-prototype-only while that evidence is incomplete.

```text
public/assets/scenes/window-room/cat/{coat-preset}/{action}.png
```

The six coat preset directories are `gray-white-tabby`, `orange-tabby`,
`solid-black`, `solid-white`, `calico`, and `tuxedo`.

## Motion Master

| Runtime action | Current source | Status |
| --- | --- | --- |
| `idle`, `sit` | `artifacts/art/candidates/active/product-cat-quality-slice-v10/` | Four-frame calm seated loop; shared intentionally so long pauses read as resting rather than waiting. |
| `walk` | `artifacts/art/candidates/active/product-cat-quality-slice-v10/` | Eight-frame grounded slow cat-step loop. |
| `interact` | `artifacts/art/candidates/active/product-cat-quality-slice-v10/` | Six-frame attentive blink and head response. |
| `groom` | `artifacts/art/candidates/active/product-cat-quality-slice-v10/` | Eight-frame paw and face grooming loop. |
| `stretch` | `artifacts/art/candidates/active/product-cat-quality-slice-v10/` | Six-frame stand, bow, stretch, and recover action. |
| `eat` | `artifacts/art/candidates/active/product-cat-actions-v3/` | Six-frame bowl-aligned sniff/eat source; runtime loops the light head-lower frames. |
| `lie` | `artifacts/art/candidates/active/product-cat-actions-v4/` | Four-frame awake rest for the cat bed and blanket. |
| `jump` | `artifacts/art/candidates/active/product-cat-actions-v5/` | Five generated key poses plus one held settle frame to satisfy the six-frame runtime contract. |
| `sleep` | `artifacts/art/candidates/active/product-cat-actions-v8/` | Four-frame deep curled sleeping loop. |

The reviewed gray-white tabby is the motion master. The other five coat
presets are deterministic working derivatives built by
`scripts/build_cat_coat_presets.py`; their shared alpha, anchors, anatomy, and
timing prevent coat choice from changing behavior.

## Runtime Behavior Notes

- `lie` and `sleep` are separate: `lie` is awake companionship on rest
  surfaces, while `sleep` is deeper sleep and is not eligible during the first
  30 seconds of a session.
- The companion planner weights ordinary room intents by temperament, avoids
  the two most recent intents, lightly considers current zone and local hour,
  and keeps every action reachable for every temperament.
- Touch always produces a visible response. Companion whisper text is
  intentionally occasional rather than guaranteed.
- `approach-user` reuses `walk` and `interact`; it does not alert, demand, or
  wait for acknowledgement.
- Regenerate runtime evidence with `npm run review:runtime`.

Current accepted browser evidence lives under
`artifacts/art/runtime-review/2026-07-29/` and contains nine validated
screenshots covering default movement, the five room targets, grooming,
stretching, deep sleep, and active approach.
The accompanying `manifest.json` binds the screenshots to the exact runtime
input fingerprint; `npm run review:runtime:check` fails after those inputs
change.

## Candidate Retention

- Active motion sources: v3, v4, v5, v8, and quality-slice v10.
- Active coat derivation evidence: `cat-coat-presets-v1`.
- Retired review-history candidates remain under `artifacts/art/candidates/`
  for trace history and must not be wired back into runtime without review.
