import { useState, useRef, useEffect, useCallback, useLayoutEffect, type RefObject } from "react";
import { UploadCloud, X, Loader2, Download, Check, ZoomIn, RefreshCw } from "lucide-react";
import { toPng } from "html-to-image";
import { addExport, createThumbnail } from "./exportStore";
import { LivePreview } from "./LivePreview";

const BASE = import.meta.env.BASE_URL;
const SWOOSH = `${BASE}assets/swoosh/swoosh-highly.png`;
const SPACE_BG = `${BASE}assets/swoosh/space-bg.png`;

// Two surfaces:
//  - DOWNLOAD: 1080×1350 portrait — transparent PNG of swoosh + human +
//    robot. This is the only exportable asset.
//  - PREVIEW : 1920×1080 landscape — the same composition placed onto the
//    Highly space background on the right-hand side. Display only; not
//    downloadable. Lets users see how the artwork will look in context.
const DOWNLOAD_W = 1080;
const DOWNLOAD_H = 1350;
const PREVIEW_W = 1920;
const PREVIEW_H = 1080;
const PREVIEW_RATIO = PREVIEW_W / PREVIEW_H;

// Persisted state helper (same pattern as MasterClassWorkspace). The version
// suffix is bumped whenever defaults change so existing users get the new
// defaults instead of stale localStorage values.
function usePersistedState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const STORAGE_KEY = `brandEngine.swooshBackground.v12.${key}`;
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
  // Crop insets — fractions of the IMAGE's own dims (0..0.95). Each side
  // independently hides that portion of the image. Used together with the
  // bounding box's edge handles for true cropping (vs. corner-handle scale).
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
}

// Defaults tuned for the 1080×1350 portrait download canvas:
//  - Swoosh: centered, sized to ~70% of canvas height so it leaves
//    comfortable breathing room on all sides instead of filling the
//    entire portrait frame (which felt visually too heavy). At scale
//    0.7 the swoosh renders ~945px tall × ~740px wide inside the
//    1080×1350 canvas.
//  - Human: centered horizontally with head anchored at the top edge,
//    sized to roughly match the swoosh so the face naturally falls
//    inside the swoosh's loop. User can drag freely from there.
const DEFAULT_SWOOSH: SwooshSettings = { x: 0, y: 0, scale: 0.7 };
const DEFAULT_HUMAN: HumanSettings = {
  x: 0,
  y: 0,
  scale: 0.7,
  cropTop: 0,
  cropRight: 0,
  cropBottom: 0,
  cropLeft: 0,
};

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

