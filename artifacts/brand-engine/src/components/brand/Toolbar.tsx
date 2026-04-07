import { useState, useRef, useEffect } from "react";
import { Play, Save, Copy, Download } from "lucide-react";

interface ToolbarProps {
  currentMode: string;
}

export function Toolbar({ currentMode }: ToolbarProps) {
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

  return (
    <div className="flex items-center justify-between py-[14px] px-[28px] relative z-50">
      <div className="flex items-center gap-[6px] bg-[rgba(255,255,255,0.035)] backdrop-blur-[24px] saturate-[160%] rounded-[22px] p-[5px] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
        
        {currentMode === 'templates' && (
          <button className="flex items-center gap-[7px] py-[9px] px-[18px] border border-[rgba(40,150,251,0.2)] bg-gradient-to-br from-[#095DC3] to-[#2896FB] rounded-[16px] text-[13px] font-medium text-white cursor-pointer transition-all duration-250 whitespace-nowrap shadow-[0_2px_12px_rgba(0,178,169,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-gradient-to-br hover:from-[#0A6DD8] hover:to-[#3AA3FF] hover:-translate-y-[1px]">
            <Play className="w-[16px] h-[16px] fill-white" />
            Generate
          </button>
        )}

        {currentMode === 'templates' && (
          <div className="w-[1px] h-[20px] bg-[rgba(255,255,255,0.08)] mx-[4px]"></div>
        )}

        <button className="flex items-center gap-[7px] py-[9px] px-[18px] border-none bg-transparent rounded-[16px] text-[13px] font-medium text-[#94A3B8] cursor-pointer transition-all duration-250 whitespace-nowrap hover:text-white hover:bg-[rgba(255,255,255,0.07)]">
          <Save className="w-[16px] h-[16px]" />
          Save
        </button>

        <button className="flex items-center gap-[7px] py-[9px] px-[18px] border-none bg-transparent rounded-[16px] text-[13px] font-medium text-[#94A3B8] cursor-pointer transition-all duration-250 whitespace-nowrap hover:text-white hover:bg-[rgba(255,255,255,0.07)]">
          <Copy className="w-[16px] h-[16px]" />
          Duplicate
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-[7px] py-[9px] px-[18px] border-none bg-transparent rounded-[16px] text-[13px] font-medium text-[#94A3B8] cursor-pointer transition-all duration-250 whitespace-nowrap hover:text-white hover:bg-[rgba(255,255,255,0.07)]"
          >
            <Download className="w-[16px] h-[16px]" />
            Export
          </button>
          
          {exportOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] bg-[rgba(7,34,61,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[6px] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-[1000] block animate-in fade-in zoom-in-95 duration-200">
              <button className="flex items-center gap-[10px] w-full py-[10px] px-[14px] bg-transparent text-[#CBD5E1] border-none rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white group">
                <Download className="w-[15px] h-[15px] shrink-0" />
                PNG 
                <span className="ml-auto text-[11px] text-[#475569] group-hover:text-[#94A3B8]">1920×1080</span>
              </button>
              <button className="flex items-center gap-[10px] w-full py-[10px] px-[14px] bg-transparent text-[#CBD5E1] border-none rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white group">
                <Download className="w-[15px] h-[15px] shrink-0" />
                JPEG 
                <span className="ml-auto text-[11px] text-[#475569] group-hover:text-[#94A3B8]">1920×1080 · 92%</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-[14px]">
        <div className="flex items-center gap-[7px] text-[12px] text-[#64748B] font-medium">
          <div className="w-[6px] h-[6px] rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          Auto-saved
        </div>
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#095DC3] to-[#2896FB] flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer shadow-[0_0_0_2px_rgba(0,178,169,0.15)]">
          SC
        </div>
      </div>
    </div>
  );
}
