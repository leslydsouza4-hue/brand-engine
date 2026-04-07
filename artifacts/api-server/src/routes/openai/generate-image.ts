import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { generateImageBuffer, editImages } from "@workspace/integrations-openai-ai-server/image";
import { logger } from "../../lib/logger";

const router = Router();

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 5000;

const HIGHLY_ASSETS_DIR = path.resolve(
  process.cwd(),
  "../brand-engine/public/assets/highly"
);

const ALLOWED_HIGHLY_FILES: Record<string, string> = {
  "pointing-up": "highly-pointing-up.png",
  "pointing-left": "highly-pointing-left.png",
  "professor": "highly-professor.png",
  "heart-pointing": "highly-heart-eyes-pointing.png",
  "heart-laptop": "highly-heart-laptop.png",
  "happy-pointing": "highly-happy-pointing.png",
  "tablet": "highly-tablet.png",
  "money-eyes": "highly-money-eyes.png",
  "happy-hover": "highly-happy-hover.png",
  "heart-hover": "highly-heart-eyes-hover.png",
  "happy-laptop": "highly-happy-laptop.png",
  "thinking": "highly-thinking.png",
  "working": "highly-working.png",
  "waving": "highly-waving.png",
};

router.post("/generate-image", async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequestTime < MIN_INTERVAL_MS) {
      res.status(429).json({ error: "Please wait a few seconds between requests." });
      return;
    }
    lastRequestTime = now;

    const { prompt, size = "1024x1024", count = 1, highlyPoseId } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const validSizes = ["1024x1024", "1024x1536", "1536x1024"] as const;
    const resolvedSize = validSizes.includes(size) ? size : "1024x1024";
    const imageCount = Math.min(Math.max(Number(count) || 1, 1), 4);

    let referenceImagePath: string | null = null;
    if (highlyPoseId && typeof highlyPoseId === "string") {
      const filename = ALLOWED_HIGHLY_FILES[highlyPoseId];
      if (filename) {
        const fullPath = path.join(HIGHLY_ASSETS_DIR, filename);
        if (fs.existsSync(fullPath)) {
          referenceImagePath = fullPath;
          logger.info({ poseId: highlyPoseId, path: fullPath }, "Using Highly reference image");
        }
      }
    }

    logger.info({
      prompt: prompt.substring(0, 120),
      size: resolvedSize,
      count: imageCount,
      hasReference: !!referenceImagePath,
    }, "Generating images");

    if (referenceImagePath) {
      const promises = Array.from({ length: imageCount }, () =>
        editImages([referenceImagePath!], prompt)
      );
      const buffers = await Promise.all(promises);
      const images = buffers.map((buf) => buf.toString("base64"));
      res.json({ images });
    } else {
      const promises = Array.from({ length: imageCount }, () =>
        generateImageBuffer(prompt, resolvedSize)
      );
      const buffers = await Promise.all(promises);
      const images = buffers.map((buf) => buf.toString("base64"));
      res.json({ images });
    }
  } catch (err: any) {
    logger.error({ error: err.message }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

export default router;
