import { useState, useRef, useCallback, useLayoutEffect, type RefObject } from "react";
import { UploadCloud, X, Loader2, Download, Check, ZoomIn, RefreshCw } from "lucide-react";
import { toPng } from "html-to-image";
import { addExport, createThumbnail } from "./exportStore";
import { LivePreview } from "./LivePreview";

const BASE = import.meta.env.BASE_URL;
const SWOOSH = `${BASE}assets/swoosh/swoosh-highly.png`;

// Canvas is exactly 1920x1080 per spec.
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CANVAS_RATIO = CANVAS_W / CANVAS_H;

// Persisted state helper (same pattern as MasterClassWorkspace). The version
// suffix is bumped whenever defaults change so existing users get the new
// defaults instead of stale localStorage values.
function usePersistedState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const STORAGE_KEY = `brandEngine.swooshBackground.v9.${key}`;
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });
  const setAndPersist: (v: T | ((prev: T) => T)) => void = (next) => {
    setV((prev) => {
      const nv = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nv));
      } catch {
        /* ignore quota errors */
      }
      return nv;
    });
  };
  return [v, setAndPersist];
}

// Fit a child to its parent while preserving the canvas aspect ratio.
function useFitParent(ref: RefObject<HTMLDivElement | null>, ratio: number) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const update = () => {
      const cs = getComputedStyle(parent);
      const pw = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ph = parent.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (pw <= 0 || ph <= 0) return;
      let w: number;
      let h: number;
      if (pw / ph > ratio) {
        h = ph;
        w = ph * ratio;
      } else {
        w = pw;
        h = pw / ratio;
      }
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [ref, ratio]);
}

interface SwooshSettings {
  x: number; // % offset from center, -50..+50
  y: number; // % offset from center, -50..+50
  scale: number; // height as a fraction of canvas height, 0.3..1.6 (asset is portrait)
}

interface HumanSettings {
  x: number; // % offset from center, -50..+50
  y: number; // % offset from center, -50..+50
  scale: number; // height as a fraction of canvas height, 0.3..1.4
}

// Defaults tuned to match the supplied reference: the person is on the FAR
// RIGHT (face dominant, top-of-head near top of canvas) and the swoosh forms
// a tight oval wrapping her LOWER body, with the Highly robot sitting just
// to the upper-right of her head.
// Swoosh sized to fully fit inside the 1920×1080 canvas with no cropping.
// The asset is portrait (~786×1024) and styled by HEIGHT only, so scale 1.0
// = 100% of canvas height; width then auto-scales to ~830px which fits
// horizontally with room to spare. x/y both 0 = perfectly centered.
const DEFAULT_SWOOSH: SwooshSettings = { x: 0, y: 0, scale: 1.0 };
// Human is anchored at the TOP of the canvas (head at top) so a full-body
// upload always shows head→chest→waist clearly within the visible region.
const DEFAULT_HUMAN: HumanSettings = { x: 28, y: 0, scale: 1.0 };

// The lower 25% of the canvas is clipped away from the human only — that's
// the visual line where the swoosh's bottom curve sits, so anything below
// it (waist→legs) disappears, leaving the person looking like they're
// emerging from inside the swoosh.
const HUMAN_BOTTOM_CLIP = "inset(0% 0% 25% 0%)";

// The asset is a single image containing the swoosh trail AND the Highly
// robot at the top-right end. To make the trail "wrap around" the human, we
// render the asset twice: a full back copy behind the human, then a clipped
// front copy on top. The front copy shows only the lower portion of the asset
// (the front-of-curve sweep) so the woman's face/upper body stay clean.
// Inset(top right bottom left) — keep the bottom 48% only.
const FRONT_CLIP = "inset(52% 0% 0% 0%)";

