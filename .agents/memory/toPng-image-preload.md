---
name: toPng image preload
description: html-to-image toPng can capture blank/half-loaded images unless every <img> is decoded first.
---

# Preload images before html-to-image toPng

When rasterizing a node with html-to-image (`toPng`/`toJpeg`), exporting immediately
after setting/generating an image background can intermittently produce a blank or
half-loaded image — `toPng` snapshots whatever is decoded at that instant.

**Rule:** before calling `toPng`, await every `<img>` inside the export node:
resolve immediately if `img.complete && img.naturalWidth > 0`, else wait on a
one-shot `load`/`error` listener.

**Why:** the export node often mounts hidden at full size and its background `<img>`
(a large data URL) may still be decoding when the user clicks export right after
generation/selection. No decode-wait = race = blank backgrounds.

**How to apply:** wrap the capture in a `waitForImages(node)` helper (see Summer of
AI `SummerOfAiWorkspace.tsx`). This is separate from the font-embed issue — fonts
need explicit `fontEmbedCSS`, images need a decode-wait.
