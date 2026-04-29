import { useState, useRef, useCallback, useEffect, useLayoutEffect, type RefObject } from "react";
import {
  UploadCloud, X, Loader2, Download, Check, Sparkles, ZoomIn, ArrowUpDown, RefreshCw, PackageOpen
} from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { addExport, createThumbnail } from "./exportStore";
import { LivePreview } from "./LivePreview";

const BASE = import.meta.env.BASE_URL;
const BG_HORIZONTAL = `${BASE}assets/masterclass/bg-horizontal-clean.jpg`;
const LINE_HORIZONTAL = `${BASE}assets/masterclass/line-horizontal.png`;
const BG_SQUARE = `${BASE}assets/masterclass/bg-square-clean.jpg`;
const LINE_SQUARE = `${BASE}assets/masterclass/line-square.png`;
const BG_PORTRAIT = `${BASE}assets/masterclass/bg-portrait-clean.jpg`;
const LINE_PORTRAIT = `${BASE}assets/masterclass/line-portrait.png`;
const BG_STORY = `${BASE}assets/masterclass/bg-story-clean.jpg`;
const LINE_STORY = `${BASE}assets/masterclass/line-story.png`;
const LOGO_URL = `${BASE}assets/masterclass/logo-light.png`;

interface TemplateConfig {
  id: string;
  name: string;
  shortName: string;
  width: number;
  height: number;
  variant: "dates" | "no-dates" | "cta";
  group: "horizontal" | "square" | "portrait" | "story";
}

const TEMPLATES: TemplateConfig[] = [
  { id: "horizontal-dates", name: "Horizontal - Dates", shortName: "Dates", width: 1920, height: 1080, variant: "dates", group: "horizontal" },
  { id: "horizontal-no-dates", name: "Horizontal - No Dates", shortName: "No Dates", width: 1920, height: 1080, variant: "no-dates", group: "horizontal" },
  { id: "horizontal-cta", name: "Horizontal - CTA", shortName: "CTA", width: 1920, height: 1080, variant: "cta", group: "horizontal" },
  { id: "square-dates", name: "Square - Dates", shortName: "Dates", width: 1080, height: 1080, variant: "dates", group: "square" },
  { id: "square-no-dates", name: "Square - No Dates", shortName: "No Dates", width: 1080, height: 1080, variant: "no-dates", group: "square" },
  { id: "square-cta", name: "Square - CTA", shortName: "CTA", width: 1080, height: 1080, variant: "cta", group: "square" },
  { id: "portrait-dates", name: "Portrait - Dates", shortName: "Dates", width: 1080, height: 1350, variant: "dates", group: "portrait" },
  { id: "portrait-no-dates", name: "Portrait - No Dates", shortName: "No Dates", width: 1080, height: 1350, variant: "no-dates", group: "portrait" },
  { id: "portrait-cta", name: "Portrait - CTA", shortName: "CTA", width: 1080, height: 1350, variant: "cta", group: "portrait" },
  { id: "story-dates", name: "Story - Dates", shortName: "Dates", width: 1080, height: 1920, variant: "dates", group: "story" },
  { id: "story-no-dates", name: "Story - No Dates", shortName: "No Dates", width: 1080, height: 1920, variant: "no-dates", group: "story" },
  { id: "story-cta", name: "Story - CTA", shortName: "CTA", width: 1080, height: 1920, variant: "cta", group: "story" },
];

const SIZE_GROUPS = [
  { key: "horizontal" as const, label: "Horizontal", dims: "1920 × 1080", ar: "16/9" },
  { key: "square" as const, label: "Square", dims: "1080 × 1080", ar: "1/1" },
  { key: "portrait" as const, label: "Portrait", dims: "1080 × 1350", ar: "4/5" },
  { key: "story" as const, label: "Story", dims: "1080 × 1920", ar: "9/16" },
];

interface ImageSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function useContainerFontSize(ref: React.RefObject<HTMLDivElement | null>, base: number = 0.045) {
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (ref.current) ref.current.style.fontSize = `${w * base}px`;
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref, base]);
}

