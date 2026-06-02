// Geometry helpers for the Highly Cutout tool.
// Pipeline: image alpha mask -> distance-transform dilation (rounded offset) ->
// largest connected blob -> Moore-neighbor boundary trace -> Chaikin smooth ->
// Ramer-Douglas-Peucker simplify -> sparse, draggable nodes.
// The final on-screen / PDF path is rendered as a closed Catmull-Rom spline so
// there are never sharp edges.

export interface Pt {
  x: number;
  y: number;
}

export interface CutResult {
  // Nodes in ORIGINAL image-pixel coordinates.
  nodes: Pt[];
  imgW: number;
  imgH: number;
}

const INF = 1e9;

/** Build a foreground mask from an image's alpha channel at a working resolution. */
function buildMask(
  img: HTMLImageElement,
  maxDim: number
): { mask: Uint8Array; w: number; h: number; scale: number } {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const mask = new Uint8Array(w * h);
  let hasAlpha = false;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] < 250) {
      hasAlpha = true;
      break;
    }
  }

  if (hasAlpha) {
    for (let i = 0; i < w * h; i++) {
      mask[i] = data[i * 4 + 3] > 32 ? 1 : 0;
    }
  } else {
    // No transparency: treat near-white (sampled from corners) as background.
    const corners = [0, (w - 1), (h - 1) * w, h * w - 1];
    let br = 0,
      bg = 0,
      bb = 0;
    for (const ci of corners) {
      br += data[ci * 4];
      bg += data[ci * 4 + 1];
      bb += data[ci * 4 + 2];
    }
    br /= corners.length;
    bg /= corners.length;
    bb /= corners.length;
    for (let i = 0; i < w * h; i++) {
      const dr = data[i * 4] - br;
      const dg = data[i * 4 + 1] - bg;
      const db = data[i * 4 + 2] - bb;
      mask[i] = dr * dr + dg * dg + db * db > 900 ? 1 : 0; // ~30 per channel
    }
  }

  return { mask, w, h, scale };
}

/** Two-pass chamfer distance transform: distance from each cell to nearest foreground. */
function distanceTransform(mask: Uint8Array, w: number, h: number): Float32Array {
  const dist = new Float32Array(w * h);
  const A = 1;
  const B = Math.SQRT2;
  for (let i = 0; i < w * h; i++) dist[i] = mask[i] ? 0 : INF;

  const at = (x: number, y: number) => dist[y * w + x];
  // Forward
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x > 0) d = Math.min(d, at(x - 1, y) + A);
      if (y > 0) d = Math.min(d, at(x, y - 1) + A);
      if (x > 0 && y > 0) d = Math.min(d, at(x - 1, y - 1) + B);
      if (x < w - 1 && y > 0) d = Math.min(d, at(x + 1, y - 1) + B);
      dist[i] = d;
    }
  }
  // Backward
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x < w - 1) d = Math.min(d, at(x + 1, y) + A);
      if (y < h - 1) d = Math.min(d, at(x, y + 1) + A);
      if (x < w - 1 && y < h - 1) d = Math.min(d, at(x + 1, y + 1) + B);
      if (x > 0 && y < h - 1) d = Math.min(d, at(x - 1, y + 1) + B);
      dist[i] = d;
    }
  }
  return dist;
}

/** Keep only the largest 8-connected blob in a binary mask. */
function largestBlob(mask: Uint8Array, w: number, h: number): Uint8Array {
  const labels = new Int32Array(w * h).fill(-1);
  const out = new Uint8Array(w * h);
  const stack: number[] = [];
  let bestLabel = -1;
  let bestSize = 0;
  let label = 0;

  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || labels[s] !== -1) continue;
    let size = 0;
    stack.length = 0;
    stack.push(s);
    labels[s] = label;
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (mask[ni] && labels[ni] === -1) {
            labels[ni] = label;
            stack.push(ni);
          }
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestLabel = label;
    }
    label++;
  }

  if (bestLabel >= 0) {
    for (let i = 0; i < w * h; i++) out[i] = labels[i] === bestLabel ? 1 : 0;
  }
  return out;
}

