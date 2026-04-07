import { useState, useRef, useEffect } from "react";
import { Play, Download, Loader2 } from "lucide-react";

interface ToolbarProps {
  currentMode: string;
  onExport?: (format: "png" | "jpeg") => void;
  isExporting?: boolean;
}

export function Toolbar({ currentMode, onExport, isExporting }: ToolbarProps) {
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

  const handleExport = (format: "png" | "jpeg") => {
    setExportOpen(false);
    onExport?.(format);
  };

  return (
    <div className="flex items-center justify-between py-[14px] px-[28px] relative z-50">
      {currentMode === 'templates' ? (
        <div className="flex items-center bg-[rgba(255,255,255,0.035)] backdrop-blur-[24px] saturate-[160%] rounded-[22px] p-[5px] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <button className="flex items-center gap-[7px] py-[9px] px-[18px] border border-[rgba(40,150,251,0.2)] bg-gradient-to-br from-[#095DC3] to-[#2896FB] rounded-[16px] text-[13px] font-medium text-white cursor-pointer transition-all duration-250 whitespace-nowrap shadow-[0_2px_12px_rgba(0,178,169,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-gradient-to-br hover:from-[#0A6DD8] hover:to-[#3AA3FF] hover:-translate-y-[1px]">
            <Play className="w-[16px] h-[16px] fill-white" />
            Generate
          </button>
        </div>
      ) : (
        <div />
      )}

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
          </div>
        )}
      </div>
    </div>
  );
}
