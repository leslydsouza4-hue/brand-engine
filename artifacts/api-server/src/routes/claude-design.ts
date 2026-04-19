import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { generateImage, editImage } from "@workspace/integrations-gemini-ai/image";

const router: IRouter = Router();

const HUMAN_PLACEHOLDER = "https://placeholder.brand-engine/ai-human.png";
const ITEM_PLACEHOLDER = "https://placeholder.brand-engine/custom-item.png";

// Words that strongly suggest the design needs a real photo of a person.
const HUMAN_KEYWORDS = /\b(human|person|people|man|woman|men|women|guy|girl|founder|founders|owner|owners|entrepreneur|entrepreneurs|ceo|coach|coaches|client|clients|customer|customers|portrait|headshot|face|smiling|model|professional|operator|operators|agency owner|agency owners|consultant|teacher|trainer|speaker|host|presenter|user|team member|employee|staff|developer|designer|marketer)\b/i;

async function buildHumanPromptAndDescription(
  baseUrl: string | undefined,
  apiKey: string | undefined,
  ctx: { theme: string; sceneName: string; aspect: string },
): Promise<{ imagePrompt: string; description: string }> {
  let imagePrompt = "";
  let description = "";
  if (baseUrl && apiKey) {
    try {
      const client = new Anthropic({ baseURL: baseUrl, apiKey });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: `You write image-generation prompts for a state-of-the-art photoreal model (Google Imagen / Nano Banana Pro). Given a marketing graphic's theme, you write a SINGLE prompt for a magazine-cover-quality photograph of a HUMAN that fits the theme.

Quality bar: think Apple keynote, Stripe.com hero, Notion's About page, Linear's marketing — crisp, intentional, editorial. NOT generic stock photo.

Rules:
- Output is ONE paragraph, 80-140 words. No preamble, no markdown, no lists.
- Lead with the subject in concrete detail: age range (e.g. "early-30s"), gender, ethnicity (reflect a diverse pool — rotate across South Asian, East Asian, Black, Latino, White, Mixed), specific role tied to the theme (not just "professional"), and a clear emotion ("calm focus", "quiet confidence", "warm mid-laugh" — never "smiling at camera").
- Wardrobe: name the actual garments and material (e.g. "charcoal merino crewneck", "ivory linen overshirt", "navy technical blazer"). Modern, expensive-looking, never logo-ed, never busy patterns. Subtle brand-color accent acceptable but never dominant.
- Framing: pick one — "tight headshot, chin to crown", "chest-up portrait", "waist-up three-quarter turn", "full-body editorial". Match the canvas aspect: portrait/square = chest-up or tight; landscape = waist-up or three-quarter.
- Camera: real body + lens + aperture, e.g. "Sony A7R V, 85mm f/1.4 prime, shallow depth of field" or "Hasselblad H6D, 80mm, medium-format softness". Mention skin texture preserved, no plastic skin.
- Lighting: ONE specific setup — "single large softbox 45° camera-left with subtle fill", "golden-hour window-light with soft bounce", "Rembrandt key + dim rim". Skin should glow, not flatten.
- Background: ONE of (A) Seamless deep navy #0B1426 studio cyc — preferred default. (B) Clean neutral grey #2A2F3A studio paper. (C) Soft, heavily-blurred contextual environment matching the brand mood (only if (A)/(B) don't fit). NEVER busy interiors, NEVER outdoor crowds, NEVER props that compete with the face.
- Brand context is HighLevel (modern SaaS, agency operators, founders): green #17D94B, blue #2896FB, navy #0B1426, yellow #FFC328 accents. Wardrobe and lighting should feel like the brand without screaming it.
- Negative cues: NO stock-photo grin, NO crossed arms, NO thumbs-up, NO headset, NO laptop in frame, NO posed group, NO motion blur on the subject, NO HDR, NO oversharpening, NO logos, NO text, NO watermarks.
- End with this exact sentence: "Ultra-high resolution, photorealistic, editorial magazine quality, sharp focus on the eyes, natural skin texture, clean separable edges around hair and shoulders for background removal."

Then on a NEW LINE after the prompt, write:
DESCRIPTION: <one short sentence (under 18 words) describing the subject for layout purposes>`,
        messages: [
          {
            role: "user",
            content: `Marketing graphic theme: ${ctx.theme || "(not specified)"}
Scene direction: ${ctx.sceneName || "(none)"}
Canvas aspect: ${ctx.aspect}

Write the image prompt now.`,
          },
        ],
      });
      const block = msg.content[0];
      const text = (block && block.type === "text" ? block.text : "").trim();
      const descMatch = text.match(/DESCRIPTION:\s*(.+)$/im);
      description = descMatch ? descMatch[1].trim() : "";
      imagePrompt = text.replace(/DESCRIPTION:.*$/im, "").trim();
    } catch (err) {
      console.error("[generate-human] prompt-builder failed", err);
    }
  }
  if (!imagePrompt) {
    imagePrompt = `Editorial photograph of a confident modern professional matching this brief: ${ctx.theme}. Shot on Canon R5, 50mm, f/1.8, soft natural light, neutral wardrobe with subtle green or blue accents, calm modern background. Ultra high resolution, photorealistic, editorial quality, no logos, no text, no watermarks.`;
    description = description || "Confident modern professional matching the brand theme";
  }
  return { imagePrompt, description };
}