function FitText({
  text,
  style,
  baseFontSize = "1em",
  fitTarget = 0.95,
  maxScale = 1.44,
  minScale = 0.2,
}: {
  text: string;
  style?: React.CSSProperties;
  baseFontSize?: string;
  fitTarget?: number;
  maxScale?: number;
  minScale?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;

  useLayoutEffect(() => {
    const c = containerRef.current;
    const inner = innerRef.current;
    if (!c || !inner) return;
    const recalc = () => {
      const cw = c.clientWidth;
      const measured = inner.getBoundingClientRect().width;
      const cur = scaleRef.current;
      if (cw <= 0 || measured <= 0 || cur <= 0) return;
      const naturalW = measured / cur;
      const target = (cw * fitTarget) / naturalW;
      const next = Math.min(maxScale, Math.max(minScale, target));
      if (Math.abs(next - cur) > 0.003) setScale(next);
    };
    recalc();
    if ((document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready) {
      (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready.then(recalc);
    }
    const ro = new ResizeObserver(recalc);
    ro.observe(c);
    return () => ro.disconnect();
  }, [text, fitTarget, maxScale, minScale]);

  return (
    <div ref={containerRef} style={{ width: "100%", textAlign: "center" }}>
      <span
        ref={innerRef}
        style={{
          ...style,
          fontSize: `calc(${baseFontSize} * ${scale})`,
          whiteSpace: "nowrap",
          display: "inline-block",
          lineHeight: 1.05,
        }}
      >
        {text}
      </span>
    </div>
  );
}

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

function HorizontalTemplate({
  config,
  headline,
  subheadline,
  dateText,
  guestName,
  guestRole,
  ctaText,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  subheadline: string;
  dateText: string;
  guestName: string;
  guestRole: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);
  useFitParent(containerRef, 1920 / 1080);

  const showCta = config.variant === "cta";
  const showDate = config.variant === "dates";
  const firstName = (guestName.trim().split(/\s+/)[0] || "GUEST").toUpperCase();

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: "1920/1080",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#07213C",
        fontSize: "16px",
      }}
    >
      {/* Background */}
      <img
        src={BG_HORIZONTAL}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Line frame - rendered on top so it crosses in front of guest */}
      <img
        src={LINE_HORIZONTAL}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* Vertical stroked guest first-name behind guest, faded blue outline */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            right: "3.5%",
            top: "8%",
            bottom: "8%",
            writingMode: "vertical-rl",
            fontSize: "2.4em",
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: "transparent",
            WebkitTextStroke: "0.018em rgba(150, 200, 255, 0.14)",
            textTransform: "uppercase",
            lineHeight: 1,
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {firstName}
        </div>
      )}

      {/* Logo top-left */}
      <img
        src={LOGO_URL}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: "7%",
          left: "2.5%",
          width: "38%",
          height: "auto",
          objectFit: "contain",
          zIndex: 4,
        }}
      />

      {/* Person image right side */}
      {personImage && (
        <div
          style={{
            position: "absolute",
            right: "0%",
            bottom: 0,
            width: "58%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <img
            src={personImage}
            alt=""
            crossOrigin="anonymous"
            style={{
              height: `${100 * imgSettings.scale}%`,
              maxWidth: "none",
              width: "auto",
              transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        </div>
      )}

      {/* Headline + date/cta — left column */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          top: "33%",
          width: "52%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ paddingBottom: subheadline ? "0.4em" : "0.6em" }}>
          <span
            style={{
              fontSize: "1.18em",
              fontWeight: 800,
              lineHeight: 1.08,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              display: "inline",
            }}
          >
            {headline || "Enter Headline"}
          </span>
        </div>
        {subheadline && (
          <div
            style={{
              paddingBottom: "1.5em",
              fontSize: "0.55em",
              fontWeight: 500,
              lineHeight: 1.35,
              color: "rgba(220,232,255,0.85)",
              letterSpacing: "0.005em",
            }}
          >
            {subheadline}
          </div>
        )}

        {showDate && dateText && (
          <div
            style={{
              fontSize: "0.6em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55em",
              padding: "0.55em 1.1em",
              border: "0.085em solid #2896FB",
              borderRadius: "0.55em",
              alignSelf: "flex-start",
              background: "rgba(40,150,251,0.04)",
            }}
          >
            <svg
              width="0.95em"
              height="0.95em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2896FB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              style={{
                fontSize: "0.7em",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {dateText}
            </span>
          </div>
        )}

        {showCta && ctaText && (
          <div style={{ alignSelf: "flex-start" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.55em 1.4em",
                fontSize: "0.7em",
                fontWeight: 800,
                color: "#0A1628",
                background: "linear-gradient(135deg, #FFC328 0%, #FFD84D 100%)",
                borderRadius: "0.5em",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: "0 0.15em 0.6em rgba(255,195,40,0.35)",
              }}
            >
              {ctaText}
            </span>
          </div>
        )}
      </div>

      {/* Dark gradient floor across full canvas width for legibility */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          background:
            "linear-gradient(to top, rgba(2,5,18,1) 0%, rgba(2,5,18,0.95) 18%, rgba(2,5,18,0.78) 38%, rgba(2,5,18,0.5) 58%, rgba(2,5,18,0.22) 78%, transparent 100%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Guest name + role under photo */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            right: "0%",
            bottom: "10.5%",
            width: "58%",
            zIndex: 7,
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "-2%",
              right: "-2%",
              top: "-45%",
              bottom: "-30%",
              background:
                "radial-gradient(ellipse 60% 65% at 50% 48%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 28%, rgba(0,0,0,0.32) 52%, rgba(0,0,0,0.12) 72%, transparent 92%)",
              filter: "blur(0.6em)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
          <FitText
            text={guestName.toUpperCase()}
            baseFontSize="1em"
            fitTarget={0.76}
            maxScale={1.15}
            style={{
              fontWeight: 800,
              background: "linear-gradient(180deg, #7DD8D0 0%, #FFFFFF 65%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              filter:
                "drop-shadow(0 0.06em 0.18em rgba(0,0,0,0.75)) drop-shadow(0 0 0.55em rgba(0,0,0,0.65)) drop-shadow(0 0 1.1em rgba(0,0,0,0.45))",
            }}
          />
          <div
            style={{
              fontSize: "0.5em",
              marginTop: "0.7em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.9em",
            }}
          >
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
            <span
              style={{
                fontWeight: 700,
                color: "rgba(220,232,255,0.85)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {guestRole || "Guest"}
            </span>
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SquareTemplate({
  config,
  headline,
  subheadline,
  dateText,
  guestName,
  guestRole,
  ctaText,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  subheadline: string;
  dateText: string;
  guestName: string;
  guestRole: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.052);
  useFitParent(containerRef, 1);

  const showCta = config.variant === "cta";
  const showDate = config.variant === "dates";
  const fullName = (guestName.trim() || "GUEST").toUpperCase();

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: "1/1",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#07213C",
        fontSize: "16px",
      }}
    >
      {/* Background */}
      <img
        src={BG_SQUARE}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Line frame - rendered on top so it crosses in front of guest */}
      <img
        src={LINE_SQUARE}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      {/* Vertical stroked guest full name on LEFT side */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "3.5%",
            top: "6%",
            bottom: "6%",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            transformOrigin: "center center",
            fontSize: "1.55em",
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: "transparent",
            WebkitTextStroke: "0.018em rgba(150, 200, 255, 0.14)",
            textTransform: "uppercase",
            lineHeight: 1,
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {fullName}
        </div>
      )}

      {/* Logo top center */}
      <img
        src={LOGO_URL}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: "9%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "52%",
          height: "auto",
          objectFit: "contain",
          zIndex: 4,
        }}
      />

      {/* Headline + date/cta — center top */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          top: "26%",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7em",
        }}
      >
        <div
          style={{
            fontSize: "1.05em",
            fontWeight: 800,
            lineHeight: 1.12,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {headline || "Enter Headline"}
        </div>
        {subheadline && (
          <div
            style={{
              fontSize: "0.5em",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(220,232,255,0.85)",
              letterSpacing: "0.005em",
              textAlign: "center",
              marginTop: "-0.2em",
              maxWidth: "90%",
            }}
          >
            {subheadline}
          </div>
        )}

        {showDate && dateText && (
          <div
            style={{
              fontSize: "0.6em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55em",
              padding: "0.6em 1.2em",
              border: "0.085em solid #2896FB",
              borderRadius: "0.55em",
              background: "rgba(40,150,251,0.04)",
            }}
          >
            <svg
              width="0.95em"
              height="0.95em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2896FB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              style={{
                fontSize: "0.7em",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {dateText}
            </span>
          </div>
        )}

        {showCta && ctaText && (
          <div
            style={{
              display: "inline-block",
              padding: "0.6em 1.6em",
              fontSize: "0.7em",
              fontWeight: 800,
              color: "#0A1628",
              background: "linear-gradient(135deg, #FFC328 0%, #FFD84D 100%)",
              borderRadius: "0.5em",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              boxShadow: "0 0.15em 0.6em rgba(255,195,40,0.35)",
            }}
          >
            {ctaText}
          </div>
        )}
      </div>

      {/* Person image bottom-center */}
      {personImage && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            width: "62%",
            height: "62%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <img
            src={personImage}
            alt=""
            crossOrigin="anonymous"
            style={{
              height: `${100 * imgSettings.scale}%`,
              maxWidth: "none",
              width: "auto",
              transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        </div>
      )}

      {/* Dark radial glow behind guest name for legibility */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "26%",
          background:
            "linear-gradient(to top, rgba(2,5,18,1) 0%, rgba(2,5,18,0.95) 22%, rgba(2,5,18,0.65) 45%, rgba(2,5,18,0.25) 65%, transparent 82%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Guest name + role under photo */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            bottom: "9.5%",
            zIndex: 7,
            textAlign: "center",
          }}
        >
          <FitText
            text={guestName.toUpperCase()}
            baseFontSize="0.92em"
            style={{
              fontWeight: 800,
              background: "linear-gradient(180deg, #7DD8D0 0%, #FFFFFF 65%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              filter:
                "drop-shadow(0 0.06em 0.18em rgba(0,0,0,0.75)) drop-shadow(0 0 0.55em rgba(0,0,0,0.65)) drop-shadow(0 0 1.1em rgba(0,0,0,0.45))",
            }}
          />
          <div
            style={{
              fontSize: "0.5em",
              marginTop: "0.7em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.9em",
            }}
          >
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
            <span
              style={{
                fontWeight: 700,
                color: "rgba(220,232,255,0.85)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {guestRole || "Guest"}
            </span>
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function PortraitTemplate({
  config,
  headline,
  subheadline,
  dateText,
  guestName,
  guestRole,
  ctaText,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  subheadline: string;
  dateText: string;
  guestName: string;
  guestRole: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.052);
  useFitParent(containerRef, 1080 / 1350);

  const showCta = config.variant === "cta";
  const showDate = config.variant === "dates";
  const fullName = (guestName.trim() || "GUEST").toUpperCase();

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: "1080/1350",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#07213C",
        fontSize: "16px",
      }}
    >
      {/* Background */}
      <img
        src={BG_PORTRAIT}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Line frame - rendered on top so it crosses in front of guest */}
      <img
        src={LINE_PORTRAIT}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      {/* Vertical stroked guest full name on LEFT side */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "3.5%",
            top: 0,
            bottom: 0,
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            transformOrigin: "center center",
            fontSize: "1.7em",
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: "transparent",
            WebkitTextStroke: "0.018em rgba(150, 200, 255, 0.14)",
            textTransform: "uppercase",
            lineHeight: 1,
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {fullName}
        </div>
      )}

      {/* Logo top center */}
      <img
        src={LOGO_URL}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: "9%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "62%",
          height: "auto",
          objectFit: "contain",
          zIndex: 4,
        }}
      />

      {/* Headline + date/cta — center top */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          top: "25%",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7em",
        }}
      >
        <div
          style={{
            fontSize: "1.15em",
            fontWeight: 800,
            lineHeight: 1.12,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {headline || "Enter Headline"}
        </div>
        {subheadline && (
          <div
            style={{
              fontSize: "0.5em",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(220,232,255,0.85)",
              letterSpacing: "0.005em",
              textAlign: "center",
              marginTop: "-0.2em",
              maxWidth: "90%",
            }}
          >
            {subheadline}
          </div>
        )}

        {showDate && dateText && (
          <div
            style={{
              fontSize: "0.6em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55em",
              padding: "0.6em 1.2em",
              border: "0.085em solid #2896FB",
              borderRadius: "0.55em",
              background: "rgba(40,150,251,0.04)",
            }}
          >
            <svg
              width="0.95em"
              height="0.95em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2896FB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              style={{
                fontSize: "0.72em",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {dateText}
            </span>
          </div>
        )}

        {showCta && ctaText && (
          <div
            style={{
              display: "inline-block",
              padding: "0.6em 1.6em",
              fontSize: "0.72em",
              fontWeight: 800,
              color: "#0A1628",
              background: "linear-gradient(135deg, #FFC328 0%, #FFD84D 100%)",
              borderRadius: "0.5em",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              boxShadow: "0 0.15em 0.6em rgba(255,195,40,0.35)",
            }}
          >
            {ctaText}
          </div>
        )}
      </div>

      {/* Person image bottom-center */}
      {personImage && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            width: "92%",
            height: "78%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <img
            src={personImage}
            alt=""
            crossOrigin="anonymous"
            style={{
              height: `${100 * imgSettings.scale}%`,
              maxWidth: "none",
              width: "auto",
              transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        </div>
      )}

      {/* Dark radial glow behind guest name for legibility */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "24%",
          background:
            "linear-gradient(to top, rgba(2,5,18,1) 0%, rgba(2,5,18,0.95) 22%, rgba(2,5,18,0.65) 45%, rgba(2,5,18,0.25) 65%, transparent 82%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Guest name + role under photo */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            bottom: "8.5%",
            zIndex: 7,
            textAlign: "center",
          }}
        >
          <FitText
            text={guestName.toUpperCase()}
            baseFontSize="1em"
            style={{
              fontWeight: 800,
              background: "linear-gradient(180deg, #7DD8D0 0%, #FFFFFF 65%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              filter:
                "drop-shadow(0 0.06em 0.18em rgba(0,0,0,0.75)) drop-shadow(0 0 0.55em rgba(0,0,0,0.65)) drop-shadow(0 0 1.1em rgba(0,0,0,0.45))",
            }}
          />
          <div
            style={{
              fontSize: "0.5em",
              marginTop: "0.7em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.9em",
            }}
          >
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
            <span
              style={{
                fontWeight: 700,
                color: "rgba(220,232,255,0.85)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {guestRole || "Guest"}
            </span>
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StoryTemplate({
  config,
  headline,
  subheadline,
  dateText,
  guestName,
  guestRole,
  ctaText,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  subheadline: string;
  dateText: string;
  guestName: string;
  guestRole: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.058);
  useFitParent(containerRef, 1080 / 1920);

  const showCta = config.variant === "cta";
  const showDate = config.variant === "dates";
  const fullName = (guestName.trim() || "GUEST").toUpperCase();

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: "1080/1920",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#07213C",
        fontSize: "16px",
      }}
    >
      {/* Background */}
      <img
        src={BG_STORY}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Line frame - rendered on top so it crosses in front of guest */}
      <img
        src={LINE_STORY}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      {/* Vertical stroked guest full name on LEFT side */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "3.5%",
            top: 0,
            bottom: 0,
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            transformOrigin: "center center",
            fontSize: "1.65em",
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: "transparent",
            WebkitTextStroke: "0.018em rgba(150, 200, 255, 0.14)",
            textTransform: "uppercase",
            lineHeight: 1,
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {fullName}
        </div>
      )}

      {/* Logo top center */}
      <img
        src={LOGO_URL}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "62%",
          height: "auto",
          objectFit: "contain",
          zIndex: 4,
        }}
      />

      {/* Headline + date/cta — center top */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          top: "23%",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7em",
        }}
      >
        <div
          style={{
            fontSize: "1.18em",
            fontWeight: 800,
            lineHeight: 1.12,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {headline || "Enter Headline"}
        </div>
        {subheadline && (
          <div
            style={{
              fontSize: "0.5em",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(220,232,255,0.85)",
              letterSpacing: "0.005em",
              textAlign: "center",
              marginTop: "-0.2em",
              maxWidth: "90%",
            }}
          >
            {subheadline}
          </div>
        )}

        {showDate && dateText && (
          <div
            style={{
              fontSize: "0.6em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55em",
              padding: "0.6em 1.2em",
              border: "0.085em solid #2896FB",
              borderRadius: "0.55em",
              background: "rgba(40,150,251,0.04)",
            }}
          >
            <svg
              width="0.95em"
              height="0.95em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2896FB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              style={{
                fontSize: "0.72em",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {dateText}
            </span>
          </div>
        )}

        {showCta && ctaText && (
          <div
            style={{
              display: "inline-block",
              padding: "0.6em 1.6em",
              fontSize: "0.72em",
              fontWeight: 800,
              color: "#0A1628",
              background: "linear-gradient(135deg, #FFC328 0%, #FFD84D 100%)",
              borderRadius: "0.5em",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              boxShadow: "0 0.15em 0.6em rgba(255,195,40,0.35)",
            }}
          >
            {ctaText}
          </div>
        )}
      </div>

      {/* Person image bottom-center */}
      {personImage && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            width: "92%",
            height: "78%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <img
            src={personImage}
            alt=""
            crossOrigin="anonymous"
            style={{
              height: `${100 * imgSettings.scale}%`,
              maxWidth: "none",
              width: "auto",
              transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        </div>
      )}

      {/* Dark radial glow behind guest name for legibility */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "20%",
          background:
            "linear-gradient(to top, rgba(2,5,18,1) 0%, rgba(2,5,18,0.95) 22%, rgba(2,5,18,0.65) 45%, rgba(2,5,18,0.25) 65%, transparent 82%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Guest name + role under photo */}
      {guestName && (
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            bottom: "8%",
            zIndex: 7,
            textAlign: "center",
          }}
        >
          <FitText
            text={guestName.toUpperCase()}
            baseFontSize="1em"
            style={{
              fontWeight: 800,
              background: "linear-gradient(180deg, #7DD8D0 0%, #FFFFFF 65%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              filter:
                "drop-shadow(0 0.06em 0.18em rgba(0,0,0,0.75)) drop-shadow(0 0 0.55em rgba(0,0,0,0.65)) drop-shadow(0 0 1.1em rgba(0,0,0,0.45))",
            }}
          />
          <div
            style={{
              fontSize: "0.5em",
              marginTop: "0.7em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.9em",
            }}
          >
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
            <span
              style={{
                fontWeight: 700,
                color: "rgba(220,232,255,0.85)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {guestRole || "Guest"}
            </span>
            <span style={{ width: "1.8em", height: "0.08em", background: "rgba(220,232,255,0.55)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatePreview(props: {
  config: TemplateConfig;
  headline: string;
  subheadline: string;
  dateText: string;
  guestName: string;
  guestRole: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  if (props.config.group === "square") return <SquareTemplate {...props} />;
  if (props.config.group === "portrait") return <PortraitTemplate {...props} />;
  if (props.config.group === "story") return <StoryTemplate {...props} />;
  return <HorizontalTemplate {...props} />;
}

const STORAGE_KEY = "masterclass-workspace-state";

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return key in data ? data[key] : fallback;
  } catch { return fallback; }
}

function saveToDisk(patch: Record<string, unknown>) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    Object.assign(data, patch);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function usePersistedState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setValRaw] = useState<T>(() => loadSaved(key, fallback));
  const setVal = useCallback((v: T | ((prev: T) => T)) => {
    setValRaw((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      saveToDisk({ [key]: next });
      return next;
    });
  }, [key]);
  return [val, setVal];
}

export function MasterClassWorkspace() {
  const [headline, setHeadline] = usePersistedState("headline", "");
  const [subheadline, setSubheadline] = usePersistedState("subheadline", "");
  const [dateText, setDateText] = usePersistedState("dateText", "");
  const [guestName, setGuestName] = usePersistedState("guestName", "");
  const [guestRole, setGuestRole] = usePersistedState("guestRole", "Guest");
  const [ctaText, setCtaText] = usePersistedState("ctaText", "");
  const [personImage, setPersonImage] = usePersistedState<string | null>("personImage", null);
  const [imgSettingsByGroup, setImgSettingsByGroup] = usePersistedState<Record<string, ImageSettings>>("imgSettingsByGroup", {});
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = usePersistedState("selectedTemplate", "horizontal-dates");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      setIsRemovingBg(true);
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(src, { model: "medium", output: { format: "image/png" } });
        setPersonImage(URL.createObjectURL(blob));
      } catch {
        setPersonImage(src);
      } finally {
        setIsRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const activeTemplates = TEMPLATES;

  useEffect(() => {
    if (!activeTemplates.find((t) => t.id === selectedTemplate)) {
      setSelectedTemplate(activeTemplates[0]?.id || TEMPLATES[0].id);
    }
  }, [activeTemplates, selectedTemplate]);

  const currentConfig = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
  const currentGroup = currentConfig.group;
  const groupTemplates = activeTemplates.filter((t) => t.group === currentGroup);

  const DEFAULT_IMG_SETTINGS: ImageSettings = { scale: 1, offsetX: 0, offsetY: 0 };
  const imgSettings = imgSettingsByGroup[currentGroup] ?? DEFAULT_IMG_SETTINGS;
  const setImgSettings = (updater: ImageSettings | ((s: ImageSettings) => ImageSettings)) => {
    setImgSettingsByGroup((all) => {
      const prev = all[currentGroup] ?? DEFAULT_IMG_SETTINGS;
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...all, [currentGroup]: next };
    });
  };
  const getImgSettingsFor = (group: string): ImageSettings => imgSettingsByGroup[group] ?? DEFAULT_IMG_SETTINGS;

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
    const w = window.open(blobUrl, "_blank");
    if (!w || w.closed) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 200);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }, []);

  const stripRadii = useCallback((root: HTMLElement) => {
    const saved: Array<{ el: HTMLElement; orig: string }> = [];
    const all = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.borderRadius && cs.borderRadius !== "0px") {
        saved.push({ el, orig: el.style.borderRadius });
        el.style.borderRadius = "0";
      }
    }
    return saved;
  }, []);

  const restoreRadii = useCallback((saved: Array<{ el: HTMLElement; orig: string }>) => {
    for (const { el, orig } of saved) {
      el.style.borderRadius = orig;
    }
  }, []);

  const exportTemplate = useCallback(async (templateId: string, containerEl?: HTMLElement) => {
    const root = containerEl || document;
    const el = root.querySelector(`[data-template-id="${templateId}"]`) as HTMLElement;
    if (!el) { console.error("exportTemplate: element not found for", templateId); return; }
    const config = TEMPLATES.find((t) => t.id === templateId);
    if (!config) return;
    setIsExporting(templateId);
    const saved = stripRadii(el);
    try {
      const dataUrl = await toPng(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        pixelRatio: config.width / el.offsetWidth,
        cacheBust: true,
        skipAutoScale: true,
        style: { borderRadius: "0" },
      });
      const blob = dataUrlToBlob(dataUrl);
      const filename = `MasterClass_${config.name.replace(/\s+/g, "_")}_${config.width}x${config.height}.png`;
      triggerDownload(blob, filename);
      createThumbnail(dataUrl).then((thumb) => addExport({ name: filename, source: "Master Class", format: "png", thumbnail: thumb, dimensions: `${config.width}x${config.height}` }));
    } catch (err) {
      console.error("exportTemplate error:", err);
    } finally {
      restoreRadii(saved);
      setIsExporting(null);
    }
  }, [dataUrlToBlob, triggerDownload, stripRadii, restoreRadii]);

  const exportAllZip = useCallback(async () => {
    setIsExportingAll(true);
    try {
      const container = galleryRef.current || document;
      const zip = new JSZip();
      for (const t of activeTemplates) {
        const el = container.querySelector(`[data-template-id="${t.id}"]`) as HTMLElement;
        if (!el) { console.error("ZIP: element not found for", t.id); continue; }
        const saved = stripRadii(el);
        const dataUrl = await toPng(el, {
          width: el.offsetWidth,
          height: el.offsetHeight,
          pixelRatio: t.width / el.offsetWidth,
          cacheBust: true,
          skipAutoScale: true,
          style: { borderRadius: "0" },
        });
        restoreRadii(saved);
        const base64 = dataUrl.split(",")[1];
        zip.file(`MasterClass_${t.name.replace(/\s+/g, "_")}_${t.width}x${t.height}.png`, base64, { base64: true });
        await new Promise((r) => setTimeout(r, 200));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const zipName = `MasterClass_${guestName.trim().replace(/\s+/g, "_") || "export"}.zip`;
      triggerDownload(blob, zipName);
    } catch (err) {
      console.error("exportAllZip error:", err);
    } finally {
      setIsExportingAll(false);
    }
  }, [activeTemplates, guestName, triggerDownload, stripRadii, restoreRadii]);

  const inputCls = "w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] transition-all";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      <div className="w-full md:w-[340px] md:min-w-[340px] overflow-y-auto pt-[20px] px-[16px] md:px-[24px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="mb-[16px]">
          <h2 className="text-[16px] font-bold text-white mb-[4px]">Master Class</h2>
          <p className="text-[11px] text-[#64748B]">Promo banners for HighLevel masterclass sessions.</p>
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col">
            <label className={labelCls}>Size</label>
            <div className="grid grid-cols-2 gap-[6px]">
              {SIZE_GROUPS.map((g) => {
                const isActive = currentGroup === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => {
                      const first = activeTemplates.find((t) => t.group === g.key);
                      if (first) setSelectedTemplate(first.id);
                    }}
                    className={`flex flex-col items-center gap-[6px] py-[10px] px-[6px] rounded-[10px] cursor-pointer border transition-all duration-200
                      ${isActive
                        ? "bg-[rgba(0,178,169,0.06)] border-[rgba(0,178,169,0.25)]"
                        : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]"
                      }`}
                  >
                    <div
                      className={`h-[26px] rounded-[3px] transition-all
                        ${isActive
                          ? "bg-gradient-to-br from-[rgba(0,178,169,0.35)] to-[rgba(40,150,251,0.2)] shadow-[inset_0_0_0_1.5px_rgba(0,178,169,0.5)]"
                          : "bg-[rgba(255,255,255,0.06)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        }`}
                      style={{ aspectRatio: g.ar }}
                    />
                    <div className={`text-[9px] font-semibold transition-all ${isActive ? "text-[#00B2A9]" : "text-[#64748B]"}`}>{g.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {groupTemplates.length > 1 && (
            <div className="flex flex-col">
              <label className={labelCls}>Variant</label>
              <div className="flex items-center gap-[2px] p-[3px] rounded-[10px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.04)]">
                {groupTemplates.map((t) => {
                  const isActive = selectedTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex-1 py-[6px] rounded-[7px] text-[10px] font-semibold transition-all duration-200 cursor-pointer border-none
                        ${isActive
                          ? "bg-[rgba(0,178,169,0.12)] text-[#00B2A9] shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                          : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                        }`}
                    >
                      {t.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-[1px] bg-[rgba(255,255,255,0.04)]" />

          <div className="flex flex-col">
            <label className={labelCls}>Headline <span className="text-[#FF6B6B]">*</span></label>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Land Your First 5 Clients With HighLevel (No Ads Needed)" rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Subheadline <span className="text-[#64748B]">(optional)</span></label>
            <textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="A live walkthrough for new agency owners" rows={2} className={`${inputCls} resize-none`} />
          </div>

          {currentConfig.variant === "dates" && (
            <div className="flex flex-col">
              <label className={labelCls}>Date <span className="text-[#FF6B6B]">*</span></label>
              <input type="text" value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="DECEMBER 11, 12PM EST" className={inputCls} />
            </div>
          )}

          {currentConfig.variant === "cta" && (
            <div className="flex flex-col">
              <label className={labelCls}>CTA Text <span className="text-[#FF6B6B]">*</span></label>
              <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Reserve My Seat" className={inputCls} />
            </div>
          )}

          <div className="flex flex-col">
            <label className={labelCls}>Guest Name <span className="text-[#FF6B6B]">*</span></label>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Adley Kingsman" className={inputCls} />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Role / Label</label>
            <input type="text" value={guestRole} onChange={(e) => setGuestRole(e.target.value)} placeholder="Guest" className={inputCls} />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Guest Image <span className="text-[#FF6B6B]">*</span></label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
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
                    <div className="text-[10px] font-medium text-[#94A3B8]">Upload guest photo</div>
                    <div className="text-[9px] text-[#475569]">BG will be auto-removed</div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-[12px] border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] overflow-hidden">
                <div className="flex items-center gap-[10px] p-[10px] border-b border-[rgba(255,255,255,0.04)]">
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
                    <button onClick={() => { setPersonImage(null); setImgSettingsByGroup({}); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all" title="Remove image">
                      <X className="w-[10px] h-[10px]" />
                    </button>
                  </div>
                </div>
                <div className="px-[10px] py-[8px] flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <ZoomIn className="w-[12px] h-[12px] text-[#64748B] shrink-0" />
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">Size</span>
                    <input
                      type="range" min="0.5" max="1.8" step="0.02"
                      value={imgSettings.scale}
                      onChange={(e) => setImgSettings((s) => ({ ...s, scale: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{Math.round(imgSettings.scale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <svg className="w-[12px] h-[12px] text-[#64748B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">X</span>
                    <input
                      type="range" min="-40" max="40" step="1"
                      value={imgSettings.offsetX}
                      onChange={(e) => setImgSettings((s) => ({ ...s, offsetX: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{imgSettings.offsetX > 0 ? "+" : ""}{imgSettings.offsetX}</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <ArrowUpDown className="w-[12px] h-[12px] text-[#64748B] shrink-0" />
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">Y</span>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={imgSettings.offsetY}
                      onChange={(e) => setImgSettings((s) => ({ ...s, offsetY: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{imgSettings.offsetY > 0 ? "+" : ""}{imgSettings.offsetY}</span>
                  </div>
                  <button
                    onClick={() => setImgSettings({ scale: 1, offsetX: 0, offsetY: 0 })}
                    className="text-[9px] text-[#64748B] hover:text-[#94A3B8] cursor-pointer bg-transparent border-none p-0 self-end transition-all"
                  >Reset</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <button onClick={() => exportTemplate(currentConfig.id, previewRef.current || undefined)} disabled={isExporting === currentConfig.id} className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-50">
              {isExporting === currentConfig.id ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
              Download Current
            </button>
            <button onClick={() => setShowGallery(true)} disabled={!headline.trim() || (currentConfig.variant === "dates" && !dateText.trim()) || !guestName.trim() || !personImage} className="w-full py-[9px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#94A3B8] text-[10px] font-medium flex items-center justify-center gap-[5px] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Sparkles className="w-[11px] h-[11px]" />
              Preview & Download All ({activeTemplates.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        {!showGallery ? (
          <LivePreview>
            <div className="w-full h-full max-w-[640px] flex items-center justify-center min-h-0" ref={previewRef}>
              <TemplatePreview config={currentConfig} headline={headline} subheadline={subheadline} dateText={dateText} guestName={guestName} guestRole={guestRole} ctaText={ctaText} personImage={personImage} imgSettings={imgSettings} />
            </div>
          </LivePreview>
        ) : (
          <div className="flex-1 overflow-y-auto" ref={galleryRef}>
            <div className="max-w-[1100px] mx-auto py-[20px] px-[20px]">
              <div className="flex items-center justify-between mb-[20px] flex-wrap gap-[10px]">
                <div>
                  <h3 className="text-[16px] font-bold text-white mb-[2px]">All Templates</h3>
                  <p className="text-[11px] text-[#64748B]">{activeTemplates.length} templates ready</p>
                </div>
                <div className="flex gap-[8px]">
                  <button onClick={() => setShowGallery(false)} className="h-[32px] px-[14px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] text-[11px] font-medium flex items-center gap-[5px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-all">Back to Editor</button>
                  <button onClick={exportAllZip} disabled={isExportingAll} className="h-[32px] px-[16px] rounded-[8px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center gap-[5px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all disabled:opacity-50">
                    {isExportingAll ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <PackageOpen className="w-[12px] h-[12px]" />}
                    {isExportingAll ? "Creating ZIP..." : "Download All (ZIP)"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                {activeTemplates.map((t) => (
                  <div key={t.id} className="rounded-[14px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="p-[10px]">
                      <TemplatePreview config={t} headline={headline} subheadline={subheadline} dateText={dateText} guestName={guestName} guestRole={guestRole} ctaText={ctaText} personImage={personImage} imgSettings={getImgSettingsFor(t.group)} />
                    </div>
                    <div className="flex items-center justify-between px-[14px] py-[10px] border-t border-[rgba(255,255,255,0.04)]">
                      <div>
                        <div className="text-[11px] font-semibold text-white">{t.name}</div>
                        <div className="text-[9px] text-[#64748B] mt-[1px]">{t.width} × {t.height}</div>
                      </div>
                      <button onClick={() => exportTemplate(t.id, galleryRef.current || undefined)} disabled={isExporting === t.id} className="h-[28px] px-[12px] rounded-[6px] bg-[rgba(255,255,255,0.06)] border-none text-[#E2E8F0] text-[10px] font-medium flex items-center gap-[5px] cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all disabled:opacity-50">
                        {isExporting === t.id ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Download className="w-[11px] h-[11px]" />}
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
