import { type ReactNode } from "react";

interface LivePreviewProps {
  children: ReactNode;
  className?: string;
}

export function LivePreview({ children, className = "" }: LivePreviewProps) {
  return (
    <div className={`flex-1 flex flex-col min-w-0 min-h-0 pt-[20px] px-[24px] pb-[24px] ${className}`}>
      <div className="flex items-center justify-between pb-[14px] shrink-0">
        <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]" />
          Live Preview
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center rounded-[28px] overflow-hidden bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] relative">
        <div className="flex justify-center items-center w-full h-full p-[32px]">
          {children}
        </div>
      </div>
    </div>
  );
}
