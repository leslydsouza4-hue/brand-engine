import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Extract a Drive folder ID from any of the common public-share URL formats.
function extractFolderId(url: string): string | null {
  const m =
    url.match(/\/folders\/([a-zA-Z0-9_-]{15,})/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/) ||
    url.match(/^([a-zA-Z0-9_-]{15,})$/);
  return m ? m[1] : null;
}

interface DriveFile {
  driveFileId: string;
  name: string;
  mimeType: string;
  thumbUrl: string;
  fullUrl: string;
}

// The public `embeddedfolderview` page renders the folder contents as HTML.
// Each child file appears in a `<div class="flip-entry" id="entry-<ID>">`
// block with its name in `<div class="flip-entry-title">`. This needs no
// API key, only that the folder is publicly shared (anyone-with-link).
async function listFolder(folderId: string): Promise<DriveFile[]> {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`Drive folder fetch failed: HTTP ${res.status}`);
  const html = await res.text();

  const files: DriveFile[] = [];
  // Each entry block — we capture the file ID and its title separately.
  const entryRe = /<div[^>]+class="flip-entry"[^>]+id="entry-([a-zA-Z0-9_-]{15,})"[\s\S]*?<div class="flip-entry-title">([\s\S]*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(html)) !== null) {
    const id = m[1];
    const rawName = m[2].replace(/<[^>]+>/g, "").trim();
    const name = rawName
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (!/\.(png|jpe?g|webp|gif|heic|bmp)$/i.test(name)) continue; // images only
    files.push({
      driveFileId: id,
      name,
      mimeType: "image/*",
      thumbUrl: `/api/levelup/drive/image?id=${id}&size=w400`,
      fullUrl: `/api/levelup/drive/image?id=${id}&size=w2000`,
    });
  }
  return files;
}

router.post("/levelup/drive/list", async (req, res) => {
  const { folderUrl } = (req.body ?? {}) as { folderUrl?: string };
  if (!folderUrl || typeof folderUrl !== "string") {
    res.status(400).json({ error: "folderUrl is required" });
    return;
  }
  const folderId = extractFolderId(folderUrl);
  if (!folderId) {
    res.status(400).json({ error: "Could not extract a Drive folder ID from that URL" });
    return;
  }
  try {
    const files = await listFolder(folderId);
    res.json({ folderId, files });
  } catch (err) {
    req.log.error({ err }, "drive list failed");
    res.status(502).json({ error: (err as Error).message || "Failed to read Drive folder" });
  }
});

// Proxy a single Drive image. We try both the thumbnail and uc endpoints;
// the thumbnail endpoint always serves something for any public file and is
// resized server-side by Drive itself.
router.get("/levelup/drive/image", async (req, res) => {
  const id = String(req.query.id || "");
  const size = String(req.query.size || "w800");
  if (!/^[a-zA-Z0-9_-]{15,}$/.test(id)) {
    res.status(400).send("bad id");
    return;
  }
  const sizeParam = /^w\d+$/.test(size) ? size : "w800";
  const url = `https://drive.google.com/thumbnail?id=${id}&sz=${sizeParam}`;
  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      redirect: "follow",
    });
    if (!upstream.ok || !upstream.body) {
      res.status(502).send(`upstream ${upstream.status}`);
      return;
    }
    const ct = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (err) {
    req.log.error({ err }, "drive image proxy failed");
    res.status(502).send("proxy failed");
  }
});

export default router;
