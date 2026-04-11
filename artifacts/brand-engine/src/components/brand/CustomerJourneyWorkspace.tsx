import { useState, useRef, useCallback } from "react";
import { Download, Loader2, Edit3, RotateCcw } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
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
  const [quickRef, setQuickRef] = useState<QuickRefRow[]>(DEFAULT_QUICKREF);

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
      const scale = 2550 / el.offsetWidth;
      const dataUrl = await toPng(el, { width: el.offsetWidth, height: el.offsetHeight, pixelRatio: scale, cacheBust: true, skipAutoScale: true, style: { borderRadius: "0" } });
      const safeName = title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_");
      const d = new Date();
      const dp = `${d.getMonth()+1}_${d.getDate()}_${String(d.getFullYear()).slice(-2)}`;
      if (exportFormat === "pdf") {
        const img = new Image(); img.src = dataUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
        pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11);
        pdf.save(`${safeName}_${dp}.pdf`);
        createThumbnail(dataUrl).then(t => addExport({ name: `${safeName}_${dp}.pdf`, source: "Print Templates", format: "pdf", thumbnail: t, dimensions: "8.5x11in" }));
      } else {
        const a = document.createElement("a"); a.href = dataUrl; a.download = `${safeName}_${dp}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        createThumbnail(dataUrl).then(t => addExport({ name: `${safeName}_${dp}.png`, source: "Print Templates", format: "png", thumbnail: t, dimensions: "2550x3300" }));
      }
    } catch (err) { console.error("Export failed:", err); } finally { setIsExporting(false); }
  }, [title, exportFormat]);

  const T = ({ value, onChange, className, multiline }: { value: string; onChange: (v: string) => void; className?: string; multiline?: boolean }) => {
    if (!isEditing) return <span className={className}>{value}</span>;
    if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[3px] px-[3px] outline-none resize-none`} rows={2} />;
    return <input value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[3px] px-[3px] outline-none w-full`} />;
  };

  const phaseColors = [
    { accent: "#00B2A9", bg: "rgba(0,178,169,0.06)", border: "rgba(0,178,169,0.12)", glow: "rgba(0,178,169,0.25)", label: "Phase 1", time: "Day 0 – Trial Start", heading: "Trial & Conversion" },
    { accent: "#2896FB", bg: "rgba(40,150,251,0.06)", border: "rgba(40,150,251,0.12)", glow: "rgba(40,150,251,0.25)", label: "Phase 2", time: "Day 1 – Day 90", heading: "Customer Success" },
    { accent: "#00B2A9", bg: "rgba(0,178,169,0.06)", border: "rgba(0,178,169,0.12)", glow: "rgba(0,178,169,0.25)", label: "Phase 3", time: "Day 91+", heading: "Account Management" },
  ];
  const allIcons = [ICONS_1, ICONS_2, ICONS_3];
  const allItems = [phase1Items, phase2Items, phase3Items];

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
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Export Format</div>
          <div className="flex gap-[4px]">
            {(["pdf","png"] as const).map(f => (
              <button key={f} onClick={() => setExportFormat(f)} className={`flex-1 py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all uppercase ${exportFormat===f ? "bg-[rgba(0,178,169,0.15)] border-[rgba(0,178,169,0.3)] text-[#00B2A9]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>{f}</button>
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
          <button onClick={handleExport} disabled={isExporting} className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[14px] text-[13px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#00B2A9] to-[#2896FB] text-white shadow-[0_4px_20px_rgba(0,178,169,0.3)] hover:shadow-[0_6px_28px_rgba(0,178,169,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none">
            {isExporting ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Download className="w-[16px] h-[16px]" />} Export as {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-[30px] bg-[rgba(6,11,22,0.5)]">
        <div ref={previewRef} className="font-['Poppins']" style={{ width: "680px", height: "880px", position: "relative", overflow: "hidden", background: "#060B16", boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>

          {/* FULL-PAGE BG */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 10%, rgba(0,178,169,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(40,150,251,0.06) 0%, transparent 50%), radial-gradient(ellipse at 30% 90%, rgba(0,178,169,0.05) 0%, transparent 40%)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          {/* HEADER */}
          <div style={{ position: "relative", zIndex: 2, padding: "22px 32px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "9px", background: "linear-gradient(135deg, #00B2A9, #2896FB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,178,169,0.4)" }}>
                  <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(10)" }} />
                </div>
                <span style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "3px", textTransform: "uppercase" }}>HighLevel</span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0.15,0.3,0.5,0.3,0.15].map((o,i) => <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: `rgba(0,178,169,${o})` }} />)}
              </div>
            </div>
            <div style={{ marginTop: "14px" }}>
              <T value={title} onChange={setTitle} className="block text-[26px] font-black text-white leading-[1.05] tracking-[-1px]" />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <div style={{ height: "2px", width: "40px", borderRadius: "2px", background: "linear-gradient(90deg, #00B2A9, #2896FB)" }} />
                <T value={subtitle} onChange={setSubtitle} className="text-[11px] font-semibold text-[rgba(255,255,255,0.35)] tracking-[1px] uppercase" />
              </div>
            </div>
          </div>

          {/* VERTICAL JOURNEY LINE */}
          <div style={{ position: "absolute", top: "110px", bottom: "120px", left: "52px", width: "2px", background: "linear-gradient(180deg, #00B2A9, #2896FB 50%, #00B2A9)", zIndex: 1, opacity: 0.3 }} />

          {/* PHASE SECTIONS */}
          <div style={{ position: "relative", zIndex: 2, marginTop: "18px", display: "flex", flexDirection: "column", gap: "0px" }}>

            {[0, 1, 2].map(pi => {
              const c = phaseColors[pi];
              const icons = allIcons[pi];
              const items = allItems[pi];
              return (
                <div key={pi} style={{ position: "relative", padding: "10px 32px 10px 32px" }}>
                  {/* Phase marker on the line */}
                  <div style={{ position: "absolute", left: "40px", top: "12px", width: "24px", height: "24px", borderRadius: "50%", background: `linear-gradient(135deg, ${c.accent}, ${pi===1?'#1E7FE0':'#009E96'})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${c.glow}, 0 0 0 4px rgba(6,11,22,1), 0 0 0 6px ${c.accent}30`, zIndex: 3 }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 900 }}>{pi+1}</span>
                  </div>

                  {/* Phase content card */}
                  <div style={{ marginLeft: "42px", background: "rgba(255,255,255,0.03)", border: `1px solid ${c.border}`, borderRadius: "16px", padding: "14px 18px 14px 18px", backdropFilter: "blur(10px)", position: "relative", overflow: "hidden" }}>
                    {/* Subtle accent glow top-left */}
                    <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${c.accent}10 0%, transparent 70%)` }} />

                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", position: "relative" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                          <span style={{ fontSize: "7px", fontWeight: 800, color: c.accent, letterSpacing: "2px", textTransform: "uppercase" }}>{c.label}</span>
                          <div style={{ height: "1px", width: "20px", background: `${c.accent}40` }} />
                          <span style={{ fontSize: "7px", fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>{c.time}</span>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "white", lineHeight: 1.15 }}>{c.heading}</div>
                      </div>
                      {/* Decorative ring */}
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `2px solid ${c.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${c.accent}10`, border: `1px solid ${c.accent}15` }} />
                      </div>
                    </div>

                    {/* Items row - horizontal layout */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${c.border}`, borderRadius: "12px", padding: "10px", position: "relative", overflow: "hidden" }}>
                          {/* Top accent line */}
                          <div style={{ position: "absolute", top: 0, left: "12px", right: "12px", height: "2px", borderRadius: "0 0 2px 2px", background: `linear-gradient(90deg, ${c.accent}60, ${c.accent}20)` }} />

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                            <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: `${c.accent}12`, border: `1px solid ${c.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "11px", height: "11px" }}>{icons[i]}</svg>
                            </div>
                            <T value={item.title} onChange={v => up((pi+1) as 1|2|3, i, "title", v)} className="block text-[7.5px] font-bold text-white leading-[1.2]" />
                          </div>
                          <T value={item.desc} onChange={v => up((pi+1) as 1|2|3, i, "desc", v)} className="block text-[6.5px] text-[rgba(255,255,255,0.4)] leading-[1.5]" multiline />
                        </div>
                      ))}
                    </div>

                    {/* Persona pills for Phase 2 */}
                    {pi === 1 && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "center" }}>
                        {["Dreamers", "Agencies", "End Users"].map(p => (
                          <div key={p} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(40,150,251,0.08)", border: "1px solid rgba(40,150,251,0.15)", borderRadius: "20px", padding: "3px 10px 3px 5px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#2896FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "10px", height: "10px" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span style={{ fontSize: "6.5px", fontWeight: 700, color: "#2896FB" }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flowing connector between phases */}
                  {pi < 2 && (
                    <div style={{ position: "absolute", left: "49px", bottom: "-8px", zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <svg width="6" height="16" viewBox="0 0 6 16"><path d="M3 0 L3 10 L1 8 M3 10 L5 8" stroke={pi === 0 ? "#00B2A9" : "#2896FB"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* QUICK REFERENCE */}
          <div style={{ position: "absolute", bottom: "28px", left: "28px", right: "28px", zIndex: 2 }}>
            <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)" }}>
              <div style={{ padding: "7px 14px", background: "linear-gradient(90deg, rgba(0,178,169,0.08), rgba(40,150,251,0.08))", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "5px", background: "rgba(0,178,169,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "9px", height: "9px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span style={{ fontSize: "7px", fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "2px", textTransform: "uppercase" }}>Quick Reference — Find Your Team</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Stage","Interaction Link","Responsible Team"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "5px 14px", fontWeight: 800, color: "rgba(255,255,255,0.35)", fontSize: "6.5px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "5px 14px", fontWeight: 700, color: "rgba(255,255,255,0.7)", fontSize: "7px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><T value={row.stage} onChange={v => uq(i,"stage",v)} className="text-[7px]" /></td>
                      <td style={{ padding: "5px 14px", fontSize: "7px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><T value={row.link} onChange={v => uq(i,"link",v)} className="text-[7px] text-[#2896FB] font-bold" /></td>
                      <td style={{ padding: "5px 14px", color: "rgba(255,255,255,0.35)", fontSize: "7px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><T value={row.team} onChange={v => uq(i,"team",v)} className="text-[7px]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "10px", height: "10px", objectFit: "contain" }} />
              <span style={{ fontSize: "6px", fontWeight: 600, color: "rgba(255,255,255,0.2)" }}>HighLevel — Internal Use Only</span>
            </div>
            <span style={{ fontSize: "6px", fontWeight: 500, color: "rgba(255,255,255,0.12)" }}>gohighlevel.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
