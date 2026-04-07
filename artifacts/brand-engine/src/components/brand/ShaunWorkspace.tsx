import { useState, useMemo } from "react";
import { Check, Image as ImageIcon } from "lucide-react";

const SHAUN_IMAGES = [
  "ShaunClark_03057_StudioSura-Photoroom.png",
  "ShaunClark_03096_StudioSura-Photoroom.png",
  "ShaunClark_03141_StudioSura-Photoroom.png",
  "ShaunClark_03182_StudioSura-Photoroom.png",
  "ShaunClark_03235_StudioSura-Photoroom.png",
  "ShaunClark_03269_StudioSura-Photoroom.png"
];

const BASE_URL = `${import.meta.env.BASE_URL}assets/shaun/`;

type Position = "left" | "center" | "right";

export function ShaunWorkspace() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>("right");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");

  const wordCount = useMemo(() => {
    const words = headline.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }, [headline]);

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0">
      
      {/* Left Controls */}
      <div className="w-[380px] min-w-[380px] overflow-y-auto pt-[20px] px-[28px] pb-[28px] border-r border-[rgba(255,255,255,0.06)] flex flex-col">
        <div className="pt-[20px] pb-[16px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[12px]">Select Shaun</div>
          
          <div className="flex gap-[12px] overflow-x-auto pb-[6px] snap-x scroll-p-[12px] hide-scrollbar">
            {SHAUN_IMAGES.map((img, i) => {
              const isActive = activeImage === img;
              const url = `${BASE_URL}${img}`;
              return (
                <div 
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`shrink-0 w-[88px] h-[88px] rounded-[16px] overflow-hidden cursor-pointer relative transition-all duration-250 border-[2px] bg-[rgba(255,255,255,0.02)] snap-start
                    ${isActive 
                      ? 'border-[#00B2A9] shadow-[0_0_0_2px_rgba(3,11,23,0.8),0_0_0_4px_rgba(0,178,169,0.4)]' 
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,178,169,0.2)] hover:-translate-y-[2px]'}`}
                >
                  <img src={url} alt={`Shaun ${i+1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  
                  <div className={`absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-[#00B2A9] flex items-center justify-center transition-all duration-250
                    ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.6]'}`}>
                    <Check className="w-[12px] h-[12px] text-white stroke-[3px]" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 pt-[16px] px-[6px] pb-[5px] bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent text-[9px] font-semibold text-[rgba(255,255,255,0.8)] text-center uppercase">
                    Pose {i+1}
                  </div>
                </div>
              );
            })}
          </div>
          
          {activeImage && (
            <div className="flex items-center gap-[12px] mt-[12px] animate-in fade-in duration-300">
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B]">Position</span>
              <div className="flex gap-[6px]">
                {(['left', 'center', 'right'] as Position[]).map(pos => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`flex-1 py-[6px] px-[8px] border rounded-[8px] font-inherit text-[10px] font-semibold cursor-pointer text-center capitalize transition-all
                      ${position === pos 
                        ? 'border-[rgba(0,178,169,0.25)] text-[#00B2A9] bg-[rgba(0,178,169,0.08)]' 
                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#64748B] hover:border-[rgba(0,178,169,0.15)] hover:text-[#CBD5E1]'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-[12px] py-[8px] pb-[20px]">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] flex items-center justify-between">
              Headline
              <span className="text-[10px] font-medium text-[#475569] normal-case tracking-normal">{wordCount} words</span>
            </label>
            <input 
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Enter bold headline..."
              maxLength={60}
              className="w-full py-[14px] px-[18px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[18px] font-bold text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] flex items-center justify-between">
              Subtext
            </label>
            <input 
              type="text"
              value={subtext}
              onChange={e => setSubtext(e.target.value)}
              placeholder="Supporting text..."
              maxLength={40}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-inherit text-[13.5px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
        </div>
      </div>

      {/* Right Preview */}
      <div className="flex-1 flex flex-col min-w-0 pt-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]"></div>
            Live Preview
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center rounded-[28px] overflow-hidden bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] relative">
          <div className="flex justify-center items-center w-full h-full p-[32px]">
            <div className="w-full max-w-[720px] aspect-video rounded-[22px] relative overflow-hidden bg-gradient-to-br from-[#07223D] via-[#0A3366] to-[#095DC3] shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins']">
              
              <div className="absolute inset-0 z-0"></div>
              
              {activeImage ? (
                <img 
                  src={`${BASE_URL}${activeImage}`} 
                  crossOrigin="anonymous"
                  alt="Shaun Cutout" 
                  className={`absolute z-[2] bottom-0 h-[95%] object-contain drop-shadow-[0_0_30px_rgba(0,178,169,0.3)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-400 ease-out
                    ${position === 'right' ? 'right-[2%]' : position === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-[2%]'}`}
                />
              ) : null}

              {(headline || subtext) ? (
                <div className="absolute z-[4] text-center w-[80%] left-1/2 bottom-[6%] -translate-x-1/2">
                  <div className="font-black text-[clamp(24px,3.8vw,48px)] leading-[0.92] uppercase bg-gradient-to-b from-[#FFFFFF] to-[#B8D4F0] text-transparent bg-clip-text drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {headline}
                  </div>
                  <div className="font-bold text-[clamp(10px,1.2vw,15px)] uppercase text-white mt-[8px] tracking-[2px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                    {subtext}
                  </div>
                </div>
              ) : null}

              {!activeImage && !headline && !subtext && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[10] text-center gap-[8px]">
                  <ImageIcon className="w-[32px] h-[32px] text-[rgba(255,255,255,0.25)] mb-[4px]" />
                  <p className="text-[14px] text-[rgba(255,255,255,0.35)] font-medium m-0">Select a Shaun photo and type a headline</p>
                  <span className="text-[11px] text-[rgba(255,255,255,0.2)]">Your thumbnail will preview here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
