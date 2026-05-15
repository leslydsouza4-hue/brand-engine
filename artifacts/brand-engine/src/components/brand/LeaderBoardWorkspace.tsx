import { useRef, useState } from "react";
import { Trophy, Download, Loader2, Upload, X, User as UserIcon } from "lucide-react";
import { useExport } from "./useExport";
import frameAsset from "@assets/Asset_19@2x_1778871874915.png";
import bgAsset from "@assets/Space_Backgrounds_1778871874915.png";
import medal1 from "@assets/1lugarrrrr_1778871874914.png";
import medal2 from "@assets/2lugarrrr_1778871874915.png";
import medal3 from "@assets/3lugarrrrrr_1778871874915.png";

interface Affiliate {
  id: string;
  name: string;
  avatar: string | null;
}

const SEED: Affiliate[] = [
  { id: "a1", name: "Declan O'Reilly", avatar: null },
  { id: "a2", name: "Charlie Chang", avatar: null },
  { id: "a3", name: "Kai Stone", avatar: null },
  { id: "a4", name: "Dar Holdsworth", avatar: null },
  { id: "a5", name: "Chris Koerner", avatar: null },
  { id: "a6", name: "Carson Reed", avatar: null },
  { id: "a7", name: "Max Perzon", avatar: null },
  { id: "a8", name: "Francisco & Jorge", avatar: null },
  { id: "a9", name: "Beant Singh", avatar: null },
  { id: "a10", name: "Theo Cavaliere", avatar: null },
];

