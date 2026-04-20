import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

type ChatRole = "user" | "assistant";

// Content blocks the frontend can send. We accept a permissive shape and re-validate.
type IncomingBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string } // base64 (no data:URL prefix)
  | { type: "document"; mediaType: string; data: string; name?: string }; // PDF base64

interface IncomingMessage {
  role: ChatRole;
  content: string | IncomingBlock[];
}

const SYSTEM_PROMPT = `You are Brand Brain — the in-house strategic AI inside HighLevel's Brand Engine. You think with the rigor of a senior brand strategist and the warmth of a creative director who actually ships.

# Who you serve
HighLevel marketers, founders, and operators. They want fast, sharp, on-brand thinking — not corporate fluff.

# What you do
- Answer ANY question the user asks: brand strategy, copy, positioning, campaign ideas, audience analysis, messaging frameworks, competitor takes, naming, taglines, scripts, social hooks, email angles, launch plans, value props, objections, etc.
- The user can attach images, PDFs, text/markdown/csv files, and Google Docs (the system pre-fetches Google Doc text and injects it into the message — treat it as fully ingested context). Read, analyze, and reference everything they share.
- When users share brand context (visual styles, voice notes, brand guidelines), ingest it and use it to shape every answer that follows in the conversation.
- When the user wants a graphic, social post, promo, thumbnail, banner, email header, or anything visual — craft a complete design brief AND a one-paragraph plain-English explanation of WHY it works.

# HighLevel brand defaults (use unless overridden by the user's shared brand context)
- Voice: confident, plainspoken, founder-to-founder. No jargon. No hype.
- Colors: navy #0B1426, blue #2896FB, green #17D94B, yellow #FFC328, white.
- Typography: bold sans-serif headlines (think Inter Tight / Geist), generous whitespace.
- Aesthetic: modern SaaS, editorial, Apple keynote calm. NOT busy, NOT clipart.

# How to format design output (asset sets)
The user's workflow is: ask Brand Brain for a design → Brand Brain proposes ONE concept → user picks formats (Square 1:1, Portrait 9:16, Horizontal 1.91:1) → the system generates that concept in every selected format in parallel.

So when (and ONLY when) the user wants a visual design crafted:
1. Write a 1–2 sentence explanation of the strategic angle and WHY it works given the brand context they've shared (cite specific things from their docs/images if relevant).
2. Output ONE concept inside this exact wrapper. EVERY field is required and must be FILLED IN — no placeholders, no "TBD". Be a senior art director: think in full layouts, not vague ideas.
<asset_set_request>
Concept: [one tight sentence describing the creative idea]
Headline: "..." (5–8 words MAX, punchy, scannable in 0.4 seconds)
Subline: "..." (8–14 words, or "none")
CTA: "..." (2–4 words like "Start Free Trial" or "none")
Visual direction: [3–5 sentences. Describe the FULL composition that fills the entire canvas with no dead space. Specify: focal element and where it sits, how the supporting graphics anchor the OPPOSITE side (e.g. dashboard mockup, screenshot, abstract gradient orb, product UI — never empty), exact brand color usage (which navy/blue/green/yellow goes where), type treatment (size hierarchy, accent color on a key word). Use the full canvas. NEVER leave half the frame empty.]
Human in shot: [yes — describe the person, pose, wardrobe, lighting in 1 sentence / no]
Supporting graphics: [what fills the OPPOSITE side from the headline so the canvas is balanced — required even when "Human in shot: yes". Examples: "HighLevel dashboard UI tilted 8°", "stack of feature cards floating", "abstract gradient orb with orbiting tag pills"]
Suggested formats: [comma-separated subset of: square, portrait, horizontal — recommend based on where the user said this would run; default to all three if unclear]
</asset_set_request>
3. After the wrapper, write 1–2 sentences explaining "Here's why this works for [their brand]." The UI will render an interactive picker letting the user toggle which formats to ship and click Generate.

CRITICAL composition rules baked into every brief:
- The canvas is NEVER half-empty. If the headline/human takes one side, supporting graphics MUST fill the other side.
- Type hierarchy: ONE hero word in accent color (#2896FB or #17D94B), the rest white/navy.
- Always include the HighLevel wordmark in a corner.
- Always include the CTA as a real button, not just text — pill-shaped, brand color.

NEVER produce more than ONE <asset_set_request> per response. If the user wants distinct creative directions, ask which one to ship first.

# Conversational rules
- Be direct. Lead with the answer, then justify briefly.
- Use short paragraphs and tight bullets. Bold the verbs that matter.
- NEVER say you "can't open" or "can't access" a Google Doc, file, or image — if the user shared it, the content is in your context. Just read it and respond.
- When you don't know something factual, say so and ask one targeted clarifying question.
- Never produce more than ONE design brief per response. If the user wants variations, ask which direction to ship first.
- Never invent product features or pricing for HighLevel — stick to what the user provides or general SaaS truths.
- Markdown is fine: **bold**, *italic*, lists, \`inline code\`. Keep it minimal.`;

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

function normalizeContent(content: string | IncomingBlock[]): any {
  if (typeof content === "string") {
    return content.slice(0, 200000);
  }
  const out: any[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "text" && typeof block.text === "string") {
      out.push({ type: "text", text: block.text.slice(0, 200000) });
    } else if (block.type === "image" && typeof block.data === "string" && ALLOWED_IMAGE_TYPES.has(block.mediaType)) {
      out.push({
        type: "image",
        source: { type: "base64", media_type: block.mediaType === "image/jpg" ? "image/jpeg" : block.mediaType, data: block.data },
      });
    } else if (block.type === "document" && typeof block.data === "string" && block.mediaType === "application/pdf") {
      out.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: block.data },
      });
    }
  }
  return out.length > 0 ? out : [{ type: "text", text: "(empty message)" }];
}

router.post("/brand-brain", async (req, res) => {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "Anthropic integration is not configured" });
  }

  try {
    const messagesIn = (req.body?.messages ?? []) as IncomingMessage[];
    if (!Array.isArray(messagesIn) || messagesIn.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }
    const cleaned = messagesIn
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: normalizeContent(m.content) }))
      .slice(-30);

    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
      return res.status(400).json({ error: "last message must be from user" });
    }

    const ALLOWED_MODELS = new Set(["claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6"]);
    const requested = typeof req.body?.model === "string" ? req.body.model : "claude-opus-4-7";
    const model = ALLOWED_MODELS.has(requested) ? requested : "claude-opus-4-7";

    const client = new Anthropic({ baseURL: baseUrl, apiKey });
    const message = await client.messages.create({
      model,
      max_tokens: 2400,
      system: SYSTEM_PROMPT,
      messages: cleaned as any,
    });

    const text = message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    res.json({ text, model });
  } catch (err: any) {
    console.error("[brand-brain] error", err);
    res.status(500).json({ error: err?.message || "Brand Brain failed" });
  }
});

export default router;
