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
        system: `You write image-generation prompts for a state-of-the-art photoreal model (Google Imagen / Nano Banana Pro). Given a marketing graphic's theme, you write a SINGLE prompt for a high-quality professional photograph of a HUMAN that fits the theme.

Rules:
- The output is one paragraph, 60-120 words, no preamble, no markdown.
- Always describe: who the person is (age, gender, role; ethnicity should reflect a diverse pool), wardrobe matched to the brand vibe, expression, framing (close-up / mid / full body), camera and lens (e.g. "shot on Canon R5, 50mm, f/1.8"), lighting (warm, editorial, golden hour, studio softbox, etc.), background that matches the slide's scene/brand colors, and the overall mood.
- The brand context is HighLevel (modern SaaS, agency operators, founders): teal #5EE6DE, blue #2896FB, navy #0B1426, yellow #FFC328 accents. Wardrobe and palette should be tasteful and modern.
- The photo will be cut out and placed on a dark navy slide. STRONGLY PREFER one of these two background treatments (pick whichever fits the mood best):
  (A) A solid Deep Navy #0B1426 studio background OR a smooth dark gradient that matches the brand palette — so the subject blends seamlessly into the slide with no visible seam.
  (B) A clean, evenly lit subject against a plain neutral backdrop suitable for crisp background removal (clean edges around hair/shoulders, no busy environment, no harsh shadows on the floor or wall).
- Avoid messy interiors, cluttered desks, complex outdoor scenes, or props that compete with the subject.
- End with: "ultra high resolution, photorealistic, editorial quality, no logos, no text, no watermarks, clean background suitable for cutout".

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
    imagePrompt = `Editorial photograph of a confident modern professional matching this brief: ${ctx.theme}. Shot on Canon R5, 50mm, f/1.8, soft natural light, neutral wardrobe with subtle teal or blue accents, calm modern background. Ultra high resolution, photorealistic, editorial quality, no logos, no text, no watermarks.`;
    description = description || "Confident modern professional matching the brand theme";
  }
  return { imagePrompt, description };
}

const HIGHLEVEL_BRAND_SYSTEM = `You are a senior brand designer at HighLevel (also "GoHighLevel" / "GHL") shipping production-ready marketing graphics. You output a single, self-contained HTML document that renders a polished, perfectly aligned design for the user's prompt. The output should look like it came out of Figma from a top-tier in-house design team — never like a wireframe or a default Bootstrap page.

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
- Teal Bright: #5EE6DE (eyebrow text, active state, in-glow text)
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
- Eyebrow / kicker / "NEW" / "LIVE" labels: #5EE6DE (teal) or #FFC328 (yellow) — pick whichever fits the energy. Never generic gold, lime, mint, etc.
- Accent or highlighted words inside a headline: #2896FB or #FFC328. Never inline a custom color.
- CTA button text: #FFFFFF on the Primary Blue gradient, or #0B1426 on a yellow #FFC328 pill. Nothing else.
- Numbers / stats / big metric digits: #2896FB or #FFC328.
- DO NOT use rgba() with hue values outside this palette. Transparent overlays must be derived from these hex values only (e.g. rgba(40,150,251,0.3) is the rgb of #2896FB — that is allowed).

## Typography Scale (proportional to canvas height H)
- Hero headline: font-size ~ 0.13H, font-weight 800-900, letter-spacing -0.025em, line-height 0.95.
- Subhead: font-size ~ 0.045H, font-weight 600, letter-spacing 0, line-height 1.25, color #94A3B8.
- Eyebrow / kicker: font-size ~ 0.022H, font-weight 700, uppercase, letter-spacing 0.18em, color #5EE6DE or #FFC328.
- Body: font-size ~ 0.028H, font-weight 500, line-height 1.45.
- CTA pill text: font-size ~ 0.032H, font-weight 700.
- Always use 'Poppins' first, then system fallback.

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
  - Rim light / highlight edge: stroke or thin overlay in #2896FB or #5EE6DE at ~0.6 opacity.
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
- Middle slides are CONTENT: each focuses on ONE idea (a stat, a step, a benefit, a quote). Number them subtly in the corner ("02 / 05") in #5EE6DE 0.022H uppercase.
- Final slide is the CTA: clear call to action, big button, wordmark, optional handle/URL.
- Visual cohesion across slides: same background scene, same color story, same wordmark position, same typography scale. Vary the focal element (orb position, accent shape) so they feel like a story, not duplicates.
- Each slide is the EXACT same canvas dimensions specified.
- Do not number slides in their headlines; only the small corner counter.
- Output order: slide 1 first, then delimiter, then slide 2, etc. No prose anywhere.

# Output Rules (NON-NEGOTIABLE)
- Return ONLY a complete HTML document starting with <!doctype html>. NO prose, NO markdown fences, NO explanation, NO comments outside the HTML.
- Inline all CSS in a single <style> tag inside <head>. No external CSS, no scripts, no @import, no fonts that require network access.
- Use shaped <div> elements, CSS gradients, CSS shadows, SVG (inline) for icons, and text.
- <img> tags are ONLY allowed for asset URLs explicitly provided by the user in the "Required Assets" section of the message. NEVER hotlink any other image.
- If a HighLevel logo URL is provided, you MUST use that <img> rather than typing "HighLevel" as text in CSS.
- If a Highly mascot URL is provided, you MUST place that <img> as the hero visual.
- The <body> must contain a single root <div class="canvas"> with EXACT pixel width and height matching the requested aspect ratio. Set body { margin:0; background:#0B1426; display:flex; align-items:center; justify-content:center; min-height:100vh; } so the canvas centers in the viewport for preview.
- Set box-sizing: border-box on everything (* { box-sizing: border-box; margin: 0; padding: 0; }).
- Test mentally: would a designer at Linear, Stripe, or Vercel be okay with shipping this? If no, refine before outputting.`;

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
  const logoUrl = typeof req.body?.logoUrl === "string" ? req.body.logoUrl : "";
  const logoDescription = typeof req.body?.logoDescription === "string" ? req.body.logoDescription : "";
  const highlyUrl = typeof req.body?.highlyUrl === "string" ? req.body.highlyUrl : "";
  const highlyPoseDescription = typeof req.body?.highlyPoseDescription === "string" ? req.body.highlyPoseDescription : "";
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
- Do NOT recolor or filter the logo. Use the variant exactly as provided.
- Reserve a clear-space rectangle around it equal to ~half the logo height on every side. No text, orb, or other element may enter that rectangle.`);
  }
  // Auto-detect: prompt mentions a human → generate one with Nano Banana Pro.
  const wantsHuman = HUMAN_KEYWORDS.test(prompt);
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
- NEVER render the person as SVG — use the <img> tag with this exact src.`);
  }
  if (hasItem) {
    assetBlock.push(`User-supplied item / product image (REQUIRED — feature prominently):
