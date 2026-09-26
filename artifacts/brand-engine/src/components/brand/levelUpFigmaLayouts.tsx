import type { CSSProperties, ReactNode } from "react";

export type LevelUpCategory = "speaker" | "email" | "community" | "cover";
export interface LevelUpLayout {
  id: string;
  category: LevelUpCategory;
  title: string;
  sourceNode: string;
  width: number;
  height: number;
  photo: boolean;
  group?: boolean;
  defaults: { headline: string; subline: string; date: string; cta: string; name: string };
}

// Dimensions, copy and compositions are transcribed from the named frames in
// the LevelUp 26 Figma file, not from the older generated social templates.
export const FIGMA_LAYOUTS: LevelUpLayout[] = [
  { id: "speaker-portrait", category: "speaker", title: "Speaker · Portrait", sourceNode: "5012:914", width: 1080, height: 1350, photo: true, defaults: { name: "Alex Schlinsky", headline: "", subline: "Trained 1,500 Agency Owners to Stop Hustling and Start Building", date: "OCT 26TH– 29TH | DALLAS, TX", cta: "BUY TICKETS!", } },
  { id: "speaker-story", category: "speaker", title: "Speaker · Story", sourceNode: "5012:1298", width: 1080, height: 1920, photo: true, defaults: { name: "Alex Schlinsky", headline: "", subline: "Trained 1,500 Agency Owners to Stop Hustling and Start Building", date: "OCT 26TH– 29TH | DALLAS, TX", cta: "BUY TICKETS!" } },
  { id: "speaker-landscape", category: "speaker", title: "Speaker · Landscape", sourceNode: "5012:1930", width: 1920, height: 1080, photo: true, defaults: { name: "Alex Schlinsky", headline: "", subline: "Trained 1,500 Agency Owners to Stop Hustling and Start Building", date: "OCT 26TH– 29TH | DALLAS, TX", cta: "BUY TICKETS!" } },
  { id: "email-lineup", category: "email", title: "Email · 1,000+ entrepreneurs", sourceNode: "5001:65817", width: 1919, height: 1085, photo: false, defaults: { name: "", headline: "1,000+ ENTREPRENEURS.\n70+ SPEAKERS.", subline: "", date: "DALLAS, TX | OCTOBER 26-29", cta: "Get your ticket" } },
  { id: "email-building", category: "email", title: "Email · The lineup is building", sourceNode: "5001:65921", width: 1919, height: 1085, photo: true, defaults: { name: "", headline: "THE LINEUP\nIS BUILDING", subline: "", date: "DALLAS, TX | OCTOBER 26-29", cta: "Get your ticket" } },
  { id: "community-webinar", category: "community", title: "Community · Speaker reveal webinar", sourceNode: "5001:65573", width: 1920, height: 1080, photo: false, defaults: { name: "", headline: "SPEAKER REVEAL\nWEBINAR", subline: "", date: "September 11th, 2026 | 12 PM CDT", cta: "" } },
  { id: "community-speakers", category: "community", title: "Community · First speakers", sourceNode: "5080:33", width: 1920, height: 1080, photo: true, group: true, defaults: { name: "", headline: "The first batch of speakers\nhas arrived!", subline: "", date: "", cta: "" } },
  { id: "cover-youtube", category: "cover", title: "Social cover · YouTube", sourceNode: "6015:300", width: 2560, height: 1440, photo: false, defaults: { name: "", headline: "60+ SPEAKERS\nOUR LARGEST LINEUP EVER", subline: "The people building, scaling and changing the game are coming to LevelUp.", date: "DALLAS, TX | OCTOBER 26-29", cta: "Get your ticket" } },
  { id: "cover-linkedin", category: "cover", title: "Social cover · LinkedIn", sourceNode: "6015:65", width: 1128, height: 191, photo: false, defaults: { name: "", headline: "60+ SPEAKERS\nOUR LARGEST LINEUP EVER", subline: "The people building, scaling and changing the game are coming to LevelUp.", date: "OCTOBER 26-29", cta: "Get your ticket" } },
  { id: "cover-x", category: "cover", title: "Social cover · X", sourceNode: "6015:108", width: 1500, height: 500, photo: false, defaults: { name: "", headline: "60+ SPEAKERS\nOUR LARGEST LINEUP EVER", subline: "The people building, scaling and changing the game are coming to LevelUp.", date: "DALLAS, TX | OCTOBER 26-29", cta: "Get your ticket" } },
  { id: "cover-facebook", category: "cover", title: "Social cover · Facebook", sourceNode: "6015:196", width: 851, height: 315, photo: false, defaults: { name: "", headline: "60+ SPEAKERS\nOUR LARGEST LINEUP EVER", subline: "The people building, scaling and changing the game are coming to LevelUp.", date: "DALLAS, TX | OCTOBER 26-29", cta: "Get your ticket" } },
];

