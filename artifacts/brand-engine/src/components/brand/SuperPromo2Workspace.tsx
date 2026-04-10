import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud, X, Loader2, Download, Check, Sparkles, ZoomIn, ArrowUpDown, RefreshCw, PackageOpen
} from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { LivePreview } from "./LivePreview";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/superpromo2/background.png`;
const LOGO_URL = `${BASE}assets/superpromo2/logo-light.png`;
const SILHOUETTE_URL = `${BASE}assets/superpromo2/silhouette.png`;

type Variant = "dates" | "cta" | "nodate" | "day1" | "day2" | "replays";
type SizeMode = "horizontal" | "vertical" | "portrait" | "quicklinks";

interface TemplateConfig {
  id: string;
  name: string;
  shortName: string;
  width: number;
  height: number;
  variant: Variant;
  size: SizeMode;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "hz-dates", name: "Horizontal - Dates", shortName: "Dates", width: 1920, height: 1080, variant: "dates", size: "horizontal" },
  { id: "hz-cta", name: "Horizontal - CTA", shortName: "CTA", width: 1920, height: 1080, variant: "cta", size: "horizontal" },
  { id: "hz-nodate", name: "Horizontal - No Date", shortName: "No Date", width: 1920, height: 1080, variant: "nodate", size: "horizontal" },
  { id: "hz-day1", name: "Horizontal - Day 1", shortName: "Day 1", width: 1920, height: 1080, variant: "day1", size: "horizontal" },
  { id: "hz-day2", name: "Horizontal - Day 2", shortName: "Day 2", width: 1920, height: 1080, variant: "day2", size: "horizontal" },
  { id: "hz-replays", name: "Horizontal - Replays", shortName: "Replays", width: 1920, height: 1080, variant: "replays", size: "horizontal" },
  { id: "vt-dates", name: "Vertical - Dates", shortName: "Dates", width: 1080, height: 1920, variant: "dates", size: "vertical" },
  { id: "vt-nodate", name: "Vertical - No Date", shortName: "No Date", width: 1080, height: 1920, variant: "nodate", size: "vertical" },
  { id: "vt-replays", name: "Vertical - Replays", shortName: "Replays", width: 1080, height: 1920, variant: "replays", size: "vertical" },
  { id: "pt-dates", name: "Portrait - Dates", shortName: "Dates", width: 1080, height: 1350, variant: "dates", size: "portrait" },
  { id: "pt-nodate", name: "Portrait - No Date", shortName: "No Date", width: 1080, height: 1350, variant: "nodate", size: "portrait" },
  { id: "pt-replays", name: "Portrait - Replays", shortName: "Replays", width: 1080, height: 1350, variant: "replays", size: "portrait" },
  { id: "ql-dates", name: "Quick Links - Dates", shortName: "Dates", width: 1080, height: 1080, variant: "dates", size: "quicklinks" },
];

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

interface ImageSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function HorizontalTemplate({
  config,
  headline,
  dateText,
  ctaText,
  hostName,
  hostTitle,
  hostImage,
  guestName,
  guestTitle,
  guestImage,
  hostSettings,
  guestSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  ctaText: string;
  hostName: string;
  hostTitle: string;
  hostImage: string | null;
  guestName: string;
  guestTitle: string;
  guestImage: string | null;
  hostSettings: ImageSettings;
  guestSettings: ImageSettings;
}) {
  const { variant } = config;
  const showDate = variant === "dates" || variant === "cta";
  const showCta = variant === "cta";
  const showDay = variant === "day1" || variant === "day2";
  const showReplays = variant === "replays";
  const dayLabel = variant === "day1" ? "DAY 1" : variant === "day2" ? "DAY 2" : "";
  const contentTop = variant === "nodate" ? "28%" : "20%";
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);

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
        backgroundColor: "#2563EB",
        fontSize: "16px",
      }}
    >
      <img src={BG_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", top: "7%", left: "5%", height: "7.5%", width: "auto", objectFit: "contain", zIndex: 3 }} />

      <div style={{ position: "absolute", left: "5%", top: contentTop, width: "45%", zIndex: 3, display: "flex", flexDirection: "column", gap: "0.4em" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.3em", marginBottom: "0.15em",
          alignSelf: "flex-start",
        }}>
          <svg width="0.9em" height="0.9em" viewBox="0 0 32 32" fill="none" style={{ transform: "rotate(90deg)", flexShrink: 0 }}>
            <circle cx="16" cy="16" r="3" fill="#FFD000" />
            <path d="M11 11a7.07 7.07 0 0 1 10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 21a7.07 7.07 0 0 1-10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M8 8a11.3 11.3 0 0 1 16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 24a11.3 11.3 0 0 1-16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: "0.38em", fontWeight: 700, color: "#FFD000", letterSpacing: "0.2em", textTransform: "uppercase" }}>Free Virtual Event</span>
        </div>
        <div>
          <span style={{
            fontSize: "1.24em", fontWeight: 700, lineHeight: 1.08,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            display: "inline",
          }}>
            {headline ? headline.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            )) : "Enter Headline"}
          </span>
        </div>

        {variant === "dates" && dateText && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.25em",
            padding: "0.32em 0.7em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
            alignSelf: "flex-start",
          }}>
            <svg width="0.7em" height="0.7em" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: "0.43em", fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.02em" }}>{dateText}</span>
          </div>
        )}

        {showCta && dateText && (
          <span style={{ fontSize: "0.43em", fontWeight: 700, color: "#FFD000", letterSpacing: "0.02em" }}>{dateText}</span>
        )}

        {showCta && ctaText && (
          <div>
            <span style={{
              display: "inline-block", padding: "0.4em 1.4em",
              fontSize: "0.52em", fontWeight: 800, color: "#1A1A1A",
              background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
              borderRadius: "0.35em", letterSpacing: "0.03em",
            }}>{ctaText}</span>
          </div>
        )}

        {showDay && (
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0.28em 0.8em",
            background: "linear-gradient(135deg, #16204F 0%, #3249B5 100%)",
            borderRadius: "0.2em",
            alignSelf: "flex-start",
          }}>
            <span style={{
              fontSize: "1.12em", fontWeight: 800, lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#FFD000",
              display: "flex", alignItems: "center",
            }}>{dayLabel}</span>
          </div>
        )}

        {showReplays && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.23em",
            padding: "0.23em 0.62em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.2em",
            alignSelf: "flex-start",
          }}>
            <svg width="0.94em" height="0.94em" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 4v6h6" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontSize: "1.09em", fontWeight: 800, lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#1A1A1A",
            }}>REPLAYS</span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", right: "3%", bottom: 0, top: "8%",
        width: "42%",
        zIndex: 2,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {guestImage ? (
          <>
            <img src={guestImage} alt="" crossOrigin="anonymous" style={{
              maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center",
              transform: `scale(${guestSettings.scale}) translate(${guestSettings.offsetX}%, ${guestSettings.offsetY}%)`,
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }} />
          </>
        ) : (
          <img src={SILHOUETTE_URL} alt="" crossOrigin="anonymous" style={{ maxWidth: "90%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center", opacity: 0.35 }} />
        )}
      </div>

      <div style={{
        position: "absolute", right: "3%", bottom: "8%",
        width: "42%",
        zIndex: 3, textAlign: "center",
      }}>
        <div style={{
          fontSize: "0.88em", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, whiteSpace: "nowrap",
          textShadow: "0 0.06em 0.15em rgba(0,0,0,0.7), 0.4em 0 1.2em rgba(130,200,255,0.6), 0 0 0.8em rgba(130,200,255,0.3)",
        }}>{guestName || "Speaker Name"}</div>
        <div style={{
          fontSize: "0.38em", fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.3, marginTop: "0.3em",
          textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>{guestTitle || "Speaker Title"}</div>
      </div>

    </div>
  );
}

function VerticalTemplate({
  config,
  headline,
  dateText,
  hostName,
  hostTitle,
  hostImage,
  guestName,
  guestTitle,
  guestImage,
  hostSettings,
  guestSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  ctaText: string;
  hostName: string;
  hostTitle: string;
  hostImage: string | null;
  guestName: string;
  guestTitle: string;
  guestImage: string | null;
  hostSettings: ImageSettings;
  guestSettings: ImageSettings;
}) {
  const { variant } = config;
  const showDate = variant === "dates";
  const showReplays = variant === "replays";
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);

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
        backgroundColor: "#2563EB",
        fontSize: "16px",
      }}
    >
      <img src={BG_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{
        position: "absolute", top: "4.55%", left: "50%", transform: "translateX(-50%)",
        height: "4.5%", width: "auto", objectFit: "contain", zIndex: 3,
      }} />

      <div style={{
        position: "absolute", left: "7%", right: "7%", top: "14%", zIndex: 3,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5em",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.3em",
        }}>
          <svg width="1.56em" height="1.56em" viewBox="0 0 32 32" fill="none" style={{ transform: "rotate(90deg)" }}>
            <circle cx="16" cy="16" r="3" fill="#FFD000" />
            <path d="M11 11a7.07 7.07 0 0 1 10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 21a7.07 7.07 0 0 1-10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M8 8a11.3 11.3 0 0 1 16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 24a11.3 11.3 0 0 1-16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: "0.55em", fontWeight: 700, color: "#FFD000", letterSpacing: "0.2em", textTransform: "uppercase" }}>Free Virtual Event</span>
        </div>
        <div style={{ textAlign: "center", marginTop: "0.4em" }}>
          <span style={{
            fontSize: "2.03em", fontWeight: 700, lineHeight: 1.08,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            display: "inline",
          }}>
            {headline ? headline.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            )) : "Enter Headline"}
          </span>
        </div>

        {showDate && dateText && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.25em",
            padding: "0.32em 0.7em", marginTop: "0.3em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: "0.66em", fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.02em" }}>{dateText}</span>
          </div>
        )}

        {showReplays && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.3em",
            padding: "0.35em 1em", marginTop: "1em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 4v6h6" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontSize: "1.4em", fontWeight: 800, lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#1A1A1A",
            }}>REPLAYS</span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%",
        height: "55%",
        zIndex: 2,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {guestImage ? (
          <>
            <img src={guestImage} alt="" crossOrigin="anonymous" style={{
              maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center",
              transform: `scale(${guestSettings.scale}) translate(${guestSettings.offsetX}%, ${guestSettings.offsetY}%)`,
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }} />
          </>
        ) : (
          <img src={SILHOUETTE_URL} alt="" crossOrigin="anonymous" style={{ maxWidth: "70%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center", opacity: 0.35 }} />
        )}
      </div>

      <div style={{
        position: "absolute", bottom: "4%", left: "7%", right: "7%",
        zIndex: 3, textAlign: "center",
      }}>
        <div style={{
          fontSize: "1.08em", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, whiteSpace: "nowrap",
          textShadow: "0 0.06em 0.15em rgba(0,0,0,0.7), 0.4em 0 1.2em rgba(130,200,255,0.6), 0 0 0.8em rgba(130,200,255,0.3)",
        }}>{guestName || "Speaker Name"}</div>
        <div style={{
          fontSize: "0.69em", fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.3, marginTop: "0.15em",
          textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>{guestTitle || "Speaker Title"}</div>
      </div>
    </div>
  );
}

function PortraitTemplate({
  config,
  headline,
  dateText,
  hostName,
  hostTitle,
  hostImage,
  guestName,
  guestTitle,
  guestImage,
  hostSettings,
  guestSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  ctaText: string;
  hostName: string;
  hostTitle: string;
  hostImage: string | null;
  guestName: string;
  guestTitle: string;
  guestImage: string | null;
  hostSettings: ImageSettings;
  guestSettings: ImageSettings;
}) {
  const { variant } = config;
  const showDate = variant === "dates";
  const showReplays = variant === "replays";
  const contentTop = (showDate || showReplays) ? "15%" : "21%";
  const headlineSize = variant === "nodate" ? "2.02em" : "2.0em";
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);

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
        backgroundColor: "#2563EB",
        fontSize: "16px",
      }}
    >
      <img src={BG_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{
        position: "absolute", top: "4.5%", left: "50%", transform: "translateX(-50%)",
        height: "1.54em", width: "auto", objectFit: "contain", zIndex: 3,
      }} />

      <div style={{
        position: "absolute", left: "6%", right: "6%", top: contentTop, zIndex: 3,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5em",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.25em",
        }}>
          <svg width="0.66em" height="0.66em" viewBox="0 0 32 32" fill="none" style={{ transform: "rotate(90deg)" }}>
            <circle cx="16" cy="16" r="3" fill="#FFD000" />
            <path d="M11 11a7.07 7.07 0 0 1 10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 21a7.07 7.07 0 0 1-10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M8 8a11.3 11.3 0 0 1 16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 24a11.3 11.3 0 0 1-16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: "0.3em", fontWeight: 700, color: "#FFD000", letterSpacing: "0.2em", textTransform: "uppercase" }}>Free Virtual Event</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{
            fontSize: headlineSize, fontWeight: 700, lineHeight: 1.08,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            display: "inline",
          }}>
            {headline ? headline.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            )) : "Enter Headline"}
          </span>
        </div>

        {showDate && dateText && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.25em",
            padding: "0.32em 0.7em", marginTop: "0.4em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="1.4em" height="1.4em" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: "0.84em", fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.02em" }}>{dateText}</span>
          </div>
        )}

        {showReplays && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.3em",
            padding: "0.35em 1em", marginTop: "0.4em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 4v6h6" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontSize: "1.4em", fontWeight: 800, lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#1A1A1A",
            }}>REPLAYS</span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%",
        height: "48%",
        zIndex: 2,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {guestImage ? (
          <>
            <img src={guestImage} alt="" crossOrigin="anonymous" style={{
              maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center",
              transform: `scale(${guestSettings.scale}) translate(${guestSettings.offsetX}%, ${guestSettings.offsetY}%)`,
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }} />
          </>
        ) : (
          <img src={SILHOUETTE_URL} alt="" crossOrigin="anonymous" style={{ maxWidth: "65%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center", opacity: 0.35 }} />
        )}
      </div>

      <div style={{
        position: "absolute", bottom: "3%", left: "6%", right: "6%",
        zIndex: 3, textAlign: "center",
      }}>
        <div style={{
          fontSize: "1.58em", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15,
          textShadow: "0 0.06em 0.15em rgba(0,0,0,0.7), 0.4em 0 1.2em rgba(130,200,255,0.6), 0 0 0.8em rgba(130,200,255,0.3)",
        }}>{guestName || "Speaker Name"}</div>
        <div style={{
          fontSize: "0.85em", fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.3, marginTop: "0.15em",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{guestTitle || "Speaker Title"}</div>
      </div>
    </div>
  );
}

function QuickLinksTemplate({
  config,
  headline,
  dateText,
  hostName,
  hostTitle,
  hostImage,
  guestName,
  guestTitle,
  guestImage,
  hostSettings,
  guestSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  ctaText: string;
  hostName: string;
  hostTitle: string;
  hostImage: string | null;
  guestName: string;
  guestTitle: string;
  guestImage: string | null;
  hostSettings: ImageSettings;
  guestSettings: ImageSettings;
}) {
  const { variant } = config;
  const showDate = variant === "dates";
  const showReplays = variant === "replays";
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);

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
        backgroundColor: "#2563EB",
        fontSize: "16px",
      }}
    >
      <img src={BG_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      <div style={{
        position: "absolute", top: "5%", left: "6%", right: "6%", zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{ height: "1.5em", width: "auto", objectFit: "contain" }} />
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.25em",
        }}>
          <svg width="0.66em" height="0.66em" viewBox="0 0 32 32" fill="none" style={{ transform: "rotate(90deg)" }}>
            <circle cx="16" cy="16" r="3" fill="#FFD000" />
            <path d="M11 11a7.07 7.07 0 0 1 10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 21a7.07 7.07 0 0 1-10 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M8 8a11.3 11.3 0 0 1 16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 24a11.3 11.3 0 0 1-16 0" stroke="#FFD000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: "0.23em", fontWeight: 700, color: "#FFD000", letterSpacing: "0.2em", textTransform: "uppercase" }}>Free Virtual Event</span>
        </div>
      </div>

      <div style={{
        position: "absolute", left: "6%", right: "6%", top: "16%", zIndex: 3,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4em",
      }}>
        {showDate && dateText && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.25em",
            padding: "0.28em 0.6em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="0.8em" height="0.8em" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: "0.52em", fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.02em" }}>{dateText}</span>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <span style={{
            fontSize: "1.47em", fontWeight: 700, lineHeight: 1.08,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            display: "inline",
          }}>
            {headline ? headline.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            )) : "Enter Headline"}
          </span>
        </div>

        {showReplays && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.3em",
            padding: "0.35em 1em", marginTop: "0.3em",
            background: "linear-gradient(135deg, #FFD000 0%, #FFEEA3 100%)",
            borderRadius: "0.25em",
          }}>
            <svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 4v6h6" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontSize: "1.4em", fontWeight: 800, lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#1A1A1A",
            }}>REPLAYS</span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%",
        height: "48%",
        zIndex: 2,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {guestImage ? (
          <>
            <img src={guestImage} alt="" crossOrigin="anonymous" style={{
              maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center",
              transform: `scale(${guestSettings.scale}) translate(${guestSettings.offsetX}%, ${guestSettings.offsetY}%)`,
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }} />
          </>
        ) : (
          <img src={SILHOUETTE_URL} alt="" crossOrigin="anonymous" style={{ maxWidth: "65%", maxHeight: "100%", objectFit: "contain", objectPosition: "bottom center", opacity: 0.35 }} />
        )}
      </div>

      <div style={{
        position: "absolute", bottom: "3%", left: "6%", right: "6%",
        zIndex: 3, textAlign: "center",
      }}>
        <div style={{
          fontSize: "1.08em", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15,
          textShadow: "0 0.06em 0.15em rgba(0,0,0,0.7), 0.4em 0 1.2em rgba(130,200,255,0.6), 0 0 0.8em rgba(130,200,255,0.3)",
        }}>{guestName || "Speaker Name"}</div>
        <div style={{
          fontSize: "0.54em", fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.3, marginTop: "0.12em",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{guestTitle || "Speaker Title"}</div>
      </div>
    </div>
  );
}

function TemplatePreview(props: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  ctaText: string;
  hostName: string;
  hostTitle: string;
  hostImage: string | null;
  guestName: string;
  guestTitle: string;
  guestImage: string | null;
  hostSettings: ImageSettings;
  guestSettings: ImageSettings;
}) {
  if (props.config.size === "vertical") return <VerticalTemplate {...props} />;
  if (props.config.size === "portrait") return <PortraitTemplate {...props} />;
  if (props.config.size === "quicklinks") return <QuickLinksTemplate {...props} />;
  return <HorizontalTemplate {...props} />;
}

export function SuperPromo2Workspace() {
  const [headline, setHeadline] = useState("");
  const [dateText, setDateText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [guestImage, setGuestImage] = useState<string | null>(null);
  const [guestSettings, setGuestSettings] = useState<ImageSettings>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [sizeMode, setSizeMode] = useState<SizeMode>("horizontal");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [showGallery, setShowGallery] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);

  const hostName = "";
  const hostTitle = "";
  const hostImage = null;
  const hostSettings: ImageSettings = { scale: 1, offsetX: 0, offsetY: 0 };

  const guestFileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = TEMPLATES.filter((t) => t.size === sizeMode);
  const currentConfig = filteredTemplates.find((t) => t.id === selectedTemplate) || filteredTemplates[0];

  const handleGuestUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingGuest(true);
    setGuestImage(URL.createObjectURL(file));
    setIsLoadingGuest(false);
  }, []);

  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/png";
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }, []);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }, []);

  const stripOuterRadius = useCallback((root: HTMLElement) => {
    const orig = root.style.borderRadius;
    root.style.borderRadius = "0";
    return orig;
  }, []);

  const restoreOuterRadius = useCallback((root: HTMLElement, orig: string) => {
    root.style.borderRadius = orig;
  }, []);

  const exportTemplate = useCallback(async (templateId: string, containerEl?: HTMLElement) => {
    const root = containerEl || document;
    const el = root.querySelector(`[data-template-id="${templateId}"]`) as HTMLElement;
    if (!el) return;
    const config = TEMPLATES.find((t) => t.id === templateId);
    if (!config) return;
    setIsExporting(templateId);
    const origRadius = stripOuterRadius(el);
    try {
      const dataUrl = await toPng(el, {
        width: el.offsetWidth, height: el.offsetHeight,
        pixelRatio: config.width / el.offsetWidth,
        cacheBust: true, skipAutoScale: true,
        style: { borderRadius: "0" },
      });
      const blob = dataUrlToBlob(dataUrl);
      triggerDownload(blob, `${config.name.replace(/\s+/g, "_")}_${config.width}x${config.height}.png`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      restoreOuterRadius(el, origRadius);
      setIsExporting(null);
    }
  }, [dataUrlToBlob, triggerDownload, stripOuterRadius, restoreOuterRadius]);

  const exportAllZip = useCallback(async () => {
    setIsExportingAll(true);
    try {
      const container = galleryRef.current || document;
      const zip = new JSZip();
      for (const t of TEMPLATES) {
        const el = container.querySelector(`[data-template-id="${t.id}"]`) as HTMLElement;
        if (!el) continue;
        const origRadius = stripOuterRadius(el);
        const dataUrl = await toPng(el, {
          width: el.offsetWidth, height: el.offsetHeight,
          pixelRatio: t.width / el.offsetWidth,
          cacheBust: true, skipAutoScale: true,
          style: { borderRadius: "0" },
        });
        restoreOuterRadius(el, origRadius);
        zip.file(`${t.name.replace(/\s+/g, "_")}_${t.width}x${t.height}.png`, dataUrl.split(",")[1], { base64: true });
        await new Promise((r) => setTimeout(r, 200));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      triggerDownload(blob, `SuperPromo2_${guestName.trim().replace(/\s+/g, "_") || "export"}.zip`);
    } catch (err) {
      console.error("ZIP error:", err);
    } finally {
      setIsExportingAll(false);
    }
  }, [guestName, triggerDownload, stripOuterRadius, restoreOuterRadius]);

  const inputCls = "w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] transition-all";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]";

  const renderImageUpload = (
    label: string,
    image: string | null,
    isLoading: boolean,
    fileRef: React.RefObject<HTMLInputElement | null>,
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onClear: () => void,
    settings: ImageSettings,
    setSettings: React.Dispatch<React.SetStateAction<ImageSettings>>,
  ) => (
    <div className="flex flex-col">
      <label className={labelCls}>{label} <span className="text-[#FF6B6B]">*</span></label>
      <input type="file" ref={fileRef} onChange={onUpload} accept="image/*" className="hidden" />
      {!image ? (
        <div
          onClick={() => !isLoading && fileRef.current?.click()}
          className="flex flex-col items-center gap-[6px] py-[14px] px-[14px] rounded-[12px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] cursor-pointer transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-[18px] h-[18px] text-[#2896FB] animate-spin" />
              <div className="text-[9px] font-medium text-[#94A3B8]">Loading...</div>
            </>
          ) : (
            <>
              <UploadCloud className="w-[18px] h-[18px] text-[#64748B]" />
              <div className="text-[9px] font-medium text-[#94A3B8]">Upload photo</div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] overflow-hidden">
          <div className="flex items-center gap-[8px] p-[8px] border-b border-[rgba(255,255,255,0.04)]">
            <img src={image} alt="" className="w-[32px] h-[32px] rounded-full object-cover bg-[rgba(255,255,255,0.04)]" />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-semibold text-[#00B2A9] flex items-center gap-[3px]"><Check className="w-[9px] h-[9px]" /> Ready</div>
            </div>
            <div className="flex items-center gap-[2px] shrink-0">
              <button onClick={() => fileRef.current?.click()} className="w-[22px] h-[22px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#94A3B8] flex items-center justify-center cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all" title="Replace">
                <RefreshCw className="w-[9px] h-[9px]" />
              </button>
              <button onClick={onClear} className="w-[22px] h-[22px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all" title="Remove">
                <X className="w-[9px] h-[9px]" />
              </button>
            </div>
          </div>
          <div className="px-[8px] py-[6px] flex flex-col gap-[5px]">
            <div className="flex items-center gap-[6px]">
              <ZoomIn className="w-[10px] h-[10px] text-[#64748B] shrink-0" />
              <span className="text-[8px] text-[#64748B] w-[20px] shrink-0">Size</span>
              <input type="range" min="0.5" max="2" step="0.02" value={settings.scale} onChange={(e) => setSettings((s) => ({ ...s, scale: parseFloat(e.target.value) }))} className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9]" />
              <span className="text-[8px] text-[#94A3B8] w-[24px] text-right tabular-nums">{Math.round(settings.scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-[6px]">
              <ArrowUpDown className="w-[10px] h-[10px] text-[#64748B] shrink-0 rotate-90" />
              <span className="text-[8px] text-[#64748B] w-[20px] shrink-0">X</span>
              <input type="range" min="-30" max="30" step="1" value={settings.offsetX} onChange={(e) => setSettings((s) => ({ ...s, offsetX: parseFloat(e.target.value) }))} className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9]" />
              <span className="text-[8px] text-[#94A3B8] w-[24px] text-right tabular-nums">{settings.offsetX > 0 ? "+" : ""}{settings.offsetX}</span>
            </div>
            <div className="flex items-center gap-[6px]">
              <ArrowUpDown className="w-[10px] h-[10px] text-[#64748B] shrink-0" />
              <span className="text-[8px] text-[#64748B] w-[20px] shrink-0">Y</span>
              <input type="range" min="-30" max="30" step="1" value={settings.offsetY} onChange={(e) => setSettings((s) => ({ ...s, offsetY: parseFloat(e.target.value) }))} className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9]" />
              <span className="text-[8px] text-[#94A3B8] w-[24px] text-right tabular-nums">{settings.offsetY > 0 ? "+" : ""}{settings.offsetY}</span>
            </div>
            <button onClick={() => setSettings({ scale: 1, offsetX: 0, offsetY: 0 })} className="text-[8px] text-[#64748B] hover:text-[#94A3B8] cursor-pointer bg-transparent border-none p-0 self-end transition-all">Reset</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      <div className="w-full md:w-[340px] md:min-w-[340px] overflow-y-auto pt-[20px] px-[16px] md:px-[24px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="mb-[16px]">
          <h2 className="text-[16px] font-bold text-white mb-[4px]">Super Promo 2</h2>
          <p className="text-[11px] text-[#64748B]">Guest-only campaign templates. Fill in details, preview live, then generate all.</p>
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col">
            <label className={labelCls}>Size</label>
            <div className="flex items-center gap-[8px]">
              {(["horizontal", "vertical", "portrait", "quicklinks"] as SizeMode[]).map((s) => {
                const isActive = sizeMode === s;
                const label = s === "horizontal" ? "Horizontal" : s === "vertical" ? "Vertical" : s === "portrait" ? "Portrait" : "Square";
                const iconW = s === "horizontal" ? 38 : s === "vertical" ? 20 : s === "portrait" ? 22 : 24;
                const iconH = s === "horizontal" ? 24 : s === "vertical" ? 30 : s === "portrait" ? 28 : 24;
                const iconR = s === "horizontal" ? 4 : 3;
                return (
                  <button
                    key={s}
                    onClick={() => { setSizeMode(s); setSelectedTemplate(TEMPLATES.filter((t) => t.size === s)[0].id); }}
                    className="cursor-pointer border-none bg-transparent p-0 flex-1"
                    style={{ outline: "none" }}
                  >
                    <div
                      className="flex flex-col items-center gap-[8px] py-[14px] rounded-[10px] transition-all duration-200"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(0,178,169,0.08) 0%, rgba(40,150,251,0.06) 100%)"
                          : "rgba(255,255,255,0.02)",
                        border: isActive
                          ? "1px solid rgba(0,178,169,0.3)"
                          : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isActive
                          ? "inset 0 1px 0 rgba(0,178,169,0.15), 0 2px 8px rgba(0,0,0,0.2)"
                          : "inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <svg width={iconW} height={iconH} viewBox={`0 0 ${iconW} ${iconH}`} fill="none">
                        <rect
                          x="0.5" y="0.5"
                          width={iconW - 1} height={iconH - 1}
                          rx={iconR} ry={iconR}
                          fill={isActive ? "rgba(0,178,169,0.15)" : "rgba(255,255,255,0.06)"}
                          stroke={isActive ? "rgba(0,178,169,0.5)" : "rgba(255,255,255,0.15)"}
                          strokeWidth="1"
                        />
                      </svg>
                      <span
                        className="text-[10px] font-semibold transition-colors duration-200"
                        style={{ color: isActive ? "#00B2A9" : "#64748B" }}
                      >
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Variant</label>
            <div
              className="p-[3px] rounded-[10px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.04)]"
              style={{
                display: "grid",
                gridTemplateColumns: filteredTemplates.length > 3 ? "repeat(3, 1fr)" : `repeat(${filteredTemplates.length}, 1fr)`,
                gap: "2px",
              }}
            >
              {filteredTemplates.map((t) => {
                const isActive = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`py-[6px] rounded-[7px] text-[10px] font-semibold transition-all duration-200 cursor-pointer border-none
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

          <div className="h-[1px] bg-[rgba(255,255,255,0.04)]" />

          <div className="flex flex-col">
            <label className={labelCls}>Headline <span className="text-[#FF6B6B]">*</span></label>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Get More Clients with HighLevel + AI" rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Date</label>
            <input type="text" value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="January 19-20 | 12 PM EST" className={inputCls} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>CTA Text <span className="text-[#94A3B8] font-normal normal-case tracking-normal ml-[4px]">(optional)</span></label>
            <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="REGISTER TODAY!" className={inputCls} />
          </div>

          <div className="h-[1px] bg-[rgba(255,255,255,0.04)]" />

          <div className="flex flex-col">
            <label className={labelCls}>Speaker Name <span className="text-[#FF6B6B]">*</span></label>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Adam Elens" className={inputCls} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Speaker Title</label>
            <input type="text" value={guestTitle} onChange={(e) => setGuestTitle(e.target.value)} placeholder="Head of Sales" className={inputCls} />
          </div>
          {renderImageUpload("Speaker Image", guestImage, isLoadingGuest, guestFileRef, handleGuestUpload, () => { setGuestImage(null); setGuestSettings({ scale: 1, offsetX: 0, offsetY: 0 }); if (guestFileRef.current) guestFileRef.current.value = ""; }, guestSettings, setGuestSettings)}

          <div className="flex flex-col gap-[6px] mt-[4px]">
            <button onClick={() => exportTemplate(currentConfig.id, previewRef.current || undefined)} disabled={isExporting === currentConfig.id} className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-50">
              {isExporting === currentConfig.id ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
              Download Current
            </button>
            <button onClick={() => setShowGallery(true)} disabled={!headline.trim()} className="w-full py-[9px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#94A3B8] text-[10px] font-medium flex items-center justify-center gap-[5px] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Sparkles className="w-[11px] h-[11px]" />
              Preview & Download All ({TEMPLATES.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!showGallery ? (
          <LivePreview>
            <div className={`w-full ${currentConfig.size === "horizontal" ? "max-w-[560px]" : currentConfig.size === "vertical" ? "max-w-[320px]" : currentConfig.size === "portrait" ? "max-w-[380px]" : "max-w-[440px]"}`} ref={previewRef}>
              <TemplatePreview config={currentConfig} headline={headline} dateText={dateText} ctaText={ctaText} hostName={hostName} hostTitle={hostTitle} hostImage={hostImage} guestName={guestName} guestTitle={guestTitle} guestImage={guestImage} hostSettings={hostSettings} guestSettings={guestSettings} />
            </div>
          </LivePreview>
        ) : (
          <div className="flex-1 overflow-y-auto" ref={galleryRef}>
            <div className="max-w-[1100px] mx-auto py-[20px] px-[20px]">
              <div className="flex items-center justify-between mb-[20px] flex-wrap gap-[10px]">
                <div>
                  <h3 className="text-[16px] font-bold text-white mb-[2px]">All Templates</h3>
                  <p className="text-[11px] text-[#64748B]">{TEMPLATES.length} templates ready</p>
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
                {TEMPLATES.map((t) => (
                  <div key={t.id} className="rounded-[14px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="p-[10px]">
                      <TemplatePreview config={t} headline={headline} dateText={dateText} ctaText={ctaText} hostName={hostName} hostTitle={hostTitle} hostImage={hostImage} guestName={guestName} guestTitle={guestTitle} guestImage={guestImage} hostSettings={hostSettings} guestSettings={guestSettings} />
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
