// Summer of AI — campaign theme definitions.
//
// Three campaign themes share one workspace. Each theme is a self-contained
// design language: palette, fonts, an AI image-generation style suffix (so all
// generated imagery stays on-brand), and a set of approved sample copy the user
// can edit. Formats (emailers / ads / social) are shared across themes; the
// SummerCanvas renderer adapts layout per format and styles it per theme.

export type SummerThemeId = "sun-drunk" | "electric" | "feral";

export type SummerSection = "emailers" | "ads" | "social" | "assets";

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
    eyebrow: string;
    headline: string;
    subtext: string;
    cta: string;
  };
  /** Default subject used to pre-fill the AI image prompt. */
  sampleImagePrompt: string;
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
    fontBody: "'Inter', sans-serif",
    headingWeight: 700,
    headingTransform: "none",
    headingTracking: "-0.02em",
    headingLineHeight: 1.02,
    imageStyle:
      "hazy golden-hour sunlight, warm sand and cream tones, relaxed coastal luxury, soft film grain, dreamy sun flare, gentle shallow depth of field, editorial vacation lifestyle, calm and unhurried",
    imageAvoid: "no text, no watermark, no logos, no harsh neon, no dark moody shadows",
    copy: {
      eyebrow: "SUMMER OF AI",
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
      gradient: "linear-gradient(135deg, #2962FF 0%, #00C2FF 55%, #00E5FF 100%)",
      scrim: "linear-gradient(180deg, rgba(3,6,15,0) 0%, rgba(3,6,15,0.35) 45%, rgba(3,6,15,0.85) 100%)",
    },
    fontHeading: "'Bebas Neue', sans-serif",
    fontBody: "'Inter', sans-serif",
    headingWeight: 400,
    headingTransform: "uppercase",
    headingTracking: "0.005em",
    headingLineHeight: 0.92,
    imageStyle:
      "electric blue and cyan neon lighting, high-speed motion blur, glowing light trails, futuristic AI energy, dark cinematic background, high contrast, sleek and high-tech, sparks of light",
    imageAvoid: "no text, no watermark, no logos, no warm beige tones, no daylight",
    copy: {
      eyebrow: "SUMMER OF AI",
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
    fontHeading: "'Bebas Neue', sans-serif",
    fontBody: "'Inter', sans-serif",
    headingWeight: 400,
    headingTransform: "uppercase",
    headingTracking: "0.01em",
    headingLineHeight: 0.9,
    imageStyle:
      "bold and untamed, intense high-contrast lighting, dark moody emotional tone, dramatic deep shadows, gritty cinematic atmosphere, raw and powerful, fierce energy, muted palette with a single blood-red accent",
    imageAvoid: "no text, no watermark, no logos, no pastel colors, no soft cheerful lighting",
    copy: {
      eyebrow: "SUMMER OF AI",
      headline: "Unleash Something Untamed",
      subtext: "No limits, no rules — just raw AI power set loose this summer.",
      cta: "Join The Pack",
    },
    sampleImagePrompt: "a lone wolf silhouette against a smoldering dark red horizon",
  },
};

export const SUMMER_THEME_ORDER: SummerThemeId[] = ["sun-drunk", "electric", "feral"];

/** Layout family a format renders with. */
export type SummerFormatKind = "email" | "ad" | "social";

export interface SummerFormat {
  key: string;
  label: string;
  section: Exclude<SummerSection, "assets">;
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
  // Ads
  { key: "ad-display", label: "Display Ad", section: "ads", kind: "ad", width: 300, height: 250, note: "Medium rectangle (300×250)" },
  { key: "ad-meta", label: "Meta Ad", section: "ads", kind: "ad", width: 1080, height: 1080, note: "Instagram / Facebook feed" },
  { key: "ad-linkedin", label: "LinkedIn Ad", section: "ads", kind: "ad", width: 1200, height: 627, note: "Sponsored content (1200×627)" },
  // Social
  { key: "social-square", label: "Square", section: "social", kind: "social", width: 1080, height: 1080, note: "Feed post (1:1)" },
  { key: "social-portrait", label: "Portrait", section: "social", kind: "social", width: 1080, height: 1350, note: "Feed post (4:5)" },
  { key: "social-story", label: "Story", section: "social", kind: "social", width: 1080, height: 1920, note: "Story / Reel (9:16)" },
];

export const SUMMER_SECTIONS: { id: SummerSection; label: string }[] = [
  { id: "emailers", label: "Emailers" },
  { id: "ads", label: "Ads" },
  { id: "social", label: "Social Posts" },
  { id: "assets", label: "Asset Library" },
];

export function formatsForSection(section: SummerSection): SummerFormat[] {
  return SUMMER_FORMATS.filter((f) => f.section === section);
}

/** Editable content shown on a canvas. */
export interface SummerContent {
  eyebrow: string;
  headline: string;
  subtext: string;
  cta: string;
  bgImage: string | null;
}

export function defaultContent(themeId: SummerThemeId): SummerContent {
  const t = SUMMER_THEMES[themeId];
  return {
    eyebrow: t.copy.eyebrow,
    headline: t.copy.headline,
    subtext: t.copy.subtext,
    cta: t.copy.cta,
    bgImage: null,
  };
}

/** Human-readable orientation guidance fed to the image model. */
export function orientationFor(format: SummerFormat): string {
  const r = format.width / format.height;
  if (r > 1.25) return "wide landscape composition";
  if (r < 0.8) return "tall vertical composition";
  return "square composition";
}
