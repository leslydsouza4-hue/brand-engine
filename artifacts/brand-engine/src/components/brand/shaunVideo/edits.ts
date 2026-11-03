// Pure helpers for the Shaun video editor. Every timestamp is in SOURCE seconds.

export interface TimedText { text: string; start: number; end: number }
export interface Range { start: number; end: number }
export interface BlurBox extends Range { x: number; y: number; width: number; height: number }
export type VideoFormat = "vertical" | "horizontal";
export type VideoFraming = "fit" | "blur-fill";

export interface VideoEdits {
  trimStart: number;
  trimEnd: number;
  cuts: Range[];
  blurs: BlurBox[];
  words: TimedText[];
  format: VideoFormat;
  framing: VideoFraming;
  /** Optional on the wire; renderEdits always sends it explicitly. */
  captionTiming?: CaptionTiming;
  captionBottom?: number;
  /** Vertical split layout: normalized ORIGINAL source bounds for each panel. */
  split?: SplitLayout;
}

export interface Rect { x: number; y: number; width: number; height: number }
export interface SplitLayout { speaker: Rect; screen: Rect; speakerScale?: number; screenScale?: number }

export function validRect(r: Rect | undefined): boolean {
  return !!r && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.width >= 0.02 && r.height >= 0.02 && r.x >= 0 && r.y >= 0 && r.x <= 0.99 && r.y <= 0.99 && r.x + r.width <= 1.000001 && r.y + r.height <= 1.000001;
}

/** Destination rect for drawing a source crop (px) into a box, contain or cover. Returns src+dst. */
export function fitCrop(sw: number, sh: number, dw: number, dh: number, mode: "contain" | "cover") {
  const sa = sw / sh, da = dw / dh;
  if (mode === "contain") {
    const w = sa > da ? dw : dh * sa, h = sa > da ? dw / sa : dh;
    return { sx: 0, sy: 0, sw, sh, dx: (dw - w) / 2, dy: (dh - h) / 2, dw: w, dh: h };
  }
  const cw = sa > da ? sh * da : sw, ch = sa > da ? sh : sw / da;
  return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch, dx: 0, dy: 0, dw, dh };
}

export type CaptionTiming = "word" | "segment";

export interface TranscriptState {
  timing: CaptionTiming;
  text: string;
  /** Segment-level captions. Edited directly when timing === "segment". */
  segments: TimedText[];
  model?: string;
  timestampMethod?: string;
  language?: string;
  omittedUncertainWords?: number;
}

export const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function defaultEdits(duration: number): VideoEdits {
  return { trimStart: 0, trimEnd: round3(duration), cuts: [], blurs: [], words: [], format: "vertical", framing: "blur-fill" };
}

export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.filter(r => r.end > r.start).map(r => ({ ...r })).sort((a, b) => a.start - b.start);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push(r);
  }
  return out;
}

/** Source ranges that survive trim + cuts, in order. */
export function keptRanges(e: Pick<VideoEdits, "trimStart" | "trimEnd" | "cuts">): Range[] {
  const cuts = mergeRanges(e.cuts.map(c => ({ start: Math.max(c.start, e.trimStart), end: Math.min(c.end, e.trimEnd) })));
  const out: Range[] = [];
  let cursor = e.trimStart;
  for (const c of cuts) {
    if (c.start > cursor) out.push({ start: cursor, end: c.start });
    cursor = Math.max(cursor, c.end);
  }
  if (e.trimEnd > cursor) out.push({ start: cursor, end: e.trimEnd });
  return out;
}

export function outputDuration(e: Pick<VideoEdits, "trimStart" | "trimEnd" | "cuts">): number {
  return keptRanges(e).reduce((s, r) => s + (r.end - r.start), 0);
}

/** Where playback at source time t should actually be. Returns null when past the end. */
export function nextPlayableTime(e: Pick<VideoEdits, "trimStart" | "trimEnd" | "cuts">, t: number): number | null {
  for (const r of keptRanges(e)) {
    if (t < r.start) return r.start;
    if (t >= r.start && t < r.end - 0.02) return t;
  }
  return null;
}

