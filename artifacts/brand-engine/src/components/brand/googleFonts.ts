// Google Fonts support for the Summer of AI editor.
//
// The live preview loads any chosen family on demand via a <link> to the
// Google Fonts CSS2 API. Exports (html-to-image) can't read cross-origin
// stylesheets, so `getGoogleFontEmbedCSS` fetches the CSS + inlines the woff2
// files as base64 data URIs and that string is passed to `toPng`'s
// `fontEmbedCSS`. Both fonts.googleapis.com and fonts.gstatic.com send
// `access-control-allow-origin: *`, so the browser fetches succeed.

export type GoogleFontCategory = "sans" | "serif" | "display" | "handwriting" | "mono";

export interface GoogleFontDef {
  family: string;
  category: GoogleFontCategory;
  /** Heading weight to load + render. */
  weight: number;
}

// A large curated set of popular Google Fonts. `weight` is the bold-ish weight
// used for headings; single-weight display/script faces use 400. The embed +
// preview loaders fall back to the family's default weight if a weight is
// unavailable, so a slightly-off weight here never breaks loading.
const RAW: [string, GoogleFontCategory, number?][] = [
  // ── Sans ──────────────────────────────────────────────────────────────
  ["Poppins", "sans"], ["Inter", "sans"], ["Roboto", "sans"], ["Open Sans", "sans"],
  ["Montserrat", "sans"], ["Lato", "sans"], ["Raleway", "sans"], ["Nunito", "sans"],
  ["Nunito Sans", "sans"], ["Work Sans", "sans"], ["Source Sans 3", "sans"], ["Rubik", "sans"],
  ["Manrope", "sans"], ["DM Sans", "sans"], ["Mulish", "sans"], ["Karla", "sans"],
  ["Quicksand", "sans"], ["Josefin Sans", "sans"], ["Barlow", "sans"], ["Barlow Condensed", "sans"],
  ["Oswald", "sans"], ["Archivo", "sans"], ["Archivo Narrow", "sans"], ["Public Sans", "sans"],
  ["Plus Jakarta Sans", "sans"], ["Outfit", "sans"], ["Sora", "sans"], ["Space Grotesk", "sans"],
  ["Lexend", "sans"], ["Figtree", "sans"], ["Onest", "sans"], ["Albert Sans", "sans"],
  ["Hanken Grotesk", "sans"], ["Be Vietnam Pro", "sans"], ["Cabin", "sans"], ["Heebo", "sans"],
  ["Assistant", "sans"], ["Kanit", "sans"], ["Titillium Web", "sans"], ["Exo 2", "sans"],
  ["Urbanist", "sans"], ["Red Hat Display", "sans"], ["Schibsted Grotesk", "sans"],
  ["Geologica", "sans"], ["Instrument Sans", "sans"], ["Bricolage Grotesque", "sans"],
  ["PT Sans", "sans"], ["Dosis", "sans"], ["Comfortaa", "sans"], ["Maven Pro", "sans"],
  ["Signika", "sans"], ["Catamaran", "sans"], ["Asap", "sans"], ["Chivo", "sans"],
  ["Libre Franklin", "sans"], ["Overpass", "sans"], ["Jost", "sans"], ["Epilogue", "sans"],
  ["Saira", "sans"], ["Saira Condensed", "sans"],
  // ── Serif ─────────────────────────────────────────────────────────────
  ["Playfair Display", "serif"], ["Merriweather", "serif"], ["Lora", "serif"], ["PT Serif", "serif"],
  ["Roboto Slab", "serif"], ["Bitter", "serif"], ["Crimson Text", "serif"], ["Crimson Pro", "serif"],
  ["Cormorant", "serif"], ["Cormorant Garamond", "serif"], ["EB Garamond", "serif"],
  ["Libre Baskerville", "serif"], ["Source Serif 4", "serif"], ["Noto Serif", "serif"],
  ["Spectral", "serif"], ["Zilla Slab", "serif"], ["Domine", "serif"], ["Frank Ruhl Libre", "serif"],
  ["Bodoni Moda", "serif"], ["DM Serif Display", "serif", 400], ["DM Serif Text", "serif", 400],
  ["Marcellus", "serif", 400], ["Cardo", "serif"], ["Vollkorn", "serif"], ["Newsreader", "serif"],
  ["Fraunces", "serif"], ["Petrona", "serif"], ["Alegreya", "serif"], ["Arvo", "serif"],
  ["Yeseva One", "serif", 400], ["Abril Fatface", "serif", 400],
  // ── Display ───────────────────────────────────────────────────────────
  ["Bebas Neue", "display", 400], ["Anton", "display", 400], ["Fjalla One", "display", 400],
  ["Teko", "display"], ["Archivo Black", "display", 400], ["Passion One", "display"],
  ["Lobster", "display", 400], ["Pacifico", "display", 400], ["Righteous", "display", 400],
  ["Bungee", "display", 400], ["Bangers", "display", 400], ["Permanent Marker", "display", 400],
  ["Shrikhand", "display", 400], ["Alfa Slab One", "display", 400], ["Concert One", "display", 400],
  ["Sigmar One", "display", 400], ["Staatliches", "display", 400], ["Fredoka", "display"],
  ["Baloo 2", "display"], ["Luckiest Guy", "display", 400], ["Russo One", "display", 400],
  ["Black Ops One", "display", 400], ["Monoton", "display", 400], ["Audiowide", "display", 400],
  ["Orbitron", "display"], ["Press Start 2P", "display", 400], ["Paytone One", "display", 400],
  ["Carter One", "display", 400], ["Squada One", "display", 400], ["Unbounded", "display"],
  ["Syne", "display"],
  // ── Handwriting / Script ──────────────────────────────────────────────
  ["Dancing Script", "handwriting"], ["Great Vibes", "handwriting", 400], ["Sacramento", "handwriting", 400],
  ["Satisfy", "handwriting", 400], ["Kaushan Script", "handwriting", 400], ["Cookie", "handwriting", 400],
  ["Allura", "handwriting", 400], ["Parisienne", "handwriting", 400], ["Yellowtail", "handwriting", 400],
  ["Caveat", "handwriting"], ["Patrick Hand", "handwriting", 400], ["Indie Flower", "handwriting", 400],
  ["Shadows Into Light", "handwriting", 400], ["Amatic SC", "handwriting"],
  // ── Mono ──────────────────────────────────────────────────────────────
  ["Roboto Mono", "mono"], ["JetBrains Mono", "mono"], ["Source Code Pro", "mono"],
  ["Space Mono", "mono"], ["IBM Plex Mono", "mono"], ["Inconsolata", "mono"], ["DM Mono", "mono", 500],
];

