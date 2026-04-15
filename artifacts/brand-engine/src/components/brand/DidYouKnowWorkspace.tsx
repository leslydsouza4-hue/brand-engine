import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Check, Image as ImageIcon, UploadCloud, X, Monitor, Move, RotateCcw, Crop, Lightbulb, LayoutGrid } from "lucide-react";
import { CropModal } from "./CropModal";
import { LivePreview } from "./LivePreview";
import { DownloadButton } from "./DownloadButton";
import { useExport } from "./useExport";

interface TeamMember {
  id: string;
  name: string;
  assetBase: string;
  images: string[];
}

const BASE = import.meta.env.BASE_URL;

const TEAM: TeamMember[] = [
  {
    id: "andrew",
    name: "Andrew George",
    assetBase: `${BASE}assets/did-you-know/andrew/`,
    images: [
      "andrew-pose-1.png",
      "andrew-pose-2.png",
      "andrew-pose-3.png",
      "andrew-pose-4.png",
      "andrew-pose-5.png",
      "andrew-pose-6.png",
      "andrew-pose-7.png",
    ],
  },
  {
    id: "ben",
    name: "Ben Stutzner",
    assetBase: `${BASE}assets/did-you-know/ben/`,
    images: Array.from({ length: 10 }, (_, i) => `ben-pose-${i + 1}.png`),
  },
  {
    id: "usma",
    name: "Usma",
    assetBase: `${BASE}assets/did-you-know/usma/`,
    images: Array.from({ length: 4 }, (_, i) => `usma-pose-${i + 1}.png`),
  },
];

const BG_URL = `${BASE}assets/did-you-know/bg.png`;
const ORBIT_URL = `${BASE}assets/did-you-know/orbit-rings.png`;

type ThumbnailLayout = "text-left" | "text-right";

const LAYOUT_PRESETS: Record<ThumbnailLayout, { personX: number; personY: number; orbitX: number; orbitY: number; label: string; desc: string }> = {
  "text-left":  { personX: 78, personY: 55, orbitX: 78, orbitY: 85, label: "Text Left",  desc: "Person right" },
  "text-right": { personX: 22, personY: 55, orbitX: 22, orbitY: 85, label: "Text Right", desc: "Person left" },
};

