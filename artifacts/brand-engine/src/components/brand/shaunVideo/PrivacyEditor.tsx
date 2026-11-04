import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Loader2, ScanSearch, Square, X } from "lucide-react";
import { isAbort, requestPrivacy, type PrivacyResult } from "./api";
import { boxFromDrag, clamp, cropToSource, fmtTime, layoutAt, MAX_BLURS, normalizedPoint, round3, sourceToCrop, type BlurBox, type Point, type Rect, type VideoEdits } from "./edits";
import { ErrorNote, ProgressBar, Segmented, TimeInput, ghostBtn, primaryBtn } from "./ui";

type Target = "screen" | "speaker";
const FULL: Rect = { x: 0, y: 0, width: 1, height: 1 };
const COLORS: Record<Target, string> = { screen: "#2896FB", speaker: "#00B2A9" };

interface Props {
  target: Target;
  src: string;
  videoId: string;
  edits: VideoEdits;
  duration: number;
  startTime: number;
  onClose: () => void;
  onAddBlurs: (boxes: BlurBox[]) => void;
}

/**
 * Dedicated blur selection editor. Shows a paused source frame cropped to the chosen panel,
 * with its own decoder so the Live Preview is never switched or overlaid. Boxes map back to
 * full-source normalized coordinates.
 */
