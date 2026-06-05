// Summer of AI — themed canvas renderer (Canva-style free-form layout).
//
// One renderer drives every format. Elements (headline / subtext /
// CTA) are absolutely positioned by fractional coordinates so the same content
// reads on any aspect ratio. The export node is rendered at the format's true
// pixel dimensions; ScaledCanvasPreview shows a faithful, fit-to-width preview
// (so what you see matches the PNG) and makes the elements drag-to-move.

import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  SUMMER_CTA_BG,
  SUMMER_CTA_INK,
  type SummerContent,
  type SummerElementKey,
  type SummerElementLayout,
  type SummerFormat,
  type SummerLayoutMap,
  type SummerSubject,
  type SummerThemeDef,
} from "./summerThemes";
import { fontDefFor, fontStackFor, headingTypography } from "./googleFonts";

const BASE = import.meta.env.BASE_URL;

/** Transparent-PNG Summer of AI lockup per color variant. */
function logoUrl(variant: "yellow" | "blue"): string {
  return `${BASE}assets/summer/logo-${variant}.png`;
}

function scaleFor(format: SummerFormat): number {
  const minDim = Math.min(format.width, format.height);
  return Math.max(0.3, Math.min(1.1, minDim / 1080));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(0.98, v));
}

/** A live alignment guide line shown while dragging (Figma-style). */
interface Guide {
  axis: "x" | "y";
  pos: number;
}

/** Effective box width (fraction) of an element, accounting for the logo size multiplier. */
function boxWidthOf(layout: SummerLayoutMap, k: SummerElementKey): number {
  const l = layout[k];
  return k === "logo" ? l.w * (l.size ?? 1) : l.w;
}

const SNAP_MARGIN = 0.06;

/**
 * Figma-style snapping. Given a proposed top-left (x,y) and the dragged box width,
 * snap the element's left/center/right edges to canvas guides (edges, margins,
 * center) and to sibling elements' left/center/right; snap the top edge to canvas
 * guides and sibling tops. Returns the adjusted position and the guide lines to draw.
 */
function computeSnap(
  k: SummerElementKey,
  x: number,
  y: number,
  w: number,
  layout: SummerLayoutMap,
  threshX: number,
  threshY: number,
): { x: number; y: number; guides: Guide[] } {
  const xGuides = new Set<number>([0, SNAP_MARGIN, 0.5, 1 - SNAP_MARGIN, 1]);
  const yGuides = new Set<number>([0, SNAP_MARGIN, 0.5, 1 - SNAP_MARGIN, 1]);
  for (const key of Object.keys(layout) as SummerElementKey[]) {
    if (key === k) continue;
    const sx = layout[key].x;
    const sw = boxWidthOf(layout, key);
    xGuides.add(sx);
    xGuides.add(sx + sw / 2);
    xGuides.add(sx + sw);
    yGuides.add(layout[key].y);
  }

  const guides: Guide[] = [];
  let nx = x;
  let ny = y;

  // X axis: try the dragged box's left (0), center (w/2), right (w) against each guide.
  let bestXDist = threshX;
  let bestXPos: number | null = null;
  let bestXGuide: number | null = null;
  for (const g of xGuides) {
    for (const off of [0, w / 2, w]) {
      const dist = Math.abs(x + off - g);
      if (dist < bestXDist) {
        bestXDist = dist;
        bestXPos = g - off;
        bestXGuide = g;
      }
    }
  }
  if (bestXPos != null && bestXGuide != null) {
    nx = bestXPos;
    guides.push({ axis: "x", pos: bestXGuide });
  }

  // Y axis: snap the top edge.
  let bestYDist = threshY;
  let bestYGuide: number | null = null;
  for (const g of yGuides) {
    const dist = Math.abs(y - g);
    if (dist < bestYDist) {
      bestYDist = dist;
      bestYGuide = g;
    }
  }
  if (bestYGuide != null) {
    ny = bestYGuide;
    guides.push({ axis: "y", pos: bestYGuide });
  }

  return { x: clamp01(nx), y: clamp01(ny), guides };
}

