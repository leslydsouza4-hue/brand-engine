import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { Sidebar } from "@/components/brand/Sidebar";
import { Toolbar } from "@/components/brand/Toolbar";
import { TemplatesWorkspace } from "@/components/brand/TemplatesWorkspace";
import { ShaunWorkspace } from "@/components/brand/ShaunWorkspace";
import { ZoomWorkspace } from "@/components/brand/ZoomWorkspace";

export default function BrandEngine() {
  const [currentMode, setCurrentMode] = useState("templates");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg") => {
    const el = document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!el) return;

    setIsExporting(true);
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
          a.download = `brand-engine-export.${format === "jpeg" ? "jpg" : "png"}`;
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
        
        {currentMode === "ai-image" && (
          <div className="flex-1 flex items-center justify-center text-[#64748B] flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 opacity-50">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <p className="text-sm font-medium">AI Image Generation coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
