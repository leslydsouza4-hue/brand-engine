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

// Nano Banana Pro (gemini-3-pro-image-preview) is the high-quality default.
// gemini-2.5-flash-image ("Nano Banana 2") is only used if explicitly requested.
const DEFAULT_MODEL: GeminiImageModel = "gemini-3-pro-image-preview";

// Aspect ratios Nano Banana Pro supports natively.
const SUPPORTED_RATIOS: { label: string; value: number }[] = [
  { label: "1:1", value: 1 },
  { label: "2:3", value: 2 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "4:5", value: 4 / 5 },
  { label: "5:4", value: 5 / 4 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
  { label: "21:9", value: 21 / 9 },
];

function nearestAspectRatio(width?: number, height?: number): string | undefined {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    (width as number) <= 0 ||
    (height as number) <= 0
  ) {
    return undefined;
  }
  const target = (width as number) / (height as number);
  let best = SUPPORTED_RATIOS[0];
  let bestDiff = Infinity;
  for (const r of SUPPORTED_RATIOS) {
    const diff = Math.abs(r.value - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  }
  return best.label;
}

router.post("/summer/generate-image", async (req, res) => {
  const { themeId, prompt, orientation, model, width, height } = (req.body ?? {}) as {
    themeId?: string;
    prompt?: string;
    orientation?: string;
    model?: string;
    width?: number;
    height?: number;
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
    : DEFAULT_MODEL;

  // Only Nano Banana Pro reliably honors imageConfig.aspectRatio; skip it for
  // the flash model so an unsupported ratio can't fail the request.
  const aspectRatio =
    chosenModel === "gemini-3-pro-image-preview" ? nearestAspectRatio(width, height) : undefined;
  const orient = orientation ? `${orientation}. ` : "";
  const fullPrompt =
    `Professional marketing campaign background image, no text or graphic overlays. ` +
    `Subject: ${subject}. ` +
    `${orient}` +
    `Visual style: ${theme.style}. ` +
    `Photorealistic, high-end editorial photography, natural lighting, realistic textures, ` +
    `sharp focus, full-bleed composition with room for text overlay. ` +
    `Avoid an obviously AI-generated or illustrated look. ` +
    `Do not include any of the following: ${theme.avoid}.`;

  try {
    const result = await generateImage(fullPrompt, chosenModel, aspectRatio ? { aspectRatio } : undefined);
    const dataUrl = `data:${result.mimeType};base64,${result.b64_json}`;
    res.json({ dataUrl, model: chosenModel, aspectRatio });
  } catch (err) {
    req.log.error({ err }, "summer generate-image failed");
    res.status(500).json({ error: (err as Error).message || "image generation failed" });
  }
});

export default router;
