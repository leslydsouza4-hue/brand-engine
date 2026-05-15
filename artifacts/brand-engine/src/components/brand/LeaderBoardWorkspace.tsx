import { useRef, useState } from "react";
import { Trophy, Plus, Trash2, Download, Loader2, Upload, X } from "lucide-react";
import { useExport } from "./useExport";

interface Affiliate {
  id: string;
  rank: number;
  name: string;
  handle: string;
  metric: string;
  avatar: string | null;
}

const newRow = (rank: number): Affiliate => ({
  id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  rank,
  name: "",
  handle: "",
  metric: "",
  avatar: null,
});

const SEED: Affiliate[] = [
  { id: "s1", rank: 1, name: "Alex Rivera", handle: "@alexrivera", metric: "$48,210", avatar: null },
  { id: "s2", rank: 2, name: "Jordan Park", handle: "@jpark", metric: "$36,940", avatar: null },
  { id: "s3", rank: 3, name: "Maya Chen", handle: "@mayac", metric: "$29,508", avatar: null },
  { id: "s4", rank: 4, name: "Sam Whitley", handle: "@swhitley", metric: "$22,103", avatar: null },
  { id: "s5", rank: 5, name: "Priya Shah", handle: "@priyas", metric: "$18,772", avatar: null },
  { id: "s6", rank: 6, name: "Diego Morales", handle: "@diegom", metric: "$15,540", avatar: null },
  { id: "s7", rank: 7, name: "Tessa Brooks", handle: "@tessab", metric: "$12,108", avatar: null },
  { id: "s8", rank: 8, name: "Noah Kim", handle: "@nkim", metric: "$10,440", avatar: null },
  { id: "s9", rank: 9, name: "Ravi Patel", handle: "@ravip", metric: "$8,221", avatar: null },
  { id: "s10", rank: 10, name: "Lena Ortiz", handle: "@lenao", metric: "$6,705", avatar: null },
];

const PERIODS = ["This Week", "This Month", "This Quarter", "All Time"];
const METRICS = ["Commission", "Signups", "Active Customers", "MRR"];

