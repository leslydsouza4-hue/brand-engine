import { Router } from "express";
import https from "node:https";

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const parsed = new URL(reqUrl);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BrandEngine/1.0)",
          Accept: "text/html",
        },
        maxHeaderSize: 65536,
      };
      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith("http") ? res.headers.location : `https://${parsed.hostname}${res.headers.location}`;
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
      req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.end();
    };
    doRequest(url);
  });
}

const router = Router();

router.post("/descript/fetch-meta", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing url" });
      return;
    }

    const descriptPattern = /^https?:\/\/share\.descript\.com\/view\/[\w-]+/;
    if (!descriptPattern.test(url)) {
      res.status(400).json({ error: "Invalid Descript share URL" });
      return;
    }

    const html = await fetchPage(url);

    const titleMatch = html.match(
      /property="og:title"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:title"/
    );
    const imageMatch = html.match(
      /property="og:image"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:image"/
    );

    let title = (titleMatch?.[1] || titleMatch?.[2] || "").replace(/ - Descript$/, "").trim();
    const image = imageMatch?.[1] || imageMatch?.[2] || "";

    if (!title) {
      const fallbackTitle = html.match(/<title>([^<]*)<\/title>/);
      title = (fallbackTitle?.[1] || "").replace(/ - Descript$/, "").trim();
    }

    res.json({ title, image });
  } catch (err) {
    console.error("Descript fetch error:", err);
    res.status(500).json({ error: "Internal error fetching Descript metadata" });
  }
});

export default router;
