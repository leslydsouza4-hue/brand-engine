import { useState, useRef, useCallback } from "react";
import { Download, Loader2, Edit3, RotateCcw } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { addExport, createThumbnail } from "./exportStore";

const BASE = import.meta.env.BASE_URL;

interface PhaseItem {
  icon: string;
  title: string;
  desc: string;
}

interface QuickRefRow {
  stage: string;
  link: string;
  team: string;
}

const DEFAULT_TITLE = "The HighLevel Customer Journey: From Trial to Growth";

const DEFAULT_PHASE1: PhaseItem[] = [
  { icon: "📹", title: "The Demo & Kickoff Phase", desc: "Prospective users join 24/7 group Zoom rooms to ask questions and see the platform." },
  { icon: "🎯", title: "Goal-Oriented Onboarding", desc: "The Trial Experience team uses kickoff calls to identify specific goals and core features." },
  { icon: "🔄", title: "The Conversion Goal", desc: "Teams focus on 5-6 key features to convert trial users to paid plans without overwhelm." },
];

const DEFAULT_PHASE2: PhaseItem[] = [
  { icon: "🖥️", title: 'The "Done-With-You" Onboarding', desc: "Success teams provide screen-share consultations to help customers set up business profiles and lead connectors." },
  { icon: "💬", title: "Integrated Support", desc: "For the first 90 days, the Customer Success team replaces the standard support chatbot." },
  { icon: "👥", title: "Persona-Driven Strategy", desc: 'Support is tailored to "Dreamers," marketing agencies, or small business "End Users."' },
];