const BADGE_STYLES = [
  { label: "Green", bg: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)" },
  { label: "Electric Blue", bg: "linear-gradient(135deg, #2896FB 0%, #095DC3 100%)" },
  { label: "Teal", bg: "linear-gradient(135deg, #00B2A9 0%, #009688 100%)" },
  { label: "Gold", bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
  { label: "Purple", bg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" },
  { label: "Rose", bg: "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)" },
];

export function DidYouKnowWorkspace() {
  const { isExporting, handleExport } = useExport();

  const [layout, setLayout] = useState<ThumbnailLayout>("text-left");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [headlineWhite, setHeadlineWhite] = useState("");
  const [headlineHighlight, setHeadlineHighlight] = useState("");
  const [badgeStyle, setBadgeStyle] = useState(0);

  const [personX, setPersonX] = useState(78);
  const [personY, setPersonY] = useState(55);
  const [personScale, setPersonScale] = useState(95);

  const handleLayoutChange = (l: ThumbnailLayout) => {
    setLayout(l);
    const preset = LAYOUT_PRESETS[l];
    setPersonX(preset.personX);
    setPersonY(preset.personY);
  };

  const [isDragging, setIsDragging] = useState(false);

  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [screenshotOpacity, setScreenshotOpacity] = useState(40);
  const [screenshotScale, setScreenshotScale] = useState(85);
  const [screenshotRadius, setScreenshotRadius] = useState(16);
  const [screenshotOffsetX, setScreenshotOffsetX] = useState(0);
  const [screenshotOffsetY, setScreenshotOffsetY] = useState(0);
  const [screenshotStyle, setScreenshotStyle] = useState<"glow" | "float" | "neon" | "minimal" | "tilt" | "shadow" | "cinematic" | "glass">("glow");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const currentMember = TEAM.find(m => m.id === selectedMember);

  const memberImages = useMemo(() => {
    if (!currentMember) return [];
    return currentMember.images.map(img => ({
      filename: img,
      url: `${currentMember.assetBase}${img}`,
    }));
  }, [currentMember]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!activeImage || !previewRef.current) return;
    setIsDragging(true);
    dragStartRef.current = { startX: clientX, startY: clientY, origX: personX, origY: personY };
  }, [activeImage, personX, personY]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = ((clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dy = ((clientY - dragStartRef.current.startY) / rect.height) * 100;
    setPersonX(Math.max(0, Math.min(100, dragStartRef.current.origX + dx)));
    setPersonY(Math.max(0, Math.min(100, dragStartRef.current.origY + dy)));
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

  const resetPersonPosition = () => {
    const preset = LAYOUT_PRESETS[layout];
    setPersonX(preset.personX);
    setPersonY(preset.personY);
    setPersonScale(95);
  };

  const wordCount = useMemo(() => {
    const all = `${headlineWhite} ${headlineHighlight}`.trim().split(/\s+/).filter(w => w.length > 0);
    return all.length;
  }, [headlineWhite, headlineHighlight]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setScreenshotImage(event.target?.result as string); };
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
    setScreenshotStyle("glow");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [cropModalImage, setCropModalImage] = useState<string | null>(null);

  const handleCropApply = (croppedDataUrl: string) => {
    setScreenshotImage(croppedDataUrl);
    setCropModalImage(null);
  };

  const handleCropCancel = () => { setCropModalImage(null); };

  const currentPreset = LAYOUT_PRESETS[layout];

  const renderTextContent = () => {
    if (!headlineWhite && !headlineHighlight) return null;

    const align = layout === "text-left" ? "left" : "right";
    const posStyle = layout === "text-left"
      ? { top: "28%", left: "5%", right: "auto" }
      : { top: "28%", right: "5%", left: "auto" };

    return (
      <div
        className="absolute z-[4] w-[50%]"
        style={{ ...posStyle, textAlign: align }}
      >
        {headlineWhite && (
          <div
            className="font-['Poppins'] font-black text-white uppercase leading-[0.95]"
            style={{
              fontSize: 'clamp(16px, 3.2vw, 38px)',
              textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.3)',
            }}
          >
            {headlineWhite}
          </div>
        )}
        {headlineHighlight && (
          <div
            className="font-['Poppins'] font-black uppercase leading-[0.95]"
            style={{
              fontSize: 'clamp(16px, 3.2vw, 38px)',
              color: '#7CC8FF',
              textShadow: '0 2px 8px rgba(40,150,251,0.4), 0 0 30px rgba(40,150,251,0.2)',
              marginTop: headlineWhite ? '4px' : '0',
            }}
          >
            {headlineHighlight}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">

      <div className="w-full md:w-[380px] md:min-w-[380px] overflow-y-auto pt-[20px] px-[16px] md:px-[28px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">

        <div className="pt-[10px] pb-[16px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[12px]">Select Person</div>

          <div className="grid grid-cols-2 gap-[8px] mb-[14px]">
            {TEAM.map((member) => {
              const isActive = selectedMember === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member.id);
                    setActiveImage(null);
                  }}
                  className={`flex items-center gap-[10px] py-[10px] px-[12px] rounded-[12px] border cursor-pointer transition-all text-left
                    ${isActive
                      ? 'border-[#2896FB] bg-[rgba(40,150,251,0.08)] shadow-[0_0_0_1px_rgba(40,150,251,0.2)]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(40,150,251,0.2)] hover:bg-[rgba(40,150,251,0.03)]'
                    }`}
                >
                  <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0
                    ${isActive ? 'bg-[#2896FB] text-white' : 'bg-[rgba(255,255,255,0.06)] text-[#64748B]'}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[12px] font-semibold truncate ${isActive ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'}`}>
                      {member.name}
                    </span>
                    <span className="text-[9px] text-[#475569]">
                      {member.images.length} poses
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {currentMember && memberImages.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Select Pose</div>
              <div className="flex gap-[12px] overflow-x-auto pb-[6px] snap-x scroll-p-[12px] hide-scrollbar">
                {memberImages.map((img, i) => {
                  const isActive2 = activeImage === img.filename;
                  return (
                    <div
                      key={img.filename}
                      onClick={() => setActiveImage(img.filename)}
                      className={`shrink-0 w-[88px] h-[88px] rounded-[16px] overflow-hidden cursor-pointer relative transition-all duration-250 border-[2px] bg-[rgba(255,255,255,0.02)] snap-start
                        ${isActive2
                          ? 'border-[#2896FB] shadow-[0_0_0_2px_rgba(3,11,23,0.8),0_0_0_4px_rgba(40,150,251,0.4)]'
                          : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(40,150,251,0.2)] hover:-translate-y-[2px]'}`}
                    >
                      <img src={img.url} alt={`${currentMember.name} ${i+1}`} className="w-full h-full object-cover" />
                      <div className={`absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-[#2896FB] flex items-center justify-center transition-all duration-250
                        ${isActive2 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.6]'}`}>
                        <Check className="w-[12px] h-[12px] text-white stroke-[3px]" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 pt-[16px] px-[6px] pb-[5px] bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent text-[9px] font-semibold text-[rgba(255,255,255,0.8)] text-center uppercase">
                        Pose {i+1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeImage && currentMember && (
            <div className="mt-[12px] animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] flex items-center gap-[5px]">
                  <Move className="w-[11px] h-[11px]" />
                  Position & Size
                </span>
                <button
                  onClick={resetPersonPosition}
                  className="flex items-center gap-[4px] py-[3px] px-[8px] rounded-[6px] border border-[rgba(255,255,255,0.06)] bg-transparent text-[10px] font-medium text-[#64748B] cursor-pointer hover:text-[#2896FB] hover:border-[rgba(40,150,251,0.2)] transition-all"
                >
                  <RotateCcw className="w-[9px] h-[9px]" />
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-[6px] mb-[6px] p-[8px] rounded-[10px] bg-[rgba(40,150,251,0.04)] border border-[rgba(40,150,251,0.1)]">
                <Move className="w-[12px] h-[12px] text-[#2896FB] shrink-0" />
                <span className="text-[10px] text-[#2896FB] font-medium">Drag person in the live preview to reposition</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[4px]">
                  Scale <span className="font-semibold text-[#94A3B8]">{personScale}%</span>
                </div>
                <input
                  type="range" min="40" max="150" value={personScale}
                  onChange={e => setPersonScale(Number(e.target.value))}
                  className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px] flex items-center gap-[6px]">
            <LayoutGrid className="w-[12px] h-[12px] text-[#2896FB]" />
            Layout
          </div>
          <div className="flex gap-[6px] mb-[4px]">
            {(["text-left", "text-right"] as ThumbnailLayout[]).map((l) => {
              const preset = LAYOUT_PRESETS[l];
              const isActive = layout === l;
              return (
                <button
                  key={l}
                  onClick={() => handleLayoutChange(l)}
                  className={`flex-1 py-[8px] px-[6px] border rounded-[10px] font-inherit cursor-pointer text-center transition-all flex flex-col items-center gap-[2px]
                    ${isActive
                      ? 'border-[rgba(40,150,251,0.25)] text-[#2896FB] bg-[rgba(40,150,251,0.08)]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#64748B] hover:border-[rgba(40,150,251,0.15)] hover:text-[#CBD5E1]'}`}
                >
                  <span className="text-[11px] font-semibold">{preset.label}</span>
                  <span className="text-[8px] opacity-60">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Badge Style</div>
          <div className="grid grid-cols-3 gap-[6px]">
            {BADGE_STYLES.map((style, i) => (
              <button
                key={style.label}
                onClick={() => setBadgeStyle(i)}
                className={`py-[7px] px-[6px] rounded-[8px] text-[10px] font-semibold border cursor-pointer transition-all ${
                  badgeStyle === i
                    ? "border-[rgba(40,150,251,0.3)] text-white shadow-[0_0_12px_rgba(40,150,251,0.15)]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]"
                }`}
                style={badgeStyle === i ? { background: style.bg } : undefined}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[12px] border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] flex items-center justify-between">
              <span className="flex items-center gap-[6px]">
                <span className="w-[8px] h-[8px] rounded-full bg-white inline-block" />
                White Lines
              </span>
              <span className="text-[10px] font-medium text-[#475569] normal-case tracking-normal">{wordCount} words total</span>
            </label>
            <textarea
              value={headlineWhite}
              onChange={e => setHeadlineWhite(e.target.value)}
              placeholder="YOU CAN ADD TERMS & CONDITIONS"
              maxLength={80}
              rows={2}
              className="w-full py-[12px] px-[16px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[14px] font-bold text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] resize-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] flex items-center gap-[6px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#7CC8FF] inline-block" />
              Highlight Lines
            </label>
            <textarea
              value={headlineHighlight}
              onChange={e => setHeadlineHighlight(e.target.value)}
              placeholder="DIRECTLY TO PAYMENT FORMS IN HIGHLEVEL?"
              maxLength={80}
              rows={2}
              className="w-full py-[12px] px-[16px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[14px] font-bold text-[#7CC8FF] outline-none focus:border-[rgba(40,150,251,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[rgba(124,200,255,0.35)] resize-none"
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
                ? 'border-solid border border-[rgba(40,150,251,0.15)] bg-[rgba(40,150,251,0.04)] cursor-default'
                : 'border-dashed border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(40,150,251,0.2)] hover:bg-[rgba(40,150,251,0.03)] cursor-pointer'}`}
          >
            <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0
              ${screenshotImage ? 'bg-[rgba(40,150,251,0.1)]' : 'bg-[rgba(255,255,255,0.04)]'}`}>
              {screenshotImage
                ? <Monitor className="w-[16px] h-[16px] text-[#2896FB]" />
                : <UploadCloud className="w-[16px] h-[16px] text-[#64748B]" />
              }
            </div>
            <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1">
              {screenshotImage ? 'Image uploaded' : 'Upload screenshot or image'}
              <span className="block text-[10.5px] text-[#64748B] mt-[2px]">
                {screenshotImage ? 'Renders behind person as a depth layer' : 'PNG, JPG — renders behind person'}
              </span>
            </div>
            {screenshotImage && (
              <div className="ml-auto flex items-center gap-[4px] shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setCropModalImage(screenshotImage); }}
                  className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[6px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all"
                  title="Crop image"
                >
                  <Crop className="w-[12px] h-[12px]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); clearScreenshot(); }}
                  className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[6px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all"
                >
                  <X className="w-[12px] h-[12px]" />
                </button>
              </div>
            )}
          </div>

          {screenshotImage && (
            <div className="flex flex-col gap-[14px] animate-in fade-in duration-300">
              <div>
                <div className="text-[11px] font-medium text-[#64748B] mb-[6px]">Style</div>
                <div className="grid grid-cols-4 gap-[4px]">
                  {(["glow", "float", "neon", "minimal", "tilt", "shadow", "cinematic", "glass"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScreenshotStyle(s)}
                      className={`py-[6px] px-[4px] rounded-[8px] text-[9px] font-semibold border cursor-pointer transition-all capitalize ${
                        screenshotStyle === s
                          ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                          : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
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

          <div className="mt-auto pt-[16px]">
            <DownloadButton onExport={handleExport} isExporting={isExporting} label="Download Current" />
          </div>
        </div>
      </div>

      <LivePreview>
        <div
          ref={previewRef}
          data-export-preview
          data-export-name={(() => { const d = new Date(); const datePart = `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`; const t = (headlineWhite || headlineHighlight).trim(); return t ? `Did You Know - ${t.substring(0,40)} ${datePart}` : `Did You Know Thumbnail ${datePart}`; })()}
          className={`w-full max-w-[720px] aspect-video relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins'] ${activeImage ? 'cursor-grab' : ''} ${isDragging ? '!cursor-grabbing' : ''}`}
        >

          <img
            src={BG_URL}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          <img
            src={ORBIT_URL}
            alt="Orbit Rings"
            className="absolute z-[1] pointer-events-none"
            style={{
              width: '65%',
              height: 'auto',
              left: `${currentPreset.orbitX}%`,
              top: `${currentPreset.orbitY}%`,
              transform: 'translate(-50%, -50%)',
              opacity: 0.35,
              transition: 'left 0.3s ease, top 0.3s ease',
            }}
          />

          <div
            className="absolute z-[6] whitespace-nowrap"
            style={{
              top: "5%",
              left: layout === "text-right" ? "auto" : "4%",
              right: layout === "text-right" ? "4%" : "auto",
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                background: BADGE_STYLES[badgeStyle].bg,
                borderRadius: "16px",
                boxShadow: `0 6px 30px rgba(0,0,0,0.5), 0 0 50px ${badgeStyle === 0 ? 'rgba(76,175,80,0.3)' : badgeStyle === 1 ? 'rgba(40,150,251,0.3)' : 'rgba(0,0,0,0.2)'}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.12)] via-transparent to-[rgba(0,0,0,0.08)]" />
              <div className="relative py-[10px] px-[24px] flex items-center gap-[12px]">
                <div className="w-[30px] h-[30px] rounded-[10px] bg-[rgba(255,255,255,0.2)] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.2)]">
                  <Lightbulb className="w-[17px] h-[17px] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
                </div>
                <span className="font-['Poppins'] font-black text-white text-[16px] uppercase tracking-[4px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-none">
                  Did You Know?
                </span>
              </div>
            </div>
          </div>

          <img
            src={`${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`}
            alt="HighLevel"
            className="absolute z-[5] h-[7%] w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            style={{
              bottom: "6%",
              left: layout === "text-right" ? "auto" : "4%",
              right: layout === "text-right" ? "4%" : "auto",
            }}
          />

          {screenshotImage && (() => {
            const scaleVal = screenshotScale / 100;
            const layoutOffsets = layout === "text-left"
              ? { top: 55, left: 65 }
              : layout === "text-right"
              ? { top: 55, left: 35 }
              : { top: 50, left: 50 };
            const baseTransform = `translate(-50%, -50%) scale(${scaleVal})`;
            const styleMap: Record<typeof screenshotStyle, { transform: string; border: string; boxShadow: string; outline?: string; outlineOffset?: string }> = {
              glow: {
                transform: `${baseTransform} rotate(-3deg)`,
                border: "2px solid rgba(40,150,251,0.6)",
                boxShadow: "0 0 30px rgba(40,150,251,0.4), 0 0 60px rgba(40,150,251,0.2), 0 8px 40px rgba(0,0,0,0.5)",
              },
              float: {
                transform: `${baseTransform} rotate(2deg) perspective(800px) rotateY(-4deg)`,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              },
              neon: {
                transform: baseTransform,
                border: "2px solid rgba(40,150,251,0.4)",
                boxShadow: "0 0 15px rgba(40,150,251,0.5), 0 0 40px rgba(9,93,195,0.3), inset 0 0 15px rgba(40,150,251,0.1), 0 8px 40px rgba(0,0,0,0.5)",
                outline: "2px solid rgba(40,150,251,0.5)",
                outlineOffset: "2px",
              },
              minimal: {
                transform: baseTransform,
                border: "none",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              },
              tilt: {
                transform: `${baseTransform} perspective(600px) rotateY(-8deg) rotateX(3deg)`,
                border: "2px solid rgba(255,255,255,0.12)",
                boxShadow: "20px 20px 60px rgba(0,0,0,0.6), -5px -5px 20px rgba(40,150,251,0.1)",
              },
              shadow: {
                transform: `${baseTransform} rotate(-2deg)`,
                border: "none",
                boxShadow: "0 25px 80px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              },
              cinematic: {
                transform: `${baseTransform} rotate(1deg)`,
                border: "3px solid rgba(255,255,255,0.08)",
                boxShadow: "0 0 0 6px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.2)",
              },
              glass: {
                transform: baseTransform,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(40,150,251,0.15)",
                outline: "1px solid rgba(255,255,255,0.08)",
                outlineOffset: "4px",
              },
            };
            const s = styleMap[screenshotStyle];
            return (
              <div
                className="absolute z-[1] transition-all duration-300"
                style={{
                  top: `${layoutOffsets.top + screenshotOffsetY}%`,
                  left: `${layoutOffsets.left + screenshotOffsetX}%`,
                  transform: s.transform,
                  opacity: screenshotOpacity / 100,
                  width: '55%',
                }}
              >
                <img
                  src={screenshotImage}
                  alt="Screenshot"
                  className="w-full h-auto object-contain"
                  style={{
                    borderRadius: `${screenshotRadius}px`,
                    border: s.border,
                    boxShadow: s.boxShadow,
                    outline: s.outline || "none",
                    outlineOffset: s.outlineOffset || "0",
                  }}
                />
              </div>
            );
          })()}

          {activeImage && currentMember ? (
            <>
              <img
                src={`${currentMember.assetBase}${activeImage}`}
                alt={`${currentMember.name} Cutout`}
                onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
                onTouchStart={(e) => { if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
                draggable={false}
                className={`absolute z-[2] object-contain select-none
                  ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                style={{
                  left: `${personX}%`,
                  top: `${personY}%`,
                  transform: `translate(-50%, -50%) scale(${personScale / 100})`,
                  height: '95%',
                  filter: 'drop-shadow(0 0 25px rgba(0,0,0,0.5)) drop-shadow(0 4px 20px rgba(0,0,0,0.6))',
                }}
              />
            </>
          ) : null}

          {renderTextContent()}

          {!activeImage && !headlineWhite && !headlineHighlight && !screenshotImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[10] text-center gap-[8px]">
              <Lightbulb className="w-[32px] h-[32px] text-[rgba(255,255,255,0.25)] mb-[4px]" />
              <p className="text-[14px] text-[rgba(255,255,255,0.35)] font-medium m-0">Select a person, type a headline</p>
              <span className="text-[11px] text-[rgba(255,255,255,0.2)]">Your thumbnail will preview here</span>
            </div>
          )}
        </div>
      </LivePreview>

      {cropModalImage && (
        <CropModal
          imageSrc={cropModalImage}
          onCrop={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
