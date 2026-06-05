// Summer of AI — campaign theme definitions.
//
// Three campaign themes share one workspace. Each theme is a self-contained
// design language: palette, fonts, an AI image-generation style suffix (so all
// generated imagery stays on-brand), and a set of approved sample copy the user
// can edit. Formats (emailers / ads / social) are shared across themes; the
// SummerCanvas renderer adapts layout per format and styles it per theme.

export type SummerThemeId = "sun-drunk" | "electric" | "feral";

export type SummerSection = "emailers" | "ads" | "social" | "community";

export interface SummerPalette {
  /** Page / canvas background. */
  bg: string;
  /** Raised panel / card fill. */
  panel: string;
  /** Primary text. */
  ink: string;
  /** Secondary / muted text. */
  sub: string;
  /** Primary brand color. */
  primary: string;
  /** Secondary accent. */
  accent: string;
  /** Call-to-action fill. */
  cta: string;
  /** Text drawn on top of the CTA fill. */
  ctaInk: string;
  /** Hero gradient (CSS value). */
  gradient: string;
  /** Scrim used to keep text legible over imagery (CSS gradient). */
  scrim: string;
}

export interface SummerThemeDef {
  id: SummerThemeId;
  name: string;
  tagline: string;
  /** One-line description of the mood, shown in the picker. */
  mood: string;
  palette: SummerPalette;
  fontHeading: string;
  fontBody: string;
  headingWeight: number;
  headingTransform: "uppercase" | "none";
  headingTracking: string;
  headingLineHeight: number;
  /** Appended to every AI image prompt to lock the visual style. */
  imageStyle: string;
  /** Negative guidance appended to the image prompt. */
  imageAvoid: string;
  /** Editable starter copy. */
  copy: {
    headline: string;
    subtext: string;
    cta: string;
  };
  /** Default subject used to pre-fill the AI image prompt. */
  sampleImagePrompt: string;
}

// ── Canva-style editing model ──────────────────────────────────────────────

// Heading fonts are any Google Font (see googleFonts.ts). `headlineFont` holds
// the family name (e.g. "Poppins", "Bebas Neue", "Playfair Display"); the
// preview loads it on demand and exports embed it as base64 woff2.

/** The CTA is always brand yellow, by request. */
export const SUMMER_CTA_BG = "#FFD000";
export const SUMMER_CTA_INK = "#1A1206";

/** Editable / draggable elements on a canvas. */
export type SummerElementKey = "headline" | "subtext" | "cta" | "logo";

/** Available Summer of AI logo color variants (transparent PNGs in /public). */
export type SummerLogoVariant = "yellow" | "blue";

/** Summer of AI lockup placement + variant. Position lives in the layout map. */
export interface SummerLogo {
  /** Whether to render the logo on the canvas. */
  show: boolean;
  /** Which color lockup to use. */
  variant: SummerLogoVariant;
}

export interface SummerElementLayout {
  /** Left edge as a fraction of canvas width (0..1). */
  x: number;
  /** Top edge as a fraction of canvas height (0..1). */
  y: number;
  /** Max width as a fraction of canvas width (controls text wrapping). */
  w: number;
  /** Font-size multiplier relative to the theme default (1 = default). */
  size?: number;
}

export type SummerLayoutMap = Record<SummerElementKey, SummerElementLayout>;

export interface SummerColors {
  headline: string;
  subtext: string;
}

/** Flat color wash over the background image (darken / lighten for legibility). */
export interface SummerOverlay {
  color: "black" | "white";
  /** 0..1 strength. 0 = no overlay. */
  opacity: number;
}

/** Side the directional gradient wash starts strong from (fading to clear). */
export type SummerWashDirection = "left" | "right" | "top" | "bottom";

/**
 * Directional gradient wash that darkens (or lightens) one side of the image
 * and fades to transparent toward the opposite side — used to make text on
 * that side pop without flattening the whole photo.
 */