export interface LevelUpEdits {
  name: string;
  headline: string;
  subline: string;
  date: string;
  cta: string;
  photo: string;
  groupPhotos: string[];
  /** Original image retained so a cutout can always be undone. */
  photoOriginal?: string;
  groupOriginals?: string[];
  backgroundAssetId?: string;
  backgroundUrl?: string;
  logoAssetId?: string;
  logoUrl?: string;
  photoX?: number;
  photoY?: number;
}

/** Normalize older drafts without writing undefined optional fields into shared sessions. */
export function hydrateLevelUpEdits(saved: LevelUpEdits, canonicalUrl: (url: string) => string): LevelUpEdits {
  const { photoOriginal, groupOriginals, backgroundAssetId, backgroundUrl, logoAssetId, logoUrl, photoX, photoY, ...rest } = saved;
  return {
    ...rest,
    photo: canonicalUrl(saved.photo),
    photoOriginal: canonicalUrl(photoOriginal ?? ""),
    groupPhotos: Array.from({ length: saved.groupPhotos.length }, (_, index) => canonicalUrl(saved.groupPhotos[index] ?? "")),
    ...(groupOriginals !== undefined ? { groupOriginals: Array.from({ length: groupOriginals.length }, (_, index) => canonicalUrl(groupOriginals[index] ?? "")) } : {}),
    ...(backgroundAssetId !== undefined ? { backgroundAssetId } : {}),
    backgroundUrl: canonicalUrl(backgroundUrl ?? ""),
    ...(logoAssetId !== undefined ? { logoAssetId } : {}),
    logoUrl: canonicalUrl(logoUrl ?? ""),
    ...(photoX !== undefined ? { photoX } : {}),
    ...(photoY !== undefined ? { photoY } : {}),
  };
}

export function levelUpCutout(edits: LevelUpEdits, slot: number, transparentPng: string, original: string): LevelUpEdits {
  if (slot === -1) return { ...edits, photo: transparentPng, photoOriginal: original };
  const count = Math.max(5, edits.groupPhotos.length);
  const groupPhotos = Array.from({ length: count }, (_, i) => edits.groupPhotos[i] ?? "");
  const groupOriginals = Array.from({ length: count }, (_, i) => edits.groupOriginals?.[i] ?? edits.groupPhotos[i] ?? "");
  groupPhotos[slot] = transparentPng;
  groupOriginals[slot] = original;
  return { ...edits, groupPhotos, groupOriginals };
}

export function levelUpRestore(edits: LevelUpEdits, slot: number): LevelUpEdits {
  if (slot === -1) return { ...edits, photo: edits.photoOriginal || edits.photo };
  const groupPhotos = Array.from({ length: Math.max(5, edits.groupPhotos.length) }, (_, i) => edits.groupPhotos[i] ?? "");
  groupPhotos[slot] = edits.groupOriginals?.[slot] ?? edits.groupPhotos[slot] ?? "";
  return { ...edits, groupPhotos };
}

export function levelUpArtworkAsset(edits: LevelUpEdits, kind: "background" | "logo", id: string, url: string): LevelUpEdits {
  return kind === "background" ? { ...edits, backgroundAssetId: id, backgroundUrl: url } : { ...edits, logoAssetId: id, logoUrl: url };
}

// public/ images live at the preview origin root, not the Vite JS bundle base.
const BASE = "/";
const logo = `${BASE}levelup26/logo-light.png`;
const hiLogo = `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`;
const BG = `url("${BASE}levelup26/gradient-dark.png") center / cover no-repeat, #09233f`;

