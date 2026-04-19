import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const HIGHLEVEL_BRAND_SYSTEM = `You are a brand-aligned design generator for HighLevel (also called "GoHighLevel" or "GHL"). You output a single, self-contained HTML document that renders a clean marketing design for the user's prompt.

# HighLevel Brand Guidelines

## Brand Voice
- Confident, modern, founder-friendly. Direct and outcome-focused.
- Punchy hook headlines (5-10 words). Plain-English supporting copy.
- Avoid corporate jargon and overused AI words.

## Color Palette (use these exact hex values)
- Primary Blue: #2896FB (Nurture / capture flows, primary CTAs)
- Light Blue: #7CC8FF (accents, glows)
- Deep Navy: #0B1426 (dark backgrounds)
- Mid Navy: #122036 (card surfaces on dark)
- Yellow: #FFC328 (Capture / attention accents)
- Green: #00B2A9 (Close / success)
- Off-white: #F8FAFC (light surface)
- Slate Text: #E2E8F0 / #94A3B8 (on dark)
- Charcoal Text: #0F172A / #475569 (on light)

## Typography
- Headlines: 'Poppins', 700-900 weight, tight letter-spacing (-0.02em), uppercase or sentence case.
- Body: 'Poppins' or system-ui, 400-500 weight.
- Use a clear hierarchy: big headline, supporting line, single CTA.

## Visual Style
- Soft glows around feature shapes: radial-gradient(rgba(40,150,251,0.4) -> transparent) with blur.
- Subtle drop shadows: 0 12px 30px rgba(0,0,0,0.5).
- Rounded corners: 12px-24px.
- Solid color or gradient backgrounds. No noisy textures.
- Generous whitespace. Don't crowd.

## Layout Defaults
- Use a single root <div> sized 1200x630 (or whatever ratio the user requests) with overflow:hidden.
- Center key content. Use flex/grid.
- Always include the HighLevel mark area as a small "HighLevel" wordmark in Poppins 700 in a corner (top-left or bottom-left), color #FFFFFF on dark / #0F172A on light.

# Output Rules
- Return ONLY a complete HTML document starting with <!doctype html>. NO prose, NO markdown fences, NO explanation.
- Inline all CSS in a single <style> tag. No external assets, no images, no scripts, no fonts that require network access (use system fallbacks: font-family: 'Poppins', system-ui, -apple-system, sans-serif).
- The <body> must contain a single root container with explicit pixel width and height matching the requested aspect ratio (default 1200x630 if unspecified).
- Body background: #0B1426. The design itself controls its own colors.
- Make it look like a polished HighLevel marketing graphic, not a wireframe.`;

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

  try {
    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: HIGHLEVEL_BRAND_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Aspect ratio: ${aspect}\n\nDesign request:\n${prompt}`,
        },
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

export default router;
