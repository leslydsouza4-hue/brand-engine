import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud, X, Loader2, Download, Check, Sparkles, ZoomIn, ArrowUpDown, RefreshCw
} from "lucide-react";
import html2canvas from "html2canvas";

const BASE = import.meta.env.BASE_URL;
const BG_HORIZONTAL = `${BASE}assets/bizdev/background.png`;
const BG_SQUARE = `${BASE}assets/bizdev/background-square.png`;
const BG_PORTRAIT = `${BASE}assets/bizdev/background-portrait.png`;
const LOGO_URL = `${BASE}assets/bizdev/logo-light.png`;

interface TemplateConfig {
  id: string;
  name: string;
  shortName: string;
  width: number;
  height: number;
  variant: "dates" | "cta" | "day1" | "day2";
  group: "horizontal" | "square" | "portrait";
}

const TEMPLATES: TemplateConfig[] = [
  { id: "horizontal-cta", name: "Horizontal - CTA", shortName: "CTA", width: 1920, height: 1080, variant: "cta", group: "horizontal" },
  { id: "horizontal-dates", name: "Horizontal - Dates", shortName: "Dates", width: 1920, height: 1080, variant: "dates", group: "horizontal" },
  { id: "horizontal-day1", name: "Horizontal - DAY 1", shortName: "Day 1", width: 1920, height: 1080, variant: "day1", group: "horizontal" },
  { id: "horizontal-day2", name: "Horizontal - DAY 2", shortName: "Day 2", width: 1920, height: 1080, variant: "day2", group: "horizontal" },
  { id: "ql-dates", name: "QL - Dates", shortName: "Dates", width: 1080, height: 1080, variant: "dates", group: "square" },
  { id: "portrait-dates", name: "Portrait - Dates", shortName: "Dates", width: 1080, height: 1350, variant: "dates", group: "portrait" },
];

const SIZE_GROUPS = [
  { key: "horizontal" as const, label: "Horizontal", dims: "1920 × 1080", ar: "16/9" },
  { key: "square" as const, label: "Square", dims: "1080 × 1080", ar: "1/1" },
  { key: "portrait" as const, label: "Portrait", dims: "1080 × 1350", ar: "4/5" },
];

function useContainerFontSize(ref: React.RefObject<HTMLDivElement | null>, base: number = 0.045) {
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (ref.current) ref.current.style.fontSize = `${w * base}px`;
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref, base]);
}