// A sized frame that fits inside its parent at the given aspect ratio.
// Children fill it absolutely.
function CanvasFrame({ ratio, children, style }: { ratio: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useFitParent(ref, ratio);
  return (
    <div ref={ref} style={{ position: "relative", overflow: "visible", ...style }}>
      {children}
    </div>
  );
}

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
  // No internal sizing — the composition fills its parent absolutely. The
  // parent (CanvasFrame or a portrait wrapper inside the bg preview) is
  // responsible for setting width/height and aspect ratio.

  // Track the loaded human image's natural aspect ratio so we can draw a
  // bounding box that exactly matches its rendered footprint. Defaults to a
  // sensible portrait until the image loads.
  const [humanAspect, setHumanAspect] = useState<number>(0.75);
  // Selection state — the bounding box + handles only appear once the user
  // taps/clicks the human image. Tapping anywhere else on the canvas
  // (background, swoosh, transparent area) deselects and hides the box. This
  // keeps the preview clean by default and only shows editing UI when the
  // user is actively working on the image.
  const [selected, setSelected] = useState(false);
  const onHumanImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalHeight > 0) {
      const ar = img.naturalWidth / img.naturalHeight;
      if (Number.isFinite(ar) && ar > 0) setHumanAspect(ar);
    }
  };

  // Drag-to-position state. We capture the pointer on mousedown over the
  // human image, then translate every pointermove into a delta on
  // human.x / human.y in canvas-percentage units.
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; pointerId: number } | null>(null);

  // Resize state — driven by the corner handles on the bounding box. We
  // compute the pointer's distance from the box center at pointerdown and
  // scale the human proportionally as the pointer moves further/closer.
  const resizeRef = useRef<{
    centerX: number;
    centerY: number;
    baseScale: number;
    startDist: number;
    pointerId: number;
  } | null>(null);

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onHumanChange || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const cr = containerRef.current.getBoundingClientRect();
    const boxHeightPx = cr.height * human.scale;
    const boxWidthPx = boxHeightPx * humanAspect;
    // Box's screen-space top-left:
    const boxLeft = cr.left + cr.width * (50 + human.x) / 100 - boxWidthPx / 2;
    const boxTop = cr.top + cr.height * (human.y / 100);
    const cx = boxLeft + boxWidthPx / 2;
    const cy = boxTop + boxHeightPx / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const startDist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    resizeRef.current = {
      centerX: cx,
      centerY: cy,
      baseScale: human.scale,
      startDist,
      pointerId: e.pointerId,
    };
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || !onHumanChange) return;
    const { centerX, centerY, baseScale, startDist } = resizeRef.current;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const newDist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const ratio = newDist / startDist;
    // Clamp so the user can shrink to a tiny crop or grow well beyond the
    // canvas (for tight head-only crops you may want to scale way up then
    // drag down).
    const next = Math.max(0.1, Math.min(4, baseScale * ratio));
    onHumanChange({ ...human, scale: next });
  };

  const onResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    try {
      (e.currentTarget as Element).releasePointerCapture(resizeRef.current.pointerId);
    } catch {
      /* may already be released */
    }
    resizeRef.current = null;
  };

  // Track the canvas's actual pixel size so we can position the bounding box
  // (and compute crop deltas) in pixel space — needed because the box's
  // position/size depends on both human.x/y/scale AND the asymmetric crop
  // insets, which can't be expressed cleanly in pure CSS percentages alone.
  const [canvasPx, setCanvasPx] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setCanvasPx({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Crop state — driven by the FOUR EDGE handles on the bounding box. Each
  // edge drags inward to add crop on that side, outward to release crop.
  const cropRef = useRef<{
    side: "top" | "right" | "bottom" | "left";
    startX: number;
    startY: number;
    baseTop: number;
    baseRight: number;
    baseBottom: number;
    baseLeft: number;
    pointerId: number;
  } | null>(null);

  const startCropDrag = (
    side: "top" | "right" | "bottom" | "left",
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!onHumanChange) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    cropRef.current = {
      side,
      startX: e.clientX,
      startY: e.clientY,
      baseTop: human.cropTop,
      baseRight: human.cropRight,
      baseBottom: human.cropBottom,
      baseLeft: human.cropLeft,
      pointerId: e.pointerId,
    };
  };

  const onCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropRef.current || !onHumanChange) return;
    const { side, startX, startY, baseTop, baseRight, baseBottom, baseLeft } = cropRef.current;
    const imgH = canvasPx.h * human.scale;
    const imgW = imgH * humanAspect;
    if (imgH <= 0 || imgW <= 0) return;
    let next: HumanSettings = { ...human };
    if (side === "top") {
      const deltaCrop = (e.clientY - startY) / imgH;
      next.cropTop = Math.max(0, Math.min(0.95 - human.cropBottom, baseTop + deltaCrop));
    } else if (side === "bottom") {
      const deltaCrop = -(e.clientY - startY) / imgH;
      next.cropBottom = Math.max(0, Math.min(0.95 - human.cropTop, baseBottom + deltaCrop));
    } else if (side === "left") {
      const deltaCrop = (e.clientX - startX) / imgW;
      next.cropLeft = Math.max(0, Math.min(0.95 - human.cropRight, baseLeft + deltaCrop));
    } else if (side === "right") {
      const deltaCrop = -(e.clientX - startX) / imgW;
      next.cropRight = Math.max(0, Math.min(0.95 - human.cropLeft, baseRight + deltaCrop));
    }
    onHumanChange(next);
  };

  const onCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropRef.current) return;
    try {
      (e.currentTarget as Element).releasePointerCapture(cropRef.current.pointerId);
    } catch {
      /* may already be released */
    }
    cropRef.current = null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!onHumanChange || !containerRef.current) return;
    e.preventDefault();
    // Select the image and prevent the canvas's deselect handler from
    // firing on the same gesture (React events bubble up by default).
    e.stopPropagation();
    setSelected(true);
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
  // The image's own clip-path applies the user-defined crop insets in image
  // space (each value is a fraction of the image's own dims). This is
  // independent of and combines with the wrapper's bottom-curve clip.
  const humanCropClip = `inset(${human.cropTop * 100}% ${human.cropRight * 100}% ${human.cropBottom * 100}% ${human.cropLeft * 100}%)`;
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
    clipPath: humanCropClip,
    WebkitClipPath: humanCropClip,
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
  // Tapping anywhere on the canvas that ISN'T the image (or one of its
  // handles, which stop propagation) hides the bounding box. We only react
  // when there's actually something to deselect to avoid spurious renders.
  const onCanvasPointerDown = () => {
    if (selected) setSelected(false);
  };
  return (
    <div
      ref={containerRef}
      data-template-id="swoosh-bg"
      onPointerDown={draggable ? onCanvasPointerDown : undefined}
      style={{
        position: "absolute",
        inset: 0,
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
            onLoad={onHumanImgLoad}
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

      {/* Layer 4 (preview only, never exported): bounding box overlay
          positioned over the CROPPED visible area of the human image. The
          box itself is pointer-transparent so the inner image's drag still
          works through it. It hosts two kinds of handles:
            • CORNERS (square): proportional resize via human.scale
            • EDGES (rounded bars): true cropping via clip-path inset on
              each side of the image
          Both are hidden during export so they never end up in the PNG. */}
      {personImage && draggable && selected && canvasPx.w > 0 && canvasPx.h > 0 && (() => {
        const imgH = canvasPx.h * human.scale;
        const imgW = imgH * humanAspect;
        const imgLeft = (canvasPx.w * (50 + human.x)) / 100 - imgW / 2;
        const imgTop = (canvasPx.h * human.y) / 100;
        const vLeft = imgLeft + imgW * human.cropLeft;
        const vTop = imgTop + imgH * human.cropTop;
        const vWidth = imgW * (1 - human.cropLeft - human.cropRight);
        const vHeight = imgH * (1 - human.cropTop - human.cropBottom);
        const handleSquare: React.CSSProperties = {
          position: "absolute",
          width: 14,
          height: 14,
          background: "white",
          border: "2px solid #2896FB",
          borderRadius: 3,
          pointerEvents: "auto",
          touchAction: "none",
        };
        const edgeBar: React.CSSProperties = {
          position: "absolute",
          background: "white",
          border: "2px solid #2896FB",
          borderRadius: 3,
          pointerEvents: "auto",
          touchAction: "none",
        };
        return (
          <div
            style={{
              position: "absolute",
              left: `${vLeft}px`,
              top: `${vTop}px`,
              width: `${vWidth}px`,
              height: `${vHeight}px`,
              border: "1.5px dashed rgba(40, 150, 251, 0.9)",
              boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.25)",
              pointerEvents: "none",
              boxSizing: "border-box",
              zIndex: 5,
            }}
          >
            {/* CORNER handles — proportional resize via scale */}
            {([
              { top: -7, left: -7, cursor: "nwse-resize" },
              { top: -7, right: -7, cursor: "nesw-resize" },
              { bottom: -7, left: -7, cursor: "nesw-resize" },
              { bottom: -7, right: -7, cursor: "nwse-resize" },
            ] as const).map((pos, i) => (
              <div
                key={`corner-${i}`}
                style={{ ...handleSquare, ...pos }}
                onPointerDown={onResizePointerDown}
                onPointerMove={onResizePointerMove}
                onPointerUp={onResizePointerUp}
                onPointerCancel={onResizePointerUp}
              />
            ))}

            {/* EDGE handles — true crop on each side. Bars are visually
                distinct (longer/thinner) so users can tell them apart from
                the corner resize handles. */}
            {/* TOP */}
            <div
              style={{
                ...edgeBar,
                top: -6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 28,
                height: 10,
                cursor: "ns-resize",
              }}
              onPointerDown={(e) => startCropDrag("top", e)}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
              onPointerCancel={onCropPointerUp}
            />
            {/* BOTTOM */}
            <div
              style={{
                ...edgeBar,
                bottom: -6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 28,
                height: 10,
                cursor: "ns-resize",
              }}
              onPointerDown={(e) => startCropDrag("bottom", e)}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
              onPointerCancel={onCropPointerUp}
            />
            {/* LEFT */}
            <div
              style={{
                ...edgeBar,
                left: -6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 28,
                cursor: "ew-resize",
              }}
              onPointerDown={(e) => startCropDrag("left", e)}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
              onPointerCancel={onCropPointerUp}
            />
            {/* RIGHT */}
            <div
              style={{
                ...edgeBar,
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 28,
                cursor: "ew-resize",
              }}
              onPointerDown={(e) => startCropDrag("right", e)}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
              onPointerCancel={onCropPointerUp}
            />
          </div>
        );
      })()}
    </div>
  );
}

