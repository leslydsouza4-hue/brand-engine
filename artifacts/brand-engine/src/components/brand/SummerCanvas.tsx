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
  return <div style={{ position: "absolute", inset: 0, background: theme.palette.gradient }} />;
}

interface Interaction {
  selected: SummerElementKey | null;
  onSelect: (k: SummerElementKey | null) => void;
  onMove: (k: SummerElementKey, x: number, y: number) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
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
          interaction.onMove(k, clamp01(origX + dx), clamp01(origY + dy));
        };
        const up = () => {
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

      {content.headline && (
        <ElementBox k="headline" layout={content.layout.headline} interaction={interaction}>
          <h1
            style={{
              margin: 0,
              fontFamily: fontStackFor(fontDef),
              fontWeight: headType.weight,
              letterSpacing: headType.letterSpacing,
              lineHeight: headType.lineHeight,
              fontSize: `${Math.max(22, minDim * 0.085) * sz("headline")}px`,
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
              fontSize: `${Math.max(12, minDim * 0.03) * sz("subtext")}px`,
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
              fontSize: `${Math.max(14, minDim * 0.04) * sz("cta")}px`,
              letterSpacing: "0.01em",
              padding: `${Math.max(12, minDim * 0.024) * sz("cta")}px ${Math.max(20, minDim * 0.044) * sz("cta")}px`,
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
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
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
}: RenderProps & {
  selected?: SummerElementKey | null;
  onSelect?: (k: SummerElementKey | null) => void;
  onMove?: (k: SummerElementKey, x: number, y: number) => void;
}): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

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
    onSelect && onMove ? { selected: selected ?? null, onSelect, onMove, rootRef: nodeRef } : undefined;

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
    </div>
  );
}
