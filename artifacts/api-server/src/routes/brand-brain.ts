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

# How to format design output
When (and ONLY when) the user wants a visual design crafted:
1. Write a 1–2 sentence explanation of the strategic angle.
2. Output the brief inside this exact wrapper, on its own lines:
<design_brief>
Format: [square 1080x1080 / portrait 1080x1350 / story 1080x1920 / landscape 1920x1080]
Headline: "..."
Subline: "..."
CTA: "..." (or "none")
Visual direction: [one paragraph — composition, focal element, brand color usage, mood, type treatment]
Human in shot: [yes — describe the person in 1 sentence / no]
</design_brief>
3. After the wrapper, write 2–3 sentences explaining the choices.

The user's UI detects the <design_brief> wrapper and shows a "Send to Craft Magic" button that ships the brief into the design generator.

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