function SwooshComposition({
  personImage,
  swoosh,
  human,
  onHumanChange,
  exporting,
}: {
  personImage: string | null;
  swoosh: SwooshSettings;
  human: HumanSettings;
  onHumanChange?: (next: HumanSettings) => void;
  // When exporting, suppress the drag UI (cursor, pointer-events) so the
  // resulting PNG looks identical regardless of hover state.
  exporting?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFitParent(containerRef, CANVAS_RATIO);

  // Drag-to-position state. We capture the pointer on mousedown over the
  // human image, then translate every pointermove into a delta on
  // human.x / human.y in canvas-percentage units.
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; pointerId: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!onHumanChange || !containerRef.current) return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: human.x,
      baseY: human.y,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current || !onHumanChange || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dxPct = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    // Free drag in every direction — user has full control.
    onHumanChange({
      ...human,
      x: dragRef.current.baseX + dxPct,
      y: dragRef.current.baseY + dyPct,
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current) return;
    try {
      (e.currentTarget as Element).releasePointerCapture(dragRef.current.pointerId);
    } catch {
      /* pointer may already be released */
    }
    dragRef.current = null;
  };

  // Common positioning style for both swoosh copies. The asset is portrait,
  // so we size it by HEIGHT relative to the canvas (with width auto) — that
  // keeps the robot at the asset's top-right within view at sensible scales.
  // Anchored by translate(-50%, -50%) for predictable center positioning.
  const swooshStyle: React.CSSProperties = {
    position: "absolute",
    left: `${50 + swoosh.x}%`,
    top: `${50 + swoosh.y}%`,
    height: `${swoosh.scale * 100}%`,
    width: "auto",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    userSelect: "none",
    imageRendering: "auto",
  };

  // Human position is driven by free-hand drag — both X and Y are fully
  // free, no clamps. Default y=0 anchors the head to the canvas top; from
  // there the user can drag anywhere they want.
  const draggable = !!onHumanChange && !exporting;
  const humanStyle: React.CSSProperties = {
    position: "absolute",
    left: `${50 + human.x}%`,
    top: `${human.y}%`,
    height: `${human.scale * 100}%`,
    transform: "translateX(-50%)",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: draggable ? "auto" : "none",
    cursor: draggable ? (dragRef.current ? "grabbing" : "grab") : "default",
    touchAction: "none",
  };

  // In the live preview the canvas allows overflow on the TOP so the user
  // can drag the head above the visible frame without it being chopped by
  // the canvas edge. During export we re-enable overflow:hidden so the
  // captured PNG is exactly the 1920×1080 canvas.
  // The wrapper that holds the human uses a clip-path with a very large
  // negative top inset to mirror this — the bottom 25% mask is preserved
  // so the swoosh still occludes the lower body, but the top of the image
  // can extend far above the canvas top.
  const canvasOverflow = exporting ? "hidden" : "visible";
  const humanWrapperClip = exporting
    ? HUMAN_BOTTOM_CLIP
    : "inset(-9999px 0% 25% 0%)";
  return (
    <div
      ref={containerRef}
      data-template-id="swoosh-bg"
      style={{
        position: "relative",
        overflow: canvasOverflow,
        // Transparent — the downloadable PNG is just the swoosh + human with
        // alpha so users can drop it onto any background of their choice.
        backgroundColor: "transparent",
      }}
    >
      {/* Layer 1: back swoosh — full asset behind the human */}
      <img src={SWOOSH} alt="" draggable={false} style={swooshStyle} crossOrigin="anonymous" />

      {/* Layer 2: human cutout (uploaded, bg-removed). Wrapped in a
          clip-path container that masks anything below the swoosh's lower
          curve so the person looks like they're rising out of the swoosh.
          In preview the wrapper allows top overflow via a -9999px top
          inset, so the head can be dragged above the canvas without
          being chopped at the top edge. */}
      {personImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            clipPath: humanWrapperClip,
            WebkitClipPath: humanWrapperClip,
            pointerEvents: "none",
          }}
        >
          <img
            src={personImage}
            alt=""
            draggable={false}
            style={humanStyle}
            crossOrigin="anonymous"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      )}

      {/* Layer 3: front portion of the swoosh — clipped to the lower curve so
          only the section that crosses in front of the human is visible. The
          identical position/scale to the back copy ensures perfect alignment. */}
      <img
        src={SWOOSH}
        alt=""
        draggable={false}
        style={{ ...swooshStyle, clipPath: FRONT_CLIP, WebkitClipPath: FRONT_CLIP }}
        crossOrigin="anonymous"
      />
    </div>
  );
}

