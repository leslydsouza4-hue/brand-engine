# Memory Index

- [Closed-loop RDP](closed-loop-rdp.md) — appending start point to RDP-simplify a closed contour collapses it to 1 node; split at two extreme vertices instead.
- [rAF throttled in preview iframe](raf-throttled-in-preview-iframe.md) — requestAnimationFrame can never fire in the proxied preview; use setTimeout to defer work / reset processing flags.
- [html-to-image font fallback](html-to-image-font-fallback.md) — exports lose fonts because Google Fonts are cross-origin; self-host woff2 + pass explicit fontEmbedCSS.
- [toPng image preload](toPng-image-preload.md) — toPng can capture blank/half-loaded images; await every <img> decode before rasterizing.
