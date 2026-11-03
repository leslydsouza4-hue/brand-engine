import { useEffect, useRef, useState, type RefObject } from "react";
import { boxFromDrag, captionAt, nextPlayableTime, normalizedPoint, type BlurBox, type Point, type CaptionTiming, type TimedText, type VideoEdits } from "./edits";

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

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const next = nextPlayableTime(editsRef.current, v.currentTime);
        if (next === null) { v.pause(); v.currentTime = editsRef.current.trimStart; }
        else if (Math.abs(next - v.currentTime) > 0.03) v.currentTime = next;
        onTimeRef.current(v.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, videoRef]);

  const frameAspect = edits.format === "vertical" ? 9 / 16 : 16 / 9;
  const srcAspect = p.sourceSize ? p.sourceSize.width / p.sourceSize.height : 16 / 9;
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
        style={{ aspectRatio: `${edits.format === "vertical" ? "9 / 16" : "16 / 9"}`, height: edits.format === "vertical" ? "100%" : undefined, width: edits.format === "vertical" ? undefined : "100%", containerType: "inline-size" }}
      >
        {edits.framing === "blur-fill" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(40,150,251,0.18),rgba(3,11,23,0.95)_70%)]">
            <span className="absolute top-[8px] left-[8px] text-[9px] font-semibold uppercase tracking-[1px] text-[rgba(255,255,255,0.45)] bg-[rgba(0,0,0,0.35)] rounded-[4px] px-[6px] py-[2px]">Blurred fill added in render</span>
          </div>
        )}
        <div
          ref={mediaRef}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${p.drawing ? "cursor-crosshair" : ""}`}
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
            onSeeked={e => { p.onTime(e.currentTarget.currentTime); snapshot(); }}
            onLoadedData={() => { p.onError(null); snapshot(); }}
            onCanPlay={() => p.onError(null)}
            onTimeUpdate={e => {
              const v = e.currentTarget;
              if (!v.paused) {
                const next = nextPlayableTime(editsRef.current, v.currentTime);
                if (next === null) { v.pause(); v.currentTime = editsRef.current.trimStart; }
                else if (Math.abs(next - v.currentTime) > 0.03) v.currentTime = next;
              }
              p.onTime(v.currentTime);
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
          {draft && (
            <div className="absolute pointer-events-none border-[2px] border-[#00B2A9] bg-[rgba(0,178,169,0.15)]" style={{ left: `${Math.min(draft.a.x, draft.b.x) * 100}%`, top: `${Math.min(draft.a.y, draft.b.y) * 100}%`, width: `${Math.abs(draft.b.x - draft.a.x) * 100}%`, height: `${Math.abs(draft.b.y - draft.a.y) * 100}%` }} />
          )}
        </div>
        {caption && (
          <div className="absolute left-[6%] right-[6%] text-center pointer-events-none font-['Poppins'] font-bold text-white leading-[1.25]" style={{ bottom: edits.format === "vertical" ? "16%" : "9%", fontSize: edits.format === "vertical" ? "6.2cqw" : "3.6cqw", textShadow: "0 2px 6px rgba(0,0,0,0.85)" }}>
            {caption.words.map((w, i) => (
              <span key={`${w.start}-${i}`} className="inline-block mx-[0.12em] px-[0.14em] rounded-[0.18em]" style={i === caption.activeIndex ? { background: "#1AA3F0", textShadow: "none" } : undefined}>{w.text}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
