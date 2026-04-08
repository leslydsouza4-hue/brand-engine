import { useState } from "react";
import { Check } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const BG_OPTIONS = [
  { id: "small-planet", name: "Small Planet", file: "Type=Small Planet Bottom Right.png" },
  { id: "centered-planet", name: "Centered Planet", file: "Type=Centered Planet.png" },
  { id: "planet-bottom-right", name: "Planet Bottom Right", file: "Type=Planet Bottom Right.png" },
];

export function ZoomWorkspace() {
  const [activeBg, setActiveBg] = useState(BG_OPTIONS[0]);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");

  const bgUrl = `${BASE}assets/backgrounds-dark/${activeBg.file}`;

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      <div className="w-full md:w-[400px] md:min-w-[400px] overflow-y-auto pt-[20px] px-[16px] md:px-[28px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="text-[16px] font-bold text-white mb-[4px]">Zoom Background</div>
        <div className="text-[12px] text-[#64748B] mb-[20px] leading-[1.5]">Branded virtual background for Zoom, Meet & Teams. Pick a background, add your name, and export.</div>

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px]">Background</div>

        <div className="flex gap-[10px] mb-[24px]">
          {BG_OPTIONS.map((bg) => {
            const isActive = activeBg.id === bg.id;
            const thumbUrl = `${BASE}assets/backgrounds-dark/${bg.file}`;
            return (
              <div
                key={bg.id}
                onClick={() => setActiveBg(bg)}
                className={`flex-1 aspect-video rounded-[12px] overflow-hidden cursor-pointer relative border-[2px] transition-all duration-300
                  ${isActive
                    ? 'border-[#00B2A9] shadow-[0_0_0_2px_rgba(3,11,23,0.8),0_0_0_4px_rgba(0,178,169,0.4)]'
                    : 'border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)]'}`}
              >
                <img src={thumbUrl} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute top-[5px] right-[5px] w-[20px] h-[20px] rounded-full bg-[#00B2A9] flex items-center justify-center transition-all duration-250 z-10
                  ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.6]'}`}>
                  <Check className="w-[11px] h-[11px] text-white stroke-[3px]" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px]">Details</div>

        <div className="flex flex-col gap-[12px] pb-[16px]">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tyler Jorgenson"
              maxLength={30}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[16px] font-bold text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] block">Designation / Title</label>
            <input
              type="text"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="e.g. Sr. Director of Integrated Marketing"
              maxLength={50}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-inherit text-[13.5px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pt-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]"></div>
            Live Preview
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center p-[32px]">
          <div data-export-preview data-export-name={[name, designation].filter(Boolean).join(" - ") || "Zoom Background"} className="w-full max-w-[720px] aspect-video rounded-[22px] relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins']">

            <img
              src={bgUrl}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-500"
            />

            {(name || designation) && (
              <div className="absolute top-[22%] left-[4%] z-[4]">
                {name && (
                  <div className="font-['Poppins'] font-extrabold text-[clamp(14px,2.2vw,28px)] leading-[1.05] text-[#20EDF1] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] uppercase tracking-[-0.5px]">
                    {name}
                  </div>
                )}
                {designation && (
                  <div className="font-['Poppins'] font-medium text-[clamp(9px,1.1vw,14px)] text-[rgba(255,255,255,0.7)] mt-[4px] tracking-[0.3px]">
                    {designation}
                  </div>
                )}
              </div>
            )}

            {!name && !designation && (
              <div className="absolute top-[22%] left-[4%] z-[4]">
                <div className="font-['Poppins'] font-extrabold text-[clamp(14px,2.2vw,28px)] leading-[1.05] text-[rgba(32,237,241,0.2)] uppercase tracking-[-0.5px]">
                  YOUR NAME
                </div>
                <div className="font-['Poppins'] font-medium text-[clamp(9px,1.1vw,14px)] text-[rgba(255,255,255,0.15)] mt-[4px] tracking-[0.3px]">
                  Your Title Here
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
