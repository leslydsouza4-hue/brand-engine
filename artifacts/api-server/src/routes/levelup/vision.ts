import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

interface VisionTags {
  description: string;
  peopleCount: number | null;
  scene: string | null;
  mood: string | null;
  tags: string[];
  dominantColors: string[];
}

const SYSTEM = `You are an image-tagging assistant for a marketing photo library. Look at the image and return STRICT JSON with this exact shape:
{
  "description": "<one short sentence, 8-18 words>",
  "peopleCount": <integer 0-50 or null if not applicable>,
  "scene": "<one of: indoor, outdoor, stage, lounge, conference, party, dinner, workshop, panel, keynote, casual, studio, street, golf, rooftop, other>",
  "mood": "<one of: high-energy, focused, celebratory, intimate, hype, calm, professional, playful, candid>",
  "tags": ["<6-12 short keywords: people pose, attire, props, time of day, action, vibe>"],
  "dominantColors": ["<2-4 simple color words: navy, gold, teal, white, magenta, etc.>"]
}
Rules:
- Output ONLY the JSON object. No backticks, no commentary.
- Each tag is 1-3 words, lowercase, no punctuation.
- "peopleCount" is the number of distinct people clearly visible. Use null only when the image has nothing person-like.
- Choose values that would help a designer search "4 guys taking a selfie", "outdoor crowd at golden hour", "speaker on stage", etc.`;

async function tagImage(b64: string, mime: string): Promise<VisionTags> {
  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: b64, mimeType: mime } },
          { text: SYSTEM },
        ],
      },
    ],
  });
  const candidate = resp.candidates?.[0];
  const part = candidate?.content?.parts?.find((p: { text?: string }) => p.text);
  const txt = (part as { text?: string } | undefined)?.text?.trim() ?? "";
  // Strip code fences if the model added any.
  const cleaned = txt
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let json: VisionTags;
  try {
    json = JSON.parse(cleaned) as VisionTags;
  } catch {
    // Try to grab the first {...} block.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Vision model did not return JSON");
    json = JSON.parse(m[0]) as VisionTags;
  }
  return {
    description: String(json.description || ""),
    peopleCount: typeof json.peopleCount === "number" ? json.peopleCount : null,
    scene: json.scene ? String(json.scene).toLowerCase() : null,
    mood: json.mood ? String(json.mood).toLowerCase() : null,
    tags: Array.isArray(json.tags) ? json.tags.map((t) => String(t).toLowerCase()) : [],
    dominantColors: Array.isArray(json.dominantColors)
      ? json.dominantColors.map((c) => String(c).toLowerCase())
      : [],
  };
}

router.post("/levelup/vision/tag", async (req, res) => {
  const { imageUrl, b64, mimeType } = (req.body ?? {}) as { imageUrl?: string; b64?: string; mimeType?: string };
  let inputB64 = b64;
  let inputMime = mimeType || "image/jpeg";
  try {
    if (!inputB64 && imageUrl) {
      // SSRF guard: only allow our own Drive proxy. Reject any absolute URL
      // or any path that isn't /api/levelup/drive/image. This prevents the
      // server from being used to fetch arbitrary internal endpoints.
      if (!/^\/api\/levelup\/drive\/image(\?|$)/.test(imageUrl)) {
        res.status(400).json({ error: "imageUrl must be a relative /api/levelup/drive/image URL" });
        return;
      }
      const url = `http://localhost:${process.env.PORT || 8080}${imageUrl}`;
      const r = await fetch(url);
      if (!r.ok) {
        res.status(502).json({ error: `fetch image failed: ${r.status}` });
        return;
      }
      inputMime = r.headers.get("content-type") || inputMime;
      inputB64 = Buffer.from(await r.arrayBuffer()).toString("base64");
    }
    if (!inputB64) {
      res.status(400).json({ error: "imageUrl or b64 required" });
      return;
    }
    const tags = await tagImage(inputB64, inputMime);
    res.json(tags);
  } catch (err) {
    req.log.error({ err }, "vision tag failed");
    res.status(500).json({ error: (err as Error).message || "tagging failed" });
  }
});

// Smart-search interpreter — turns a natural-language brief into structured
// search criteria the client uses to filter the library. We use a small
// instruction prompt; falling back to client-side tokenisation if Gemini
// is unavailable.
router.post("/levelup/vision/parse-query", async (req, res) => {
  const { query } = (req.body ?? {}) as { query?: string };
  if (!query) {
    res.status(400).json({ error: "query required" });
    return;
  }
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Convert this search request into JSON: "${query}"
Return ONLY JSON with shape:
{ "peopleCount": <int|null>, "vibe": ["..."], "keywords": ["..."], "mood": <string|null>, "scene": <string|null> }
Rules: lowercase keywords, omit fluff words, pull explicit numbers if present. No backticks.`,
            },
          ],
        },
      ],
    });
    const cand = resp.candidates?.[0];
    const part = cand?.content?.parts?.find((p: { text?: string }) => p.text) as { text?: string } | undefined;
    const txt = (part?.text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
    const m = txt.match(/\{[\s\S]*\}/);
    res.json(m ? JSON.parse(m[0]) : { keywords: [], peopleCount: null, vibe: [], mood: null, scene: null });
  } catch (err) {
    req.log.error({ err }, "parse-query failed");
    res.json({ keywords: query.split(/\s+/), peopleCount: null, vibe: [], mood: null, scene: null });
  }
});

export default router;
