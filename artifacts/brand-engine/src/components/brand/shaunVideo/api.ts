// Client for /api/shaun-video (see ../shaun-video-api-contract.md). Base-path aware.
import type { TimedText, VideoEdits, CaptionTiming, SplitLayout, Scene, Rect, BlurBox } from "./edits";
import { readDownloadBody } from "./downloadBody";

export const SHAUN_VIDEO_API = `${import.meta.env.BASE_URL}api/shaun-video`;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export class ShaunVideoError extends Error {
  constructor(message: string, public status = 0, public code?: string) { super(message); this.name = "ShaunVideoError"; }
}

export interface VideoMeta {
  videoId: string; name: string; status: "ready" | "uploading";
  probe?: Record<string, unknown>; assetUrl: string; createdAt: string;
}
export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export interface Job<R = unknown> {
  jobId: string; kind: string; status: JobStatus; progress: number; phase?: string; videoId?: string;
  error?: string; result?: R; createdAt: string; updatedAt: string;
}
export interface OutputResult { assetUrl: string; contentType: string }
export interface TranscriptResult {
  text: string; words: TimedText[]; segments: TimedText[]; timing: CaptionTiming;
  timestampMethod?: string; model?: string; language?: string; duration?: number; omittedUncertainWords?: number; groupedUncertainWords?: number;
}
export interface Capabilities {
  maxUploadBytes: number; maxDuration: number; formats: string[]; wordTimestamps: boolean; segmentTimestamps: boolean;
  transcriptionModel: string; timestampMethod: string; transcriptionLanguage: string; transcriptionNote?: string;
}

