import { Sparkles } from "lucide-react";

export function AffiliateBlurbWorkspace() {
  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden">
      <div className="text-center max-w-[420px] px-[24px]">
        <div className="w-[56px] h-[56px] rounded-[16px] mx-auto mb-[18px] flex items-center justify-center bg-gradient-to-br from-[#00B2A9] to-[#2896FB] shadow-[0_8px_30px_rgba(40,150,251,0.3)]">
          <Sparkles className="w-[24px] h-[24px] text-white" />
        </div>
        <div className="text-[22px] font-black text-white tracking-[-0.4px] mb-[8px]">Affiliate Blurb</div>
        <div className="text-[13px] text-[#94A3B8] leading-[1.5]">
          Coming soon — short, punchy promo copy you can drop into emails and social posts.
        </div>
      </div>
    </div>
  );
}
