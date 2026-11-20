import { spawn } from "node:child_process";
import { mkdtemp, rm, stat, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { z } from "zod";
import { excludeWebcam } from "./shaun-screen-crop";
import { ffmpegProgress } from "./shaun-job-progress";
import { speakerFramingPan } from "./shaun-speaker-framing";
import { captionWordBoxes, roundedCaptionBox } from "./shaun-caption-box";

const seconds = z.number().finite().min(0).max(600);
export const cropBoxSchema = z.object({
  x: z.number().finite().min(0).max(0.99), y: z.number().finite().min(0).max(0.99),
  width: z.number().finite().min(0.02).max(1), height: z.number().finite().min(0.02).max(1),
}).strict().refine(b => b.x + b.width <= 1.000001 && b.y + b.height <= 1.000001, "Crop extends beyond source");
export const splitSchema = z.object({ speaker: cropBoxSchema, screen: cropBoxSchema,
  speakerShape: z.enum(["circle","rectangle"]).optional(),
  speakerAutoFramed: z.boolean().optional(),
  speakerHead: cropBoxSchema.optional(),
  screenScale: z.number().finite().min(0.5).max(2).optional(),
  speakerScale: z.number().finite().min(0.5).max(2).optional(),
  screenPan: z.object({ x: z.number().min(-1).max(1), y: z.number().min(-1).max(1) }).strict().optional(),
  speakerPan: z.object({ x: z.number().min(-1).max(1), y: z.number().min(-1).max(1) }).strict().optional(),
}).strict();
const range = z.object({ start: seconds, end: seconds }).strict().refine(v => v.end > v.start, "End must follow start");
export const sceneSchema = z.object({ start: seconds, end: seconds, mode: z.enum(["speaker", "split"]), split: splitSchema }).strict().refine(v => v.end > v.start);
export const videoEditsSchema = z.object({
  trimStart: seconds,
  trimEnd: seconds,
  cuts: z.array(range).max(32),
  blurs: z.array(z.object({
    start: seconds, end: seconds,
    x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1),
    width: z.number().finite().min(0.01).max(1), height: z.number().finite().min(0.01).max(1),
  }).strict().refine(v => v.end > v.start && v.x + v.width <= 1.000001 && v.y + v.height <= 1.000001, "Invalid blur region")).max(64),
  words: z.array(z.object({
    text: z.string().trim().min(1).max(500).refine(v => !/[\u0000-\u001f\u007f]/.test(v), "Caption contains control characters"),
    start: seconds, end: seconds,
  }).strict().refine(v => v.end > v.start, "Word end must follow start")).max(3000),
  format: z.enum(["vertical", "horizontal"]),
  exportQuality: z.enum(["fast","standard"]).optional(),
  framing: z.enum(["fit", "blur-fill"]),
  captionTiming: z.enum(["word", "segment"]).optional(),
  captionBottom: z.number().finite().min(0.02).max(0.22).optional(),
  split: splitSchema.optional(),
  scenes: z.array(sceneSchema).max(32).optional(),
}).strict().refine(v => v.trimEnd > v.trimStart, "Trim end must follow start");
export type VideoEdits = z.infer<typeof videoEditsSchema>;
export type VideoProbe = { duration: number; width: number; height: number; hasAudio: boolean };
type Segment = { start: number; end: number; offset: number };
const MAX_BYTES = 500 * 1024 * 1024;
const RENDER_TIMEOUT = 12 * 60 * 1000;

/** No shell and no remote input protocols. Callers provide their own private local paths.
 * Each subprocess has bounded output, wall time and thread usage. */