async function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SHAUN_VIDEO_API}${path}`, {
      method, credentials: "include", signal, cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ShaunVideoError("Network error. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string; code?: string } | null;
    const fallback = res.status === 401 ? "Sign in to use video tools." : res.status === 429 ? "Two video jobs are already running. Wait for one to finish." :
      [502, 503, 504].includes(res.status) ? "The video server is temporarily unavailable or restarting. Wait a moment, then try again." : `Request failed (${res.status})`;
    throw new ShaunVideoError(data?.error || fallback, res.status, data?.code);
  }
  return res.json() as Promise<T>;
}

/** Live NDJSON job streams (see startJob on the server). Keeping the start request open
 * is what gives Replit Autoscale CPU for the work, so pollJob reads these first. */
interface LiveJob { job?: Job<unknown>; ended: boolean; wake: Set<() => void> }
const liveJobs = new Map<string, LiveJob>();
async function requestJob<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T | { jobId: string }> {
  let res: Response;
  try {
    res = await fetch(`${SHAUN_VIDEO_API}${path}`, {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Shaun-Stream": "1" }, body: JSON.stringify(body),
    });
  } catch { throw new ShaunVideoError("Network error. Check your connection and try again."); }
  if (signal?.aborted) { void res.body?.cancel().catch(() => undefined); throw new DOMException("Aborted", "AbortError"); }
  if (!res.ok || !(res.headers.get("content-type") || "").includes("ndjson") || !res.body) {
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string; code?: string } | null;
      const fallback = res.status === 429 ? "Two video jobs are already running. Wait for one to finish." :
        [502, 503, 504].includes(res.status) ? "The video server is temporarily unavailable or restarting. Wait a moment, then try again." : `Request failed (${res.status})`;
      throw new ShaunVideoError(data?.error || fallback, res.status, data?.code);
    }
    return res.json() as Promise<T>;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "", jobId: string | undefined;
  const lines = async function* () {
    for (;;) {
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) { const line = buffer.slice(0, nl); buffer = buffer.slice(nl + 1); if (line.trim()) yield JSON.parse(line) as { jobId?: string; job?: Job<unknown> }; }
      const { value, done } = await reader.read();
      if (done) return;
      buffer += value;
    }
  }();
  for await (const line of lines) if (line.jobId) { jobId = line.jobId; break; }
  if (!jobId) throw new ShaunVideoError("The video server closed the job before it started. Please retry.");
  const live: LiveJob = { ended: false, wake: new Set() };
  liveJobs.set(jobId, live);
  const notify = () => { for (const w of live.wake) w(); live.wake.clear(); };
  void (async () => {
    try { for await (const line of lines) if (line.job) { live.job = line.job; notify(); } }
    catch { /* stream dropped: pollJob falls back to GET */ }
    finally { live.ended = true; notify(); setTimeout(() => liveJobs.delete(jobId!), 60_000); }
  })();
  return { jobId };
}
const terminal = (job?: Job<unknown>) => job?.status === "succeeded" || job?.status === "failed";

export const getCapabilities = (signal?: AbortSignal) => request<Capabilities>("/capabilities", "GET", undefined, signal);
export const getVideo = (id: string, signal?: AbortSignal) => request<VideoMeta>(`/videos/${encodeURIComponent(id)}`, "GET", undefined, signal);
export const startImport = (url: string, refresh = false) => requestJob<{ jobId: string }>("/imports", refresh ? { url, refresh: true } : { url }) as Promise<{ jobId: string }>;
export const startTranscribe = (id: string) => requestJob<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/transcribe`, {}) as Promise<{ jobId: string }>;
export const startRender = (id: string, edits: VideoEdits) => requestJob<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/render`, edits) as Promise<{ jobId: string }>;
export const startFrame = (id: string, time: number) => requestJob<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/frames`, { time }) as Promise<{ jobId: string }>;
export interface LayoutResult { split: SplitLayout; scenes: Scene[]; note?: string; trim?: { start: number; end: number } }
export interface PrivacyRequest { start: number; end: number; target: "screen" | "speaker"; crop: Rect }
export interface PrivacyResult { blurs: BlurBox[]; note: string; sampledFrames: number }
/** Sampled AI detection of personal details. Results are suggestions only; blurs are in full SOURCE coords. */
export async function requestPrivacy(id: string, body: PrivacyRequest, signal: AbortSignal, onProgress?: (p: number, phase?: string) => void): Promise<PrivacyResult> {
  const first = await requestJob<Partial<PrivacyResult> & { jobId?: string }>(`/videos/${encodeURIComponent(id)}/privacy`, body, signal) as Partial<PrivacyResult> & { jobId?: string };
  const r = Array.isArray(first.blurs) ? first : first.jobId ? await pollJob<Partial<PrivacyResult>>(first.jobId, (p, _s, phase) => onProgress?.(p, phase), signal) : null;
  if (!r) throw new ShaunVideoError("Privacy detection returned no result.");
  return { blurs: Array.isArray(r?.blurs) ? r.blurs : [], note: r?.note ?? "", sampledFrames: r?.sampledFrames ?? 0 };
}
/** Whole-video automatic scan of the screen panel. 200 with a cached result or a streamed job. */
export async function requestPrivacyAuto(id: string, body: { split: SplitLayout; scenes?: Scene[] }, signal: AbortSignal, onProgress?: (p: number, phase?: string) => void): Promise<PrivacyResult> {
  const first = await requestJob<Partial<PrivacyResult> & { jobId?: string }>(`/videos/${encodeURIComponent(id)}/privacy-auto`, body, signal) as Partial<PrivacyResult> & { jobId?: string };
  const r = Array.isArray(first.blurs) ? first : first.jobId ? await pollJob<Partial<PrivacyResult>>(first.jobId, (p, _s, phase) => onProgress?.(p, phase), signal) : null;
  if (!r) throw new ShaunVideoError("Personal-details scan returned no result.");
  return { blurs: Array.isArray(r.blurs) ? r.blurs : [], note: r.note ?? "", sampledFrames: r.sampledFrames ?? 0 };
}
/** Locate speaker + screen panels. Server caches per source; may answer 200 directly or 202 with a job. */
export async function requestLayout(id: string, signal: AbortSignal, onProgress?: (p: number, phase?: string) => void): Promise<LayoutResult> {
  const r = await requestJob<{ jobId?: string } & Partial<LayoutResult>>(`/videos/${encodeURIComponent(id)}/layout`, {}, signal) as { jobId?: string } & Partial<LayoutResult>;
  const out = r.split ? r : r.jobId ? await pollJob<Partial<LayoutResult>>(r.jobId, (p, _s, phase) => onProgress?.(p, phase), signal) : null;
  if (!out?.split) throw new ShaunVideoError("Layout detection returned no result.");
  const trim = out.trim && Number.isFinite(out.trim.start) && Number.isFinite(out.trim.end) && out.trim.end > out.trim.start ? out.trim : undefined;
  return { split: out.split, scenes: Array.isArray(out.scenes) ? out.scenes : [], note: out.note, trim };
}
export const getJob = <R,>(jobId: string, signal?: AbortSignal) => request<Job<R>>(`/jobs/${encodeURIComponent(jobId)}`, "GET", undefined, signal);
export const jobAssetUrl = (jobId: string) => `${SHAUN_VIDEO_API}/jobs/${encodeURIComponent(jobId)}/asset`;
export const videoAssetUrl = (videoId: string) => `${SHAUN_VIDEO_API}/videos/${encodeURIComponent(videoId)}/asset`;
export async function preparePreview(videoId: string, signal: AbortSignal): Promise<string> {
  for (;;) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const result = await requestJob<{ jobId?: string; assetUrl?: string }>(`/videos/${encodeURIComponent(videoId)}/preview`, {}, signal) as { jobId?: string; assetUrl?: string };
      if (result.jobId) await pollJob(result.jobId, () => undefined, signal);
      return `${SHAUN_VIDEO_API}/videos/${encodeURIComponent(videoId)}/preview`;
    } catch (error) {
      if (!(error instanceof ShaunVideoError) || error.status !== 429) throw error;
      await sleep(3000, signal);
    }
  }
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
  const abort = () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); };
  const t = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
  signal?.addEventListener("abort", abort, { once: true });
});

