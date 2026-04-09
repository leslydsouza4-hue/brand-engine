import { useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
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
    const origOverflow = el.style.overflow;
    el.style.borderRadius = "0";
    el.style.overflow = "hidden";

    const frozen: { el: HTMLElement; prop: string; orig: string }[] = [];
    const propsToFreeze = ["fontSize", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "borderRadius", "borderTopRightRadius", "borderBottomRightRadius", "letterSpacing", "lineHeight"];
    const allChildren = el.querySelectorAll("*");
    allChildren.forEach((child) => {
      const htmlEl = child as HTMLElement;
      const computed = window.getComputedStyle(htmlEl);
      for (const prop of propsToFreeze) {
        const val = computed.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
        if (val && val !== "normal" && val !== "none") {
          frozen.push({ el: htmlEl, prop, orig: htmlEl.style.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase()) });
          htmlEl.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), val);
        }
      }
    });

    try {
      const canvas = await html2canvas(el, {
        scale: 1920 / el.offsetWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const exportName = el.getAttribute("data-export-name") || "brand-engine-export";
      const safeName = exportName.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");

      if (format === "pdf") {
        const imgData = canvas.toDataURL("image/png");
        const imgW = canvas.width;
        const imgH = canvas.height;
        const orientation = imgW >= imgH ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "px", format: [imgW, imgH] });
        pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
        pdf.save(`${safeName}.pdf`);
        setIsExporting(false);
      } else {
        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        const quality = format === "jpeg" ? 0.92 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
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
      }
    } catch (err) {
      console.error("Export failed:", err);
      setIsExporting(false);
    } finally {
      for (const { el: frozenEl, prop, orig } of frozen) {
        const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (orig) {
          frozenEl.style.setProperty(cssProp, orig);
        } else {
          frozenEl.style.removeProperty(cssProp);
        }
      }
      el.style.borderRadius = origRadius;
      el.style.overflow = origOverflow;
    }
  }, []);

  return (
    <div className="flex h-screen w-screen relative bg-[#060B16] brand-app-bg">
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <div className="w-0 md:w-[220px] shrink-0 overflow-visible">
        <Sidebar currentMode={currentMode} setMode={setCurrentMode} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar onExport={handleExport} isExporting={isExporting} onMenuToggle={() => setSidebarOpen(true)} />
        
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
