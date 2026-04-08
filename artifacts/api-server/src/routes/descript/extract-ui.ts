import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import https from "node:https";
import http from "node:http";

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const parsed = new URL(reqUrl);
      const mod = parsed.protocol === "https:" ? https : http;
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandEngine/1.0)" },
        maxHeaderSize: 65536,
      };
      const req = mod.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
          res.resume();
          return doRequest(next, redirects + 1);
        }
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
      req.on("error", reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.end();
    };
    doRequest(url);
  });
}

const router = Router();

router.post("/descript/extract-ui", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== "string") {
      res.status(400).json({ error: "Missing imageUrl" });
      return;
    }

    const imageBuffer = await fetchImageBuffer(imageUrl);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageUrl.includes(".png") ? "image/png" : "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: `This is a video thumbnail that typically contains a UI screenshot or screen recording area showing a software interface/dashboard, often alongside a person.

Your task: Find the rectangular area that contains the software UI/screen recording (NOT the person, NOT the background — just the software screen/dashboard area).

Return ONLY a JSON object with the bounding box as percentages of the full image dimensions:
{"x": <left edge %>, "y": <top edge %>, "w": <width %>, "h": <height %>, "found": true}

If no clear UI/software screenshot area is visible, return:
{"found": false}

Rules:
- x, y, w, h should be percentages (0-100) of the image dimensions
- Include a small padding (1-2%) around the UI area
- The UI area is typically a rectangular screen/monitor/dashboard view
- Return ONLY valid JSON, no markdown, no explanation`,
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.json({ found: false });
      return;
    }

    const bbox = JSON.parse(jsonMatch[0]);
    if (!bbox.found) {
      res.json({ found: false });
      return;
    }

    res.json({
      found: true,
      bbox: {
        x: Math.max(0, Math.min(100, bbox.x)),
        y: Math.max(0, Math.min(100, bbox.y)),
        w: Math.max(5, Math.min(100, bbox.w)),
        h: Math.max(5, Math.min(100, bbox.h)),
      },
      fullImageBase64: `data:${mimeType};base64,${base64Image}`,
    });
  } catch (err) {
    console.error("Extract UI error:", err);
    res.status(500).json({ error: "Failed to extract UI screenshot" });
  }
});

export default router;
