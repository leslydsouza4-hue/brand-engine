import { type CSSProperties, type ReactElement } from "react";
import { BRAND_THEMES } from "./brandModeStore";

// Canonical social sizes — same set the existing HighLevel size pack uses.
export type SocialSizeKey = "square" | "portrait" | "story" | "landscape";

export interface SocialSize {
  key: SocialSizeKey;
  label: string;
  width: number;
  height: number;
}

export const SOCIAL_SIZES: SocialSize[] = [
  { key: "square", label: "Square", width: 1080, height: 1080 },
  { key: "portrait", label: "Portrait", width: 1080, height: 1350 },
  { key: "story", label: "Story / Reel", width: 1080, height: 1920 },
  { key: "landscape", label: "Landscape", width: 1200, height: 628 },
];

// Number of photo slots a template needs. `text-only` templates work even
// with zero matches from the library.
export type PhotoMode = 0 | 1 | 2 | 3;

export interface LevelUpTemplate {
  id: string;
  name: string;
  description: string;
  photoMode: PhotoMode;
  // Higher = picked first for this brief style.
  vibe: ("hero" | "list" | "quote" | "stat" | "speaker" | "panel" | "agenda" | "promo" | "minimal" | "bold")[];
  // Defines which preset layout function renders this template.
  layout:
    | "hero-photo-overlay"
    | "split-photo-text"
    | "duo-portrait"
    | "trio-grid"
    | "speaker-spotlight"
    | "stat-card"
    | "quote-card"
    | "agenda-block"
    | "bold-typography"
    | "polaroid-stack"
    | "panel-strip"
    | "promo-burst"
    | "minimal-mark"
    | "gradient-headline"
    | "ticket-card";
}

export const LEVELUP_TEMPLATES: LevelUpTemplate[] = [
  { id: "lu-hero",        name: "Hero Photo Overlay",   description: "Full-bleed photo, dark gradient floor, headline bottom-left", photoMode: 1, vibe: ["hero", "bold"],     layout: "hero-photo-overlay" },
  { id: "lu-split",       name: "Split Photo / Text",   description: "Photo on one side, headline + CTA on the other",             photoMode: 1, vibe: ["hero", "promo"],    layout: "split-photo-text" },
  { id: "lu-duo",         name: "Duo Portrait",         description: "Two speaker photos side-by-side with names",                   photoMode: 2, vibe: ["speaker", "panel"], layout: "duo-portrait" },
  { id: "lu-trio",        name: "Trio Grid",            description: "Three-photo grid for panel announcements",                     photoMode: 3, vibe: ["panel", "list"],    layout: "trio-grid" },
  { id: "lu-speaker",     name: "Speaker Spotlight",    description: "Single circular portrait, big name + role",                     photoMode: 1, vibe: ["speaker"],          layout: "speaker-spotlight" },
  { id: "lu-stat",        name: "Stat Card",            description: "Massive number + supporting copy, no photo",                   photoMode: 0, vibe: ["stat", "bold"],     layout: "stat-card" },
  { id: "lu-quote",       name: "Pull Quote",           description: "Editorial quote with attribution",                              photoMode: 0, vibe: ["quote"],            layout: "quote-card" },
  { id: "lu-agenda",      name: "Agenda Block",         description: "Day / time / topic list overlaid on photo",                     photoMode: 1, vibe: ["agenda", "list"],   layout: "agenda-block" },
  { id: "lu-typography",  name: "Bold Typography",      description: "Pure type, gradient headline, no photo",                        photoMode: 0, vibe: ["bold", "minimal"],  layout: "bold-typography" },
  { id: "lu-polaroid",    name: "Polaroid Stack",       description: "Tilted photo cards — recap / energy",                           photoMode: 3, vibe: ["panel", "promo"],   layout: "polaroid-stack" },
  { id: "lu-panel",       name: "Panel Strip",          description: "Horizontal strip of speaker headshots",                          photoMode: 3, vibe: ["panel", "list"],    layout: "panel-strip" },
  { id: "lu-promo",       name: "Promo Burst",          description: "Big CTA pill + date pop, photo backdrop",                       photoMode: 1, vibe: ["promo", "bold"],    layout: "promo-burst" },
  { id: "lu-minimal",     name: "Minimal Mark",         description: "Just logo + one line, ultra-clean",                              photoMode: 0, vibe: ["minimal"],          layout: "minimal-mark" },
  { id: "lu-gradient",    name: "Gradient Headline",    description: "Photo + gradient-fill headline overlay",                         photoMode: 1, vibe: ["hero", "bold"],     layout: "gradient-headline" },
  { id: "lu-ticket",      name: "Ticket Card",          description: "Event-ticket layout with date / location / CTA",                photoMode: 0, vibe: ["promo", "agenda"],  layout: "ticket-card" },
];

