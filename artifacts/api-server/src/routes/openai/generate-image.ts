import { Router } from "express";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { logger } from "../../lib/logger";

const router = Router();

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 5000;

router.post("/generate-image", async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequestTime < MIN_INTERVAL_MS) {
      res.status(429).json({ error: "Please wait a few seconds between requests." });
      return;
    }
    lastRequestTime = now;

    const { prompt, size = "1024x1024", count = 1 } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const validSizes = ["1024x1024", "1024x1536", "1536x1024"] as const;
    const resolvedSize = validSizes.includes(size) ? size : "1024x1024";

    const imageCount = Math.min(Math.max(Number(count) || 1, 1), 4);

    logger.info({ prompt: prompt.substring(0, 100), size: resolvedSize, count: imageCount }, "Generating images");

    const promises = Array.from({ length: imageCount }, () =>
      generateImageBuffer(prompt, resolvedSize)
    );

    const buffers = await Promise.all(promises);
    const images = buffers.map((buf) => buf.toString("base64"));

    res.json({ images });
  } catch (err: any) {
    logger.error({ error: err.message }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

export default router;
