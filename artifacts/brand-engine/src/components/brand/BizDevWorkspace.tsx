import { useState, useRef, useCallback } from "react";
import {
  UploadCloud, X, Loader2, Download, RotateCcw, Check, Sparkles
} from "lucide-react";
import html2canvas from "html2canvas";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/bizdev/background.png`;
const LOGO_URL = `${BASE}assets/logos/Lockup=Standard, Color=Full.png`;

interface TemplateConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  variant: "dates" | "cta" | "day1" | "day2";
}

const TEMPLATES: TemplateConfig[] = [
  { id: "ql-dates", name: "QL - Dates", width: 1080, height: 1080, variant: "dates" },
  { id: "portrait-dates", name: "Portrait - Dates", width: 1080, height: 1350, variant: "dates" },
  { id: "horizontal-cta", name: "Horizontal - CTA", width: 1920, height: 1080, variant: "cta" },
  { id: "horizontal-dates", name: "Horizontal - Dates", width: 1920, height: 1080, variant: "dates" },
  { id: "horizontal-day1", name: "Horizontal - DAY 1", width: 1920, height: 1080, variant: "day1" },
  { id: "horizontal-day2", name: "Horizontal - DAY 2", width: 1920, height: 1080, variant: "day2" },
];

function TemplatePreview({
  config,
  headline,
  dateText,
  guestName,
  ctaText,
  personImage,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  guestName: string;
  ctaText: string;
  personImage: string | null;
}) {
  const { width, height, variant } = config;
  const isSquare = width === height;
  const isPortrait = height > width;
  const isHorizontal = width > height;

  const showDate = variant === "dates";
  const showCta = variant === "cta";
  const showDay = variant === "day1" || variant === "day2";
  const dayLabel = variant === "day1" ? "DAY 1" : variant === "day2" ? "DAY 2" : "";

  const headlineSize = isSquare ? "3.8%" : isPortrait ? "3.2%" : "3%";
  const dateSize = isSquare ? "2.2%" : isPortrait ? "1.8%" : "1.6%";
  const guestSize = isSquare ? "2%" : isPortrait ? "1.6%" : "1.4%";
  const ctaSize = isSquare ? "1.8%" : "1.3%";
  const daySize = isSquare ? "5%" : isPortrait ? "4%" : "4%";

  const personRight = isSquare ? "-5%" : isPortrait ? "-5%" : "2%";
  const personBottom = "0";
  const personHeight = isSquare ? "75%" : isPortrait ? "60%" : "80%";
  const textLeft = isSquare ? "6%" : isPortrait ? "6%" : "5%";
  const textWidth = isSquare ? "55%" : isPortrait ? "60%" : "45%";
  const textBottom = isSquare ? "12%" : isPortrait ? "18%" : "14%";

  return (
    <div
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: `${width}/${height}`,
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#0e1f3a",
      }}
    >
      <img
        src={BG_URL}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        crossOrigin="anonymous"
      />

      <img
        src={LOGO_URL}
        alt="HighLevel"
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: isSquare ? "5%" : isPortrait ? "4%" : "6%",
          left: isSquare ? "6%" : isPortrait ? "6%" : "5%",
          height: isSquare ? "5%" : isPortrait ? "3.5%" : "5%",
          objectFit: "contain",
        }}
      />

      {personImage && (
        <img
          src={personImage}
          alt="Guest"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            right: personRight,
            bottom: personBottom,
            height: personHeight,
            objectFit: "contain",
            objectPosition: "bottom right",
            zIndex: 2,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: textLeft,
          bottom: textBottom,
          width: textWidth,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          gap: isSquare ? "3%" : "2%",
        }}
      >
        {showDay && (
          <div
            style={{
              fontSize: daySize,
              fontWeight: 900,
              color: "#FFFFFF",
              textTransform: "uppercase",
              lineHeight: 1,
              letterSpacing: "2px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              background: "linear-gradient(135deg, #00B2A9 0%, #2896FB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {dayLabel}
          </div>
        )}

        <div
          style={{
            fontSize: headlineSize,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            wordBreak: "break-word",
          }}
        >
          {headline}
        </div>

        {(showDate || showCta) && dateText && (
          <div
            style={{
              fontSize: dateSize,
              fontWeight: 700,
              color: "#00B2A9",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            {dateText}
          </div>
        )}

        {guestName && (
          <div
            style={{
              fontSize: guestSize,
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.5px",
            }}
          >
            {guestName}
          </div>
        )}

        {showCta && ctaText && (
          <div style={{ marginTop: "2%" }}>
            <span
              style={{
                display: "inline-block",
                padding: "1.2% 4%",
                fontSize: ctaSize,
                fontWeight: 700,
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #095DC3 0%, #2896FB 100%)",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                boxShadow: "0 4px 16px rgba(40,150,251,0.3)",
              }}
            >
              {ctaText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BizDevWorkspace() {
  const [headline, setHeadline] = useState("");
  const [dateText, setDateText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [generateDays, setGenerateDays] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      setIsRemovingBg(true);
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(src, {
          model: "medium",
          output: { format: "image/png" },
        });
        const url = URL.createObjectURL(blob);
        setPersonImage(url);
      } catch {
        setPersonImage(src);
      } finally {
        setIsRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const activeTemplates = TEMPLATES.filter((t) => {
    if (!generateDays && (t.variant === "day1" || t.variant === "day2")) return false;
    return true;
  });

  const canGenerate = headline.trim() && dateText.trim() && guestName.trim() && personImage;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerated(true);
  };

  const handleReset = () => {
    setGenerated(false);
  };

  const exportTemplate = useCallback(async (templateId: string) => {
    const el = galleryRef.current?.querySelector(`[data-template-id="${templateId}"]`) as HTMLElement;
    if (!el) return;

    const config = TEMPLATES.find((t) => t.id === templateId);
    if (!config) return;

    setIsExporting(templateId);
    try {
      const canvas = await html2canvas(el, {
        scale: config.width / el.offsetWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.name.replace(/\s+/g, "_")}_${config.width}x${config.height}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(null);
      }, "image/png");
    } catch {
      setIsExporting(null);
    }
  }, []);

  const exportAll = useCallback(async () => {
    setIsExportingAll(true);
    for (const t of activeTemplates) {
      await exportTemplate(t.id);
      await new Promise((r) => setTimeout(r, 500));
    }
    setIsExportingAll(false);
  }, [activeTemplates, exportTemplate]);

  const inputCls = "w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] transition-all";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {!generated ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[520px] mx-auto py-[32px] px-[20px] md:px-[28px]">
            <div className="mb-[28px]">
              <h2 className="text-[20px] font-bold text-white mb-[6px]">Biz Dev Templates</h2>
              <p className="text-[13px] text-[#64748B]">
                Enter campaign details once, generate all {generateDays ? 6 : 4} creatives in one click.
              </p>
            </div>

            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col">
                <label className={labelCls}>Main Headline / Content <span className="text-[#FF6B6B]">*</span></label>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Enter your main headline or content..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Date Text <span className="text-[#FF6B6B]">*</span></label>
                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="APRIL 6–7, 12PM EDT"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Guest Name <span className="text-[#FF6B6B]">*</span></label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Smith"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>CTA Text <span className="text-[#94A3B8] font-normal normal-case tracking-normal ml-[4px]">(optional)</span></label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Register today!"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Person Image <span className="text-[#FF6B6B]">*</span></label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => !personImage && !isRemovingBg && fileInputRef.current?.click()}
                  className={`flex items-center gap-[14px] py-[14px] px-[16px] rounded-[16px] transition-all
                    ${personImage
                      ? "border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] cursor-default"
                      : "border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] hover:bg-[rgba(0,178,169,0.03)] cursor-pointer"
                    }`}
                >
                  <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 ${personImage ? "bg-[rgba(0,178,169,0.1)]" : "bg-[rgba(255,255,255,0.04)]"}`}>
                    {isRemovingBg ? (
                      <Loader2 className="w-[16px] h-[16px] text-[#2896FB] animate-spin" />
                    ) : personImage ? (
                      <Check className="w-[16px] h-[16px] text-[#00B2A9]" />
                    ) : (
                      <UploadCloud className="w-[16px] h-[16px] text-[#64748B]" />
                    )}
                  </div>
                  <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1">
                    {isRemovingBg
                      ? "Removing background..."
                      : personImage
                        ? "Person image ready (background removed)"
                        : "Upload person photo"
                    }
                    <span className="block text-[10.5px] text-[#64748B] mt-[1px]">
                      {isRemovingBg ? "This may take a moment" : personImage ? "Background has been automatically removed" : "Background will be removed automatically"}
                    </span>
                  </div>
                  {personImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPersonImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="ml-auto w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[6px] text-[#64748B] flex items-center justify-center cursor-pointer shrink-0 hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all"
                    >
                      <X className="w-[12px] h-[12px]" />
                    </button>
                  )}
                </div>
                {personImage && (
                  <div className="mt-[8px] w-[60px] h-[60px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <img src={personImage} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-[12px] px-[16px] rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                <div>
                  <div className="text-[12px] font-medium text-[#E2E8F0]">Generate Day 1 / Day 2 Assets</div>
                  <div className="text-[10.5px] text-[#64748B] mt-[2px]">Creates 2 additional horizontal variants</div>
                </div>
                <button
                  onClick={() => setGenerateDays(!generateDays)}
                  className={`w-[40px] h-[22px] rounded-full transition-all duration-200 cursor-pointer border-none relative
                    ${generateDays ? "bg-[#00B2A9]" : "bg-[rgba(255,255,255,0.1)]"}`}
                >
                  <div
                    className={`w-[16px] h-[16px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm
                      ${generateDays ? "left-[21px]" : "left-[3px]"}`}
                  />
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isRemovingBg}
                className="w-full py-[14px] rounded-[14px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[14px] font-semibold flex items-center justify-center gap-[8px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-40 disabled:cursor-not-allowed mt-[8px]"
              >
                <Sparkles className="w-[16px] h-[16px]" />
                Generate Set ({generateDays ? 6 : 4} templates)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" ref={galleryRef}>
          <div className="max-w-[1200px] mx-auto py-[24px] px-[20px] md:px-[28px]">
            <div className="flex items-center justify-between mb-[24px] flex-wrap gap-[12px]">
              <div>
                <h2 className="text-[18px] font-bold text-white mb-[4px]">Generated Templates</h2>
                <p className="text-[12px] text-[#64748B]">{activeTemplates.length} templates ready for download</p>
              </div>
              <div className="flex gap-[8px]">
                <button
                  onClick={handleReset}
                  className="h-[36px] px-[16px] rounded-[10px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-all"
                >
                  <RotateCcw className="w-[13px] h-[13px]" />
                  Edit Inputs
                </button>
                <button
                  onClick={exportAll}
                  disabled={isExportingAll}
                  className="h-[36px] px-[18px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all disabled:opacity-50"
                >
                  {isExportingAll ? (
                    <Loader2 className="w-[13px] h-[13px] animate-spin" />
                  ) : (
                    <Download className="w-[13px] h-[13px]" />
                  )}
                  Download All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              {activeTemplates.map((t) => (
                <div key={t.id} className="rounded-[16px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="p-[12px]">
                    <TemplatePreview
                      config={t}
                      headline={headline}
                      dateText={dateText}
                      guestName={guestName}
                      ctaText={ctaText}
                      personImage={personImage}
                    />
                  </div>
                  <div className="flex items-center justify-between px-[16px] py-[12px] border-t border-[rgba(255,255,255,0.04)]">
                    <div>
                      <div className="text-[12px] font-semibold text-white">{t.name}</div>
                      <div className="text-[10px] text-[#64748B] mt-[1px]">{t.width} × {t.height}</div>
                    </div>
                    <button
                      onClick={() => exportTemplate(t.id)}
                      disabled={isExporting === t.id}
                      className="h-[32px] px-[14px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#E2E8F0] text-[11px] font-medium flex items-center gap-[6px] cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all disabled:opacity-50"
                    >
                      {isExporting === t.id ? (
                        <Loader2 className="w-[12px] h-[12px] animate-spin" />
                      ) : (
                        <Download className="w-[12px] h-[12px]" />
                      )}
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