export function LeaderBoardWorkspace() {
  const [title, setTitle] = useState("Top HighLevel Affiliates March 2026");
  const [rows, setRows] = useState<Affiliate[]>(SEED);
  const previewRef = useRef<HTMLDivElement>(null);
  const { isExporting, handleExport } = useExport();

  const update = (id: string, patch: Partial<Affiliate>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const onAvatar = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => update(id, { avatar: String(e.target?.result || "") });
    reader.readAsDataURL(file);
  };

  const onDownload = () => {
    if (previewRef.current) void handleExport("png", previewRef.current);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

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
            <div className="text-[10px] text-[#64748B] mt-[6px]">Tip: edit the month each cycle, e.g. "Top HighLevel Affiliates April 2026"</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Affiliates (1–10)</div>
            <div className="flex flex-col gap-[8px]">
              {rows.map((r, i) => (
                <div
                  key={r.id}
                  className="p-[10px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center gap-[10px]"
                >
                  <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[11px] font-black text-white shrink-0 bg-[rgba(40,150,251,0.18)] border border-[rgba(40,150,251,0.35)]">
                    {i + 1}
                  </div>
                  {r.avatar ? (
                    <img
                      src={r.avatar}
                      alt=""
                      className="w-[34px] h-[34px] rounded-full object-cover shrink-0 ring-2 ring-[rgba(40,150,251,0.35)]"
                    />
                  ) : (
                    <label
                      className="w-[34px] h-[34px] rounded-full shrink-0 flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-dashed border-[rgba(255,255,255,0.12)] hover:border-[rgba(40,150,251,0.5)] cursor-pointer text-[#64748B] hover:text-[#7CC8FF]"
                      title="Upload photo"
                    >
                      <Upload className="w-[12px] h-[12px]" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && onAvatar(r.id, e.target.files[0])}
                      />
                    </label>
                  )}
                  <input
                    value={r.name}
                    onChange={e => update(r.id, { name: e.target.value })}
                    placeholder="Name"
                    className="flex-1 min-w-0 py-[7px] px-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[7px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)]"
                  />
                  {r.avatar && (
                    <div className="flex flex-col gap-[4px] shrink-0">
                      <label
                        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center bg-[rgba(40,150,251,0.12)] border border-[rgba(40,150,251,0.25)] hover:bg-[rgba(40,150,251,0.2)] cursor-pointer text-[#7CC8FF]"
                        title="Replace photo"
                      >
                        <Upload className="w-[10px] h-[10px]" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && onAvatar(r.id, e.target.files[0])}
                        />
                      </label>
                      <button
                        onClick={() => update(r.id, { avatar: null })}
                        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] hover:bg-[rgba(248,113,113,0.2)] cursor-pointer text-[#FCA5A5]"
                        title="Remove photo"
                      >
                        <X className="w-[10px] h-[10px]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto p-[28px]">
        <div className="max-w-[1100px] mx-auto">
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

          {/* Canvas — 1920x1080 ratio */}
          <div
            ref={previewRef}
            data-export-preview
            data-export-name={`Leader Board - ${title}`}
            className="relative rounded-[14px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            style={{ aspectRatio: "1920 / 1080", background: "#000", containerType: "inline-size" }}
          >
            {/* Background */}
            <img src={bgAsset} alt="" className="absolute inset-0 w-full h-full object-cover" />

            {/* Frame (border + robot + baked title) */}
            <img src={frameAsset} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

            {/* Editable title masking the baked title region */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center text-center"
              style={{
                top: "3.4%",
                height: "9.2%",
                background:
                  "linear-gradient(180deg, rgba(11,37,72,0) 0%, #0B2548 18%, #0B2548 82%, rgba(11,37,72,0) 100%)",
              }}
            >
              <div
                className="font-['Poppins'] font-black tracking-[-0.5px]"
                style={{
                  fontSize: "2.85cqw",
                  paddingLeft: "3cqw",
                  paddingRight: "3cqw",
                  color: "#7CC8FF",
                  textShadow: "0 0.15cqw 0 rgba(0,0,0,0.35)",
                }}
              >
                {title}
              </div>
            </div>

            {/* Two-column rows */}
            <div
              className="absolute grid grid-cols-2"
              style={{
                top: "18%",
                left: "6%",
                right: "6%",
                bottom: "6%",
                columnGap: "5%",
              }}
            >
              {/* Left column — top 3 with medals */}
              <div className="flex flex-col justify-around pl-[5%]">
                {top3.map((r, i) => (
                  <TopRow key={r.id} r={r} medal={[medal1, medal2, medal3][i]!} />
                ))}
              </div>

              {/* Right column — 4–10 with numbers */}
              <div className="flex flex-col justify-between">
                {rest.map((r, i) => (
                  <RankRow key={r.id} r={r} rank={i + 4} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ src, name, sizeCqw }: { src: string | null; name: string; sizeCqw: number }) {
  const px = `${sizeCqw}cqw`;
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#0B1B30]"
      style={{
        width: px,
        height: px,
        boxShadow: "0 0 0 0.25cqw #7CC8FF, 0 0.6cqw 1.6cqw rgba(0,0,0,0.5)",
      }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : name.trim() ? (
        <div className="text-white font-black" style={{ fontSize: `${sizeCqw * 0.42}cqw` }}>
          {name.trim().charAt(0).toUpperCase()}
        </div>
      ) : (
        <UserIcon className="text-white/70" style={{ width: "55%", height: "55%" }} />
      )}
    </div>
  );
}

function NamePill({ name, fontCqw, padXCqw, padYCqw }: { name: string; fontCqw: number; padXCqw: number; padYCqw: number }) {
  return (
    <div
      className="flex-1 min-w-0 flex items-center justify-center font-['Poppins'] font-bold text-white text-center rounded-full"
      style={{
        padding: `${padYCqw}cqw ${padXCqw}cqw`,
        background: "linear-gradient(180deg, #143565 0%, #0E2748 100%)",
        boxShadow:
          "inset 0 0.08cqw 0 rgba(255,255,255,0.18), inset 0 0 0 0.12cqw #2A6BB5, 0 0.5cqw 1.4cqw rgba(0,0,0,0.45)",
        fontSize: `${fontCqw}cqw`,
        letterSpacing: "-0.01em",
      }}
    >
      <span className="truncate">{name || "—"}</span>
    </div>
  );
}

function TopRow({ r, medal }: { r: Affiliate; medal: string }) {
  return (
    <div className="flex items-center" style={{ gap: "1.4cqw" }}>
      <img
        src={medal}
        alt=""
        className="shrink-0"
        style={{ width: "5.6cqw", height: "auto", filter: "drop-shadow(0 0.4cqw 0.8cqw rgba(0,0,0,0.5))" }}
      />
      <Avatar src={r.avatar} name={r.name} sizeCqw={7.5} />
      <NamePill name={r.name} fontCqw={1.85} padXCqw={1.6} padYCqw={1.0} />
    </div>
  );
}

function RankRow({ r, rank }: { r: Affiliate; rank: number }) {
  return (
    <div className="flex items-center" style={{ gap: "1.2cqw" }}>
      <div
        className="shrink-0 text-white font-['Poppins'] font-black text-center"
        style={{
          width: "3.4cqw",
          fontSize: "2.2cqw",
          textShadow: "0 0.15cqw 0.4cqw rgba(0,0,0,0.5)",
        }}
      >
        {rank}
      </div>
      <Avatar src={r.avatar} name={r.name} sizeCqw={5.4} />
      <NamePill name={r.name} fontCqw={1.55} padXCqw={1.3} padYCqw={0.75} />
    </div>
  );
}
