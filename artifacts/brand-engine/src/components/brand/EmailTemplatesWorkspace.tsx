import { useState, useRef, useEffect } from "react";
import { Mail, Download, Loader2, Upload, X, Image as ImageIcon, Plus, RefreshCw } from "lucide-react";
import { useExport } from "./useExport";
import { BatchExportQueue } from "./BatchExportQueue";
import type { QueuedThumbnail } from "./useExport";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/email-templates/BG_BLUE.jpg`;
const LOGO_URL = `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`;

interface EmailTemplate {
  id: string;
  label: string;
  headline: string;
  subhead: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: "email-1a", label: "Email 1A", headline: "Overwhelmed? We can help.", subhead: "Come back and claim your free trial extension." },
  { id: "email-1bc", label: "Emails 1B + 1C", headline: "There's a lot more to see. We can help.", subhead: "Come back and extend your free trial." },
  { id: "email-1d", label: "Email 1D", headline: "You put in real time. It showed.", subhead: "Come back and claim your free trial extension." },
  { id: "email-1ef", label: "Emails 1E + 1F", headline: "You were THIS close to building a real solution.", subhead: "Come back and finish what you started." },
  { id: "email-2", label: "Email 2", headline: "No prior tech experience needed.", subhead: "Come back and extend your trial." },
  { id: "email-3", label: "Email 3", headline: "There's an easier way to scale your business.", subhead: "Come back and extend your trial." },
  { id: "email-4", label: "Email 4", headline: "Remember that problem you came here to solve?", subhead: "Come back. We can help." },
  { id: "email-5", label: "Email 5", headline: "Last chance to extend your trial.", subhead: "Come back to HighLevel. We can help." },
];

export function EmailTemplatesWorkspace() {
  const [activeId, setActiveId] = useState<string>(EMAIL_TEMPLATES[0]!.id);
  const [headline, setHeadline] = useState<string>(EMAIL_TEMPLATES[0]!.headline);
  const [subhead, setSubhead] = useState<string>(EMAIL_TEMPLATES[0]!.subhead);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedThumbnail[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const [headlineFontPx, setHeadlineFontPx] = useState(64);
  const { isExporting, handleExport, captureToQueue } = useExport();

  const activeTpl = EMAIL_TEMPLATES.find(t => t.id === activeId)!;

  const handleSelectTemplate = (id: string) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    setActiveId(id);
    setHeadline(tpl.headline);
    setSubhead(tpl.subhead);
  };

  const handleResetCopy = () => {
    setHeadline(activeTpl.headline);
    setSubhead(activeTpl.subhead);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRightImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Dynamic headline sizing — binary search for best font size
  useEffect(() => {
    const el = headlineRef.current;
    if (!el || !headline) { setHeadlineFontPx(64); return; }
    const containerWidth = el.parentElement?.clientWidth || 600;
    const containerHeight = 280;
    let lo = 22, hi = 76, best = 22;
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
  }, [headline, activeId]);

  const onAddToQueue = async () => {
    const item = await captureToQueue(previewRef.current);
    if (item) setQueue(prev => [...prev, item]);
  };

  const exportName = `Email Template - ${activeTpl.label} ${(() => { const d = new Date(); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`; })()}`;

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {/* Sidebar / Controls */}
      <div className="w-full md:w-[340px] shrink-0 overflow-y-auto sidebar-scroll border-r border-[rgba(255,255,255,0.06)] p-[24px] flex flex-col gap-[20px]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Email Template</div>
          <div className="grid grid-cols-2 gap-[6px]">
            {EMAIL_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`text-left py-[8px] px-[10px] rounded-[10px] text-[11px] font-semibold border cursor-pointer transition-all ${
                  activeId === tpl.id
                    ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#7CC8FF]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-[8px]">
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B]">Headline</div>
            <button
              onClick={handleResetCopy}
              className="flex items-center gap-[4px] text-[10px] text-[#64748B] hover:text-[#7CC8FF] cursor-pointer bg-transparent border-none p-0 transition-colors"
              title="Reset to original copy"
            >
              <RefreshCw className="w-[10px] h-[10px]" /> Reset
            </button>
          </div>
          <textarea
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            rows={2}
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4]"
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Subheadline</div>
          <textarea
            value={subhead}
            onChange={e => setSubhead(e.target.value)}
            rows={2}
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4]"
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Right-side Image</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {rightImage ? (
            <div className="relative rounded-[10px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
              <img src={rightImage} alt="Preview" className="w-full h-[120px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-[8px] gap-[6px]">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="py-[5px] px-[10px] rounded-[6px] text-[11px] font-semibold bg-[rgba(255,255,255,0.15)] backdrop-blur-md border border-white/20 text-white hover:bg-[rgba(255,255,255,0.25)] cursor-pointer transition-all"
                >
                  Replace
                </button>
                <button
                  onClick={() => setRightImage(null)}
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
          <span className="text-[#64748B] text-[11px]">— {activeTpl.label}</span>
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
              {/* Subtle vignette/overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,11,22,0.45)] via-transparent to-transparent" />

              {/* Logo top-left */}
              <img
                src={LOGO_URL}
                alt="HighLevel"
                className="absolute z-[5] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                style={{ top: "6%", left: "5%", height: "8%", width: "auto" }}
                crossOrigin="anonymous"
              />

              {/* Text block (left, aligned to logo) */}
              <div
                className="absolute z-[4] flex flex-col"
                style={{ top: "28%", left: "5%", width: "52%" }}
              >
                <div
                  ref={headlineRef}
                  className="font-['Poppins'] font-black text-white leading-[1.05]"
                  style={{
                    fontSize: `${headlineFontPx}px`,
                    textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {headline}
                </div>
                {subhead && (
                  <div
                    className="font-['Poppins'] font-medium leading-[1.4] mt-[18px]"
                    style={{
                      color: "#7CC8FF",
                      fontSize: `${Math.max(14, Math.round(headlineFontPx * 0.38))}px`,
                      textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    {subhead}
                  </div>
                )}
              </div>

              {/* Right-side image area */}
              <div
                className="absolute z-[4] flex items-center justify-center"
                style={{ top: "12%", right: "5%", width: "36%", height: "76%" }}
              >
                {rightImage ? (
                  <img
                    src={rightImage}
                    alt=""
                    className="max-w-full max-h-full object-contain rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-white/15 bg-white/[0.03]">
                    <ImageIcon className="w-[40px] h-[40px] text-white/20 mb-[8px]" />
                    <div className="text-[12px] text-white/40 font-semibold uppercase tracking-[1px]">Image area</div>
                    <div className="text-[10px] text-white/25 mt-[2px]">Upload from sidebar</div>
                  </div>
                )}
              </div>
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