export interface PostBrief {
  headline: string;
  subtext: string;
  cta: string;
  date: string;
  location: string;
  attribution: string; // for quote cards / speaker
  guestName: string;
  guestRole: string;
  // Photos are optional — picked from the library or supplied directly.
  photos: string[];
  // Hint from the user about peopleCount / vibe — used during template + photo picking.
  desiredPeopleCount: number | null;
  vibeHints: string[];
}

export function emptyBrief(): PostBrief {
  return {
    headline: "",
    subtext: "",
    cta: "",
    date: "",
    location: "",
    attribution: "",
    guestName: "",
    guestRole: "",
    photos: [],
    desiredPeopleCount: null,
    vibeHints: [],
  };
}

// Scale factor used to keep chrome (pills, fonts, paddings) readable across
// the four social sizes — same pattern as the HighLevel templates.
export function chromeScale(size: SocialSize): number {
  const minDim = Math.min(size.width, size.height);
  return Math.max(0.55, Math.min(1.1, minDim / 1080));
}

interface RenderProps {
  template: LevelUpTemplate;
  size: SocialSize;
  brief: PostBrief;
}

const theme = BRAND_THEMES.levelup26;

function gradientBg(): CSSProperties {
  return {
    background: `radial-gradient(ellipse at 20% 0%, ${theme.primary}40 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, ${theme.accent}38 0%, transparent 55%), linear-gradient(160deg, ${theme.bgDeep} 0%, ${theme.bgPanel} 100%)`,
  };
}

function darkFloor(opacity = 0.85): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(to top, rgba(10,1,24,${opacity}) 0%, rgba(10,1,24,${opacity * 0.7}) 35%, rgba(10,1,24,${opacity * 0.25}) 65%, transparent 100%)`,
    pointerEvents: "none",
  };
}

function brandTag(scale: number): CSSProperties {
  return {
    position: "absolute",
    top: `${20 * scale}px`,
    left: `${24 * scale}px`,
    fontSize: `${Math.max(11, 14 * scale)}px`,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: theme.accent,
    fontFamily: theme.fontHeading,
    zIndex: 5,
  };
}

// Tiny shared atoms ----------------------------------------------------------

function Pill({ text, scale, color = theme.cta, fg = "#10031F" }: { text: string; scale: number; color?: string; fg?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${10 * scale}px ${20 * scale}px`,
        borderRadius: `${999 * scale}px`,
        background: color,
        color: fg,
        fontSize: `${Math.max(11, 14 * scale)}px`,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: theme.fontHeading,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

function BrandTag({ scale }: { scale: number }) {
  return <div style={brandTag(scale)}>LevelUp 26</div>;
}

function CornerMark({ scale }: { scale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: `${20 * scale}px`,
        right: `${24 * scale}px`,
        fontSize: `${Math.max(9, 11 * scale)}px`,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#ffffff80",
        fontFamily: theme.fontHeading,
        zIndex: 5,
      }}
    >
      LU26 · The Summit
    </div>
  );
}

// Layout renderers -----------------------------------------------------------

