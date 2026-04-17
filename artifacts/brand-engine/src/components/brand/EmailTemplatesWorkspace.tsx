import { useState, useRef, useEffect } from "react";
import { Mail, Download, Loader2, Upload, X, Image as ImageIcon, Plus, Sparkles } from "lucide-react";
import { useExport } from "./useExport";
import { BatchExportQueue } from "./BatchExportQueue";
import type { QueuedThumbnail } from "./useExport";
import { HIGHLY_POSES } from "./highlyData";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/email-templates/BG_BLUE.jpg`;
const LOGO_URL = `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`;

interface SubTemplate {
  id: string;
  label: string;
  description: string;
  comingSoon?: boolean;
}

const SUB_TEMPLATES: SubTemplate[] = [
  {
    id: "marketing-email",
    label: "Marketing Email",
    description: "Generate a unique marketing email banner",
  },
];

type ImageSource = "highly" | "upload" | "none";

export function EmailTemplatesWorkspace() {
  const [activeSubId, setActiveSubId] = useState<string>(SUB_TEMPLATES[0]!.id);
  const activeSub = SUB_TEMPLATES.find(s => s.id === activeSubId) || SUB_TEMPLATES[0]!;

  const [headline, setHeadline] = useState<string>("");
  const [subhead, setSubhead] = useState<string>("");

  const [imageSource, setImageSource] = useState<ImageSource>("highly");
  const [selectedHighlyId, setSelectedHighlyId] = useState<string>(HIGHLY_POSES[0]!.id);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [queue, setQueue] = useState<QueuedThumbnail[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const [headlineFontPx, setHeadlineFontPx] = useState(64);
  const { isExporting, handleExport, captureToQueue } = useExport();

  const selectedHighly = HIGHLY_POSES.find(h => h.id === selectedHighlyId);

  const handleSelectSub = (id: string) => {
    const sub = SUB_TEMPLATES.find(s => s.id === id);
    if (!sub || sub.comingSoon) return;
    setActiveSubId(id);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setImageSource("upload");
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Dynamic headline sizing
  useEffect(() => {
    const el = headlineRef.current;
    if (!el || !headline) { setHeadlineFontPx(48); return; }
    const containerWidth = el.parentElement?.clientWidth || 600;
    const containerHeight = 220;
    let lo = 18, hi = 52, best = 18;
    const measure = (size: number) => {
      el.style.fontSize = `${size}px`;
      return { w: el.scrollWidth, h: el.scrollHeight };
    };
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const { w, h } = measure(mid);
      if (w <= containerWidth && h <= containerHeight) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    setHeadlineFontPx(best);
  }, [headline]);

  const onAddToQueue = async () => {
    const item = await captureToQueue(previewRef.current);
    if (item) setQueue(prev => [...prev, item]);
  };

  const exportName = `Email - ${activeSub.label} ${(() => { const d = new Date(); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`; })()}`;

  const displayedImage = imageSource === "upload" ? uploadedImage : (imageSource === "highly" ? selectedHighly?.image : null);

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {/* Sidebar / Controls */}
      <div className="w-full md:w-[340px] shrink-0 overflow-y-auto sidebar-scroll border-r border-[rgba(255,255,255,0.06)] p-[24px] flex flex-col gap-[20px]">
        {/* Sub-template selector */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Workflow</div>
          <div className="flex flex-col gap-[6px]">
            {SUB_TEMPLATES.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSelectSub(sub.id)}
                disabled={sub.comingSoon}
                className={`text-left py-[10px] px-[12px] rounded-[10px] border cursor-pointer transition-all ${
                  sub.comingSoon
                    ? "opacity-40 cursor-not-allowed bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)]"
                    : activeSubId === sub.id
                    ? "bg-[rgba(40,150,251,0.12)] border-[rgba(40,150,251,0.25)]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                <div className={`text-[12px] font-bold ${activeSubId === sub.id ? "text-[#7CC8FF]" : "text-[#E2E8F0]"}`}>
                  {sub.label} {sub.comingSoon && <span className="text-[8px] uppercase tracking-[1px] text-[#64748B] ml-[4px]">Soon</span>}
                </div>
                <div className="text-[10px] text-[#64748B] mt-[2px]">{sub.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Headline</div>
          <textarea
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            rows={2}
            placeholder="Type your headline..."
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4] placeholder:text-[#475569]"
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Subheadline</div>
          <textarea
            value={subhead}
            onChange={e => setSubhead(e.target.value)}
            rows={2}
            placeholder="Type your subheadline..."
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4] placeholder:text-[#475569]"
          />
        </div>

        {/* Right-side image: Highly / Upload / None */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Right-side Image</div>

          <div className="flex gap-[4px] mb-[10px] p-[3px] bg-[rgba(255,255,255,0.04)] rounded-[10px] border border-[rgba(255,255,255,0.06)]">
            {[
              { id: "highly", label: "Highly", icon: Sparkles },
              { id: "upload", label: "Upload", icon: Upload },
              { id: "none", label: "None", icon: X },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setImageSource(id as ImageSource)}
                className={`flex-1 flex items-center justify-center gap-[5px] py-[6px] px-[8px] rounded-[7px] text-[11px] font-semibold cursor-pointer transition-all border-none ${
                  imageSource === id
                    ? "bg-[rgba(40,150,251,0.18)] text-[#7CC8FF]"
                    : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                <Icon className="w-[11px] h-[11px]" />
                {label}
              </button>
            ))}
          </div>

          {imageSource === "highly" && (
            <div className="grid grid-cols-3 gap-[6px] max-h-[260px] overflow-y-auto sidebar-scroll p-[2px]">
              {HIGHLY_POSES.map(pose => (
                <button
                  key={pose.id}
                  onClick={() => setSelectedHighlyId(pose.id)}
                  title={pose.name}
                  className={`relative aspect-square rounded-[8px] border cursor-pointer transition-all overflow-hidden ${
                    selectedHighlyId === pose.id
                      ? "border-[#2896FB] shadow-[0_0_0_2px_rgba(40,150,251,0.25)] bg-[rgba(40,150,251,0.08)]"
                      : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <img src={pose.image} alt={pose.name} className="w-full h-full object-contain p-[4px]" />
                </button>
              ))}
            </div>
          )}

          {imageSource === "upload" && (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {uploadedImage ? (
                <div className="relative rounded-[10px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                  <img src={uploadedImage} alt="Preview" className="w-full h-[120px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-[8px] gap-[6px]">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="py-[5px] px-[10px] rounded-[6px] text-[11px] font-semibold bg-[rgba(255,255,255,0.15)] backdrop-blur-md border border-white/20 text-white hover:bg-[rgba(255,255,255,0.25)] cursor-pointer transition-all"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => { setUploadedImage(null); }}
                      className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(239,68,68,0.2)] backdrop-blur-md border border-[rgba(239,68,68,0.3)] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.3)] cursor-pointer transition-all"
                    >
                      <X className="w-[12px] h-[12px]" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-[6px] py-[24px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-dashed border-[rgba(255,255,255,0.12)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(40,150,251,0.3)] cursor-pointer transition-all"
                >
                  <Upload className="w-[18px] h-[18px]" />
                  <span className="text-[12px] font-semibold">Upload image</span>
                  <span className="text-[10px]">PNG, JPG, screenshots</span>
                </button>
              )}
            </>
          )}

          {imageSource === "none" && (
            <div className="text-[11px] text-[#64748B] py-[12px] px-[14px] rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] text-center">
              No image — text only layout
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[8px] mt-auto pt-[16px] border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={onAddToQueue}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[12px] font-bold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#E2E8F0] hover:border-[rgba(40,150,251,0.3)] hover:text-[#7CC8FF] cursor-pointer transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : <Plus className="w-[13px] h-[13px]" />}
            Add to Batch Queue
          </button>
          <button
            onClick={() => handleExport("png", previewRef.current)}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] text-[13px] font-bold cursor-pointer transition-all text-white border-none disabled:opacity-50 hover:shadow-[0_4px_20px_rgba(40,150,251,0.3)]"
            style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
          >
            {isExporting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
            Download PNG
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-[32px] py-[16px] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-[8px]">
          <Mail className="w-[16px] h-[16px] text-[#2896FB]" />
          <div className="text-white text-[14px] font-bold">Email Templates</div>
          <span className="text-[#64748B] text-[11px]">— {activeSub.label}</span>
        </div>
        <div className="flex-1 overflow-auto p-[32px] flex items-start justify-center">
          <div className="w-full max-w-[1080px]">
            <div
              ref={previewRef}
              data-export-preview
              data-export-name={exportName}
              className="relative w-full overflow-hidden rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              style={{ aspectRatio: "1200 / 600" }}
            >
              {/* Background */}
              <img src={BG_URL} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,11,22,0.45)] via-transparent to-transparent" />

              {/* Logo top-left */}
              <img
                src={LOGO_URL}
                alt="HighLevel"
                className="absolute z-[5] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                style={{ top: "6%", left: "5%", height: "8%", width: "auto" }}
                crossOrigin="anonymous"
              />

              {/* Text block */}
              <div
                className="absolute z-[4] flex flex-col"
                style={{ top: "28%", left: "5%", width: imageSource === "none" ? "90%" : "52%" }}
              >
                <div
                  ref={headlineRef}
                  className="font-['Poppins'] font-black leading-[1.05]"
                  style={{
                    fontSize: `${headlineFontPx}px`,
                    letterSpacing: "-0.5px",
                    backgroundImage: "linear-gradient(180deg, #DCEEFF 0%, #7CC8FF 55%, #2896FB 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.45))",
                  }}
                >
                  {headline || <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.25)" }}>Your headline here</span>}
                </div>
                {subhead && (
                  <div
                    className="font-['Poppins'] font-semibold leading-[1.35] mt-[18px] text-white"
                    style={{
                      fontSize: `${Math.max(18, Math.round(headlineFontPx * 0.55))}px`,
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    {subhead}
                  </div>
                )}
              </div>

              {/* Right-side image area */}
              {imageSource !== "none" && (
                <div
                  className="absolute z-[4] flex items-center justify-center"
                  style={{ top: "10%", right: "4%", width: "38%", height: "82%" }}
                >
                  {displayedImage ? (
                    <img
                      src={displayedImage}
                      alt=""
                      className="max-w-full max-h-full object-contain"
                      style={{ filter: imageSource === "highly" ? "drop-shadow(0 12px 30px rgba(0,0,0,0.5))" : undefined }}
                      crossOrigin={imageSource === "highly" ? "anonymous" : undefined}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-white/15 bg-white/[0.03]">
                      <ImageIcon className="w-[40px] h-[40px] text-white/20 mb-[8px]" />
                      <div className="text-[12px] text-white/40 font-semibold uppercase tracking-[1px]">Image area</div>
                      <div className="text-[10px] text-white/25 mt-[2px]">Pick from sidebar</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <BatchExportQueue
              queue={queue}
              onAdd={onAddToQueue}
              onRemove={(id) => setQueue(prev => prev.filter(q => q.id !== id))}
              onClear={() => setQueue([])}
              isCapturing={isExporting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
