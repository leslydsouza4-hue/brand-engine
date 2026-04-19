import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const HIGHLEVEL_BRAND_SYSTEM = `You are a senior brand designer at HighLevel (also "GoHighLevel" / "GHL") shipping production-ready marketing graphics. You output a single, self-contained HTML document that renders a polished, perfectly aligned design for the user's prompt. The output should look like it came out of Figma from a top-tier in-house design team — never like a wireframe or a default Bootstrap page.

# HighLevel Brand Guidelines

## Brand Voice
- Confident, modern, founder-friendly. Direct and outcome-focused.
- Punchy hook headlines (3-8 words). Plain-English supporting copy.
- Avoid corporate jargon and overused AI words.

## Color Palette (use these exact hex values, never invent new ones)
- Primary Blue: #2896FB (capture flows, primary CTAs, hero glows)
- Light Blue: #7CC8FF (accents, gradient stops)
- Deep Navy: #0B1426 (page background)
- Mid Navy: #122036 (card surface on dark)
- Soft Navy: #1A2942 (raised surface, hover state)
- Yellow: #FFC328 (attention accents, NEW badges)
- Green: #00B2A9 (success, "Close" stage)
- Off-white: #F8FAFC (light surface)
- Slate Text: #E2E8F0 (primary text on dark) / #94A3B8 (secondary on dark)
- Charcoal Text: #0F172A (primary on light) / #475569 (secondary on light)

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
  const highlyUrl = typeof req.body?.highlyUrl === "string" ? req.body.highlyUrl : "";
  const highlyPoseDescription = typeof req.body?.highlyPoseDescription === "string" ? req.body.highlyPoseDescription : "";

  const ALLOWED_MODELS = new Set([
    "claude-sonnet-4-6",
    "claude-opus-4-6",
    "claude-opus-4-7",
  ]);
  const requestedModel = typeof req.body?.model === "string" ? req.body.model : "claude-sonnet-4-6";
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : "claude-sonnet-4-6";

  const assetBlock: string[] = [];
  if (logoUrl) {
    assetBlock.push(`HighLevel logo (REQUIRED — use this exact URL in an <img> tag, do NOT type the wordmark in CSS):
<img src="${logoUrl}" alt="HighLevel" style="height: 0.06H; width: auto; display:block;" />
Place it in the top-left or bottom-left corner with the same 6% padding as the rest of the canvas. On extremely small banners (height < 120px) you may shrink to height: 18-22px.`);
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
  const userContent = [
    `Canvas size: ${aspect} pixels (width × height). The root container MUST be exactly these dimensions.`,
    assetBlock.length ? `\n# Required Assets\n${assetBlock.join("\n\n")}` : "",
    `\n# Design Request\n${prompt}`,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model,
      max_tokens: 8192,
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

    return res.json({ html: cleaned });
  } catch (err: any) {
    console.error("[claude-design] error", err);
    return res.status(500).json({ error: err?.message || "Failed to generate design" });
  }
});

const POLISH_SYSTEM = `You are a senior brand designer at HighLevel. The user gives you a rough, vague idea for a marketing graphic. You rewrite it into a tight, vivid design brief that another designer (or design AI) could build from without asking questions.

Output rules:
- Return ONLY the polished prompt as plain text. No preamble, no headings, no markdown, no explanation, no quotes.
- 90-160 words, written as a confident creative direction (not a question).
- Cover: headline (in quotes, 3-8 words, punchy), optional subline, visual focal point, composition, color usage from HighLevel palette (Primary Blue #2896FB, Light Blue #7CC8FF, Deep Navy #0B1426, Yellow #FFC328, Green #00B2A9), accent treatments (orbs/chips/badges), and where the HighLevel wordmark sits.
- Match the energy of the user's idea — don't pad with corporate fluff.
- Tailor density to the canvas size: tiny banners get a single-line hook + logo + CTA only.`;

router.post("/polish-prompt", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) return res.status(500).json({ error: "Anthropic integration is not configured" });

  const idea = typeof req.body?.idea === "string" ? req.body.idea.trim() : "";
  if (!idea) return res.status(400).json({ error: "Idea is required" });

  const aspect = typeof req.body?.aspect === "string" ? req.body.aspect : "1200x630";
  const includeLogo = !!req.body?.includeLogo;
  const includeHighly = !!req.body?.includeHighly;
  const highlyPoseDescription = typeof req.body?.highlyPoseDescription === "string" ? req.body.highlyPoseDescription : "";

  const userMsg = [
    `Canvas: ${aspect}.`,
    includeLogo ? "Include the HighLevel wordmark logo in a corner." : "",
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

export default router;