export function validateEdits(e: VideoEdits, duration: number): string[] {
  const errors: string[] = [];
  if (!(e.trimStart >= 0)) errors.push("Start must be 0s or later.");
  if (duration > 0 && e.trimEnd > duration + 0.05) errors.push("End is past the end of the source video.");
  if (!(e.trimEnd > e.trimStart)) errors.push("End must be after start.");
  e.cuts.forEach((c, i) => { if (!(c.end > c.start)) errors.push(`Cut ${i + 1} must end after it starts.`); });
  e.blurs.forEach((b, i) => {
    if (!(b.end > b.start)) errors.push(`Blur ${i + 1} must end after it starts.`);
    if (b.width <= 0 || b.height <= 0 || b.x < 0 || b.y < 0 || b.x + b.width > 1.0001 || b.y + b.height > 1.0001) errors.push(`Blur ${i + 1} is outside the frame.`);
  });
  e.words.forEach((w, i) => { if (!(w.end >= w.start)) errors.push(`Caption ${i + 1} ends before it starts.`); });
  if (e.format === "vertical") {
    if (!e.split) errors.push("Vertical export needs the speaker and screen panels located first.");
    else {
      if (!validRect(e.split.screen)) errors.push("Screen panel bounds are outside the source frame.");
      if (!validRect(e.split.speaker)) errors.push("Speaker panel bounds are outside the source frame.");
    }
  }
  if (outputDuration(e) < 0.5) errors.push("Edited video must be at least half a second long.");
  return errors;
}

/*
 * Caption grouping. The FFmpeg render must use the same rule so the preview matches:
 * a line holds at most 4 words / 26 characters, and breaks after sentence punctuation
 * (. ? !) or when the gap to the next word exceeds 0.7s. Words removed by trim or cuts
 * are skipped.
 */
export const CAPTION_RULES = { maxWords: 4, maxChars: 26, maxGap: 0.7 } as const;

export function groupCaptionLines(words: TimedText[]): TimedText[][] {
  const lines: TimedText[][] = [];
  let line: TimedText[] = [];
  const chars = (l: TimedText[]) => l.map(w => w.text).join(" ").length;
  words.forEach((w, i) => {
    if (!w.text.trim()) return;
    line.push(w);
    const next = words[i + 1];
    const breakHere = !next
      || line.length >= CAPTION_RULES.maxWords
      || /[.?!]$/.test(w.text.trim())
      || next.start - w.end > CAPTION_RULES.maxGap
      || chars([...line, next]) > CAPTION_RULES.maxChars;
    if (breakHere) { lines.push(line); line = []; }
  });
  if (line.length) lines.push(line);
  return lines;
}

export interface ActiveCaption { words: TimedText[]; activeIndex: number }

export function captionAt(units: TimedText[], t: number, timing: CaptionTiming, edits: Pick<VideoEdits, "trimStart" | "trimEnd" | "cuts">): ActiveCaption | null {
  const kept = keptRanges(edits);
  const inKept = (x: TimedText) => kept.some(r => x.end > r.start && x.start < r.end);
  const visible = units.filter(inKept);
  if (timing === "segment") {
    const seg = visible.find(s => t >= s.start && t < s.end);
    return seg ? { words: [seg], activeIndex: -1 } : null;
  }
  for (const line of groupCaptionLines(visible)) {
    const start = line[0].start, end = line[line.length - 1].end;
    if (t >= start && t < end + 0.15) {
      const activeIndex = line.findIndex(w => t >= w.start && t < w.end);
      return { words: line, activeIndex };
    }
  }
  return null;
}

export function fmtTime(s: number): string {
  if (!Number.isFinite(s)) return "0:00.0";
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec.toFixed(1)}`;
}

export function editsKey(e: VideoEdits, timing: CaptionTiming, segments: TimedText[]): string {
  return JSON.stringify({ e, timing, segments: timing === "segment" ? segments : undefined });
}

/** Captions sent to the renderer: real words, or whole segments when only segment timing exists. */
export function renderEdits(e: VideoEdits, t: TranscriptState | null): VideoEdits {
  const words = t?.timing === "segment" ? t.segments : e.words;
  return { ...e, captionTiming: t?.timing ?? "word", trimStart: round3(e.trimStart), trimEnd: round3(e.trimEnd), words: words.map(w => ({ text: w.text.trim(), start: round3(w.start), end: round3(w.end) })).filter(w => w.text) };
}

export interface Point { x: number; y: number }

/** Client pixel position to normalized source coordinates within the displayed media rect. */
export function normalizedPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Point {
  if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0 };
  return { x: clamp((clientX - rect.left) / rect.width, 0, 1), y: clamp((clientY - rect.top) / rect.height, 0, 1) };
}

/** Box from two drag corners, in any direction. Null when too small to be intentional. */
export function boxFromDrag(a: Point, b: Point, minSize = 0.01): Pick<BlurBox, "x" | "y" | "width" | "height"> | null {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const width = Math.abs(b.x - a.x), height = Math.abs(b.y - a.y);
  if (width < minSize || height < minSize) return null;
  return { x: round3(x), y: round3(y), width: round3(Math.min(width, 1 - x)), height: round3(Math.min(height, 1 - y)) };
}