export interface SummerWash {
  color: "black" | "white";
  /** 0..1 strength at the starting edge. 0 = no wash. */
  opacity: number;
  /** Edge the wash is strongest at. */
  direction: SummerWashDirection;
}

/** An uploaded human / subject cutout composited over the background. */
export interface SummerSubject {
  /** Image source (data URL — ideally a transparent PNG cutout). */
  src: string;
  /** Center X as a fraction of canvas width (0..1). */
  x: number;
  /** Center Y as a fraction of canvas height (0..1). */
  y: number;
  /** Width as a fraction of canvas width (0..1). */
  scale: number;
}

/** A selectable background gradient preset. */
export interface SummerGradient {
  id: string;
  label: string;
  /** CSS background value (soft radial "blooms" over a base wash → hazy look). */
  css: string;
}

/** Coarse aspect-ratio bucket used to pick a sensible starting layout. */
export type SummerOrientation = "wide" | "square" | "portrait" | "tall";

export function orientationKind(width: number, height: number): SummerOrientation {
  const r = width / height;
  if (r >= 1.15) return "wide";
  if (r >= 0.95) return "square";
  if (r >= 0.7) return "portrait";
  return "tall";
}

/**
 * Default element placement, tuned per aspect ratio so switching format sizes
 * (Square / Portrait / Story / Landscape) starts from a layout that actually
 * fits the canvas instead of one fixed bottom stack.
 * - wide: left-aligned block, vertically centered (room on the right for art)
 * - tall: bottom-anchored low third with breathing room up top
 * - portrait/square: bottom-anchored stack, tightened for the shorter canvas
 */
export function defaultLayoutFor(width: number, height: number): SummerLayoutMap {
  switch (orientationKind(width, height)) {
    case "wide":
      return {
        logo: { x: 0.06, y: 0.07, w: 0.2 },
        headline: { x: 0.06, y: 0.44, w: 0.62 },
        subtext: { x: 0.06, y: 0.62, w: 0.52 },
        cta: { x: 0.06, y: 0.82, w: 0.5 },
      };
    case "tall":
      return {
        logo: { x: 0.06, y: 0.05, w: 0.4 },
        headline: { x: 0.06, y: 0.58, w: 0.86 },
        subtext: { x: 0.06, y: 0.72, w: 0.78 },
        cta: { x: 0.06, y: 0.88, w: 0.62 },
      };
    case "portrait":
      return {
        logo: { x: 0.06, y: 0.05, w: 0.34 },
        headline: { x: 0.06, y: 0.53, w: 0.88 },
        subtext: { x: 0.06, y: 0.7, w: 0.76 },
        cta: { x: 0.06, y: 0.87, w: 0.52 },
      };
    default:
      return {
        logo: { x: 0.06, y: 0.05, w: 0.3 },
        headline: { x: 0.06, y: 0.47, w: 0.88 },
        subtext: { x: 0.06, y: 0.65, w: 0.74 },
        cta: { x: 0.06, y: 0.84, w: 0.52 },
      };
  }
}

/** Square-ish default used where no specific format is known. */
export function defaultLayout(): SummerLayoutMap {
  return defaultLayoutFor(1080, 1080);
}