function GuestPill({ guestName, layout = "center" }: { guestName: string; layout?: "center" | "right" }) {
  if (!guestName) return null;

  if (layout === "right") {
    return (
      <div style={{
        position: "absolute",
        bottom: "5%",
        right: "4%",
        zIndex: 5,
        background: "rgba(6,17,35,0.82)",
        backdropFilter: "blur(10px)",
        borderRadius: "0.5em",
        padding: "0.4em 1em",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
        minWidth: "10em",
      }}>
        <div style={{ fontSize: "0.32em", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", lineHeight: 1, paddingBottom: "0.4em" }}>Guest:</div>
        <div style={{ fontSize: "0.72em", fontWeight: 800, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1 }}>{guestName}</div>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      bottom: "3.5%",
      left: "10%",
      right: "10%",
      zIndex: 5,
      background: "rgba(6,17,35,0.82)",
      backdropFilter: "blur(10px)",
      borderRadius: "0.45em",
      padding: "0.4em 0.8em",
      border: "1px solid rgba(255,255,255,0.1)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "0.32em", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", lineHeight: 1, paddingBottom: "0.35em" }}>Guest:</div>
      <div style={{ fontSize: "0.65em", fontWeight: 800, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1 }}>{guestName}</div>
    </div>
  );
}

interface ImageSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function HorizontalTemplate({
  config,
  headline,
  dateText,
  guestName,
  ctaText,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  guestName: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const { variant } = config;
  const showCta = variant === "cta";
  const showDay = variant === "day1" || variant === "day2";
  const dayLabel = variant === "day1" ? "DAY 1" : variant === "day2" ? "DAY 2" : "";
  const containerRef = useRef<HTMLDivElement>(null);
  useContainerFontSize(containerRef, 0.045);

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: "1920/1080",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#0e1f3a",
        fontSize: "16px",
      }}
    >
      <img src={BG_HORIZONTAL} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(6,11,22,0.65) 0%, rgba(6,11,22,0.25) 45%, transparent 65%)", zIndex: 1 }} />
      <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", top: "6.5%", left: "5%", height: "8.2%", width: "auto", objectFit: "contain", zIndex: 3 }} />

      {personImage && (
        <div style={{
          position: "absolute", right: "3%", bottom: 0, width: "50%", height: "100%",
          display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", zIndex: 2,
        }}>
          <img src={personImage} alt="" crossOrigin="anonymous" style={{
            height: `${88 * imgSettings.scale}%`,
            transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
            objectFit: "contain", objectPosition: "bottom center",
          }} />
        </div>
      )}

      <div style={{ position: "absolute", left: "5%", top: "22%", width: "48%", zIndex: 3, display: "flex", flexDirection: "column" }}>
        <div style={{
          fontSize: "1.95em", fontWeight: 800, lineHeight: 1.08, textTransform: "uppercase",
          background: "linear-gradient(180deg, #FFFFFF 0%, #5BE0D8 40%, #00B2A9 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          letterSpacing: "-0.02em", paddingBottom: "0.5em",
        }}>
          {headline || "Enter Headline"}
        </div>

        {!showDay && dateText && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3em", paddingBottom: "0.4em" }}>
            <div style={{
              width: "1em", height: "1em", borderRadius: "0.12em",
              background: "rgba(0,178,169,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span style={{ fontSize: "0.6em", fontWeight: 600, color: "#FFFFFF", letterSpacing: "0.03em" }}>{dateText}</span>
          </div>
        )}

        {showCta && ctaText && (
          <div style={{ paddingBottom: "0.4em" }}>
            <span style={{
              display: "inline-block", padding: "0.28em 1em",
              fontSize: "0.52em", fontWeight: 700, color: "#FFFFFF",
              background: "linear-gradient(135deg, #00B2A9 0%, #00C9A7 100%)",
              borderRadius: "0.22em", letterSpacing: "0.03em",
            }}>{ctaText}</span>
          </div>
        )}

        {showDay && (
          <div style={{
            fontSize: "2.4em", fontWeight: 900, color: "#FFFFFF", lineHeight: 1,
            letterSpacing: "0.02em", paddingBottom: "0.2em",
            textShadow: "0 0.05em 0.3em rgba(0,0,0,0.3)",
          }}>{dayLabel}</div>
        )}
      </div>

      <GuestPill guestName={guestName} layout="right" />
    </div>
  );
}

function SquarePortraitTemplate({
  config,
  headline,
  dateText,
  guestName,
  personImage,
  imgSettings,
}: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  guestName: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPortrait = config.height > config.width;
  useContainerFontSize(containerRef, isPortrait ? 0.055 : 0.05);
  const bgUrl = isPortrait ? BG_PORTRAIT : BG_SQUARE;
  const baseH = isPortrait ? 48 : 52;

  return (
    <div
      ref={containerRef}
      data-template-id={config.id}
      style={{
        width: "100%",
        aspectRatio: `${config.width}/${config.height}`,
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.3em",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#0a1628",
        fontSize: "16px",
      }}
    >
      <img src={bgUrl} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,11,22,0.4) 0%, rgba(6,11,22,0.1) 35%, transparent 55%, rgba(6,11,22,0.5) 85%)", zIndex: 1 }} />
      <img src={LOGO_URL} alt="" crossOrigin="anonymous" style={{ position: "absolute", top: isPortrait ? "5.5%" : "6%", left: "50%", transform: "translateX(-50%)", height: isPortrait ? "5.5%" : "6%", width: "auto", objectFit: "contain", zIndex: 3 }} />

      {personImage && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: `${(baseH + 20) * imgSettings.scale}%`,
          display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", zIndex: 2,
        }}>
          <img src={personImage} alt="" crossOrigin="anonymous" style={{
            height: `${baseH * imgSettings.scale}%`,
            transform: `translate(${imgSettings.offsetX}%, ${imgSettings.offsetY}%)`,
            objectFit: "contain", objectPosition: "bottom center",
          }} />
        </div>
      )}

      <div style={{
        position: "absolute",
        left: "8%",
        top: isPortrait ? "11%" : "14%",
        width: "84%",
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: isPortrait ? "1.6em" : "1.7em",
          fontWeight: 800,
          lineHeight: 1.08,
          textTransform: "uppercase",
          background: "linear-gradient(180deg, #FFFFFF 0%, #5BE0D8 40%, #00B2A9 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.02em",
          paddingBottom: "0.4em",
        }}>
          {headline || "Enter Headline"}
        </div>

        {dateText && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3em", justifyContent: "center" }}>
            <div style={{
              width: "0.9em", height: "0.9em", borderRadius: "0.1em",
              background: "rgba(0,178,169,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span style={{ fontSize: "0.55em", fontWeight: 600, color: "#FFFFFF", letterSpacing: "0.03em" }}>{dateText}</span>
          </div>
        )}
      </div>

      <GuestPill guestName={guestName} layout="center" />
    </div>
  );
}