async function run(command: string, args: string[], timeout: number, onLine?: (line: string) => void, onStderr?: (text: string) => void) {
  return new Promise<string>((fulfil, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "", stderr = "", pending = "", settled = false;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeout);
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else fulfil(stdout);
    };
    child.on("error", error => finish(Object.assign(new Error(`${command} unavailable`), {
      code: "MEDIA_TOOL_UNAVAILABLE", tool: command, systemCode: (error as NodeJS.ErrnoException).code,
    })));
    child.stdout.on("data", (data: Buffer) => {
      stdout = (stdout + data.toString()).slice(-256_000);
      if (onLine) {
        pending += data.toString();
        const lines = pending.split("\n"); pending = lines.pop()!.slice(-8192);
        for (const line of lines) onLine(line);
      }
    });
    child.stderr.on("data", (data: Buffer) => { stderr = (stderr + data.toString()).slice(-12000); onStderr?.(stderr); });
    child.on("close", code => {
      if (timedOut) return finish(Object.assign(new Error(`${command} exceeded its processing time limit`), { code: "MEDIA_TOOL_TIMEOUT", tool: command }));
      if (code !== 0) return finish(Object.assign(new Error(`${command} failed: ${stderr.slice(-3000) || `exit ${code}`}`), { code: "MEDIA_TOOL_FAILED", tool: command, exitCode: code }));
      finish();
    });
  });
}

/** Fail startup before a publish is declared healthy without required video tools. */
export async function verifyVideoRuntime() {
  await run("ffprobe", ["-version"], 10000);
  const filters = await run("ffmpeg", ["-hide_banner", "-filters"], 10000);
  for (const filter of ["ass", "scale", "boxblur", "drawbox"]) {
    if (!new RegExp(`^\\s*\\S+\\s+${filter}\\s`, "m").test(filters))
      throw new Error(`Video runtime is missing the ${filter} filter. Install ffmpeg-full.`);
  }
}

async function localInput(path: string) {
  const file = resolve(path);
  const info = await stat(file);
  if (!info.isFile() || info.size < 12 || info.size > MAX_BYTES) throw new Error("Video must be a local file between 12 bytes and 500 MB");
  return file;
}
const inputArgs = (path: string) => ["-protocol_whitelist", "file,pipe", "-i", path];
const baseArgs = ["-hide_banner", "-nostdin", "-y", "-threads", "2", "-filter_complex_threads", "1"];

export async function probeVideo(path: string, allowPreview = false): Promise<VideoProbe> {
  const file = await localInput(path);
  const raw = await run("ffprobe", ["-v", "error", "-protocol_whitelist", "file,pipe", "-show_streams", "-show_format", "-of", "json", file], 30_000);
  const data = JSON.parse(raw) as { streams: Array<{ codec_type: string; width?: number; height?: number; duration?: string; disposition?: { attached_pic?: number }; side_data_list?: Array<{ rotation?: number }>; tags?: { rotate?: string } }>; format: { duration?: string; format_name?: string } };
  if (!data.format.format_name?.split(",").some(v => (allowPreview ? ["mov", "mp4", "webm", "matroska"] : ["mov", "mp4"]).includes(v))) throw new Error("Source must be an MP4 video");
  const video = data.streams.find(s => s.codec_type === "video" && !s.disposition?.attached_pic);
  const duration = Number(data.format.duration || video?.duration);
  if (!video?.width || !video.height || !Number.isFinite(duration) || duration <= 0 || duration > 600 ||
      video.width > 4096 || video.height > 4096 || video.width < 16 || video.height < 16)
    throw new Error("Video must be at most 10 minutes and 4096 pixels per edge");
  const rotation = Number(video.side_data_list?.find(v => v.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0);
  const rotated = Math.abs(rotation % 180) === 90;
  return { duration, width: rotated ? video.height : video.width, height: rotated ? video.width : video.height, hasAudio: data.streams.some(s => s.codec_type === "audio") };
}

/** Source-time intervals retained by the edit, with exact continuous output offsets. */
export function retainedSegments(edits: VideoEdits, duration: number): Segment[] {
  const e = videoEditsSchema.parse(edits);
  if (e.trimEnd > duration + 0.001) throw new Error("Trim exceeds source duration");
  if (e.scenes?.some((s, i, all) => s.end > duration + 0.001 || (i > 0 && s.start < all[i - 1].end))) throw new Error("Scene ranges must be ordered, non-overlapping and inside the video");
  if ([...e.cuts, ...e.blurs, ...e.words].some(v => v.end > duration + 0.001)) throw new Error("An edit exceeds source duration");
  for (let i = 1; i < e.words.length; i++) {
    if (e.words[i].start < e.words[i - 1].end - 0.001) throw new Error("Caption words must be chronological and non-overlapping");
  }
  const cuts = e.cuts.map(v => ({ start: Math.max(e.trimStart, v.start), end: Math.min(e.trimEnd, v.end) }))
    .filter(v => v.end > v.start).sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const cut of cuts) {
    const prev = merged.at(-1);
    if (prev && cut.start <= prev.end) prev.end = Math.max(prev.end, cut.end);
    else merged.push({ ...cut });
  }
  const result: Segment[] = [];
  let cursor = e.trimStart, offset = 0;
  for (const cut of [...merged, { start: e.trimEnd, end: e.trimEnd }]) {
    if (cut.start > cursor) {
      result.push({ start: cursor, end: cut.start, offset });
      offset += cut.start - cursor;
    }
    cursor = Math.max(cursor, cut.end);
  }
  if (offset < 0.1) throw new Error("Edits must retain at least 0.1 seconds");
  return result;
}