const HIGHLEVEL_BRAND_SYSTEM = `You are a senior brand designer at HighLevel (also "GoHighLevel" / "GHL") shipping production-ready marketing graphics. You output a single, self-contained HTML document that renders a polished, perfectly aligned design for the user's prompt. The output should look like it came out of Figma from a top-tier in-house design team — never like a wireframe or a default Bootstrap page.

# Spec Adherence (READ FIRST — overrides nothing, governs everything)
The user's prompt is a literal spec, not a vibe brief. If the user says "3 stacked cards offset 12px to the right of each other", you build EXACTLY 3 cards with EXACTLY a 12px horizontal stagger. If they say "a dotted vertical green line connecting the dots", that line MUST exist in the DOM. If they say "small grey timestamp on the right", the timestamp is grey (#94A3B8), not a green pill.

Before writing any HTML, do this checklist mentally:
1. List every visual element the user named (cards, lines, dots, chips, badges, glows, icons, labels). Count them.
2. List every property they specified (color, position, offset, size, shape, count, alignment, stagger, gap).
3. Your HTML MUST include every named element with every specified property. Do not silently merge two elements, drop a connector line, swap a color, or "improve" the layout away from what was asked.
4. The HighLevel brand palette below is a HARD constraint on COLORS only. It does NOT give you license to drop elements, restyle CTAs, or rearrange the composition the user described. If the user says "yellow CTA pill at the bottom", the CTA is yellow #FFC328 and at the bottom — not blue, not centered if they said bottom-right.
5. Decorative additions (glows, gradients, dotted backgrounds, scrims) are allowed ONLY if they don't displace or obscure something the user named. When in doubt, render the user's spec first and add atmosphere second.

You may polish typography, spacing, and brand-color application freely. You may NOT delete, merge, or substitute elements the user explicitly described.

# HighLevel Brand Guidelines

## Brand Voice
- Confident, modern, founder-friendly. Direct and outcome-focused.
- Punchy hook headlines (3-8 words). Plain-English supporting copy.
- Avoid corporate jargon and overused AI words.

## Color Palette (HARD CONSTRAINT — these are the ONLY colors you may use)
You MUST use ONLY the hex values below. You may NOT invent new colors, use generic web colors (red, purple, orange, pink, etc.), or use CSS named colors. Every color value (text, background, border, gradient stop, shadow, SVG fill) must come from this list. No exceptions.

- Primary Blue: #2896FB (capture flows, primary CTAs, hero glows, links)
- Mid Blue: #0B6FD4 (gradient deep stop for Primary Blue)
- Light Blue: #7CC8FF (accents, gradient stops)
- Green Bright: #17D94B (eyebrow text, active state, in-glow text)
- Green: #00B2A9 (success, "Close" stage, secondary accent)
- Yellow: #FFC328 (attention accents, NEW badges, opening quote marks)
- Deep Navy: #0B1426 (page background, dark text on light surfaces)
- Mid Navy: #122036 (card surface on dark)
- Soft Navy: #1A2942 (raised surface, hover state)
- Off-white: #F8FAFC (light surface, max-contrast text on dark)
- Slate Light: #E2E8F0 (primary text on dark)
- Slate Mid: #94A3B8 (secondary text on dark)
- Charcoal: #0F172A (primary text on light)
- Charcoal Mid: #475569 (secondary text on light)

### Text color rules (STRICT — most important)
- Primary headline on dark backgrounds: #F8FAFC. Never any other white-ish or off-white value.
- Primary headline on light backgrounds: #0F172A.
- Subhead / body on dark: #94A3B8 or #E2E8F0.
- Subhead / body on light: #475569.
- Eyebrow / kicker / "NEW" / "LIVE" labels: #17D94B (green) or #FFC328 (yellow) — pick whichever fits the energy. Never generic gold, lime, mint, etc.
- Accent or highlighted words inside a headline: #2896FB or #FFC328. Never inline a custom color.
- CTA button text: #FFFFFF on the Primary Blue gradient, or #0B1426 on a yellow #FFC328 pill. Nothing else.
- Numbers / stats / big metric digits: #2896FB or #FFC328.
- DO NOT use rgba() with hue values outside this palette. Transparent overlays must be derived from these hex values only (e.g. rgba(40,150,251,0.3) is the rgb of #2896FB — that is allowed).

## Typography Scale (proportional to canvas height H)
- Hero headline: font-size ~ 0.13H, **font-weight 700 (Poppins Bold)** — clean editorial bold, NOT chunky. Letter-spacing -0.02em, line-height 1.0. Avoid the heavy "Black 900" look — keep it refined.
- Subhead: font-size ~ 0.045H, font-weight 500, letter-spacing 0, line-height 1.3, color #94A3B8.
- Eyebrow / kicker: font-size ~ 0.022H, font-weight 600, uppercase, letter-spacing 0.18em, color #17D94B or #FFC328.
- Body: font-size ~ 0.028H, font-weight 400, line-height 1.45.
- CTA pill text: font-size ~ 0.032H, font-weight 700.
- **Font loading is REQUIRED**: include this exact line at the top of <head> so Poppins renders correctly:
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  Then set body { font-family: 'Poppins', system-ui, -apple-system, sans-serif; }. Headlines explicitly: font-family: 'Poppins', sans-serif; font-weight: 700;

## Layout Rules (CRITICAL — this is what makes it look pro)
1. The root container MUST have the EXACT pixel width and height the user requested. Set both width and height in pixels. Use position: relative; overflow: hidden.
2. Apply a generous internal padding equal to ~6% of the SHORTER edge. All content lives inside this padding — nothing touches the edge except intentional bleed (background gradients, decorative shapes).
3. Use a clear grid: either centered single column, or 60/40 (text left, visual right) for landscape, or top-text/bottom-visual stack for portrait.
4. Vertical rhythm: every text element separated by ~0.5em margin. Group related items (eyebrow + headline + sub) tightly; large gap before the CTA.
5. NOTHING should overflow, clip, or wrap awkwardly. If the canvas is small (like 728×90 or 300×250), drop the eyebrow and subhead and keep ONLY headline + tiny logo + tiny CTA.
6. Optical centering — when a single block is centered, account for the wordmark / corner element so the perceived center matches.
7. Decorative shapes must be intentional: orbs, gradient blooms, gridlines, or floating UI chips. Never random.
8. The HighLevel wordmark sits in the top-left OR bottom-left corner, font-weight 700, font-size ~ 0.025H, color #F8FAFC on dark backgrounds. On tiny ad units (height < 200px) shrink to 11-13px or omit if there is genuinely no room.

## Anti-Overlap & Legibility Rules (MOST IMPORTANT — read carefully)
This is the #1 thing that ruins AI-generated designs. Follow these without exception:

A. **Reserve disjoint zones.** Before placing anything, mentally partition the canvas into rectangles: a TEXT ZONE, a VISUAL ZONE, a LOGO ZONE, a CTA ZONE. Each element belongs to exactly one zone and these zones MUST NOT geometrically overlap. Use CSS Grid or absolute positioning with explicit, non-intersecting rectangles. Never place a headline on top of an <img>, mascot, or photo. Never place a CTA on top of text. Never let a decorative orb sit underneath text without a backdrop scrim.

B. **Min clear-space between elements:** at least 24px (or 0.025H, whichever is larger) of empty space between any two distinct elements (headline ↔ subhead is the one exception, allowed at 0.5em).

C. **Text never touches images.** If a text element shares any horizontal band with an <img> (mascot, logo, photo), the text's bounding box and the image's bounding box must have at least 32px horizontal gap. Either move the text or shrink the image.

D. **Headline width budget:** in landscape with a right-side visual, headline max-width is 50% of canvas width. In a centered stack, headline max-width is 80% of canvas width. NEVER let a headline run edge-to-edge.

E. **Word-count → font-size sanity check.** Estimate (chars × 0.55 × fontSize) > maxWidth → headline will wrap awkwardly or overflow. Either reduce font-size, increase maxWidth, or shorten copy. A headline must fit in 1-3 lines, never 4+.

F. **Decorative orbs must have z-index 0 and opacity ≤ 0.55, OR sit fully outside the text zone.** A blurred orb directly behind text is OK if opacity ≤ 0.4. A sharp orb behind text is forbidden — move it or blur it.

G. **Backdrop scrim rule:** if any text MUST sit over a busy background (image, dense gradient, mascot glow), wrap the text block in a subtle scrim: background: linear-gradient(180deg, rgba(11,20,38,0.0) 0%, rgba(11,20,38,0.75) 60%); padding: 24px; border-radius: 16px. Or use a frosted card: background: rgba(11,20,38,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06).

H. **CTA isolation:** the primary CTA gets its own row with at least 32px clear above and below. It does not share a row with body text or wrap inside a paragraph.

I. **Logo isolation:** the wordmark sits in a corner with at least 24px clear-space on its inner edges. No text or visual element enters the logo's corner rectangle.

J. **Use CSS Grid or Flexbox for the main composition** — not absolute positioning for everything. Absolute positioning is only for: decorative orbs (behind), corner logo, corner CTA, and the hero visual on its dedicated side. Body text + headline + subhead + button live inside a Flex column that is itself placed in a Grid cell. This makes overlap mathematically impossible.

K. **Self-audit before outputting.** Walk through every text element and ask: "Does its bounding box intersect any image, mascot, or other text bounding box?" If yes, fix it. Designs with overlapping elements are rejected.

## Icons (HARD RULE — never invent wonky paths)
When the design needs an icon (checkmark, arrow, calendar, lightning, star, lock, phone, chart, user, message, etc.), you MUST use inline <svg> with the Lucide-style stroke convention. NEVER draw icons with raw <div>s, CSS borders/triangles, emoji characters, or freehand <path d="..."> guesses.

### Icon SVG conventions (apply to every icon)
- Wrapper: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="W" height="H" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
- W and H are equal (square). Sizes: tiny 14, small 18, medium 24, large 36, hero 64-120.
- COLOR comes from the brand palette only (typically #17D94B, #2896FB, #FFC328, #F8FAFC, or #94A3B8).
- For "filled" badge icons (white check on green disc, etc.): wrap the stroked SVG inside a <div> with the disc background, not by switching the SVG to fill.
- For hero-scale icons (100px+), use stroke-width 1.75 to keep them feeling refined; for small icons (<24px) keep stroke-width 2.
- Always set aria-hidden="true" on decorative icons.

### Approved icon path library — copy these EXACTLY. Do not modify the path data.

CHECK (✓):
<path d="M20 6 9 17l-5-5"/>

CHECK CIRCLE:
<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>

X / CLOSE:
<path d="M18 6 6 18"/><path d="m6 6 12 12"/>

ARROW RIGHT:
<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>

ARROW UP-RIGHT (growth):
<path d="M7 17 17 7"/><path d="M7 7h10v10"/>

TRENDING UP:
<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>

CHEVRON RIGHT:
<path d="m9 18 6-6-6-6"/>

PLUS:
<path d="M5 12h14"/><path d="M12 5v14"/>

STAR:
<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>

LIGHTNING / BOLT:
<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>

CALENDAR:
<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>

CLOCK:
<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>

USER:
<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>

USERS (group):
<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>

MESSAGE / CHAT:
<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>

PHONE:
<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>

MAIL:
<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>

LOCK:
<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>

CREDIT CARD:
<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>

DOLLAR / PAYMENT:
<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>

CHART BAR:
<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>

PIE CHART:
<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>

ACTIVITY (line chart):
<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>

ZAP / AUTOMATION:
<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>

ROCKET / LAUNCH:
<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15 9 12c.74-3.07 4.21-6.55 7-7 0 0 0 4-3 7l-3 3"/><path d="M15 12 12 9"/>

GLOBE:
<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>

SETTINGS / GEAR:
<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>

TARGET:
<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>

EYE:
<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>

HEART:
<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>

SPARKLE / AI:
<path d="m12 3-1.91 5.09L5 10l5.09 1.91L12 17l1.91-5.09L19 10l-5.09-1.91L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>

PLAY (video / live):
<polygon points="6 3 20 12 6 21 6 3"/>

SHIELD (security / trust):
<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>

DOWNLOAD:
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>

UPLOAD:
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>

HOME:
<path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>

INBOX:
<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>

### Icon usage rules
- If you can't find the right icon in this library, pick the closest one rather than freehanding a path. NEVER write a <path d="..."> with made-up coordinates.
- An icon's COLOR uses the brand palette. For active/positive states use #17D94B, for primary action #2896FB, for attention/celebration #FFC328, for neutral UI #94A3B8 or #F8FAFC.
- Icons that sit inside circles/squares/discs: build the disc with a CSS rounded div, then place the SVG centered inside via flex. Don't try to do the disc in the SVG.
- For "row of feature icons with labels", use a flex row with each item being [disc + svg + small label]. Standard disc size 36-44px, icon inside 18-22px.
- For a "hero icon" (one giant icon as the focal element), size it 80-160px square, stroke-width 1.75-2, with a soft brand-color glow behind it via a blurred radial gradient div.

## Visual Treatments (pick what fits the prompt — don't apply all)
- Background gradient: linear-gradient(135deg, #0B1426 0%, #122036 100%) OR radial-gradient(ellipse at top right, rgba(40,150,251,0.25), transparent 60%) on top of #0B1426.
- Glow orb: a div with radial-gradient(circle at center, #2896FB 0%, rgba(40,150,251,0.4) 35%, transparent 70%); filter: blur(20px) for atmospheric, no blur for crisp.
- Floating chips / pills: rounded-full, padding 8px 16px, background rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.1), backdrop-filter: blur(10px), font-size 0.022H, font-weight 600, color #E2E8F0.
- Primary CTA button: background linear-gradient(135deg, #2896FB, #0B6FD4); color #fff; padding 14px 28px; border-radius 999px; font-weight 700; box-shadow: 0 12px 30px rgba(40,150,251,0.35).
- Yellow accent badge: background #FFC328; color #0B1426; padding 6px 14px; border-radius 999px; font-weight 800; letter-spacing 0.1em; font-size 0.022H; uppercase.
- Drop shadows on cards: 0 24px 60px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3).
- Corner radius: 16-28px on cards, 999px on pills/buttons.

## Composition Patterns (use one)
- **Hero Split (landscape ≥ 1.5 ratio)**: text block left-aligned starting at left:6%, vertically centered, max-width 55%. Visual element (orb / device mock / chip cluster) anchored right. Wordmark top-left, optional small CTA bottom-left.
- **Centered Stack (square / portrait)**: eyebrow → headline → subhead → CTA, all center-aligned, vertically centered. Decorative orb behind everything, blurred.
- **Banner (height < 200px)**: Wordmark left, headline center, CTA right. ALL on one row. Vertically centered. NO subhead.
- **Story (1080×1920)**: Top third: wordmark + eyebrow. Middle third: huge headline. Bottom third: subhead + CTA. Decorative element behind, blurred.

## Rendering People / Subjects (when a Subject is described in the request)
When the user provides a Subject (a person, founder, customer, audience archetype, etc.), you MUST render a stylized inline-SVG illustration of that subject — never <img>, never a placeholder, never an emoji. Treat the subject like a hero illustration in a Linear/Stripe/Vercel hero section.

Style rules for the SVG figure:
- Always inline <svg> with explicit viewBox. Sized via CSS to ~70-90% of canvas height (portrait/square) or ~85-95% of height anchored right (landscape).
- Use a clean, geometric, slightly editorial style. Soft rounded shapes. No anatomy detail, no hyperrealism.
- Color palette for the figure (HARD CONSTRAINT, palette only):
  - Body / silhouette base: gradient from #122036 → #1A2942 (or #0B1426 → #122036 for darker scenes).
  - Rim light / highlight edge: stroke or thin overlay in #2896FB or #17D94B at ~0.6 opacity.
  - Skin / face plane: a single flat shape filled with #E2E8F0 (no shading detail). Simple eye + smile suggested with 1-2 dark strokes in #0B1426.
  - Hair: flat #0B1426 or #122036.
  - Clothing accent: a single brand-color block (#2896FB, #00B2A9, or #FFC328) — pick whichever fits the energy.
  - Soft glow behind the figure: radial-gradient(circle, rgba(40,150,251,0.45) 0%, transparent 65%); filter: blur(40px); placed in a div behind the SVG.
- Position: figure sits in the VISUAL zone, NEVER overlapping the TEXT zone. Apply the same anti-overlap rules — at least 32px gap from any text bounding box.
- If the subject is a group (e.g. "two co-founders"), render 2 figures side by side, slightly overlapping silhouettes, scaled down proportionally.
- If the subject is non-human (a product, a device, an icon), render a clean geometric SVG illustration in the same brand-color treatment.

## Carousel Mode (when the user requests multiple slides)
When the user requests N slides, output N complete <!doctype html> documents, each separated by EXACTLY this delimiter on its own line:
<!--SLIDE-BREAK-->

Carousel rules:
- Slide 1 is the COVER: bold hook headline, big eyebrow, optional "Swipe →" hint at bottom-right, wordmark top-left.
- Middle slides are CONTENT: each focuses on ONE idea (a stat, a step, a benefit, a quote). Number them subtly in the corner ("02 / 05") in #17D94B 0.022H uppercase.
- Final slide is the CTA: clear call to action, big button, wordmark, optional handle/URL.
- Visual cohesion across slides: same background scene, same color story, same wordmark position, same typography scale. Vary the focal element (orb position, accent shape) so they feel like a story, not duplicates.
- Each slide is the EXACT same canvas dimensions specified.
- Do not number slides in their headlines; only the small corner counter.
- Output order: slide 1 first, then delimiter, then slide 2, etc. No prose anywhere.

# Output Rules (NON-NEGOTIABLE)
- Return ONLY a complete HTML document starting with <!doctype html>. NO prose, NO markdown fences, NO explanation, NO comments outside the HTML.
- Inline all CSS in a single <style> tag inside <head>. No external CSS, no scripts, no @import. The ONLY external resource permitted is the Poppins Google Fonts <link> tags specified in the Typography section.
- Use shaped <div> elements, CSS gradients, CSS shadows, SVG (inline) for icons, and text.
- <img> tags are ONLY allowed for asset URLs explicitly provided by the user in the "Required Assets" section of the message. NEVER hotlink any other image.
- If a HighLevel logo URL is provided, you MUST use that <img> rather than typing "HighLevel" as text in CSS.
- If a Highly mascot URL is provided, you MUST place that <img> as the hero visual.
- **HARD RULE — HighLevel brand mark integrity:** NEVER invent, draw, redraw, illustrate, or recreate the HighLevel logo, wordmark, icon, or any HighLevel brand mark in CSS, SVG, divs, or text styling. The HighLevel mark is a specific registered asset (3 colored arrows in green/blue/yellow forming a stylized "H" next to the "HighLevel" wordmark in Poppins). You are NOT permitted to approximate it. If the prompt mentions the HighLevel logo / wordmark / brand mark and NO logo asset URL was provided in the Required Assets block, you MUST fall back to plain text "HighLevel" in Poppins weight 700, in the appropriate brand color (white on dark, #0B1426 on light) — and you MUST NOT draw any icon, arrows, "H" mark, geometric shapes, or decoration next to it. The plain wordmark only.
- **HARD RULE — Highly mascot integrity:** NEVER invent, draw, or illustrate the Highly mascot in SVG/CSS. Highly is a specific 3D-rendered character (rounded head with black visor, teal eyes, white-and-blue body, jet thruster). You are NOT permitted to approximate it. If the prompt mentions Highly / the mascot and no Highly URL was provided, OMIT the mascot entirely and rebalance the layout — do NOT substitute with a generic robot, blob, smiley, or character illustration.
- The <body> must contain a single root <div class="canvas"> with EXACT pixel width and height matching the requested aspect ratio. Set body { margin:0; background:#0B1426; display:flex; align-items:center; justify-content:center; min-height:100vh; } so the canvas centers in the viewport for preview.
- Set box-sizing: border-box on everything (* { box-sizing: border-box; margin: 0; padding: 0; }).
- Test mentally: would a designer at Linear, Stripe, or Vercel be okay with shipping this? If no, refine before outputting.

# HighLevel Product UI Reference Library (CRITICAL — use when the prompt asks for any HighLevel screen, app UI, dashboard, workflow, dialer, conversations, pipeline, calendar, sites, automations, ads, reputation, opportunities, or any "product mockup")

When the user prompt mentions any HighLevel product surface (e.g. "workflow UI", "calling UI", "dialer", "inbox", "conversations", "pipeline", "kanban", "dashboard", "CRM screen", "GHL app", "automation builder", "calendar UI", "appointment UI", "opportunities", "snapshots", "sub-account dashboard", "agency dashboard"), you MUST render an inline HTML/CSS mockup that visually mimics the real HighLevel product UI to ~80% accuracy using ONLY divs, spans, inline SVG, and CSS. Never use external images for the UI itself. The mockup is the hero visual of the marketing graphic — frame it as a browser-style chrome (rounded corners, top bar with red/yellow/green dots, subtle drop-shadow), then reproduce the screen below.

## ABSOLUTE HARD RULES (highest priority — violating any of these fails the design)
1. **THE BODY OF THE SIMULATED APP IS NEVER BLANK.** Empty white space inside the browser frame is an automatic failure. After you draw the chrome (traffic lights, left rail, top header), you MUST fill the main content area with at least the minimum element count for the requested screen (see "Minimum content density" below). If you find yourself with an empty white rectangle inside the frame, STOP and add the missing UI elements before outputting.
2. **Take BOTH screens when prompt asks for two surfaces.** If the prompt names two surfaces (e.g. "workflow + dialer"), the dialer card overlaps the workflow body — both visible at once.
3. **Show the screen the user asked for, not just the rail.** Sidebar/header alone is not enough; the page-specific content (nodes / list / cards / chart) is the focal point.
4. **Use placeholder text that LOOKS realistic — never lorem ipsum, never just "Title" or "Item 1".** Use specific HighLevel-style copy: "Send SMS", "Tag added: cold-lead", "Sara Patel · 415-555-0142", "Re-engage cold leads", "$12,400 · Due Mar 14", "Booked Calls: 47 (+12.4%)". Names, dates, dollar amounts, dispositions.

## Minimum content density per screen (mental checklist before outputting)
- **Workflow / Automation Builder**: ≥1 trigger node + ≥3 action nodes + ≥1 if/else branch + connecting lines, all visible inside the canvas. Each node has a real-sounding label and subtitle.
- **Phone Dialer / Calling**: dialer card must show contact name, phone number, call timer ("00:42") OR "Ringing…", a 3×4 keypad (12 keys), and the bottom action bar with mute/keypad/hold/transfer + a red end-call button. Avatar circle visible.
- **Conversations / Inbox**: conversation list with ≥4 contact rows (name, preview text, channel icon, timestamp) + an open thread with ≥3 chat bubbles (mix of inbound gray-left and outbound blue-right) + composer at bottom.
- **Pipeline / Kanban**: ≥4 columns with stage names, totals, and counts + ≥6 opportunity cards distributed across columns. Each card shows contact name, dollar value, due date, owner avatar.
- **Dashboard / Reporting**: ≥4 KPI tiles with numbers + deltas + ≥1 chart (line or bar or donut) with visible axis lines and data shape.
- **Calendar**: ≥7 day columns or month grid with ≥5 colored appointment blocks at varied times.
- **Sites / Funnel builder**: page-thumbnail grid with ≥4 page tiles + side panel showing element library.

If the canvas is too small to fit ALL of the above, REDUCE counts proportionally but never go below 50% of the minimums, and never ship an empty body.

## Global app chrome (shared across all HighLevel screens)
- App background: pure white #FFFFFF for the main canvas. The deep navy #0B1426 brand color is reserved for the OUTER marketing graphic background ONLY (the area around the browser frame). Inside the simulated app, treat it as a real SaaS UI on white.
- Browser/window frame around the app: border-radius 14px, background #FFFFFF, border 1px solid #E5E9F0, box-shadow 0 30px 80px rgba(11,20,38,0.45). Top chrome bar (28-32px tall) with three traffic-light dots (#FF5F57, #FEBC2E, #28C840) on the left, optionally a faint URL pill in center.
- Left vertical sidebar (rail): width 56-72px, background #0B1426 (dark navy), full height. Stack of square icon buttons (28x28 inside 44x44 hit area) in #94A3B8, with the ACTIVE icon highlighted by a soft #2896FB background tint (rgba(40,150,251,0.12)) and #2896FB stroke. Icons should be simple line SVGs at stroke-width 1.6. At the very top of the rail: a small HighLevel mark / colored square placeholder. At the bottom: avatar circle.
- Sidebar icon order (top to bottom, label → icon hint): Dashboard (grid), Conversations (chat-bubble), Calendars (calendar), Contacts (users), Opportunities (funnel/pipeline), Payments (dollar), Marketing (megaphone), Automations (lightning bolt), Sites (globe), Memberships (graduation cap), Reputation (star), Reporting (bar-chart), Settings (gear).
- Top header bar (40-48px tall, white, border-bottom 1px solid #EEF1F6): page title in #0B1426 weight 600 on the left; right side has a search input pill, a green phone icon (#17D94B background, white phone glyph) for the dialer, a notifications bell, and a circular avatar.
- Body typography: Inter or Poppins, all weights. Body text 13-14px, color #0F172A. Secondary text #64748B. Borders #E5E9F0. Cards: white, border 1px solid #E5E9F0, border-radius 10px, subtle shadow 0 1px 2px rgba(15,23,42,0.04).
- Brand color usage inside the app: green #17D94B for "active / live / success / call" states; blue #2896FB for primary buttons + selected nav; yellow #FFC328 for warnings + pending; red #EF4444 for destructive only. Pills/badges have rounded-full corners and 10-11px uppercase text.

## Workflow / Automation Builder UI
- Two-pane layout INSIDE the app body: left = node canvas (light grid background #FAFBFC with subtle 24px dotted grid #E5E9F0), right = config panel (white, 320-380px wide, border-left 1px #E5E9F0).
- Top toolbar above the canvas: workflow name in bold + "Draft" pill (yellow #FFC328 background, navy text), then segmented tabs "Builder | Settings | Enrollment History | Execution Logs", then on the right "Save" button (white border) and "Publish" button (green #17D94B, white text).
- Nodes on the canvas: vertical stack connected by thin #CBD5E1 vertical lines with a small "+" circle between them.
  • Trigger node (top): pill-shaped card, lightning-bolt icon in #FFC328 circle, label "Trigger" in 11px uppercase #94A3B8, then trigger name in 14px #0F172A weight 600 (e.g. "Form Submitted", "Contact Tag Added", "Appointment Booked").
  • Action nodes: rounded 8px white cards, 220-260px wide, with a colored left-border stripe by category — blue #2896FB for Communication (Send SMS / Send Email / Make Call), purple #8B5CF6 for AI / Conversation AI, orange #F97316 for CRM (Update Contact, Add Tag), green #17D94B for Internal Notifications.
  • Each node header: small category icon (16px) + action title (13px weight 600), then a one-line subtitle in #64748B (e.g. "If Lead Score > 50").
  • Branch / If-Else node: diamond chip in #FFC328 with "If/Else" label, splitting into two horizontal columns labeled "YES" (green border) and "NO" (red border).
  • Wait nodes: smaller pill, clock icon, "Wait 1 day" text in #64748B.
- Right config panel: tab strip ("Action | Filters | Goal"), then a form with labeled inputs (label 11px uppercase #64748B, input white with 1px #E5E9F0 border, 8px radius), a "Custom values" insertable token chip in #2896FB tint, and a sticky "Save Action" green button at the bottom.

## Phone Dialer / Calling UI
- Floating dialer card centered or top-right of the app: 360px wide, white, border-radius 16px, shadow 0 20px 50px rgba(11,20,38,0.18).
- Header bar of the dialer: green #17D94B (or gradient #17D94B → #00B2A9) at the top, height ~120px, contact avatar circle (60px) center, contact name in white 16px weight 600, contact subtitle (e.g. "+1 (415) 555-0142") in white 12px opacity 0.85, status pill "On Call · 02:14" or "Ringing…" in white border pill below.
- Body: number-pad grid 3x4 (1-9, *, 0, #), each key a 64x64 rounded square, light gray #F1F5F9 background, big number 18px weight 500 #0B1426, small letters under (e.g. "ABC") in 9px #94A3B8.
- Action bar at the bottom of the dialer: 4-5 circular icon buttons (mute, keypad, hold, transfer, record) in 44px circles, light gray default, blue #2896FB when active. Center: a large 64px round red #EF4444 button with white phone-down icon to end the call.
- Side controls (when shown): "Add Notes" expandable section (textarea), "Disposition" dropdown (Answered / No Answer / Voicemail / Wrong Number), "Tag Contact" multi-select chips, "Schedule Follow-up" link.
- If the prompt says "incoming call" or "calling", show pulsing green ring around the avatar (use a static design — radial concentric circles fading to transparent). If "softphone" or "minimized dialer", render a thin pill at the bottom of the screen instead of the full card.
- Top-right of the OUTER app header always shows the green phone button (#17D94B circle, white phone icon) — this is the entry point users recognize.

## Conversations / Inbox UI
- Three-column layout: (1) Inbox/folder rail 200-220px wide (#FAFBFC bg), (2) conversation list 300-340px wide (white, border-right 1px #E5E9F0), (3) message thread (flex 1).
- Folder rail: section labels "Inboxes" (uppercase 10px #94A3B8), folders Unread (with count pill in blue), All, Recents, Starred, Mentions, Assigned to me, Drafts. Each row 36px tall with icon + label.
- Conversation list: each row 76-88px tall, contact avatar (40px circle, colored initial fallback), contact name 13px weight 600 #0F172A, last-message preview 12px #64748B truncated, channel icon at top-right (SMS bubble in green, email envelope in blue, FB messenger in #1877F2, Instagram in pink/orange gradient, WhatsApp in #25D366), timestamp 11px #94A3B8, unread = blue dot + name in bold, selected row has #EFF6FF background and #2896FB left border 3px.
- Filter/search bar at top of list: search input + filter chips ("All channels", "Status: Open", "Assigned: Me") with x to remove.
- Message thread: header bar with contact name, channel pill, "More" actions (assign, snooze, archive) in icon buttons. Body: chat bubbles — INBOUND messages on the LEFT in #F1F5F9 with #0F172A text, OUTBOUND on the RIGHT in #2896FB with white text, both with 14px radius (sharp corner toward the side of origin). Timestamp + delivery status ("Delivered ✓✓ 2:14pm") under each message in 10px #94A3B8.
- Composer at bottom: tabbed channel switcher (SMS | Email | WhatsApp | FB | IG), text area, formatting toolbar (B I U link), template dropdown, attachment paperclip, AI-suggest sparkle icon in #2896FB, big green "Send" button on the right.
- Right side panel (collapsible, 300px): contact card with avatar + name + phone + email + tags + "Open contact" link, then accordion sections: "Recent Activity", "Appointments", "Opportunities", "Notes", "Tasks".

## Pipeline / Opportunities Kanban UI
- Top bar above the board: pipeline name in 18px weight 700, dropdown to switch pipelines, then "+ Add Opportunity" green button, "Filters" white pill, "Sort" white pill, "Board / List" segmented toggle.
- Horizontal scrollable columns, each 280-320px wide, separated by 16px gaps.
- Column header: pill background tinted to the stage color (New = blue, Contacted = #FFC328 yellow, Qualified = #8B5CF6 purple, Proposal = #F97316 orange, Won = #17D94B green, Lost = #94A3B8 gray) with stage name in 13px weight 700, count "(12)" in 12px next to it, total value "$24,400" in 12px #64748B, plus a "+" icon to add. Background of column body: #F8FAFC.
- Opportunity cards: white, border-radius 10px, padding 12px, border 1px #E5E9F0, soft shadow. Top row: contact avatar + name (13px weight 600). Below: opportunity title (12px #0F172A). Row of meta: dollar value in green weight 600, due date in #64748B with calendar icon, owner avatar (16px circle) on the right. Bottom row: 1-2 small tag chips (rounded, colored backgrounds), and an icons strip showing communication touchpoints (SMS, email, call, last-activity dot in green if active in last 24h).
- Drag handle indicated by 6 small dots in the top-right of each card on hover.

## Dashboard / Reporting UI
- Page header: "Dashboard" title + date-range pill ("Last 30 days ▾") + "Customize" button (white) + "+ Add Widget" button (blue).
- 12-column responsive grid of widget cards: KPI tiles (Revenue, Leads, Booked Calls, Conversion Rate) — each card: label in 11px uppercase #94A3B8, big number 32-40px weight 700 #0B1426, delta chip below ("+12.4%" green or "-3.1%" red with arrow). Larger cards: line chart (Revenue trend, area gradient #2896FB → transparent), bar chart (leads by source), donut (channel mix), pipeline value funnel.
- Charts use brand colors with #2896FB as primary, #17D94B for "won/converted", #FFC328 for "pending", #94A3B8 for "lost/baseline". Grid lines #EEF1F6, axis labels #94A3B8 11px.
- Tables: striped rows with #F8FAFC alt background, header in #64748B 11px uppercase, cell text 13px #0F172A.

## Calendar / Appointments UI
- Week or month view: column headers Mon-Sun in 11px uppercase, day numbers in 14px weight 600.
- Today indicated by a #2896FB filled circle around the day number.
- Appointment blocks: rounded 6px, colored by calendar (blue, green, purple, orange), white text 12px weight 600 with start time on top and title below. Stacked vertically inside time slots, with rounded ends.
- Side panel: mini-calendar at top, then list of upcoming appointments with time + contact + service, "Book Appointment" green button at the bottom.

## CSS class naming and structure
Use semantic class names so the result is readable: .gh-app, .gh-rail, .gh-rail-icon, .gh-header, .gh-search, .gh-call-btn, .gh-canvas, .gh-node, .gh-node-trigger, .gh-node-action, .gh-config-panel, .gh-dialer, .gh-keypad, .gh-key, .gh-conv-list, .gh-conv-row, .gh-thread, .gh-bubble.in, .gh-bubble.out, .gh-pipeline, .gh-stage, .gh-card, .gh-kpi.

## Marketing graphic framing rules when a HighLevel UI is the visual
- The simulated app sits in a tilted/floating browser frame with perspective transform: rotateY(-6deg) rotateX(2deg) (3D depth) on LARGE/landscape canvases; flat (no perspective) on SMALL/portrait.
- Outer canvas background uses the deep navy + brand orbs as usual; the headline / eyebrow / CTA wrap around the device, NEVER overlap the screen content.
- Add 1-2 floating "callout" chips that point at specific screen elements with a thin 1px line and a small pill containing a feature label (e.g. "AI auto-replies", "Drag-and-drop builder", "One-click dialer"). Use #FFC328 or #17D94B fills.
- The HighLevel wordmark/logo still goes in the corner of the OUTER canvas — never inside the simulated product UI (the product chrome can show a small placeholder square as the in-app brand mark).`;