export const SUMMER_THEMES: Record<SummerThemeId, SummerThemeDef> = {
  "sun-drunk": {
    id: "sun-drunk",
    name: "Sun Drunk",
    tagline: "Hazy. Golden. Unhurried.",
    mood: "Relaxed coastal luxury — warm golden-hour haze and slow beach mornings.",
    palette: {
      bg: "#F4E7D1",
      panel: "#FBF3E4",
      ink: "#3A2A18",
      sub: "#7A6448",
      primary: "#E0A85C",
      accent: "#C9744A",
      cta: "#2E2014",
      ctaInk: "#F7EBD6",
      gradient: "linear-gradient(135deg, #F6D79B 0%, #E0A85C 45%, #C9744A 100%)",
      scrim: "linear-gradient(180deg, rgba(34,22,10,0) 0%, rgba(34,22,10,0.15) 45%, rgba(34,22,10,0.72) 100%)",
    },
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Poppins', sans-serif",
    headingWeight: 700,
    headingTransform: "none",
    headingTracking: "-0.02em",
    headingLineHeight: 1.02,
    imageStyle:
      "cinematic golden-hour photograph, strong warm directional backlight with natural lens flare and sun haze streaming through windows or sheer curtains, rich amber, terracotta, honey and cream tones, relaxed candid lifestyle of people lounging, reading or unwinding, soft silhouettes and glowing rim light, dreamy shallow depth of field, fine 35mm film grain, editorial vacation luxury, warm low-contrast highlights, calm and unhurried",
    imageAvoid: "no text, no watermark, no logos, no harsh neon, no cool blue tones, no flat overhead daylight, no oversaturated colors",
    copy: {
      headline: "Sun's Out, Models Out",
      subtext: "Slow mornings, big breakthroughs — the AI summer you've been waiting for.",
      cta: "Save Your Spot",
    },
    sampleImagePrompt: "a linen-draped beach cabana at golden hour with palm shadows",
  },
  electric: {
    id: "electric",
    name: "Electric",
    tagline: "Plug in. Power up.",
    mood: "Electric blue, neon motion and futuristic speed — energy you can feel.",
    palette: {
      bg: "#05070F",
      panel: "#0B1020",
      ink: "#FFFFFF",
      sub: "#9FB4D9",
      primary: "#2962FF",
      accent: "#00E5FF",
      cta: "#00E5FF",
      ctaInk: "#03060F",
      gradient: "linear-gradient(135deg, #00020A 0%, #02103A 55%, #04266E 100%)",
      scrim: "linear-gradient(180deg, rgba(3,6,15,0) 0%, rgba(3,6,15,0.35) 45%, rgba(3,6,15,0.85) 100%)",
    },
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Poppins', sans-serif",
    headingWeight: 400,
    headingTransform: "uppercase",
    headingTracking: "0.005em",
    headingLineHeight: 0.92,
    imageStyle:
      "electric blue and cyan neon lighting, high-speed motion blur, glowing light trails, futuristic AI energy, dark cinematic background, high contrast, sleek and high-tech, sparks of light",
    imageAvoid: "no text, no watermark, no logos, no warm beige tones, no daylight",
    copy: {
      headline: "Move At The Speed Of AI",
      subtext: "Plug in, power up and outpace everyone this summer.",
      cta: "Get Early Access",
    },
    sampleImagePrompt: "a streak of electric blue light trails racing through a dark grid tunnel",
  },
  feral: {
    id: "feral",
    name: "Feral",
    tagline: "No limits. No rules.",
    mood: "Bold, untamed and high-contrast — raw power with a dark emotional edge.",
    palette: {
      bg: "#0C0A0A",
      panel: "#161111",
      ink: "#F2EBE3",
      sub: "#A89E94",
      primary: "#E01E37",
      accent: "#FF5630",
      cta: "#E01E37",
      ctaInk: "#0C0A0A",
      gradient: "linear-gradient(135deg, #E01E37 0%, #B3122A 55%, #5A0712 100%)",
      scrim: "linear-gradient(180deg, rgba(8,6,6,0) 0%, rgba(8,6,6,0.4) 45%, rgba(8,6,6,0.9) 100%)",
    },
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Poppins', sans-serif",
    headingWeight: 400,
    headingTransform: "uppercase",
    headingTracking: "0.01em",
    headingLineHeight: 0.9,
    imageStyle:
      "bold and untamed, intense high-contrast lighting, dark moody emotional tone, dramatic deep shadows, gritty cinematic atmosphere, raw and powerful, fierce energy, muted palette with a single blood-red accent",
    imageAvoid: "no text, no watermark, no logos, no pastel colors, no soft cheerful lighting",
    copy: {
      headline: "Unleash Something Untamed",
      subtext: "No limits, no rules — just raw AI power set loose this summer.",
      cta: "Join The Pack",
    },
    sampleImagePrompt: "a lone wolf silhouette against a smoldering dark red horizon",
  },
};