/** Moore-neighbor boundary tracing of the outer contour of a single blob. */
function traceBoundary(mask: Uint8Array, w: number, h: number): Pt[] {
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  let start: Pt | null = null;
  for (let y = 0; y < h && !start; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === 1) {
        start = { x, y };
        break;
      }
    }
  }
  if (!start) return [];

  // Clockwise neighborhood offsets.
  const cw = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ];

  const contour: Pt[] = [];
  let p = { ...start };
  let b = { x: start.x - 1, y: start.y }; // entered from the west
  const startP = { ...p };
  const startB = { ...b };
  contour.push({ ...p });

  const maxIter = w * h * 8;
  for (let iter = 0; iter < maxIter; iter++) {
    let idx = cw.findIndex((d) => d[0] === b.x - p.x && d[1] === b.y - p.y);
    if (idx < 0) idx = 0;
    let found: Pt | null = null;
    let prevBg = { ...b };
    for (let k = 1; k <= 8; k++) {
      const d = cw[(idx + k) % 8];
      const c = { x: p.x + d[0], y: p.y + d[1] };
      if (inside(c.x, c.y)) {
        found = c;
        const pd = cw[(idx + k - 1) % 8];
        prevBg = { x: p.x + pd[0], y: p.y + pd[1] };
        break;
      }
    }
    if (!found) break; // isolated pixel
    b = prevBg;
    p = found;
    if (p.x === startP.x && p.y === startP.y && b.x === startB.x && b.y === startB.y) break;
    contour.push({ ...p });
  }
  return contour;
}

/** Chaikin corner-cutting smoothing for a closed polyline. */
function chaikin(points: Pt[], iterations: number): Pt[] {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const out: Pt[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % n];
      out.push({ x: a.x * 0.75 + c.x * 0.25, y: a.y * 0.75 + c.y * 0.25 });
      out.push({ x: a.x * 0.25 + c.x * 0.75, y: a.y * 0.25 + c.y * 0.75 });
    }
    pts = out;
  }
  return pts;
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

