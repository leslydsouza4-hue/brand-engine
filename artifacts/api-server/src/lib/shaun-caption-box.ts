import { openSync, type Font } from "fontkit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let font: Font | undefined;
function captionFont(): Font {
  if (font) return font;
  const path = ["artifacts/brand-engine/src/assets/fonts/Poppins-700.woff2", "../brand-engine/src/assets/fonts/Poppins-700.woff2"]
    .map(p => resolve(p)).find(p => existsSync(p));
  if (!path) throw new Error("Poppins caption font is missing");
  const loaded = openSync(path);
  if (!("layout" in loaded)) throw new Error("Expected a single Poppins font");
  return font = loaded;
}

/** Actual shaped font advances, not character-count estimates. libass sizes
 * fonts by ascender/descender height rather than CSS em units. */
export function captionWordBoxes(words: string[], size: number, width: number) {
  const f = captionFont();
  const unit = size / (f.ascent - f.descent);
  const advance = (text: string) => f.layout(text).advanceWidth * unit;
  const left = (width - advance(words.join(" "))) / 2;
  return words.map((word, i) => {
    const prefix = words.slice(0, i).join(" ") + (i ? " " : "");
    return { left: left + advance(prefix), width: advance(prefix + word) - advance(prefix) };
  });
}

/** True rounded rectangle in ASS drawing coordinates, underneath caption text. */
export function roundedCaptionBox(left: number, top: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2), right = left + width, bottom = top + height;
  const c = r * 0.55228475;
  const p = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return `{\\an7\\pos(0,0)\\bord0\\shad0\\1c&H00F0A31A&\\p1}m ${p(left+r,top)} l ${p(right-r,top)} b ${p(right-r+c,top)} ${p(right,top+r-c)} ${p(right,top+r)} l ${p(right,bottom-r)} b ${p(right,bottom-r+c)} ${p(right-r+c,bottom)} ${p(right-r,bottom)} l ${p(left+r,bottom)} b ${p(left+r-c,bottom)} ${p(left,bottom-r+c)} ${p(left,bottom-r)} l ${p(left,top+r)} b ${p(left,top+r-c)} ${p(left+r-c,top)} ${p(left+r,top)}{\\p0}`;
}