function bgLayer(theme: SummerThemeDef, content: SummerContent): ReactElement {
  if (content.bgImage) {
    return (
      <img
        src={content.bgImage}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <div style={{ position: "absolute", inset: 0, background: content.gradient ?? theme.palette.gradient }} />;
}

interface Interaction {
  selected: SummerElementKey | null;
  onSelect: (k: SummerElementKey | null) => void;
  onMove: (k: SummerElementKey, x: number, y: number) => void;
  /** Move the human/subject cutout (center, as fractions). */
  onMoveSubject?: (x: number, y: number) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  layout: SummerLayoutMap;
  setGuides: (g: Guide[]) => void;
}

/** A draggable human/subject cutout composited over the background. */
function SubjectLayer({
  subject,
  interaction,
}: {
  subject: SummerSubject;
  interaction?: Interaction;
}): ReactElement {
  const [dragging, setDragging] = useState(false);
  const draggable = !!interaction?.onMoveSubject;
  const onPointerDown =
    draggable && interaction
      ? (e: React.PointerEvent) => {
          e.stopPropagation();
          e.preventDefault();
          const root = interaction.rootRef.current;
          if (!root) return;
          const rect = root.getBoundingClientRect();
          const startX = e.clientX;
          const startY = e.clientY;
          const origX = subject.x;
          const origY = subject.y;
          setDragging(true);
          const move = (ev: PointerEvent) => {
            if (rect.width === 0 || rect.height === 0) return;
            const dx = (ev.clientX - startX) / rect.width;
            const dy = (ev.clientY - startY) / rect.height;
            const nx = Math.max(0, Math.min(1, origX + dx));
            const ny = Math.max(0, Math.min(1, origY + dy));
            interaction.onMoveSubject?.(nx, ny);
          };
          const up = () => {
            setDragging(false);
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
          window.addEventListener("pointercancel", up);
        }
      : undefined;

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: `${subject.x * 100}%`,
        top: `${subject.y * 100}%`,
        width: `${subject.scale * 100}%`,
        transform: "translate(-50%, -50%)",
        cursor: draggable ? "move" : undefined,
        outline: dragging ? "2px dashed rgba(255,255,255,0.95)" : undefined,
        outlineOffset: 3,
        touchAction: draggable ? "none" : undefined,
      }}
    >
      <img
        src={subject.src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.45))",
        }}
      />
    </div>
  );
}

interface RenderProps {
  theme: SummerThemeDef;
  format: SummerFormat;
  content: SummerContent;
}

/** Absolutely-positioned, optionally-draggable wrapper for one element. */
function ElementBox({
  k,
  layout,
  interaction,
  inline,
  children,
}: {
  k: SummerElementKey;
  layout: SummerElementLayout;
  interaction?: Interaction;
  inline?: boolean;
  children: ReactNode;
}): ReactElement {
  const selected = interaction?.selected === k;
  const onPointerDown = interaction
    ? (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        interaction.onSelect(k);
        const root = interaction.rootRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = layout.x;
        const origY = layout.y;
        const move = (ev: PointerEvent) => {
          if (rect.width === 0 || rect.height === 0) return;
          const dx = (ev.clientX - startX) / rect.width;
          const dy = (ev.clientY - startY) / rect.height;
          let nx = clamp01(origX + dx);
          let ny = clamp01(origY + dy);
          const snapped = computeSnap(
            k,
            nx,
            ny,
            layout.w,
            interaction.layout,
            ev.shiftKey ? 0 : 7 / rect.width,
            ev.shiftKey ? 0 : 7 / rect.height,
          );
          nx = snapped.x;
          ny = snapped.y;
          interaction.setGuides(snapped.guides);
          interaction.onMove(k, nx, ny);
        };
        const up = () => {
          interaction.setGuides([]);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }
    : undefined;

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: `${layout.x * 100}%`,
        top: `${layout.y * 100}%`,
        width: inline ? "auto" : `${layout.w * 100}%`,
        cursor: interaction ? "move" : undefined,
        outline: selected ? "2px dashed rgba(255,255,255,0.95)" : undefined,
        outlineOffset: 3,
        touchAction: interaction ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function CanvasInner({
  theme,
  format,
  content,
  interaction,
}: RenderProps & { interaction?: Interaction }): ReactElement {
  const s = scaleFor(format);
  const minDim = Math.min(format.width, format.height);
  // Type-size reference. For landscape canvases the short side (height) badly
  // undersells how large text should read across a wide frame (e.g. a
  // 1920×1080 emailer), so lift the reference toward the area-based geometric
  // mean. Square / portrait / story keep using the short side, so their sizing
  // is unchanged.
  const isLandscape = format.width / format.height >= 1.15;
  const typeRef = isLandscape ? Math.sqrt(format.width * format.height) : minDim;
  const fontDef = fontDefFor(content.headlineFont);
  const headType = headingTypography(fontDef);
  const sz = (k: SummerElementKey) => content.layout[k].size ?? 1;
  const overlay = content.overlay ?? { color: "black" as const, opacity: 0 };
  return (
    <>
      {bgLayer(theme, content)}
      {overlay.opacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: overlay.color === "white" ? "#FFFFFF" : "#000000",
            opacity: overlay.opacity,
          }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: theme.palette.scrim }} />

      {content.subject && <SubjectLayer subject={content.subject} interaction={interaction} />}

      {content.headline && (
        <ElementBox k="headline" layout={content.layout.headline} interaction={interaction}>
          <h1
            style={{
              margin: 0,
              fontFamily: fontStackFor(fontDef),
              fontWeight: headType.weight,
              letterSpacing: headType.letterSpacing,
              lineHeight: headType.lineHeight,
              fontSize: `${Math.max(14, typeRef * 0.085) * sz("headline")}px`,
              color: content.colors.headline,
            }}
          >
            {content.headline}
          </h1>
        </ElementBox>
      )}

      {content.subtext && (
        <ElementBox k="subtext" layout={content.layout.subtext} interaction={interaction}>
          <p
            style={{
              margin: 0,
              fontFamily: theme.fontBody,
              color: content.colors.subtext,
              fontSize: `${Math.max(8, typeRef * 0.03) * sz("subtext")}px`,
              lineHeight: 1.45,
            }}
          >
            {content.subtext}
          </p>
        </ElementBox>
      )}

      {content.cta && (
        <ElementBox k="cta" layout={content.layout.cta} interaction={interaction} inline>
          <span
            style={{
              display: "inline-block",
              background: SUMMER_CTA_BG,
              color: SUMMER_CTA_INK,
              fontFamily: theme.fontBody,
              fontWeight: 800,
              fontSize: `${Math.max(9, typeRef * 0.04) * sz("cta")}px`,
              letterSpacing: "0.01em",
              padding: `${Math.max(6, typeRef * 0.024) * sz("cta")}px ${Math.max(10, typeRef * 0.044) * sz("cta")}px`,
              borderRadius: "999px",
              whiteSpace: "nowrap",
              boxShadow: "0 12px 32px -12px rgba(0,0,0,0.55)",
            }}
          >
            {content.cta}
          </span>
        </ElementBox>
      )}

      {content.logo?.show && (
        <ElementBox
          k="logo"
          layout={{ ...content.layout.logo, w: content.layout.logo.w * sz("logo") }}
          interaction={interaction}
        >
          <img
            src={logoUrl(content.logo.variant)}
            alt="Summer of AI"
            crossOrigin="anonymous"
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        </ElementBox>
      )}
    </>
  );
}

