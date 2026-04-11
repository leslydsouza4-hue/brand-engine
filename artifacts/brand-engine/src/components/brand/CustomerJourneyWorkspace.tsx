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
const DEFAULT_P1_LINK = "speakwith.us/kickoff";
const DEFAULT_P3_LINK = "speakwith.us/console";

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
  const [phase1Link, setPhase1Link] = useState(DEFAULT_P1_LINK);
  const [phase3Link, setPhase3Link] = useState(DEFAULT_P3_LINK);
  const [quickRef, setQuickRef] = useState<QuickRefRow[]>(DEFAULT_QUICKREF);

  const up = (phase: 1|2|3, idx: number, field: keyof PhaseItem, val: string) => {
    const s = phase === 1 ? setPhase1Items : phase === 2 ? setPhase2Items : setPhase3Items;
    s(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };
  const uq = (idx: number, field: keyof QuickRefRow, val: string) => {
    setQuickRef(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };
  const resetAll = () => { setTitle(DEFAULT_TITLE); setSubtitle(DEFAULT_SUBTITLE); setPhase1Items(DEFAULT_PHASE1); setPhase2Items(DEFAULT_PHASE2); setPhase3Items(DEFAULT_PHASE3); setPhase1Link(DEFAULT_P1_LINK); setPhase3Link(DEFAULT_P3_LINK); setQuickRef(DEFAULT_QUICKREF); };

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

  const ItemCard = ({ item, phase, idx, icons, accent }: { item: PhaseItem; phase: 1|2|3; idx: number; icons: JSX.Element[]; accent: string }) => (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
      <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: `linear-gradient(135deg, ${accent}18, ${accent}08)`, border: `1.5px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>{icons[idx]}</svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <T value={item.title} onChange={v => up(phase, idx, "title", v)} className="block text-[8.5px] font-extrabold text-[#0F172A] leading-[1.25]" />
        <T value={item.desc} onChange={v => up(phase, idx, "desc", v)} className="block text-[6.5px] text-[#64748B] leading-[1.45] mt-[1px]" multiline />
      </div>
    </div>
  );

  const LinkPill = ({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent: string }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: accent, borderRadius: "8px", padding: "5px 10px", boxShadow: `0 3px 12px ${accent}50` }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "9px", height: "9px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      <T value={value} onChange={onChange} className="text-[7.5px] font-bold text-white" />
    </div>
  );

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
        <div ref={previewRef} className="font-['Poppins']" style={{ width: "680px", height: "880px", position: "relative", overflow: "hidden", background: "#F7FAFE", boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}>

          {/* BG BLOBS */}
          <div style={{ position: "absolute", top: "-60px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,178,169,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "100px", right: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(40,150,251,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "300px", left: "50%", transform: "translateX(-50%)", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,178,169,0.03) 0%, transparent 60%)" }} />

          {/* HEADER BAR */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "140px", background: "linear-gradient(135deg, #060B16 0%, #0A1628 50%, #0E1F3D 100%)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 10% 100%, rgba(0,178,169,0.25) 0%, transparent 50%), radial-gradient(ellipse at 90% 0%, rgba(40,150,251,0.2) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", top: "10px", right: "14px", display: "flex", gap: "6px", alignItems: "center" }}>
              {[0.15,0.3,0.5,0.3,0.15].map((o,i) => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: `rgba(0,178,169,${o})` }} />)}
            </div>
          </div>
          {/* WAVE */}
          <svg style={{ position: "absolute", top: "124px", left: 0, right: 0, width: "100%", height: "40px" }} viewBox="0 0 680 40" preserveAspectRatio="none">
            <path d="M0 16 C120 36 220 0 340 20 C460 40 560 4 680 16 L680 40 L0 40 Z" fill="#F7FAFE"/>
          </svg>

          {/* HEADER CONTENT */}
          <div style={{ position: "relative", zIndex: 2, padding: "16px 28px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg, #00B2A9, #2896FB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,178,169,0.4)" }}>
                <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "17px", height: "17px", objectFit: "contain", filter: "brightness(10)" }} />
              </div>
              <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "3px", textTransform: "uppercase" }}>HighLevel</span>
            </div>
            <T value={title} onChange={setTitle} className="block text-[22px] font-black text-white leading-[1.05] tracking-[-0.8px]" />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <div style={{ height: "3px", width: "36px", borderRadius: "2px", background: "linear-gradient(90deg, #00B2A9, #2896FB)" }} />
              <T value={subtitle} onChange={setSubtitle} className="text-[11px] font-semibold text-[rgba(255,255,255,0.45)] tracking-[0.5px]" />
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{ position: "relative", zIndex: 2, margin: "14px 28px 0", display: "flex", alignItems: "center" }}>
            {[{label: "DAY 0", c1: "#00B2A9", c2: "#00B2A9"}, null, {label: "DAY 90", c1: "#2896FB", c2: "#2896FB"}, null, {label: "DAY 91+", c1: "#00B2A9", c2: "#00B2A9"}].map((n, i) => {
              if (!n) return <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i === 1 ? "linear-gradient(90deg, #00B2A9, #2896FB)" : "linear-gradient(90deg, #2896FB, #00B2A9)", margin: "0 -1px 12px" }} />;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: `linear-gradient(135deg, ${n.c1}, ${n.c2})`, boxShadow: `0 0 10px ${n.c1}60`, border: "2px solid white" }} />
                  <span style={{ fontSize: "6px", fontWeight: 800, color: n.c1, marginTop: "2px", letterSpacing: "1px" }}>{n.label}</span>
                </div>
              );
            })}
          </div>

          {/* ===== PHASES — OVERLAPPING BLOBS ===== */}
          <div style={{ position: "relative", zIndex: 2, margin: "6px 8px 0", height: "508px" }}>
            {/* PHASE 1 — LEFT */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "218px", bottom: "4px",
              borderRadius: "28px",
              background: "linear-gradient(170deg, #DFFAF7 0%, #C8F5F0 35%, #E5FDFB 100%)",
              border: "2px solid rgba(0,178,169,0.12)",
              boxShadow: "0 8px 30px rgba(0,178,169,0.08), inset 0 2px 0 rgba(255,255,255,0.9)",
              zIndex: 1,
              display: "flex", flexDirection: "column",
              padding: "14px 12px 10px 14px"
            }}>
              <div style={{ position: "absolute", top: "12px", right: "12px", width: "35px", height: "35px", borderRadius: "50%", background: "rgba(0,178,169,0.05)", border: "1px solid rgba(0,178,169,0.06)" }} />
              <div style={{ position: "absolute", bottom: "50px", left: "10px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,178,169,0.04)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #009E96)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,178,169,0.35)", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "12px", fontWeight: 900 }}>1</span>
                </div>
                <div>
                  <div style={{ fontSize: "6.5px", fontWeight: 800, color: "#00B2A9", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 1</div>
                </div>
              </div>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>The Trial &<br/>Conversion Experience</div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {phase1Items.map((item, i) => <ItemCard key={i} item={item} phase={1} idx={i} icons={ICONS_1} accent="#00B2A9" />)}
              </div>

              <div style={{ marginTop: "10px" }}>
                <LinkPill value={phase1Link} onChange={setPhase1Link} accent="#00B2A9" />
              </div>
            </div>

            {/* PHASE 2 — CENTER (overlapping, elevated) */}
            <div style={{
              position: "absolute", top: "-6px", left: "196px", width: "272px", bottom: "-2px",
              borderRadius: "30px",
              background: "linear-gradient(170deg, #D6EBFF 0%, #BFE0FF 35%, #E3F1FF 100%)",
              border: "2.5px solid rgba(40,150,251,0.18)",
              boxShadow: "0 14px 44px rgba(40,150,251,0.12), 0 4px 12px rgba(0,0,0,0.04), inset 0 2px 0 rgba(255,255,255,0.95)",
              zIndex: 3,
              display: "flex", flexDirection: "column",
              padding: "16px 16px 12px"
            }}>
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60px", height: "4px", borderRadius: "0 0 4px 4px", background: "linear-gradient(90deg, #2896FB, #00B2A9)" }} />
              <div style={{ position: "absolute", top: "14px", right: "14px", width: "45px", height: "45px", borderRadius: "50%", background: "rgba(40,150,251,0.04)", border: "1px solid rgba(40,150,251,0.06)" }} />
              <div style={{ position: "absolute", bottom: "80px", right: "10px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(40,150,251,0.03)" }} />
              <div style={{ position: "absolute", top: "100px", left: "10px", width: "14px", height: "14px", borderRadius: "50%", background: "rgba(40,150,251,0.04)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #2896FB, #1E7FE0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(40,150,251,0.35)", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "13px", fontWeight: 900 }}>2</span>
                </div>
                <div>
                  <div style={{ fontSize: "7px", fontWeight: 800, color: "#2896FB", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 2</div>
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>The First 90 Days<br/>(Customer Success)</div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {phase2Items.map((item, i) => <ItemCard key={i} item={item} phase={2} idx={i} icons={ICONS_2} accent="#2896FB" />)}
              </div>

              <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "16px" }}>
                {["Dreamers", "Agencies", "End Users"].map((p, i) => (
                  <div key={p} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg, ${i===1?"rgba(0,178,169,0.12)":"rgba(40,150,251,0.12)"}, ${i===1?"rgba(0,178,169,0.04)":"rgba(40,150,251,0.04)"})`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${i===1?"rgba(0,178,169,0.15)":"rgba(40,150,251,0.15)"}` }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={i===1?"#00B2A9":"#2896FB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "13px", height: "13px" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span style={{ fontSize: "6.5px", fontWeight: 700, color: i===1?"#00B2A9":"#2896FB" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PHASE 3 — RIGHT */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: "218px", bottom: "4px",
              borderRadius: "28px",
              background: "linear-gradient(170deg, #DFFAF7 0%, #C8F5F0 35%, #E5FDFB 100%)",
              border: "2px solid rgba(0,178,169,0.12)",
              boxShadow: "0 8px 30px rgba(0,178,169,0.08), inset 0 2px 0 rgba(255,255,255,0.9)",
              zIndex: 1,
              display: "flex", flexDirection: "column",
              padding: "14px 14px 10px 30px"
            }}>
              <div style={{ position: "absolute", top: "12px", left: "12px", width: "35px", height: "35px", borderRadius: "50%", background: "rgba(0,178,169,0.05)", border: "1px solid rgba(0,178,169,0.06)" }} />
              <div style={{ position: "absolute", bottom: "50px", right: "10px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,178,169,0.04)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #009E96)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,178,169,0.35)", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "12px", fontWeight: 900 }}>3</span>
                </div>
                <div>
                  <div style={{ fontSize: "6.5px", fontWeight: 800, color: "#00B2A9", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 3</div>
                </div>
              </div>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>Account<br/>Management</div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {phase3Items.map((item, i) => <ItemCard key={i} item={item} phase={3} idx={i} icons={ICONS_3} accent="#00B2A9" />)}
              </div>

              <div style={{ marginTop: "10px" }}>
                <LinkPill value={phase3Link} onChange={setPhase3Link} accent="#00B2A9" />
              </div>
            </div>

            {/* ARROW CONNECTORS */}
            <div style={{ position: "absolute", top: "50%", left: "206px", transform: "translateY(-50%)", zIndex: 5, width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #2896FB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,178,169,0.35), 0 0 0 3px rgba(255,255,255,0.8)", border: "none" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ position: "absolute", top: "50%", right: "206px", transform: "translateY(-50%)", zIndex: 5, width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #2896FB, #00B2A9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(40,150,251,0.35), 0 0 0 3px rgba(255,255,255,0.8)", border: "none" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          {/* ===== QUICK REFERENCE ===== */}
          <div style={{ position: "absolute", bottom: "30px", left: "18px", right: "18px", zIndex: 2 }}>
            <div style={{ borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(6,11,22,0.06)", boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "8px 14px", background: "linear-gradient(135deg, #060B16, #0E1F3D)", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "7px", background: "rgba(0,178,169,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "11px", height: "11px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span style={{ fontSize: "8px", fontWeight: 800, color: "white", letterSpacing: "2px", textTransform: "uppercase" }}>Quick Reference — Find Your Team</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, rgba(0,178,169,0.05), rgba(40,150,251,0.05))" }}>
                    {["Stage","Interaction Link","Responsible Team"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 14px", fontWeight: 800, color: "#0F172A", fontSize: "7px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1.5px solid rgba(0,0,0,0.05)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i} style={{ background: i%2===0 ? "white" : "#F8FBFF" }}>
                      <td style={{ padding: "6px 14px", fontWeight: 700, color: "#0F172A", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}><T value={row.stage} onChange={v => uq(i,"stage",v)} className="text-[7.5px]" /></td>
                      <td style={{ padding: "6px 14px", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}><T value={row.link} onChange={v => uq(i,"link",v)} className="text-[7.5px] text-[#2896FB] font-bold" /></td>
                      <td style={{ padding: "6px 14px", color: "#64748B", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}><T value={row.team} onChange={v => uq(i,"team",v)} className="text-[7.5px]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "26px", background: "linear-gradient(135deg, #060B16, #0E1F3D)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "11px", height: "11px", objectFit: "contain" }} />
              <span style={{ fontSize: "6.5px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>HighLevel — Internal Use Only</span>
            </div>
            <span style={{ fontSize: "6.5px", fontWeight: 500, color: "rgba(255,255,255,0.25)" }}>gohighlevel.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
