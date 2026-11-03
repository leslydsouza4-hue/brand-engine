// Client for /api/shaun-video (see ../shaun-video-api-contract.md). Base-path aware.
import type { TimedText, VideoEdits, CaptionTiming } from "./edits";

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
  timestampMethod?: string; model?: string; language?: string; duration?: number; omittedUncertainWords?: number;
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
    const fallback = res.status === 401 ? "Sign in to use video tools." : res.status === 429 ? "Two video jobs are already running. Wait for one to finish." : `Request failed (${res.status})`;
    throw new ShaunVideoError(data?.error || fallback, res.status, data?.code);
  }
  return res.json() as Promise<T>;
}

export const getCapabilities = (signal?: AbortSignal) => request<Capabilities>("/capabilities", "GET", undefined, signal);
export const getVideo = (id: string, signal?: AbortSignal) => request<VideoMeta>(`/videos/${encodeURIComponent(id)}`, "GET", undefined, signal);
export const startImport = (url: string) => request<{ jobId: string }>("/imports", "POST", { url });
export const startTranscribe = (id: string) => request<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/transcribe`, "POST", {});
export const startRender = (id: string, edits: VideoEdits) => request<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/render`, "POST", edits);
export const startFrame = (id: string, time: number) => request<{ jobId: string }>(`/videos/${encodeURIComponent(id)}/frames`, "POST", { time });
export const getJob = <R,>(jobId: string, signal?: AbortSignal) => request<Job<R>>(`/jobs/${encodeURIComponent(jobId)}`, "GET", undefined, signal);
export const jobAssetUrl = (jobId: string) => `${SHAUN_VIDEO_API}/jobs/${encodeURIComponent(jobId)}/asset`;
export const videoAssetUrl = (videoId: string) => `${SHAUN_VIDEO_API}/videos/${encodeURIComponent(videoId)}/asset`;
export async function preparePreview(videoId: string, signal: AbortSignal): Promise<string> {
  for (;;) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const result = await request<{ jobId?: string; assetUrl?: string }>(`/videos/${encodeURIComponent(videoId)}/preview`, "POST", {}, signal);
      if (result.jobId) await pollJob(result.jobId, () => undefined, signal);
      return `${SHAUN_VIDEO_API}/videos/${encodeURIComponent(videoId)}/preview`;
    } catch (error) {
      if (!(error instanceof ShaunVideoError) || error.status !== 429) throw error;
      await sleep(3000, signal);
    }
  }
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
});

/** Polls every ~1.5s until terminal. Aborting stops watching only; the server job keeps running. */
export async function pollJob<R>(jobId: string, onProgress: (p: number, status: JobStatus, phase?: string) => void, signal?: AbortSignal): Promise<R> {
  for (;;) {
    const job = await getJob<R>(jobId, signal);
    onProgress(job.progress ?? 0, job.status, job.phase);
    if (job.status === "succeeded") {
      if (job.result === undefined) throw new ShaunVideoError("Job finished without a result.");
      return job.result;
    }
    if (job.status === "failed") throw new ShaunVideoError(job.error || "Job failed.");
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
