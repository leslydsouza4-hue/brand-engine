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

    tempDir = await mkdtemp(join(tmpdir(), "cmyk-"));
    const inputPath = join(tempDir, "input.png");
    const outputPath = join(tempDir, "output.pdf");

    await writeFile(inputPath, imgBuffer);

    const pW = pageWidth || 8.5;
    const pH = pageHeight || 11;
    const densityW = 300;

    await execFileAsync("convert", [
      inputPath,
      "-colorspace", "CMYK",
      "-density", String(densityW),
      "-units", "PixelsPerInch",
      "-page", `${pW * 72}x${pH * 72}`,
      "-resize", `${Math.round(pW * densityW)}x${Math.round(pH * densityW)}!`,
      "-compress", "Zip",
      "-quality", "100",
      outputPath,
    ], { timeout: 30000 });

    const pdfBytes = await readFile(outputPath);
    const pdfBase64 = pdfBytes.toString("base64");

    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    res.json({
      pdf: pdfBase64,
      filename,
      colorSpace: "CMYK",
      quality: "lossless",
      dpi: densityW,
    });
  } catch (err: any) {
    console.error("CMYK conversion failed:", err);
    res.status(500).json({ error: err.message || "CMYK conversion failed" });
  }
});

export default router;