const DEFAULT_PHASE3: PhaseItem[] = [
  { icon: "🔧", title: "The Day 91 Handover", desc: "Account management takes over with a focus on long-term growth and retention." },
  { icon: "📈", title: "Scaling Through Expansion", desc: "Managers focus on high-level add-ons like HIPAA compliance, WhatsApp, and AI Employees." },
  { icon: "🛡️", title: "Technical Support Pivot", desc: "Standard Support teams take over specifically for technical bugs and platform issues." },
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
      const scale = 2400 / el.offsetWidth;
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
        createThumbnail(dataUrl).then(thumb => addExport({ name: `${fileName}.png`, source: "Print Templates", format: "png", thumbnail: thumb, dimensions: "2400x3106" }));
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
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.icon} {item.title}</div>
              <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Phase 2 — Success</div>
          {phase2Items.map((item, i) => (
            <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.icon} {item.title}</div>
              <div className="text-[10px] text-[#64748B] leading-[1.4]">{item.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b880] mb-[8px]">Phase 3 — Growth</div>
          {phase3Items.map((item, i) => (
            <div key={i} className="mb-[8px] p-[8px] rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[11px] font-semibold text-[#E2E8F0] mb-[2px]">{item.icon} {item.title}</div>
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
          className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] font-['Poppins']"
          style={{ width: "680px", height: "880px", position: "relative", overflow: "hidden" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#00B2A9] via-[#2896FB] to-[#00B2A9]" />

          <div className="px-[32px] pt-[22px] pb-[10px] flex items-center gap-[10px]">
            <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" className="w-[24px] h-[24px] object-contain" />
            <span className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-[1.5px]">HighLevel</span>
          </div>

          <div className="px-[32px] pb-[14px]">
            <EditableText
              value={title}
              onChange={setTitle}
              className="block text-[19px] font-extrabold text-[#060B16] leading-[1.2] tracking-[-0.5px]"
            />
          </div>

          <div className="px-[24px] flex gap-[8px]" style={{ height: "460px" }}>
            <div className="flex-1 rounded-[16px] p-[14px] flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(180deg, #E8F7F6 0%, #F0FAFA 100%)", border: "1px solid rgba(0,178,169,0.15)" }}>
              <div className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#00B2A9] mb-[4px]">Phase 1</div>
              <div className="text-[11px] font-extrabold text-[#060B16] leading-[1.2] mb-[10px]">The Trial &<br/>Conversion Experience</div>
              
              {phase1Items.map((item, i) => (
                <div key={i} className="mb-[10px]">
                  <div className="flex items-start gap-[6px]">
                    <span className="text-[14px] mt-[-1px] shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <EditableText
                        value={item.title}
                        onChange={v => updatePhaseItem(1, i, "title", v)}
                        className="block text-[9px] font-bold text-[#060B16] leading-[1.2] mb-[2px]"
                      />
                      <EditableText
                        value={item.desc}
                        onChange={v => updatePhaseItem(1, i, "desc", v)}
                        className="block text-[7.5px] text-[#475569] leading-[1.4]"
                        multiline
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-auto">
                <div className="inline-flex items-center gap-[4px] bg-[#00B2A9] text-white rounded-[6px] px-[8px] py-[4px]">
                  <span className="text-[8px]">🔗</span>
                  <EditableText
                    value={phase1Link}
                    onChange={setPhase1Link}
                    className="text-[8px] font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-[16px] p-[14px] flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(180deg, #E0F0FF 0%, #EBF5FF 100%)", border: "1px solid rgba(40,150,251,0.15)" }}>
              <div className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#2896FB] mb-[4px]">Phase 2</div>
              <div className="text-[11px] font-extrabold text-[#060B16] leading-[1.2] mb-[10px]">The First 90 Days<br/>(Customer Success)</div>
              
              {phase2Items.map((item, i) => (
                <div key={i} className="mb-[10px]">
                  <div className="flex items-start gap-[6px]">
                    <span className="text-[14px] mt-[-1px] shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <EditableText
                        value={item.title}
                        onChange={v => updatePhaseItem(2, i, "title", v)}
                        className="block text-[9px] font-bold text-[#060B16] leading-[1.2] mb-[2px]"
                      />
                      <EditableText
                        value={item.desc}
                        onChange={v => updatePhaseItem(2, i, "desc", v)}
                        className="block text-[7.5px] text-[#475569] leading-[1.4]"
                        multiline
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-auto flex justify-center gap-[12px]">
                {["Dreamers", "Agencies", "End Users"].map(p => (
                  <div key={p} className="flex flex-col items-center gap-[2px]">
                    <div className="w-[22px] h-[22px] rounded-full bg-[rgba(40,150,251,0.15)] flex items-center justify-center text-[10px]">👤</div>
                    <span className="text-[6.5px] font-semibold text-[#2896FB]">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-[16px] p-[14px] flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(180deg, #E8F7F6 0%, #F0FAF9 100%)", border: "1px solid rgba(0,178,169,0.15)" }}>
              <div className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#00B2A9] mb-[4px]">Phase 3</div>
              <div className="text-[11px] font-extrabold text-[#060B16] leading-[1.2] mb-[10px]">Account<br/>Management</div>
              
              {phase3Items.map((item, i) => (
                <div key={i} className="mb-[10px]">
                  <div className="flex items-start gap-[6px]">
                    <span className="text-[14px] mt-[-1px] shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <EditableText
                        value={item.title}
                        onChange={v => updatePhaseItem(3, i, "title", v)}
                        className="block text-[9px] font-bold text-[#060B16] leading-[1.2] mb-[2px]"
                      />
                      <EditableText
                        value={item.desc}
                        onChange={v => updatePhaseItem(3, i, "desc", v)}
                        className="block text-[7.5px] text-[#475569] leading-[1.4]"
                        multiline
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-auto">
                <div className="inline-flex items-center gap-[4px] bg-[#00B2A9] text-white rounded-[6px] px-[8px] py-[4px]">
                  <span className="text-[8px]">🔗</span>
                  <EditableText
                    value={phase3Link}
                    onChange={setPhase3Link}
                    className="text-[8px] font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-[32px] pt-[14px] pb-[8px]">
            <div className="rounded-[10px] overflow-hidden border border-[#E2E8F0]">
              <div className="bg-gradient-to-r from-[#060B16] to-[#0F1A2E] px-[14px] py-[6px]">
                <span className="text-[8px] font-bold text-white uppercase tracking-[1.5px]">Quick Reference: Find Your Team Via Short-Links</span>
              </div>
              <table className="w-full text-[8px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="bg-[#F1F5F9]">
                    <th className="text-left px-[10px] py-[5px] font-bold text-[#060B16] text-[7.5px] uppercase tracking-[0.5px] border-b border-[#E2E8F0]">Stage</th>
                    <th className="text-left px-[10px] py-[5px] font-bold text-[#060B16] text-[7.5px] uppercase tracking-[0.5px] border-b border-[#E2E8F0]">Interaction Link</th>
                    <th className="text-left px-[10px] py-[5px] font-bold text-[#060B16] text-[7.5px] uppercase tracking-[0.5px] border-b border-[#E2E8F0]">Responsible Team</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRef.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}>
                      <td className="px-[10px] py-[5px] text-[#060B16] font-medium border-b border-[#F1F5F9]">
                        <EditableText value={row.stage} onChange={v => updateQuickRef(i, "stage", v)} className="text-[8px]" />
                      </td>
                      <td className="px-[10px] py-[5px] border-b border-[#F1F5F9]">
                        <EditableText value={row.link} onChange={v => updateQuickRef(i, "link", v)} className="text-[8px] text-[#2896FB] font-semibold" />
                      </td>
                      <td className="px-[10px] py-[5px] text-[#475569] border-b border-[#F1F5F9]">
                        <EditableText value={row.team} onChange={v => updateQuickRef(i, "team", v)} className="text-[8px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[32px] py-[8px] bg-gradient-to-r from-[#060B16] to-[#0F1A2E]">
            <div className="flex items-center gap-[6px]">
              <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HL" className="w-[14px] h-[14px] object-contain" />
              <span className="text-[7px] font-semibold text-white/60">HighLevel — Internal Use Only</span>
            </div>
            <span className="text-[7px] text-white/40">gohighlevel.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
