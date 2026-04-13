import { useState, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";

function stripRadii(root: HTMLElement): Array<{ el: HTMLElement; orig: string }> {
  const saved: Array<{ el: HTMLElement; orig: string }> = [];
  const all = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.borderRadius && cs.borderRadius !== "0px") {
      saved.push({ el, orig: el.style.borderRadius });
      el.style.borderRadius = "0";
    }
  }
  return saved;
}

function restoreRadii(saved: Array<{ el: HTMLElement; orig: string }>) {
  for (const { el, orig } of saved) {
    el.style.borderRadius = orig;
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

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf", el?: HTMLElement | null) => {
    const target = el || document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!target) return;

    setIsExporting(true);
    const saved = stripRadii(target);

    await preloadImages(target);

    const scale = 2560 / target.offsetWidth;
    const opts = {
      width: target.offsetWidth,
      height: target.offsetHeight,
      pixelRatio: scale,
      cacheBust: true,
      skipAutoScale: true,
      imagePlaceholder: undefined,
      includeQueryParams: true,
      style: { borderRadius: "0" },
      filter: (node: HTMLElement) => {
        if (node.tagName === "IMG") {
          node.setAttribute("crossorigin", "anonymous");
        }
        return true;
      },
    };

    try {
      await toPng(target, opts);
      await toPng(target, opts);

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
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.pdf`, source: "Custom Design", format: "pdf", thumbnail: thumb, dimensions: `${img.width}x${img.height}` }));
      } else if (format === "jpeg") {
        const dataUrl = await toJpeg(target, { ...opts, quality: 0.95, backgroundColor: "#060B16" });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.jpg`, source: "Custom Design", format: "jpeg", thumbnail: thumb, dimensions: `${Math.round(target.offsetWidth * scale)}x${Math.round(target.offsetHeight * scale)}` }));
      } else {
        const dataUrl = await toPng(target, opts);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((thumb) => addExport({ name: `${safeName}.png`, source: "Custom Design", format: "png", thumbnail: thumb, dimensions: `${Math.round(target.offsetWidth * scale)}x${Math.round(target.offsetHeight * scale)}` }));
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      restoreRadii(saved);
      setIsExporting(false);
    }
  }, []);

  return { isExporting, handleExport };
}
