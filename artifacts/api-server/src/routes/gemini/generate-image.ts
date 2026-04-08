import { Router } from "express";
import { generateImage, type GeminiImageModel } from "@workspace/integrations-gemini-ai/image";
import { logger } from "../../lib/logger";

const router = Router();

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 5000;

const VALID_MODELS: GeminiImageModel[] = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
];

router.post("/generate-image", async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequestTime < MIN_INTERVAL_MS) {
      res.status(429).json({ error: "Please wait a few seconds between requests." });
      return;
    }
    lastRequestTime = now;

    const { prompt, count = 1, model = "gemini-2.5-flash-image" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const resolvedModel: GeminiImageModel = VALID_MODELS.includes(model) ? model : "gemini-2.5-flash-image";
    const imageCount = Math.min(Math.max(Number(count) || 1, 1), 4);

    logger.info({
      prompt: prompt.substring(0, 120),
      model: resolvedModel,
      count: imageCount,
    }, "Generating images with Gemini");

    const promises = Array.from({ length: imageCount }, () =>
      generateImage(prompt, resolvedModel)
    );
    const results = await Promise.all(promises);
    const images = results.map((r) => r.b64_json);

    res.json({ images });
  } catch (err: any) {
    logger.error({ error: err.message }, "Gemini image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

export default router;