<img src="${ITEM_PLACEHOLDER}" alt="Featured item" />
${itemDescription ? `Item description: ${itemDescription}` : ""}
- This is a real product/asset uploaded by the user. Treat it as a co-hero visual alongside any other focal element.
- Render with style="max-height: 50%; max-width: 45%; object-fit: contain; display: block;". Place it in the VISUAL zone of the slide, never overlapping headline text.
- Add a soft glow behind it: filter: drop-shadow(0 8px 30px rgba(40,150,251,0.35));
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
    return `- Slide 1: COVER (hook headline + eyebrow + "Swipe →" hint).\n- Slides 2 through ${slideCount - 1}: CONTENT (one idea each, with a small \"NN / ${String(slideCount).padStart(2, "0")}\" counter in #5EE6DE in a corner).\n- Slide ${slideCount}: CTA (call to action + button + wordmark).`;
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

  const userContent = [
    `Canvas size: ${aspect} pixels (width × height). The root container MUST be exactly these dimensions.`,
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
      if (humanDataUrl) out = out.split(HUMAN_PLACEHOLDER).join(humanDataUrl);
      return out;
    });

    return res.json({
      html: finalSlides[0],
      slides: finalSlides,
      humanGenerated: !!humanDataUrl,
      humanDescription: humanDescription || undefined,
    });
  } catch (err: any) {
    console.error("[claude-design] error", err);
    return res.status(500).json({ error: err?.message || "Failed to generate design" });
  }
});

const POLISH_SYSTEM = `You are a senior brand designer at HighLevel. The user gives you a rough, vague idea for a marketing graphic. You rewrite it into a tight, vivid design brief that another designer (or design AI) could build from without asking questions.

Output rules:
- Return ONLY the polished prompt as plain text. No preamble, no headings, no markdown, no explanation, no quotes.
- 80-160 words, written as a confident creative direction (not a question).
- Cover: headline (in quotes, 3-8 words, punchy), optional subline, visual focal point, composition, color usage from HighLevel palette (Primary Blue #2896FB, Light Blue #7CC8FF, Deep Navy #0B1426, Yellow #FFC328, Green #00B2A9, Teal #5EE6DE), accent treatments (orbs/chips/badges), and where the HighLevel wordmark sits.
- Match the energy of the user's idea — don't pad with corporate fluff.
- Tailor density to the canvas size: tiny banners get a single-line hook + logo + CTA only.

# Format-specific direction (apply rules for the given format)
- **social**: Hook-driven. The headline is a thumb-stopper — a question, claim, or bold stat. Eyebrow-style category label on top. Strong focal visual (orb/illustrated subject/chip cluster). Dense color contrast. If the size is portrait or square, stack vertically; if landscape (1200×628), split 60/40. Always mention "scroll-stopping" energy.
- **ads**: Conversion-first. Single benefit headline (5-7 words), sharp CTA pill ("Start Free", "Try It", "See Demo"), wordmark in a corner, minimal decoration so the eye lands on the CTA. For tiny units (728×90, 300×250) prescribe a one-line hook + CTA only — no subline.
- **presentation**: Slide-grade composition. Big editorial hero headline (8-12 words is fine), generous negative space, calm decorative orb behind, readable subline below. Wordmark small in a corner. Suggest a single supporting visual element on the opposite side. Avoid CTAs unless explicitly requested — presentations don't sell, they explain.
- **email**: Inbox-readable on small screens. Short headline (3-6 words), one supporting line, prominent CTA pill, wordmark left. Decorative treatment minimal — flat color blocks, soft gradients, no heavy orbs. Specify safe text contrast (#F8FAFC on #0B1426 or #0F172A on #F8FAFC). Email graphics often render as static images, so call out alt-text-friendly composition.

Pick the rules matching the user-provided format and lean into them. Do not list the format name in the output — just write the brief in that style.`;

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

  const userMsg = [
    `Format: ${format}.`,
    `Canvas: ${aspect}.`,
    slideCountP > 1 ? `Carousel: ${slideCountP} cohesive slides (cover → content → CTA).` : "",
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