/**
 * Renders the canvas at the format's true pixel dimensions. Used directly by the
 * exporter at native size; wrap in ScaledCanvasPreview for an interactive view.
 */
export function SummerCanvasNode({
  theme,
  format,
  content,
  innerRef,
}: RenderProps & { innerRef?: React.Ref<HTMLDivElement> }): ReactElement {
  return (
    <div
      ref={innerRef}
      data-summer-format={format.key}
      style={{
        position: "relative",
        width: `${format.width}px`,
        height: `${format.height}px`,
        overflow: "hidden",
        background: theme.palette.bg,
        fontFamily: theme.fontBody,
        color: theme.palette.ink,
      }}
    >
      <CanvasInner theme={theme} format={format} content={content} />
    </div>
  );
}

/** Fit-to-width, drag-to-edit preview of a SummerCanvasNode (CSS transform scale). */
export function ScaledCanvasPreview({
  theme,
  format,
  content,
  selected,
  onSelect,
  onMove,
  onMoveSubject,
}: RenderProps & {
  selected?: SummerElementKey | null;
  onSelect?: (k: SummerElementKey | null) => void;
  onMove?: (k: SummerElementKey, x: number, y: number) => void;
  onMoveSubject?: (x: number, y: number) => void;
}): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [guides, setGuides] = useState<Guide[]>([]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / format.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [format.width]);

  const interaction: Interaction | undefined =
    onSelect && onMove
      ? { selected: selected ?? null, onSelect, onMove, onMoveSubject, rootRef: nodeRef, layout: content.layout, setGuides }
      : undefined;

  return (
    <div
      ref={wrapRef}
      style={{ width: "100%", aspectRatio: `${format.width}/${format.height}`, position: "relative", overflow: "hidden", borderRadius: 12 }}
      onPointerDown={() => interaction?.onSelect(null)}
    >
      <div
        ref={nodeRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${format.width}px`,
          height: `${format.height}px`,
          overflow: "hidden",
          background: theme.palette.bg,
          fontFamily: theme.fontBody,
          color: theme.palette.ink,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CanvasInner theme={theme} format={format} content={content} interaction={interaction} />
      </div>
      {guides.map((g, i) =>
        g.axis === "x" ? (
          <div
            key={`x${i}`}
            style={{
              position: "absolute",
              left: `${g.pos * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "#FF2D9B",
              pointerEvents: "none",
              zIndex: 50,
            }}
          />
        ) : (
          <div
            key={`y${i}`}
            style={{
              position: "absolute",
              top: `${g.pos * 100}%`,
              left: 0,
              right: 0,
              height: 1,
              background: "#FF2D9B",
              pointerEvents: "none",
              zIndex: 50,
            }}
          />
        ),
      )}
    </div>
  );
}