router.post("/claude-design", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "Anthropic integration is not configured" });
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "1200x630";
  let logoUrl = typeof req.body?.logoUrl === "string" ? req.body.logoUrl : "";
  let logoDescription = typeof req.body?.logoDescription === "string" ? req.body.logoDescription : "";
  let highlyUrl = typeof req.body?.highlyUrl === "string" ? req.body.highlyUrl : "";
  let highlyPoseDescription = typeof req.body?.highlyPoseDescription === "string" ? req.body.highlyPoseDescription : "";
  const defaultLogoUrl = typeof req.body?.defaultLogoUrl === "string" ? req.body.defaultLogoUrl : "";
  const defaultLogoDescription = typeof req.body?.defaultLogoDescription === "string" ? req.body.defaultLogoDescription : "";
  const defaultHighlyUrl = typeof req.body?.defaultHighlyUrl === "string" ? req.body.defaultHighlyUrl : "";
  const defaultHighlyDescription = typeof req.body?.defaultHighlyDescription === "string" ? req.body.defaultHighlyDescription : "";

  // Auto-include HL brand assets when the user mentions them in the prompt, even if the toggle is off.
  // We never want Claude to invent a fake HighLevel logo or Highly mascot from scratch.
  // Liberal matching — this is the HighLevel brand engine. Any mention of "logo",
  // "wordmark", "brand mark", "Highly", or "mascot" should pull in the real asset.
  const LOGO_MENTION = /\blogo[s]?\b|\bwordmark\b|\bbrand\s*mark\b|\bbrand\s*lockup\b|\blockup\b|\bhl\s*mark\b|\bhighlevel\s*mark\b/i;
  const HIGHLY_MENTION = /\bhighly\b|\bmascot[s]?\b/i;
  if (!logoUrl && defaultLogoUrl && LOGO_MENTION.test(prompt)) {
    logoUrl = defaultLogoUrl;
    logoDescription = defaultLogoDescription || logoDescription;
  }
  if (!highlyUrl && defaultHighlyUrl && HIGHLY_MENTION.test(prompt)) {
    highlyUrl = defaultHighlyUrl;
    highlyPoseDescription = defaultHighlyDescription || highlyPoseDescription;
  }
  const sceneName = typeof req.body?.sceneName === "string" ? req.body.sceneName : "";
  const sceneDescription = typeof req.body?.sceneDescription === "string" ? req.body.sceneDescription : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const itemDescription = typeof req.body?.itemDescription === "string" ? req.body.itemDescription.trim() : "";
  const hasItem = !!req.body?.hasItem;
  const rawSlideCount = Number(req.body?.slideCount);
  const slideCount = Number.isFinite(rawSlideCount)
    ? Math.min(10, Math.max(1, Math.round(rawSlideCount)))
    : 1;

  const ALLOWED_MODELS = new Set([
    "claude-sonnet-4-6",
    "claude-opus-4-6",
    "claude-opus-4-7",
  ]);
  const requestedModel = typeof req.body?.model === "string" ? req.body.model : "claude-sonnet-4-6";
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : "claude-sonnet-4-6";

  const assetBlock: string[] = [];
  if (logoUrl) {
    assetBlock.push(`HighLevel logo (REQUIRED — use this exact URL in an <img> tag, do NOT type the wordmark in CSS, do NOT substitute another image):
<img src="${logoUrl}" alt="HighLevel" />
Variant description: ${logoDescription || "official HighLevel lockup"}.
- Render with style="height: <appropriate>px; width: auto; display: block;". For wordmark/horizontal lockups use height ~ 0.05H to 0.07H. For icon/circle/square marks use height ~ 0.08H to 0.10H (squarer aspect can go larger).
- Place it in the top-left OR bottom-left corner with the same 6% padding as the rest of the canvas. On extremely small banners (height < 120px) shrink to 18-22px.
- **Logo integrity (HARD RULE — no exceptions):** the <img> tag for the logo must have NO style or class that applies any of: filter, -webkit-filter, mix-blend-mode, opacity below 1, mask, mask-image, -webkit-mask, background-clip: text, color (irrelevant on img but never apply), or any CSS transform that distorts. The logo's parent and ancestor elements must also not apply filter, mix-blend-mode, or backdrop-filter that would bleed onto it (no parent with filter: brightness/grayscale/invert/hue-rotate/sepia/blur/drop-shadow). The colored arrows mark inside the lockup MUST render in its native green/blue/yellow — if you ever see yourself writing filter:, mix-blend-mode:, or opacity:0.x on the logo or any wrapping div, delete it.
- Use the variant exactly as provided. Do NOT recolor, tint, mask, or composite it. Do NOT wrap it in a div with mix-blend-mode: screen / overlay / luminosity. Do NOT place it on top of a glow that uses mix-blend-mode.
- Reserve a clear-space rectangle around it equal to ~half the logo height on every side. No text, orb, or other element may enter that rectangle.`);
  }
  // Auto-detect: prompt mentions a human → generate one with Nano Banana Pro.
  // BUT: if the user uploaded a custom item, treat that as the hero person/product
  // and never generate a separate AI human — the custom item wins, period.
  const wantsHuman = HUMAN_KEYWORDS.test(prompt) && !hasItem;
  let humanDataUrl = "";
  let humanDescription = "";
  if (wantsHuman) {
    try {
      const { imagePrompt, description } = await buildHumanPromptAndDescription(baseUrl, apiKey, {
        theme: prompt,
        sceneName,
        aspect,
      });
      const result = await generateImage(imagePrompt, "gemini-3-pro-image-preview");
      humanDataUrl = `data:${result.mimeType || "image/png"};base64,${result.b64_json}`;
      humanDescription = description;
    } catch (err) {
      console.error("[claude-design] auto human gen failed", err);
    }
  }

  if (humanDataUrl) {
    assetBlock.push(`AI-generated human photo (REQUIRED — embed as the hero portrait):
<img src="${HUMAN_PLACEHOLDER}" alt="Featured person" data-ai-human="true" />
You MUST keep the data-ai-human="true" attribute on this <img> tag exactly as written so the editor can find it later.
Subject description: ${humanDescription}
- This is a high-resolution photoreal portrait. Use it as a hero visual focal point.
- Apply object-fit: cover; on a fixed-dimension wrapper. For portrait/square canvases, the photo should occupy 45-65% of the canvas (right column or top half). For landscape, 40-55%.
- Add a subtle dark gradient overlay only over text-bearing edges, never across the face.
- Round corners minimally (8-12px) or leave full-bleed; do NOT crop into a circle unless the design explicitly calls for an avatar.
- NEVER render the person as SVG — use the <img> tag with this exact src.
- **CRITICAL — Background-removal compatibility**: the user can click "Remove BG" to make the photo's background transparent. So:
  • The container that holds the <img data-ai-human> MUST have its OWN visible background — either inheriting the slide's main background gradient, or a solid brand color (#0B1426 / #122036 / a brand gradient). NEVER use a checkered pattern, no transparent/grid texture, no diagonal stripes, no "image placeholder" pattern, no semi-transparent overlay-only container.
  • If you place the photo inside a card or column on the right, that card's background must be a real brand color or gradient that looks intentional WITHOUT the photo (e.g. linear-gradient(180deg, #122036, #0B1426)). After cutout, the subject should sit cleanly on top of that gradient.
  • Do NOT decorate the photo container with subtle dot-grids, line-grids, or noise textures — those become very visible once the photo background is removed.`);
  }
  if (hasItem) {
    assetBlock.push(`User-supplied custom image (REQUIRED — this IS the hero subject of the design):
<img src="${ITEM_PLACEHOLDER}" alt="Featured subject" />
${itemDescription ? `What this image is: ${itemDescription}` : ""}
- This image is the user's OWN asset. It could be a person (speaker, host, customer, founder, team member), a product, a UI screenshot, a logo, or any other real thing they want featured. Whatever the description says it is — that's what it is.
- **HARD RULE — IF the description identifies a PERSON (e.g. "our speaker", "the host", "John our customer", "founder", "guest", "guy/girl/woman/man attending"), then THIS IMAGE IS THAT PERSON.** Do NOT add, render, illustrate, or describe any other person on the canvas. The featured-person slot, the speaker portrait, the headshot, the testimonial photo, the host avatar — all of those are filled by THIS image. No SVG silhouettes, no "person illustration", no second portrait, no stock-photo-style human. Only this <img>.
- Render with style="max-height: 70%; max-width: 50%; object-fit: cover; display: block;" when used as a person/portrait. For products use object-fit: contain at max 50% / 45%.
- Place it in the VISUAL zone of the slide (typically the right column or opposite side from the headline), never overlapping headline text.
- Add a soft glow behind it: filter: drop-shadow(0 8px 30px rgba(40,150,251,0.35));
- If it is a person, add an attribution caption directly under or beside it (name + role, e.g. "Dr. Priya Mehta · AI Researcher"). Pull the name from the description if present; if not, use a placeholder like "Featured Speaker".
- NEVER replace this with an SVG illustration — always use the <img> tag with this exact src.`);
  }
  if (highlyUrl) {
    assetBlock.push(`Highly mascot (REQUIRED — include in the design as a hero visual element):
<img src="${highlyUrl}" alt="Highly" style="height: auto; width: auto;" />
Pose: ${highlyPoseDescription || "default"}.
- Highly is the friendly HighLevel mascot. Treat as the primary visual focal point alongside the headline.
- Highly's height should be ~70-85% of the canvas height for portrait/square, or ~85-95% for landscape (placed on right side).
- Add a soft blue glow behind Highly: radial-gradient(circle, rgba(40,150,251,0.45) 0%, transparent 65%); filter: blur(40px); positioned behind the img.
- NEVER cover Highly's face/visor with text. Headline goes on the opposite side.`);
  }
  const sceneBlock = sceneDescription
    ? `\n# Scene Direction (MUST follow this background/atmosphere)
Scene: ${sceneName}
${sceneDescription}
Treat this as the visual stage on top of which the Design Request is composed. The scene defines the background, lighting, and decorative treatment. The Design Request defines the message, headline, and content. Both must coexist without conflict — adjust the scene's color intensity if needed so foreground text remains highly legible (apply scrim if necessary).`
    : "";

  const subjectBlock = subject
    ? `\n# Subject (render as a stylized inline-SVG illustration per the "Rendering People / Subjects" rules)
${subject}
The subject is the visual focal point. Place it in the VISUAL zone, never overlapping any text. Render it as a clean geometric SVG figure in HighLevel brand colors — never as <img>, never as a placeholder, never as an emoji.`
    : "";

  const slideRoles = (() => {
    if (slideCount === 2) return "- Slide 1: COVER (hook headline + eyebrow).\n- Slide 2: CTA (call to action + button + wordmark).";
    return `- Slide 1: COVER (hook headline + eyebrow + "Swipe →" hint).\n- Slides 2 through ${slideCount - 1}: CONTENT (one idea each, with a small \"NN / ${String(slideCount).padStart(2, "0")}\" counter in #17D94B in a corner).\n- Slide ${slideCount}: CTA (call to action + button + wordmark).`;
  })();
  const slideBlock = slideCount > 1
    ? `\n# Carousel Output (CRITICAL)
Generate EXACTLY ${slideCount} slides as a cohesive social-media carousel.
${slideRoles}
Each slide must be a COMPLETE, standalone <!doctype html> document at exactly ${aspect}.
Separate slides with EXACTLY this delimiter on its own line:
<!--SLIDE-BREAK-->
Output nothing else — no prose, no explanation, no markdown.`
    : "";

  const format = typeof req.body?.format === "string" ? req.body.format : "social";
  const designBrief = buildCanvasBrief(aspect, format);
  const userContent = [
    `Canvas size: ${aspect} pixels (width × height). The root container MUST be exactly these dimensions.`,
    "",
    designBrief.text,
    "",
    sceneBlock,
    subjectBlock,
    slideBlock,
    assetBlock.length ? `\n# Required Assets\n${assetBlock.join("\n\n")}` : "",
    `\n# Design Request\n${prompt}`,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model,
      max_tokens: slideCount > 1 ? Math.min(32000, 4500 * slideCount + 4000) : 8192,
      system: HIGHLEVEL_BRAND_SYSTEM,
      messages: [
        { role: "user", content: userContent },
      ],
    });

    const block = message.content[0];
    const text = block && block.type === "text" ? block.text : "";

    // Extract HTML — strip any accidental markdown fences just in case.
    const cleaned = text
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    if (!/<!doctype|<html/i.test(cleaned)) {
      return res.status(502).json({ error: "Claude did not return an HTML document", raw: text.slice(0, 500) });
    }

    const slides = cleaned
      .split(/<!--\s*SLIDE-BREAK\s*-->/i)
      .map(s => s.trim())
      .filter(s => /<!doctype|<html/i.test(s));

    const finalSlides = (slides.length === 0 ? [cleaned] : slides).map((s) => {
      let out = s;
      if (humanDataUrl) {
        out = out.split(HUMAN_PLACEHOLDER).join(humanDataUrl);
        // Bulletproof: guarantee any <img> tag with the human data URL carries
        // data-ai-human="true" so the client can find + auto-cut it. Claude
        // sometimes drops attributes during generation.
        out = out.replace(/<img\b([^>]*?)>/gi, (full, attrs) => {
          const a = attrs as string;
          const srcMatch = a.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
          if (!srcMatch || srcMatch[1] !== humanDataUrl) return full;
          if (/\bdata-ai-human\s*=/.test(a)) return full;
          return `<img${a} data-ai-human="true">`;
        });
      }
      return out;
    });

    return res.json({
      html: finalSlides[0],
      slides: finalSlides,
      humanGenerated: !!humanDataUrl,
      humanDescription: humanDescription || undefined,
      // Send the human data URL prefix so the client has a fallback way to
      // identify the human image even if every attribute hint is stripped.
      humanSrcPrefix: humanDataUrl ? humanDataUrl.slice(0, 80) : undefined,
    });
  } catch (err: any) {
    console.error("[claude-design] error", err);
    return res.status(500).json({ error: err?.message || "Failed to generate design" });
  }
});

