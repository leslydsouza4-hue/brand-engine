import { useState, useRef, useCallback, useEffect } from "react";
import { Image as ImageIcon, UploadCloud, X, Crop, Lightbulb } from "lucide-react";
import { CropModal } from "./CropModal";
import { LivePreview } from "./LivePreview";
import { DownloadButton } from "./DownloadButton";
import { useExport } from "./useExport";

const BASE = import.meta.env.BASE_URL;

const BACKGROUNDS = [
  { label: "Core Gradient", file: "Type=Core Gradient.png" },
  { label: "Centered Planet", file: "Type=Centered Planet.png" },
  { label: "Planet Bottom Right", file: "Type=Planet Bottom Right.png" },
  { label: "Radial Shine Left", file: "Type=Radial Shine Bottom Left.png" },
  { label: "Radial Shine Right", file: "Type=Radial Shine Bottom RIght.png" },
  { label: "Planet Ray", file: "Type=Planet Ray Bottom Right.png" },
  { label: "Small Planet", file: "Type=Small Planet Bottom Right.png" },
  { label: "Large Planet", file: "Type=Large Planet Bottom Right.png" },
];

const BADGE_STYLES = [
  { label: "Gradient", bg: "linear-gradient(135deg, #095DC3 0%, #2896FB 40%, #00B2A9 100%)" },
  { label: "Electric Blue", bg: "linear-gradient(135deg, #2896FB 0%, #095DC3 100%)" },
  { label: "Teal", bg: "linear-gradient(135deg, #00B2A9 0%, #095DC3 100%)" },
  { label: "Gold", bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
  { label: "Purple", bg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" },
  { label: "Rose", bg: "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)" },
];

type TextPosition = "center" | "bottom-left" | "bottom-center";

export function DidYouKnowWorkspace() {
  const { isExporting, handleExport } = useExport();
  const [factText, setFactText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [selectedBg, setSelectedBg] = useState(0);
  const [badgeStyle, setBadgeStyle] = useState(0);
  const [textPosition, setTextPosition] = useState<TextPosition>("center");

  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [screenshotOpacity, setScreenshotOpacity] = useState(30);
  const [screenshotScale, setScreenshotScale] = useState(80);
  const [screenshotRadius, setScreenshotRadius] = useState(12);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [cropModalImage, setCropModalImage] = useState<string | null>(null);

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
    setScreenshotOpacity(30);
    setScreenshotScale(80);
    setScreenshotRadius(12);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropApply = (croppedDataUrl: string) => {
    setScreenshotImage(croppedDataUrl);
    setCropModalImage(null);
  };

  const bgUrl = `${BASE}assets/backgrounds-dark/${BACKGROUNDS[selectedBg].file}`;

  const textPositionClasses: Record<TextPosition, string> = {
    "center": "inset-0 flex flex-col items-center justify-center text-center px-[10%]",
    "bottom-left": "bottom-[8%] left-[6%] right-[20%] text-left",
    "bottom-center": "bottom-[8%] left-[10%] right-[10%] text-center",
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      <div className="w-full md:w-[380px] md:min-w-[380px] overflow-y-auto pt-[20px] px-[16px] md:px-[28px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">

        <div className="pt-[20px] pb-[16px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[12px]">Background</div>
          <div className="grid grid-cols-4 gap-[8px]">
            {BACKGROUNDS.map((bg, i) => (
              <div
                key={bg.file}
                onClick={() => setSelectedBg(i)}
                className={`w-full aspect-video rounded-[10px] overflow-hidden cursor-pointer relative transition-all duration-250 border-[2px]
                  ${selectedBg === i
                    ? 'border-[#00B2A9] shadow-[0_0_0_2px_rgba(3,11,23,0.8),0_0_0_4px_rgba(0,178,169,0.4)]'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,178,169,0.2)]'}`}
              >
                <img src={`${BASE}assets/backgrounds-dark/${bg.file}`} alt={bg.label} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Badge Style</div>
          <div className="grid grid-cols-3 gap-[6px]">
            {BADGE_STYLES.map((style, i) => (
              <button
                key={style.label}
                onClick={() => setBadgeStyle(i)}
                className={`py-[8px] px-[6px] rounded-[8px] text-[10px] font-semibold border cursor-pointer transition-all ${
                  badgeStyle === i
                    ? "border-[rgba(0,178,169,0.3)] text-white shadow-[0_0_12px_rgba(0,178,169,0.15)]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]"
                }`}
                style={badgeStyle === i ? { background: style.bg } : undefined}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Text Position</div>
          <div className="grid grid-cols-3 gap-[6px]">
            {([
              { key: "center" as TextPosition, label: "Center" },
              { key: "bottom-left" as TextPosition, label: "Bottom Left" },
              { key: "bottom-center" as TextPosition, label: "Bottom Center" },
            ]).map((pos) => (
              <button
                key={pos.key}
                onClick={() => setTextPosition(pos.key)}
                className={`py-[7px] px-[6px] rounded-[8px] text-[10px] font-semibold border cursor-pointer transition-all ${
                  textPosition === pos.key
                    ? "bg-[rgba(0,178,169,0.15)] border-[rgba(0,178,169,0.3)] text-[#00B2A9]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]"
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[12px] border-t border-[rgba(255,255,255,0.04)] pt-[16px] pb-[12px]">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px]">
              Fact / Tip
            </label>
            <textarea
              value={factText}
              onChange={e => setFactText(e.target.value)}
              placeholder="Type your fact or tip here..."
              maxLength={200}
              rows={3}
              className="w-full py-[12px] px-[16px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[15px] font-bold text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] resize-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px]">
              Subtext
            </label>
            <input
              type="text"
              value={subtext}
              onChange={e => setSubtext(e.target.value)}
              placeholder="Optional supporting text..."
              maxLength={60}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-inherit text-[13.5px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] pt-[16px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[12px]">Background Image</div>

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
                ? <ImageIcon className="w-[16px] h-[16px] text-[#00B2A9]" />
                : <UploadCloud className="w-[16px] h-[16px] text-[#64748B]" />
              }
            </div>
            <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1">
              {screenshotImage ? 'Image uploaded' : 'Upload background image'}
              <span className="block text-[10.5px] text-[#64748B] mt-[2px]">
                {screenshotImage ? 'Renders behind the text' : 'PNG, JPG — optional depth layer'}
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
                    type="range" min="30" max="150" value={screenshotScale}
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
                <div className="flex-1" />
              </div>
            </div>
          )}

          <div className="mt-auto pt-[16px]">
            <DownloadButton onExport={handleExport} isExporting={isExporting} label="Download Current" />
          </div>
        </div>
      </div>

      <LivePreview>
        <div ref={previewRef} data-export-preview data-export-name={(() => { const d = new Date(); const datePart = `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`; return factText.trim() ? `Did You Know - ${factText.trim().slice(0, 30)} ${datePart}` : `Did You Know Thumbnail ${datePart}`; })()} className="w-full max-w-[720px] aspect-video relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins']">

          <img
            src={bgUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {screenshotImage && (
            <div
              className="absolute inset-0 z-[1] flex items-center justify-center"
            >
              <img
                src={screenshotImage}
                alt="Background image"
                className="object-contain"
                style={{
                  opacity: screenshotOpacity / 100,
                  width: `${screenshotScale}%`,
                  borderRadius: `${screenshotRadius}px`,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          <div
            className="absolute top-[8%] left-1/2 -translate-x-1/2 z-[6] whitespace-nowrap overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            style={{
              background: BADGE_STYLES[badgeStyle].bg,
              borderRadius: "8px",
            }}
          >
            <div className="absolute inset-0 bg-[rgba(255,255,255,0.08)]" />
            <div className="relative py-[6px] px-[20px] flex items-center gap-[8px]">
              <Lightbulb className="w-[14px] h-[14px] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]" style={{ minWidth: 14 }} />
              <span className="font-['Poppins'] font-black text-white text-[12px] uppercase tracking-[3px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                Did You Know?
              </span>
            </div>
          </div>

          {(factText || subtext) && (
            <>
              {textPosition !== "center" && (
                <div className="absolute bottom-0 left-0 right-0 h-[50%] z-[3] pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)" }}
                />
              )}
              <div className={`absolute z-[4] ${textPositionClasses[textPosition]}`}>
                {factText && (
                  <div
                    className="font-black text-[clamp(14px,2.2vw,28px)] leading-[1.15] text-white"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 4px 12px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(0,0,0,0.5))",
                    }}
                  >
                    {factText}
                  </div>
                )}
                {subtext && (
                  <div className="font-medium text-[clamp(7px,0.8vw,11px)] text-[rgba(255,255,255,0.8)] mt-[8px] tracking-[1px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                    {subtext}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="absolute bottom-[4%] right-[4%] z-[5]">
            <img
              src={`${BASE}assets/logos/Lockup=Full Horizontal, Color=AllWhite.png`}
              alt="HighLevel"
              className="h-[18px] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {!factText && !subtext && !screenshotImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[10] text-center gap-[8px]">
              <Lightbulb className="w-[32px] h-[32px] text-[rgba(255,255,255,0.25)] mb-[4px]" />
              <p className="text-[14px] text-[rgba(255,255,255,0.35)] font-medium m-0">Type a fact or tip</p>
              <span className="text-[11px] text-[rgba(255,255,255,0.2)]">Your thumbnail will preview here</span>
            </div>
          )}
        </div>
      </LivePreview>

      {cropModalImage && (
        <CropModal
          imageSrc={cropModalImage}
          onCrop={handleCropApply}
          onCancel={() => setCropModalImage(null)}
        />
      )}
    </div>
  );
}
