import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { captionAt, clamp, round3, type SplitLayout, panelPlacement, panLimits, speakerAutoScale, screenWithoutWebcam, PANEL_FIT, SPLIT_TOP, layoutAt, nextPlayableTime, type CaptionTiming, type TimedText, type VideoEdits } from "./edits";

interface Props {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  edits: VideoEdits;
  captions: TimedText[];
  timing: CaptionTiming;
  time: number;
  sourceSize: { width: number; height: number } | null;
  onTime: (t: number) => void;
  onPlaying: (p: boolean) => void;
  onLoaded: (info: { duration: number; width: number; height: number }) => void;
  onError: (msg: string | null) => void;
  /** Hand-drag repositioning of the active layout. sceneIndex null = base split. Called on every pointer move. */
  onSplitChange?: (split: SplitLayout, sceneIndex: number | null) => void;
  /** Vertical without split: status shown instead of a squeezed full frame. */
  layoutStatus?: ReactNode;
}

/** Output-frame preview. Captions mirror the render style. Blurs are export-only and never drawn here. */
export function VideoStage(p: Props) {
  const { videoRef, edits } = p;
  const editsRef = useRef(edits);
  editsRef.current = edits;
  const onTimeRef = useRef(p.onTime);
  onTimeRef.current = p.onTime;
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const retriedRef = useRef(false);
  useEffect(() => { retriedRef.current = false; }, [p.src]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vertical = edits.format === "vertical";
  const active = vertical ? layoutAt(edits, p.time) : null;
  const splitMode = vertical && !!active;
  const locating = vertical && !active;
  const splitModeRef = useRef(splitMode);
  splitModeRef.current = splitMode;

  // One decoder: the hidden <video> is painted into two canvas halves.
  const draw = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    const act = v ? layoutAt(editsRef.current, v.currentTime) : null;
    const split = act?.split;
    if (!splitModeRef.current || !v || !c || !split || !act || !v.videoWidth || v.readyState < 2) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(2, Math.round(rect.width * dpr)), H = Math.max(2, Math.round(rect.height * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#030B17";
    ctx.fillRect(0, 0, W, H);
    const half = Math.round(H * SPLIT_TOP);
    const paint = (r: { x: number; y: number; width: number; height: number }, top: number, h: number, mode: "contain" | "cover", scale = 1, pan?: { x: number; y: number }) => {
      const sx = r.x * v.videoWidth, sy = r.y * v.videoHeight, sw = r.width * v.videoWidth, sh = r.height * v.videoHeight;
      if (sw < 1 || sh < 1) return;
      const zoom=r===split.speaker?speakerAutoScale(sw,sh,W,h,split.speakerShape):1;
      const f = panelPlacement(sw, sh, W, h, mode, scale*zoom, pan);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
      try { ctx.drawImage(v, sx, sy, sw, sh, f.dx, top + f.dy, f.dw, f.dh); } catch { /* frame not ready */ }
      ctx.restore();
    };
    if (act.mode === "speaker") { paint(split.speaker, 0, H, PANEL_FIT.speaker, split.speakerScale, split.speakerPan); return; }
    paint(screenWithoutWebcam(split), 0, half, PANEL_FIT.screen, split.screenScale, split.screenPan);
    paint(split.speaker, half, H - half, PANEL_FIT.speaker, split.speakerScale, split.speakerPan);
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
  const splitKey = JSON.stringify([edits.split ?? null, edits.scenes ?? null, active?.sceneIndex ?? null]);
  useEffect(() => { draw(); }, [splitMode, splitKey, draw]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !splitMode) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(c);
    return () => ro.disconnect();
  }, [splitMode, draw]);

  const srcAspect = p.sourceSize ? p.sourceSize.width / p.sourceSize.height : 16 / 9;
  const frameAspect = vertical ? 9 / 16 : 16 / 9;
  const tall = frameAspect < 1;
  const widthBound = srcAspect >= frameAspect;
  const caption = captionAt(p.captions, p.time, p.timing, edits);
  // Hand-drag repositioning of split halves. Writes pan on every move; never seeks.
  const onSplitChangeRef = useRef(p.onSplitChange);
  onSplitChangeRef.current = p.onSplitChange;
  const panDragRef = useRef<{ id: number; scene: number | null; panel: "screen" | "speaker"; sx: number; sy: number; start: { x: number; y: number }; w: number; h: number; full: boolean } | null>(null);
  const [panDragging, setPanDragging] = useState<"screen" | "speaker" | null>(null);
  const onPanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const act = layoutAt(editsRef.current, videoRef.current?.currentTime ?? 0);
    if (e.button > 0 || !act || !onSplitChangeRef.current) return;
    const split = act.split;
    const rect = e.currentTarget.getBoundingClientRect();
    const full = act.mode === "speaker";
    const panel = !full && e.clientY - rect.top < rect.height * SPLIT_TOP ? "screen" : "speaker";
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    videoRef.current?.pause();
    const v0 = videoRef.current, r0 = panel==="screen"?screenWithoutWebcam(split):split.speaker;
    const ph=full?rect.height:rect.height*(panel==="screen"?SPLIT_TOP:1-SPLIT_TOP);
    const zoom=v0 && panel==="speaker"?speakerAutoScale(r0.width*v0.videoWidth,r0.height*v0.videoHeight,rect.width,ph,split.speakerShape):1;
    const lim0 = v0 && v0.videoWidth ? panLimits(r0.width * v0.videoWidth, r0.height * v0.videoHeight, rect.width, ph, PANEL_FIT[panel], (split[panel === "screen" ? "screenScale" : "speakerScale"]??1)*zoom) : { x: 1, y: 1 };
    const raw = split[panel === "screen" ? "screenPan" : "speakerPan"] ?? { x: 0, y: 0 };
    const cur = { x: clamp(raw.x, -lim0.x, lim0.x), y: clamp(raw.y, -lim0.y, lim0.y) };
    panDragRef.current = { id: e.pointerId, scene: act.sceneIndex, panel, sx: e.clientX, sy: e.clientY, start: { ...cur }, w: rect.width, h: full ? rect.height : rect.height * (panel === "screen" ? SPLIT_TOP : 1 - SPLIT_TOP), full };
    setPanDragging(panel);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = panDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const cur = editsRef.current;
    const split = d.scene === null ? cur.split : cur.scenes?.[d.scene]?.split;
    if (!split) return;
    const v = videoRef.current, r = d.panel==="screen"?screenWithoutWebcam(split):split.speaker;
    const zoom=v && d.panel==="speaker"?speakerAutoScale(r.width*v.videoWidth,r.height*v.videoHeight,d.w,d.h,split.speakerShape):1;
    const lim = v && v.videoWidth ? panLimits(r.width * v.videoWidth, r.height * v.videoHeight, d.w, d.h, PANEL_FIT[d.panel], (split[d.panel === "screen" ? "screenScale" : "speakerScale"]??1)*zoom) : { x: 1, y: 1 };
    const pan = { x: round3(clamp(d.start.x + (e.clientX - d.sx) / d.w, -lim.x, lim.x)), y: round3(clamp(d.start.y + (e.clientY - d.sy) / d.h, -lim.y, lim.y)) };
    const next = { ...split, [d.panel === "screen" ? "screenPan" : "speakerPan"]: pan };
    editsRef.current = d.scene === null ? { ...cur, split: next } : { ...cur, scenes: (cur.scenes ?? []).map((sc, i) => i === d.scene ? { ...sc, split: next } : sc) };
    onSplitChangeRef.current?.(next, d.scene);
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
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${splitMode || locating ? "opacity-0 pointer-events-none" : ""}`}
          aria-hidden={splitMode || locating ? true : undefined}
          style={{ aspectRatio: `${srcAspect}`, width: widthBound ? "100%" : undefined, height: widthBound ? undefined : "100%" }}
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
                <div key={k} className={`absolute left-0 right-0 pointer-events-none transition-opacity duration-150 ${active?.mode === "speaker" ? "top-0 h-full" : k === "screen" ? "top-0 h-[30%]" : "top-[30%] h-[70%]"} ${panDragging === k ? "opacity-100" : "opacity-0"}`}
                  style={{ boxShadow: `inset 0 0 0 2px ${k === "screen" ? "#2896FB" : "#00B2A9"}` }}>
                  <span className="absolute top-[6px] right-[6px] text-[9px] font-semibold uppercase tracking-[0.8px] text-white rounded-[3px] px-[5px] py-[1px]" style={{ background: k === "screen" ? "#2896FB" : "#00B2A9" }}>Moving {k}</span>
                </div>
              ))}
            </div>
            {active?.mode !== "speaker" && <div className="absolute left-0 right-0 top-[30%] h-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />}
            {active?.sceneIndex !== null && active && <span className="absolute top-[8px] left-[8px] text-[9px] font-semibold uppercase tracking-[1px] text-[rgba(255,255,255,0.7)] bg-[rgba(3,11,23,0.7)] rounded-[4px] px-[6px] py-[2px] pointer-events-none">Scene {active.sceneIndex + 1} · {active.mode === "speaker" ? "Speaker only" : "Split"}</span>}
          </>
        )}
        {locating && (
          <div data-testid="status-locating-panels" className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] p-[18px] text-center bg-[#030B17]">
            <div className="w-full flex-[3] rounded-[4px] border border-dashed border-[rgba(40,150,251,0.25)] flex items-end justify-start p-[6px]"><span className="text-[9px] uppercase tracking-[1px] text-[rgba(40,150,251,0.6)] font-semibold">Screen</span></div>
            <div className="text-[11px] text-[#94A3B8] leading-[1.45] max-w-[90%]">{p.layoutStatus}</div>
            <div className="w-full flex-[7] rounded-[4px] border border-dashed border-[rgba(0,178,169,0.25)] flex items-end justify-start p-[6px]"><span className="text-[9px] uppercase tracking-[1px] text-[rgba(0,178,169,0.6)] font-semibold">Speaker</span></div>
          </div>
        )}
        {caption && !locating && (
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
