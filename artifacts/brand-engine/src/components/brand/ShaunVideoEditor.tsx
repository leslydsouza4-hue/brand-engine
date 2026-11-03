import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ScanSearch, Eye, UploadCloud, Link2, Loader2, Play, Pause, Scissors, Square, Trash2, Captions, Film, Download, ImagePlus, RotateCcw, X, AlertTriangle, Video } from "lucide-react";
import { LivePreview } from "./LivePreview";
import { useSessionState } from "./sessions/useSessionState";
import {
  downloadJobAsset, fetchAsDataUrl, getCapabilities, getVideo, isAbort, pollJob, preparePreview, probeInfo, requestLayout, ShaunVideoError, startFrame, startImport, startRender, startTranscribe, uploadVideo,
  type Capabilities, type OutputResult, type TranscriptResult, type VideoMeta,
} from "./shaunVideo/api";
import {
  defaultEdits, editsKey, fmtTime, renderEdits, round3, validateEdits,
  type SplitLayout, type TimedText, type TranscriptState, type VideoEdits,
} from "./shaunVideo/edits";
import { VideoStage } from "./shaunVideo/VideoStage";
import { SplitPanels } from "./shaunVideo/SplitPanels";
import { Timeline } from "./shaunVideo/Timeline";
import { CaptionEditor } from "./shaunVideo/CaptionEditor";
import { Section, Segmented, TimeInput, ProgressBar, ErrorNote, ghostBtn, primaryBtn, inputCls } from "./shaunVideo/ui";

interface SourceRef { videoId: string; name: string; duration: number; width: number; height: number; origin: "upload" | "descript" }
interface RenderRef { jobId: string; assetUrl: string; key: string; format: string; renderedAt: string }
type BusyKind = "upload" | "import" | "transcribe" | "render" | "frame";
interface Busy { kind: BusyKind; progress: number; label: string; phase?: string }

const DESCRIPT_RE = /^https:\/\/share\.descript\.com\/view\/[\w-]+/;

interface Props { modeSwitch: ReactNode; onUseFrame: (dataUrl: string) => void }

