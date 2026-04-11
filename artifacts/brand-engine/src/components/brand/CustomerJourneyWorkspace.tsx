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

  const E = ({ value, onChange, className, multiline }: { value: string; onChange: (v: string) => void; className?: string; multiline?: boolean }) => {
    if (!isEditing) return <span className={className}>{value}</span>;
    if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[4px] px-[4px] outline-none resize-none`} rows={2} />;
    return <input value={value} onChange={e => onChange(e.target.value)} className={`${className} bg-[rgba(40,150,251,0.08)] border border-[rgba(40,150,251,0.3)] rounded-[4px] px-[4px] outline-none w-full`} />;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[280px] shrink-0 border-r border-white/5 bg-[rgba(3,11,23,0.5)] overflow-y-auto sidebar-scroll p-[20px] flex flex-col gap-[16px]">
        <div>
          <h2 className="text-white text-[15px] font-semibold mb-[4px]">Customer Journey</h2>
          <p className="text-[11px] text-[#64748B] leading-[1.5]">Print-ready infographic — 8.5×11" format. Edit content and export as PDF or PNG.</p>
        </div>
        <div className="flex items-center gap-[8px]">
          <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 flex items-center justify-center gap-[6px] py-[8px] rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all border ${isEditing ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]" : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.15)]"}`}>
            <Edit3 className="w-[12px] h-[12px]" />
            {isEditing ? "Editing On" : "Edit Content"}
          </button>
          <button onClick={resetAll} className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#FF4D4D] hover:border-[rgba(255,77,77,0.3)] cursor-pointer transition-all" title="Reset to defaults">
            <RotateCcw className="w-[12px] h-[12px]" />
          </button>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Export Format</div>
          <div className="flex gap-[4px]">
            {(["pdf", "png"] as const).map(f => (
              <button key={f} onClick={() => setExportFormat(f)} className={`flex-1 py-[7px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all uppercase ${exportFormat === f ? "bg-[rgba(0,178,169,0.15)] border-[rgba(0,178,169,0.3)] text-[#00B2A9]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {[{ label: "Phase 1 — Trial", items: phase1Items }, { label: "Phase 2 — Success", items: phase2Items }, { label: "Phase 3 — Growth", items: phase3Items }].map((sec, si) => (
          <div key={si}>
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">{sec.label}</div>
            {sec.items.map((item, i) => (
              <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.title}</div>
                <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
              </div>
            ))}
          </div>
        ))}
        <div className="mt-auto pt-[16px]">
          <button onClick={handleExport} disabled={isExporting} className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[14px] text-[13px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#00B2A9] to-[#2896FB] text-white shadow-[0_4px_20px_rgba(0,178,169,0.3)] hover:shadow-[0_6px_28px_rgba(0,178,169,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none">
            {isExporting ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Download className="w-[16px] h-[16px]" />}
            Export as {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-[30px] bg-[rgba(6,11,22,0.5)]">
        <div ref={previewRef} className="font-['Poppins']" style={{ width: "680px", height: "880px", position: "relative", overflow: "hidden", background: "#FAFCFF" }}>

          {/* ===== HERO HEADER ===== */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "155px", background: "linear-gradient(135deg, #060B16 0%, #0A1628 40%, #0E1F3D 100%)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 80%, rgba(0,178,169,0.2) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(40,150,251,0.15) 0%, transparent 50%)" }} />
            <svg style={{ position: "absolute", bottom: -1, left: 0, right: 0 }} viewBox="0 0 680 40" fill="none" preserveAspectRatio="none">
              <path d="M0 40 C170 0 510 0 680 40 L680 40 L0 40 Z" fill="#FAFCFF"/>
            </svg>
            <div style={{ position: "absolute", top: "12px", right: "20px", display: "flex", gap: "3px" }}>
              {[0.2, 0.4, 0.6, 0.4, 0.2].map((o, i) => <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: `rgba(0,178,169,${o})` }} />)}
            </div>
            <div style={{ position: "absolute", bottom: "48px", left: "30px", right: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #00B2A9, #2896FB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,178,169,0.4)" }}>
                  <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(10)" }} />
                </div>
                <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase" }}>HighLevel</span>
              </div>
              <E value={title} onChange={setTitle} className="block text-[24px] font-black text-white leading-[1.05] tracking-[-1px]" />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                <div style={{ height: "3px", width: "40px", borderRadius: "2px", background: "linear-gradient(90deg, #00B2A9, #2896FB)" }} />
                <E value={subtitle} onChange={setSubtitle} className="text-[12px] font-semibold text-[rgba(255,255,255,0.5)] tracking-[1px]" />
              </div>
            </div>
          </div>

          {/* ===== TIMELINE ===== */}
          <div style={{ position: "absolute", top: "158px", left: "30px", right: "30px", display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #2896FB)", boxShadow: "0 0 12px rgba(0,178,169,0.4)" }} />
              <span style={{ fontSize: "6px", fontWeight: 800, color: "#00B2A9", marginTop: "2px", letterSpacing: "1px" }}>DAY 0</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: "linear-gradient(90deg, #00B2A9, #2896FB)", borderRadius: "2px", margin: "0 -2px", marginBottom: "10px" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg, #2896FB, #00B2A9)", boxShadow: "0 0 12px rgba(40,150,251,0.4)" }} />
              <span style={{ fontSize: "6px", fontWeight: 800, color: "#2896FB", marginTop: "2px", letterSpacing: "1px" }}>DAY 90</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: "linear-gradient(90deg, #2896FB, #00B2A9)", borderRadius: "2px", margin: "0 -2px", marginBottom: "10px" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #2896FB)", boxShadow: "0 0 12px rgba(0,178,169,0.4)" }} />
              <span style={{ fontSize: "6px", fontWeight: 800, color: "#00B2A9", marginTop: "2px", letterSpacing: "1px" }}>DAY 91+</span>
            </div>
          </div>

          {/* ===== THREE PHASE BLOBS ===== */}
          <div style={{ position: "absolute", top: "185px", left: "12px", right: "12px", height: "445px", display: "flex", gap: "0px" }}>

            {/* PHASE 1 - BLOB */}
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ position: "absolute", inset: "0 -8px 0 0", borderRadius: "24px 24px 24px 24px", background: "linear-gradient(165deg, #E6FAF8 0%, #D4F5F2 30%, #E8FDFB 100%)", border: "1.5px solid rgba(0,178,169,0.15)", boxShadow: "0 8px 32px rgba(0,178,169,0.08), inset 0 1px 0 rgba(255,255,255,0.8)" }} />
              <div style={{ position: "relative", padding: "16px 18px 14px 16px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #009E96)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,178,169,0.3)" }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 900 }}>1</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "7px", fontWeight: 800, color: "#00B2A9", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 1</div>
                    <div style={{ fontSize: "7px", color: "#64748B", fontWeight: 500 }}>Trial & Conversion</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>The Trial &<br/>Conversion Experience</div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {phase1Items.map((item, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", borderRadius: "12px", padding: "9px 10px", border: "1px solid rgba(0,178,169,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, rgba(0,178,169,0.12), rgba(0,178,169,0.06))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                            {i === 0 && <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>}
                            {i === 1 && <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>}
                            {i === 2 && <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>}
                          </svg>
                        </div>
                        <E value={item.title} onChange={v => updatePhaseItem(1, i, "title", v)} className="text-[8px] font-bold text-[#0F172A] leading-[1.2] block" />
                      </div>
                      <E value={item.desc} onChange={v => updatePhaseItem(1, i, "desc", v)} className="text-[6.5px] text-[#64748B] leading-[1.4] block pl-[29px]" multiline />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "linear-gradient(135deg, #00B2A9, #009E96)", borderRadius: "8px", padding: "5px 10px", boxShadow: "0 3px 12px rgba(0,178,169,0.3)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "9px", height: "9px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <E value={phase1Link} onChange={setPhase1Link} className="text-[7.5px] font-bold text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 2 - CENTER BLOB (overlapping, elevated) */}
            <div style={{ flex: 1.1, position: "relative", zIndex: 3, marginTop: "-6px" }}>
              <div style={{ position: "absolute", inset: "0 -4px 0 -4px", borderRadius: "26px", background: "linear-gradient(165deg, #E0EEFF 0%, #D1E6FF 30%, #E8F2FF 100%)", border: "2px solid rgba(40,150,251,0.18)", boxShadow: "0 12px 40px rgba(40,150,251,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }} />
              <div style={{ position: "absolute", top: "-3px", left: "50%", transform: "translateX(-50%)", width: "50px", height: "4px", borderRadius: "0 0 4px 4px", background: "linear-gradient(90deg, #2896FB, #00B2A9)" }} />
              <div style={{ position: "relative", padding: "18px 16px 14px 16px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #2896FB, #1E7FE0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(40,150,251,0.3)" }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 900 }}>2</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "7px", fontWeight: 800, color: "#2896FB", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 2</div>
                    <div style={{ fontSize: "7px", color: "#64748B", fontWeight: 500 }}>Customer Success</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>The First 90 Days<br/>(Customer Success)</div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {phase2Items.map((item, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", borderRadius: "12px", padding: "9px 10px", border: "1px solid rgba(40,150,251,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, rgba(40,150,251,0.12), rgba(40,150,251,0.06))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#2896FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                            {i === 0 && <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>}
                            {i === 1 && <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
                            {i === 2 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                          </svg>
                        </div>
                        <E value={item.title} onChange={v => updatePhaseItem(2, i, "title", v)} className="text-[8px] font-bold text-[#0F172A] leading-[1.2] block" />
                      </div>
                      <E value={item.desc} onChange={v => updatePhaseItem(2, i, "desc", v)} className="text-[6.5px] text-[#64748B] leading-[1.4] block pl-[29px]" multiline />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "8px", display: "flex", justifyContent: "center", gap: "14px" }}>
                  {["Dreamers", "Agencies", "End Users"].map((p, i) => (
                    <div key={p} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, rgba(40,150,251,0.15), rgba(40,150,251,0.05))" : i === 1 ? "linear-gradient(135deg, rgba(0,178,169,0.15), rgba(0,178,169,0.05))" : "linear-gradient(135deg, rgba(40,150,251,0.1), rgba(0,178,169,0.1))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(40,150,251,0.12)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={i === 1 ? "#00B2A9" : "#2896FB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: "6px", fontWeight: 700, color: "#2896FB" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PHASE 3 - BLOB */}
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ position: "absolute", inset: "0 0 0 -8px", borderRadius: "24px", background: "linear-gradient(165deg, #E6FAF8 0%, #D4F5F2 30%, #E8FDFB 100%)", border: "1.5px solid rgba(0,178,169,0.15)", boxShadow: "0 8px 32px rgba(0,178,169,0.08), inset 0 1px 0 rgba(255,255,255,0.8)" }} />
              <div style={{ position: "relative", padding: "16px 16px 14px 18px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #009E96)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,178,169,0.3)" }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 900 }}>3</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "7px", fontWeight: 800, color: "#00B2A9", letterSpacing: "2px", textTransform: "uppercase" }}>Phase 3</div>
                    <div style={{ fontSize: "7px", color: "#64748B", fontWeight: 500 }}>Account Management</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#060B16", lineHeight: 1.15, marginBottom: "10px" }}>Account<br/>Management</div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {phase3Items.map((item, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", borderRadius: "12px", padding: "9px 10px", border: "1px solid rgba(0,178,169,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, rgba(0,178,169,0.12), rgba(0,178,169,0.06))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                            {i === 0 && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>}
                            {i === 1 && <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}
                            {i === 2 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
                          </svg>
                        </div>
                        <E value={item.title} onChange={v => updatePhaseItem(3, i, "title", v)} className="text-[8px] font-bold text-[#0F172A] leading-[1.2] block" />
                      </div>
                      <E value={item.desc} onChange={v => updatePhaseItem(3, i, "desc", v)} className="text-[6.5px] text-[#64748B] leading-[1.4] block pl-[29px]" multiline />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "linear-gradient(135deg, #00B2A9, #009E96)", borderRadius: "8px", padding: "5px 10px", boxShadow: "0 3px 12px rgba(0,178,169,0.3)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "9px", height: "9px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <E value={phase3Link} onChange={setPhase3Link} className="text-[7.5px] font-bold text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CHEVRON ARROWS BETWEEN BLOBS ===== */}
          <div style={{ position: "absolute", top: "380px", left: "222px", zIndex: 5, width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #00B2A9, #2896FB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(0,178,169,0.3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "11px", height: "11px" }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div style={{ position: "absolute", top: "380px", right: "222px", zIndex: 5, width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #2896FB, #00B2A9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(40,150,251,0.3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "11px", height: "11px" }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* ===== QUICK REFERENCE TABLE ===== */}
          <div style={{ position: "absolute", bottom: "34px", left: "20px", right: "20px" }}>
            <div style={{ borderRadius: "14px", overflow: "hidden", border: "1.5px solid rgba(6,11,22,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "8px 16px", background: "linear-gradient(135deg, #060B16, #0E1F3D)", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "6px", background: "rgba(0,178,169,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "10px", height: "10px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span style={{ fontSize: "8px", fontWeight: 800, color: "white", letterSpacing: "2px", textTransform: "uppercase" }}>Quick Reference — Find Your Team</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, rgba(0,178,169,0.04), rgba(40,150,251,0.04))" }}>
                    <th style={{ textAlign: "left", padding: "6px 14px", fontWeight: 800, color: "#0F172A", fontSize: "7px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Stage</th>
                    <th style={{ textAlign: "left", padding: "6px 14px", fontWeight: 800, color: "#0F172A", fontSize: "7px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Interaction Link</th>
                    <th style={{ textAlign: "left", padding: "6px 14px", fontWeight: 800, color: "#0F172A", fontSize: "7px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Responsible Team</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#FAFCFF" }}>
                      <td style={{ padding: "5px 14px", fontWeight: 600, color: "#0F172A", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <E value={row.stage} onChange={v => updateQuickRef(i, "stage", v)} className="text-[7.5px]" />
                      </td>
                      <td style={{ padding: "5px 14px", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <E value={row.link} onChange={v => updateQuickRef(i, "link", v)} className="text-[7.5px] text-[#2896FB] font-bold" />
                      </td>
                      <td style={{ padding: "5px 14px", color: "#64748B", fontSize: "7.5px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                        <E value={row.team} onChange={v => updateQuickRef(i, "team", v)} className="text-[7.5px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "28px", background: "linear-gradient(135deg, #060B16, #0E1F3D)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" style={{ width: "11px", height: "11px", objectFit: "contain" }} />
              <span style={{ fontSize: "6.5px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>HighLevel — Internal Use Only</span>
            </div>
            <span style={{ fontSize: "6.5px", fontWeight: 500, color: "rgba(255,255,255,0.25)" }}>gohighlevel.com</span>
          </div>

          {/* ===== DECORATIVE CORNER ELEMENTS ===== */}
          <div style={{ position: "absolute", bottom: "100px", right: "16px", width: "30px", height: "30px", borderRadius: "50%", background: "radial-gradient(circle, rgba(40,150,251,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "140px", left: "16px", width: "20px", height: "20px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,178,169,0.06) 0%, transparent 70%)" }} />
        </div>
      </div>
    </div>
  );
}