function assTime(time: number) {
  const cs = Math.round(time * 100);
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
// Never allow user text to introduce ASS override blocks, line breaks or drawing commands.
export function escapeAss(text: string) { return text.replace(/\\/g, "＼").replace(/{/g, "｛").replace(/}/g, "｝").replace(/[\r\n]/g, " "); }

export function makeCaptions(edits: VideoEdits, segments: Segment[], width: number, height: number) {
  const resolutionScale=width/(edits.format==="vertical"?1080:1920);
  const fontSize = (edits.format === "vertical" ? 66.96 : 69.12)*resolutionScale;
  const sideMargin=Math.round(60*resolutionScale);
  const margin = Math.round(height * (edits.format === "vertical" && edits.split ? edits.captionBottom ?? 0.04 : edits.format === "vertical" ? 0.16 : 0.09));
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Poppins,${fontSize},&H00FFFFFF,&H00FFFFFF,&H00121820,&H80000000,-1,0,0,0,100,100,0,0,1,${2*resolutionScale},${3*resolutionScale},2,${sideMargin},${sideMargin},${margin},1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const groups: VideoEdits["words"][] = [];
  const visible = edits.words.filter(w => segments.some(s => w.end > s.start && w.start < s.end));
  // Older SRT imports contain whole cue strings. Never pretend those are timed words.
  const segmentTiming = edits.captionTiming === "segment" || (edits.captionTiming === undefined && visible.some(w => /\s/.test(w.text)));
  let group: VideoEdits["words"] = [];
  for (const [i, word] of visible.entries()) {
    group.push(word);
    const next = visible[i + 1];
    if (segmentTiming || !next || group.length >= 4 || /[.?!]$/.test(word.text.trim()) ||
        next.start - word.end > 0.7 || [...group, next].map(w => w.text).join(" ").length > 26) {
      groups.push(group); group = [];
    }
  }
  const events: string[] = [];
  for (const words of groups) {
    const chars = words.map(w => w.text).join(" ").length;
    const size = Math.min(fontSize, Math.floor((width - 150*resolutionScale) / Math.max(1, chars) / 0.7));
    const boxes = segmentTiming ? [] : captionWordBoxes(words.map(w => w.text), size, width);
    const lineEnd = words.at(-1)!.end + (segmentTiming ? 0 : 0.15);
    const boundaries = [...new Set([words[0].start, ...words.flatMap(w => [w.start, w.end]), lineEnd])].sort((a, b) => a - b);
    for (let i = 0; i < boundaries.length - 1; i++) for (const segment of segments) {
      const start = Math.max(boundaries[i], segment.start), end = Math.min(boundaries[i + 1], segment.end);
      if (end <= start) continue;
      const active = segmentTiming ? -1 : words.findIndex(w => start >= w.start && start < w.end);
      const line = words.map(w => escapeAss(w.text)).join(" ");
      const a = segment.offset + start - segment.start, b = segment.offset + end - segment.start;
      if (Math.round(b * 100) > Math.round(a * 100)) {
        if (active >= 0) {
          const box = boxes[active], pad = 8 * resolutionScale;
          events.push(`Dialogue: 0,${assTime(a)},${assTime(b)},Caption,,0,0,0,,${roundedCaptionBox(
            box.left - pad, height - margin - size * 0.86 - pad, box.width + pad * 2,
            size * 0.74 + pad * 2, 10 * resolutionScale)}`);
        }
        events.push(`Dialogue: 1,${assTime(a)},${assTime(b)},Caption,,0,0,0,,{\\fs${size}}${line}`);
      }
    }
  }
  return header + events.join("\n") + "\n";
}

function filterPath(path: string) {
  // The actual paths here are generated under mkdtemp, not supplied by the user.
  return path.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "'\\''");
}

