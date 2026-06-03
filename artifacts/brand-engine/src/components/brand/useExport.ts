import { useState, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";
import { getFontEmbedCSS } from "./fontEmbed";

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

export interface QueuedThumbnail {
  id: string;
  name: string;
  dataUrl: string;
  thumbnail: string;
  timestamp: number;
}

async function captureElement(target: HTMLElement): Promise<{ dataUrl: string; name: string }> {
  await preloadImages(target);

  const rect = target.getBoundingClientRect();
  const currentW = rect.width;
  const targetW = 1920;
  const ratio = targetW / currentW;

  const restoreFontLinks = removeGoogleFontLinks();
  const fontEmbedCSS = await getFontEmbedCSS();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const opts = {
    width: currentW,
    height: rect.height,
    pixelRatio: ratio,
    cacheBust: true,
    skipAutoScale: true,
    fontEmbedCSS,
    filter: (node: HTMLElement) => {
      if (node.tagName === 'LINK' && node.getAttribute('href')?.includes('fonts.googleapis.com')) {
        return false;
      }
      return true;
    },
  };

  try {
    await toPng(target, opts);
    const dataUrl = await toPng(target, opts);
    restoreFontLinks();
    const exportName = target.getAttribute("data-export-name") || "brand-engine-export";
    const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");
    return { dataUrl, name: safeName };
  } catch (err) {
    restoreFontLinks();
    throw err;
  }
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);

    try {
      const { dataUrl: rawDataUrl, name: safeName } = await captureElement(target);
      const rect = target.getBoundingClientRect();
      const currentW = rect.width;
      const targetW = 1920;
      const ratio = targetW / currentW;

      if (format === "pdf") {
        const img = new Image();
        img.src = rawDataUrl;
        await new Promise((r) => { img.onload = r; });
        const orientation = img.width >= img.height ? "landscape" as const : "portrait" as const;
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(rawDataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${safeName}.pdf`);
        createThumbnail(rawDataUrl).then((thumb) => addExport({ name: `${safeName}.pdf`, source: "Custom Design", format: "pdf", thumbnail: thumb, dimensions: `${img.width}x${img.height}` }));
      } else if (format === "jpeg") {
        const restoreFontLinks2 = removeGoogleFontLinks();
        const fontEmbedCSS2 = await getFontEmbedCSS();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        let jpegDataUrl: string;
        try {
          jpegDataUrl = await toJpeg(target, {
            width: currentW,
            height: rect.height,
            pixelRatio: ratio,
            cacheBust: true,
            skipAutoScale: true,
            quality: 0.95,
            backgroundColor: "#060B16",
            fontEmbedCSS: fontEmbedCSS2,
            filter: (node: HTMLElement) => {
              if (node.tagName === 'LINK' && node.getAttribute('href')?.includes('fonts.googleapis.com')) return false;
              return true;
            },
          });
        } finally {
          restoreFontLinks2();
        }
        const a = document.createElement("a");
        a.href = jpegDataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const w = Math.round(currentW * ratio);
        const h = Math.round(rect.height * ratio);
        createThumbnail(jpegDataUrl).then((thumb) => addExport({ name: `${safeName}.jpg`, source: "Custom Design", format: "jpeg", thumbnail: thumb, dimensions: `${w}x${h}` }));
      } else {
        const a = document.createElement("a");
        a.href = rawDataUrl;
        a.download = `${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const w = Math.round(currentW * ratio);
        const h = Math.round(rect.height * ratio);
        createThumbnail(rawDataUrl).then((thumb) => addExport({ name: `${safeName}.png`, source: "Custom Design", format: "png", thumbnail: thumb, dimensions: `${w}x${h}` }));
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const captureToQueue = useCallback(async (el?: HTMLElement | null): Promise<QueuedThumbnail | null> => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return null;

    setIsExporting(true);
    try {
      const { dataUrl, name } = await captureElement(target);
      const thumb = await createThumbnail(dataUrl, 200);
      const item: QueuedThumbnail = {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        dataUrl,
        thumbnail: thumb,
        timestamp: Date.now(),
      };
      return item;
    } catch (err) {
      console.error("Queue capture failed:", err);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport, captureToQueue };
}