export const SUMMER_THEME_ORDER: SummerThemeId[] = ["sun-drunk", "electric", "feral"];

/**
 * On-brand, hazy gradient presets per theme. Each layers soft radial "blooms"
 * over a base wash so it reads as atmospheric haze rather than a flat ramp —
 * ideal as a backdrop for an uploaded person cutout.
 */
export const SUMMER_GRADIENTS: Record<SummerThemeId, SummerGradient[]> = {
  "sun-drunk": [
    { id: "golden-haze", label: "Golden Haze", css: "radial-gradient(70% 90% at 80% 15%, rgba(255,244,205,0.95) 0%, rgba(255,244,205,0) 58%), linear-gradient(135deg, #F6D79B 0%, #E6AE62 48%, #C9744A 100%)" },
    { id: "sun-bloom", label: "Sun Bloom", css: "radial-gradient(80% 70% at 50% 0%, rgba(255,243,210,0.95) 0%, rgba(255,243,210,0) 60%), linear-gradient(180deg, #F8DDA4 0%, #E4A663 55%, #C86B45 100%)" },
    { id: "peach-dusk", label: "Peach Dusk", css: "radial-gradient(75% 80% at 22% 20%, rgba(255,233,205,0.9) 0%, rgba(255,233,205,0) 55%), linear-gradient(125deg, #F4C893 0%, #E29A6C 50%, #C25E5A 100%)" },
    { id: "warm-sand", label: "Warm Sand", css: "radial-gradient(90% 90% at 85% 80%, rgba(255,224,176,0.55) 0%, rgba(255,224,176,0) 55%), linear-gradient(150deg, #FBEFD3 0%, #ECC487 45%, #C98E54 100%)" },
  ],
  electric: [
    { id: "neon-dawn", label: "Neon Dawn", css: "radial-gradient(70% 85% at 80% 12%, rgba(0,229,255,0.5) 0%, rgba(0,229,255,0) 55%), linear-gradient(135deg, #00020A 0%, #02103A 55%, #04266E 100%)" },
    { id: "deep-current", label: "Deep Current", css: "radial-gradient(80% 80% at 18% 82%, rgba(41,98,255,0.55) 0%, rgba(41,98,255,0) 60%), linear-gradient(160deg, #00030C 0%, #021445 60%, #052A78 100%)" },
    { id: "voltage", label: "Voltage", css: "radial-gradient(70% 70% at 50% 0%, rgba(0,229,255,0.45) 0%, rgba(0,229,255,0) 55%), linear-gradient(180deg, #010512 0%, #03143F 70%, #0A3A8C 100%)" },
    { id: "grid-glow", label: "Grid Glow", css: "radial-gradient(60% 70% at 78% 78%, rgba(0,229,255,0.4) 0%, rgba(0,229,255,0) 55%), radial-gradient(60% 70% at 20% 18%, rgba(41,98,255,0.4) 0%, rgba(41,98,255,0) 55%), linear-gradient(150deg, #00030C 0%, #021238 60%, #052166 100%)" },
  ],
  feral: [
    { id: "ember", label: "Ember", css: "radial-gradient(70% 90% at 76% 16%, rgba(255,86,48,0.5) 0%, rgba(255,86,48,0) 55%), linear-gradient(135deg, #1A0608 0%, #7A0D1C 55%, #E01E37 100%)" },
    { id: "blood-moon", label: "Blood Moon", css: "radial-gradient(65% 70% at 50% 8%, rgba(224,30,55,0.55) 0%, rgba(224,30,55,0) 55%), linear-gradient(180deg, #0C0405 0%, #2A0509 60%, #5A0712 100%)" },
    { id: "scorched", label: "Scorched", css: "radial-gradient(80% 80% at 22% 82%, rgba(255,86,48,0.45) 0%, rgba(255,86,48,0) 60%), linear-gradient(150deg, #0C0A0A 0%, #3A0810 55%, #B3122A 100%)" },
    { id: "crimson-haze", label: "Crimson Haze", css: "radial-gradient(75% 80% at 80% 78%, rgba(224,30,55,0.4) 0%, rgba(224,30,55,0) 55%), linear-gradient(135deg, #14080A 0%, #4A0912 55%, #9E1326 100%)" },
  ],
};

