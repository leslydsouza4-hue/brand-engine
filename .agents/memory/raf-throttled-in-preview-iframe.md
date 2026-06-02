---
name: requestAnimationFrame throttled in Replit preview iframe
description: rAF callbacks can be throttled/skipped in the proxied preview iframe, leaving deferred work (and "processing" flags) stuck.
---

# Don't rely on requestAnimationFrame to defer work in the preview

In Replit's proxied preview iframe (and any backgrounded/offscreen iframe),
`requestAnimationFrame` callbacks can be heavily throttled or not fire at all.

**Why:** browsers throttle rAF for non-visible/backgrounded frames. A common
symptom: you set a `processing = true` flag, schedule the heavy work + the
`processing = false` reset inside `requestAnimationFrame`, and the callback never
runs — so buttons gated on `!processing` stay disabled forever even though the UI
looks idle.

**How to apply:** for "defer briefly so the spinner can paint" patterns, use
`setTimeout(fn, 0..30)` instead of `requestAnimationFrame`. setTimeout fires
regardless of frame visibility. Reserve rAF for genuine per-frame animation.
