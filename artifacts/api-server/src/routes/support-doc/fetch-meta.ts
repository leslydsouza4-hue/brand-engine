import { Router } from "express";
import https from "node:https";
import http from "node:http";

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const parsed = new URL(reqUrl);
      const mod = parsed.protocol === "https:" ? https : http;
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BrandEngine/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
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
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      });
      req.on("error", reject);
      req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.end();
    };
    doRequest(url);
  });
}

function fetchImageAsBase64(url: string): Promise<string> {
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
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const ct = res.headers["content-type"] || "";
          let mime = "image/jpeg";
          if (ct.includes("png")) mime = "image/png";
          else if (ct.includes("webp")) mime = "image/webp";
          else if (ct.includes("gif")) mime = "image/gif";
          else if (reqUrl.includes(".png")) mime = "image/png";
          resolve(`data:${mime};base64,${buffer.toString("base64")}`);
        });
        res.on("error", reject);
      });
      req.on("error", reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.end();
    };
    doRequest(url);
  });
}

function extractOgMeta(html: string) {
  const ogTitle = html.match(/property="og:title"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:title"/);
  const ogImage = html.match(/property="og:image"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:image"/);
  const ogDesc = html.match(/property="og:description"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:description"/);
  return {
    title: ogTitle?.[1] || ogTitle?.[2] || "",
    image: ogImage?.[1] || ogImage?.[2] || "",
    description: ogDesc?.[1] || ogDesc?.[2] || "",
  };
}

function extractUIImages(html: string): string[] {
  const imgSrcs: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const skipPatterns = [
    "data:", "svg", "favicon", "logo", "icon", "avatar",
    "emoji", "badge", "arrow", "bullet", "spacer", "pixel",
    "tracking", "analytics", "1x1", "widget", "button",
    "social", "twitter", "facebook", "linkedin", "youtube",
    "gravatar", "profile", "author", "user-",
  ];
  const uiExtensions = /\.(png|jpg|jpeg|webp|gif)(\?|$)/i;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src) continue;
    const lower = src.toLowerCase();
    if (skipPatterns.some(p => lower.includes(p))) continue;
    if (!uiExtensions.test(lower)) continue;
    imgSrcs.push(src);
  }
  return imgSrcs;
}

function extractTitle(html: string): string {
  const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1?.[1]?.trim()) return h1[1].trim();
  const titleTag = html.match(/<title>([^<]*)<\/title>/i);
  return titleTag?.[1]?.trim() || "";
}

const router = Router();

router.post("/support-doc/fetch-meta", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing url" });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "Invalid URL format" });
      return;
    }

    const html = await fetchPage(url);

    const og = extractOgMeta(html);
    let title = og.title || extractTitle(html);
    title = title.replace(/\s*[-|]\s*(HighLevel|GoHighLevel|Support).*$/i, "").trim();

    const allImages = extractUIImages(html);
    const contentImages: string[] = [];

    const imagesToFetch = allImages.slice(0, 10);
    for (const imgUrl of imagesToFetch) {
      try {
        const absUrl = imgUrl.startsWith("http") ? imgUrl : new URL(imgUrl, url).href;
        const b64 = await fetchImageAsBase64(absUrl);
        contentImages.push(b64);
      } catch {
      }
    }

    let ogImageB64 = "";
    if (og.image) {
      try {
        const absUrl = og.image.startsWith("http") ? og.image : new URL(og.image, url).href;
        ogImageB64 = await fetchImageAsBase64(absUrl);
      } catch {
        ogImageB64 = og.image;
      }
    }

    res.json({
      title,
      description: og.description,
      ogImage: ogImageB64,
      images: contentImages,
    });
  } catch (err: any) {
    console.error("Support doc fetch error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch support doc" });
  }
});

export default router;