/** Polls every ~1.5s until terminal. Aborting stops watching only; the server job keeps running. */
export async function pollJob<R>(jobId: string, onProgress: (p: number, status: JobStatus, phase?: string) => void, signal?: AbortSignal): Promise<R> {
  for (;;) {
    const live = liveJobs.get(jobId);
    if (live && !live.ended && !terminal(live.job)) {
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const t = setTimeout(done, 15_000);
        function done() { clearTimeout(t); live!.wake.delete(done); signal?.removeEventListener("abort", abort); resolve(); }
        function abort() { done(); reject(new DOMException("Aborted", "AbortError")); }
        live!.wake.add(done); signal?.addEventListener("abort", abort, { once: true });
      });
      if (live.job) onProgress(Number.isFinite(live.job.progress) ? live.job.progress : 0, live.job.status, live.job.phase);
      if (!terminal(live.job)) continue;
    }
    const job = (live && terminal(live.job) ? live.job : await getJob<R>(jobId, signal)) as Job<R>;
    onProgress(Number.isFinite(job.progress) ? job.progress : 0, job.status, job.phase);
    if (job.status === "succeeded") {
      if (job.result === undefined) throw new ShaunVideoError("Job finished without a result.");
      return job.result;
    }
    if (job.status === "failed") throw new ShaunVideoError(job.error || "Job failed.", 0, "JOB_FAILED");
    if (!Number.isFinite(Date.parse(job.updatedAt)) || Date.now() - Date.parse(job.updatedAt) > 3 * 60_000)
      throw new ShaunVideoError("The server stopped responding during processing. Your video and edits are safe. Please retry.", 0, "JOB_INTERRUPTED");
    await sleep(1500, signal);
  }
}

