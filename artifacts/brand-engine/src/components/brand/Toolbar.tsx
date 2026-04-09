import { Menu } from "lucide-react";

interface ToolbarProps {
  onMenuToggle?: () => void;
}

export function Toolbar({ onMenuToggle }: ToolbarProps) {
  return (
    <div className="md:hidden flex items-center py-[14px] px-[16px] relative z-50">
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
      >
        <Menu className="w-[20px] h-[20px]" />
      </button>
    </div>
  );
}
