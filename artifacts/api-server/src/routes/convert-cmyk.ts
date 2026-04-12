import { Router } from "express";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const MAX_DECODED_BYTES = 40 * 1024 * 1024;

const router = Router();

router.post("/convert-cmyk", async (req, res) => {
  try {
    const { imageData, filename, pageWidth, pageHeight } = req.body;
    if (!imageData || !filename) {
      res.status(400).json({ error: "Missing imageData or filename" });
      return;
    }

    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64, "base64");

    if (imgBuffer.length > MAX_DECODED_BYTES) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    const cmykJpeg = await sharp(imgBuffer)
      .toColorspace("cmyk")
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .toBuffer();

    const pdfDoc = await PDFDocument.create();
    const pW = (pageWidth || 8.5) * 72;
    const pH = (pageHeight || 11) * 72;
    const page = pdfDoc.addPage([pW, pH]);

    const jpgImage = await pdfDoc.embedJpg(cmykJpeg);
    page.drawImage(jpgImage, { x: 0, y: 0, width: pW, height: pH });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    res.json({
      pdf: pdfBase64,
      filename: filename,
      colorSpace: "CMYK",
    });
  } catch (err: any) {
    console.error("CMYK conversion failed:", err);
    res.status(500).json({ error: err.message || "CMYK conversion failed" });
  }
});

export default router;