function buildCanvasBrief(aspect: string, format: string) {
  const m = aspect.match(/^(\d+)\s*x\s*(\d+)$/i);
  const W = m ? parseInt(m[1], 10) : 1080;
  const H = m ? parseInt(m[2], 10) : 1080;
  const ratio = W / H;
  const area = W * H;

  const orientation = ratio > 1.25 ? "landscape" : ratio < 0.8 ? "portrait" : "square";

  // Density tier driven by both raw area AND short edge — a 728×90 banner has
  // huge area-vs-90px constraints, so use minEdge as the actual budget signal.
  const minEdge = Math.min(W, H);
  let tier: "micro" | "small" | "medium" | "large";
  if (minEdge < 160) tier = "micro";
  else if (minEdge < 400) tier = "small";
  else if (minEdge < 900) tier = "medium";
  else tier = "large";

  // Element budget: how many distinct content blocks the canvas can hold without overlap.
  const elementBudget = tier === "micro" ? 3
    : tier === "small" ? 4
    : tier === "medium" ? 6
    : 9;

  // Recommended layout pattern.
  let layout: string;
  if (tier === "micro") {
    layout = orientation === "landscape"
      ? "Single horizontal row: [logo][headline][CTA pill]. NO subline, NO orbs, NO icons inside the CTA, NO decorative chips. Padding 12-16px. Vertical centering only."
      : "Single vertical stack centered: [logo][1-line headline][CTA]. Nothing else fits.";
  } else if (tier === "small") {
    layout = orientation === "landscape"
      ? "Split 55/45: left side [eyebrow + headline + CTA pill], right side [one focal visual OR one stat number]. Logo top-left. Padding 24-32px."
      : "Stacked: [logo top-left][eyebrow][headline 2-3 lines][short subline][CTA]. One small accent element (orb or chip), nothing more.";
  } else if (tier === "medium") {
    layout = orientation === "landscape"
      ? "Split 60/40 or 50/50: text column on one side (eyebrow + headline + subline + CTA), focal visual on the other (subject, illustration, or stat block). Logo in a corner."
      : "Vertical hero: [logo top-left][eyebrow][big headline][subline][focal visual or chip cluster][CTA bottom]. Generous breathing room.";
  } else {
    layout = orientation === "landscape"
      ? "Editorial spread: hero headline + subline on one side, rich visual composition (charts/tiles/grid/subject) on the other. Plenty of room for icons, badges, and supporting columns."
      : "Full editorial poster: [eyebrow + logo top][massive hero headline][subline][grid of feature tiles or stat row][CTA]. Use the height — don't crowd everything into one band.";
  }

  // Type sizes (proportional to short edge so they always read).
  const headlineMin = Math.round(minEdge * (tier === "micro" ? 0.18 : tier === "small" ? 0.10 : tier === "medium" ? 0.08 : 0.07));
  const headlineMax = Math.round(minEdge * (tier === "micro" ? 0.28 : tier === "small" ? 0.16 : tier === "medium" ? 0.13 : 0.11));
  const sublineSize = Math.max(11, Math.round(minEdge * (tier === "micro" ? 0 : tier === "small" ? 0.045 : 0.035)));
  const padding = tier === "micro" ? 12 : tier === "small" ? 24 : tier === "medium" ? 48 : 64;

  // Word/length caps so Claude doesn't write a paragraph for a 728x90.
  const headlineWords = tier === "micro" ? "3-5" : tier === "small" ? "4-7" : tier === "medium" ? "5-9" : "6-12";
  const sublineRule = tier === "micro" ? "NO subline." : tier === "small" ? "Optional 1-line subline (max 8 words)." : "Subline 1-2 lines (max 18 words).";
  const ctaRule = tier === "micro" ? "CTA pill: 1-2 words ONLY (e.g. 'Try It', 'Start')." : "CTA pill: 2-4 words.";

  // Format-specific overrides on top of the size brief.
  let formatDirective: string;
  switch (format) {
    case "ads":
      formatDirective = "Conversion-first: every element earns its keep, headline ladders into the CTA, wordmark in a corner, decoration minimal. For micro/small ad units prefer flat brand-color blocks over orbs.";
      break;
    case "presentation":
      formatDirective = "Slide-grade: big editorial headline, generous negative space, one calm decorative orb behind, no CTA unless explicitly requested. Wordmark small in a corner.";
      break;
    case "email":
      formatDirective = "Inbox-readable: short headline, one supporting line, prominent CTA, wordmark left. Flat color blocks, soft gradients, NO heavy orbs. Safe contrast pairs only (#F8FAFC on #0B1426 or #0F172A on #F8FAFC).";
      break;
    case "social":
    default:
      formatDirective = "Scroll-stopping: thumb-stopper headline (question/claim/stat), eyebrow label on top, strong focal visual, dense brand color contrast.";
      break;
  }

  return {
    W, H, ratio: ratio.toFixed(3),
    orientation, tier, elementBudget,
    layout, headlineMin, headlineMax, sublineSize, padding,
    headlineWords, sublineRule, ctaRule, formatDirective,
    text: `# Canvas Brief (HARD CONSTRAINTS — obey these over your own taste)
- Dimensions: ${W}×${H}px (${orientation}, ratio ${ratio.toFixed(2)}, density tier: ${tier.toUpperCase()})
- Element budget: AT MOST ${elementBudget} distinct content blocks. Counted blocks: logo, eyebrow chip, headline, subline, focal visual, CTA, decorative orb, etc. Going over WILL break alignment.
- Layout pattern: ${layout}
- Edge padding: ${padding}px on all sides minimum. Nothing touches the canvas edge except orbs that bleed intentionally.
- Headline: ${headlineWords} words, font-size ${headlineMin}-${headlineMax}px, weight 800, tight leading.
- Subline: ${sublineRule}${sublineSize ? ` Font-size ${sublineSize}px.` : ""}
- CTA: ${ctaRule}
- Format directive: ${formatDirective}
- Anti-overlap rule: every element must have ≥${Math.max(8, Math.round(padding / 2))}px clear-space around it. If you can't fit everything with that gutter, REMOVE elements (start with decorative ones), don't shrink type below the min above.
- For tier MICRO and SMALL ad/banner units: do NOT specify icons inside CTAs, do NOT specify multi-row tile grids, do NOT specify bullet lists. They will not fit.`
  };
}

