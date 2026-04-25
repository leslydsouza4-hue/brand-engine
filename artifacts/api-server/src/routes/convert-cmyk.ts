import { Router } from "express";
import { execFile } from "child_process";
import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const MAX_DECODED_BYTES = 40 * 1024 * 1024;

const router = Router();

router.post("/convert-cmyk", async (req, res) => {
  let tempDir = "";
  try {
    const { imageData, filename, pageWidth, pageHeight, colorSpace } =
      req.body;
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

    // Default to RGB (sRGB) for screen / web / digital exports. Pass
    // colorSpace: "cmyk" only when targeting print production.
    const cs = String(colorSpace || "rgb").toLowerCase();
    const imColorSpace = cs === "cmyk" ? "CMYK" : "sRGB";
    const responseColorSpace = cs === "cmyk" ? "CMYK" : "RGB";

    tempDir = await mkdtemp(join(tmpdir(), "pdfconv-"));
    const inputPath = join(tempDir, "input.png");
    const outputPath = join(tempDir, "output.pdf");

    await writeFile(inputPath, imgBuffer);

    const pW = pageWidth || 8.5;
    const pH = pageHeight || 11;
    const densityW = 300;
    const targetW = Math.round(pW * densityW);
    const targetH = Math.round(pH * densityW);

    // NOTE: do NOT pass `-page` here. ImageMagick interprets `-page WxH`
    // ambiguously when `-units PixelsPerInch` is set and can produce a
    // tiny PDF page (image scaled down inside it). Page size is derived
    // naturally from `image pixels ÷ density`, so resizing to
    // (pW*300) × (pH*300) at density 300 gives a PDF page of pW×pH inches.
    await execFileAsync(
      "convert",
      [
        inputPath,
        "-colorspace", imColorSpace,
        "-density", String(densityW),
        "-units", "PixelsPerInch",
        "-resize", `${targetW}x${targetH}!`,
        "-compress", "Zip",
        "-quality", "100",
        outputPath,
      ],
      { timeout: 30000 },
    );

    const pdfBytes = await readFile(outputPath);
    const pdfBase64 = pdfBytes.toString("base64");

    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    res.json({
      pdf: pdfBase64,
      filename,
      colorSpace: responseColorSpace,
      quality: "lossless",
      dpi: densityW,
    });
  } catch (err: any) {
    console.error("PDF conversion failed:", err);
    res.status(500).json({ error: err.message || "PDF conversion failed" });
  }
});

export default router;
