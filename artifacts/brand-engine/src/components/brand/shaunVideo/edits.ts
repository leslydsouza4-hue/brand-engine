// Pure helpers for the Shaun video editor. Every timestamp is in SOURCE seconds.

export interface TimedText { text: string; start: number; end: number }
export interface Range { start: number; end: number }
export interface BlurBox extends Range { x: number; y: number; width: number; height: number }
export type VideoFormat = "vertical" | "horizontal";
export type ExportQuality = "fast" | "standard";
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
  /** Export resolution. Absent (older sessions) means standard 1080p; fast renders 720p. */
  exportQuality?: ExportQuality;
  /** Vertical split layout: normalized ORIGINAL source bounds for each panel. */
  split?: SplitLayout;
  /** Optional source-time layout scenes. Absent on older sessions: the whole video uses `split`. */
  scenes?: Scene[];
}

export type SceneMode = "speaker" | "split";
/** One layout interval in SOURCE seconds. Speaker mode fills the full 1080x1920 frame with split.speaker. */
export interface Scene extends Range { mode: SceneMode; split: SplitLayout }
export const MAX_BLURS = 64;
export const MAX_SCENES = 32;

export interface ActiveLayout { mode: SceneMode; split: SplitLayout; sceneIndex: number | null }
/** Layout at source time t: matching scene, otherwise the base split. */
export function layoutAt(e: Pick<VideoEdits, "split" | "scenes">, t: number): ActiveLayout | null {
  const scenes = e.scenes ?? [];
  const i = scenes.findIndex(s => t >= s.start && t < s.end);
  if (i >= 0) return { mode: scenes[i].mode, split: scenes[i].split, sceneIndex: i };
  return e.split ? { mode: "split", split: e.split, sceneIndex: null } : null;
}

/** Map a normalized point inside a crop back to full-source normalized coordinates. */
export function cropToSource(box: Rect, crop: Rect): Rect {
  const x = round3(crop.x + box.x * crop.width), y = round3(crop.y + box.y * crop.height);
  return {
    x, y,
    width: round3(Math.min(1-x,box.width * crop.width)), height: round3(Math.min(1-y,box.height * crop.height)),
  };
}
export function sourceToCrop(box: Rect, crop: Rect): Rect {
  return { x: (box.x - crop.x) / crop.width, y: (box.y - crop.y) / crop.height, width: box.width / crop.width, height: box.height / crop.height };
}

export interface Rect { x: number; y: number; width: number; height: number }
export interface Pan { x: number; y: number }
/** screenPan/speakerPan: destination offsets in -1..1 of output width / half height, applied after fit + scale. */
export interface SplitLayout { speaker: Rect; screen: Rect; speakerScale?: number; screenScale?: number; screenPan?: Pan; speakerPan?: Pan; speakerShape?: "circle" | "rectangle"; speakerAutoFramed?: boolean; speakerHead?: Rect }

/** Keep in sync with the renderer's speakerFramingPan. Explicit drags win. */
export function speakerFramingPan(crop: Rect, head: Rect | undefined, sourceWidth: number, sourceHeight: number,
  panelWidth: number, panelHeight: number, zoom: number, pan?: Pan): Pan {
  if (pan && (pan.x !== 0 || pan.y !== 0)) return pan;
  const sw = crop.width * sourceWidth, sh = crop.height * sourceHeight;
  const k = Math.max(panelWidth / sw, panelHeight / sh) * zoom;
  const w = sw * k, h = sh * k;
  const mx = Math.abs(w - panelWidth) / 2, my = Math.abs(h - panelHeight) / 2;
  const limit = (n: number, max: number) => Math.max(-max, Math.min(max, n));
  if (!head || head.x < crop.x || head.y < crop.y ||
      head.x + head.width > crop.x + crop.width || head.y + head.height > crop.y + crop.height)
    return { x: 0, y: Math.max(0, h - panelHeight) * 0.375 / panelHeight };
  const headCentre = ((head.x + head.width / 2 - crop.x) / crop.width) * w + (panelWidth - w) / 2;
  const headTop = ((head.y - crop.y) / crop.height) * h + (panelHeight - h) / 2;
  return { x: limit(panelWidth / 2 - headCentre, mx) / panelWidth,
    y: limit(panelHeight * 0.07 - headTop, my) / panelHeight };
}

export function screenWithoutWebcam(s:SplitLayout):Rect {
 const a=s.screen,b=s.speaker,r=a.x+a.width,d=a.y+a.height;
 if(b.x>=r || b.y>=d || b.x+b.width<=a.x || b.y+b.height<=a.y)return a;
 const l=Math.max(a.x,b.x-0.005),t=Math.max(a.y,b.y-0.005),br=Math.min(r,b.x+b.width+0.005),bb=Math.min(d,b.y+b.height+0.005);
 return [{x:a.x,y:a.y,width:a.width,height:t-a.y},{x:br,y:a.y,width:r-br,height:a.height},{x:a.x,y:bb,width:a.width,height:d-bb},{x:a.x,y:a.y,width:l-a.x,height:a.height}].filter(v=>v.width>=0.02&&v.height>=0.02).sort((x,y)=>y.width*y.height-x.width*x.height)[0]??a;
}

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
  groupedUncertainWords?: number;
}