function Pos({ x, y, w, h, children, style }: { x: number; y: number; w: number; h?: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, height: h ? `${h}%` : undefined, ...style }}>{children}</div>;
}
function Lockup({ center = false, size = 24, logoUrl = logo }: { center?: boolean; size?: number; logoUrl?: string }) {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: size * .032 }}>
    <img src={logoUrl} alt="LevelUp 26" style={{ display: "block", width: size * 10, maxWidth: "100%", height: "auto" }} />
    {logoUrl === logo && <div style={{ display: "flex", alignItems: "center", gap: size * .12, fontSize: size * .37, fontWeight: 600, whiteSpace: "nowrap" }}>
      Presented by <img src={hiLogo} alt="HighLevel" style={{ width: size * 3.2, height: "auto", objectFit: "contain" }} />
    </div>}
  </div>;
}
const cap: CSSProperties = { fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, lineHeight: .98, letterSpacing: "-.055em", whiteSpace: "pre-line" };
const gradientText: CSSProperties = { background: "linear-gradient(100deg,#ffe991 0%,#fff 35%,#89c9ff 90%)", WebkitBackgroundClip: "text", color: "transparent" };
function Button({ text, dark = false, fontSize }: { text: string; dark?: boolean; fontSize: number }) {
  return <div style={{ display: "inline-block", background: dark ? "#ffcd00" : "linear-gradient(95deg,#ffe890,#f7faff 51%,#81beff)", color: "#09223c", padding: `${fontSize * .4}px ${fontSize * 1.05}px`, borderRadius: fontSize * .22, fontSize, fontWeight: 800, lineHeight: 1.1, whiteSpace: "pre-wrap", maxWidth: "100%", boxSizing: "border-box" }}>{text}</div>;
}