export async function renderVideo(input: string, output: string, edits: VideoEdits, progress: (value: number) => void = () => {}) {
  const source = await localInput(input);
  const info = await probeVideo(source);
  const e = videoEditsSchema.parse(edits), segments = retainedSegments(e, info.duration);
  const total = segments.reduce((sum, v) => sum + v.end - v.start, 0);
  const shortEdge=e.exportQuality==="fast"?720:1080, longEdge=e.exportQuality==="fast"?1280:1920;
  const width = e.format === "vertical" ? shortEdge : longEdge, height = e.format === "vertical" ? longEdge : shortEdge;
  const dir = await mkdtemp(join(tmpdir(), "shaun-render-"));
  const target = resolve(output);
  if (target === source) { await rm(dir, { recursive: true, force: true }); throw new Error("Output cannot overwrite the original source"); }
  let success = false;
  try {
    // Drop surplus source frames before blurs/crops, not only at the encoder.
    // The delivered video is always 30fps; processing 60fps/4K here wastes work.
    const filters: string[] = [`[0:v:0]setpts=PTS-STARTPTS+${e.trimStart}/TB,fps=30,setsar=1[v0]`];
    let label = "v0";
    for (const [i, blur] of e.blurs.entries()) {
      const x = Math.min(info.width - 2, Math.floor(blur.x * info.width / 2) * 2);
      const y = Math.min(info.height - 2, Math.floor(blur.y * info.height / 2) * 2);
      const w = Math.max(2, Math.min(info.width - x, Math.floor(blur.width * info.width / 2) * 2));
      const h = Math.max(2, Math.min(info.height - y, Math.floor(blur.height * info.height / 2) * 2));
      filters.push(`[${label}]split[base${i}][patch${i}]`,
        `[patch${i}]crop=${w}:${h}:${x}:${y},boxblur=luma_radius=${Math.min(20, Math.floor(Math.min(w, h) / 2))}:luma_power=3:chroma_radius=${Math.min(20, Math.floor(Math.min(w, h) / 4))}:enable='gte(t,${blur.start})*lt(t,${blur.end})'[blur${i}]`,
        `[base${i}][blur${i}]overlay=${x}:${y}:enable='gte(t,${blur.start})*lt(t,${blur.end})'[b${i}]`);
      label = `b${i}`;
    }
    if (info.hasAudio) filters.push(`[0:a:0]asetpts=PTS-STARTPTS+${e.trimStart}/TB,asplit=${segments.length}${segments.map((_, i) => `[a${i}]`).join("")}`);
    for (const [i, segment] of segments.entries()) {
      if (info.hasAudio) filters.push(`[a${i}]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[u${i}]`);
    }
    if (info.hasAudio) filters.push(`${segments.map((_, i) => `[u${i}]`).join("")}concat=n=${segments.length}:v=0:a=1[audio]`);
    const pieces = segments.flatMap(s => {
      const bounds = [...new Set([s.start, ...(e.format === "vertical" ? (e.scenes ?? []).flatMap(v => [v.start, v.end]).filter(t => t > s.start && t < s.end) : []), s.end])].sort((a,b) => a-b);
      return bounds.slice(0,-1).map((start,i) => ({ start, end: bounds[i+1], scene: e.scenes?.find(v => start >= v.start && start < v.end) }));
    });
    // Frame each source-time piece before concatenating. Previously the graph
    // concatenated full-resolution cuts, split that stream again for scenes,
    // and only then scaled it. That retained expensive 4K intermediate frames.
    filters.push(`[${label}]split=${pieces.length}${pieces.map((_,i) => `[piece${i}]`).join("")}`);
    for (const [index, piece] of pieces.entries()) {
    filters.push(`[piece${index}]trim=start=${piece.start}:end=${piece.end},setpts=PTS-STARTPTS[joined${index}]`);
    const begin = filters.length;
    const split = piece.scene?.split ?? e.split;
    if (e.format === "vertical" && split) {
      const frame = (b: z.infer<typeof cropBoxSchema>, mode: "contain"|"cover", scale = 1, pan = {x:0,y:0}, panelHeight = height/2) => {
        const x = Math.floor(b.x * info.width / 2) * 2, y = Math.floor(b.y * info.height / 2) * 2;
        const cw = Math.max(2, Math.min(info.width - x, Math.floor(b.width * info.width / 2) * 2));
        const ch = Math.max(2, Math.min(info.height - y, Math.floor(b.height * info.height / 2) * 2));
        const aspect=cw/ch, relative=(width/panelHeight)/aspect;
        const circular=b===split.speaker && (split.speakerShape==="circle" || (!split.speakerShape && aspect>=0.85 && aspect<=1.15));
        const autoZoom=circular?Math.sqrt(1+Math.min(relative,1/relative)**2)*1.04:1;
        if (circular) scale = Math.max(1, scale);
        const ratio=(mode==="contain"?Math.min:Math.max)(width/cw,panelHeight/ch)*scale*autoZoom;
        const w=Math.max(2,Math.round(cw*ratio/2)*2), h=Math.max(2,Math.round(ch*ratio/2)*2);
        const positioned = b === split.speaker ? speakerFramingPan(b, split.speakerHead, info.width, info.height,
          width, panelHeight, scale * autoZoom, pan, split.speakerShape) : pan;
        const dx=Math.max(-Math.abs(w-width)/2,Math.min(Math.abs(w-width)/2,positioned.x*width));
        const dy=Math.max(-Math.abs(h-panelHeight)/2,Math.min(Math.abs(h-panelHeight)/2,positioned.y*panelHeight));
        const padW=Math.max(w,width)+Math.ceil(Math.abs(dx))*2, padH=Math.max(h,panelHeight)+Math.ceil(Math.abs(dy))*2;
        return `crop=${cw}:${ch}:${x}:${y},scale=${w}:${h},pad=${padW}:${padH}:(ow-iw)/2:(oh-ih)/2:color=0x0b1220,crop=${width}:${panelHeight}:${Math.round((padW-width)/2-dx)}:${Math.round((padH-panelHeight)/2-dy)},setsar=1`;
      };
      const screenHeight=Math.round(height*0.3/2)*2;
      if (piece.scene?.mode === "speaker") filters.push(`[joined]${frame(split.speaker,"cover",split.speakerScale,split.speakerPan,height)}[framed]`);
      else filters.push("[joined]split[screenSource][speakerSource]",
        `[screenSource]${frame(excludeWebcam(split.screen,split.speaker)??split.screen,"cover",split.screenScale,split.screenPan,screenHeight)}[top]`,
        `[speakerSource]${frame(split.speaker,"cover",split.speakerScale,split.speakerPan,height-screenHeight)}[bottom]`,
        "[top][bottom]vstack=inputs=2[framed]");
    } else if (e.framing === "blur-fill") {
      filters.push("[joined]split[front][back]",
        `[back]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=30:2[background]`,
        `[front]scale=${width}:${height}:force_original_aspect_ratio=decrease[foreground]`,
        "[background][foreground]overlay=(W-w)/2:(H-h)/2[framed]");
    } else filters.push(`[joined]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0b1220[framed]`);
    for (let i=begin;i<filters.length;i++) filters[i]=filters[i].replace(/\[([a-zA-Z]+)\]/g, (_, label) => `[${label}${index}]`);
    }
    filters.push(`${pieces.map((_,i)=>`[framed${i}]`).join("")}concat=n=${pieces.length}:v=1:a=0[framed]`);
    if (e.words.length) {
      let fonts = "";
      for (const candidate of ["artifacts/brand-engine/src/assets/fonts", "../brand-engine/src/assets/fonts"]) {
        const path = resolve(candidate);
        if (await access(join(path, "Poppins-700.woff2")).then(() => true, () => false)) { fonts = path; break; }
      }
      if (!fonts) throw new Error("Poppins caption font is missing; render cancelled");
      const captionPath = join(dir, "captions.ass");
      await writeFile(captionPath, makeCaptions(e, segments, width, height));
      filters.push(`[framed]ass=filename='${filterPath(captionPath)}':fontsdir='${filterPath(fonts)}'[captioned]`);
    }
    const graph = join(dir, "filters.txt");
    await writeFile(graph, filters.join(";\n"));
    let poppinsLoaded = false;
    progress(0);
    await run("ffmpeg", [...baseArgs, "-ss", String(e.trimStart), "-t", String(e.trimEnd-e.trimStart), ...inputArgs(source), "-filter_complex_script", graph,
      "-map", e.words.length ? "[captioned]" : "[framed]", ...(info.hasAudio ? ["-map", "[audio]", "-c:a", "aac", "-b:a", "192k"] : ["-an"]),
      "-c:v", "libx264", "-preset", e.exportQuality === "fast" ? "ultrafast" : "superfast", "-crf", "21", "-threads", "2", "-r", "30", "-pix_fmt", "yuv420p",
      "-t", String(total), "-movflags", "+faststart", "-progress", "pipe:1", "-f", "mp4", target], RENDER_TIMEOUT, line => {
      const value = ffmpegProgress(line, total);
      if (value !== undefined) progress(value);
    }, text => { if (/fontselect: \(Poppins, 700, 0\) -> [^\n]*Poppins/i.test(text)) poppinsLoaded = true; });
    if (e.words.some(w => segments.some(s => w.end > s.start && w.start < s.end)) && !poppinsLoaded)
      throw new Error("FFmpeg did not load Poppins Bold for captions; render cancelled");
    const rendered = await probeVideo(target);
    if (rendered.width !== width || rendered.height !== height || rendered.hasAudio !== info.hasAudio || Math.abs(rendered.duration - total) > 0.15)
      throw new Error("Rendered output failed duration, dimensions or audio validation");
    success = true; progress(100);
    return rendered;
  } finally {
    await rm(dir, { recursive: true, force: true });
    if (!success) await rm(target, { force: true });
  }
}