export function PrivacyEditor(p: Props) {
  const [target, setTarget] = useState<Target>(p.target);
  const [time, setTime] = useState(p.startTime);
  const [range, setRange] = useState({ start: round3(p.startTime), end: round3(Math.min(p.duration || p.startTime + 3, p.startTime + 3)) });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{ id: number; a: Point } | null>(null);
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null);
  const [auto, setAuto] = useState<{ status: "idle" | "running" | "done" | "error"; progress: number; phase?: string; error?: string; result?: PrivacyResult; picked: boolean[] }>({ status: "idle", progress: 0, picked: [] });
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const active = layoutAt(p.edits, time);
  const crop: Rect = active?.split[target] ?? FULL;
  const cropKey = `${crop.x},${crop.y},${crop.width},${crop.height}`;
  const remaining = MAX_BLURS - p.edits.blurs.length;

  const draw = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth || v.readyState < 2) return;
    const sw = crop.width * v.videoWidth, sh = crop.height * v.videoHeight;
    const scale = Math.min(1, 1600 / Math.max(sw, sh));
    c.width = Math.max(2, Math.round(sw * scale)); c.height = Math.max(2, Math.round(sh * scale));
    const ctx = c.getContext("2d");
    try { ctx?.drawImage(v, crop.x * v.videoWidth, crop.y * v.videoHeight, sw, sh, 0, 0, c.width, c.height); } catch { /* frame not ready */ }
    setSize({ w: sw, h: sh });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropKey]);
  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const v = videoRef.current;
    if (v && Math.abs(v.currentTime - time) > 0.001) v.currentTime = time;
  }, [time]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") p.onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [p]);

  const pos = (e: { clientX: number; clientY: number }) => normalizedPoint(e.clientX, e.clientY, surfaceRef.current!.getBoundingClientRect());
  const addBoxes = (boxes: BlurBox[]) => p.onAddBlurs(boxes.slice(0, Math.max(0, remaining)));

  const runAuto = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setAuto({ status: "running", progress: 0, picked: [] });
    try {
      const result = await requestPrivacy(p.videoId, { start: range.start, end: range.end, target, crop }, ac.signal,
        (progress, phase) => setAuto(a => a.status === "running" ? { ...a, progress, phase } : a));
      setAuto({ status: "done", progress: 1, result, picked: result.blurs.map(() => false) });
    } catch (err) {
      if (!isAbort(err)) setAuto({ status: "error", progress: 0, error: (err as Error).message || "Detection failed.", picked: [] });
    }
  };

  const shownBlurs = p.edits.blurs.map((b, i) => ({ b, i })).filter(({ b }) => time >= b.start && time < b.end);
  const suggestions = auto.status === "done" ? auto.result?.blurs ?? [] : [];
  const pickedCount = auto.picked.filter(Boolean).length;
  const rangeValid = range.end > range.start;
  const color = COLORS[target];

  const overlay = (r: Rect, key: string, cls: string, label?: string) => {
    const c = sourceToCrop(r, crop);
    if (c.x + c.width <= 0 || c.y + c.height <= 0 || c.x >= 1 || c.y >= 1) return null;
    return <div key={key} className={`absolute pointer-events-none rounded-[2px] ${cls}`} style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.width * 100}%`, height: `${c.height * 100}%` }}>
      {label && <span className="absolute -top-[16px] left-0 text-[9px] font-semibold text-white bg-[rgba(3,11,23,0.85)] rounded-[3px] px-[4px] whitespace-nowrap">{label}</span>}
    </div>;
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Blur selection editor" className="fixed inset-0 z-[80] flex items-stretch md:items-center justify-center bg-[rgba(3,11,23,0.82)] backdrop-blur-[6px] p-0 md:p-[24px]">
      <div className="w-full max-w-[1180px] max-h-[100dvh] md:max-h-[92dvh] flex flex-col md:flex-row bg-[#07121F] border border-[rgba(255,255,255,0.07)] md:rounded-[18px] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col p-[16px] gap-[12px]">
          <div className="flex items-center gap-[10px]">
            <span className="w-[8px] h-[8px] rounded-[2px]" style={{ background: color }} />
            <span className="text-[12px] font-semibold text-[#E2E8F0]">{target === "screen" ? "Screen" : "Speaker"} panel at {fmtTime(time)}</span>
            <span className="text-[10px] text-[#64748B]">Paused source frame. Drag to draw a blur.</span>
            <button type="button" aria-label="Close blur editor" onClick={p.onClose} className={`${ghostBtn} ml-auto`}><X className="w-[12px] h-[12px]" /></button>
          </div>
          <div className="flex-1 min-h-[220px] flex items-center justify-center rounded-[12px] bg-[#030B17] border border-[rgba(255,255,255,0.04)] p-[14px] overflow-hidden">
            <video ref={videoRef} src={p.src} muted playsInline preload="auto" className="hidden"
              onLoadedData={draw} onSeeked={draw} onLoadedMetadata={e => { e.currentTarget.currentTime = time; }} />
            <div
              ref={surfaceRef}
              data-testid="privacy-draw-surface"
              className="relative max-w-full max-h-full cursor-crosshair select-none"
              style={{ aspectRatio: size ? `${size.w / size.h}` : "16 / 9", width: size && size.w / size.h < 1 ? undefined : "100%", height: size && size.w / size.h < 1 ? "100%" : undefined, touchAction: "none", boxShadow: `0 0 0 1.5px ${color}` }}
              onPointerDown={e => {
                if (e.button > 0) return;
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                const a = pos(e);
                dragRef.current = { id: e.pointerId, a };
                setDraft({ a, b: a });
              }}
              onPointerMove={e => { const d = dragRef.current; if (d && d.id === e.pointerId) setDraft({ a: d.a, b: pos(e) }); }}
              onPointerUp={e => {
                const d = dragRef.current;
                if (!d || d.id !== e.pointerId) return;
                dragRef.current = null; setDraft(null);
                const box = boxFromDrag(d.a, pos(e));
                if (box && rangeValid && remaining > 0) {
                  const sourceBox=cropToSource(box,crop);
                  if(sourceBox.width<0.01 || sourceBox.height<0.01) {setAuto({status:"error",progress:0,picked:[],error:"Draw a slightly larger region so it can be blurred reliably."});return;}
                  addBoxes([{ ...sourceBox, start: range.start, end: range.end }]);
                }
              }}
              onPointerCancel={() => { dragRef.current = null; setDraft(null); }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />
              {!size && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-[20px] h-[20px] animate-spin text-[#00B2A9]" /></div>}
              {shownBlurs.map(({ b, i }) => overlay(b, `b${i}`, "border-[2px] border-dashed border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.1)]", `Blur ${i + 1}`))}
              {suggestions.map((b, i) => time >= b.start && time < b.end ? overlay(b, `s${i}`, auto.picked[i] ? "border-[2px] border-[#00B2A9] bg-[rgba(0,178,169,0.18)]" : "border-[2px] border-dotted border-[#FBBF24] bg-[rgba(251,191,36,0.1)]", `Found ${i + 1}`) : null)}
              {draft && <div className="absolute pointer-events-none border-[2px] bg-[rgba(0,178,169,0.15)]" style={{ borderColor: color, left: `${Math.min(draft.a.x, draft.b.x) * 100}%`, top: `${Math.min(draft.a.y, draft.b.y) * 100}%`, width: `${Math.abs(draft.b.x - draft.a.x) * 100}%`, height: `${Math.abs(draft.b.y - draft.a.y) * 100}%` }} />}
            </div>
          </div>
          <label className="block text-[10px] text-[#64748B]">
            <span className="flex justify-between tabular-nums"><span>Scrub source frame</span><span>{fmtTime(time)} / {fmtTime(p.duration)}</span></span>
            <input type="range" aria-label="Scrub source frame" min={0} max={p.duration || 0} step={0.05} value={time} onChange={e => setTime(clamp(Number(e.target.value), 0, p.duration || 0))} className="w-full accent-[#00B2A9] mt-[4px]" />
          </label>
        </div>

        <div className="w-full md:w-[320px] shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.06)] p-[16px] flex flex-col gap-[12px]">
          <Segmented value={target} onChange={(v) => setTarget(v as Target)} options={[{ value: "screen", label: "Screen" }, { value: "speaker", label: "Speaker" }]} />
          {!active && <div className="text-[10px] text-[#FCD34D] leading-[1.45]">Panels are not located yet, so the full source frame is shown.</div>}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]">Blur interval</div>
            <div className="flex gap-[8px]">
              <TimeInput label="From (s)" value={range.start} max={p.duration} onChange={v => setRange(r => ({ ...r, start: v }))} />
              <TimeInput label="Until (s)" value={range.end} max={p.duration} onChange={v => setRange(r => ({ ...r, end: v }))} />
            </div>
            <div className="flex gap-[6px] mt-[6px]">
              <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setRange(r => ({ ...r, start: round3(time) }))}>From frame</button>
              <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setRange(r => ({ ...r, end: round3(time) }))}>Until frame</button>
            </div>
            {!rangeValid && <div className="text-[10px] text-[#F87171] mt-[5px]">Interval must end after it starts.</div>}
          </div>
          <div className="flex items-center gap-[6px] text-[10px] text-[#94A3B8]"><Square className="w-[11px] h-[11px]" />Drawn boxes apply to this interval. {remaining > 0 ? `${remaining} of ${MAX_BLURS} slots left.` : "Blur limit reached."}</div>

          <div className="pt-[12px] border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-[8px]">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B]">Auto blur personal details</div>
            <div className="flex gap-[6px] p-[8px] rounded-[10px] bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.18)] text-[10px] text-[#FCD34D] leading-[1.45]">
              <AlertTriangle className="w-[12px] h-[12px] shrink-0 mt-[1px]" />
              Detection samples frames in this interval and can miss names, emails or numbers. Scrub through and review every frame before export. Nothing is added until you accept it.
            </div>
            <button type="button" data-testid="button-auto-blur" disabled={auto.status === "running" || !rangeValid} onClick={() => void runAuto()} className={ghostBtn}>
              {auto.status === "running" ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <ScanSearch className="w-[11px] h-[11px]" />}
              Scan {target} for personal details
            </button>
            {auto.status === "running" && <><ProgressBar value={auto.progress} label={auto.phase || "Sampling frames"} /><button type="button" className={ghostBtn} onClick={() => { abortRef.current?.abort(); setAuto({ status: "idle", progress: 0, picked: [] }); }}>Stop waiting</button></>}
            {auto.status === "error" && <ErrorNote message={auto.error ?? "Detection failed."} onRetry={() => void runAuto()} />}
            {auto.status === "done" && auto.result && (
              <div className="flex flex-col gap-[6px]">
                <div className="text-[10px] text-[#94A3B8] leading-[1.45]">{auto.result.sampledFrames} frames sampled. {auto.result.note}</div>
                {suggestions.length === 0 && <div className="text-[10px] text-[#64748B]">No details found in the sampled frames. That is not a guarantee; check manually.</div>}
                {suggestions.map((b, i) => (
                  <label key={i} className="flex items-center gap-[8px] text-[11px] text-[#CBD5E1] cursor-pointer">
                    <input type="checkbox" className="accent-[#00B2A9]" checked={!!auto.picked[i]} onChange={e => setAuto(a => ({ ...a, picked: a.picked.map((x, j) => j === i ? e.target.checked : x) }))} />
                    <button type="button" className="text-left hover:text-[#00B2A9]" onClick={() => setTime(b.start)}>Found {i + 1}</button>
                    <span className="ml-auto text-[10px] text-[#64748B] tabular-nums">{fmtTime(b.start)}-{fmtTime(b.end)}</span>
                  </label>
                ))}
                {suggestions.length > 0 && <>
                  <button type="button" className="self-start text-[10px] text-[#00B2A9]" onClick={() => setAuto(a => ({ ...a, picked: a.picked.map(() => true) }))}>Select all</button>
                  {pickedCount > remaining && <div className="text-[10px] text-[#F87171]">Only {Math.max(0, remaining)} more blur regions fit. Deselect some.</div>}
                  <button type="button" data-testid="button-accept-detected" disabled={!pickedCount || pickedCount > remaining} className={primaryBtn}
                    onClick={() => { addBoxes(suggestions.filter((_, i) => auto.picked[i]).map(b => ({ x: round3(b.x), y: round3(b.y), width: round3(Math.min(1-round3(b.x),b.width)), height: round3(Math.min(1-round3(b.y),b.height)), start: round3(b.start), end: round3(b.end) }))); setAuto({ status: "idle", progress: 0, picked: [] }); }}>
                    <Check className="w-[13px] h-[13px]" />Add {pickedCount} reviewed region{pickedCount === 1 ? "" : "s"}
                  </button>
                  <div className="text-[10px] text-[#475569]">Accepted regions are added alongside your manual blurs, never replacing them.</div>
                </>}
              </div>
            )}
          </div>
          <button type="button" onClick={p.onClose} className={`${ghostBtn} mt-auto`}>Done</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
