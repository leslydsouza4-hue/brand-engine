// Summer of AI — themed canvas renderer.
//
// One renderer drives every format. The export node is rendered at the format's
// true pixel dimensions; a transform-scaled wrapper (ScaledCanvasPreview) shows
// a faithful, fit-to-width preview so what you see matches the PNG export.

import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { SummerContent, SummerFormat, SummerThemeDef } from "./summerThemes";

function scaleFor(format: SummerFormat): number {
  const minDim = Math.min(format.width, format.height);
  return Math.max(0.3, Math.min(1.1, minDim / 1080));
}

function bgLayer(theme: SummerThemeDef, content: SummerContent, dim: number): ReactElement {
  if (content.bgImage) {
    return (
      <img
        src={content.bgImage}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: dim ? `brightness(${dim})` : undefined }}
      />
    );
  }
  return <div style={{ position: "absolute", inset: 0, background: theme.palette.gradient }} />;
}

function Eyebrow({ theme, content, s }: { theme: SummerThemeDef; content: SummerContent; s: number }): ReactElement | null {
  if (!content.eyebrow) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: theme.fontBody,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontSize: `${Math.max(9, 13 * s)}px`,
        color: theme.palette.accent,
      }}
    >
      {content.eyebrow}
    </span>
  );
}

function headingStyle(theme: SummerThemeDef, fontSize: number, color: string): React.CSSProperties {
  return {
    fontFamily: theme.fontHeading,
    fontWeight: theme.headingWeight,
    textTransform: theme.headingTransform,
    letterSpacing: theme.headingTracking,
    lineHeight: theme.headingLineHeight,
    fontSize: `${fontSize}px`,
    color,
    margin: 0,
  };
}

function CtaButton({ theme, content, s, pill }: { theme: SummerThemeDef; content: SummerContent; s: number; pill?: boolean }): ReactElement | null {
  if (!content.cta) return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: theme.palette.cta,
        color: theme.palette.ctaInk,
        fontFamily: theme.fontBody,
        fontWeight: 700,
        fontSize: `${Math.max(10, 15 * s)}px`,
        letterSpacing: "0.02em",
        padding: `${Math.max(8, 14 * s)}px ${Math.max(14, 26 * s)}px`,
        borderRadius: pill ? "999px" : `${Math.max(4, 8 * s)}px`,
        whiteSpace: "nowrap",
      }}
    >
      {content.cta}
    </span>
  );
}

// Full-bleed image with text anchored to the bottom (social + square/portrait ads).
function SocialLayout({ theme, format, content }: RenderProps): ReactElement {
  const s = scaleFor(format);
  const minDim = Math.min(format.width, format.height);
  return (
    <>
      {bgLayer(theme, content, 1)}
      <div style={{ position: "absolute", inset: 0, background: theme.palette.scrim }} />
      <div style={{ position: "absolute", top: `${28 * s}px`, left: `${32 * s}px`, right: `${32 * s}px` }}>
        <Eyebrow theme={theme} content={content} s={s} />
      </div>
      <div style={{ position: "absolute", left: `${32 * s}px`, right: `${32 * s}px`, bottom: `${40 * s}px`, display: "flex", flexDirection: "column", gap: `${16 * s}px` }}>
        <h1 style={headingStyle(theme, Math.max(22, minDim * 0.095), "#FFFFFF")}>
          {content.headline}
        </h1>
        {content.subtext && (
          <p style={{ margin: 0, fontFamily: theme.fontBody, color: "rgba(255,255,255,0.88)", fontSize: `${Math.max(13, minDim * 0.026)}px`, lineHeight: 1.4, maxWidth: "82%" }}>
            {content.subtext}
          </p>
        )}
        <div>
          <CtaButton theme={theme} content={content} s={s} pill />
        </div>
      </div>
    </>
  );
}

// Landscape: image with a left scrim and left-aligned text (LinkedIn, display).
function WideLayout({ theme, format, content }: RenderProps): ReactElement {
  const s = scaleFor(format);
  const minDim = Math.min(format.width, format.height);
  return (
    <>
      {bgLayer(theme, content, 1)}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${rgba(theme.palette.bg, 0.92)} 0%, ${rgba(theme.palette.bg, 0.78)} 38%, ${rgba(theme.palette.bg, 0.15)} 100%)` }} />
      <div style={{ position: "absolute", inset: `${24 * s}px`, width: "62%", display: "flex", flexDirection: "column", justifyContent: "center", gap: `${14 * s}px` }}>
        <Eyebrow theme={theme} content={content} s={s} />
        <h1 style={headingStyle(theme, Math.max(20, minDim * 0.14), theme.palette.ink)}>{content.headline}</h1>
        {content.subtext && format.height > 300 && (
          <p style={{ margin: 0, fontFamily: theme.fontBody, color: theme.palette.sub, fontSize: `${Math.max(11, minDim * 0.04)}px`, lineHeight: 1.4 }}>{content.subtext}</p>
        )}
        <div>
          <CtaButton theme={theme} content={content} s={s} pill />
        </div>
      </div>
    </>
  );
}

// Full-bleed email banner: image is the hero, copy overlaid on a warm scrim.
function EmailLayout({ theme, format, content }: RenderProps): ReactElement {
  const s = scaleFor(format);
  const minDim = Math.min(format.width, format.height);
  return (
    <>
      {bgLayer(theme, content, 1)}
      <div style={{ position: "absolute", inset: 0, background: theme.palette.scrim }} />
      <div style={{ position: "absolute", top: `${26 * s}px`, left: `${30 * s}px`, right: `${30 * s}px` }}>
        <Eyebrow theme={theme} content={content} s={s} />
      </div>
      <div style={{ position: "absolute", left: `${30 * s}px`, right: `${30 * s}px`, bottom: `${32 * s}px`, display: "flex", flexDirection: "column", gap: `${14 * s}px` }}>
        <h1 style={headingStyle(theme, Math.max(22, minDim * 0.085), "#FFFFFF")}>{content.headline}</h1>
        {content.subtext && (
          <p style={{ margin: 0, fontFamily: theme.fontBody, color: "rgba(255,255,255,0.88)", fontSize: `${Math.max(12, minDim * 0.03)}px`, lineHeight: 1.45, maxWidth: "88%" }}>{content.subtext}</p>
        )}
        <div>
          <CtaButton theme={theme} content={content} s={s} pill />
        </div>
      </div>
    </>
  );
}

function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

interface RenderProps {
  theme: SummerThemeDef;
  format: SummerFormat;
  content: SummerContent;
}

function pickLayout(format: SummerFormat): (p: RenderProps) => ReactElement {
  if (format.kind === "email") return EmailLayout;
  const ratio = format.width / format.height;
  if (ratio > 1.25) return WideLayout;
  return SocialLayout;
}

/**
 * Renders the canvas at the format's true pixel dimensions. Wrap in
 * ScaledCanvasPreview for display; pass the same component to the exporter at
 * native size.
 */
export function SummerCanvasNode({ theme, format, content, innerRef }: RenderProps & { innerRef?: React.Ref<HTMLDivElement> }): ReactElement {
  const Layout = pickLayout(format);
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
      <Layout theme={theme} format={format} content={content} />
    </div>
  );
}

/** Fit-to-width preview of a SummerCanvasNode using a CSS transform scale. */
export function ScaledCanvasPreview({ theme, format, content }: RenderProps): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={wrapRef} style={{ width: "100%", aspectRatio: `${format.width}/${format.height}`, position: "relative", overflow: "hidden", borderRadius: 12 }}>
      <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <SummerCanvasNode theme={theme} format={format} content={content} />
      </div>
    </div>
  );
}
