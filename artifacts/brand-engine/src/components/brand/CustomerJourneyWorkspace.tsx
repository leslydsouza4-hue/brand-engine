import { useState, useRef, useCallback } from "react";
import { Download, Loader2, Edit3, RotateCcw } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";

const BASE = import.meta.env.BASE_URL;

interface PhaseItem {
  title: string;
  desc: string;
}

interface QuickRefRow {
  stage: string;
  link: string;
  team: string;
}

const DEFAULT_TITLE = "The HighLevel Customer Journey";
const DEFAULT_SUBTITLE = "From Trial to Growth";

const DEFAULT_PHASE1: PhaseItem[] = [
  { title: "The Demo & Kickoff Phase", desc: "Prospective users join 24/7 group Zoom rooms to ask questions and see the platform." },
  { title: "Goal-Oriented Onboarding", desc: "The Trial Experience team uses kickoff calls to identify specific goals and core features." },
  { title: "The Conversion Goal", desc: "Teams focus on 5-6 key features to convert trial users to paid plans without overwhelm." },
];

const DEFAULT_PHASE2: PhaseItem[] = [
  { title: 'The "Done-With-You" Onboarding', desc: "Success teams provide screen-share consultations to help customers set up business profiles and lead connectors." },
  { title: "Integrated Support", desc: "For the first 90 days, the Customer Success team replaces the standard support chatbot." },
  { title: "Persona-Driven Strategy", desc: 'Support is tailored to "Dreamers," marketing agencies, or small business "End Users."' },
];

const DEFAULT_PHASE3: PhaseItem[] = [
  { title: "The Day 91 Handover", desc: "Account management takes over with a focus on long-term growth and retention." },
  { title: "Scaling Through Expansion", desc: "Managers focus on high-level add-ons like HIPAA compliance, WhatsApp, and AI Employees." },
  { title: "Technical Support Pivot", desc: "Standard Support teams take over specifically for technical bugs and platform issues." },
];

const DEFAULT_QUICKREF: QuickRefRow[] = [
  { stage: "Pre-Trial / Inquiry", link: "speakwith.us/demo", team: "Demo Team" },
  { stage: "Active Trial", link: "speakwith.us/kickoff", team: "Trial Experience Team" },
  { stage: "Existing Customer", link: "speakwith.us/console", team: "Account Management" },
];

const DEFAULT_PHASE1_LINK = "speakwith.us/kickoff";
const DEFAULT_PHASE3_LINK = "speakwith.us/console";

const PHASE_ICONS_1 = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
];

const PHASE_ICONS_2 = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
];

const PHASE_ICONS_3 = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
];

