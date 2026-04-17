import { Router } from "express";

const router = Router();

function extractDocId(url: string): string | null {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
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

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
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
    if (contentType.includes("text/html")) {
      res.status(403).json({
        error: "The doc is private. Set sharing to 'Anyone with the link can view' and try again.",
      });
      return;
    }

    const text = await r.text();
    res.json({ text, docId });
  } catch (err: any) {
    console.error("Import doc failed:", err);
    res.status(500).json({ error: err?.message || "Failed to import doc" });
  }
});

export default router;