export function ShaunVideoEditor({ modeSwitch, onUseFrame }: Props) {
  const [source, setSource] = useSessionState<SourceRef | null>("shaun.video.source", null);
  const [edits, setEdits] = useSessionState<VideoEdits | null>("shaun.video.edits", null);
  const [transcript, setTranscript] = useSessionState<TranscriptState | null>("shaun.video.transcript", null);
  const [render, setRender] = useSessionState<RenderRef | null>("shaun.video.render", null);

  const [busy, setBusy] = useState<Busy | null>(null);
  const [errors, setErrors] = useState<Partial<Record<BusyKind | "video" | "playback", string>>>({});
  const [importUrl, setImportUrl] = useState("");
  const [importRefresh, setImportRefresh] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [preview, setPreview] = useState<{ videoId: string; url: string } | null>(null);
  const [previewRetry, setPreviewRetry] = useState(0);
  useEffect(() => {
    setPreview(null);
    setErrors(prev => ({ ...prev, playback: undefined }));
    if (!source) return;
    const ac = new AbortController();
    const videoId = source.videoId;
    preparePreview(videoId, ac.signal).then(url => {
      if (!ac.signal.aborted) setPreview({ videoId, url });
    }).catch(error => {
      if (!isAbort(error)) setErrors(prev => ({ ...prev, playback: `Could not prepare the video preview. ${(error as Error).message}` }));
    });
    return () => ac.abort();
  }, [source?.videoId, previewRetry]);
  const [drawing, setDrawing] = useState(false);
  const [sourceView, setSourceView] = useState(false);
  const [layout, setLayout] = useState<{ videoId: string; status: "analyzing" | "error" | "done"; note?: string; phase?: string } | null>(null);
  const [layoutRetry, setLayoutRetry] = useState(0);
  const layoutTriedRef = useRef<Set<string>>(new Set());
  const currentVideoRef = useRef<string | undefined>(undefined);
  currentVideoRef.current = source?.videoId;
  const wantsLayout = !!source && edits?.format === "vertical" && !edits.split;
  const previewReady = !!source && preview?.videoId === source.videoId;
  // Auto-detect once per source when vertical is chosen without saved bounds. Retry button bumps layoutRetry.
  useEffect(() => {
    if (!source || !wantsLayout || !previewReady) return;
    const videoId = source.videoId;
    const tag = `${videoId}#${layoutRetry}`;
    if (layoutTriedRef.current.has(tag)) return;
    layoutTriedRef.current.add(tag);
    const ac = new AbortController();
    setLayout({ videoId, status: "analyzing" });
    (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const r = await requestLayout(videoId, ac.signal, (_p, phase) => { if (!ac.signal.aborted) setLayout(l => l && l.videoId === videoId ? { ...l, phase } : l); });
          if (ac.signal.aborted || currentVideoRef.current !== videoId) return;
          setEdits(e => e && !e.split ? { ...e, split: r.split } : e);
          setLayout({ videoId, status: "done", note: r.note });
          return;
        } catch (err) {
          if (isAbort(err) || ac.signal.aborted || currentVideoRef.current !== videoId) return;
          if (err instanceof ShaunVideoError && err.status === 429 && attempt < 8) {
            const ok = await new Promise<boolean>(res => {
              if (ac.signal.aborted) return res(false);
              const t = setTimeout(() => res(true), 2500);
              ac.signal.addEventListener("abort", () => { clearTimeout(t); res(false); }, { once: true });
            });
            if (!ok || ac.signal.aborted) return;
            continue;
          }
          setLayout({ videoId, status: "error", note: (err as Error).message || "Could not locate the speaker and screen panels." });
          return;
        }
      }
    })();
    return () => { ac.abort(); layoutTriedRef.current.delete(tag); };
  }, [source?.videoId, wantsLayout, previewReady, layoutRetry]);
  const layoutHere = layout && layout.videoId === source?.videoId ? layout : null;
  const manualSplit = () => {
    const full = { x: 0, y: 0, width: 1, height: 1 };
    patch({ split: { screen: { ...full }, speaker: { ...full } } });
    setSourceView(true);
  };
  const setSplit = (split: SplitLayout) => patch({ split });
  const [selectedBlur, setSelectedBlur] = useState<number | null>(null);
  const [markIn, setMarkIn] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [download, setDownload] = useState<{ status: "idle" | "downloading" | "error"; error?: string }>({ status: "idle" });
  const loadedForRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    getCapabilities(ac.signal).then(setCaps).catch(() => setCaps(null));
    return () => ac.abort();
  }, []);

  const setError = (k: BusyKind | "video" | "playback", msg?: string) => setErrors(prev => ({ ...prev, [k]: msg }));

  // Leaving mid-upload or mid-job loses local tracking; warn the browser.
  useEffect(() => {
    if (!busy) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [busy]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Verify a restored session's source is still accessible to this user.
  useEffect(() => {
    if (!source) return;
    const ac = new AbortController();
    getVideo(source.videoId, ac.signal)
      .then(meta => { if (meta.status !== "ready") setError("video", "This video upload never finished. Upload it again."); else setError("video", undefined); })
      .catch(err => { if (!isAbort(err)) setError("video", (err as Error).message); });
    return () => ac.abort();
  }, [source?.videoId]);

  const run = useCallback(async <T,>(kind: BusyKind, label: string, fn: (signal: AbortSignal, progress: (p: number, phase?: string) => void) => Promise<T>): Promise<T | undefined> => {
    const ac = new AbortController();
    abortRef.current = ac;
    setError(kind, undefined);
    setBusy({ kind, progress: 0, label });
    try {
      return await fn(ac.signal, (p, phase) => setBusy(b => b && b.kind === kind ? { ...b, progress: p, phase } : b));
    } catch (err) {
      if (!isAbort(err)) setError(kind, (err as Error).message || "Something went wrong.");
      return undefined;
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
      setBusy(null);
    }
  }, []);

  const adoptVideo = (meta: VideoMeta, origin: SourceRef["origin"]) => {
    const info = probeInfo(meta.probe);
    const duration = info.duration ?? 0;
    setSource({ videoId: meta.videoId, name: meta.name, duration, width: info.width ?? 0, height: info.height ?? 0, origin });
    setEdits(defaultEdits(duration));
    setTranscript(null);
    setRender(null);
    setTime(0); setSelectedBlur(null); setMarkIn(null); setDrawing(false); setSourceView(false); setLayout(null);
    setErrors({});
  };

  const confirmReplace = () => !source || window.confirm("Replace the current video? Its edits, captions and render reference will be cleared. The original file stays in the shared library.");

  const handleFile = async (file: File | undefined) => {
    if (!file || !confirmReplace()) return;
    const meta = await run("upload", "Uploading", async (signal, progress) => {
      const m = await uploadVideo(file, p => progress(p * 0.9), signal);
      progress(1);
      return m;
    });
    if (meta) adoptVideo(meta, "upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!DESCRIPT_RE.test(url)) { setError("import", "Paste a public https://share.descript.com/view/... link."); return; }
    if (!confirmReplace()) return;
    const meta = await run("import", "Importing from Descript", async (signal, progress) => {
      const { jobId } = await startImport(url, importRefresh);
      return pollJob<VideoMeta>(jobId, (p, _s, phase) => progress(p, phase), signal);
    });
    if (meta) { adoptVideo(meta, "descript"); setImportUrl(""); setImportRefresh(false); }
  };

  const captionUnits: TimedText[] = transcript?.timing === "segment" ? transcript.segments : edits?.words ?? [];
  const setCaptionUnits = (units: TimedText[]) => {
    if (transcript?.timing === "segment") setTranscript({ ...transcript, segments: units });
    else setEdits(e => e && { ...e, words: units });
  };

  const handleTranscribe = async () => {
    if (!source) return;
    if (captionUnits.length && !window.confirm("Transcribing again replaces your caption edits. Continue?")) return;
    const result = await run("transcribe", "Transcribing", async (signal, progress) => {
      const { jobId } = await startTranscribe(source.videoId);
      return pollJob<TranscriptResult>(jobId, (p, _s, phase) => progress(p, phase), signal);
    });
    if (!result) return;
    setTranscript({ timing: result.timing, text: result.text, segments: result.segments ?? [], model: result.model, timestampMethod: result.timestampMethod, language: result.language, omittedUncertainWords: result.omittedUncertainWords ?? 0, groupedUncertainWords: result.groupedUncertainWords ?? 0 });
    setEdits(e => e && { ...e, words: result.timing === "word" ? result.words : [] });
  };

  const duration = source?.duration || edits?.trimEnd || 0;
  const validation = useMemo(() => edits ? validateEdits(edits, duration) : [], [edits, duration]);
  const currentKey = edits ? editsKey(edits, transcript?.timing ?? "word", transcript?.segments ?? []) : "";
  const renderStale = !!render && render.key !== currentKey;

  const handleRender = async () => {
    if (!source || !edits || validation.length) return;
    const payload = renderEdits(edits, transcript);
    const key = currentKey;
    const result = await run("render", "Rendering MP4", async (signal, progress) => {
      const { jobId } = await startRender(source.videoId, payload);
      const r = await pollJob<OutputResult>(jobId, (p, _s, phase) => progress(p, phase), signal);
      return { jobId, ...r };
    });
    setDownload({ status: "idle" });
    if (result) setRender({ jobId: result.jobId, assetUrl: result.assetUrl, key, format: edits.format, renderedAt: new Date().toISOString() });
  };

  const handleFrame = async () => {
    if (!source) return;
    videoRef.current?.pause();
    const at = round3(time);
    const dataUrl = await run("frame", "Extracting frame", async (signal, progress) => {
      const { jobId } = await startFrame(source.videoId, at);
      const r = await pollJob<OutputResult>(jobId, p => progress(p * 0.9), signal);
      return fetchAsDataUrl(r.assetUrl);
    });
    if (dataUrl) onUseFrame(dataUrl);
  };

  const seek = (t: number) => { const v = videoRef.current; if (v && Math.abs(v.currentTime - t) > 0.001) v.currentTime = t; setTime(t); };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !edits) return;
    if (!v.paused) { v.pause(); return; }
    // Only rewind when the playhead is outside the kept range; otherwise resume exactly where it is.
    if (v.currentTime >= edits.trimEnd - 0.05 || v.currentTime < edits.trimStart) v.currentTime = edits.trimStart;
    const p = v.play();
    if (p) p.catch(err => {
      if ((err as Error)?.name === "AbortError") return;
      setError("playback", "Playback was blocked by the browser. Press play again.");
    });
  };
  const handleDownload = async () => {
    if (!render || !source || download.status === "downloading") return;
    setDownload({ status: "downloading" });
    try {
      await downloadJobAsset(render.jobId, `${source.name.replace(/\.[^.]+$/, "")}-${render.format}.mp4`);
      setDownload({ status: "idle" });
    } catch (err) {
      setDownload({ status: "error", error: (err as Error).message || "Download failed. Try again." });
    }
  };
  const patch = (p: Partial<VideoEdits>) => setEdits(e => e && { ...e, ...p });

  const addCut = () => {
    if (!edits) return;
    if (markIn === null) { setMarkIn(round3(time)); return; }
    const start = Math.min(markIn, time), end = Math.max(markIn, time);
    setMarkIn(null);
    if (end - start < 0.05) return;
    patch({ cuts: [...edits.cuts, { start: round3(start), end: round3(end) }].sort((a, b) => a.start - b.start) });
  };

  const removeVideo = () => {
    if (!window.confirm("Remove this video from the workspace? The original stays in the shared library for signed-in teammates.")) return;
    abortRef.current?.abort();
    setSource(null); setEdits(null); setTranscript(null); setRender(null); setErrors({});
  };

  const resetEdits = () => {
    if (!edits || !window.confirm("Reset trim, cuts, blurs and format? Captions are kept.")) return;
    setEdits({ ...defaultEdits(duration), words: edits.words });
    setSelectedBlur(null); setMarkIn(null);
  };

  const busyFor = (k: BusyKind) => busy?.kind === k;
  const cancelBtn = (
    <button type="button" onClick={() => abortRef.current?.abort()} className={`${ghostBtn} mt-[6px] w-full`}>
      <X className="w-[11px] h-[11px]" />{busy?.kind === "upload" ? "Cancel upload" : "Stop waiting (job keeps running on server)"}
    </button>
  );

  const blur = selectedBlur !== null ? edits?.blurs[selectedBlur] : undefined;

  return (
    <>
      <div className="w-full md:w-[380px] md:min-w-[380px] overflow-y-auto pt-[20px] px-[16px] md:px-[28px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="pt-[20px]">{modeSwitch}</div>

        <Section title="Source video" right={source && <button type="button" onClick={removeVideo} disabled={!!busy} className={ghostBtn}><Trash2 className="w-[10px] h-[10px]" />Remove</button>}>
          {source && (
            <div className="flex items-center gap-[10px] p-[10px] rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] mb-[10px]">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(0,178,169,0.12)] flex items-center justify-center shrink-0"><Video className="w-[15px] h-[15px] text-[#00B2A9]" /></div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#E2E8F0] truncate">{source.name}</div>
                <div className="text-[10px] text-[#64748B] tabular-nums">{fmtTime(duration)}{source.width ? ` · ${source.width}x${source.height}` : ""} · {source.origin === "descript" ? "Descript import" : "Upload"} · original untouched</div>
              </div>
            </div>
          )}
          {errors.video && <ErrorNote message={errors.video} />}
          {errors.playback && !errors.video && <ErrorNote message={errors.playback} onRetry={() => setPreviewRetry(n => n + 1)} />}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (!busy) void handleFile(e.dataTransfer.files[0]); }}
            className={`rounded-[12px] border border-dashed p-[14px] text-center transition-all ${dragOver ? "border-[#00B2A9] bg-[rgba(0,178,169,0.06)]" : "border-[rgba(255,255,255,0.1)]"}`}
          >
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="hidden" onChange={e => void handleFile(e.target.files?.[0])} />
            <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()} className={`${ghostBtn} mx-auto`}>
              {busyFor("upload") ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <UploadCloud className="w-[12px] h-[12px]" />}
              {source ? "Upload a different video" : "Upload MP4 or MOV"}
            </button>
            <div className="text-[10px] text-[#475569] mt-[6px]">{`Up to ${caps ? Math.round(caps.maxUploadBytes / 1048576) : 250} MB, ${caps ? Math.round(caps.maxDuration / 60) : 10} minutes, 4096 px per edge. Drop a file here.`}</div>
          </div>
          {busyFor("upload") && busy && <><ProgressBar value={busy.progress} label={busy.progress >= 0.9 ? "Checking video" : busy.label} />{cancelBtn}</>}
          {errors.upload && <ErrorNote message={errors.upload} />}

          <div className="mt-[10px]">
            <div className="flex gap-[6px]">
              <div className="relative flex-1">
                <Link2 className="w-[12px] h-[12px] text-[#475569] absolute left-[10px] top-1/2 -translate-y-1/2" />
                <input value={importUrl} onChange={e => setImportUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !busy) void handleImport(); }} placeholder="share.descript.com/view/..." className={`${inputCls} pl-[28px]`} aria-label="Descript share link" />
              </div>
              <button type="button" disabled={!!busy || !importUrl.trim()} onClick={() => void handleImport()} className={ghostBtn}>
                {busyFor("import") ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : "Import"}
              </button>
            </div>
            <label className="flex items-center gap-[6px] mt-[6px] text-[11px] text-[#94A3B8] cursor-pointer select-none">
              <input type="checkbox" data-testid="checkbox-import-refresh" checked={importRefresh} disabled={!!busy} onChange={e => setImportRefresh(e.target.checked)} className="accent-[#00B2A9] w-[12px] h-[12px]" />
              Fetch latest from Descript
            </label>
            <div className="text-[10px] text-[#475569] mt-[3px] leading-[1.45]">Recent imports are reused for speed. Fetch latest after editing in Descript.</div>
            <div className="text-[10px] text-[#475569] mt-[5px] leading-[1.45]">Imports the MP4 from a public Descript share. If the share has no downloadable MP4, export it from Descript and upload the file above.</div>
            {busyFor("import") && busy && <><ProgressBar value={busy.progress} label={busy.phase || busy.label} />{cancelBtn}</>}
            {errors.import && <ErrorNote message={errors.import} />}
          </div>
        </Section>

        {source && edits && (
          <>
            <Section title="Format">
              <div className="flex flex-col gap-[6px]">
                <Segmented value={edits.format} onChange={format => patch({ format })} options={[{ value: "vertical", label: "Vertical 9:16" }, { value: "horizontal", label: "Horizontal 16:9" }]} />
                {edits.format === "horizontal" ? <>
                  <Segmented value={edits.framing} onChange={framing => patch({ framing })} options={[{ value: "blur-fill", label: "Blur fill" }, { value: "fit", label: "Fit" }]} />
                  <div className="text-[10px] text-[#475569] leading-[1.45]">Full footage is always kept in frame. Blur fill backs it with a blurred copy in the render; Fit uses solid bars.</div>
                </> : <>
                  <div className="text-[10px] text-[#475569] leading-[1.45]">Split: screen recording fitted in the top half, speaker cropped to fill the bottom half, captions over the speaker.</div>
                  {!edits.split && layoutHere?.status !== "error" && (
                    <div data-testid="status-layout" className="flex items-center gap-[6px] p-[8px] rounded-[10px] bg-[rgba(40,150,251,0.05)] border border-[rgba(40,150,251,0.15)] text-[10px] text-[#94A3B8]">
                      <Loader2 className="w-[11px] h-[11px] animate-spin text-[#2896FB] shrink-0" />{previewReady ? (layoutHere?.phase || "Locating speaker and screen panels") : "Waiting for the preview before locating panels"}
                    </div>
                  )}
                  {!edits.split && layoutHere?.status === "error" && (
                    <>
                      <ErrorNote message={layoutHere.note || "Could not locate the panels."} onRetry={() => setLayoutRetry(n => n + 1)} />
                      <button type="button" data-testid="button-manual-split" onClick={manualSplit} className={`${ghostBtn} w-full mt-[6px]`}>Set panel bounds manually</button>
                    </>
                  )}
                  {edits.split && (
                    <>
                      <SplitPanels split={edits.split} onChange={setSplit} />
                      {layoutHere?.status === "done" && layoutHere.note && <div className="text-[10px] text-[#64748B] leading-[1.45]">{layoutHere.note}</div>}
                      <div className="flex gap-[6px]">
                        <button type="button" data-testid="button-source-view" onClick={() => setSourceView(v => !v)} className={`${ghostBtn} flex-1 ${sourceView ? "!text-[#00B2A9] !border-[rgba(0,178,169,0.4)]" : ""}`}><Eye className="w-[11px] h-[11px]" />{sourceView ? "Show split preview" : "Check on original"}</button>
                        <button type="button" data-testid="button-redetect" onClick={() => { if (window.confirm("Detect panels again? Your manual bounds will be replaced.")) { patch({ split: undefined }); setLayoutRetry(n => n + 1); } }} className={`${ghostBtn} flex-1`}><ScanSearch className="w-[11px] h-[11px]" />Detect again</button>
                      </div>
                    </>
                  )}
                </>}
              </div>
            </Section>

            <Section title="Captions" right={transcript && <span className={`text-[9px] font-semibold uppercase tracking-[0.8px] px-[6px] py-[2px] rounded-[4px] ${transcript.timing === "word" ? "text-[#00B2A9] bg-[rgba(0,178,169,0.1)]" : "text-[#FBBF24] bg-[rgba(251,191,36,0.1)]"}`}>{transcript.timing === "word" ? "Word timing" : "Segment timing"}</span>}>
              <button type="button" disabled={!!busy} onClick={() => void handleTranscribe()} className={`${ghostBtn} w-full mb-[8px]`}>
                {busyFor("transcribe") ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Captions className="w-[12px] h-[12px]" />}
                {transcript ? "Transcribe again" : "Transcribe captions"}
              </button>
              {busyFor("transcribe") && busy && <><ProgressBar value={busy.progress} label={busy.phase || busy.label} />{cancelBtn}</>}
              {errors.transcribe && <ErrorNote message={errors.transcribe} onRetry={() => void handleTranscribe()} />}
              {edits.format === "vertical" && (
                <label className="block text-[11px] text-[#94A3B8] mb-[10px]">
                  Caption distance from bottom · {Math.round((edits.captionBottom ?? 0.04) * 100)}%
                  <input aria-label="Caption distance from bottom" type="range" min="2" max="22" step="1" value={Math.round((edits.captionBottom ?? 0.04) * 100)} onChange={e => patch({ captionBottom: Number(e.target.value) / 100 })} className="block w-full mt-[6px] accent-[#00B2A9]" />
                  <span className="block text-[10px] mt-[4px]">Move captions below Shaun’s face. Use an uncaptioned Descript source to avoid doubling existing text.</span>
                </label>
              )}
              {transcript?.timing === "segment" && (
                <div className="flex gap-[6px] p-[8px] mb-[8px] rounded-[10px] bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.18)] text-[10px] text-[#FCD34D] leading-[1.45]">
                  <AlertTriangle className="w-[12px] h-[12px] shrink-0 mt-[1px]" />
                  Captions will show as whole phrases. Give them a quick read before rendering.
                </div>
              )}
              {transcript?.timing === "word" && (
                <div className="p-[8px] mb-[8px] rounded-[10px] bg-[rgba(0,178,169,0.05)] border border-[rgba(0,178,169,0.14)] text-[10px] text-[#94A3B8] leading-[1.45]">
                  {transcript.groupedUncertainWords ? "Some words are grouped together for timing. Review captions before exporting." : "Captions are automatic. Give them a quick read before rendering."}
                  {!!transcript.omittedUncertainWords && <span className="block mt-[4px] text-[#FCD34D]">Some words were missed in this older transcript. Transcribe again to recover them.</span>}
                </div>
              )}
              {!transcript && caps?.transcriptionNote && !busyFor("transcribe") && <div className="text-[10px] text-[#475569] mb-[6px] leading-[1.45]">{caps.transcriptionNote}</div>}
              {(transcript || captionUnits.length > 0) && <CaptionEditor units={captionUnits} timing={transcript?.timing ?? "word"} time={time} onChange={setCaptionUnits} onSeek={seek} />}
              {!transcript && !captionUnits.length && !busyFor("transcribe") && <div className="text-[10px] text-[#475569]">Captions are burned into the render automatically in white bold with the spoken word highlighted.</div>}
            </Section>

            <Section title="Trim and cuts" right={<button type="button" onClick={resetEdits} className={ghostBtn}><RotateCcw className="w-[10px] h-[10px]" />Reset</button>}>
              <div className="flex gap-[8px] mb-[6px]">
                <TimeInput label="Start (s)" value={edits.trimStart} max={duration} onChange={v => patch({ trimStart: v })} />
                <TimeInput label="End (s)" value={edits.trimEnd} max={duration} onChange={v => patch({ trimEnd: v })} />
              </div>
              <div className="flex gap-[6px] mb-[10px]">
                <button type="button" className={`${ghostBtn} flex-1`} onClick={() => patch({ trimStart: round3(time) })}>Start at playhead</button>
                <button type="button" className={`${ghostBtn} flex-1`} onClick={() => patch({ trimEnd: round3(time) })}>End at playhead</button>
              </div>
              <button type="button" onClick={addCut} className={`${ghostBtn} w-full ${markIn !== null ? "!text-[#F87171] !border-[rgba(248,113,113,0.35)]" : ""}`}>
                <Scissors className="w-[11px] h-[11px]" />{markIn === null ? "Mark cut start at playhead" : `Mark cut end (started ${fmtTime(markIn)})`}
              </button>
              {markIn !== null && <button type="button" onClick={() => setMarkIn(null)} className={`${ghostBtn} w-full mt-[4px]`}>Cancel cut</button>}
              {edits.cuts.map((c, i) => (
                <div key={`${i}-${c.start}`} className="flex items-end gap-[6px] mt-[8px]">
                  <TimeInput label={`Cut ${i + 1} from`} value={c.start} max={duration} onChange={v => patch({ cuts: edits.cuts.map((x, j) => j === i ? { ...x, start: v } : x) })} />
                  <TimeInput label="to" value={c.end} max={duration} onChange={v => patch({ cuts: edits.cuts.map((x, j) => j === i ? { ...x, end: v } : x) })} />
                  <button type="button" aria-label={`Remove cut ${i + 1}`} onClick={() => patch({ cuts: edits.cuts.filter((_, j) => j !== i) })} className={`${ghostBtn} h-[32px]`}><Trash2 className="w-[11px] h-[11px]" /></button>
                </div>
              ))}
            </Section>

            <Section title="Blur regions">
              <button type="button" onClick={() => { setDrawing(d => !d); videoRef.current?.pause(); }} className={`${ghostBtn} w-full ${drawing ? "!text-[#00B2A9] !border-[rgba(0,178,169,0.4)] bg-[rgba(0,178,169,0.08)]" : ""}`}>
                <Square className="w-[11px] h-[11px]" />{drawing ? "Drag a box on the preview (click to stop)" : "Draw blur box at playhead"}
              </button>
              {edits.format === "vertical" && <div className="text-[10px] text-[#475569] mt-[5px] leading-[1.45]">Blur boxes are drawn on the original frame, so drawing switches the preview to source view.</div>}
              <div className="text-[10px] text-[#475569] mt-[5px] leading-[1.45]">Boxes are outlined in preview. The actual blur is applied in the FFmpeg render.</div>
              {edits.blurs.length > 0 && (
                <div className="flex flex-wrap gap-[4px] mt-[8px]">
                  {edits.blurs.map((_, i) => (
                    <button key={i} type="button" onClick={() => setSelectedBlur(i)} className={`${ghostBtn} ${i === selectedBlur ? "!text-[#2896FB] !border-[rgba(40,150,251,0.4)]" : ""}`}>Blur {i + 1}</button>
                  ))}
                </div>
              )}
              {blur && selectedBlur !== null && (
                <div className="mt-[8px] p-[10px] rounded-[10px] bg-[rgba(40,150,251,0.05)] border border-[rgba(40,150,251,0.15)] flex flex-col gap-[8px]">
                  <div className="flex gap-[8px]">
                    <TimeInput label="Visible from (s)" value={blur.start} max={duration} onChange={v => patch({ blurs: edits.blurs.map((b, j) => j === selectedBlur ? { ...b, start: v } : b) })} />
                    <TimeInput label="until (s)" value={blur.end} max={duration} onChange={v => patch({ blurs: edits.blurs.map((b, j) => j === selectedBlur ? { ...b, end: v } : b) })} />
                  </div>
                  <div className="flex gap-[6px]">
                    <button type="button" className={`${ghostBtn} flex-1`} onClick={() => patch({ blurs: edits.blurs.map((b, j) => j === selectedBlur ? { ...b, start: round3(time) } : b) })}>From playhead</button>
                    <button type="button" className={`${ghostBtn} flex-1`} onClick={() => patch({ blurs: edits.blurs.map((b, j) => j === selectedBlur ? { ...b, end: round3(time) } : b) })}>Until playhead</button>
                  </div>
                  <button type="button" className={`${ghostBtn} hover:!text-[#F87171]`} onClick={() => { patch({ blurs: edits.blurs.filter((_, j) => j !== selectedBlur) }); setSelectedBlur(null); }}><Trash2 className="w-[11px] h-[11px]" />Delete blur {selectedBlur + 1}</button>
                </div>
              )}
            </Section>

            <Section title="Export">
              {validation.length > 0 && <ErrorNote message={validation.join(" ")} />}
              <button type="button" disabled={!!busy || validation.length > 0} onClick={() => void handleRender()} className={`${primaryBtn} mt-[4px]`}>
                {busyFor("render") ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Film className="w-[14px] h-[14px]" />}
                {render && !renderStale ? "Render again" : "Render MP4"}
              </button>
              {busyFor("render") && busy && <><ProgressBar value={busy.progress} label={busy.phase || busy.label} />{cancelBtn}</>}
              {errors.render && <ErrorNote message={errors.render} onRetry={() => void handleRender()} />}
              {render && (
                <div className={`mt-[8px] p-[10px] rounded-[12px] border ${renderStale ? "border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.04)]" : "border-[rgba(0,178,169,0.2)] bg-[rgba(0,178,169,0.05)]"}`}>
                  <div className="text-[11px] font-semibold text-[#E2E8F0]">{render.format === "vertical" ? "Vertical" : "Horizontal"} MP4 ready</div>
                  <div className="text-[10px] text-[#64748B] mb-[8px]">{renderStale ? "Edits changed since this render. Render again to include them." : `Rendered ${new Date(render.renderedAt).toLocaleString()}`}</div>
                  <button type="button" data-testid="button-download" disabled={download.status === "downloading"} onClick={() => void handleDownload()} className={ghostBtn}>
                    {download.status === "downloading" ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Download className="w-[11px] h-[11px]" />}
                    {download.status === "downloading" ? "Downloading..." : "Download MP4"}
                  </button>
                  {download.status === "error" && <ErrorNote message={download.error ?? "Download failed."} onRetry={() => void handleDownload()} />}
                </div>
              )}
              <button type="button" disabled={!!busy} onClick={() => void handleFrame()} className={`${ghostBtn} w-full mt-[10px]`}>
                {busyFor("frame") ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <ImagePlus className="w-[12px] h-[12px]" />}
                Use frame at {fmtTime(time)} in thumbnail
              </button>
              {busyFor("frame") && busy && <><ProgressBar value={busy.progress} label={busy.phase || busy.label} />{cancelBtn}</>}
              {errors.frame && <ErrorNote message={errors.frame} onRetry={() => void handleFrame()} />}
            </Section>
          </>
        )}
      </div>

      <LivePreview>
        {source && edits ? (
          <div className="w-full h-full flex flex-col gap-[14px] min-h-0">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              {preview?.videoId !== source.videoId ? (
                <div className="flex flex-col items-center gap-3 text-sm text-slate-400 p-8 text-center">
                  {!errors.playback && <Loader2 className="w-6 h-6 animate-spin text-teal-400" />}
                  <span>{errors.playback ? "Preview unavailable — retry from the source panel." : "Preparing a browser-friendly video preview…"}</span>
                  <span className="text-xs">Your original stays untouched. Captions and exports use the full-quality source.</span>
                </div>
              ) : <VideoStage
                src={preview.url} videoRef={videoRef} edits={edits} captions={captionUnits} timing={transcript?.timing ?? "word"}
                time={time} sourceSize={source.width ? { width: source.width, height: source.height } : null}
                drawing={drawing} selectedBlur={selectedBlur} sourceView={sourceView || (edits.format === "vertical" && selectedBlur !== null && !edits.split)}
                layoutStatus={layoutHere?.status === "error" ? "Panels not found. Retry detection or set bounds manually in the Format panel." : "Locating speaker and screen panels. Export unlocks once they are set."}
                onTime={setTime} onPlaying={setPlaying}
                onError={msg => setError("playback", msg ?? undefined)}
                onSplitChange={setSplit}
                onLoaded={info => {
                  if (!source.duration || !source.width) setSource(s => s && { ...s, duration: s.duration || round3(info.duration), width: s.width || info.width, height: s.height || info.height });
                  if (!edits.trimEnd && info.duration) patch({ trimEnd: round3(info.duration) });
                  // Initial positioning once per preview source; reloads/retries must not move the playhead.
                  const v = videoRef.current;
                  if (loadedForRef.current === preview.url) return;
                  loadedForRef.current = preview.url;
                  if (v && edits.trimStart && v.currentTime < edits.trimStart) v.currentTime = edits.trimStart;
                }}
                onDrawBox={box => {
                  const start = round3(time), end = round3(Math.min(duration || time + 3, time + 3));
                  const next = [...edits.blurs, { start, end, ...box }];
                  patch({ blurs: next });
                  setSelectedBlur(next.length - 1);
                  setDrawing(false);
                }}
                onSelectBlur={setSelectedBlur}
              />}
            </div>
            <div className="shrink-0 flex items-center gap-[12px]">
              <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play edited preview"} className="w-[38px] h-[38px] rounded-full bg-[#00B2A9] border-none flex items-center justify-center cursor-pointer hover:brightness-110 shrink-0">
                {playing ? <Pause className="w-[15px] h-[15px] text-white" /> : <Play className="w-[15px] h-[15px] text-white ml-[2px]" />}
              </button>
              <div className="flex-1 min-w-0">
                <Timeline duration={duration} time={time} edits={edits} selectedBlur={selectedBlur} onSeek={seek} onSelectBlur={setSelectedBlur} />
              </div>
            </div>
          </div>
        ) : (
          <div data-session-preview className="w-full max-w-[720px] aspect-video relative overflow-hidden rounded-[6px] bg-[#030B17] border border-dashed border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center text-center gap-[8px] p-[24px]">
            {busy ? (
              <>
                <Loader2 className="w-[28px] h-[28px] text-[#00B2A9] animate-spin" />
                <p className="text-[14px] text-[rgba(255,255,255,0.55)] font-medium m-0">{busy.label}</p>
                <span className="text-[11px] text-[rgba(255,255,255,0.3)] tabular-nums">{Math.round(busy.progress * 100)}%</span>
              </>
            ) : (
              <>
                <Video className="w-[32px] h-[32px] text-[rgba(255,255,255,0.25)] mb-[4px]" />
                <p className="text-[14px] text-[rgba(255,255,255,0.35)] font-medium m-0">Upload a video or import a Descript share</p>
                <span className="text-[11px] text-[rgba(255,255,255,0.2)]">Trim, caption, blur, then render a 9:16 or 16:9 MP4</span>
              </>
            )}
          </div>
        )}
      </LivePreview>
    </>
  );
}