function HeroPhotoOverlay({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  return (
    <>
      {photo ? (
        <img src={photo} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      )}
      <div style={darkFloor(0.85)} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", left: `${32 * s}px`, right: `${32 * s}px`, bottom: `${56 * s}px`, zIndex: 4 }}>
        {brief.date && (
          <div style={{ marginBottom: `${14 * s}px` }}>
            <Pill text={brief.date} scale={s} color={theme.accent} fg="#0A0118" />
          </div>
        )}
        <div
          style={{
            fontFamily: theme.fontHeading,
            fontWeight: 900,
            color: "#fff",
            fontSize: `${Math.max(28, Math.min(size.width, size.height) * 0.085)}px`,
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginBottom: `${10 * s}px`,
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {brief.headline || "Headline goes here"}
        </div>
        {brief.subtext && (
          <div style={{ fontFamily: theme.fontBody, color: "#ffffffcc", fontSize: `${Math.max(13, 17 * s)}px`, lineHeight: 1.4, maxWidth: "85%" }}>
            {brief.subtext}
          </div>
        )}
        {brief.cta && (
          <div style={{ marginTop: `${18 * s}px` }}>
            <Pill text={brief.cta} scale={s} />
          </div>
        )}
      </div>
      <CornerMark scale={s} />
    </>
  );
}

function SplitPhotoText({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  const tall = size.height > size.width;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: tall ? "1fr" : "1.05fr 1fr",
          gridTemplateRows: tall ? "1fr 1fr" : "1fr",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", margin: `${24 * s}px`, borderRadius: `${28 * s}px`, background: "#000" }}>
          {photo ? (
            <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: `${36 * s}px`, gap: `${14 * s}px` }}>
          <div style={{ fontSize: `${Math.max(11, 14 * s)}px`, color: theme.accent, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: theme.fontHeading }}>
            LevelUp 26
          </div>
          <div
            style={{
              fontFamily: theme.fontHeading,
              fontWeight: 900,
              color: "#fff",
              fontSize: `${Math.max(26, Math.min(size.width, size.height) * 0.07)}px`,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {brief.headline || "Headline"}
          </div>
          {brief.subtext && (
            <div style={{ color: "#ffffffcc", fontFamily: theme.fontBody, fontSize: `${Math.max(13, 16 * s)}px`, lineHeight: 1.4 }}>{brief.subtext}</div>
          )}
          {brief.date && <div style={{ marginTop: `${6 * s}px` }}><Pill text={brief.date} scale={s} color={theme.accent} fg="#0A0118" /></div>}
          {brief.cta && <div><Pill text={brief.cta} scale={s} /></div>}
        </div>
      </div>
    </>
  );
}

function DuoPortrait({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const [a, b] = brief.photos;
  const names = (brief.guestName || "").split("&").map((n) => n.trim()).filter(Boolean);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", padding: `${56 * s}px ${24 * s}px ${24 * s}px`, gap: `${16 * s}px`, alignItems: "center" }}>
        {[a, b].map((src, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: `${28 * s}px`, overflow: "hidden", background: "#000", border: `${3 * s}px solid ${i === 0 ? theme.primary : theme.accent}` }}>
            {src ? (
              <img src={src} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}80, ${theme.accent}80)` }} />
            )}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: `${14 * s}px`, background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", textAlign: "center", color: "#fff", fontFamily: theme.fontHeading, fontWeight: 800, fontSize: `${Math.max(13, 17 * s)}px`, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {names[i] || (i === 0 ? "Speaker A" : "Speaker B")}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: `${24 * s}px`, textAlign: "center", color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(18, 24 * s)}px`, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
        {brief.headline || "On the LevelUp 26 stage"}
      </div>
    </>
  );
}

function TrioGrid({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: `${56 * s}px ${24 * s}px ${100 * s}px`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: `${10 * s}px` }}>
        {[0, 1, 2].map((i) => {
          const src = brief.photos[i];
          return (
            <div key={i} style={{ position: "relative", borderRadius: `${20 * s}px`, overflow: "hidden", background: "#000" }}>
              {src ? (
                <img src={src} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}80, ${theme.accent}80)` }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: `${24 * s}px`, right: `${24 * s}px`, bottom: `${24 * s}px`, color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(18, 26 * s)}px`, textTransform: "uppercase", letterSpacing: "-0.01em", textAlign: "center" }}>
        {brief.headline || "Meet the panel"}
      </div>
    </>
  );
}

function SpeakerSpotlight({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  const r = Math.min(size.width, size.height) * 0.36;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", left: "50%", top: "38%", transform: "translate(-50%,-50%)", width: r, height: r, borderRadius: "50%", overflow: "hidden", border: `${6 * s}px solid ${theme.primary}`, boxShadow: `0 0 ${80 * s}px ${theme.primary}80`, background: "#000" }}>
        {photo ? (
          <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "70%", textAlign: "center", padding: `0 ${24 * s}px` }}>
        <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(28, 44 * s)}px`, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {brief.guestName || brief.headline || "Featured Speaker"}
        </div>
        {brief.guestRole && (
          <div style={{ color: theme.accent, marginTop: `${8 * s}px`, fontFamily: theme.fontHeading, fontWeight: 700, fontSize: `${Math.max(13, 16 * s)}px`, letterSpacing: "0.18em", textTransform: "uppercase" }}>{brief.guestRole}</div>
        )}
        {brief.date && <div style={{ marginTop: `${20 * s}px`, display: "inline-block" }}><Pill text={brief.date} scale={s} /></div>}
      </div>
    </>
  );
}

function StatCard({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const stat = (brief.headline || "10X").trim();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${40 * s}px`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: theme.fontHeading,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: `${Math.min(size.width, size.height) * 0.35}px`,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          {stat}
        </div>
        {brief.subtext && (
          <div style={{ marginTop: `${16 * s}px`, color: "#fff", fontFamily: theme.fontBody, fontSize: `${Math.max(14, 20 * s)}px`, lineHeight: 1.35, maxWidth: "85%" }}>{brief.subtext}</div>
        )}
        {brief.cta && <div style={{ marginTop: `${24 * s}px` }}><Pill text={brief.cta} scale={s} /></div>}
      </div>
      <CornerMark scale={s} />
    </>
  );
}

function QuoteCard({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: `${56 * s}px ${48 * s}px` }}>
        <div style={{ color: theme.cta, fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(80, 140 * s)}px`, lineHeight: 0.6, marginBottom: `${10 * s}px` }}>“</div>
        <div
          style={{
            color: "#fff",
            fontFamily: theme.fontHeading,
            fontWeight: 700,
            fontSize: `${Math.max(20, Math.min(size.width, size.height) * 0.055)}px`,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {brief.headline || "The biggest unlock of my year was being in the room."}
        </div>
        <div style={{ marginTop: `${28 * s}px`, color: theme.accent, fontFamily: theme.fontHeading, fontWeight: 800, fontSize: `${Math.max(13, 16 * s)}px`, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          — {brief.attribution || brief.guestName || "LU25 Attendee"}
        </div>
      </div>
    </>
  );
}

function AgendaBlock({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  const lines = (brief.subtext || "Day 1 · Foundations\nDay 2 · Growth\nDay 3 · Scale").split("\n").slice(0, 4);
  return (
    <>
      {photo ? (
        <img src={photo} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      )}
      <div style={darkFloor(0.55)} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", left: `${36 * s}px`, right: `${36 * s}px`, top: `${72 * s}px`, color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(22, 32 * s)}px`, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
        {brief.headline || "Agenda"}
      </div>
      <div style={{ position: "absolute", left: `${36 * s}px`, right: `${36 * s}px`, top: `${130 * s}px`, display: "flex", flexDirection: "column", gap: `${10 * s}px` }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: `${14 * s}px`, padding: `${12 * s}px ${18 * s}px`, borderRadius: `${14 * s}px`, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: `${10 * s}px`, height: `${10 * s}px`, borderRadius: "50%", background: theme.accent }} />
            <div style={{ color: "#fff", fontFamily: theme.fontBody, fontSize: `${Math.max(13, 16 * s)}px`, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function BoldTypography({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: theme.bgDeep }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.4, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: `${72 * s}px ${36 * s}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: theme.fontHeading,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.primary} 50%, ${theme.cta} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: `${Math.min(size.width, size.height) * 0.13}px`,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
          }}
        >
          {brief.headline || "Level Up. For Real."}
        </div>
        {brief.subtext && (
          <div style={{ marginTop: `${20 * s}px`, color: "#ffffffcc", fontFamily: theme.fontBody, fontSize: `${Math.max(14, 18 * s)}px`, lineHeight: 1.4, maxWidth: "85%" }}>{brief.subtext}</div>
        )}
      </div>
      <CornerMark scale={s} />
    </>
  );
}

function PolaroidStack({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const tilts = [-7, 4, -3];
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "10%", height: "55%", display: "flex", alignItems: "center", justifyContent: "center", gap: `${-30 * s}px` }}>
        {[0, 1, 2].map((i) => {
          const src = brief.photos[i];
          const wid = Math.min(size.width, size.height) * 0.32;
          return (
            <div key={i} style={{ width: wid, height: wid * 1.2, background: "#fff", padding: `${10 * s}px`, paddingBottom: `${30 * s}px`, transform: `rotate(${tilts[i]}deg)`, boxShadow: "0 12px 40px rgba(0,0,0,0.45)", zIndex: i === 1 ? 3 : 1 }}>
              <div style={{ width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>
                {src ? (
                  <img src={src} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: `${32 * s}px`, right: `${32 * s}px`, bottom: `${48 * s}px`, textAlign: "center" }}>
        <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(22, 32 * s)}px`, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {brief.headline || "The energy was unreal"}
        </div>
        {brief.cta && <div style={{ marginTop: `${16 * s}px`, display: "inline-block" }}><Pill text={brief.cta} scale={s} /></div>}
      </div>
    </>
  );
}

function PanelStrip({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: `${64 * s}px ${24 * s}px ${112 * s}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: `${14 * s}px` }}>
        {[0, 1, 2].map((i) => {
          const src = brief.photos[i];
          return (
            <div key={i} style={{ flex: 1, aspectRatio: "1/1", borderRadius: "50%", overflow: "hidden", border: `${4 * s}px solid ${i === 1 ? theme.cta : theme.primary}`, background: "#000" }}>
              {src ? (
                <img src={src} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: `${36 * s}px`, textAlign: "center", color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(18, 26 * s)}px`, textTransform: "uppercase" }}>
        {brief.headline || "The Panel"}
      </div>
    </>
  );
}

function PromoBurst({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  return (
    <>
      {photo ? (
        <img src={photo} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      )}
      <div style={darkFloor(0.5)} />
      <div
        style={{
          position: "absolute",
          top: `${24 * s}px`,
          right: `${24 * s}px`,
          width: `${Math.min(size.width, size.height) * 0.32}px`,
          height: `${Math.min(size.width, size.height) * 0.32}px`,
          borderRadius: "50%",
          background: theme.cta,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-8deg)",
          boxShadow: `0 12px 32px ${theme.cta}66`,
          padding: `${12 * s}px`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#10031F", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(16, 22 * s)}px`, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {brief.date || "Save the Date"}
        </div>
      </div>
      <BrandTag scale={s} />
      <div style={{ position: "absolute", left: `${32 * s}px`, right: `${32 * s}px`, bottom: `${56 * s}px` }}>
        <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(28, Math.min(size.width, size.height) * 0.085)}px`, lineHeight: 1.02, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          {brief.headline || "Limited seats. Don't miss it."}
        </div>
        {brief.cta && <div style={{ marginTop: `${18 * s}px` }}><Pill text={brief.cta} scale={s} /></div>}
      </div>
    </>
  );
}

function MinimalMark({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: theme.bgDeep }} />
      <div style={{ position: "absolute", inset: 0, ...gradientBg(), opacity: 0.35 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: `${40 * s}px` }}>
        <div style={{ fontFamily: theme.fontHeading, fontWeight: 900, color: "#fff", fontSize: `${Math.min(size.width, size.height) * 0.22}px`, lineHeight: 1, letterSpacing: "-0.04em" }}>
          LU<span style={{ color: theme.accent }}>26</span>
        </div>
        <div style={{ marginTop: `${16 * s}px`, color: "#ffffffcc", fontFamily: theme.fontBody, fontSize: `${Math.max(14, 18 * s)}px`, maxWidth: "75%" }}>
          {brief.headline || "The summit for what's next."}
        </div>
      </div>
    </>
  );
}

function GradientHeadline({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  const photo = brief.photos[0];
  return (
    <>
      {photo ? (
        <img src={photo} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${theme.bgDeep}cc 0%, ${theme.bgPanel}33 50%, ${theme.bgDeep}ee 100%)` }} />
      <BrandTag scale={s} />
      <div style={{ position: "absolute", inset: `${88 * s}px ${36 * s}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: theme.fontHeading,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.cta})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: `${Math.min(size.width, size.height) * 0.11}px`,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          {brief.headline || "Stop guessing. Start scaling."}
        </div>
        {brief.subtext && (
          <div style={{ marginTop: `${18 * s}px`, color: "#fff", fontFamily: theme.fontBody, fontSize: `${Math.max(14, 18 * s)}px`, lineHeight: 1.4 }}>{brief.subtext}</div>
        )}
      </div>
    </>
  );
}

function TicketCard({ size, brief }: RenderProps) {
  const s = chromeScale(size);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, ...gradientBg() }} />
      <BrandTag scale={s} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${Math.min(size.width * 0.86, size.height * 0.78)}px`,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${theme.accent}55`,
          borderRadius: `${28 * s}px`,
          padding: `${28 * s}px ${32 * s}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${10 * s}px`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: theme.accent, fontFamily: theme.fontHeading, fontSize: `${Math.max(11, 13 * s)}px`, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          <span>Admit One</span>
          <span>LU26</span>
        </div>
        <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 900, fontSize: `${Math.max(22, 36 * s)}px`, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "-0.01em" }}>
          {brief.headline || "LevelUp 2026"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${12 * s}px`, marginTop: `${10 * s}px` }}>
          <div>
            <div style={{ color: "#ffffff80", fontSize: `${Math.max(10, 11 * s)}px`, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Date</div>
            <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 800, fontSize: `${Math.max(14, 18 * s)}px` }}>{brief.date || "TBD"}</div>
          </div>
          <div>
            <div style={{ color: "#ffffff80", fontSize: `${Math.max(10, 11 * s)}px`, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Where</div>
            <div style={{ color: "#fff", fontFamily: theme.fontHeading, fontWeight: 800, fontSize: `${Math.max(14, 18 * s)}px` }}>{brief.location || "TBD"}</div>
          </div>
        </div>
        {brief.cta && <div style={{ marginTop: `${12 * s}px` }}><Pill text={brief.cta} scale={s} /></div>}
      </div>
    </>
  );
}

const LAYOUT_RENDERERS: Record<LevelUpTemplate["layout"], (p: RenderProps) => ReactElement> = {
  "hero-photo-overlay": HeroPhotoOverlay,
  "split-photo-text": SplitPhotoText,
  "duo-portrait": DuoPortrait,
  "trio-grid": TrioGrid,
  "speaker-spotlight": SpeakerSpotlight,
  "stat-card": StatCard,
  "quote-card": QuoteCard,
  "agenda-block": AgendaBlock,
  "bold-typography": BoldTypography,
  "polaroid-stack": PolaroidStack,
  "panel-strip": PanelStrip,
  "promo-burst": PromoBurst,
  "minimal-mark": MinimalMark,
  "gradient-headline": GradientHeadline,
  "ticket-card": TicketCard,
};

export function LevelUpCanvas({ template, size, brief }: { template: LevelUpTemplate; size: SocialSize; brief: PostBrief }) {
  const Renderer = LAYOUT_RENDERERS[template.layout];
  return (
    <div
      data-template-id={`${template.id}-${size.key}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${size.width}/${size.height}`,
        overflow: "hidden",
        borderRadius: 12,
        background: "#000",
        fontFamily: theme.fontBody,
        color: "#fff",
      }}
    >
      <Renderer template={template} size={size} brief={brief} />
    </div>
  );
}

// Pick the most appropriate template for a brief based on simple heuristics
// applied to the brief text + supplied vibeHints. Returns the template and a
// rationale that is shown to the user in the composer.
export function pickTemplateForBrief(brief: PostBrief): { template: LevelUpTemplate; reason: string } {
  const txt = `${brief.headline} ${brief.subtext} ${brief.vibeHints.join(" ")}`.toLowerCase();
  const photoCount = brief.photos.length;
  const peopleHint = brief.desiredPeopleCount;

  const candidates = LEVELUP_TEMPLATES.filter((t) => {
    const pm: number = t.photoMode;
    if (pm === 0) return true;
    if (photoCount === 0) return pm === 0;
    if (photoCount === 1) return pm <= 1;
    if (photoCount === 2) return pm <= 2;
    return true;
  });

  function score(t: LevelUpTemplate): number {
    let s = 0;
    if (/\bquote|testimonial|said|"/.test(txt)) s += t.vibe.includes("quote") ? 12 : -2;
    if (/\bspeaker|keynote|featuring\b/.test(txt)) s += t.vibe.includes("speaker") ? 10 : 0;
    if (/\bpanel|line[- ]up|lineup\b/.test(txt)) s += t.vibe.includes("panel") ? 10 : 0;
    if (/\bagenda|schedule|day 1|day 2|day 3\b/.test(txt)) s += t.vibe.includes("agenda") ? 10 : 0;
    if (/\bsale|offer|register|tickets?|early bird|save \$|% off\b/.test(txt)) s += t.vibe.includes("promo") ? 8 : 0;
    if (/\bticket|admit one|venue\b/.test(txt) && t.layout === "ticket-card") s += 12;
    if (/\b\d+x|\bmillion|\bthousand|\b\d+%|\b\d+,\d+/.test(txt)) s += t.vibe.includes("stat") ? 8 : 0;
    if (peopleHint === 1 && t.photoMode === 1) s += 3;
    if (peopleHint === 2 && t.photoMode === 2) s += 4;
    if (peopleHint && peopleHint >= 3 && t.photoMode === 3) s += 5;
    if (photoCount === t.photoMode) s += 4;
    if (t.layout === "hero-photo-overlay" && photoCount >= 1) s += 1;
    return s;
  }

  const ranked = candidates
    .map((t) => ({ t, s: score(t) }))
    .sort((a, b) => b.s - a.s);
  const best = ranked[0]?.t ?? LEVELUP_TEMPLATES[0];
  const reason = best.description;
  return { template: best, reason };
}
