import { useState, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";

async function preloadImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll("img");
  const promises: Promise<void>[] = [];
  imgs.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) return;
    promises.push(
      new Promise((resolve) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve();
        i.onerror = () => resolve();
        i.src = img.src;
      })
    );
  });
  await Promise.all(promises);
}

function removeGoogleFontLinks(): (() => void) {
  const links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  const removed: { el: Element; parent: Node; next: Node | null }[] = [];
  links.forEach((link) => {
    if (link.parentNode) {
      removed.push({ el: link, parent: link.parentNode, next: link.nextSibling });
      link.parentNode.removeChild(link);
    }
  });
  return () => {
    for (const { el, parent, next } of removed) {
      parent.insertBefore(el, next);
    }
  };
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);

    await preloadImages(target);

    const rect = target.getBoundingClientRect();
    const currentW = rect.width;
    const targetW = 1920;
    const ratio = targetW / currentW;

    const restoreFontLinks = removeGoogleFontLinks();

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const opts = {
      width: currentW,
      height: rect.height,
      pixelRatio: ratio,
      cacheBust: true,
      skipAutoScale: true,
      filter: (node: HTMLElement) => {
        if (node.tagName === 'LINK' && node.getAttribute('href')?.includes('fonts.googleapis.com')) {
          return false;
        }
        return true;
      },
    };

    try {
      await toPng(target, opts);

      const exportName = target.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      if (format === "pdf") {
        const dataUrl = await toPng(target, opts);
        restoreFontLinks();
        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => { img.onload = r; });
        const orientation = img.width >= img.height ? "landscape" as const : "portrait" as const;
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${safeName}.pdf`);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.pdf`, source: "Custom Design", format: "pdf", thumbnail: thumb, dimensions: `${img.width}x${img.height}` }));
      } else if (format === "jpeg") {
        const dataUrl = await toJpeg(target, { ...opts, quality: 0.95, backgroundColor: "#060B16" });
        restoreFontLinks();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const w = Math.round(currentW * ratio);
        const h = Math.round(rect.height * ratio);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.jpg`, source: "Custom Design", format: "jpeg", thumbnail: thumb, dimensions: `${w}x${h}` }));
      } else {
        const dataUrl = await toPng(target, opts);
        restoreFontLinks();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const w = Math.round(currentW * ratio);
        const h = Math.round(rect.height * ratio);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.png`, source: "Custom Design", format: "png", thumbnail: thumb, dimensions: `${w}x${h}` }));
      }
    } catch (err) {
      console.error("Export failed:", err);
      restoreFontLinks();
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport };
}
