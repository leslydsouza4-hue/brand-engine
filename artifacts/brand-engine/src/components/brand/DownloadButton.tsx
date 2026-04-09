import { useState, useRef, useEffect } from "react";
import { Download, Loader2, FileText } from "lucide-react";

interface DownloadButtonProps {
  onExport: (format: "png" | "jpeg" | "pdf") => void;
  isExporting: boolean;
  label?: string;
}

export function DownloadButton({ onExport, isExporting, label = "Download" }: DownloadButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handle = (format: "png" | "jpeg" | "pdf") => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-[12px] h-[12px] animate-spin" />
        ) : (
          <Download className="w-[12px] h-[12px]" />
        )}
        {isExporting ? "Exporting..." : label}
      </button>

      {open && !isExporting && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-[rgba(7,34,61,0.95)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.1)] rounded-[10px] p-[4px] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] z-[1000]">
          <button
            onClick={() => handle("png")}
            className="flex items-center gap-[8px] w-full py-[8px] px-[12px] bg-transparent text-[#CBD5E1] border-none rounded-[7px] text-[11px] font-medium cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
          >
            <Download className="w-[12px] h-[12px] shrink-0" />
            PNG
            <span className="ml-auto text-[9px] text-[#475569] group-hover:text-[#94A3B8]">High Res</span>
          </button>
          <button
            onClick={() => handle("jpeg")}
            className="flex items-center gap-[8px] w-full py-[8px] px-[12px] bg-transparent text-[#CBD5E1] border-none rounded-[7px] text-[11px] font-medium cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
          >
            <Download className="w-[12px] h-[12px] shrink-0" />
            JPEG
            <span className="ml-auto text-[9px] text-[#475569] group-hover:text-[#94A3B8]">92%</span>
          </button>
          <div className="h-[1px] bg-white/[0.06] my-[2px] mx-[6px]" />
          <button
            onClick={() => handle("pdf")}
            className="flex items-center gap-[8px] w-full py-[8px] px-[12px] bg-transparent text-[#CBD5E1] border-none rounded-[7px] text-[11px] font-medium cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white group"
          >
            <FileText className="w-[12px] h-[12px] shrink-0" />
            PDF
            <span className="ml-auto text-[9px] text-[#475569] group-hover:text-[#94A3B8]">Document</span>
          </button>
        </div>
      )}
    </div>
  );
}