type ExportKind = "complete" | "swoosh";

export function SwooshBackgroundWorkspace() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  // We track *which* export is in flight so the right button shows a
  // spinner while leaving the other one usable. `null` = idle.
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const isExporting = exportKind !== null;
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

  // Single export pipeline for both downloads. The `kind` selects:
  //   • "complete" → captures the full 1920×1080 preview frame (space bg
  //     + portrait swoosh comp on the right). Solid (non-transparent)
  //     because the space background is already opaque.
  //   • "swoosh"   → captures only the 1080×1350 portrait swoosh comp
  //     (transparent PNG of the swoosh + human cutout, ready to drop
  //     onto any background).
  // Both target distinct DOM nodes via data-template-id and use the
  // matching natural canvas dimensions for pixelRatio + filename.
  const exportPNG = useCallback(async (kind: ExportKind) => {
    const root = previewRef.current;
    if (!root) return;
    const isComplete = kind === "complete";
    const selector = isComplete
      ? `[data-template-id="swoosh-complete"]`
      : `[data-template-id="swoosh-bg"]`;
    const targetW = isComplete ? PREVIEW_W : DOWNLOAD_W;
    const targetH = isComplete ? PREVIEW_H : DOWNLOAD_H;
    const filenamePrefix = isComplete ? "Swoosh_Complete" : "Swoosh_Only";
    const el = root.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    setExportKind(kind);
    // Strip the outer frame's border-radius for a clean rectangular PNG.
    const origRadius = el.style.borderRadius;
    el.style.borderRadius = "0";
    try {
      // Wait one frame so the `exporting` prop propagates and the
      // SwooshComposition switches to its export-mode rendering
      // (handles hidden, overflow clipped) before html-to-image
      // snapshots the DOM.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await toPng(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        pixelRatio: targetW / el.offsetWidth,
        cacheBust: true,
        skipAutoScale: true,
        // Skip @font-face fetching — we don't render any text in this
        // composition, so font CSS is irrelevant and would only risk a
        // CORS-related abort during export.
        skipFonts: true,
        // "swoosh" must stay transparent so it can be dropped onto any
        // bg. "complete" already paints the space background image, so
        // we leave it transparent here too — anything outside the
        // visible content (none, since space-bg fills the frame) just
        // stays transparent harmlessly.
        backgroundColor: "transparent",
        style: { borderRadius: "0", backgroundColor: "transparent" },
      });
      const blob = dataUrlToBlob(dataUrl);
      const filename = `${filenamePrefix}_${targetW}x${targetH}.png`;
      triggerDownload(blob, filename);
      createThumbnail(dataUrl).then((thumb) =>
        addExport({
          name: filename,
          source: "Swoosh Background",
          format: "png",
          thumbnail: thumb,
          dimensions: `${targetW}x${targetH}`,
        }),
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
      setExportKind(null);
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
                <input type="range" min="0.1" max="4" step="0.01" value={human.scale} onChange={(e) => setHuman((s) => ({ ...s, scale: parseFloat(e.target.value) }))} className={sliderCls} />
                <span className="text-[9px] text-[#94A3B8] w-[36px] text-right tabular-nums">{Math.round(human.scale * 100)}%</span>
              </div>
              <div className="text-[9px] text-[#64748B] pt-[2px]">Tap the photo to show handles. Corners = resize. Edge bars = crop.</div>
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

          {/* Two download options. Swoosh is the headline deliverable
              (transparent PNG users drop into their own designs) so it's
              the primary blue-gradient button. The Slide preview is a
              secondary/contextual export. */}
          <div className="flex flex-col gap-[8px]">
            <button
              onClick={() => exportPNG("swoosh")}
              disabled={!personImage || isExporting}
              className="w-full py-[12px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[12px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exportKind === "swoosh" ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
              {exportKind === "swoosh" ? "Exporting..." : `Download Swoosh (${DOWNLOAD_W}×${DOWNLOAD_H})`}
            </button>
            <button
              onClick={() => exportPNG("complete")}
              disabled={!personImage || isExporting}
              className="w-full py-[12px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-[12px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(0,178,169,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exportKind === "complete" ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
              {exportKind === "complete" ? "Exporting..." : `Download Slide (${PREVIEW_W}×${PREVIEW_H})`}
            </button>
          </div>
          {!personImage && (
            <div className="text-[10px] text-[#64748B] text-center">Upload a photo to enable download.</div>
          )}
        </div>
      </div>

      {/* Live preview — always the 1920×1080 composition (space bg +
          portrait swoosh comp on the right). The portrait swoosh element
          is still independently exportable as a transparent 1080×1350
          PNG via its data-template-id="swoosh-bg". */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <LivePreview>
          <div className="w-full h-full flex flex-col items-center min-h-0 gap-[12px]" ref={previewRef}>
            <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#94A3B8]">
              Preview · {PREVIEW_W}×{PREVIEW_H}
            </div>
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              <CanvasFrame ratio={PREVIEW_RATIO} style={{ maxWidth: "100%", overflow: "hidden", borderRadius: "8px" }}>
                {/* Wrapper that fills the 1920×1080 frame and is the
                    capture target for the "Complete" download. */}
                <div
                  data-template-id="swoosh-complete"
                  style={{ position: "absolute", inset: 0 }}
                >
                  {/* Space background fills the 1920×1080 preview frame */}
                  <img
                    src={SPACE_BG}
                    alt=""
                    draggable={false}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                    crossOrigin="anonymous"
                  />
                  {/* Portrait swoosh composition placed on the right side
                      of the 1920×1080 frame. To match the reference layout
                      EXACTLY:
                        • height = 150% of canvas height so the swoosh asset
                          renders large enough to fill the right half (loop
                          starts near canvas center, extends past right edge)
                        • right = -12% of canvas width pushes the comp's right
                          edge ~230px past the canvas right edge, placing the
                          Highly robot at the very top-right corner with the
                          rest of the swoosh's right side cleanly cut off
                        • top = 68% / translateY(-50%) shifts the comp center
                          down so the robot lands at ~y=170 (matching the
                          reference's top-right anchor) instead of being
                          clipped above the canvas top */}
                  <div
                    style={{
                      position: "absolute",
                      top: "68%",
                      right: "-12%",
                      height: "150%",
                      aspectRatio: `${DOWNLOAD_W} / ${DOWNLOAD_H}`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <SwooshComposition
                      personImage={personImage}
                      swoosh={swoosh}
                      human={human}
                      onHumanChange={setHuman}
                      exporting={isExporting}
                    />
                  </div>
                </div>
              </CanvasFrame>
            </div>
          </div>
        </LivePreview>
      </div>
    </div>
  );
}

