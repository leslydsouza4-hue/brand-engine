# Memory Index

- [Rising visual direction](rising-visual-direction.md) — expanded composition approved; keep energetic background and calm navy cards for readability.

- [Closed-loop RDP](closed-loop-rdp.md) — appending start point to RDP-simplify a closed contour collapses it to 1 node; split at two extreme vertices instead.
- [rAF throttled in preview iframe](raf-throttled-in-preview-iframe.md) — requestAnimationFrame can never fire in the proxied preview; use setTimeout to defer work / reset processing flags.
- [html-to-image font fallback](html-to-image-font-fallback.md) — exports lose fonts because Google Fonts are cross-origin; self-host woff2 + pass explicit fontEmbedCSS.
- [Integration libs run from src](gemini-lib-runtime-from-src.md) — lib/integrations-*-ai are bundled from src by esbuild; lib edits work at runtime despite pre-existing TS6305/lib-build errors — don't rebuild dist.
- [toPng image preload](toPng-image-preload.md) — toPng can capture blank/half-loaded images; await every <img> decode before rasterizing.
- [Async run-token hand-off](async-run-token-handoff.md) — parent async op + awaited sub-op sharing a stale-run token: make ONE token at top, pass it down; don't let the sub-op bump its own.
- [Summer canvas type scaling](summer-canvas-type-scaling.md) — scale all text off ONE shared typeRef; per-element px floors break proportions across formats.