export function CustomerJourneyWorkspace() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [phase1Items, setPhase1Items] = useState<PhaseItem[]>(DEFAULT_PHASE1);
  const [phase2Items, setPhase2Items] = useState<PhaseItem[]>(DEFAULT_PHASE2);
  const [phase3Items, setPhase3Items] = useState<PhaseItem[]>(DEFAULT_PHASE3);
  const [phase1Link, setPhase1Link] = useState(DEFAULT_PHASE1_LINK);
  const [phase3Link, setPhase3Link] = useState(DEFAULT_PHASE3_LINK);
  const [quickRef, setQuickRef] = useState<QuickRefRow[]>(DEFAULT_QUICKREF);

  const updatePhaseItem = (phase: 1 | 2 | 3, idx: number, field: keyof PhaseItem, val: string) => {
    const setter = phase === 1 ? setPhase1Items : phase === 2 ? setPhase2Items : setPhase3Items;
    setter(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const updateQuickRef = (idx: number, field: keyof QuickRefRow, val: string) => {
    setQuickRef(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  const resetAll = () => {
    setTitle(DEFAULT_TITLE);
    setSubtitle(DEFAULT_SUBTITLE);
    setPhase1Items(DEFAULT_PHASE1);
    setPhase2Items(DEFAULT_PHASE2);
    setPhase3Items(DEFAULT_PHASE3);
    setPhase1Link(DEFAULT_PHASE1_LINK);
    setPhase3Link(DEFAULT_PHASE3_LINK);
    setQuickRef(DEFAULT_QUICKREF);
  };

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const el = previewRef.current;
      const scale = 2550 / el.offsetWidth;
      const opts = { width: el.offsetWidth, height: el.offsetHeight, pixelRatio: scale, cacheBust: true, skipAutoScale: true, style: { borderRadius: "0" } };
      const dataUrl = await toPng(el, opts);

      const safeName = title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");
      const d = new Date();
      const datePart = `${d.getMonth()+1}_${d.getDate()}_${String(d.getFullYear()).slice(-2)}`;
      const fileName = `${safeName}_${datePart}`;

      if (exportFormat === "pdf") {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
        pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11);
        pdf.save(`${fileName}.pdf`);
        createThumbnail(dataUrl).then(thumb => addExport({ name: `${fileName}.pdf`, source: "Print Templates", format: "pdf", thumbnail: thumb, dimensions: "8.5x11in" }));
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then(thumb => addExport({ name: `${fileName}.png`, source: "Print Templates", format: "png", thumbnail: thumb, dimensions: "2550x3300" }));
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [title, exportFormat]);

  const EditableText = ({ value, onChange, className, multiline }: { value: string; onChange: (v: string) => void; className?: string; multiline?: boolean }) => {
    if (!isEditing) return <span className={className}>{value}</span>;
    if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[4px] px-[4px] outline-none resize-none`} rows={2} />;
    return <input value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[4px] px-[4px] outline-none w-full`} />;
  };

  const PhaseCard = ({ phaseNum, phaseLabel, phaseSub, items, icons, color, link, onLinkChange }: {
    phaseNum: number; phaseLabel: string; phaseSub: string; items: PhaseItem[]; icons: JSX.Element[]; color: string; link?: string; onLinkChange?: (v: string) => void;
  }) => {
    const isBlue = color === "blue";
    const accent = isBlue ? "#2896FB" : "#00B2A9";
    const bgGrad = isBlue
      ? "linear-gradient(180deg, rgba(40,150,251,0.06) 0%, rgba(40,150,251,0.02) 100%)"
      : "linear-gradient(180deg, rgba(0,178,169,0.06) 0%, rgba(0,178,169,0.02) 100%)";
    const borderCol = isBlue ? "rgba(40,150,251,0.12)" : "rgba(0,178,169,0.12)";
    const iconBg = isBlue ? "rgba(40,150,251,0.1)" : "rgba(0,178,169,0.1)";

    return (
      <div className="flex-1 flex flex-col rounded-[14px] relative overflow-hidden" style={{ background: bgGrad, border: `1.5px solid ${borderCol}` }}>
        <div className="px-[14px] pt-[14px] pb-[8px]">
          <div className="flex items-center gap-[6px] mb-[2px]">
            <div className="flex items-center justify-center rounded-full" style={{ width: "18px", height: "18px", background: accent }}>
              <span className="text-white text-[8px] font-extrabold">{phaseNum}</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[1.5px]" style={{ color: accent }}>Phase {phaseNum}</span>
          </div>
          <div className="text-[11.5px] font-extrabold text-[#060B16] leading-[1.15]">{phaseLabel}</div>
          <div className="text-[8px] font-medium text-[#64748B] mt-[1px]">{phaseSub}</div>
        </div>

        <div className="flex-1 px-[12px] pb-[10px] flex flex-col gap-[6px]">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-[8px] rounded-[10px] p-[8px]" style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${borderCol}` }}>
              <div className="shrink-0 rounded-[8px] flex items-center justify-center mt-[1px]" style={{ width: "26px", height: "26px", background: iconBg, color: accent }}>
                <div style={{ width: "14px", height: "14px" }}>{icons[i]}</div>
              </div>
              <div className="flex-1 min-w-0">
                <EditableText
                  value={item.title}
                  onChange={v => updatePhaseItem(phaseNum as 1|2|3, i, "title", v)}
                  className="block text-[8.5px] font-bold text-[#0F172A] leading-[1.2] mb-[1px]"
                />
                <EditableText
                  value={item.desc}
                  onChange={v => updatePhaseItem(phaseNum as 1|2|3, i, "desc", v)}
                  className="block text-[7px] text-[#64748B] leading-[1.35]"
                  multiline
                />
              </div>
            </div>
          ))}
        </div>

        {link && onLinkChange && (
          <div className="px-[12px] pb-[10px] mt-auto">
            <div className="inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]" style={{ background: accent }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "8px", height: "8px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <EditableText value={link} onChange={onLinkChange} className="text-[7.5px] font-bold text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[280px] shrink-0 border-r border-white/5 bg-[rgba(3,11,23,0.5)] overflow-y-auto sidebar-scroll p-[20px] flex flex-col gap-[16px]">
        <div>
          <h2 className="text-white text-[15px] font-semibold mb-[4px]">Customer Journey</h2>
          <p className="text-[11px] text-[#64748B] leading-[1.5]">Print-ready infographic — 8.5×11" format. Edit content and export as PDF or PNG.</p>
        </div>

        <div className="flex items-center gap-[8px]">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex-1 flex items-center justify-center gap-[6px] py-[8px] rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all border ${
              isEditing
                ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
            }`}
          >
            <Edit3 className="w-[12px] h-[12px]" />
            {isEditing ? "Editing On" : "Edit Content"}
          </button>
          <button
            onClick={resetAll}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#FF4D4D] hover:border-[rgba(255,77,77,0.3)] cursor-pointer transition-all"
            title="Reset to defaults"
          >
            <RotateCcw className="w-[12px] h-[12px]" />
          </button>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Export Format</div>
          <div className="flex gap-[4px]">
            {(["pdf", "png"] as const).map(f => (
              <button
                key={f}
                onClick={() => setExportFormat(f)}
                className={`flex-1 py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all uppercase ${
                  exportFormat === f
                    ? "bg-[rgba(0,178,169,0.15)] border-[rgba(0,178,169,0.3)] text-[#00B2A9]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Phase 1 — Trial</div>
          {phase1Items.map((item, i) => (
            <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.title}</div>
              <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Phase 2 — Success</div>
          {phase2Items.map((item, i) => (
            <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.title}</div>
              <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Phase 3 — Growth</div>
          {phase3Items.map((item, i) => (
            <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.title}</div>
              <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-[16px]">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[14px] text-[13px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#00B2A9] to-[#2896FB] text-white shadow-[0_4px_20px_rgba(0,178,169,0.3)] hover:shadow-[0_6px_28px_rgba(0,178,169,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            {isExporting ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Download className="w-[16px] h-[16px]" />}
            Export as {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-[30px] bg-[rgba(6,11,22,0.5)]">
        <div
          ref={previewRef}
          className="font-['Poppins']"
          style={{
            width: "680px",
            height: "880px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(170deg, #FFFFFF 0%, #F8FFFE 25%, #F0FBFA 50%, #F4F9FF 75%, #FFFFFF 100%)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 20% 10%, rgba(0,178,169,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(40,150,251,0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(0,178,169,0.02) 0%, transparent 70%)"
          }} />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00B2A9" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: "linear-gradient(90deg, #00B2A9 0%, #2896FB 50%, #00B2A9 100%)" }} />

          <div className="relative px-[30px] pt-[20px] pb-[12px] flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00B2A9 0%, #2896FB 100%)", boxShadow: "0 2px 8px rgba(0,178,169,0.3)" }}>
                <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" className="w-[16px] h-[16px] object-contain" style={{ filter: "brightness(10)" }} />
              </div>
              <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[2px]">HighLevel</span>
            </div>
            <div className="flex items-center gap-[3px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#00B2A9]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#2896FB]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#00B2A9] opacity-50" />
            </div>
          </div>

          <div className="relative px-[30px] pb-[16px]">
            <EditableText
              value={title}
              onChange={setTitle}
              className="block text-[22px] font-extrabold text-[#060B16] leading-[1.1] tracking-[-0.5px]"
            />
            <div className="flex items-center gap-[8px] mt-[4px]">
              <div className="h-[2px] w-[32px] rounded-full" style={{ background: "linear-gradient(90deg, #00B2A9, #2896FB)" }} />
              <EditableText
                value={subtitle}
                onChange={setSubtitle}
                className="text-[11px] font-semibold text-[#64748B] tracking-[0.5px]"
              />
            </div>
          </div>

          <div className="relative px-[20px] flex items-center gap-[6px] mb-[10px]">
            <div className="flex items-center gap-[4px] flex-1">
              <div className="h-[1.5px] flex-1 rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(0,178,169,0.2), rgba(0,178,169,0.4))" }} />
              <svg viewBox="0 0 12 12" fill="#00B2A9" style={{ width: "8px", height: "8px" }}><polygon points="6,0 12,6 6,12 0,6"/></svg>
            </div>
            <span className="text-[7px] font-bold uppercase tracking-[2px] text-[#94A3B8] px-[6px]">Day 0</span>
            <div className="flex items-center gap-[0px] flex-[2]">
              <div className="h-[1.5px] flex-1" style={{ background: "linear-gradient(90deg, rgba(0,178,169,0.4), rgba(40,150,251,0.4))" }} />
              <svg viewBox="0 0 12 12" fill="#2896FB" style={{ width: "8px", height: "8px" }}><polygon points="6,0 12,6 6,12 0,6"/></svg>
              <div className="h-[1.5px] flex-1" style={{ background: "linear-gradient(90deg, rgba(40,150,251,0.4), rgba(40,150,251,0.4))" }} />
            </div>
            <span className="text-[7px] font-bold uppercase tracking-[2px] text-[#94A3B8] px-[6px]">Day 90</span>
            <div className="flex items-center gap-[4px] flex-1">
              <svg viewBox="0 0 12 12" fill="#00B2A9" style={{ width: "8px", height: "8px" }}><polygon points="6,0 12,6 6,12 0,6"/></svg>
              <div className="h-[1.5px] flex-1 rounded-full" style={{ background: "linear-gradient(90deg, rgba(0,178,169,0.4), rgba(0,178,169,0.2), transparent)" }} />
            </div>
            <span className="text-[7px] font-bold uppercase tracking-[2px] text-[#94A3B8]">Day 91+</span>
          </div>

          <div className="relative px-[16px] flex gap-[8px]" style={{ height: "470px" }}>
            <PhaseCard
              phaseNum={1} phaseLabel="The Trial & Conversion" phaseSub="Experience" items={phase1Items} icons={PHASE_ICONS_1} color="teal"
              link={phase1Link} onLinkChange={setPhase1Link}
            />
            <PhaseCard
              phaseNum={2} phaseLabel="The First 90 Days" phaseSub="Customer Success" items={phase2Items} icons={PHASE_ICONS_2} color="blue"
            />
            <PhaseCard
              phaseNum={3} phaseLabel="Account Management" phaseSub="Growth & Retention" items={phase3Items} icons={PHASE_ICONS_3} color="teal"
              link={phase3Link} onLinkChange={setPhase3Link}
            />
          </div>

          <div className="relative px-[24px] pt-[12px] pb-[6px]">
            <div className="rounded-[12px] overflow-hidden" style={{ border: "1.5px solid rgba(0,178,169,0.12)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div className="px-[14px] py-[7px] flex items-center gap-[6px]" style={{ background: "linear-gradient(135deg, #060B16 0%, #0C1829 100%)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "10px", height: "10px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span className="text-[8px] font-bold text-white uppercase tracking-[1.5px]">Quick Reference — Find Your Team</span>
              </div>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,178,169,0.04)" }}>
                    <th className="text-left px-[12px] py-[5px] font-bold text-[#0F172A] text-[7px] uppercase tracking-[1px]" style={{ borderBottom: "1px solid rgba(0,178,169,0.08)" }}>Stage</th>
                    <th className="text-left px-[12px] py-[5px] font-bold text-[#0F172A] text-[7px] uppercase tracking-[1px]" style={{ borderBottom: "1px solid rgba(0,178,169,0.08)" }}>Interaction Link</th>
                    <th className="text-left px-[12px] py-[5px] font-bold text-[#0F172A] text-[7px] uppercase tracking-[1px]" style={{ borderBottom: "1px solid rgba(0,178,169,0.08)" }}>Responsible Team</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "rgba(0,178,169,0.02)" }}>
                      <td className="px-[12px] py-[5px] font-semibold text-[#0F172A]" style={{ fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <EditableText value={row.stage} onChange={v => updateQuickRef(i, "stage", v)} className="text-[7.5px]" />
                      </td>
                      <td className="px-[12px] py-[5px]" style={{ fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <EditableText value={row.link} onChange={v => updateQuickRef(i, "link", v)} className="text-[7.5px] text-[#2896FB] font-bold" />
                      </td>
                      <td className="px-[12px] py-[5px] text-[#64748B]" style={{ fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <EditableText value={row.team} onChange={v => updateQuickRef(i, "team", v)} className="text-[7.5px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[28px] py-[8px]" style={{ background: "linear-gradient(135deg, #060B16 0%, #0C1829 100%)" }}>
            <div className="flex items-center gap-[6px]">
              <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" className="w-[12px] h-[12px] object-contain" />
              <span className="text-[7px] font-semibold text-white/50">HighLevel — Internal Use Only</span>
            </div>
            <div className="flex items-center gap-[8px]">
              <div className="h-[1px] w-[20px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,178,169,0.3))" }} />
              <span className="text-[7px] font-medium text-white/30">gohighlevel.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
