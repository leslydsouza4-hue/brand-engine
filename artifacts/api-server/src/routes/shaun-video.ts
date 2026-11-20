import { randomUUID, createHash } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import type { File } from "@google-cloud/storage";
import { assertSessionMutationOrigin, idSchema, SessionError } from "../lib/session-validation";
import { createPreview, extractAudio, extractFrame, probeVideo, renderVideo, videoEditsSchema, retainedSegments } from "../lib/shaun-video-render";
import { transcribeLocalAudio, isTranscriptionBusy } from "../lib/shaun-video-transcribe";
import { importDescript, validateDescriptShareUrl } from "../lib/shaun-video-import";
import { detectVideoLayout, detectPrivateDetails, privacyRequestSchema } from "../lib/shaun-video-layout";
import { videoSourceCache } from "../lib/shaun-video-cache";
import { pipeStorageResponse } from "../lib/shaun-storage-stream";
import { finiteProgress, jobHeartbeatExpired } from "../lib/shaun-job-progress";
import { logger } from "../lib/logger";
import { getVideo, MAX_DURATION, MAX_VIDEO_BYTES, privateFile, readRecord, saveRecord, videoResponse, videoStorage, type JobRecord, type VideoRecord } from "../lib/shaun-video-store";

const router = Router();
const worker = randomUUID();
const active = new Map<string, number>();
const locked = new Set<string>();
let running = 0;
let transcriptionQueued = false;
const prefix = "/shaun-video";
const mime = z.enum(["video/mp4", "video/quicktime"]);
const uploads = z.object({
  name: z.string().trim().min(1).max(160),
  size: z.number().int().min(12).max(MAX_VIDEO_BYTES), contentType: mime,
}).strict();
function endpoint(fn: (req: Request, res: Response, owner: string) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      const owner = getAuth(req).userId;
      if (!owner) throw new SessionError(401, "Sign in to use video finishing");
      assertSessionMutationOrigin(req);
      res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
      await fn(req, res, owner);
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      if (error instanceof z.ZodError) { res.status(400).json({ error: error.issues.map(i => i.message).join("; "), code: "VALIDATION_ERROR" }); return; }
      if (error instanceof SessionError) { res.status(error.status).json({ error: error.message, code: error.code || "VIDEO_ERROR" }); return; }
      req.log.error({ err: error }, "Video operation failed");
      res.status(500).json({ error: "Video operation failed. Please retry.", code: "VIDEO_ERROR" });
    }
  };
}
const id = (req: Request, key: string) => idSchema.parse(req.params[key]);
function reserve(owner: string) {
  if (running >= 2 || (active.get(owner) || 0) >= 2) throw new SessionError(429, "Video workers are busy. Wait for the current task to finish.", "VIDEO_BUSY");
  running++; active.set(owner, (active.get(owner) || 0) + 1);
}
function release(owner: string) {
  running--; const n = (active.get(owner) || 1) - 1;
  if (n) active.set(owner, n); else active.delete(owner);
}
async function job(owner: string, kind: JobRecord["kind"], videoId: string | undefined,
  task: (dir: string, record: JobRecord, progress: (n: number) => void) => Promise<unknown>) {
  reserve(owner);
  const now = new Date().toISOString();
  const record: JobRecord = { jobId: randomUUID(), owner, worker, kind, videoId, status: "queued", progress: 0, createdAt: now, updatedAt: now };
  const key = `jobs/${record.jobId}.json`;
  try { await saveRecord(owner, key, record); } catch (error) { release(owner); throw error; }
  void (async () => {
    const startedAt = Date.now();
    let dir: string | undefined;
    let pending: Promise<void> = Promise.resolve();
    let lastProgress = 0;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const persist = () => {
      record.updatedAt = new Date().toISOString();
      // Snapshot now so a slow write cannot serialize a later mutation.
      const snapshot = JSON.parse(JSON.stringify(record));
      pending = pending.catch(() => undefined).then(() => saveRecord(owner, key, snapshot));
      return pending;
    };
    try {
      record.status = "running"; await persist();
      heartbeat = setInterval(() => { void persist().catch(() => undefined); }, 30000);
      dir = await mkdtemp(join(tmpdir(), "shaun-video-"));
      record.result = await task(dir, record, n => {
        record.progress = finiteProgress(record.progress, n);
        if (Date.now() - lastProgress > 2000) { lastProgress = Date.now(); void persist().catch(() => undefined); }
      });
      record.status = "succeeded"; record.progress = 1;
      logger.info({ jobId: record.jobId, kind, elapsedMs: Date.now() - startedAt }, "Video job completed");
    } catch (error) {
      record.status = "failed";
      const detail = error as { code?: string; tool?: string; exitCode?: number; systemCode?: string };
      logger.error({ jobId: record.jobId, kind, phase: record.phase, elapsedMs: Date.now() - startedAt,
        code: detail.code ?? "PROCESSING_FAILED", tool: detail.tool, exitCode: detail.exitCode, systemCode: detail.systemCode }, "Video job failed");
      // Never expose ffmpeg local paths, remote signed URLs or provider internals.
      record.error = detail.code === "MEDIA_TOOL_UNAVAILABLE"
        ? "The server's video tools are unavailable. This is a server setup issue, not a problem with your video."
        : error instanceof SessionError ? error.message : kind === "transcribe"
        ? "Caption preparation failed on the server. Your video and edits are safe. Please retry."
        : kind === "layout"
        ? "Automatic analysis could not complete. Try a shorter selection, or use manual regions and scene controls."
        : kind === "import"
        ? "Import failed. Export an MP4 from Descript and upload it instead."
        : "Video processing failed. Check that the file is a valid MP4, at most 10 minutes and 4096 pixels per edge.";
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      if (kind === "transcribe") transcriptionQueued = false;
      await persist().catch(() => undefined);
      if (dir) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      release(owner);
    }
  })();
  return { jobId: record.jobId };
}
async function uploadLocal(owner: string, key: string, local: string, contentType: string) {
  const info = await stat(local);
  if (info.size > 500 * 1024 * 1024) throw new SessionError(413, "Processed video exceeds the 500 MiB output limit");
  const target = privateFile(owner, key);
  await target.bucket.upload(local, { destination: target.name, resumable: false, metadata: { contentType, cacheControl: "private, no-store" } });
}
async function downloadLocal(owner: string, videoId: string, local: string) {
  const file = privateFile(owner, `videos/${videoId}/source`);
  await videoSourceCache.materialize(`${file.bucket.name}/${file.name}`, local, async path => {
    const [meta] = await file.getMetadata();
    if (Number(meta.size) > MAX_VIDEO_BYTES) throw new SessionError(413, "Video exceeds 250 MiB");
    await file.download({ destination: path });
  });
}
async function retainLocal(owner: string, videoId: string, local: string) {
  const file = privateFile(owner, `videos/${videoId}/source`);
  // Cache failure must not invalidate a durably saved original.
  await videoSourceCache.seed(`${file.bucket.name}/${file.name}`, local)
    .catch(error => console.warn("Video source cache retention failed", error.code));
}
async function serve(req: Request, res: Response, file: File, contentType: string, name: string) {
  const [meta] = await file.getMetadata();
  const total = Number(meta.size);
  let start = 0, end = total - 1;
  const range = req.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) { res.status(416).set("Content-Range", `bytes */${total}`).end(); return; }
    if (!match[1]) start = Math.max(0, total - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= total) { res.status(416).set("Content-Range", `bytes */${total}`).end(); return; }
    res.status(206).set("Content-Range", `bytes ${start}-${end}/${total}`);
  }
  res.set({ "Content-Type": contentType, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes",
    "Content-Disposition": `${req.query.download === "1" ? "attachment" : "inline"}; filename="${name}"`,
    "Content-Security-Policy": "default-src 'none'; sandbox" });
  const stream = file.createReadStream({ start, end });
  pipeStorageResponse(stream, res);
}