const POLISH_SYSTEM = `You are a senior brand designer at HighLevel. The user gives you a rough, vague idea for a marketing graphic. You rewrite it into a tight, vivid design brief that another designer (or design AI) could build from without asking questions.

Output rules:
- Return ONLY the polished prompt as plain text. No preamble, no headings, no markdown, no explanation, no quotes.
- Length: scale to the canvas. MICRO tier: 25-50 words. SMALL: 50-90 words. MEDIUM: 90-150 words. LARGE: 130-200 words.
- The Canvas Brief block in the user message is AUTHORITATIVE. Element budget, headline word count, layout pattern, padding, and font sizes from that brief override your defaults. NEVER exceed the element budget. NEVER specify a sub-element (icon-in-CTA, multi-tile grid, bullet list) that the brief explicitly forbids.
- Open the polished prompt by NAMING the canvas dimensions and orientation in plain English ("Banner 728×90, landscape strip" or "Square 1080×1080, social post" or "Tall 1080×1920, vertical story"). This is so the downstream renderer cannot miss the format.
- Cover: dimensions line, headline (in quotes), optional subline, visual focal point, composition pattern from the brief, color usage from HighLevel palette (Primary Blue #2896FB, Light Blue #7CC8FF, Deep Navy #0B1426, Yellow #FFC328, Green #00B2A9, Green #17D94B), accent treatments allowed at this density tier, and where the HighLevel wordmark sits.
- Match the energy of the user's idea — don't pad with corporate fluff. If the canvas is tiny, the polished brief is short. Don't write a 150-word paragraph for a 728×90.
- Do NOT list the format name as a label — just write the brief in that style.

When in doubt, REMOVE elements rather than cram. A clean micro-banner with logo + 4-word headline + CTA beats a cluttered one every time.`;

