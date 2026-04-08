import { useState, useRef, useEffect } from "react";
import { Download, Loader2, FileText, Menu } from "lucide-react";

interface ToolbarProps {
  onExport?: (format: "png" | "jpeg" | "pdf") => void;
  isExporting?: boolean;
  onMenuToggle?: () => void;
}

export function Toolbar({ onExport, isExporting, onMenuToggle }: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: "png" | "jpeg" | "pdf") => {
    setExportOpen(false);
    onExport?.(format);
  };

  return (
    <div className="flex items-center justify-between md:justify-end py-[14px] px-[16px] md:px-[28px] relative z-50">
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
      >
        <Menu className="w-[20px] h-[20px]" />
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setExportOpen(!exportOpen)}
          disabled={isExporting}
          className="flex items-center gap-[7px] py-[9px] px-[18px] bg-[rgba(255,255,255,0.035)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.06)] rounded-[16px] text-[13px] font-medium text-[#94A3B8] cursor-pointer transition-all duration-250 whitespace-nowrap hover:text-white hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
        >
          {isExporting ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <Download className="w-[16px] h-[16px]" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </button>

        {exportOpen && !isExporting && (
          <div className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] bg-[rgba(7,34,61,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[6px] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-[1000] block animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => handleExport("png")}
              className="flex items-center gap-[10px] w-full py-[10px] px-[14px] bg-transparent text-[#CBD5E1] border-none rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
            >
              <Download className="w-[15px] h-[15px] shrink-0" />
              PNG
              <span className="ml-auto text-[11px] text-[#475569] group-hover:text-[#94A3B8]">1920×1080</span>
            </button>
            <button
              onClick={() => handleExport("jpeg")}
              className="flex items-center gap-[10px] w-full py-[10px] px-[14px] bg-transparent text-[#CBD5E1] border-none rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
            >
              <Download className="w-[15px] h-[15px] shrink-0" />
              JPEG
              <span className="ml-auto text-[11px] text-[#475569] group-hover:text-[#94A3B8]">1920×1080 · 92%</span>
            </button>
            <div className="h-[1px] bg-white/[0.06] my-[4px] mx-[8px]" />
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-[10px] w-full py-[10px] px-[14px] bg-transparent text-[#CBD5E1] border-none rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
            >
              <FileText className="w-[15px] h-[15px] shrink-0" />
              PDF
              <span className="ml-auto text-[11px] text-[#475569] group-hover:text-[#94A3B8]">Document</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