export function SwooshBackgroundWorkspace() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Swoosh placement is fixed — only the human + front opacity are tunable.
  const swoosh: SwooshSettings = DEFAULT_SWOOSH;
  const [human, setHuman] = usePersistedState<HumanSettings>("human", DEFAULT_HUMAN);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });

  // After background removal, the PNG retains the source photo's full
  // canvas — meaning transparent padding wraps the person on every side.
  // That padding becomes ugly empty space above the head when we anchor
  // the image at top:0%. This helper scans the alpha channel, finds the
  // tight bounding box of visible content, and re-renders the image
  // cropped to just that region. Result: the head is flush with the top
  // of the image, and therefore flush with the top of the canvas.
  const autoTrimTransparent = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        let imgData: ImageData;
        try {
          imgData = ctx.getImageData(0, 0, w, h);
        } catch {
          return resolve(dataUrl);
        }
        const data = imgData.data;
        const ALPHA_THRESHOLD = 10; // pixels with alpha <= this count as empty
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const a = data[(y * w + x) * 4 + 3];
            if (a > ALPHA_THRESHOLD) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0 || maxY < 0) return resolve(dataUrl); // fully transparent
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        if (cropW === w && cropH === h) return resolve(dataUrl); // nothing to trim
        const out = document.createElement("canvas");
        out.width = cropW;
        out.height = cropH;
        const outCtx = out.getContext("2d");
        if (!outCtx) return resolve(dataUrl);
        outCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(out.toDataURL("image/png"));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      setIsRemovingBg(true);
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(src, { output: { format: "image/png" } });
        // Store as a data URL (NOT a blob: URL) — html-to-image's CORS path
        // can't read blob URLs cleanly and the export fails.
        const rawDataUrl = await blobToDataUrl(blob);
        // Crop away the transparent padding so the person fills the bbox
        // and the head ends up flush with the image's top edge.
        const trimmed = await autoTrimTransparent(rawDataUrl);
        setPersonImage(trimmed);
      } catch {
        setPersonImage(src);
      } finally {
        setIsRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/png";
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }, []);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  }, []);

  const exportPNG = useCallback(async () => {
    const root = previewRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-template-id="swoosh-bg"]`) as HTMLElement | null;
    if (!el) return;
    setIsExporting(true);
    // Strip the outer frame's border-radius for a clean rectangular PNG.
    const origRadius = el.style.borderRadius;
    el.style.borderRadius = "0";
    try {
      const dataUrl = await toPng(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        pixelRatio: CANVAS_W / el.offsetWidth,
        cacheBust: true,
        skipAutoScale: true,
        // Skip @font-face fetching — we don't render any text in this
        // composition, so font CSS is irrelevant and would only risk a
        // CORS-related abort during export.
        skipFonts: true,
        // Transparent PNG so the swoosh + human can be dropped onto any bg.
        backgroundColor: "transparent",
        style: { borderRadius: "0", backgroundColor: "transparent" },
      });
      const blob = dataUrlToBlob(dataUrl);
      const filename = `Swoosh_Background_${CANVAS_W}x${CANVAS_H}.png`;
      triggerDownload(blob, filename);
      createThumbnail(dataUrl).then((thumb) =>
        addExport({ name: filename, source: "Swoosh Background", format: "png", thumbnail: thumb, dimensions: `${CANVAS_W}x${CANVAS_H}` }),
      );
    } catch (err) {
      const anyErr = err as { message?: string; stack?: string; target?: { src?: string } };
      const failedSrc = anyErr?.target?.src;
      console.error(
        "SwooshBackground export error:",
        anyErr?.message || (failedSrc ? `failed loading: ${failedSrc}` : String(err)),
        anyErr?.stack || "",
      );
    } finally {
      el.style.borderRadius = origRadius;
      setIsExporting(false);
    }
  }, [dataUrlToBlob, triggerDownload]);

  const labelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]";
  const sectionLabelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#94A3B8] mb-[8px]";
  const sliderCls = "flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {/* Form panel */}
      <div className="w-full md:w-[340px] md:min-w-[340px] overflow-y-auto pt-[20px] px-[16px] md:px-[24px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="mb-[16px]">
          <h2 className="text-[16px] font-bold text-white mb-[4px]">Swoosh Background</h2>
          <p className="text-[11px] text-[#64748B]">Transparent swoosh + speaker overlay. Drop onto any background.</p>
        </div>

        <div className="flex flex-col gap-[16px]">
          {/* Image upload */}
          <div className="flex flex-col">
            <label className={labelCls}>Human Image <span className="text-[#FF6B6B]">*</span></label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {!personImage ? (
              <div
                onClick={() => !isRemovingBg && fileInputRef.current?.click()}
                className="flex flex-col items-center gap-[8px] py-[20px] px-[14px] rounded-[12px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] cursor-pointer transition-all"
              >
                {isRemovingBg ? (
                  <>
                    <Loader2 className="w-[20px] h-[20px] text-[#2896FB] animate-spin" />
                    <div className="text-[10px] font-medium text-[#94A3B8]">Removing background...</div>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-[20px] h-[20px] text-[#64748B]" />
                    <div className="text-[10px] font-medium text-[#94A3B8]">Upload person photo</div>
                    <div className="text-[9px] text-[#475569]">BG will be auto-removed</div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-[12px] border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] overflow-hidden">
                <div className="flex items-center gap-[10px] p-[10px]">
                  <img src={personImage} alt="" className="w-[36px] h-[36px] rounded-[8px] object-contain bg-[rgba(255,255,255,0.04)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[#00B2A9] flex items-center gap-[4px]">
                      <Check className="w-[10px] h-[10px]" /> Image ready
                    </div>
                    <div className="text-[9px] text-[#64748B] mt-[1px]">BG removed</div>
                  </div>
                  <div className="flex items-center gap-[3px] shrink-0">
                    <button onClick={() => fileInputRef.current?.click()} className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#94A3B8] flex items-center justify-center cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all" title="Replace image">
                      <RefreshCw className="w-[10px] h-[10px]" />
                    </button>
                    <button onClick={() => { setPersonImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all" title="Remove image">
                      <X className="w-[10px] h-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Human controls — Scale slider + free-hand drag in the preview.
              X/Y are no longer sliders; users drag the photo directly in
              the live preview to position it anywhere they want. */}
          <div className="flex flex-col rounded-[12px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-[12px]">
            <div className={sectionLabelCls}>Human</div>
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[8px]">
                <ZoomIn className="w-[12px] h-[12px] text-[#64748B] shrink-0" />
                <span className="text-[9px] text-[#64748B] w-[34px] shrink-0">Scale</span>
                <input type="range" min="0.3" max="1.4" step="0.01" value={human.scale} onChange={(e) => setHuman((s) => ({ ...s, scale: parseFloat(e.target.value) }))} className={sliderCls} />
                <span className="text-[9px] text-[#94A3B8] w-[36px] text-right tabular-nums">{Math.round(human.scale * 100)}%</span>
              </div>
              <div className="text-[9px] text-[#64748B] pt-[2px]">Drag the photo in the preview to position it.</div>
            </div>
          </div>

          {/* Reset human positions to defaults */}
          <button
            onClick={() => { setHuman(DEFAULT_HUMAN); }}
            className="text-[10px] text-[#64748B] hover:text-white self-start cursor-pointer bg-transparent border-none p-0 underline-offset-2 hover:underline transition-all"
          >
            Reset positions
          </button>

          <div className="h-[1px] bg-[rgba(255,255,255,0.04)]" />

          {/* Download */}
          <button
            onClick={exportPNG}
            disabled={!personImage || isExporting}
            className="w-full py-[12px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[12px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
            {isExporting ? "Exporting..." : `Download PNG (${CANVAS_W}×${CANVAS_H})`}
          </button>
          {!personImage && (
            <div className="text-[10px] text-[#64748B] text-center">Upload a photo to enable download.</div>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <LivePreview>
          <div className="w-full h-full max-w-[960px] flex items-center justify-center min-h-0" ref={previewRef}>
            <SwooshComposition
              personImage={personImage}
              swoosh={swoosh}
              human={human}
              onHumanChange={setHuman}
              exporting={isExporting}
            />
          </div>
        </LivePreview>
      </div>
    </div>
  );
}