const REFINE_SYSTEM = `You are a senior brand designer at HighLevel making targeted, surgical edits to an existing marketing graphic. The user gives you the current HTML document, a single edit instruction, the canvas brief, and recent edit history. You return the FULL updated HTML document with the requested change applied — and nothing else changed.

# Internal process (think through these silently, then output the HTML)

## STEP 1 — Parse intent
Classify the instruction into one of these intent types (pick the BEST single fit):
- **RECOLOR**: change the color of a named element ("make the CTA blue", "headline in green", "swap green for yellow")
- **RETEXT**: change the words of a named element ("change headline to '...'", "rename CTA to 'Try Now'", "fix the typo in the subline")
- **RESIZE**: change the size/scale of a named element ("make the logo bigger", "smaller headline", "shrink the orb")
- **REPOSITION**: move a named element ("move CTA to bottom-right", "logo top-right", "center the headline")
- **ADD**: introduce a new element ("add a checkmark next to the headline", "add an arrow to the CTA", "add a small badge above the headline")
- **REMOVE**: delete a named element ("remove the orb", "no subline", "drop the eyebrow chip")
- **SWAP**: replace one element with another of the same role ("swap the lightning icon for a star", "use a calendar icon instead", "different background gradient")
- **RESTYLE**: change visual treatment without touching content ("rounder corners on the CTA", "thinner stroke on icons", "more padding around the headline")
- **VIBE**: ambiguous overall feel edit ("make it pop", "more premium", "less busy", "calmer", "more energy")

## STEP 2 — Locate target
Identify the EXACT element(s) the instruction names. Use, in order of preference:
1. Visible text content match (if the user names text, find that text in the DOM and target its parent)
2. Semantic role (the element acting as headline = the largest text; CTA = the pill/button; logo = the <img> with HighLevel src; eyebrow = the small uppercase chip at the top; orb = a div with a radial-gradient or blur background; etc.)
3. Position language ("top-right", "bottom") = elements with absolute positioning matching that corner, or the last/first child of the relevant flex/grid container
4. If multiple candidates exist and the instruction is unambiguous, pick the most prominent one (largest, most central, brightest).
If you genuinely cannot find the target, leave the document unchanged and add a single hidden HTML comment <!-- refine: target not found --> at the very end of <body>.

## STEP 3 — Mutate (smallest reasonable change)
- Apply the change to ONLY the located element(s) and their inline style/attributes.
- Do NOT touch siblings, ancestors, or the document scaffold unless strictly required (e.g. RESIZE that requires reflow of one parent's gap).
- For VIBE intents, pick ONE concrete tweak and apply it: bump the headline weight to 900, brighten the CTA glow, tighten the leading by 5%, swap a flat color block for a subtle gradient, raise contrast on the eyebrow chip. NEVER redesign.
- For ADD intents, place the new element where the user named (e.g. "next to the headline" = inline-flex sibling with 12-16px gap; "above the headline" = a row directly above in the same column). Reserve clear-space so it does not overlap.
- For ICON edits, you MUST use the approved icon library from the system rules — never freehand a <path d="...">. If the user names an icon not in the library, pick the closest approved one.

## STEP 4 — Validate before output
Walk through this checklist mentally. If any check fails, fix it before output:
- [ ] Document still starts with <!doctype html> and is a complete standalone HTML doc
- [ ] Root .canvas div still has the EXACT pixel width and height it had before (you must NEVER change canvas dimensions)
- [ ] All <img> src URLs are byte-for-byte identical to before (no placeholders, no rewrites). Count of <img> tags is preserved unless the user explicitly asked to add/remove an image
- [ ] All data-* attributes preserved exactly (especially data-ai-human="true")
- [ ] All colors are members of the HighLevel palette (snap any stray hex to the nearest palette color)
- [ ] No element overlaps another (no two text blocks share bounding boxes, no decorative orb covers text)
- [ ] No new external resources (only the existing Google Fonts <link> if already present)
- [ ] No filter / mix-blend-mode / mask / opacity<1 / backdrop-filter on the HighLevel logo or any of its ancestors
- [ ] The change you made matches the user's instruction. If it doesn't, redo step 3.

# Conflict resolution with edit history
You will be given recentEdits — a list of the most recent prior instructions in reverse-chronological order. The current instruction TAKES PRIORITY over prior ones if they conflict (e.g. prior edit said "make CTA green", current says "make CTA blue" → CTA becomes blue). Otherwise, preserve the effect of prior edits — do not silently undo them.

# Hard rules (NON-NEGOTIABLE)
1. Return ONLY a complete HTML document starting with <!doctype html>. NO prose, NO markdown fences, NO commentary, NO explanation of what you changed.
2. Apply the LITERAL request. "Add X" means X appears. "Remove X" means X is gone. "Make X red" means X is HighLevel's nearest red equivalent (#FFC328 yellow if no red exists in palette).
3. Preserve canvas dimensions, all <img> src URLs, all data-* attrs, all approved-palette colors, and overall composition. Mutate only what the user named.
4. Inline <style> only. No <script>. No external CSS. No external JS.
5. Output the full updated HTML now. Nothing else.

# HighLevel palette
- Primary Blue: #2896FB · Mid Blue: #0B6FD4 · Light Blue: #7CC8FF
- Green Bright: #17D94B · Green: #00B2A9
- Yellow: #FFC328
- Deep Navy: #0B1426 · Mid Navy: #122036 · Soft Navy: #1A2942
- Off-white: #F8FAFC · Slate Light: #E2E8F0 · Slate Mid: #94A3B8
- Charcoal: #0F172A · Charcoal Mid: #475569`;

