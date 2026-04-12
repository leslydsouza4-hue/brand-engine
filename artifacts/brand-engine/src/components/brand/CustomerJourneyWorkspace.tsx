import { useState, useRef, useCallback } from "react";
import { Download, Loader2, Edit3, RotateCcw, Sun, Moon } from "lucide-react";
import { toPng } from "html-to-image";
import { addExport, createThumbnail } from "./exportStore";

const BASE = import.meta.env.BASE_URL;

interface PhaseItem { title: string; desc: string; }
interface QuickRefRow { stage: string; link: string; team: string; }

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

const ICONS_1 = [
  <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
  <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
  <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
];
const ICONS_2 = [
  <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
];
const ICONS_3 = [
  <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
  <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
];

const dark = {
  bg: "#060B16",
  bgImage: "backgrounds-dark/Type=Core Gradient.png",
  bgGlow1: "rgba(40,150,251,0.08)",
  bgGlow2: "rgba(9,93,195,0.06)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(40,150,251,0.12)",
  itemBg: "rgba(255,255,255,0.05)",
  itemBorder: "rgba(40,150,251,0.10)",
  heading: "#FFFFFF",
  title: "#FFFFFF",
  body: "rgba(255,255,255,0.5)",
  muted: "rgba(255,255,255,0.25)",
  tableBorder: "rgba(255,255,255,0.06)",
  tableHeaderBg: "rgba(40,150,251,0.08)",
  tableRowBg: "rgba(255,255,255,0.02)",
  tableRowAlt: "transparent",
  tableText: "rgba(255,255,255,0.65)",
  tableMuted: "rgba(255,255,255,0.35)",
  footerBg: "transparent",
  footerText: "rgba(255,255,255,0.2)",
  dotPattern: "rgba(255,255,255,0.025)",
  lineBg: "rgba(40,150,251,0.2)",
  markerRing: "#060B16",
  logo: "Lockup=Full Horizontal, Color=Light.png",
  logoIcon: "Lockup=Icon, Color=Light.png",
};

const light = {
  bg: "#FFFFFF",
  bgImage: "backgrounds-light/Property 1=Neutral.png",
  bgGlow1: "rgba(40,150,251,0.05)",
  bgGlow2: "rgba(9,93,195,0.03)",
  cardBg: "rgba(40,150,251,0.03)",
  cardBorder: "rgba(40,150,251,0.10)",
  itemBg: "#FFFFFF",
  itemBorder: "rgba(40,150,251,0.10)",
  heading: "#060B16",
  title: "#060B16",
  body: "#475569",
  muted: "#94A3B8",
  tableBorder: "rgba(0,0,0,0.06)",
  tableHeaderBg: "rgba(40,150,251,0.06)",
  tableRowBg: "#FFFFFF",
  tableRowAlt: "#F8FAFC",
  tableText: "#1E293B",
  tableMuted: "#64748B",
  footerBg: "#F1F5F9",
  footerText: "#94A3B8",
  dotPattern: "rgba(0,0,0,0.025)",
  lineBg: "rgba(40,150,251,0.15)",
  markerRing: "#FFFFFF",
  logo: "Lockup=Full Horizontal, Color=Dark.png",
  logoIcon: "Lockup=Icon, Color=Full.png",
};

const BLUE = "#2896FB";
const ROYAL = "#095DC3";