export function LeaderBoardWorkspace() {
  const [title, setTitle] = useState("Top Affiliates");
  const [period, setPeriod] = useState("This Month");
  const [metric, setMetric] = useState("Commission");
  const [rows, setRows] = useState<Affiliate[]>(SEED);
  const previewRef = useRef<HTMLDivElement>(null);
  const { isExporting, handleExport } = useExport();

  const update = (id: string, patch: Partial<Affiliate>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) =>
    setRows(rs => rs.filter(r => r.id !== id).map((r, i) => ({ ...r, rank: i + 1 })));

  const add = () =>
    setRows(rs => [...rs, newRow(rs.length + 1)]);

  const onAvatar = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => update(id, { avatar: String(e.target?.result || "") });
    reader.readAsDataURL(file);
  };

  const onDownload = () => {
    if (previewRef.current) void handleExport("png", previewRef.current);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const rankBg = (r: number) =>
    r === 1
      ? "linear-gradient(135deg, #FFD700 0%, #FFA000 100%)"
      : r === 2
        ? "linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)"
        : r === 3
          ? "linear-gradient(135deg, #CD7F32 0%, #8B5A2B 100%)"
          : "rgba(255,255,255,0.06)";

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[340px] shrink-0 border-r border-white/5 bg-[rgba(255,255,255,0.015)] overflow-y-auto">
        <div className="p-[20px] flex flex-col gap-[18px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Title</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins']"
            />
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Period</div>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full py-[9px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)]"
              >
                {PERIODS.map(p => <option key={p} value={p} style={{ background: "#0B1426" }}>{p}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Metric</div>
              <select
                value={metric}
                onChange={e => setMetric(e.target.value)}
                className="w-full py-[9px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)]"
              >
                {METRICS.map(m => <option key={m} value={m} style={{ background: "#0B1426" }}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-[8px]">
              <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B]">Affiliates</div>
              <button
                onClick={add}
                className="flex items-center gap-[4px] text-[10px] font-bold text-[#7CC8FF] hover:text-white py-[3px] px-[7px] rounded-[6px] bg-[rgba(40,150,251,0.12)] border border-[rgba(40,150,251,0.25)] cursor-pointer transition-colors"
              >
                <Plus className="w-[10px] h-[10px]" /> Add row
              </button>
            </div>

            <div className="flex flex-col gap-[8px]">
              {rows.map(r => (
                <div
                  key={r.id}
                  className="p-[10px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex flex-col gap-[6px]"
                >
                  <div className="flex items-center gap-[8px]">
                    <div
                      className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ background: rankBg(r.rank) }}
                    >
                      {r.rank}
                    </div>
                    <input
                      value={r.name}
                      onChange={e => update(r.id, { name: e.target.value })}
                      placeholder="Name"
                      className="flex-1 py-[6px] px-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[6px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)]"
                    />
                    <button
                      onClick={() => remove(r.id)}
                      title="Remove"
                      className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[#94A3B8] hover:text-[#FCA5A5] hover:bg-[rgba(248,113,113,0.12)] cursor-pointer bg-transparent border-none"
                    >
                      <Trash2 className="w-[12px] h-[12px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <input
                      value={r.handle}
                      onChange={e => update(r.id, { handle: e.target.value })}
                      placeholder="@handle"
                      className="flex-1 py-[5px] px-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[6px] text-[11px] text-[#94A3B8] outline-none focus:border-[rgba(40,150,251,0.4)]"
                    />
                    <input
                      value={r.metric}
                      onChange={e => update(r.id, { metric: e.target.value })}
                      placeholder="$0"
                      className="w-[90px] py-[5px] px-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[6px] text-[11px] text-[#FFD000] font-bold outline-none focus:border-[rgba(40,150,251,0.4)] text-right"
                    />
                  </div>
                  <div className="flex items-center gap-[6px]">
                    {r.avatar ? (
                      <div className="flex items-center gap-[6px] flex-1">
                        <img src={r.avatar} alt="" className="w-[24px] h-[24px] rounded-full object-cover" />
                        <span className="text-[10px] text-[#94A3B8] flex-1">Avatar set</span>
                        <button
                          onClick={() => update(r.id, { avatar: null })}
                          className="text-[#94A3B8] hover:text-[#FCA5A5] cursor-pointer bg-transparent border-none"
                        >
                          <X className="w-[10px] h-[10px]" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex-1 flex items-center justify-center gap-[4px] text-[10px] text-[#64748B] hover:text-[#7CC8FF] py-[5px] rounded-[6px] border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[rgba(40,150,251,0.3)] cursor-pointer transition-colors">
                        <Upload className="w-[10px] h-[10px]" /> Avatar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && onAvatar(r.id, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto p-[28px]">
        <div className="max-w-[860px] mx-auto">
          <div className="flex items-center justify-between mb-[18px]">
            <div className="flex items-center gap-[10px]">
              <Trophy className="w-[18px] h-[18px] text-[#FFD000]" />
              <div className="text-[14px] font-bold text-white">Leader Board Preview</div>
            </div>
            <button
              onClick={onDownload}
              disabled={isExporting}
              className="flex items-center gap-[6px] py-[8px] px-[14px] rounded-[10px] bg-gradient-to-br from-[#00B2A9] to-[#2896FB] text-white text-[12px] font-bold cursor-pointer hover:brightness-[1.08] disabled:opacity-50 border-none"
            >
              {isExporting ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
              {isExporting ? "Exporting..." : "Download PNG"}
            </button>
          </div>

          <div
            ref={previewRef}
            data-export-preview
            data-export-name={`Leader Board - ${title}`}
            className="relative rounded-[20px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] flex flex-col"
            style={{
              aspectRatio: "1080 / 1350",
              background: "radial-gradient(ellipse at top, #0B2548 0%, #060B16 60%, #02060E 100%)",
            }}
          >
            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#7CC8FF 1px, transparent 1px), linear-gradient(90deg, #7CC8FF 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Header */}
            <div className="relative pt-[32px] pb-[16px] px-[36px] flex flex-col items-center text-center z-[2] shrink-0">
              <div className="flex items-center gap-[8px] py-[6px] px-[14px] rounded-full bg-[rgba(255,208,0,0.12)] border border-[rgba(255,208,0,0.3)] mb-[12px]">
                <Trophy className="w-[12px] h-[12px] text-[#FFD000]" />
                <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#FFD000]">{period} · {metric}</span>
              </div>
              <h1
                className="font-['Poppins'] font-black text-white leading-[1.05] tracking-[-1px]"
                style={{
                  fontSize: "38px",
                  textShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {title}
              </h1>
            </div>

            {/* Podium (top 3) */}
            <div className="relative px-[36px] py-[14px] flex items-end justify-center gap-[10px] z-[2] shrink-0">
              {top3.length > 1 && <PodiumCard a={top3[1]!} height={88} bg={rankBg(2)} />}
              {top3[0] && <PodiumCard a={top3[0]!} height={120} bg={rankBg(1)} highlight />}
              {top3.length > 2 && <PodiumCard a={top3[2]!} height={68} bg={rankBg(3)} />}
            </div>

            {/* Rest of list */}
            <div className="relative px-[28px] pt-[10px] pb-[28px] flex flex-col gap-[6px] z-[2] flex-1 justify-end">
              {rest.slice(0, 7).map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-[12px] py-[8px] px-[12px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm"
                >
                  <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[11px] font-black text-white shrink-0 bg-[rgba(255,255,255,0.08)]">
                    {r.rank}
                  </div>
                  {r.avatar ? (
                    <img src={r.avatar} alt="" className="w-[28px] h-[28px] rounded-full object-cover shrink-0 ring-2 ring-[rgba(255,255,255,0.1)]" />
                  ) : (
                    <div className="w-[28px] h-[28px] rounded-full shrink-0 bg-gradient-to-br from-[#2896FB] to-[#7C3AED] flex items-center justify-center text-[11px] font-black text-white">
                      {r.name.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white truncate leading-tight">{r.name || "—"}</div>
                    <div className="text-[9px] text-[#94A3B8] truncate leading-tight">{r.handle}</div>
                  </div>
                  <div className="text-[13px] font-black text-[#FFD000]">{r.metric || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ a, height, bg, highlight }: { a: Affiliate; height: number; bg: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-[6px] flex-1" style={{ maxWidth: 160 }}>
      <div className="relative">
        {a.avatar ? (
          <img
            src={a.avatar}
            alt=""
            className="w-[56px] h-[56px] rounded-full object-cover"
            style={{ boxShadow: highlight ? "0 0 0 3px #FFD700, 0 6px 24px rgba(255,215,0,0.4)" : `0 0 0 2px rgba(255,255,255,0.3), 0 4px 16px rgba(0,0,0,0.4)` }}
          />
        ) : (
          <div
            className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[20px] font-black text-white bg-gradient-to-br from-[#2896FB] to-[#7C3AED]"
            style={{ boxShadow: highlight ? "0 0 0 3px #FFD700, 0 6px 24px rgba(255,215,0,0.4)" : `0 0 0 2px rgba(255,255,255,0.3), 0 4px 16px rgba(0,0,0,0.4)` }}
          >
            {a.name.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div
          className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-black text-white"
          style={{ background: bg, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
        >
          {a.rank}
        </div>
      </div>
      <div className="text-center w-full px-[2px]">
        <div className="text-[12px] font-black text-white truncate leading-tight">{a.name || "—"}</div>
        <div className="text-[9px] text-[#94A3B8] truncate leading-tight">{a.handle}</div>
      </div>
      <div
        className="w-full rounded-t-[12px] flex items-start justify-center pt-[10px]"
        style={{
          height,
          background: bg,
          boxShadow: highlight ? "0 -8px 32px rgba(255,215,0,0.25)" : "0 -4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div className="text-[15px] font-black text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          {a.metric || "—"}
        </div>
      </div>
    </div>
  );
}