const PROMPT_TYPES: Record<string, { label: string; archetype: string }> = {
  promo:        { label: "Promo / Sale",        archetype: "Loud promotional graphic. Eyebrow chip with the deal type, oversized discount/percent number as the focal element OR a bold benefit headline, big urgency CTA pill ('GET IT NOW', 'CLAIM DEAL'), expiry note ('Ends Friday', 'Today only'). Yellow + green energy, optional starburst or angled price tag." },
  stat:         { label: "Big Stat",            archetype: "Editorial stat card. One massive numeric value (with unit/percent) as the absolute hero — sized 25-40% of canvas height. Tiny grey overline above ('LAST QUARTER', 'CUSTOMERS REPORT'), short white headline below contextualizing it (max 8 words), optional thin attribution line. Calm composition, generous whitespace, one soft brand glow behind the number." },
  quote:        { label: "Customer Quote",      archetype: "Testimonial card. A large opening quote mark in HighLevel green, then a short customer pullquote (12-22 words) in semibold white serif-feeling type, attribution line below ('— Name, Role · Company'). Optional small photo or brand chip on the side. Calm navy background, single accent orb." },
  webinar:      { label: "Webinar / Event",     archetype: "Event invite. Eyebrow chip 'LIVE WEBINAR' or 'FREE EVENT', headline naming the event topic (5-9 words), date+time row with calendar icon and clock icon, host name + role, RSVP CTA pill. Optional speaker portrait or illustrative motif on the right." },
  launch:       { label: "Product Launch",      archetype: "Launch announcement. Eyebrow chip 'NEW' or 'JUST LAUNCHED' in green, product name as the headline, one-line benefit subline, focal product visual (screenshot, illustrated UI, or mascot), CTA pill 'See it' or 'Try free'. Energetic background with a green glow orb behind the product." },
  milestone:    { label: "Milestone",           archetype: "Celebratory milestone. Big numeric milestone (e.g. '10K Users', '1M Calls'), 'WE HIT' or 'CELEBRATING' eyebrow, short thank-you subline, confetti-style decorative dots OR star icon cluster, brand wordmark prominent. Yellow + green festive treatment." },
  tip:          { label: "Quick Tip / DYK",     archetype: "Did You Know / Tip card. Eyebrow chip 'DID YOU KNOW' or 'PRO TIP' with lightbulb icon, the fact/tip as the headline (8-14 words, framed as a useful insight), tiny supporting line, brand wordmark. Calm composition, single small accent visual." },
  caseStudy:    { label: "Case Study Win",      archetype: "Case study win. Customer name + industry as eyebrow, big result stat (e.g. '+312% pipeline'), short before→after row with old vs new values in struck-through grey vs bold green, short attribution. Editorial split layout." },
  comparison:   { label: "Before vs After",     archetype: "Before/After comparison. Two columns labeled BEFORE (grey, muted, X-icon) and AFTER (HighLevel green, check-icon), each listing 3-5 short bullet points contrasting the old way vs HighLevel way. Headline above frames the contrast ('Stop juggling tools. Run everything from one screen.'). CTA at bottom." },
  announcement: { label: "Announcement",        archetype: "News-style announcement. Eyebrow chip 'ANNOUNCEMENT' or 'JUST IN', headline stating the news plainly (8-14 words), one supporting line, brand wordmark, optional CTA 'Read more' or 'See details'. Editorial restraint — minimal decoration." },
  feature:      { label: "Feature Highlight",   archetype: "Feature spotlight. Eyebrow naming the feature category, headline naming the feature itself, 2-4 small benefit bullets each with a stroked icon and short label, brand wordmark, CTA. One focal visual (UI screenshot or stylized illustration) on the opposite side." },
  event:        { label: "Event Save-The-Date", archetype: "Save-the-date. Big date front and center (month + day in a stacked block), event name as headline, location/venue line with pin icon, host badge, optional QR-style brand chip. Tasteful editorial layout with one decorative orb." },
};

const SUGGEST_SYSTEM = `You are a senior brand designer at HighLevel. The user gives you a TYPE of graphic and an optional rough idea. You write a fully-specced design brief in the following STYLE — the same level of specificity a designer or design AI needs to build the graphic without asking questions.

# Output style (REQUIRED — match this exact tone)
- Open with the canvas dimensions and orientation in plain English (e.g. "Square 1080×1080. No human." or "Banner 728×90, landscape strip.")
- Write in declarative, instruction-tone prose. Short sentences. No marketing fluff. No explanation. No "this design will…".
- Spell out: top-left vs top-right vs center vs bottom placements; what each element contains (eyebrow, headline in quotes, subline, CTA label in quotes, visual focal point); concrete colors from the HighLevel palette by hex; concrete sizes (px or % of canvas); icon names from the approved library when relevant.
- Group by region: top, center, then bottom. Within each region, list elements in reading order.
- End with a one-line background description (gradient, glow orbs, grid texture, etc.).

# Output rules
- Return ONLY the brief as plain text. No preamble, no markdown headers, no bullet points unless the brief itself benefits from them. Use line breaks for paragraphs.
- HONOR the Canvas Brief block in the user message — element budget, headline word count, layout pattern are HARD constraints.
- HONOR the requested TYPE archetype the user provides — if they say "Big Stat", the brief MUST center on a giant numeric value, not a paragraph of marketing.
- If the user provides a rough idea, weave it into the brief (use their topic, their numbers, their angle). If they leave it blank, invent a sharp on-brand topic for the chosen type.
- Use HighLevel palette only: Primary Blue #2896FB, Light Blue #7CC8FF, Deep Navy #0B1426, Mid Navy #122036, Yellow #FFC328, Green Bright #17D94B, Green #00B2A9, Off-white #F8FAFC, Slate #94A3B8.
- Headline must be in quotes. CTA label must be in quotes. Other text (subline, eyebrow) doesn't need quotes.
- Never reference brands or products outside HighLevel. Never use emojis.

When in doubt, write the brief that YOU would want to read if you were the designer building this from scratch.`;

router.post("/suggest-prompt", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) return res.status(500).json({ error: "Anthropic integration is not configured" });

  const promptType = typeof req.body?.promptType === "string" ? req.body.promptType : "promo";
  const typeDef = PROMPT_TYPES[promptType] || PROMPT_TYPES.promo;
  const roughIdea = typeof req.body?.roughIdea === "string" ? req.body.roughIdea.trim() : "";
  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "1080x1080";
  const format = typeof req.body?.format === "string" ? req.body.format : "social";
  const includeLogo = !!req.body?.includeLogo;
  const includeHighly = !!req.body?.includeHighly;

  const brief = buildCanvasBrief(aspect, format);
  const userMsg = [
    `Type: ${typeDef.label}`,
    `Type archetype (the brief MUST follow this pattern): ${typeDef.archetype}`,
    "",
    brief.text,
    "",
    includeLogo ? "Include the HighLevel wordmark in a corner (top-left or top-right)." : "",
    includeHighly ? "Include the Highly mascot as a hero visual element." : "",
    "",
    roughIdea
      ? `Rough idea from the user (build the brief around this — use their topic, numbers, and angle):\n${roughIdea}`
      : `No rough idea provided. Invent a sharp on-brand topic that fits the ${typeDef.label} archetype and HighLevel's product (agency software: CRM, automations, AI voice, payments, booking, conversations, reporting).`,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SUGGEST_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const block = message.content[0];
    const text = (block && block.type === "text" ? block.text : "")
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    if (!text) return res.status(502).json({ error: "Empty response from Claude" });
    return res.json({ prompt: text, type: typeDef.label });
  } catch (err: any) {
    console.error("[suggest-prompt] error", err);
    return res.status(500).json({ error: err?.message || "Failed to suggest prompt" });
  }
});

const REFLOW_SYSTEM = `You are a senior brand designer at HighLevel. The user has an existing on-brand design and needs you to RESIZE / REFLOW it to a NEW canvas size while preserving content, brand, and identity. Your output must be PIXEL-PERFECT in alignment — sloppy reflows are the #1 failure mode you must avoid.

# Hard rules (NON-NEGOTIABLE)
1. Return ONLY a complete HTML document starting with <!doctype html>. NO prose, NO markdown fences, NO commentary.
2. The root .canvas div MUST have the EXACT new pixel width and height specified in the user message. Update both the .canvas inline style/CSS and any related declarations. The OLD dimensions are gone — overwrite them.
3. All <img> src URLs must be byte-for-byte identical to the original. All data-* attributes preserved exactly.
4. Use ONLY the HighLevel palette (snap any stray hex to the nearest palette color).
5. Inline <style> only. No <script>, no external CSS, no external JS.
6. The HighLevel logo and ALL its ancestors: NO filter / mix-blend-mode / mask / opacity<1 / backdrop-filter.

# Composition strategy by target aspect ratio
Pick the strategy whose ratio is closest to the new target.

## Square family (0.85 ≤ W/H ≤ 1.18) — e.g. 1080×1080, 1080×1350, 1080×1250
- SINGLE CENTERED COLUMN composition.
- Stack from top to bottom in this order: brand wordmark (corner) → eyebrow chip → headline → subline → CTA → optional decorative orb behind text (z-index 0, opacity ≤ 0.45).
- Text block: center-aligned horizontally OR left-aligned with a fixed left padding shared by all text rows.
- Outer canvas padding: 6-8% of the smaller dimension (e.g. 80px on 1080).

## Portrait / Story family (W/H < 0.85) — e.g. 1080×1920, 1080×1350 vertical
- VERTICAL THIRDS composition. Top 25% = brand wordmark + eyebrow. Middle 45% = headline + subline (vertically centered as a flex group). Bottom 30% = CTA + supporting visual.
- All text MUST be center-aligned horizontally (left-edge alignment looks unbalanced in tall formats).
- Hero visual moves to a band BELOW or ABOVE the headline, never beside it. If the original visual was an orb, scale it to ~30% of canvas width and position it behind/under the headline.
- Outer padding: 7-9% of width (e.g. 86px on 1080-wide).

## Landscape / Horizontal family (W/H > 1.18) — e.g. 1920×1080, 1500×500
- TWO-COLUMN composition. Left column 55-60% = text block (eyebrow → headline → subline → CTA, ALL left-aligned, ALL sharing the same left edge to within 1px). Right column 40-45% = hero visual centered vertically inside its column.
- Use CSS Grid with two columns or a single flex row with explicit width percentages — never absolute-position individual text elements.
- Brand wordmark sits in the top-left corner with the same inset as the outer padding.
- Outer padding: 4-6% of height (e.g. 60px on 1080-tall) on top/bottom; 5-6% of width on left/right.

# Pixel-perfect alignment rules (the source of bad reflows)
1. Every text element belonging to the same logical group (eyebrow, headline, subline, CTA caption) MUST share an identical x-axis edge. Achieve this by putting them in ONE container with consistent padding — DO NOT freehand absolute positions per element.
2. Use ONE root flex/grid container for the main composition. Use \`gap\` for spacing between siblings, never margin-top/margin-bottom hacks.
3. All gap, margin, and padding values MUST be multiples of 4px. Allowed scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128.
4. Outer canvas padding MUST be identical on left and right (and identical on top and bottom for landscape). Asymmetric padding is forbidden.
5. The CTA pill MUST have padding ≥ 14px vertical and ≥ 28px horizontal, border-radius matching the original.
6. Brand wordmark / logo, if present, sits in a canvas corner with inset = outer canvas padding (so it visually aligns with the text block edge).
7. NO element's bounding box may exceed the canvas. NO two elements may visually overlap. Decorative orbs are allowed BEHIND text only if their opacity ≤ 0.45 AND z-index < text's z-index.
8. Vertical centering: use \`display:flex; align-items:center; justify-content:center\` on the parent — NEVER fixed margin-top values like "margin-top: 320px".
9. The headline MUST fit on its line(s) without horizontal overflow. If the original headline overflows the new width at the chosen font size, drop ONE tier in the type scale (see below) before considering text edits.

# Type scale by canvas width (pick the right tier — do NOT keep the original size if the canvas shrank)
- Width ≥ 1600px: headline 96-128px, subline 28-36px, eyebrow 14-18px, CTA 18-22px
- Width 1080-1599px: headline 72-96px, subline 22-28px, eyebrow 13-16px, CTA 16-18px
- Width 720-1079px: headline 56-72px, subline 18-22px, eyebrow 12-14px, CTA 14-16px
- Width < 720px: headline 36-52px, subline 14-18px, eyebrow 10-12px, CTA 12-14px
If headline word count > 8, drop ONE tier. If > 14, drop TWO tiers.

# Content adaptation rules (in priority order)
1. Perfect alignment beats verbose copy. ALWAYS.
2. It is OK to SHORTEN the subline (drop adjectives, tighten phrasing) if it cannot fit on max 2 lines at the chosen tier.
3. It is OK to OMIT one secondary decorative element (one of two orbs, a small badge, a divider line) if including it forces overlap or overflow.
4. The headline copy stays VERBATIM unless dropping a single trailing adjective is the only way to fit it on max 2 lines. Never restructure or reword the headline.
5. NEVER clip text. NEVER letterbox the canvas. NEVER leave overlapping bounding boxes. NEVER output mis-aligned columns.

# Validation checklist (run mentally before output — fix anything that fails)
- [ ] .canvas width = NEW target width, height = NEW target height (exact pixels)
- [ ] No element's computed bounding box exceeds the canvas
- [ ] All text in the main column shares one x-edge anchor (left or center) within 1px
- [ ] All gaps/paddings/margins are 4px multiples
- [ ] Outer padding identical on left/right (and top/bottom in landscape)
- [ ] No overlap between text and decorative visuals (orb opacity ≤ 0.45 if behind text)
- [ ] All <img> src URLs preserved exactly, all data-* attrs preserved
- [ ] Palette colors only
- [ ] Headline fits on 1-2 lines at the chosen type tier

# HighLevel palette
- Primary Blue: #2896FB · Mid Blue: #0B6FD4 · Light Blue: #7CC8FF
- Green Bright: #17D94B · Green: #00B2A9
- Yellow: #FFC328
- Deep Navy: #0B1426 · Mid Navy: #122036 · Soft Navy: #1A2942
- Off-white: #F8FAFC · Slate Light: #E2E8F0 · Slate Mid: #94A3B8
- Charcoal: #0F172A · Charcoal Mid: #475569

Output the full reflowed HTML now. Nothing else.`;