/** Direct upload: request slot, PUT original bytes with progress, then complete (server probes). */
export async function uploadVideo(file: File, onProgress: (p: number) => void, signal: AbortSignal): Promise<VideoMeta> {
  const contentType = file.type || (file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "");
  if (!ACCEPTED_VIDEO_TYPES.includes(contentType)) throw new ShaunVideoError("Use an MP4 or MOV file.");
  if (file.size > MAX_VIDEO_BYTES) throw new ShaunVideoError("Videos must be 250 MB or smaller.");
  const { videoId, uploadURL } = await request<{ videoId: string; uploadURL: string }>("/uploads", "POST", { name: file.name, size: file.size, contentType }, signal);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadURL);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ShaunVideoError(`Upload failed (${xhr.status})`, xhr.status));
    xhr.onerror = () => reject(new ShaunVideoError("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
  return request<VideoMeta>(`/videos/${encodeURIComponent(videoId)}/complete`, "POST", {}, signal);
}

/** Authenticated fetch of a finished render as a verified MP4 blob. */
/** Fast path: fetch the MP4 directly from storage with a short-lived signed link,
 * bypassing the API server. Returns null on any failure so callers fall back. */
async function fetchJobMp4Direct(jobId: string, signal?: AbortSignal, maxBytes?: number,
  onProgress?: (loaded: number, total?: number) => void): Promise<Blob | null> {
  try {
    const link = await fetch(`${SHAUN_VIDEO_API}/jobs/${encodeURIComponent(jobId)}/download-url`, { credentials: "include", cache: "no-store", signal });
    if (!link.ok) return null;
    const { url } = await link.json() as { url?: string };
    if (!url || !/^https:\/\//.test(url)) return null;
    const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-store", signal });
    if (!res.ok || !(res.headers.get("content-type") || "").toLowerCase().startsWith("video/mp4")) return null;
    return await readDownloadBody(res, { signal, maxBytes, onProgress });
  } catch (err) {
    if (isAbort(err) && signal?.aborted) throw err;
    if (err instanceof ShaunVideoError && err.status === 413) throw err;
    return null;
  }
}

export async function fetchJobMp4(jobId: string, signal?: AbortSignal, maxBytes?: number,
  onProgress?: (loaded: number, total?: number) => void): Promise<Blob> {
  const direct = await fetchJobMp4Direct(jobId, signal, maxBytes, onProgress);
  if (direct) return direct;
  let res: Response;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort(); else signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 60_000);
  try { res = await fetch(jobAssetUrl(jobId), { credentials: "include", cache: "no-store", signal: controller.signal }); }
  catch (err) {
    if (timedOut) throw new ShaunVideoError("The download did not start. Retry Download MP4; your finished video will be reused.");
    if (isAbort(err)) throw err;
    throw new ShaunVideoError("Download failed. Check your connection and try again.");
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  if (!res.ok) {
    const msg = res.status === 401 ? "Your session expired. Sign in again, then retry." : res.status === 404 ? "This render is no longer available. Render again." : `Download failed (${res.status}).`;
    throw new ShaunVideoError(msg, res.status);
  }
  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (!type.startsWith("video/mp4")) throw new ShaunVideoError("The server did not return an MP4. Sign in again or render again.");
  return readDownloadBody(res, { signal, maxBytes, onProgress });
}

/** Saves an already-fetched blob locally. The blob URL is revoked shortly after. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener"; a.style.display = "none";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Authenticated download of a finished render. */
export async function downloadJobAsset(jobId: string, filename: string, signal?: AbortSignal): Promise<void> {
  saveBlob(await fetchJobMp4(jobId, signal), filename);
}

export async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new ShaunVideoError(`Could not load frame (${res.status})`, res.status);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new ShaunVideoError("Could not read frame."));
    r.readAsDataURL(blob);
  });
}

/** Defensive read of probe metadata whose exact shape belongs to the render helper. */
export function probeInfo(probe: Record<string, unknown> | undefined): { duration?: number; width?: number; height?: number } {
  if (!probe) return {};
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined; };
  const format = probe.format as Record<string, unknown> | undefined;
  const streams = (probe.streams as Record<string, unknown>[] | undefined) ?? [];
  const v = streams.find(s => s.codec_type === "video") ?? (probe.video as Record<string, unknown> | undefined);
  return {
    duration: num(probe.duration) ?? num(format?.duration),
    width: num(probe.width) ?? num(v?.width),
    height: num(probe.height) ?? num(v?.height),
  };
}

export const isAbort = (err: unknown) => (err as Error)?.name === "AbortError";
