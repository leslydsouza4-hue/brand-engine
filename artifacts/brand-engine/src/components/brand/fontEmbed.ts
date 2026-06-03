import bebas400 from "../../assets/fonts/BebasNeue-400.woff2";
import poppins400 from "../../assets/fonts/Poppins-400.woff2";
import poppins500 from "../../assets/fonts/Poppins-500.woff2";
import poppins600 from "../../assets/fonts/Poppins-600.woff2";
import poppins700 from "../../assets/fonts/Poppins-700.woff2";
import poppins800 from "../../assets/fonts/Poppins-800.woff2";
import inter400 from "../../assets/fonts/Inter-400.woff2";
import inter500 from "../../assets/fonts/Inter-500.woff2";
import inter600 from "../../assets/fonts/Inter-600.woff2";
import inter700 from "../../assets/fonts/Inter-700.woff2";
import inter800 from "../../assets/fonts/Inter-800.woff2";

interface FontFace {
  family: string;
  weight: number;
  url: string;
}

const FONT_FACES: FontFace[] = [
  { family: "Bebas Neue", weight: 400, url: bebas400 },
  { family: "Poppins", weight: 400, url: poppins400 },
  { family: "Poppins", weight: 500, url: poppins500 },
  { family: "Poppins", weight: 600, url: poppins600 },
  { family: "Poppins", weight: 700, url: poppins700 },
  { family: "Poppins", weight: 800, url: poppins800 },
  { family: "Inter", weight: 400, url: inter400 },
  { family: "Inter", weight: 500, url: inter500 },
  { family: "Inter", weight: 600, url: inter600 },
  { family: "Inter", weight: 700, url: inter700 },
  { family: "Inter", weight: 800, url: inter800 },
];

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

let cached: string | null = null;

/**
 * Builds a self-contained @font-face CSS string with the brand fonts embedded as
 * base64 woff2 data URIs. Passed to html-to-image's `fontEmbedCSS` so exports use
 * the real fonts instead of falling back to system fonts (the Google Fonts CSS is
 * cross-origin and can't be inlined, so it gets stripped during capture).
 */
export async function getFontEmbedCSS(): Promise<string> {
  if (cached !== null) return cached;
  const parts = await Promise.all(
    FONT_FACES.map(async (f) => {
      try {
        const dataUrl = await toDataUrl(f.url);
        return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:swap;src:url(${dataUrl}) format('woff2');}`;
      } catch (err) {
        // Skip a single failed font rather than aborting the whole export.
        console.warn(`fontEmbed: skipping ${f.family} ${f.weight}`, err);
        return "";
      }
    })
  );
  cached = parts.filter(Boolean).join("\n");
  return cached;
}