export function LevelUpFigmaCanvas({ layout, edits }: { layout: LevelUpLayout; edits: LevelUpEdits }) {
  const { width: w, height: h, id } = layout;
  const portrait = id === "speaker-portrait", story = id === "speaker-story", landscape = id === "speaker-landscape";
  const speaker = layout.category === "speaker";
  const narrow = id === "cover-linkedin";
  const fontBase = Math.min(w / 1920, h / 1080);
  const brand = { logoUrl: edits.logoUrl || logo };
  return <div style={{ width: w, height: h, position: "relative", overflow: "hidden", flexShrink: 0, color: "#fff", background: edits.backgroundUrl ? `url("${edits.backgroundUrl}") center / cover no-repeat, #09233f` : BG, fontFamily: "Poppins, Inter, Arial, sans-serif" }}>
    <div style={{ position: "absolute", inset: 0, opacity: .19, background: "radial-gradient(ellipse at 25% 75%,rgba(32,118,228,.9),transparent 35%)", pointerEvents: "none" }} />
    {speaker ? <>
       <Pos x={story ? 16 : portrait ? 6 : 4.3} y={story ? 4.8 : portrait ? 6.2 : 8.2} w={story ? 68 : portrait ? 54 : 34} style={{ textAlign: story ? "center" : "left" }}><Lockup center={story} size={story ? 31 : portrait ? 34 : 43} {...brand} /></Pos>
      <Pos x={story ? 7 : portrait ? 6 : 4.4} y={story ? 17 : portrait ? 20 : 32} w={story ? 86 : portrait ? 92 : 49} style={{ textAlign: story ? "center" : "left", color: "#6ddfff", fontSize: story ? 110 : portrait ? 130 : 114, lineHeight: .9, letterSpacing: "-.06em", fontWeight: 800, whiteSpace: "pre-line", overflowWrap: "break-word" }}>{edits.name}</Pos>
      <Pos x={story ? 10 : portrait ? 6 : 4.4} y={story ? 34 : portrait ? 45 : 64} w={story ? 80 : portrait ? 53 : 44} style={{ textAlign: story ? "center" : "left", fontSize: story ? 35 : portrait ? 37 : 36, lineHeight: 1.33, whiteSpace: "pre-line" }}>{edits.subline}</Pos>
      <Pos x={story ? 10 : portrait ? 6 : 4.4} y={story ? 44 : portrait ? 63 : 82} w={story ? 80 : portrait ? 57 : 40} style={{ textAlign: story ? "center" : "left" }}><Button text={edits.cta} dark fontSize={story ? 32 : portrait ? 35 : 34} /><div style={{ fontWeight: 800, fontSize: story ? 19 : 22, marginTop: 18 }}>{edits.date}</div></Pos>
       {edits.photo && <img src={edits.photo} alt="" style={{ position: "absolute", width: story ? "87%" : portrait ? "68%" : "56%", height: "auto", maxHeight: story ? "55%" : portrait ? "62%" : "93%", objectFit: "contain", objectPosition: "bottom", bottom: `${edits.photoY ?? 0}%`, right: `calc(${story ? "6%" : portrait ? "-11%" : "-2%"} + ${edits.photoX ?? 0}%)` }} />}
    </> : id === "community-webinar" ? <>
       <Pos x={30} y={9} w={40}><Lockup center size={48} {...brand} /></Pos>
      <Pos x={7} y={39} w={86} style={{ ...cap, ...gradientText, fontSize: 128 * fontBase, textAlign: "center" }}>{edits.headline}</Pos>
      <Pos x={20} y={75} w={60} style={{ textAlign: "center" }}><Button text={edits.date} fontSize={42 * fontBase} /></Pos>
    </> : id === "community-speakers" ? <>
       <Pos x={32} y={6} w={36}><Lockup center size={47} {...brand} /></Pos>
      <Pos x={8} y={26} w={84} style={{ fontSize: 97 * fontBase, lineHeight: 1.08, fontWeight: 800, color: "#68dbff", textAlign: "center", whiteSpace: "pre-line" }}>{edits.headline}</Pos>
      {edits.groupPhotos.slice(0, 5).map((photo, i) => photo && <img key={i} src={photo} alt="" style={{ position: "absolute", bottom: "-5%", left: `${i * 20 - 2}%`, width: "26%", height: "54%", objectFit: "contain", objectPosition: "bottom" }} />)}
    </> : layout.category === "email" ? <>
      {edits.photo && <img src={edits.photo} alt="" style={{ position: "absolute", right: "-1%", bottom: "-4%", width: "53%", height: "108%", objectFit: "contain", objectPosition: "bottom right", ...(edits.photo.includes("email-building-photo-accent.png") ? { maskImage: "linear-gradient(to right,transparent,black 18%)" } : {}) }} />}
       <Pos x={id === "email-lineup" ? 27 : 4} y={id === "email-lineup" ? 16 : 18} w={id === "email-lineup" ? 46 : 42}><Lockup center={id === "email-lineup"} size={50} {...brand} /></Pos>
      <Pos x={id === "email-lineup" ? 5 : 4} y={id === "email-lineup" ? 37 : 36} w={id === "email-lineup" ? 90 : 59} style={{ ...cap, ...gradientText, fontSize: id === "email-lineup" ? 96 : 109, textAlign: id === "email-lineup" ? "center" : "left" }}>{edits.headline}</Pos>
      <Pos x={id === "email-lineup" ? 13 : 4} y={68} w={id === "email-lineup" ? 74 : 55} style={{ textAlign: id === "email-lineup" ? "center" : "left", letterSpacing: ".38em", fontWeight: 600, fontSize: 31 }}>{edits.date}</Pos>
      <Pos x={id === "email-lineup" ? 34 : 4} y={80} w={id === "email-lineup" ? 32 : 48} style={{ textAlign: id === "email-lineup" ? "center" : "left" }}><Button text={edits.cta} fontSize={39} /></Pos>
    </> : id === "cover-x" || id === "cover-facebook" ? <>
       <Pos x={28} y={8} w={44} style={{ textAlign: "center" }}><Lockup center size={id === "cover-x" ? 43 : 23} {...brand} /></Pos>
      <Pos x={12} y={31} w={76} style={{ textAlign: "center", fontSize: id === "cover-x" ? 17 : 11, letterSpacing: ".36em", fontWeight: 700 }}>{edits.date}</Pos>
      <Pos x={10} y={40} w={80} style={{ ...cap, ...gradientText, textAlign: "center", fontSize: id === "cover-x" ? 68 : 38 }}>{edits.headline}</Pos>
      <Pos x={13} y={68} w={74} style={{ textAlign: "center", fontSize: id === "cover-x" ? 22 : 14 }}>{edits.subline}</Pos>
      <Pos x={34} y={80} w={32} style={{ textAlign: "center" }}><Button text={edits.cta} fontSize={id === "cover-x" ? 23 : 13} /></Pos>
    </> : <>
       <Pos x={narrow ? 23 : 16} y={narrow ? 11 : 37} w={narrow ? 52 : 37}><Lockup size={narrow ? 11 : 39} {...brand} /></Pos>
      <Pos x={narrow ? 23 : 16} y={narrow ? 29 : 45} w={narrow ? 49 : 50} style={{ fontSize: narrow ? 9 : 19, letterSpacing: ".35em", fontWeight: 700 }}>{edits.date}</Pos>
      <Pos x={narrow ? 23 : 16} y={narrow ? 41 : 49} w={narrow ? 50 : 45} style={{ ...cap, ...gradientText, fontSize: narrow ? 29 : 78 }}>{edits.headline}</Pos>
      <Pos x={narrow ? 23 : 16} y={narrow ? 70 : 63} w={narrow ? 55 : 46} style={{ fontSize: narrow ? 13 : 26 }}>{edits.subline}</Pos>
      <Pos x={narrow ? 69 : 67} y={narrow ? 40 : 52} w={narrow ? 25 : 22} style={{ textAlign: "center" }}><Button text={edits.cta} fontSize={narrow ? 15 : 27} /></Pos>
    </>}
  </div>;
}