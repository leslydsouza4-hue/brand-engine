---
name: Summer canvas type scaling
description: How font/CTA sizing stays proportionally consistent across Summer of AI formats.
---

# Summer of AI canvas type scaling

All text/CTA sizes in `SummerCanvas.tsx` `CanvasInner` must scale off a SINGLE shared reference (`typeRef`) so proportions stay identical when the user switches formats.

**Rule:** derive every element's size from `typeRef * <ratio>` (headline 0.085, subtext 0.03, cta 0.04, cta padding 0.024/0.044). Keep per-element `Math.max(...)` floors LOW enough that they never activate for real formats (smallest is the 300×250 display ad → typeRef ≈ 274).

`typeRef` is aspect-ratio aware: landscape (`w/h ≥ 1.15`) uses the area geometric mean `√(w·h)`; square/portrait/story use the short side `minDim`.

**Why:** the original floors were per-element and tuned for the tiny 600px email canvases (headline 22 / subtext 12 / cta 14 / padding 12,20). On a small ad the subtext + CTA floors activated while the headline floor did NOT, so elements stopped scaling together and the hierarchy visibly broke (subtext/CTA looked oversized vs the headline) — the user called the result "odd" every time they changed format.

**How to apply:** if you add a new text element or a new small format, do NOT introduce a per-element px floor that can trip on small canvases. Scale from `typeRef`. If tiny formats need a readability minimum, raise/clamp `typeRef` itself (scales everything together) rather than flooring one element.