/** Layout family a format renders with. */
export type SummerFormatKind = "email" | "ad" | "social";

export interface SummerFormat {
  key: string;
  label: string;
  section: SummerSection;
  kind: SummerFormatKind;
  width: number;
  height: number;
  /** Short blurb shown under the format name. */
  note: string;
}

export const SUMMER_FORMATS: SummerFormat[] = [
  // Emailers
  { key: "email-hero", label: "Hero Email", section: "emailers", kind: "email", width: 600, height: 760, note: "Top-of-email feature banner" },
  { key: "email-announce", label: "Announcement", section: "emailers", kind: "email", width: 600, height: 520, note: "Mid-email announcement block" },
  { key: "email-reminder", label: "Reminder", section: "emailers", kind: "email", width: 600, height: 380, note: "Short nudge / countdown" },
  { key: "email-wide", label: "Wide (1920×1080)", section: "emailers", kind: "email", width: 1920, height: 1080, note: "Full-width 16:9 hero" },
  // Ads
  { key: "ad-display", label: "Display Ad", section: "ads", kind: "ad", width: 300, height: 250, note: "Medium rectangle (300×250)" },
  { key: "ad-meta", label: "Meta Ad", section: "ads", kind: "ad", width: 1080, height: 1080, note: "Instagram / Facebook feed" },
  { key: "ad-linkedin", label: "LinkedIn Ad", section: "ads", kind: "ad", width: 1200, height: 627, note: "Sponsored content (1200×627)" },
  // Social
  { key: "social-square", label: "Square", section: "social", kind: "social", width: 1080, height: 1080, note: "Feed post (1:1)" },
  { key: "social-portrait", label: "Portrait", section: "social", kind: "social", width: 1080, height: 1350, note: "Feed post (4:5)" },
  { key: "social-story", label: "Story", section: "social", kind: "social", width: 1080, height: 1920, note: "Story / Reel (9:16)" },
  // Community Posts
  { key: "community-square", label: "Square", section: "community", kind: "social", width: 1080, height: 1080, note: "Community feed post (1:1)" },
  { key: "community-portrait", label: "Portrait", section: "community", kind: "social", width: 1080, height: 1350, note: "Vertical community post (4:5)" },
  { key: "community-banner", label: "Banner", section: "community", kind: "social", width: 1920, height: 1080, note: "Announcement banner (16:9)" },
];

export const SUMMER_SECTIONS: { id: SummerSection; label: string }[] = [
  { id: "emailers", label: "Emailers" },
  { id: "ads", label: "Ads" },
  { id: "social", label: "Social Posts" },
  { id: "community", label: "Community Posts" },
];

export function formatsForSection(section: SummerSection): SummerFormat[] {
  return SUMMER_FORMATS.filter((f) => f.section === section);
}

/** A line that starts an image brief, e.g. "IMAGE COPY", "Image Copy 2:", "IMAGE COPY #3 -". */
const IMAGE_COPY_LABEL = /^\s*image\s+copy\b\s*#?\s*\d*\s*[:.\-–)]*/i;

