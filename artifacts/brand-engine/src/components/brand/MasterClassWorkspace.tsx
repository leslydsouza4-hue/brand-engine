import { GraduationCap, UploadCloud, ImageIcon, FileImage, Sparkles } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export function MasterClassWorkspace() {
  const expectedAssets = [
    { name: "background.png", label: "Horizontal background", dim: "1920 × 1080" },
    { name: "background-square.png", label: "Square background", dim: "1080 × 1080" },
    { name: "background-portrait.png", label: "Portrait background", dim: "1080 × 1350" },
    { name: "logo-light.png", label: "Master Class logo (light/transparent)", dim: "PNG, transparent" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-[#060B16] via-[#091224] to-[#060B16]">
      <div className="max-w-[920px] mx-auto px-[28px] py-[48px]">
        {/* Header */}
        <div className="flex items-center gap-[14px] mb-[10px]">
          <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center bg-gradient-to-br from-[#00B2A9] via-[#2896FB] to-[#A855F7] shadow-[0_4px_24px_rgba(40,150,251,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
            <GraduationCap className="w-[22px] h-[22px] text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[22px] font-bold text-white tracking-[-0.4px] leading-tight">Master Class</div>
            <div className="text-[12.5px] text-[#94A3B8]">Promo templates for HighLevel masterclass sessions</div>
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-[28px] mb-[28px] rounded-[16px] border border-[rgba(255,195,40,0.22)] bg-[rgba(255,195,40,0.06)] p-[18px] flex items-start gap-[14px]">
          <Sparkles className="w-[18px] h-[18px] text-[#FFC328] mt-[1px] shrink-0" />
          <div className="flex-1">
            <div className="text-[13px] font-bold text-white mb-[4px]">Waiting on your assets</div>
            <div className="text-[12px] text-[#CBD5E1] leading-[1.55]">
              Once you drop the background images, logo, and a reference layout, I'll wire up the templates exactly like Virtual Workshop and Super Promo — same headline / date / guest pill / CTA controls and one-click multi-format export.
            </div>
          </div>
        </div>

        {/* Required assets list */}
        <div className="mb-[28px]">
          <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-[12px]">Drop these in <span className="text-[#2896FB]">/public/assets/masterclass/</span></div>
          <div className="rounded-[16px] border border-white/[0.06] bg-[rgba(255,255,255,0.02)] divide-y divide-white/[0.04] overflow-hidden">
            {expectedAssets.map((a) => (
              <div key={a.name} className="flex items-center gap-[14px] px-[18px] py-[14px]">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-[rgba(40,150,251,0.10)] border border-[rgba(40,150,251,0.22)] flex items-center justify-center shrink-0">
                  {a.name.startsWith("logo") ? (
                    <ImageIcon className="w-[16px] h-[16px] text-[#2896FB]" />
                  ) : (
                    <FileImage className="w-[16px] h-[16px] text-[#2896FB]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-white">{a.name}</div>
                  <div className="text-[11px] text-[#94A3B8]">{a.label} · {a.dim}</div>
                </div>
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] bg-white/[0.04] border border-white/[0.06] px-[8px] py-[3px] rounded-[5px]">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reference upload hint */}
        <div className="rounded-[16px] border border-dashed border-white/[0.10] bg-[rgba(255,255,255,0.015)] p-[24px] flex items-center gap-[18px]">
          <div className="w-[48px] h-[48px] rounded-[12px] bg-gradient-to-br from-[#0F1B33] to-[#0A1424] border border-white/[0.06] flex items-center justify-center shrink-0">
            <UploadCloud className="w-[22px] h-[22px] text-[#94A3B8]" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-white mb-[3px]">Send me the reference</div>
            <div className="text-[12px] text-[#94A3B8] leading-[1.55]">
              Paste the reference image into chat and I'll match the layout, type hierarchy, gradient, and accent colors exactly. Tell me which sizes you need (horizontal / square / portrait) and any variants like Day 1, Replays, or CTA.
            </div>
          </div>
        </div>

        {/* Sister-tool reference */}
        <div className="mt-[28px] flex items-center gap-[10px] text-[11.5px] text-[#64748B]">
          <span>Modeled on:</span>
          <a href="#bizdev-templates" className="px-[10px] py-[4px] rounded-[6px] bg-white/[0.03] border border-white/[0.06] text-[#CBD5E1] hover:text-white hover:bg-white/[0.06] transition-all">
            Virtual Workshop
          </a>
          <a href="#super-promo" className="px-[10px] py-[4px] rounded-[6px] bg-white/[0.03] border border-white/[0.06] text-[#CBD5E1] hover:text-white hover:bg-white/[0.06] transition-all">
            Super Promo
          </a>
          <span className="text-[#64748B] ml-auto">Logo preview: <code className="text-[#2896FB]">{BASE}assets/masterclass/logo-light.png</code></span>
        </div>
      </div>
    </div>
  );
}