/** Ramer-Douglas-Peucker simplification (open segment helper). */
function rdpSegment(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points.slice();
  let maxD = 0;
  let idx = 0;
  const a = points[0];
  const b = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], a, b);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > epsilon) {
    const left = rdpSegment(points.slice(0, idx + 1), epsilon);
    const right = rdpSegment(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}

/**
 * RDP for a closed loop. We can't just append the start point and run open RDP:
 * the first/last anchors would be identical, every perpendicular distance would
 * be 0, and the whole loop would collapse to a single node. Instead we split the
 * loop at two well-separated real vertices (farthest from the centroid, then
 * farthest from that) and simplify each arc independently.
 */
function simplifyClosed(points: Pt[], epsilon: number): Pt[] {
  const n = points.length;
  if (n < 4) return points.slice();

  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;

  let i0 = 0;
  let best = -1;
  for (let i = 0; i < n; i++) {
    const d = (points[i].x - cx) ** 2 + (points[i].y - cy) ** 2;
    if (d > best) {
      best = d;
      i0 = i;
    }
  }
  let i1 = 0;
  best = -1;
  for (let i = 0; i < n; i++) {
    const d = (points[i].x - points[i0].x) ** 2 + (points[i].y - points[i0].y) ** 2;
    if (d > best) {
      best = d;
      i1 = i;
    }
  }
  if (i0 === i1) return points.slice();

  const arc = (from: number, to: number): Pt[] => {
    const out: Pt[] = [];
    let i = from;
    while (true) {
      out.push(points[i]);
      if (i === to) break;
      i = (i + 1) % n;
    }
    return out;
  };

  const s1 = rdpSegment(arc(i0, i1), epsilon);
  const s2 = rdpSegment(arc(i1, i0), epsilon);
  // Each arc shares an endpoint with the other; drop the duplicates.
  return s1.slice(0, -1).concat(s2.slice(0, -1));
}

export interface CutOptions {
  /** Border distance as a fraction of the longest working-resolution dimension. */
  offsetFrac?: number;
  /** Simplify tolerance as a fraction of the longest working-resolution dimension. */
  detailFrac?: number;
  /** Working resolution cap (max image dimension used for analysis). */
  maxDim?: number;
  /** Chaikin smoothing passes (fewer = sharper concave notches). */
  smooth?: number;
}

/** Compute a smooth, draggable cut contour for an image. */
export function computeCutContour(img: HTMLImageElement, opts: CutOptions = {}): CutResult {
  // Trace at a high working resolution so the outline hugs the artwork faithfully.
  const maxDim = opts.maxDim ?? 1000;
  const offsetFrac = Math.max(0, opts.offsetFrac ?? 0.01);
  const detailFrac = opts.detailFrac ?? 0.0022;
  const smooth = opts.smooth ?? 1;

  const { mask, w, h, scale } = buildMask(img, maxDim);

  // Border distance and simplify tolerance scale with the working resolution so
  // the result looks the same regardless of the source image's pixel size.
  const maxWD = Math.max(w, h);
  const offset = Math.max(1, offsetFrac * maxWD);

  // Pad so the dilated outline near the edges stays fully inside the grid.
  const pad = Math.ceil(offset) + 3;
  const pw = w + pad * 2;
  const ph = h + pad * 2;
  const padded = new Uint8Array(pw * ph);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) padded[(y + pad) * pw + (x + pad)] = 1;
    }
  }

  // Rounded outward offset via distance transform threshold.
  const dist = distanceTransform(padded, pw, ph);
  const dilated = new Uint8Array(pw * ph);
  for (let i = 0; i < pw * ph; i++) dilated[i] = dist[i] <= offset ? 1 : 0;

  const blob = largestBlob(dilated, pw, ph);
  let contour = traceBoundary(blob, pw, ph);
  if (contour.length < 8) return { nodes: [], imgW: img.naturalWidth, imgH: img.naturalHeight };

  // Smooth then simplify to a manageable set of draggable nodes.
  contour = chaikin(contour, smooth);
  const epsilon = Math.max(0.6, detailFrac * maxWD);
  let nodes = simplifyClosed(contour, epsilon);

  // Convert back to original image-pixel coordinates (remove padding + undo scale).
  const inv = 1 / scale;
  nodes = nodes.map((p) => ({
    x: (p.x - pad) * inv,
    y: (p.y - pad) * inv,
  }));

  return { nodes, imgW: img.naturalWidth, imgH: img.naturalHeight };
}

/** Closed Catmull-Rom spline -> SVG path string (smooth, no sharp edges). */
export function nodesToSvgPath(nodes: Pt[]): string {
  const n = nodes.length;
  if (n < 3) return "";
  const p = (i: number) => nodes[((i % n) + n) % n];
  let d = `M ${p(0).x.toFixed(2)} ${p(0).y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

/** Closed Catmull-Rom spline -> relative bezier segments for jsPDF `lines()`. */
export function nodesToPdfBezier(nodes: Pt[]): {
  start: Pt;
  segments: number[][];
} {
  const n = nodes.length;
  const p = (i: number) => nodes[((i % n) + n) % n];
  const segments: number[][] = [];
  let cur = { x: p(0).x, y: p(0).y };
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    // jsPDF expects control/end points relative to the current pen position.
    segments.push([
      c1x - cur.x,
      c1y - cur.y,
      c2x - cur.x,
      c2y - cur.y,
      p2.x - cur.x,
      p2.y - cur.y,
    ]);
    cur = { x: p2.x, y: p2.y };
  }
  return { start: { x: p(0).x, y: p(0).y }, segments };
}

/** Insert a node on the segment nearest to a click point (image-px coords). */
export function insertNodeNear(nodes: Pt[], pt: Pt): Pt[] {
  const n = nodes.length;
  if (n < 2) return nodes;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    const b = nodes[(i + 1) % n];
    const d = perpDist(pt, a, b);
    // Only consider segments the point projects onto.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2;
    if (t < -0.1 || t > 1.1) continue;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const out = nodes.slice();
  out.splice(best + 1, 0, { ...pt });
  return out;
}
