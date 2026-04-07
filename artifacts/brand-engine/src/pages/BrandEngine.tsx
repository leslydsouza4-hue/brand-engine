import { useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { Sidebar } from "@/components/brand/Sidebar";
import { Toolbar } from "@/components/brand/Toolbar";
import { TemplatesWorkspace } from "@/components/brand/TemplatesWorkspace";
import { ShaunWorkspace } from "@/components/brand/ShaunWorkspace";
import { ZoomWorkspace } from "@/components/brand/ZoomWorkspace";
import { AIImageWorkspace } from "@/components/brand/AIImageWorkspace";
import { BrandDirectoryWorkspace } from "@/components/brand/BrandDirectoryWorkspace";
import { SettingsWorkspace } from "@/components/brand/SettingsWorkspace";

export default function BrandEngine() {
  const [currentMode, _setCurrentMode] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const valid = ["templates", "ai-image", "shaun-thumbnails", "zoom-backgrounds", "brand-directory", "settings"];
    return valid.includes(hash) ? hash : "templates";
  });
  const VALID_MODES = ["templates", "ai-image", "shaun-thumbnails", "zoom-backgrounds", "brand-directory", "settings"];
  const parseHash = () => {
    const h = window.location.hash.replace("#", "");
    return VALID_MODES.includes(h) ? h : "templates";
  };
  const setCurrentMode = (mode: string) => {
    _setCurrentMode(mode);
    window.location.hash = mode === "templates" ? "" : mode;
  };
  useEffect(() => {
    const onHashChange = () => _setCurrentMode(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg") => {
    const el = document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!el) return;

    setIsExporting(true);
    const origRadius = el.style.borderRadius;
    const origOverflow = el.style.overflow;
    el.style.borderRadius = "0";
    el.style.overflow = "hidden";
    try {
      const canvas = await html2canvas(el, {
        scale: 1920 / el.offsetWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const quality = format === "jpeg" ? 0.92 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const exportName = el.getAttribute("data-export-name") || "brand-engine-export";
          const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");
          a.download = `${safeName}.${format === "jpeg" ? "jpg" : "png"}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExporting(false);
        },
        mimeType,
        quality
      );
    } catch (err) {
      console.error("Export failed:", err);
      setIsExporting(false);
    } finally {
      el.style.borderRadius = origRadius;
      el.style.overflow = origOverflow;
    }
  }, []);

  return (
    <div className="flex h-screen w-screen relative bg-[#060B16] brand-app-bg">
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <Sidebar currentMode={currentMode} setMode={setCurrentMode} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar currentMode={currentMode} onExport={handleExport} isExporting={isExporting} />
        
        {currentMode === "templates" && <TemplatesWorkspace />}
        {currentMode === "shaun-thumbnails" && <ShaunWorkspace />}
        {currentMode === "zoom-backgrounds" && <ZoomWorkspace />}
        
        {currentMode === "ai-image" && <AIImageWorkspace />}
        {currentMode === "brand-directory" && <BrandDirectoryWorkspace />}
        {currentMode === "settings" && <SettingsWorkspace />}
      </div>
    </div>
  );
}
