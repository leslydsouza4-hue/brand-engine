import { useState, useCallback, useEffect } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { Sidebar } from "@/components/brand/Sidebar";
import { Toolbar } from "@/components/brand/Toolbar";
import { TemplatesWorkspace } from "@/components/brand/TemplatesWorkspace";
import { ShaunWorkspace } from "@/components/brand/ShaunWorkspace";
import { ZoomWorkspace } from "@/components/brand/ZoomWorkspace";
import { AIImageWorkspace } from "@/components/brand/AIImageWorkspace";
import { BrandDirectoryWorkspace } from "@/components/brand/BrandDirectoryWorkspace";
import { SettingsWorkspace } from "@/components/brand/SettingsWorkspace";
import { BizDevWorkspace } from "@/components/brand/BizDevWorkspace";

export default function BrandEngine() {
  const [currentMode, _setCurrentMode] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const valid = ["templates", "ai-image", "shaun-thumbnails", "bizdev-templates", "zoom-backgrounds", "brand-directory", "settings"];
    return valid.includes(hash) ? hash : "templates";
  });
  const VALID_MODES = ["templates", "ai-image", "shaun-thumbnails", "bizdev-templates", "zoom-backgrounds", "brand-directory", "settings"];
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleExport = useCallback(async (format: "png" | "jpeg" | "pdf") => {
    const el = document.querySelector("[data-export-preview]") as HTMLElement | null;
    if (!el) return;

    setIsExporting(true);
    const origRadius = el.style.borderRadius;
    el.style.borderRadius = "0";

    const scale = 1920 / el.offsetWidth;
    const opts = {
      width: el.offsetWidth,
      height: el.offsetHeight,
      pixelRatio: scale,
      cacheBust: true,
      skipAutoScale: true,
      style: { borderRadius: "0" },
    };

    try {
      const exportName = el.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      if (format === "pdf") {
        const dataUrl = await toPng(el, opts);
        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => { img.onload = r; });
        const orientation = img.width >= img.height ? "landscape" as const : "portrait" as const;
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${safeName}.pdf`);
      } else if (format === "jpeg") {
        const dataUrl = await toJpeg(el, { ...opts, quality: 0.92, backgroundColor: "#060B16" });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const dataUrl = await toPng(el, opts);
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
      el.style.borderRadius = origRadius;
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen relative bg-[#060B16] brand-app-bg">
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <div className="w-0 md:w-[220px] shrink-0 overflow-visible">
        <Sidebar currentMode={currentMode} setMode={setCurrentMode} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onExport={handleExport} isExporting={isExporting} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar onMenuToggle={() => setSidebarOpen(true)} />
        
        {currentMode === "templates" && <TemplatesWorkspace />}
        {currentMode === "shaun-thumbnails" && <ShaunWorkspace />}
        {currentMode === "zoom-backgrounds" && <ZoomWorkspace />}
        
        {currentMode === "bizdev-templates" && <BizDevWorkspace />}
        {currentMode === "ai-image" && <AIImageWorkspace />}
        {currentMode === "brand-directory" && <BrandDirectoryWorkspace />}
        {currentMode === "settings" && <SettingsWorkspace />}
      </div>
    </div>
  );
}
