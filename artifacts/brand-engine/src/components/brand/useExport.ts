import { useState, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";

type RadiiEntry = { el: HTMLElement; origRadius: string; origClip: string };

function convertRadiiToClipPath(root: HTMLElement): RadiiEntry[] {
  const saved: RadiiEntry[] = [];
  const all = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.borderRadius && cs.borderRadius !== "0px") {
      const radius = cs.borderRadius;
      saved.push({
        el,
        origRadius: el.style.borderRadius,
        origClip: el.style.clipPath,
      });
      if (el === root) {
        el.style.borderRadius = "0";
      } else {
        el.style.clipPath = `inset(0 round ${radius})`;
        el.style.borderRadius = "0";
      }
    }
  }
  return saved;
}

function restoreRadii(saved: RadiiEntry[]) {
  for (const { el, origRadius, origClip } of saved) {
    el.style.borderRadius = origRadius;
    el.style.clipPath = origClip;
  }
}

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
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);

    await preloadImages(target);

    const savedRadii = convertRadiiToClipPath(target);
    const savedLayout = blowUpForCapture(target, 1920);

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const opts = {
      width: target.offsetWidth,
      height: target.offsetHeight,
      pixelRatio: 1,
      cacheBust: true,
      skipAutoScale: true,
    };

    try {
      await toPng(target, opts);

      const exportName = target.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      if (format === "pdf") {
        const dataUrl = await toPng(target, opts);
        restoreLayout(target, savedLayout);
        restoreRadii(savedRadii);
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
        restoreLayout(target, savedLayout);
        restoreRadii(savedRadii);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.jpg`, source: "Custom Design", format: "jpeg", thumbnail: thumb, dimensions: `${target.offsetWidth}x${target.offsetHeight}` }));
      } else {
        const dataUrl = await toPng(target, opts);
        restoreLayout(target, savedLayout);
        restoreRadii(savedRadii);
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
      restoreRadii(savedRadii);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport };
}