function TemplatePreview(props: {
  config: TemplateConfig;
  headline: string;
  dateText: string;
  guestName: string;
  ctaText: string;
  personImage: string | null;
  imgSettings: ImageSettings;
}) {
  if (props.config.width > props.config.height) return <HorizontalTemplate {...props} />;
  return <SquarePortraitTemplate {...props} />;
}

export function BizDevWorkspace() {
  const [headline, setHeadline] = useState("");
  const [dateText, setDateText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [imgSettings, setImgSettings] = useState<ImageSettings>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [generateDays, setGenerateDays] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("horizontal-cta");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

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
        const blob = await removeBackground(src, { model: "medium", output: { format: "image/png" } });
        setPersonImage(URL.createObjectURL(blob));
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

  useEffect(() => {
    if (!activeTemplates.find((t) => t.id === selectedTemplate)) {
      setSelectedTemplate(activeTemplates[0]?.id || TEMPLATES[0].id);
    }
  }, [activeTemplates, selectedTemplate]);

  const currentConfig = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
  const currentGroup = currentConfig.group;
  const groupTemplates = activeTemplates.filter((t) => t.group === currentGroup);

  const exportTemplate = useCallback(async (templateId: string, containerEl?: HTMLElement) => {
    const root = containerEl || document;
    const el = root.querySelector(`[data-template-id="${templateId}"]`) as HTMLElement;
    if (!el) return;
    const config = TEMPLATES.find((t) => t.id === templateId);
    if (!config) return;
    setIsExporting(templateId);
    try {
      const canvas = await html2canvas(el, {
        scale: config.width / el.offsetWidth,
        useCORS: true, backgroundColor: null, logging: false,
      });
      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${config.name.replace(/\s+/g, "_")}_${config.width}x${config.height}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsExporting(null);
          resolve();
        }, "image/png");
      });
    } catch {
      setIsExporting(null);
    }
  }, []);

  const exportAll = useCallback(async () => {
    setIsExportingAll(true);
    for (const t of activeTemplates) {
      await exportTemplate(t.id, galleryRef.current || undefined);
      await new Promise((r) => setTimeout(r, 500));
    }
    setIsExportingAll(false);
  }, [activeTemplates, exportTemplate]);

  const inputCls = "w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] transition-all";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px]";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      <div className="w-full md:w-[340px] md:min-w-[340px] overflow-y-auto pt-[20px] px-[16px] md:px-[24px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="mb-[16px]">
          <h2 className="text-[16px] font-bold text-white mb-[4px]">Biz Dev Templates</h2>
          <p className="text-[11px] text-[#64748B]">Fill in details, preview live, then generate all.</p>
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col">
            <label className={labelCls}>Size</label>
            <div className="grid grid-cols-3 gap-[6px]">
              {SIZE_GROUPS.map((g) => {
                const isActive = currentGroup === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => {
                      const first = activeTemplates.find((t) => t.group === g.key);
                      if (first) setSelectedTemplate(first.id);
                    }}
                    className={`flex flex-col items-center gap-[6px] py-[10px] px-[6px] rounded-[10px] cursor-pointer border transition-all duration-200
                      ${isActive
                        ? "bg-[rgba(0,178,169,0.06)] border-[rgba(0,178,169,0.25)]"
                        : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]"
                      }`}
                  >
                    <div
                      className={`h-[26px] rounded-[3px] transition-all
                        ${isActive
                          ? "bg-gradient-to-br from-[rgba(0,178,169,0.35)] to-[rgba(40,150,251,0.2)] shadow-[inset_0_0_0_1.5px_rgba(0,178,169,0.5)]"
                          : "bg-[rgba(255,255,255,0.06)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        }`}
                      style={{ aspectRatio: g.ar }}
                    />
                    <div className={`text-[9px] font-semibold transition-all ${isActive ? "text-[#00B2A9]" : "text-[#64748B]"}`}>{g.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {groupTemplates.length > 1 && (
            <div className="flex flex-col">
              <label className={labelCls}>Variant</label>
              <div className="flex items-center gap-[2px] p-[3px] rounded-[10px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.04)]">
                {groupTemplates.map((t) => {
                  const isActive = selectedTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex-1 py-[6px] rounded-[7px] text-[10px] font-semibold transition-all duration-200 cursor-pointer border-none
                        ${isActive
                          ? "bg-[rgba(0,178,169,0.12)] text-[#00B2A9] shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                          : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                        }`}
                    >
                      {t.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-[1px] bg-[rgba(255,255,255,0.04)]" />

          <div className="flex flex-col">
            <label className={labelCls}>Headline <span className="text-[#FF6B6B]">*</span></label>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="From Client Acquisition to MRR" rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Date <span className="text-[#FF6B6B]">*</span></label>
            <input type="text" value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="APRIL 6–7, 12PM EDT" className={inputCls} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Guest Name <span className="text-[#FF6B6B]">*</span></label>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Michael Cooch" className={inputCls} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>CTA Text <span className="text-[#94A3B8] font-normal normal-case tracking-normal ml-[4px]">(optional)</span></label>
            <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Register today!" className={inputCls} />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Person Image <span className="text-[#FF6B6B]">*</span></label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            {!personImage ? (
              <div
                onClick={() => !isRemovingBg && fileInputRef.current?.click()}
                className="flex flex-col items-center gap-[8px] py-[20px] px-[14px] rounded-[12px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] cursor-pointer transition-all"
              >
                {isRemovingBg ? (
                  <>
                    <Loader2 className="w-[20px] h-[20px] text-[#2896FB] animate-spin" />
                    <div className="text-[10px] font-medium text-[#94A3B8]">Removing background...</div>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-[20px] h-[20px] text-[#64748B]" />
                    <div className="text-[10px] font-medium text-[#94A3B8]">Upload person photo</div>
                    <div className="text-[9px] text-[#475569]">BG will be auto-removed</div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-[12px] border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] overflow-hidden">
                <div className="flex items-center gap-[10px] p-[10px] border-b border-[rgba(255,255,255,0.04)]">
                  <img src={personImage} alt="" className="w-[36px] h-[36px] rounded-[8px] object-contain bg-[rgba(255,255,255,0.04)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[#00B2A9] flex items-center gap-[4px]">
                      <Check className="w-[10px] h-[10px]" /> Image ready
                    </div>
                    <div className="text-[9px] text-[#64748B] mt-[1px]">BG removed</div>
                  </div>
                  <div className="flex items-center gap-[3px] shrink-0">
                    <button onClick={() => fileInputRef.current?.click()} className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#94A3B8] flex items-center justify-center cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all" title="Replace image">
                      <RefreshCw className="w-[10px] h-[10px]" />
                    </button>
                    <button onClick={() => { setPersonImage(null); setImgSettings({ scale: 1, offsetX: 0, offsetY: 0 }); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[5px] text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all" title="Remove image">
                      <X className="w-[10px] h-[10px]" />
                    </button>
                  </div>
                </div>
                <div className="px-[10px] py-[8px] flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <ZoomIn className="w-[12px] h-[12px] text-[#64748B] shrink-0" />
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">Size</span>
                    <input
                      type="range" min="0.5" max="1.8" step="0.02"
                      value={imgSettings.scale}
                      onChange={(e) => setImgSettings((s) => ({ ...s, scale: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{Math.round(imgSettings.scale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <svg className="w-[12px] h-[12px] text-[#64748B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">X</span>
                    <input
                      type="range" min="-40" max="40" step="1"
                      value={imgSettings.offsetX}
                      onChange={(e) => setImgSettings((s) => ({ ...s, offsetX: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{imgSettings.offsetX > 0 ? "+" : ""}{imgSettings.offsetX}</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <ArrowUpDown className="w-[12px] h-[12px] text-[#64748B] shrink-0" />
                    <span className="text-[9px] text-[#64748B] w-[28px] shrink-0">Y</span>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={imgSettings.offsetY}
                      onChange={(e) => setImgSettings((s) => ({ ...s, offsetY: parseFloat(e.target.value) }))}
                      className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,178,169,0.4)]"
                    />
                    <span className="text-[9px] text-[#94A3B8] w-[28px] text-right tabular-nums">{imgSettings.offsetY > 0 ? "+" : ""}{imgSettings.offsetY}</span>
                  </div>
                  <button
                    onClick={() => setImgSettings({ scale: 1, offsetX: 0, offsetY: 0 })}
                    className="text-[9px] text-[#64748B] hover:text-[#94A3B8] cursor-pointer bg-transparent border-none p-0 self-end transition-all"
                  >Reset</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-[8px] px-[12px] rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
            <div>
              <div className="text-[10px] font-medium text-[#E2E8F0]">Day 1 / Day 2</div>
              <div className="text-[9px] text-[#64748B] mt-[1px]">+2 variants</div>
            </div>
            <button onClick={() => setGenerateDays(!generateDays)} className={`w-[34px] h-[18px] rounded-full transition-all duration-200 cursor-pointer border-none relative ${generateDays ? "bg-[#00B2A9]" : "bg-[rgba(255,255,255,0.1)]"}`}>
              <div className={`w-[12px] h-[12px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${generateDays ? "left-[19px]" : "left-[3px]"}`} />
            </button>
          </div>

          <div className="flex flex-col gap-[6px]">
            <button onClick={() => setShowGallery(true)} disabled={!headline.trim() || !dateText.trim() || !guestName.trim() || !personImage} className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-40 disabled:cursor-not-allowed">
              <Sparkles className="w-[13px] h-[13px]" />
              Generate All ({activeTemplates.length})
            </button>
            <button onClick={() => exportTemplate(currentConfig.id)} disabled={isExporting === currentConfig.id} className="w-full py-[9px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#94A3B8] text-[10px] font-medium flex items-center justify-center gap-[5px] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:opacity-50">
              {isExporting === currentConfig.id ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Download className="w-[11px] h-[11px]" />}
              Download Current
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!showGallery ? (
          <div className="flex-1 flex items-center justify-center p-[24px] overflow-auto">
            <div className="w-full max-w-[800px]">
              <TemplatePreview config={currentConfig} headline={headline} dateText={dateText} guestName={guestName} ctaText={ctaText} personImage={personImage} imgSettings={imgSettings} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto" ref={galleryRef}>
            <div className="max-w-[1100px] mx-auto py-[20px] px-[20px]">
              <div className="flex items-center justify-between mb-[20px] flex-wrap gap-[10px]">
                <div>
                  <h3 className="text-[16px] font-bold text-white mb-[2px]">All Templates</h3>
                  <p className="text-[11px] text-[#64748B]">{activeTemplates.length} templates ready</p>
                </div>
                <div className="flex gap-[8px]">
                  <button onClick={() => setShowGallery(false)} className="h-[32px] px-[14px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] text-[11px] font-medium flex items-center gap-[5px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-all">Back to Editor</button>
                  <button onClick={exportAll} disabled={isExportingAll} className="h-[32px] px-[16px] rounded-[8px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center gap-[5px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all disabled:opacity-50">
                    {isExportingAll ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
                    Download All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                {activeTemplates.map((t) => (
                  <div key={t.id} className="rounded-[14px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="p-[10px]">
                      <TemplatePreview config={t} headline={headline} dateText={dateText} guestName={guestName} ctaText={ctaText} personImage={personImage} imgSettings={imgSettings} />
                    </div>
                    <div className="flex items-center justify-between px-[14px] py-[10px] border-t border-[rgba(255,255,255,0.04)]">
                      <div>
                        <div className="text-[11px] font-semibold text-white">{t.name}</div>
                        <div className="text-[9px] text-[#64748B] mt-[1px]">{t.width} × {t.height}</div>
                      </div>
                      <button onClick={() => exportTemplate(t.id, galleryRef.current || undefined)} disabled={isExporting === t.id} className="h-[28px] px-[12px] rounded-[6px] bg-[rgba(255,255,255,0.06)] border-none text-[#E2E8F0] text-[10px] font-medium flex items-center gap-[5px] cursor-pointer hover:bg-[rgba(40,150,251,0.15)] hover:text-[#2896FB] transition-all disabled:opacity-50">
                        {isExporting === t.id ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Download className="w-[11px] h-[11px]" />}
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
    </div>
  );
}
