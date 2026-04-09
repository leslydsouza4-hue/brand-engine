import { useState, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);
    const origRadius = target.style.borderRadius;
    target.style.borderRadius = "0";

    const scale = 1920 / target.offsetWidth;
    const opts = {
      width: target.offsetWidth,
      height: target.offsetHeight,
      pixelRatio: scale,
      cacheBust: true,
      skipAutoScale: true,
      style: { borderRadius: "0" },
    };

    try {
      const exportName = target.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      if (format === "pdf") {
        const dataUrl = await toPng(target, opts);
        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => { img.onload = r; });
        const orientation = img.width >= img.height ? "landscape" as const : "portrait" as const;
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${safeName}.pdf`);
      } else if (format === "jpeg") {
        const dataUrl = await toJpeg(target, { ...opts, quality: 0.92, backgroundColor: "#060B16" });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const dataUrl = await toPng(target, opts);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      target.style.borderRadius = origRadius;
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport };
}