export async function extractFrame(input: string, output: string, time: number) {
  const source = await localInput(input), info = await probeVideo(source);
  if (!Number.isFinite(time) || time < 0 || time >= info.duration) throw new Error("Frame time must be inside source duration");
  const target = resolve(output);
  if (target === source) throw new Error("Output cannot overwrite the original source");
  try {
    await run("ffmpeg", [...baseArgs, ...inputArgs(source), "-ss", String(time), "-frames:v", "1", "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2", "-f", "image2", "-vcodec", "png", target], 60_000);
    if (!(await stat(target)).size) throw new Error("Frame extraction produced an empty image");
  } catch (error) { await rm(target, { force: true }); throw error; }
}

/** Lightweight editing proxy. Never modifies the export source or its timeline. */
export async function createPreview(input: string, output: string) {
  const source = await localInput(input);
  const info = await probeVideo(source);
  const target = resolve(output);
  if (target === source) throw new Error("Preview cannot overwrite source");
  try {
    await run("ffmpeg", [...baseArgs, ...inputArgs(source),
      "-map", "0:v:0", "-map", "0:a:0?", "-vf",
      "fps=24,scale=640:640:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=fast_bilinear,setsar=1",
      "-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8", "-threads", "2",
      "-b:v", "650k", "-pix_fmt", "yuv420p", "-g", "24",
      "-c:a", "libopus", "-b:a", "64k", "-f", "webm", target], RENDER_TIMEOUT);
    const preview = await probeVideo(target, true);
    if (Math.abs(preview.duration - info.duration) > 0.2 || preview.hasAudio !== info.hasAudio)
      throw new Error("Preview timeline validation failed");
  } catch (error) { await rm(target, { force: true }); throw error; }
}

export async function layoutFrame(input: string, output: string, time: number) {
  const source = await localInput(input);
  await run("ffmpeg", [...baseArgs, "-ss", String(time), ...inputArgs(source), "-frames:v", "1",
    "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-q:v", "4", output], 30_000);
}

export async function extractAudio(input: string, output: string, browserPreview = false) {
  const source = await localInput(input), info = await probeVideo(source, browserPreview);
  if (!info.hasAudio) throw new Error("Source has no audio track to transcribe");
  const target = resolve(output);
  if (target === source) throw new Error("Output cannot overwrite the original source");
  try {
    await run("ffmpeg", [...baseArgs, ...inputArgs(source), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "-f", "wav", target], 90_000);
  } catch (error) { await rm(target, { force: true }); throw error; }
}