export const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function defaultEdits(duration: number): VideoEdits {
  return { trimStart: 0, trimEnd: round3(duration), cuts: [], blurs: [], words: [], format: "vertical", framing: "blur-fill", exportQuality: "fast" };
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
  if (e.blurs.length > MAX_BLURS) errors.push(`At most ${MAX_BLURS} blur regions can be exported.`);
  if ((e.scenes?.length ?? 0) > MAX_SCENES) errors.push(`At most ${MAX_SCENES} layout scenes are supported.`);
  (e.scenes ?? []).forEach((sc, i) => {
    if (!(sc.end > sc.start)) errors.push(`Scene ${i + 1} must end after it starts.`);
    if (!validRect(sc.split.speaker)) errors.push(`Scene ${i + 1} speaker bounds are outside the source frame.`);
    if (sc.mode === "split" && !validRect(sc.split.screen)) errors.push(`Scene ${i + 1} screen bounds are outside the source frame.`);
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
  return { ...e,
    blurs: e.blurs.map(b => ({ x: round3(b.x), y: round3(b.y), width: round3(b.width), height: round3(b.height), start: round3(b.start), end: round3(b.end) })),
    ...(e.scenes?.length ? { scenes: e.scenes.map(sc => ({ start: round3(sc.start), end: round3(sc.end), mode: sc.mode, split: sc.split })) } : { scenes: undefined }),
    captionTiming: t?.timing ?? "word", exportQuality: e.exportQuality ?? "standard", trimStart: round3(e.trimStart), trimEnd: round3(e.trimEnd), words: words.map(w => ({ text: w.text.trim(), start: round3(w.start), end: round3(w.end) })).filter(w => w.text) };
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

export type FitMode = "contain" | "cover";
/** Both panels keep the full selected crop visible (contain), including speaker-only scenes. */
export const PANEL_FIT: Record<"screen" | "speaker", FitMode> = { screen: "cover", speaker: "cover" };

/** Fill a rectangular panel from the inner camera area, not the circle's bounding square.
 * Legacy near-square webcam bounds are treated as circular until redetected. */
export function speakerAutoScale(sw:number,sh:number,pw:number,ph:number,shape?:SplitLayout["speakerShape"]) {
  const aspect=sw/sh;
  if(shape==="rectangle" || (!shape && (aspect<0.85 || aspect>1.15))) return 1;
  const ratio=(pw/ph)/aspect;
  return Math.sqrt(1+Math.min(ratio,1/ratio)**2)*1.04;
}
/** Vertical split: screen occupies the top 30% of the frame, speaker the bottom 70%. Must match the renderer. */
export const SPLIT_TOP = 0.3;

/** Largest allowed offset (px) on one axis: keeps a smaller image inside, a larger image covering. */
export const maxPanOffset = (rendered: number, panel: number) => Math.abs(rendered - panel) / 2;

export interface Placement { dx: number; dy: number; dw: number; dh: number; offsetX: number; offsetY: number }
/**
 * Where the FULL selected source crop (sw x sh px) lands inside a panel (pw x ph), relative to the panel's top-left.
 * base = contain/cover scale, then user scale, then pan (normalized of panel size) clamped to +/- maxPanOffset.
 * The caller clips to the panel. Render (FFmpeg) must use the same math.
 */
export function panelPlacement(sw: number, sh: number, pw: number, ph: number, mode: FitMode, scale = 1, pan?: Pan): Placement {
  const base = mode === "cover" ? Math.max(pw / sw, ph / sh) : Math.min(pw / sw, ph / sh);
  const k = base * (scale > 0 && Number.isFinite(scale) ? scale : 1);
  const dw = sw * k, dh = sh * k;
  const mx = maxPanOffset(dw, pw), my = maxPanOffset(dh, ph);
  const offsetX = clamp((pan?.x ?? 0) * pw, -mx, mx), offsetY = clamp((pan?.y ?? 0) * ph, -my, my);
  return { dx: (pw - dw) / 2 + offsetX, dy: (ph - dh) / 2 + offsetY, dw, dh, offsetX, offsetY };
}

/** Normalized pan limits for a placement, so stored pan never drifts beyond what is visible. */
export function panLimits(sw: number, sh: number, pw: number, ph: number, mode: FitMode, scale = 1): Pan {
  const p = panelPlacement(sw, sh, pw, ph, mode, scale);
  return { x: pw > 0 ? maxPanOffset(p.dw, pw) / pw : 0, y: ph > 0 ? maxPanOffset(p.dh, ph) / ph : 0 };
}
