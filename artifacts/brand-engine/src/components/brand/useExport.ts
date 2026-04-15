import { useState, useCallback } from "react";
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

interface SavedLayout {
  width: string;
  height: string;
  maxWidth: string;
  position: string;
  left: string;
  top: string;
  transform: string;
  zIndex: string;
  overflow: string;
  borderRadius: string;
}

function blowUpForCapture(el: HTMLElement, targetW: number): SavedLayout {
  const rect = el.getBoundingClientRect();
  const aspect = rect.height / rect.width;
  const targetH = Math.round(targetW * aspect);

  const saved: SavedLayout = {
    width: el.style.width,
    height: el.style.height,
    maxWidth: el.style.maxWidth,
    position: el.style.position,
    left: el.style.left,
    top: el.style.top,
    transform: el.style.transform,
    zIndex: el.style.zIndex,
    overflow: el.style.overflow,
    borderRadius: el.style.borderRadius,
  };

  el.style.width = `${targetW}px`;
  el.style.height = `${targetH}px`;
  el.style.maxWidth = "none";
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0px";
  el.style.transform = "none";
  el.style.zIndex = "-1";
  el.style.overflow = "hidden";
  el.style.borderRadius = "0";

  return saved;
}

function restoreLayout(el: HTMLElement, saved: SavedLayout) {
  el.style.width = saved.width;
  el.style.height = saved.height;
  el.style.maxWidth = saved.maxWidth;
  el.style.position = saved.position;
  el.style.left = saved.left;
  el.style.top = saved.top;
  el.style.transform = saved.transform;
  el.style.zIndex = saved.zIndex;
  el.style.overflow = saved.overflow;
  el.style.borderRadius = saved.borderRadius;
}

async function captureElement(el: HTMLElement, format: "png" | "jpeg"): Promise<string> {
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(el, {
    width: w,
    height: h,
    scale: 1,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#060B16",
    logging: false,
    removeContainer: true,
  });

  if (format === "jpeg") {
    return canvas.toDataURL("image/jpeg", 0.95);
  }
  return canvas.toDataURL("image/png");
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);

    await preloadImages(target);

    const savedLayout = blowUpForCapture(target, 1920);

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 100));

    try {
      const exportName = target.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      const dataUrl = await captureElement(target, format === "jpeg" ? "jpeg" : "png");

      restoreLayout(target, savedLayout);

      if (format === "pdf") {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => { img.onload = r; });
        const orientation = img.width >= img.height ? "landscape" as const : "portrait" as const;
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${safeName}.pdf`);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.pdf`, source: "Custom Design", format: "pdf", thumbnail: thumb, dimensions: `${img.width}x${img.height}` }));
      } else if (format === "jpeg") {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.jpg`, source: "Custom Design", format: "jpeg", thumbnail: thumb, dimensions: `${target.offsetWidth}x${target.offsetHeight}` }));
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.png`, source: "Custom Design", format: "png", thumbnail: thumb, dimensions: `${target.offsetWidth}x${target.offsetHeight}` }));
      }
    } catch (err) {
      console.error("Export failed:", err);
      restoreLayout(target, savedLayout);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport };
}