export function CustomerJourneyWorkspace() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [isEditing, setIsEditing] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [phase1Items, setPhase1Items] = useState<PhaseItem[]>(DEFAULT_PHASE1);
  const [phase2Items, setPhase2Items] = useState<PhaseItem[]>(DEFAULT_PHASE2);
  const [phase3Items, setPhase3Items] = useState<PhaseItem[]>(DEFAULT_PHASE3);
  const [quickRef, setQuickRef] = useState<QuickRefRow[]>(DEFAULT_QUICKREF);

  const th = isDark ? dark : light;

  const up = (phase: 1|2|3, idx: number, field: keyof PhaseItem, val: string) => {
    const s = phase === 1 ? setPhase1Items : phase === 2 ? setPhase2Items : setPhase3Items;
    s(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };
  const uq = (idx: number, field: keyof QuickRefRow, val: string) => {
    setQuickRef(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };
  const resetAll = () => { setTitle(DEFAULT_TITLE); setSubtitle(DEFAULT_SUBTITLE); setPhase1Items(DEFAULT_PHASE1); setPhase2Items(DEFAULT_PHASE2); setPhase3Items(DEFAULT_PHASE3); setQuickRef(DEFAULT_QUICKREF); };

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const el = previewRef.current;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const DPI = 300;
      const pxW = 8.5 * DPI;
      const scale = pxW / w;
      const dataUrl = await toPng(el, { width: w, height: h, pixelRatio: scale, cacheBust: true, skipAutoScale: true, style: { borderRadius: "0" } });
      const safeName = title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");
      const d = new Date();
      const dp = `${d.getMonth()+1}_${d.getDate()}_${String(d.getFullYear()).slice(-2)}`;
      const mode = isDark ? "Dark" : "Light";
      const fname = `${safeName}_${mode}_CMYK_${dp}`;
      if (exportFormat === "pdf") {
        const pageW = 8.5;
        const pageH = (h / w) * pageW;
        const resp = await fetch(`${BASE}api/convert-cmyk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: dataUrl, filename: `${fname}.pdf`, pageWidth: pageW, pageHeight: pageH }),
        });
        if (!resp.ok) throw new Error(`CMYK conversion failed: ${resp.statusText}`);
        const { pdf: pdfBase64 } = await resp.json();
        const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${fname}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        createThumbnail(dataUrl).then(t => addExport({ name: `${fname}.pdf`, source: "Events", format: "pdf", thumbnail: t, dimensions: `${pageW}x${pageH.toFixed(1)}in (CMYK)` }));
      } else {
        const a = document.createElement("a"); a.href = dataUrl; a.download = `${fname}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        createThumbnail(dataUrl).then(t => addExport({ name: `${fname}.png`, source: "Events", format: "png", thumbnail: t, dimensions: `${Math.round(pxW)}x${Math.round(h * scale)}` }));
      }
    } catch (err) { console.error("Export failed:", err); } finally { setIsExporting(false); }
  }, [title, exportFormat, isDark]);

  const T = ({ value, onChange, className, multiline, style }: { value: string; onChange: (v: string) => void; className?: string; multiline?: boolean; style?: React.CSSProperties }) => {
    if (!isEditing) return <span className={className} style={style}>{value}</span>;
    if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[3px] px-[3px] outline-none resize-none`} style={style} rows={2} />;
    return <input value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[3px] px-[3px] outline-none w-full`} style={style} />;
  };

  const phases = [
    { label: "Phase 1", time: "Day 0 – Trial Start", heading: "Trial & Conversion", items: phase1Items, icons: ICONS_1, pn: 1 as const },
    { label: "Phase 2", time: "Day 1 – Day 90", heading: "Customer Success", items: phase2Items, icons: ICONS_2, pn: 2 as const },
    { label: "Phase 3", time: "Day 91+", heading: "Account Management", items: phase3Items, icons: ICONS_3, pn: 3 as const },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[280px] shrink-0 border-r border-white/5 bg-[rgba(3,11,23,0.5)] overflow-y-auto sidebar-scroll p-[20px] flex flex-col gap-[16px]">
        <div>
          <h2 className="text-white text-[15px] font-semibold mb-[4px]">Customer Journey</h2>
          <p className="text-[11px] text-[#64748B] leading-[1.5]">Print-ready infographic — 8.5×11". Edit content and export as PDF or PNG.</p>
        </div>
        <div className="flex items-center gap-[8px]">
          <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 flex items-center justify-center gap-[6px] py-[8px] rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all border ${isEditing ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]" : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.15)]"}`}>
            <Edit3 className="w-[12px] h-[12px]" /> {isEditing ? "Editing On" : "Edit Content"}
          </button>
          <button onClick={resetAll} className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#FF4D4D] hover:border-[rgba(255,77,77,0.3)] cursor-pointer transition-all" title="Reset"><RotateCcw className="w-[12px] h-[12px]" /></button>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Theme</div>
          <div className="flex gap-[4px]">
            <button onClick={() => setIsDark(true)} className={`flex-1 flex items-center justify-center gap-[5px] py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all ${isDark ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>
              <Moon className="w-[11px] h-[11px]" /> Dark
            </button>
            <button onClick={() => setIsDark(false)} className={`flex-1 flex items-center justify-center gap-[5px] py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all ${!isDark ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>
              <Sun className="w-[11px] h-[11px]" /> Light
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Export Format</div>
          <div className="flex gap-[4px]">
            {(["pdf","png"] as const).map(f => (
              <button key={f} onClick={() => setExportFormat(f)} className={`flex-1 py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all uppercase ${exportFormat===f ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>{f}</button>
            ))}
          </div>
        </div>

        {[{l:"Phase 1 — Trial",items:phase1Items},{l:"Phase 2 — Success",items:phase2Items},{l:"Phase 3 — Growth",items:phase3Items}].map((s,si) => (
          <div key={si}>
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">{s.l}</div>
            {s.items.map((it,i) => (<div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"><div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{it.title}</div><div className="text-[10px] text-[#64748B] leading-[1.4]">{it.desc}</div></div>))}
          </div>
        ))}
        <div className="mt-auto pt-[16px]">
          <button onClick={handleExport} disabled={isExporting} className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[14px] text-[13px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#2896FB] to-[#095DC3] text-white shadow-[0_4px_20px_rgba(40,150,251,0.3)] hover:shadow-[0_6px_28px_rgba(40,150,251,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none">
            {isExporting ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Download className="w-[16px] h-[16px]" />} Export as {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>
      {/* PREVIEW */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-[30px] bg-[rgba(6,11,22,0.5)]">
        <div ref={previewRef} className="font-['Poppins']" style={{ width: "680px", height: "880px", position: "relative", overflow: "hidden", background: th.bg, boxShadow: "0 25px 80px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>

          {/* BG image */}
          <img src={`${BASE}assets/${th.bgImage}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
          {/* BG overlay effects */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 15%, ${th.bgGlow1} 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, ${th.bgGlow2} 0%, transparent 50%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${th.dotPattern} 1px, transparent 1px)`, backgroundSize: "24px 24px", pointerEvents: "none" }} />

          {/* HEADER */}
          <div style={{ position: "relative", zIndex: 2, padding: "24px 36px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <img src={`${BASE}assets/logos/${th.logo}`} alt="HighLevel" style={{ height: "22px", objectFit: "contain" }} />
              <div style={{ display: "flex", gap: "5px" }}>
                {[0.2,0.4,0.7,0.4,0.2].map((o,i) => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: `rgba(40,150,251,${o})` }} />)}
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <T value={title} onChange={setTitle} className="block text-[30px] font-semibold leading-[1.1] tracking-[-1px]" style={{ color: th.title }} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <div style={{ height: "3px", width: "44px", borderRadius: "2px", background: `linear-gradient(90deg, ${BLUE}, ${ROYAL})` }} />
                <T value={subtitle} onChange={setSubtitle} className="text-[13px] font-semibold tracking-[1.5px] uppercase" style={{ color: th.muted }} />
              </div>
            </div>
          </div>

          {/* PHASE SECTIONS — uses relative container for timeline line */}
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "8px", paddingBottom: "4px" }}>
            {/* VERTICAL JOURNEY LINE — spans from first to last marker */}
            <div style={{ position: "absolute", top: "12px", bottom: "12px", left: "56px", width: "2px", background: `linear-gradient(180deg, ${BLUE}50, ${ROYAL}40, ${BLUE}20)`, zIndex: 1 }} />

            {phases.map((ph, pi) => (
              <div key={pi} style={{ position: "relative", padding: "7px 36px 5px 36px" }}>
                {/* Phase marker dot */}
                <div style={{ position: "absolute", left: "44px", top: "12px", width: "26px", height: "26px", borderRadius: "50%", background: `linear-gradient(135deg, ${BLUE}, ${ROYAL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px ${BLUE}40, 0 0 0 3px ${th.markerRing}, 0 0 0 5px ${BLUE}25`, zIndex: 3 }}>
                  <span style={{ color: "white", fontSize: "12px", fontWeight: 900 }}>{pi+1}</span>
                </div>

                {/* Phase content */}
                <div style={{ marginLeft: "48px", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "14px", padding: "10px 14px", backdropFilter: "blur(10px)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}08 0%, transparent 70%)` }} />

                  {/* Header */}
                  <div style={{ marginBottom: "6px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: BLUE, letterSpacing: "2px", textTransform: "uppercase" }}>{ph.label}</span>
                      <div style={{ height: "1px", width: "20px", background: `${BLUE}35` }} />
                      <span style={{ fontSize: "9px", fontWeight: 600, color: th.muted, letterSpacing: "1px" }}>{ph.time}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: th.heading, lineHeight: 1.15 }}>{ph.heading}</div>
                  </div>

                  {/* Items */}
                  <div style={{ display: "flex", gap: "7px" }}>
                    {ph.items.map((item, i) => (
                      <div key={i} style={{ flex: 1, background: th.itemBg, border: `1px solid ${th.itemBorder}`, borderRadius: "10px", padding: "8px", position: "relative", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: `${BLUE}12`, border: `1px solid ${BLUE}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "11px", height: "11px" }}>{ph.icons[i]}</svg>
                          </div>
                          <T value={item.title} onChange={v => up(ph.pn, i, "title", v)} className="block text-[9px] font-bold leading-[1.25]" style={{ color: th.heading }} />
                        </div>
                        <T value={item.desc} onChange={v => up(ph.pn, i, "desc", v)} className="block text-[8.5px] leading-[1.5]" style={{ color: th.body }} multiline />
                      </div>
                    ))}
                  </div>

                </div>

                {/* Arrow connector between phases */}
                {pi < 2 && (
                  <div style={{ position: "absolute", left: "53px", bottom: "-4px", zIndex: 4 }}>
                    <svg width="8" height="12" viewBox="0 0 8 12"><path d="M4 0 L4 8 L2 5.5 M4 8 L6 5.5" stroke={BLUE} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* QUICK REFERENCE — anchored to bottom */}
          <div style={{ position: "relative", zIndex: 2, margin: "0 36px 20px" }}>
            <div style={{ borderRadius: "14px", overflow: "hidden", border: `1px solid ${th.tableBorder}` }}>
              <div style={{ padding: "8px 16px", background: th.tableHeaderBg, display: "flex", alignItems: "center", gap: "8px", borderBottom: `1px solid ${th.tableBorder}` }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "6px", background: `${BLUE}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "10px", height: "10px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: th.tableText, letterSpacing: "2px", textTransform: "uppercase" }}>Quick Reference — Find Your Team</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Stage","Interaction Link","Responsible Team"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 16px", fontWeight: 800, color: th.tableMuted, fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: `1px solid ${th.tableBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i} style={{ background: i%2===0 ? th.tableRowBg : th.tableRowAlt }}>
                      <td style={{ padding: "7px 16px", fontWeight: 700, fontSize: "10px", borderBottom: `1px solid ${th.tableBorder}` }}><T value={row.stage} onChange={v => uq(i,"stage",v)} className="text-[10px]" style={{ color: th.tableText }} /></td>
                      <td style={{ padding: "7px 16px", fontSize: "10px", borderBottom: `1px solid ${th.tableBorder}` }}><T value={row.link} onChange={v => uq(i,"link",v)} className="text-[10px] font-bold" style={{ color: BLUE }} /></td>
                      <td style={{ padding: "7px 16px", fontSize: "10px", borderBottom: `1px solid ${th.tableBorder}` }}><T value={row.team} onChange={v => uq(i,"team",v)} className="text-[10px]" style={{ color: th.tableMuted }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