router.post("/refine-design", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) return res.status(500).json({ error: "Anthropic integration is not configured" });

  const html = typeof req.body?.html === "string" ? req.body.html : "";
  const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.trim() : "";
  if (!html) return res.status(400).json({ error: "Current HTML is required" });
  if (!instruction) return res.status(400).json({ error: "Edit instruction is required" });

  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "";
  const format = typeof req.body?.format === "string" ? req.body.format : "social";
  const recentEdits: string[] = Array.isArray(req.body?.recentEdits)
    ? req.body.recentEdits.filter((s: any) => typeof s === "string").slice(0, 5)
    : [];
  const slideIndex = Number.isFinite(Number(req.body?.slideIndex)) ? Math.max(0, Math.round(Number(req.body.slideIndex))) : 0;
  const slideCount = Number.isFinite(Number(req.body?.slideCount)) ? Math.max(1, Math.round(Number(req.body.slideCount))) : 1;
  const mode = req.body?.mode === "reflow" ? "reflow" : "refine";
  const previousAspect = typeof req.body?.previousAspect === "string" ? req.body.previousAspect : "";

  // If aspect wasn't provided, try to read it off the .canvas div in the HTML.
  let resolvedAspect = aspect;
  if (!resolvedAspect) {
    const wMatch = html.match(/\.canvas[^{]*\{[^}]*width\s*:\s*(\d+)\s*px/i);
    const hMatch = html.match(/\.canvas[^{]*\{[^}]*height\s*:\s*(\d+)\s*px/i);
    if (wMatch && hMatch) resolvedAspect = `${wMatch[1]}x${hMatch[1]}`;
    else resolvedAspect = "1080x1080";
  }
  const refineBrief = buildCanvasBrief(resolvedAspect, format);

  // Pre-inventory invariants the model MUST preserve.
  const imgSrcs = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]);
  const dataAttrs = Array.from(html.matchAll(/(data-[a-z0-9-]+)=/gi)).map(m => m[1]);
  const uniqueDataAttrs = Array.from(new Set(dataAttrs));

  // Compute aspect family for reflow guidance.
  const newW = refineBrief.W;
  const newH = refineBrief.H;
  const ratio = newW / newH;
  const aspectFamily =
    ratio < 0.85 ? "PORTRAIT (vertical thirds composition, all text center-aligned)" :
    ratio > 1.18 ? "LANDSCAPE (two-column composition: text left, visual right, all text left-aligned, sharing one left edge)" :
    "SQUARE (single centered column, stack vertically)";
  const [pw, ph] = previousAspect.split("x").map(n => parseInt(n, 10));
  const previousFamilyNote = (pw && ph)
    ? `Previous canvas: ${pw}×${ph}px (ratio ${(pw / ph).toFixed(2)}). New canvas: ${newW}×${newH}px (ratio ${ratio.toFixed(2)}). The composition family is changing from ${pw / ph < 0.85 ? "portrait" : pw / ph > 1.18 ? "landscape" : "square"} to ${ratio < 0.85 ? "portrait" : ratio > 1.18 ? "landscape" : "square"} — REBUILD the layout, do not just stretch.`
    : "";

  const invariantBlock = mode === "reflow"
    ? `# Reflow target (THE NEW CANVAS DIMENSIONS — overwrite the old ones)
- NEW canvas dimensions: ${newW}×${newH}px (root .canvas MUST be exactly this size)
- Composition family: ${aspectFamily}
${previousFamilyNote ? "- " + previousFamilyNote : ""}
- Image src URLs to preserve EXACTLY (${imgSrcs.length} total): ${imgSrcs.length ? imgSrcs.map(s => s.length > 80 ? s.slice(0, 60) + "…[" + s.length + " chars]" : s).join(" | ") : "none"}
- data-* attributes to preserve EXACTLY: ${uniqueDataAttrs.length ? uniqueDataAttrs.join(", ") : "none"}
- The HighLevel logo <img> and ALL its ancestor elements: NO filter / mix-blend-mode / mask / opacity<1 / backdrop-filter`
    : `# Preservation invariants (MUST hold byte-for-byte)
- Canvas dimensions: ${refineBrief.W}×${refineBrief.H}px (do not change root .canvas width/height)
- Image src URLs to preserve EXACTLY (${imgSrcs.length} total): ${imgSrcs.length ? imgSrcs.map(s => s.length > 80 ? s.slice(0, 60) + "…[" + s.length + " chars]" : s).join(" | ") : "none"}
- data-* attributes to preserve EXACTLY: ${uniqueDataAttrs.length ? uniqueDataAttrs.join(", ") : "none"}
- The HighLevel logo <img> and ALL its ancestor elements: NO filter / mix-blend-mode / mask / opacity<1 / backdrop-filter`;

  const historyBlock = recentEdits.length
    ? `# Recent edit history (most recent first — preserve their effect unless the current instruction conflicts)
${recentEdits.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
    : "";

  const carouselBlock = slideCount > 1
    ? `# Carousel context
This is slide ${slideIndex + 1} of ${slideCount}. Apply the edit ONLY to this slide. Do not introduce slide numbering or markers that don't already exist here.`
    : "";

  const ALLOWED_MODELS = new Set(["claude-sonnet-4-6", "claude-opus-4-6", "claude-opus-4-7"]);
  const requestedModel = typeof req.body?.model === "string" ? req.body.model : "claude-sonnet-4-6";
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : "claude-sonnet-4-6";

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const userContent = [
      `Edit instruction: ${instruction}`,
      "",
      refineBrief.text,
      "",
      invariantBlock,
      historyBlock,
      carouselBlock,
      "",
      "Current HTML document (apply the edit above and return the full updated document — nothing else):",
      "",
      html,
    ].filter(Boolean).join("\n");

    const message = await client.messages.create({
      model,
      max_tokens: 16000,
      system: mode === "reflow" ? REFLOW_SYSTEM : REFINE_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });
    const block = message.content[0];
    let text = (block && block.type === "text" ? block.text : "").trim();
    text = text.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (!text || !/^<!doctype html/i.test(text)) {
      return res.status(502).json({ error: "Claude returned an invalid HTML document" });
    }
    return res.json({ html: text });
  } catch (err: any) {
    console.error("[refine-design] error", err);
    return res.status(500).json({ error: err?.message || "Failed to refine design" });
  }
});

router.post("/polish-prompt", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) return res.status(500).json({ error: "Anthropic integration is not configured" });

  const idea = typeof req.body?.idea === "string" ? req.body.idea.trim() : "";
  if (!idea) return res.status(400).json({ error: "Idea is required" });

  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "1200x630";
  const includeLogo = !!req.body?.includeLogo;
  const logoDescription = typeof req.body?.logoDescription === "string" ? req.body.logoDescription : "";
  const includeHighly = !!req.body?.includeHighly;
  const highlyPoseDescription = typeof req.body?.highlyPoseDescription === "string" ? req.body.highlyPoseDescription : "";
  const sceneName = typeof req.body?.sceneName === "string" ? req.body.sceneName : "";
  const sceneDescription = typeof req.body?.sceneDescription === "string" ? req.body.sceneDescription : "";
  const format = typeof req.body?.format === "string" ? req.body.format : "social";
  const slideCountP = Math.min(10, Math.max(1, Math.round(Number(req.body?.slideCount) || 1)));

  const brief = buildCanvasBrief(aspect, format);
  const userMsg = [
    `Format: ${format}.`,
    `Canvas: ${aspect}.`,
    "",
    brief.text,
    "",
    slideCountP > 1 ? `Carousel: ${slideCountP} cohesive slides (cover → content → CTA). Apply the brief to EACH slide individually.` : "",
    sceneDescription ? `Scene direction (${sceneName}): ${sceneDescription}` : "",
    includeLogo ? `Include the HighLevel logo in a corner — variant: ${logoDescription || "wordmark"}.` : "",
    includeHighly ? `Include the Highly mascot as a hero visual${highlyPoseDescription ? ` (pose: ${highlyPoseDescription})` : ""}.` : "",
    `\nRough idea:\n${idea}`,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: POLISH_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const block = message.content[0];
    const text = (block && block.type === "text" ? block.text : "")
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    if (!text) return res.status(502).json({ error: "Empty response from Claude" });
    return res.json({ prompt: text });
  } catch (err: any) {
    console.error("[polish-prompt] error", err);
    return res.status(500).json({ error: err?.message || "Failed to polish prompt" });
  }
});

router.post("/generate-human", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  const theme = typeof req.body?.theme === "string" ? req.body.theme.trim() : "";
  const slidePrompt = typeof req.body?.slidePrompt === "string" ? req.body.slidePrompt.trim() : "";
  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "1024x1024";
  const sceneName = typeof req.body?.sceneName === "string" ? req.body.sceneName : "";
  if (!theme && !slidePrompt) {
    return res.status(400).json({ error: "theme or slidePrompt is required" });
  }

  try {
    const { imagePrompt, description } = await buildHumanPromptAndDescription(baseUrl, apiKey, {
      theme: [theme, slidePrompt].filter(Boolean).join(" — "),
      sceneName,
      aspect,
    });
    const result = await generateImage(imagePrompt, "gemini-3-pro-image-preview");
    const dataUrl = `data:${result.mimeType || "image/png"};base64,${result.b64_json}`;
    return res.json({ image: dataUrl, description, prompt: imagePrompt });
  } catch (err: any) {
    console.error("[generate-human] image gen failed", err);
    return res.status(500).json({ error: err?.message || "Failed to generate human image" });
  }
});

router.post("/remove-human-bg", async (req, res) => {
  const dataUrl = typeof req.body?.image === "string" ? req.body.image : "";
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: "image must be a base64 data URL" });
  const mimeType = m[1] || "image/png";
  const b64 = m[2] || "";

  try {
    const result = await editImage(
      "Remove the background completely from this photo. Output the same person with full transparency outside the subject. Clean, sharp cutout edges around hair, shoulders, and clothing. Preserve all original lighting, skin tones, and details. Return a PNG with an alpha channel — no shadows, no halo, no remnants of the old background.",
      b64,
      mimeType,
      "gemini-2.5-flash-image",
    );
    return res.json({
      image: `data:${result.mimeType || "image/png"};base64,${result.b64_json}`,
    });
  } catch (err: any) {
    console.error("[remove-human-bg] failed", err);
    return res.status(500).json({ error: err?.message || "Background removal failed" });
  }
});

export default router;