router.get(`${prefix}/capabilities`, endpoint(async (_req, res) => {
  res.json({ maxUploadBytes: MAX_VIDEO_BYTES, maxDuration: MAX_DURATION, formats: ["video/mp4", "video/quicktime"],
    wordTimestamps: true, segmentTimestamps: false, transcriptionModel: "Xenova/whisper-tiny.en",
    timestampMethod: "whisper-cross-attention-dtw", transcriptionLanguage: "en",
    transcriptionNote: "Local CPU Whisper; first transcription downloads the public Apache-2.0 ONNX model. Review generated words before export." });
}));
router.post(`${prefix}/uploads`, endpoint(async (req, res, owner) => {
  const body = uploads.parse(req.body);
  reserve(owner);
  try {
    const videoId = randomUUID();
    const uploadURL = await videoStorage.getObjectEntityUploadURL();
    const video: VideoRecord = { ...body, videoId, owner, status: "uploading", staging: videoStorage.normalizeObjectEntityPath(uploadURL), createdAt: new Date().toISOString() };
    await saveRecord(owner, `videos/${videoId}.json`, video);
    res.status(201).json({ videoId, uploadURL });
  } finally { release(owner); }
}));
router.post(`${prefix}/videos/:videoId/complete`, endpoint(async (req, res, owner) => {
  const videoId = id(req, "videoId"), lock = `${owner}/${videoId}`;
  if (locked.has(lock)) throw new SessionError(409, "This upload is already being completed");
  reserve(owner); locked.add(lock);
  let dir: string | undefined;
  try {
    const video = await getVideo(owner, videoId, false);
    if (video.status === "ready") { res.json(videoResponse(video)); return; }
    if (video.owner !== owner) throw new SessionError(403, "Only the original uploader may complete a pending upload");
    const staging = await videoStorage.getObjectEntityFile(video.staging!);
    const [meta] = await staging.getMetadata();
    if (Number(meta.size) !== video.size || meta.contentType !== video.contentType)
      throw new SessionError(400, "Upload size or content type does not match. Upload the original file again.");
    // Freeze a copy before validation: signed PUT URLs remain reusable for 15m.
    const target = privateFile(owner, `videos/${videoId}/source`);
    try { await staging.copy(target, { preconditionOpts: { ifGenerationMatch: 0 } }); }
    catch (error) {
      if ((error as { code?: number }).code === 412)
        throw new SessionError(409, "This upload is already completing or complete. Refresh its video status before retrying.");
      throw error;
    }
    try {
      const [frozen] = await target.getMetadata();
      if (Number(frozen.size) !== video.size || frozen.contentType !== video.contentType)
        throw new SessionError(400, "Upload changed while completing. Please upload again.");
      dir = await mkdtemp(join(tmpdir(), "shaun-video-"));
      const local = join(dir, "source.mp4");
      await target.download({ destination: local });
      video.probe = await probeVideo(local).catch(() => { throw new SessionError(422, "Invalid video. Upload MP4 or MOV, at most 10 minutes and 4096 pixels per edge."); });
      video.status = "ready"; delete video.staging;
      await target.setMetadata({ cacheControl: "private, no-store" });
      await saveRecord(owner, `videos/${videoId}.json`, video);
      await retainLocal(owner, videoId, local);
      await staging.delete().catch(() => undefined);
    } catch (error) { await target.delete().catch(() => undefined); throw error; }
    res.json(videoResponse(video));
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    locked.delete(lock); release(owner);
  }
}));
router.get(`${prefix}/videos/:videoId`, endpoint(async (req, res, owner) => {
  res.json(videoResponse(await getVideo(owner, id(req, "videoId"), false)));
}));
router.get(`${prefix}/videos/:videoId/asset`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  await serve(req, res, privateFile(owner, `videos/${video.videoId}/source`), video.contentType, "source.mp4");
}));
router.post(`${prefix}/imports`, endpoint(async (req, res, owner) => {
  const { url, refresh } = z.object({ url: z.string().max(2048), refresh: z.boolean().optional() }).strict().parse(req.body);
  validateDescriptShareUrl(url);
  res.status(202).json(await job(owner, "import", undefined, async (dir, record) => {
    const canonical = new URL(url); canonical.search = ""; canonical.hash = "";
    const cacheKey = `imports/${createHash("sha256").update("named-v2:" + canonical.href).digest("hex")}.json`;
    try {
      const cached = await readRecord<{ videoId: string; at: number }>(owner, cacheKey);
      if (!refresh && Date.now() - cached.at < 15 * 60_000) {
        const existing = await getVideo(owner, cached.videoId);
        record.videoId = existing.videoId;
        return videoResponse(existing);
      }
    } catch (error) { if (!(error instanceof SessionError && error.status === 404)) throw error; }
    const local = join(dir, "source.mp4");
    record.phase = "Downloading Descript video";
    let title = "";
    const size = await importDescript(url, local, value => { title = value; });
    record.phase = "Checking video format";
    const probe = await probeVideo(local);
    const videoId = randomUUID();
    const video: VideoRecord = { videoId, owner, name: `${title || "Descript video"}.mp4`, size, contentType: "video/mp4", status: "ready", probe, createdAt: new Date().toISOString() };
    record.phase = "Saving imported video";
    await uploadLocal(owner, `videos/${videoId}/source`, local, "video/mp4");
    await saveRecord(owner, `videos/${videoId}.json`, video);
    await saveRecord(owner, cacheKey, { videoId, at: Date.now() });
    await retainLocal(owner, videoId, local);
    record.videoId = videoId;
    return videoResponse(video);
  }));
}));
// Cached derivative: existing sessions automatically gain a playable preview.
router.post(`${prefix}/videos/:videoId/preview`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  const key = `videos/${video.videoId}/preview-v1.webm`;
  const assetUrl = `/api/shaun-video/videos/${video.videoId}/preview`;
  if ((await privateFile(owner, key).exists())[0]) {
    res.json({ assetUrl }); return;
  }
  const lock = `preview/${video.videoId}`;
  if (locked.has(lock)) throw new SessionError(429, "Preparing this video preview. Please wait.");
  locked.add(lock);
  try {
    res.status(202).json(await job(owner, "preview", video.videoId, async (dir, record) => {
      try {
        record.phase = "Preparing browser-friendly preview";
        const input = join(dir, "source.mp4"), output = join(dir, "preview.webm");
        await downloadLocal(owner, video.videoId, input);
        await createPreview(input, output);
        await uploadLocal(owner, key, output, "video/webm");
        return { assetUrl };
      } finally { locked.delete(lock); }
    }));
  } catch (error) { locked.delete(lock); throw error; }
}));
router.get(`${prefix}/videos/:videoId/preview`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  const file = privateFile(owner, `videos/${video.videoId}/preview-v1.webm`);
  if (!(await file.exists())[0]) throw new SessionError(404, "Preview is not ready");
  await serve(req, res, file, "video/webm", "preview.webm");
}));
router.post(`${prefix}/videos/:videoId/layout`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  const key = `videos/${video.videoId}/layout-headroom-product-v6.json`;
  if ((await privateFile(owner, key).exists())[0]) { res.json(await readRecord(owner, key)); return; }
  const lock = `layout/${video.videoId}`;
  if (locked.has(lock)) throw new SessionError(429, "Locating this video's panels. Please wait.");
  locked.add(lock);
  try {
    res.status(202).json(await job(owner, "layout", video.videoId, async (dir, record) => {
      try {
        record.phase = "Locating speaker and screen";
        const input = join(dir, "source.mp4");
        await downloadLocal(owner, video.videoId, input);
        const result = await detectVideoLayout(input, dir, (video.probe as { duration: number }).duration);
        await saveRecord(owner, key, result);
        return result;
      } finally { locked.delete(lock); }
    }));
  } catch (error) { locked.delete(lock); throw error; }
}));
router.post(`${prefix}/videos/:videoId/privacy`, endpoint(async (req,res,owner)=>{
  const video=await getVideo(owner,id(req,"videoId"));
  const request=privacyRequestSchema.parse(req.body);
  if(request.end>(video.probe as {duration:number}).duration) throw new SessionError(400,"Scan exceeds source duration");
  const key=`videos/${video.videoId}/privacy/${createHash("sha256").update(JSON.stringify(request)).digest("hex")}.json`;
  if((await privateFile(owner,key).exists())[0]) {res.json(await readRecord(owner,key));return;}
  res.status(202).json(await job(owner,"layout",video.videoId,async(dir,record)=>{
    record.phase="Finding personal details";
    const input=join(dir,"source.mp4");
    await downloadLocal(owner,video.videoId,input);
    const result=await detectPrivateDetails(input,dir,request);
    await saveRecord(owner,key,result);
    return result;
  }));
}));
router.post(`${prefix}/videos/:videoId/render`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  const edits = videoEditsSchema.parse(req.body);
  if (edits.format === "vertical" && !edits.split) throw new SessionError(400, "Locate the speaker and screen crops before exporting vertical video.");
  try { retainedSegments(edits, (video.probe as { duration: number }).duration); }
  catch (error) { throw new SessionError(400, (error as Error).message); }
  res.status(202).json(await job(owner, "render", video.videoId, async (dir, record, progress) => {
    let phaseStartedAt = Date.now();
    const phase = (name: string, value: number) => {
      if (record.phase) logger.info({ jobId: record.jobId, phase: record.phase,
        elapsedMs: Date.now() - phaseStartedAt }, "Video export stage completed");
      phaseStartedAt = Date.now();
      record.phase = name;
      progress(value);
    };
    phase("Checking saved video", 0.01);
    const cacheKey = `videos/${video.videoId}/renders/${createHash("sha256").update("camera-drag-v5:" + JSON.stringify(edits)).digest("hex")}.json`;
    try {
      const cached = await readRecord<{ jobId: string }>(owner, cacheKey);
      const file = privateFile(owner, `jobs/${cached.jobId}/output`);
      if ((await file.exists())[0]) {
        await file.copy(privateFile(owner, `jobs/${record.jobId}/output`));
        record.contentType = "video/mp4";
        return { assetUrl: `/api/shaun-video/jobs/${record.jobId}/asset`, contentType: record.contentType };
      }
    } catch (error) { if (!(error instanceof SessionError && error.status === 404)) throw error; }
    const input = join(dir, "source.mp4"), output = join(dir, "output.mp4");
    phase("Loading source video", 0.02);
    await downloadLocal(owner, video.videoId, input);
    phase("Creating MP4", 0.05);
    await renderVideo(input, output, edits, n => progress(0.05 + n / 100 * 0.88));
    phase("Saving finished MP4", 0.95);
    await uploadLocal(owner, `jobs/${record.jobId}/output`, output, "video/mp4");
    logger.info({ jobId: record.jobId, phase: record.phase, elapsedMs: Date.now() - phaseStartedAt,
      bytes: (await stat(output)).size }, "Video export stage completed");
    record.contentType = "video/mp4";
    await saveRecord(owner, cacheKey, { jobId: record.jobId });
    return { assetUrl: `/api/shaun-video/jobs/${record.jobId}/asset`, contentType: record.contentType };
  }));
}));
router.post(`${prefix}/videos/:videoId/frames`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  const { time } = z.object({ time: z.number().finite().min(0) }).strict().parse(req.body);
  if (time >= (video.probe as { duration: number }).duration) throw new SessionError(400, "Frame time must be inside source duration");
  res.status(202).json(await job(owner, "frame", video.videoId, async (dir, record) => {
    const input = join(dir, "source.mp4"), output = join(dir, "frame.png");
    await downloadLocal(owner, video.videoId, input);
    await extractFrame(input, output, time);
    await uploadLocal(owner, `jobs/${record.jobId}/output`, output, "image/png");
    record.contentType = "image/png";
    return { assetUrl: `/api/shaun-video/jobs/${record.jobId}/asset`, contentType: record.contentType };
  }));
}));
router.post(`${prefix}/videos/:videoId/transcribe`, endpoint(async (req, res, owner) => {
  const video = await getVideo(owner, id(req, "videoId"));
  if (!(video.probe as { hasAudio: boolean }).hasAudio) throw new SessionError(422, "This video has no audio track");
  if (transcriptionQueued || isTranscriptionBusy()) throw new SessionError(429, "A speech transcription is already running. Please wait.", "TRANSCRIPTION_BUSY");
  transcriptionQueued = true;
  try {
    res.status(202).json(await job(owner, "transcribe", video.videoId, async (dir, record, progress) => {
      try {
        const input = join(dir, "source.mp4"), audio = join(dir, "speech.wav");
        record.phase = "Preparing source audio"; progress(0.02);
        try {
          record.phase = "Loading source for captions";
          await downloadLocal(owner, video.videoId, input);
          record.phase = "Extracting source audio";
          await extractAudio(input, audio);
        } catch (error) {
          console.warn("Caption preparation retry", { phase: record.phase, code: (error as NodeJS.ErrnoException).code ?? "PROCESSING_FAILED" });
          record.phase = "Recovering audio from prepared preview"; progress(0.04);
          const proxy = join(dir, "preview.webm");
          try {
            await privateFile(owner, `videos/${video.videoId}/preview-v1.webm`).download({ destination: proxy });
            await rm(audio, { force: true });
            await extractAudio(proxy, audio, true);
          } catch (retryError) {
            console.warn("Caption audio recovery failed", { code: (retryError as NodeJS.ErrnoException).code ?? "PROCESSING_FAILED" });
            throw new SessionError(503, "The server could not prepare this video's audio. Your original and edits are safe. Please retry.", "AUDIO_PREPARATION_FAILED");
          }
        }
        const result = await transcribeLocalAudio(audio, (value, phase) => {
          record.phase = phase; progress(0.1 + value * 0.88);
        });
        record.phase = "Completed";
        return result;
      } finally { transcriptionQueued = false; }
    }));
  } catch (error) { transcriptionQueued = false; throw error; }
}));
router.get(`${prefix}/jobs/:jobId`, endpoint(async (req, res, owner) => {
  const jobId = id(req, "jobId");
  const record = await readRecord<JobRecord>(owner, `jobs/${jobId}.json`);
  if (["queued", "running"].includes(record.status) && jobHeartbeatExpired(record.updatedAt)) {
    record.status = "failed"; record.error = record.kind === "render"
      ? "The server stopped during export. Your video and edits are safe. Click Download MP4 again to retry."
      : "Processing was interrupted. Your video and edits are safe. Please retry.";
    record.updatedAt = new Date().toISOString();
    await saveRecord(owner, `jobs/${jobId}.json`, record);
  }
  const { owner: _owner, worker: _worker, ...publicRecord } = record;
  res.json({ ...publicRecord, progress: Number.isFinite(record.progress) ? record.progress : 0 });
}));
router.get(`${prefix}/jobs/:jobId/asset`, endpoint(async (req, res, owner) => {
  const jobId = id(req, "jobId");
  const record = await readRecord<JobRecord>(owner, `jobs/${jobId}.json`);
  if (record.status !== "succeeded" || !record.contentType) throw new SessionError(404, "Output not available");
  await serve(req, res, privateFile(owner, `jobs/${jobId}/output`), record.contentType, record.contentType === "image/png" ? "frame.png" : "finished.mp4");
}));
export default router;
