---
name: Closed-loop RDP / contour simplification
description: Why appending the start point to RDP-simplify a closed polygon collapses it to one node, and the correct split-at-two-extremes approach.
---

# Simplifying a closed contour (RDP) without collapsing it

When simplifying a **closed** polyline with Ramer–Douglas–Peucker, do NOT just
append the first point to the end and run the open-segment RDP on it.

**Why:** open RDP anchors on `points[0]` and `points[last]`. For a closed loop
those two anchors are the *same coordinate* (`a == b`), so the perpendicular
distance of every interior point to the degenerate `a→b` line evaluates to 0.
RDP then thinks the whole loop is flat and returns just `[a, b]` → after dropping
the duplicate you get a **single node**, regardless of the epsilon tolerance.
This silently breaks any "trace an outline" feature (outline never renders).

**How to apply:** split the loop into two open arcs at two well-separated *real*
vertices, simplify each arc independently, then stitch:
1. pick `i0` = vertex farthest from the centroid,
2. pick `i1` = vertex farthest from `i0`,
3. RDP the arc `i0→i1` and the arc `i1→i0` (wrapping), drop the shared
   endpoints, concat.

Verify with a synthetic disk: a correct implementation returns ~16–32 nodes
(scaling with epsilon), a broken one returns 1.
