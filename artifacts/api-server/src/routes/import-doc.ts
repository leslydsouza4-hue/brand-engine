import { Router } from "express";

const router = Router();

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extractDocId(url: string): string | null {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function htmlToText(html: string): string {
  // Drop <head>, <style>, <script>
  let s = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  // Block elements -> newlines
  s = s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, "[image: $1]")
    .replace(/<img[^>]*>/gi, "[image]");
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  // Tidy whitespace
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const u = decodeEntities(m[1]);
    if (/^https?:\/\//i.test(u)) urls.push(u);
  }
  return [...new Set(urls)];
}

async function fetchImageAsBase64(url: string): Promise<{ mediaType: string; data: string; bytes: number } | null> {
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) return null;
    let mediaType = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (mediaType === "image/jpg") mediaType = "image/jpeg";
    if (!ALLOWED_IMAGE_TYPES.has(mediaType)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    return { mediaType, data: buf.toString("base64"), bytes: buf.byteLength };
  } catch {
    return null;
  }
}

router.post("/import-doc", async (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing url" });
      return;
    }

    const docId = extractDocId(url.trim());
    if (!docId) {
      res.status(400).json({ error: "Could not parse a Google Docs URL or document ID" });
      return;
    }

    // Pull as HTML so we can recover both text AND embedded images.
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const r = await fetch(exportUrl, { redirect: "follow" });

    if (!r.ok) {
      res.status(502).json({
        error: r.status === 404
          ? "Document not found. Make sure the doc exists."
          : "Could not access the doc. Set sharing to 'Anyone with the link can view'.",
        status: r.status,
      });
      return;
    }

    const contentType = r.headers.get("content-type") || "";
    const html = await r.text();

    // Google returns an HTML sign-in page when the doc is private.
    if (!contentType.includes("text/html") || /accounts\.google\.com\/ServiceLogin/i.test(html)) {
      res.status(403).json({
        error: "The doc is private. Set sharing to 'Anyone with the link can view' and try again.",
      });
      return;
    }

    const text = htmlToText(html);

    // Fetch images in parallel (capped).
    const imgUrls = extractImageUrls(html).slice(0, MAX_IMAGES);
    const fetched = await Promise.all(imgUrls.map(fetchImageAsBase64));
    const images = fetched.filter((x): x is NonNullable<typeof x> => x !== null);

    res.json({
      text,
      docId,
      images,
      imageCount: images.length,
      imageUrlsFound: imgUrls.length,
    });
  } catch (err: any) {
    console.error("Import doc failed:", err);
    res.status(500).json({ error: err?.message || "Failed to import doc" });
  }
});

export default router;
