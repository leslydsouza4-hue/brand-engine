import { execFile } from "node:child_process";
import { setPriority } from "node:os";

type Rect = { x: number; y: number; width: number; height: number };
const MW = 480; // motion-analysis width (px)

/** Grey frames t, t+0.2, t+0.4 s. */
async function burst(input: string, time: number, mh: number): Promise<Uint8Array[]> {
  const buf = await new Promise<Buffer>((resolve, reject) => { const child = execFile("ffmpeg",
    ["-v", "error", "-ss", String(time), "-i", input, "-vf", `fps=5,scale=${MW}:${mh},format=gray`,
      "-frames:v", "3", "-f", "rawvideo", "pipe:1"],
    { encoding: "buffer", maxBuffer: 64 * 1024 * 1024, timeout: 30_000 },
    (error, stdout) => error ? reject(error) : resolve(stdout));
    if (child.pid) try { setPriority(child.pid, 10); } catch { /* keep default */ } });
  const size = MW * mh, frames: Uint8Array[] = [];
  for (let i = 0; i + size <= buf.length; i += size) frames.push(buf.subarray(i, i + size));
  return frames;
}

/**
 * Pixels where the live presenter moves. Screen recordings are pixel-static between
 * nearby frames (static blocks compress to identical pixels); a webcam never is.
 * A pixel counts when it changes in at least `minShare` of the sampled bursts, so
 * occasional slide/page changes in the UI do not register.
 */
export async function presenterMotion(input: string, times: number[], sourceWidth: number, sourceHeight: number, minShare = 0.34) {
  const mh = Math.max(2, Math.round(MW * sourceHeight / sourceWidth / 2) * 2);
  const count = new Uint16Array(MW * mh);
  let used = 0;
  for (const time of times) {
    const frames = await burst(input, time, mh).catch(() => [] as Uint8Array[]);
    if (frames.length < 2) continue;
    const moved = new Uint8Array(MW * mh);
    let changed = 0;
    for (let f = 1; f < frames.length; f++)
      for (let p = 0; p < moved.length; p++) if (Math.abs(frames[f][p] - frames[f - 1][p]) > 6) moved[p] = 1;
    for (let p = 0; p < moved.length; p++) changed += moved[p];
    if (changed > moved.length * 0.5) continue; // full-frame transition: no information
    for (let p = 0; p < moved.length; p++) count[p] += moved[p];
    used++;
  }
  const need = Math.max(1, Math.ceil(used * minShare));
  const mask = new Uint8Array(MW * mh);
  // Keep dense motion only (3x3 majority) to drop isolated cursor/compression specks.
  for (let y = 1; y < mh - 1; y++) for (let x = 1; x < MW - 1; x++) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (count[(y + dy) * MW + x + dx] >= need) n++;
    if (n >= 5) mask[y * MW + x] = 1;
  }
  return { mask, width: MW, height: mh, samples: used };
}
export type MotionMap = Awaited<ReturnType<typeof presenterMotion>>;

/** Bounds of persistent presenter motion inside `region` (normalized), or null. */
export function motionBlob(m: MotionMap, region: Rect): { body: Rect; head: Rect } | null {
  const x0 = Math.max(0, Math.floor(region.x * m.width)), x1 = Math.min(m.width - 1, Math.ceil((region.x + region.width) * m.width));
  const y0 = Math.max(0, Math.floor(region.y * m.height)), y1 = Math.min(m.height - 1, Math.ceil((region.y + region.height) * m.height));
  const cols = new Array<number>(m.width).fill(0), rows = new Array<number>(m.height).fill(0);
  let total = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m.mask[y * m.width + x]) { cols[x]++; rows[y]++; total++; }
  if (total < 40) return null;
  // Trim 2% tails so stray pixels do not stretch the bounds.
  const span = (arr: number[], a: number, b: number) => {
    let lo = a, hi = b, acc = 0;
    while (lo < b && (acc += arr[lo]) < total * 0.02) lo++;
    acc = 0;
    while (hi > a && (acc += arr[hi]) < total * 0.02) hi--;
    return [lo, hi + 1];
  };
  const [bx0, bx1] = span(cols, x0, x1), [by0, by1] = span(rows, y0, y1);
  if (bx1 - bx0 < 4 || by1 - by0 < 4) return null;
  // Head: motion in the top part of the body, measured on its own columns.
  const headBottom = by0 + Math.min(by1 - by0, Math.round((bx1 - bx0) * 0.9));
  const hc = new Array<number>(m.width).fill(0);
  let ht = 0;
  for (let y = by0; y < headBottom; y++) for (let x = bx0; x < bx1; x++) if (m.mask[y * m.width + x]) { hc[x]++; ht++; }
  let hx0 = bx0, hx1 = bx1 - 1, acc = 0;
  while (hx0 < hx1 && (acc += hc[hx0]) < ht * 0.05) hx0++;
  acc = 0;
  while (hx1 > hx0 && (acc += hc[hx1]) < ht * 0.05) hx1--;
  const n = (x: number, y: number, w: number, h: number) => ({ x: x / m.width, y: y / m.height, width: w / m.width, height: h / m.height });
  return { body: n(bx0, by0, bx1 - bx0, by1 - by0), head: n(hx0, by0, hx1 + 1 - hx0, headBottom - by0) };
}

/**
 * Vision models localize a small webcam bubble only approximately (it was observed
 * shifted up onto the product UI). Move the model's camera box, keeping its size,
 * so the measured presenter sits inside it with headroom; replace the head box with
 * the measured one. Full-frame cameras are left alone by the caller.
 */
export function snapSpeakerToMotion(speaker: Rect, m: MotionMap): { speaker: Rect; head: Rect } | null {
  const rx = Math.max(0, speaker.x - speaker.width), ry = Math.max(0, speaker.y - speaker.height);
  const blob = motionBlob(m, { x: rx, y: ry,
    width: Math.min(1, speaker.x + speaker.width * 2) - rx, height: Math.min(1, speaker.y + speaker.height * 2) - ry });
  if (!blob) return null;
  const { body, head } = blob;
  const width = Math.min(1, Math.max(speaker.width, body.width)), height = Math.min(1, Math.max(speaker.height, head.height * 1.6));
  // Centre on the head horizontally; put the head top ~12% below the box top.
  const x = Math.max(0, Math.min(1 - width, head.x + head.width / 2 - width / 2));
  const y = Math.max(0, Math.min(1 - height, head.y - height * 0.12));
  return { speaker: { x, y, width, height }, head };
}