export const GOOGLE_FONTS: GoogleFontDef[] = RAW.map(([family, category, weight]) => ({
  family,
  category,
  weight: weight ?? 700,
}));

const BY_FAMILY = new Map(GOOGLE_FONTS.map((f) => [f.family, f]));

/** Default heading font when none chosen. */
export const DEFAULT_HEADLINE_FONT = "Poppins";

export function fontDefFor(family: string): GoogleFontDef {
  return BY_FAMILY.get(family) ?? GOOGLE_FONTS[0];
}

function fallbackFor(category: GoogleFontCategory): string {
  switch (category) {
    case "serif":
      return "serif";
    case "mono":
      return "monospace";
    case "handwriting":
      return "cursive";
    default:
      return "sans-serif";
  }
}

/** A CSS font-family value with an appropriate generic fallback. */
export function fontStackFor(def: GoogleFontDef): string {
  return `'${def.family}', ${fallbackFor(def.category)}`;
}

/** Sensible typographic defaults per category for heading rendering. */
export function headingTypography(def: GoogleFontDef): {
  weight: number;
  letterSpacing: string;
  lineHeight: number;
} {
  if (def.category === "serif") return { weight: def.weight, letterSpacing: "-0.005em", lineHeight: 1.1 };
  if (def.category === "display") return { weight: def.weight, letterSpacing: "0.01em", lineHeight: 1.0 };
  if (def.category === "handwriting") return { weight: def.weight, letterSpacing: "0", lineHeight: 1.05 };
  if (def.category === "mono") return { weight: def.weight, letterSpacing: "-0.01em", lineHeight: 1.1 };
  return { weight: def.weight, letterSpacing: "-0.015em", lineHeight: 1.04 };
}

function familyParam(family: string): string {
  return encodeURIComponent(family).replace(/%20/g, "+");
}

// ── Preview loading ─────────────────────────────────────────────────────────

const injected = new Set<string>();

/** Inject a <link> so the family renders in the live preview. Idempotent. */
export function ensureGoogleFont(family: string, weight = 700): void {
  if (typeof document === "undefined") return;
  const key = `${family}::${weight}`;
  if (injected.has(key)) return;
  injected.add(key);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam(family)}:wght@${weight}&display=swap`;
  document.head.appendChild(link);
}

// ── Export embedding ────────────────────────────────────────────────────────

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch failed: ${res.status} ${url}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchFontCss(family: string, weight: number): Promise<string> {
  const fam = familyParam(family);
  for (const suffix of [`:wght@${weight}`, ""]) {
    try {
      const r = await fetch(`https://fonts.googleapis.com/css2?family=${fam}${suffix}&display=swap`);
      if (r.ok) return await r.text();
    } catch {
      // try next variant
    }
  }
  throw new Error(`google font css fetch failed: ${family}`);
}

const embedCache = new Map<string, string>();

/**
 * Build a self-contained @font-face CSS string (woff2 as base64 data URIs) for a
 * Google font, for use as html-to-image's `fontEmbedCSS`. Cached per family+weight.
 * Returns "" on failure so an export still succeeds (falling back to system fonts).
 */
export async function getGoogleFontEmbedCSS(family: string, weight: number): Promise<string> {
  const key = `${family}::${weight}`;
  const hit = embedCache.get(key);
  if (hit !== undefined) return hit;
  try {
    const css = await fetchFontCss(family, weight);
    const urls = Array.from(
      new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/g)].map((m) => m[1])),
    );
    const map = new Map<string, string>();
    await Promise.all(
      urls.map(async (u) => {
        try {
          map.set(u, await toDataUrl(u));
        } catch {
          // skip a single unreachable file
        }
      }),
    );
    let out = css;
    for (const [u, d] of map) out = out.split(u).join(d);
    embedCache.set(key, out);
    return out;
  } catch (err) {
    // Don't cache the failure — a later export should be able to retry.
    console.warn(`googleFonts: embed failed for ${family}`, err);
    return "";
  }
}
