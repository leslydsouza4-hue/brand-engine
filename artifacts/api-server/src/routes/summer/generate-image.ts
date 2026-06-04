import { Router, type IRouter } from "express";
import { generateImage, type GeminiImageModel } from "@workspace/integrations-gemini-ai/image";

const router: IRouter = Router();

// Per-theme visual style rules. The frontend only sends a subject + theme id;
// the server locks the style so all generated imagery stays on-brand.
const THEME_STYLE: Record<string, { style: string; avoid: string }> = {
  "sun-drunk": {
    style:
      "hazy golden-hour sunlight, warm sand and cream tones, relaxed coastal luxury, soft film grain, dreamy sun flare, gentle shallow depth of field, editorial vacation lifestyle, calm and unhurried",
    avoid: "text, watermark, logos, harsh neon, dark moody shadows",
  },
  electric: {
    style:
      "electric blue and cyan neon lighting, high-speed motion blur, glowing light trails, futuristic AI energy, dark cinematic background, high contrast, sleek and high-tech, sparks of light",
    avoid: "text, watermark, logos, warm beige tones, flat daylight",
  },
  feral: {
    style:
      "bold and untamed, intense high-contrast lighting, dark moody emotional tone, dramatic deep shadows, gritty cinematic atmosphere, raw and powerful, fierce energy, muted palette with a single blood-red accent",
    avoid: "text, watermark, logos, pastel colors, soft cheerful lighting",
  },
};

const ALLOWED_MODELS: GeminiImageModel[] = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"];

router.post("/summer/generate-image", async (req, res) => {
  const { themeId, prompt, orientation, model } = (req.body ?? {}) as {
    themeId?: string;
    prompt?: string;
    orientation?: string;
    model?: string;
  };

  const subject = (prompt ?? "").trim();
  if (!subject) {
    res.status(400).json({ error: "prompt required" });
    return;
  }
  const theme = themeId ? THEME_STYLE[themeId] : undefined;
  if (!theme) {
    res.status(400).json({ error: "valid themeId required" });
    return;
  }

  const chosenModel: GeminiImageModel = ALLOWED_MODELS.includes(model as GeminiImageModel)
    ? (model as GeminiImageModel)
    : "gemini-2.5-flash-image";

  const orient = orientation ? `${orientation}. ` : "";
  const fullPrompt =
    `Marketing campaign background image. Subject: ${subject}. ` +
    `${orient}` +
    `Visual style: ${theme.style}. ` +
    `High quality, professional, photographic. ` +
    `Do not include any of the following: ${theme.avoid}.`;

  try {
    const result = await generateImage(fullPrompt, chosenModel);
    const dataUrl = `data:${result.mimeType};base64,${result.b64_json}`;
    res.json({ dataUrl, model: chosenModel });
  } catch (err) {
    req.log.error({ err }, "summer generate-image failed");
    res.status(500).json({ error: (err as Error).message || "image generation failed" });
  }
});

export default router;
