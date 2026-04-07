import { useState, useMemo, useRef } from "react";
import { Check, Image as ImageIcon, UploadCloud, X, Monitor } from "lucide-react";

const SHAUN_IMAGES = [
  "ShaunClark_03057_StudioSura-Photoroom.png",
  "ShaunClark_03096_StudioSura-Photoroom.png",
  "ShaunClark_03141_StudioSura-Photoroom.png",
  "ShaunClark_03182_StudioSura-Photoroom.png",
  "ShaunClark_03235_StudioSura-Photoroom.png",
  "ShaunClark_03269_StudioSura-Photoroom.png"
];

const BASE_URL = `${import.meta.env.BASE_URL}assets/shaun/`;
const BG_URL = `${import.meta.env.BASE_URL}assets/backgrounds-dark/Type=Core Gradient.png`;

type Position = "left" | "center" | "right";

export function ShaunWorkspace() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>("right");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [stripText, setStripText] = useState("FEATURE UPDATES");

  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [screenshotOpacity, setScreenshotOpacity] = useState(40);
  const [screenshotScale, setScreenshotScale] = useState(85);
  const [screenshotRadius, setScreenshotRadius] = useState(16);
  const [screenshotOffsetX, setScreenshotOffsetX] = useState(0);
  const [screenshotOffsetY, setScreenshotOffsetY] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => {
    const words = headline.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }, [headline]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearScreenshot = () => {
    setScreenshotImage(null);
    setScreenshotOpacity(40);
    setScreenshotScale(85);
    setScreenshotRadius(16);
    setScreenshotOffsetX(0);
    setScreenshotOffsetY(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0">
      
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
                  <img src={url} alt={`Shaun ${i+1}`} className="w-full h-full object-cover" />
                  
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
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] flex items-center justify-between">
              Strip Banner
            </label>
            <input 
              type="text"
              value={stripText}
              onChange={e => setStripText(e.target.value)}
              placeholder="e.g. FEATURE UPDATES"
              maxLength={30}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[13.5px] font-bold text-[#E2E8F0] uppercase outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] placeholder:normal-case placeholder:font-normal"
            />
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[12px]">Screenshot / Image</div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleScreenshotUpload}
            accept="image/*" 
            className="hidden" 
          />

          <div 
            onClick={() => !screenshotImage && fileInputRef.current?.click()}
            className={`flex items-center gap-[14px] py-[14px] px-[16px] rounded-[16px] transition-all duration-250 relative overflow-hidden mb-[14px]
              ${screenshotImage 
                ? 'border-solid border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] cursor-default' 
                : 'border-dashed border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] hover:bg-[rgba(0,178,169,0.03)] cursor-pointer'}`}
          >
            <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0
              ${screenshotImage ? 'bg-[rgba(0,178,169,0.1)]' : 'bg-[rgba(255,255,255,0.04)]'}`}>
              {screenshotImage 
                ? <Monitor className="w-[16px] h-[16px] text-[#00B2A9]" />
                : <UploadCloud className="w-[16px] h-[16px] text-[#64748B]" />
              }
            </div>
            <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1">
              {screenshotImage ? 'Image uploaded' : 'Upload screenshot or image'}
              <span className="block text-[10.5px] text-[#64748B] mt-[2px]">
                {screenshotImage ? 'Renders behind Shaun as a depth layer' : 'PNG, JPG — renders behind Shaun'}
              </span>
            </div>
            {screenshotImage && (
              <button 
                onClick={(e) => { e.stopPropagation(); clearScreenshot(); }}
                className="ml-auto w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[6px] text-[#64748B] flex items-center justify-center cursor-pointer shrink-0 hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D]"
              >
                <X className="w-[12px] h-[12px]" />
              </button>
            )}
          </div>

          {screenshotImage && (
            <div className="flex flex-col gap-[14px] animate-in fade-in duration-300">
              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Opacity <span className="font-semibold text-[#94A3B8]">{screenshotOpacity}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" value={screenshotOpacity}
                    onChange={e => setScreenshotOpacity(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Scale <span className="font-semibold text-[#94A3B8]">{screenshotScale}%</span>
                  </div>
                  <input 
                    type="range" min="30" max="120" value={screenshotScale}
                    onChange={e => setScreenshotScale(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
              </div>

              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Radius <span className="font-semibold text-[#94A3B8]">{screenshotRadius}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="40" value={screenshotRadius}
                    onChange={e => setScreenshotRadius(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Offset X <span className="font-semibold text-[#94A3B8]">{screenshotOffsetX}</span>
                  </div>
                  <input 
                    type="range" min="-40" max="40" value={screenshotOffsetX}
                    onChange={e => setScreenshotOffsetX(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
              </div>

              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Offset Y <span className="font-semibold text-[#94A3B8]">{screenshotOffsetY}</span>
                  </div>
                  <input 
                    type="range" min="-30" max="30" value={screenshotOffsetY}
                    onChange={e => setScreenshotOffsetY(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
                <div className="flex-1"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pt-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]"></div>
            Live Preview
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center rounded-[28px] overflow-hidden bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] relative">
          <div className="flex justify-center items-center w-full h-full p-[32px]">
            <div data-export-preview className="w-full max-w-[720px] aspect-video rounded-[22px] relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins']">
              
              <img 
                src={BG_URL} 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              {stripText && (
                <div className="absolute top-[16%] left-[3.5%] z-[6]">
                  <div
                    className="relative rounded-[clamp(3px,0.6vw,6px)] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    style={{
                      background: 'linear-gradient(100deg, rgba(30,80,180,0.85) 0%, rgba(60,140,240,0.8) 100%)',
                    }}
                  >
                    <div className="absolute inset-0 bg-[rgba(255,255,255,0.06)]" />
                    <div className="relative py-[clamp(3px,0.55vw,6px)] px-[clamp(8px,1.4vw,16px)]">
                      <div className="font-['Poppins'] font-bold text-white text-[clamp(6px,0.85vw,10px)] uppercase tracking-[1.8px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                        {stripText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {screenshotImage && (
                <div 
                  className="absolute z-[1] transition-all duration-300"
                  style={{
                    top: `${50 + screenshotOffsetY}%`,
                    left: `${50 + screenshotOffsetX}%`,
                    transform: `translate(-50%, -50%) scale(${screenshotScale / 100})`,
                    opacity: screenshotOpacity / 100,
                    width: '80%',
                  }}
                >
                  <img 
                    src={screenshotImage} 
                    alt="Screenshot" 
                    className="w-full h-auto object-contain shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                    style={{ borderRadius: `${screenshotRadius}px` }}
                  />
                </div>
              )}
              
              {activeImage ? (
                <img 
                  src={`${BASE_URL}${activeImage}`} 
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

              {!activeImage && !headline && !subtext && !screenshotImage && (
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