/**
 * A label-style heading (other than IMAGE COPY) that should end the current
 * brief — either an ALL-CAPS label or a known field name, followed by a colon
 * within the first ~40 chars. Avoids cutting prose that merely contains a colon.
 */
function isFieldHeading(line: string): boolean {
  const colon = line.indexOf(":");
  if (colon === -1 || colon > 40) return false;
  const label = line.slice(0, colon).trim();
  if (!label) return false;
  const isAllCaps = /^[A-Z0-9 /&\-]+$/.test(label) && /[A-Z]/.test(label);
  const known = /\b(copy|headline|sub[- ]?head(?:line)?|subject|body|cta|caption|title|text|hook|post|description|alt)\b/i.test(label);
  return isAllCaps || known;
}

/**
 * Pull image briefs out of a doc body. Each brief is marked by an "IMAGE COPY"
 * label on its own line (optionally numbered / punctuated); the brief is the
 * text after that label up to the next "IMAGE COPY" label, a blank line, or
 * another field heading (e.g. "CAPTION COPY:", "HEADLINE:").
 */
export function parseImageCopies(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let capturing = false;
  let buf: string[] = [];
  const flush = () => {
    const seg = buf.join(" ").replace(/\s+/g, " ").replace(/^[\s:.\-–)]+/, "").trim();
    if (seg) out.push(seg);
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(IMAGE_COPY_LABEL);
    if (m) {
      if (capturing) flush();
      capturing = true;
      const rest = line.slice(m[0].length).trim();
      if (rest) buf.push(rest);
      continue;
    }
    if (!capturing) continue;
    if (line.trim() === "" || isFieldHeading(line)) {
      flush();
      capturing = false;
      continue;
    }
    buf.push(line.trim());
  }
  if (capturing) flush();
  return out;
}

/** Editable content shown on a canvas. */
export interface SummerContent {
  headline: string;
  subtext: string;
  cta: string;
  bgImage: string | null;
  /** Zoom multiplier for the uploaded/generated background image (1 = fit). */
  bgScale: number;
  /** Selected heading font style. */
  headlineFont: string;
  /** Per-element text colors. */
  colors: SummerColors;
  /** Per-element placement (drag-to-move). */
  layout: SummerLayoutMap;
  /** Flat black/white wash over the background. */
  overlay: SummerOverlay;
  /** Directional gradient wash to make content on one side stand out. */
  wash: SummerWash;
  /** Chosen gradient background (CSS). null = use the theme's default gradient. */
  gradient: string | null;
  /** Uploaded human/subject cutout composited over the background. */
  subject: SummerSubject | null;
  /** Summer of AI lockup (show + color variant); position is in `layout.logo`. */
  logo: SummerLogo;
}

/** Default logo color per theme (Electric uses the blue lockup, others yellow). */
const DEFAULT_LOGO_VARIANT: Record<SummerThemeId, SummerLogoVariant> = {
  "sun-drunk": "yellow",
  electric: "blue",
  feral: "yellow",
};

export function defaultContent(themeId: SummerThemeId): SummerContent {
  const t = SUMMER_THEMES[themeId];
  return {
    headline: t.copy.headline,
    subtext: t.copy.subtext,
    cta: t.copy.cta,
    bgImage: null,
    bgScale: 1,
    headlineFont: "Poppins",
    colors: {
      headline: "#FFFFFF",
      subtext: "#F4EFE6",
    },
    layout: defaultLayout(),
    overlay: { color: "black", opacity: 0 },
    wash: { color: "black", opacity: 0, direction: "left" },
    gradient: null,
    subject: null,
    logo: { show: true, variant: DEFAULT_LOGO_VARIANT[themeId] },
  };
}

/** Human-readable orientation guidance fed to the image model. */
export function orientationFor(format: SummerFormat): string {
  const r = format.width / format.height;
  if (r > 1.25) return "wide landscape composition";
  if (r < 0.8) return "tall vertical composition";
  return "square composition";
}
