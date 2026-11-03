import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { boxFromDrag, captionAt, clamp, round3, type SplitLayout, fitCrop, nextPlayableTime, normalizedPoint, type BlurBox, type Point, type CaptionTiming, type TimedText, type VideoEdits } from "./edits";

interface Props {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  edits: VideoEdits;
  captions: TimedText[];
  timing: CaptionTiming;
  time: number;
  sourceSize: { width: number; height: number } | null;
  drawing: boolean;
  selectedBlur: number | null;
  onTime: (t: number) => void;
  onPlaying: (p: boolean) => void;
  onLoaded: (info: { duration: number; width: number; height: number }) => void;
  onError: (msg: string | null) => void;
  onDrawBox: (box: Pick<BlurBox, "x" | "y" | "width" | "height">) => void;
  onSelectBlur: (i: number) => void;
  /** Split only: hand-drag repositioning of a half. Called on every pointer move. */
  onSplitChange?: (split: SplitLayout) => void;
  /** Vertical only: show the full original frame (for blur drawing / bounds checking) instead of the split. */
  sourceView?: boolean;
  /** Vertical without split: status shown instead of a squeezed full frame. */
  layoutStatus?: ReactNode;
}

/** Output-frame preview. Captions mirror the render style; blur regions are outlined, not faked. */
export function VideoStage(p: Props) {
  const { videoRef, edits } = p;
  const editsRef = useRef(edits);
  editsRef.current = edits;
  const onTimeRef = useRef(p.onTime);
  onTimeRef.current = p.onTime;
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  // Drag lives in a ref so pointerup never reads a stale render's corners.
  const dragRef = useRef<{ id: number; a: Point; b: Point } | null>(null);
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null);
  const onDrawBoxRef = useRef(p.onDrawBox);
  onDrawBoxRef.current = p.onDrawBox;
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const retriedRef = useRef(false);
  useEffect(() => { retriedRef.current = false; }, [p.src]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vertical = edits.format === "vertical";
  const sourceMode = vertical && (!!p.sourceView || p.drawing);
  const splitMode = vertical && !sourceMode && !!edits.split;
  const locating = vertical && !sourceMode && !edits.split;
  const splitModeRef = useRef(splitMode);
  splitModeRef.current = splitMode;

  // One decoder: the hidden <video> is painted into two canvas halves.
  const draw = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current, split = editsRef.current.split;
    if (!splitModeRef.current || !v || !c || !split || !v.videoWidth || v.readyState < 2) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(2, Math.round(rect.width * dpr)), H = Math.max(2, Math.round(rect.height * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#030B17";
    ctx.fillRect(0, 0, W, H);
    const half = Math.round(H / 2);
    const paint = (r: { x: number; y: number; width: number; height: number }, top: number, h: number, mode: "contain" | "cover", scale = 1, pan?: { x: number; y: number }) => {
      const sx = r.x * v.videoWidth, sy = r.y * v.videoHeight, sw = r.width * v.videoWidth, sh = r.height * v.videoHeight;
      if (sw < 1 || sh < 1) return;
      const f = fitCrop(sw, sh, W, h, mode);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
      ctx.translate(W / 2 + (pan?.x ?? 0) * W, top + h / 2 + (pan?.y ?? 0) * h);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -(top + h / 2));
      try { ctx.drawImage(v, sx + f.sx, sy + f.sy, f.sw, f.sh, f.dx, top + f.dy, f.dw, f.dh); } catch { /* frame not ready */ }
      ctx.restore();
    };
    paint(split.screen, 0, half, "contain", split.screenScale, split.screenPan);
    paint(split.speaker, half, H - half, "cover", split.speakerScale, split.speakerPan);
  }, [videoRef]);

  // Single place that enforces trim/cuts, only while genuinely playing and not mid-seek.
  const enforce = useCallback((v: HTMLVideoElement) => {
    if (v.paused || v.seeking || v.ended) return;
    const next = nextPlayableTime(editsRef.current, v.currentTime);
    if (next === null) { v.pause(); return; }
    if (next - v.currentTime > 0.05) v.currentTime = next;
  }, []);
  // Timer, not rAF: rAF is throttled inside the workspace iframe.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (v) { enforce(v); onTimeRef.current(v.currentTime); }
      draw();
    }, 33);
    return () => window.clearInterval(id);
  }, [playing, videoRef, draw, enforce]);

  // Repaint when paused and the layout, bounds or stage size change.
  const splitKey = JSON.stringify(edits.split ?? null);
  useEffect(() => { draw(); }, [splitMode, splitKey, draw]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !splitMode) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(c);
    return () => ro.disconnect();
  }, [splitMode, draw]);

  const srcAspect = p.sourceSize ? p.sourceSize.width / p.sourceSize.height : 16 / 9;
  const frameAspect = sourceMode ? srcAspect : vertical ? 9 / 16 : 16 / 9;
  const tall = frameAspect < 1;
  const widthBound = srcAspect >= frameAspect;
  const caption = captionAt(p.captions, p.time, p.timing, edits);
  const activeBlurs = edits.blurs.map((b, i) => ({ b, i })).filter(({ b, i }) => (p.time >= b.start && p.time < b.end) || i === p.selectedBlur);

  const pos = (e: { clientX: number; clientY: number }) => normalizedPoint(e.clientX, e.clientY, mediaRef.current!.getBoundingClientRect());
  const finishDrag = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const box = commit ? boxFromDrag(d.a, pos(e)) : null;
    if (box) onDrawBoxRef.current(box);
  };
  // Hand-drag repositioning of split halves. Writes pan on every move; never seeks.
  const onSplitChangeRef = useRef(p.onSplitChange);
  onSplitChangeRef.current = p.onSplitChange;
  const panDragRef = useRef<{ id: number; panel: "screen" | "speaker"; sx: number; sy: number; start: { x: number; y: number }; w: number; h: number } | null>(null);
  const [panDragging, setPanDragging] = useState<"screen" | "speaker" | null>(null);
  const onPanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const split = editsRef.current.split;
    if (e.button > 0 || !split || !onSplitChangeRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const panel = e.clientY - rect.top < rect.height / 2 ? "screen" : "speaker";
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    videoRef.current?.pause();
    const cur = split[panel === "screen" ? "screenPan" : "speakerPan"] ?? { x: 0, y: 0 };
    panDragRef.current = { id: e.pointerId, panel, sx: e.clientX, sy: e.clientY, start: { ...cur }, w: rect.width, h: rect.height / 2 };
    setPanDragging(panel);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = panDragRef.current, split = editsRef.current.split;
    if (!d || d.id !== e.pointerId || !split) return;
    const pan = { x: round3(clamp(d.start.x + (e.clientX - d.sx) / d.w, -1, 1)), y: round3(clamp(d.start.y + (e.clientY - d.sy) / d.h, -1, 1)) };
    const next = { ...split, [d.panel === "screen" ? "screenPan" : "speakerPan"]: pan };
    editsRef.current = { ...editsRef.current, split: next };
    onSplitChangeRef.current?.(next);
    draw();
  };
  const onPanUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = panDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    panDragRef.current = null;
    setPanDragging(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Same-origin frame snapshot used as poster so session thumbnails are never a black video.
  const snapshot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    try {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight));
      c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      setPoster(c.toDataURL("image/jpeg", 0.8));
    } catch { /* tainted or not ready; keep previous poster */ }
  };

  return (
    <div className="flex flex-col items-center gap-[12px] w-full h-full min-h-0">
      <div
        data-session-preview
        className="relative overflow-hidden bg-[#030B17] shadow-[0_16px_60px_rgba(0,0,0,0.4)] rounded-[6px] max-h-full max-w-full"
        style={{ aspectRatio: `${frameAspect}`, height: tall ? "100%" : undefined, width: tall ? undefined : "100%", containerType: "inline-size" }}
      >
        {!vertical && edits.framing === "blur-fill" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(40,150,251,0.18),rgba(3,11,23,0.95)_70%)]">
            <span className="absolute top-[8px] left-[8px] text-[9px] font-semibold uppercase tracking-[1px] text-[rgba(255,255,255,0.45)] bg-[rgba(0,0,0,0.35)] rounded-[4px] px-[6px] py-[2px]">Blurred fill added in render</span>
          </div>
        )}
        <div
          ref={mediaRef}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${p.drawing ? "cursor-crosshair" : ""} ${splitMode || locating ? "opacity-0 pointer-events-none" : ""}`}
          aria-hidden={splitMode || locating ? true : undefined}
          style={{ aspectRatio: `${srcAspect}`, width: widthBound ? "100%" : undefined, height: widthBound ? undefined : "100%", touchAction: p.drawing ? "none" : undefined }}
          onPointerDown={e => {
            if (!p.drawing || e.button > 0) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            const a = pos(e);
            dragRef.current = { id: e.pointerId, a, b: a };
            setDraft({ a, b: a });
          }}
          onPointerMove={e => {
            const d = dragRef.current;
            if (!d || d.id !== e.pointerId) return;
            d.b = pos(e);
            setDraft({ a: d.a, b: d.b });
          }}
          onPointerUp={e => finishDrag(e, true)}
          onPointerCancel={e => finishDrag(e, true)}
          onDragStart={e => e.preventDefault()}
        >
          <video
            ref={videoRef}
            src={p.src}
            className="w-full h-full block pointer-events-none"
            playsInline
            preload="auto"
            poster={poster}
            onPlay={() => { setPlaying(true); p.onPlaying(true); }}
            onPause={() => { setPlaying(false); p.onPlaying(false); }}
            onSeeked={e => { p.onTime(e.currentTarget.currentTime); if (e.currentTarget.paused) snapshot(); draw(); }}
            onLoadedData={() => { p.onError(null); snapshot(); draw(); }}
            onCanPlay={() => p.onError(null)}
            onTimeUpdate={e => {
              const v = e.currentTarget;
              enforce(v);
              p.onTime(v.currentTime);
              draw();
            }}
            onLoadedMetadata={e => { p.onError(null); p.onLoaded({ duration: e.currentTarget.duration, width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight }); }}
            onError={e => {
              const v = e.currentTarget, err = v.error;
              // One quiet retry: transient range/network aborts must not show a false failure.
              if (!retriedRef.current && err?.code !== 4) { retriedRef.current = true; const t = v.currentTime; v.load(); v.currentTime = t; return; }
              const reason = "The video preview could not play. Retry the preview from the source panel; your original and edits are safe.";
              p.onError(`${reason}${err?.message ? ` (${err.message})` : ""}`);
            }}
          />
          {activeBlurs.map(({ b, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => p.onSelectBlur(i)}
              className={`absolute border-[2px] border-dashed rounded-[3px] ${i === p.selectedBlur ? "border-[#2896FB] bg-[rgba(40,150,251,0.18)]" : "border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.08)]"} ${p.drawing ? "pointer-events-none" : ""}`}
              style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.width * 100}%`, height: `${b.height * 100}%` }}
              aria-label={`Blur region ${i + 1}`}
            >
              <span className="absolute -top-[18px] left-0 text-[9px] font-semibold text-white bg-[rgba(3,11,23,0.8)] rounded-[3px] px-[4px] whitespace-nowrap">Blur {i + 1}</span>
            </button>
          ))}
          {sourceMode && edits.split && ([["screen", edits.split.screen, "#2896FB"], ["speaker", edits.split.speaker, "#00B2A9"]] as const).map(([k, r, c]) => (
            <div key={k} className="absolute pointer-events-none border-[1.5px] rounded-[2px]" style={{ borderColor: c, left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }}>
              <span className="absolute bottom-[3px] right-[3px] text-[9px] font-semibold uppercase tracking-[0.8px] text-white rounded-[3px] px-[4px]" style={{ background: c }}>{k}</span>
            </div>
          ))}
          {draft && (
            <div className="absolute pointer-events-none border-[2px] border-[#00B2A9] bg-[rgba(0,178,169,0.15)]" style={{ left: `${Math.min(draft.a.x, draft.b.x) * 100}%`, top: `${Math.min(draft.a.y, draft.b.y) * 100}%`, width: `${Math.abs(draft.b.x - draft.a.x) * 100}%`, height: `${Math.abs(draft.b.y - draft.a.y) * 100}%` }} />
          )}
        </div>
        {splitMode && (
          <>
            <canvas ref={canvasRef} data-testid="canvas-split-preview" className="absolute inset-0 w-full h-full pointer-events-none" />
            <div
              data-testid="split-drag-surface"
              className={`absolute inset-0 select-none ${panDragging ? "cursor-grabbing" : p.onSplitChange ? "cursor-grab" : ""}`}
              style={{ touchAction: "none" }}
              onPointerDown={onPanDown} onPointerMove={onPanMove} onPointerUp={onPanUp} onPointerCancel={onPanUp}
              onDragStart={e => e.preventDefault()}
            >
              {(["screen", "speaker"] as const).map(k => (
                <div key={k} className={`absolute left-0 right-0 h-1/2 pointer-events-none transition-opacity duration-150 ${k === "screen" ? "top-0" : "top-1/2"} ${panDragging === k ? "opacity-100" : "opacity-0"}`}
                  style={{ boxShadow: `inset 0 0 0 2px ${k === "screen" ? "#2896FB" : "#00B2A9"}` }}>
                  <span className="absolute top-[6px] right-[6px] text-[9px] font-semibold uppercase tracking-[0.8px] text-white rounded-[3px] px-[5px] py-[1px]" style={{ background: k === "screen" ? "#2896FB" : "#00B2A9" }}>Moving {k}</span>
                </div>
              ))}
            </div>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />
          </>
        )}
        {locating && (
          <div data-testid="status-locating-panels" className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] p-[18px] text-center bg-[#030B17]">
            <div className="w-full flex-1 rounded-[4px] border border-dashed border-[rgba(40,150,251,0.25)] flex items-end justify-start p-[6px]"><span className="text-[9px] uppercase tracking-[1px] text-[rgba(40,150,251,0.6)] font-semibold">Screen</span></div>
            <div className="text-[11px] text-[#94A3B8] leading-[1.45] max-w-[90%]">{p.layoutStatus}</div>
            <div className="w-full flex-1 rounded-[4px] border border-dashed border-[rgba(0,178,169,0.25)] flex items-end justify-start p-[6px]"><span className="text-[9px] uppercase tracking-[1px] text-[rgba(0,178,169,0.6)] font-semibold">Speaker</span></div>
          </div>
        )}
        {sourceMode && <span className="absolute top-[8px] left-[8px] text-[9px] font-semibold uppercase tracking-[1px] text-[rgba(255,255,255,0.7)] bg-[rgba(3,11,23,0.7)] rounded-[4px] px-[6px] py-[2px] pointer-events-none">Original source view</span>}
        {caption && !locating && !sourceMode && (
          <div className="absolute left-[6%] right-[6%] text-center pointer-events-none font-['Poppins'] font-bold text-white leading-[1.25]" style={{ bottom: edits.format === "vertical" ? `${(edits.captionBottom ?? 0.04) * 100}%` : "9%", fontSize: edits.format === "vertical" ? "6.2cqw" : "3.6cqw", textShadow: "0 2px 6px rgba(0,0,0,0.85)" }}>
            {caption.words.map((w, i) => (
              <span key={`${w.start}-${i}`} className="inline-block mx-[0.12em] px-[0.14em] rounded-[0.18em]" style={i === caption.activeIndex ? { background: "#1AA3F0", textShadow: "none" } : undefined}>{w.text}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
