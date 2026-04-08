import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Check, Image as ImageIcon, UploadCloud, X, Monitor, Move, RotateCcw, Link2, Loader2, Sparkles } from "lucide-react";

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

export function ShaunWorkspace() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [stripText, setStripText] = useState("FEATURE UPDATES");

  const [shaunX, setShaunX] = useState(75);
  const [shaunY, setShaunY] = useState(50);
  const [shaunScale, setShaunScale] = useState(95);
  const [isDragging, setIsDragging] = useState(false);

  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [screenshotOpacity, setScreenshotOpacity] = useState(40);
  const [screenshotScale, setScreenshotScale] = useState(85);
  const [screenshotRadius, setScreenshotRadius] = useState(16);
  const [screenshotOffsetX, setScreenshotOffsetX] = useState(0);
  const [screenshotOffsetY, setScreenshotOffsetY] = useState(0);

  const [descriptUrl, setDescriptUrl] = useState("");
  const [descriptLoading, setDescriptLoading] = useState(false);
  const [descriptError, setDescriptError] = useState<string | null>(null);
  const [descriptLoaded, setDescriptLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!activeImage || !previewRef.current) return;
    setIsDragging(true);
    dragStartRef.current = { startX: clientX, startY: clientY, origX: shaunX, origY: shaunY };
  }, [activeImage, shaunX, shaunY]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = ((clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dy = ((clientY - dragStartRef.current.startY) / rect.height) * 100;
    setShaunX(Math.max(0, Math.min(100, dragStartRef.current.origX + dx)));
    setShaunY(Math.max(0, Math.min(100, dragStartRef.current.origY + dy)));
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const resetShaunPosition = () => { setShaunX(75); setShaunY(50); setShaunScale(95); };

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

  const handleDescriptFetch = async () => {
    const url = descriptUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/share\.descript\.com\/view\/[\w-]+/.test(url)) {
      setDescriptError("Please enter a valid Descript share link");
      return;
    }
    setDescriptLoading(true);
    setDescriptError(null);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/descript/fetch-meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch" }));
        throw new Error(err.error || "Failed to fetch");
      }
      const data = await res.json();
      if (data.title) setHeadline(data.title);
      if (data.image) {
        setScreenshotImage(data.image);
        setScreenshotOpacity(40);
        setScreenshotScale(85);
        setScreenshotRadius(16);
        setScreenshotOffsetX(0);
        setScreenshotOffsetY(0);
      }
      setDescriptLoaded(true);
    } catch (err: any) {
      setDescriptError(err.message || "Something went wrong");
    } finally {
      setDescriptLoading(false);
    }
  };

  const clearDescript = () => {
    setDescriptUrl("");
    setDescriptLoaded(false);
    setDescriptError(null);
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      
      <div className="w-full md:w-[380px] md:min-w-[380px] overflow-y-auto pt-[20px] px-[16px] md:px-[28px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
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
            <div className="mt-[12px] animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] flex items-center gap-[5px]">
                  <Move className="w-[11px] h-[11px]" />
                  Position & Size
                </span>
                <button
                  onClick={resetShaunPosition}
                  className="flex items-center gap-[4px] py-[3px] px-[8px] rounded-[6px] border border-[rgba(255,255,255,0.06)] bg-transparent text-[10px] font-medium text-[#64748B] cursor-pointer hover:text-[#00B2A9] hover:border-[rgba(0,178,169,0.2)] transition-all"
                >
                  <RotateCcw className="w-[9px] h-[9px]" />
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-[6px] mb-[6px] p-[8px] rounded-[10px] bg-[rgba(0,178,169,0.04)] border border-[rgba(0,178,169,0.1)]">
                <Move className="w-[12px] h-[12px] text-[#00B2A9] shrink-0" />
                <span className="text-[10px] text-[#00B2A9] font-medium">Drag Shaun in the live preview to reposition</span>
              </div>
              <div className="flex gap-[6px] mb-[6px]">
                {[
                  { label: "Left", x: 22, y: 50 },
                  { label: "Center", x: 50, y: 50 },
                  { label: "Right", x: 75, y: 50 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setShaunX(preset.x); setShaunY(preset.y); }}
                    className={`flex-1 py-[6px] px-[8px] border rounded-[8px] font-inherit text-[10px] font-semibold cursor-pointer text-center capitalize transition-all
                      ${Math.abs(shaunX - preset.x) < 5 && Math.abs(shaunY - preset.y) < 5
                        ? 'border-[rgba(0,178,169,0.25)] text-[#00B2A9] bg-[rgba(0,178,169,0.08)]' 
                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#64748B] hover:border-[rgba(0,178,169,0.15)] hover:text-[#CBD5E1]'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[4px]">
                  Scale <span className="font-semibold text-[#94A3B8]">{shaunScale}%</span>
                </div>
                <input 
                  type="range" min="40" max="150" value={shaunScale}
                  onChange={e => setShaunScale(Number(e.target.value))}
                  className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px] flex items-center gap-[6px]">
            <Sparkles className="w-[12px] h-[12px] text-[#2896FB]" />
            Descript Auto-Fill
          </div>
          <div className="flex gap-[6px]">
            <div className="relative flex-1">
              <Link2 className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#475569] pointer-events-none" />
              <input
                type="text"
                value={descriptUrl}
                onChange={e => { setDescriptUrl(e.target.value); setDescriptLoaded(false); setDescriptError(null); }}
                onKeyDown={e => { if (e.key === "Enter") handleDescriptFetch(); }}
                placeholder="Paste Descript share link..."
                className="w-full py-[10px] pl-[34px] pr-[10px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
                disabled={descriptLoading}
              />
            </div>
            {descriptLoaded ? (
              <button
                onClick={clearDescript}
                className="shrink-0 w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,178,169,0.1)] border border-[rgba(0,178,169,0.2)] flex items-center justify-center cursor-pointer text-[#00B2A9] hover:bg-[rgba(0,178,169,0.15)] transition-all"
              >
                <Check className="w-[14px] h-[14px]" />
              </button>
            ) : (
              <button
                onClick={handleDescriptFetch}
                disabled={descriptLoading || !descriptUrl.trim()}
                className="shrink-0 h-[36px] px-[14px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none flex items-center gap-[6px] cursor-pointer text-white text-[11px] font-semibold transition-all hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {descriptLoading ? (
                  <Loader2 className="w-[13px] h-[13px] animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-[12px] h-[12px]" />
                    Fetch
                  </>
                )}
              </button>
            )}
          </div>
          {descriptError && (
            <div className="mt-[6px] text-[10px] text-[#FF6B6B] font-medium">{descriptError}</div>
          )}
          {descriptLoaded && (
            <div className="mt-[6px] text-[10px] text-[#00B2A9] font-medium flex items-center gap-[4px]">
              <Check className="w-[10px] h-[10px]" />
              Title & thumbnail loaded from Descript
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
            <div ref={previewRef} data-export-preview className={`w-full max-w-[720px] aspect-video rounded-[22px] relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins'] ${activeImage ? 'cursor-grab' : ''} ${isDragging ? '!cursor-grabbing' : ''}`}>
              
              <img 
                src={BG_URL} 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              {stripText && (
                <div className="absolute top-[16%] left-0 z-[6] whitespace-nowrap rounded-r-[clamp(3px,0.5vw,6px)] overflow-hidden shadow-[2px_2px_12px_rgba(0,0,0,0.3)]"
                  style={{ background: 'linear-gradient(135deg, #095DC3 0%, #2896FB 40%, #00B2A9 100%)' }}
                >
                  <div className="absolute inset-0 bg-[rgba(255,255,255,0.06)]" />
                  <div className="relative py-[clamp(2px,0.4vw,5px)] pl-[24px] pr-[clamp(10px,1.4vw,16px)] font-['Poppins'] font-bold text-white text-[clamp(5px,0.7vw,8px)] uppercase tracking-[2.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  >
                    {stripText}
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
                  onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
                  onTouchStart={(e) => { if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
                  draggable={false}
                  className={`absolute z-[2] object-contain drop-shadow-[0_0_30px_rgba(0,178,169,0.3)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] select-none
                    ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                  style={{
                    left: `${shaunX}%`,
                    top: `${shaunY}%`,
                    transform: `translate(-50%, -50%) scale(${shaunScale / 100})`,
                    height: '95%',
                  }}
                />
              ) : null}

              {(headline || subtext) ? (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-[45%] z-[3] pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)" }}
                  />
                  <div className="absolute z-[4] text-center w-[80%] left-1/2 bottom-[6%] -translate-x-1/2">
                    <div className="font-black text-[clamp(16px,2.5vw,31px)] leading-[0.95] uppercase text-white"
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 4px 12px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(0,0,0,0.5))",
                      }}
                    >
                      {headline}
                    </div>
                    <div className="font-bold text-[clamp(7px,0.8vw,10px)] uppercase text-white mt-[6px] tracking-[2px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                      {subtext}
                    </div>
                  </div>
                </>
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
