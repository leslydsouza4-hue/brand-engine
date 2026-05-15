import { useRef, useState } from "react";
import { Trophy, Download, Loader2, Upload, X, User as UserIcon } from "lucide-react";
import { useExport } from "./useExport";
import bgAsset from "@assets/Group_1_1778872511433.png";
import medal1 from "@assets/1lugarrrrr_1778871874914.png";
import medal2 from "@assets/2lugarrrr_1778871874915.png";
import medal3 from "@assets/3lugarrrrrr_1778871874915.png";
import photoDeclan from "@assets/20e391502323bad41fd3e968fb3c036a_(1)_(1)_copy_2_1778875414163.png";
import photoCharlie from "@assets/Charlie_Chang_copy_1778875414164.png";
import photoKai from "@assets/image_(100)_copy_1778875414164.png";
import photoDar from "@assets/tmpq89e1nnr_1778875414165.png";
import photoChris from "@assets/IMG_7271_(1)_1778875414164.png";
import photoCarson from "@assets/Carson_Reed_copy_5_1778875414164.png";
import photoMax from "@assets/40967358-1712920779192-4287537bb71b7_(1)_1778875414163.png";
import photoFrancisco from "@assets/b07c242a-2879-49ec-9f4a-65ae47117064_copy_2_1778875414164.png";
import photoBeant from "@assets/Asset_1@2x_1778875414164.png";

interface Affiliate {
  id: string;
  name: string;
  avatar: string | null;
}

const SEED: Affiliate[] = [
  { id: "a1", name: "Declan O'Reilly", avatar: photoDeclan },
  { id: "a2", name: "Charlie Chang", avatar: photoCharlie },
  { id: "a3", name: "Kai Stone", avatar: photoKai },
  { id: "a4", name: "Dar Holdsworth", avatar: photoDar },
  { id: "a5", name: "Chris Koerner", avatar: photoChris },
  { id: "a6", name: "Carson Reed", avatar: photoCarson },
  { id: "a7", name: "Max Perzon", avatar: photoMax },
  { id: "a8", name: "Francisco & Jorge", avatar: photoFrancisco },
  { id: "a9", name: "Beant Singh", avatar: photoBeant },
  { id: "a10", name: "Theo Cavaliere", avatar: null },
];

export function LeaderBoardWorkspace() {
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
            data-export-name="Leader Board"
            className="relative rounded-[14px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            style={{ aspectRatio: "1920 / 1080", background: "#000", containerType: "inline-size" }}
          >
            {/* Background (frame + title + robot all baked in) */}
            <img src={bgAsset} alt="" className="absolute inset-0 w-full h-full object-cover" />

            {/* Two-column rows — positioned to match reference */}
            <div
              className="absolute grid"
              style={{
                top: "19%",
                left: "14%",
                right: "6%",
                bottom: "7%",
                gridTemplateColumns: "36% 56%",
                columnGap: "3%",
              }}
            >
              {/* Left column — top 3 with medals, gap chosen so #3 aligns with right row 5 */}
              <div className="flex flex-col" style={{ gap: "4.7cqw" }}>
                {top3.map((r, i) => (
                  <TopRow key={r.id} r={r} medal={[medal1, medal2, medal3][i]!} />
                ))}
              </div>

              {/* Right column — 4–10 with numbers, breathing room between rows */}
              <div className="flex flex-col" style={{ gap: "1.9cqw" }}>
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
        boxShadow: "0 0 0 0.25cqw #7CC8FF",
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

function NamePill({ name, fontCqw, padXCqw, padYCqw, radiusCqw, bgAlpha = 1 }: { name: string; fontCqw: number; padXCqw: number; padYCqw: number; radiusCqw: number; bgAlpha?: number }) {
  return (
    <div
      className="flex-1 min-w-0 flex items-center font-['Poppins'] font-bold text-white"
      style={{
        padding: `${padYCqw}cqw ${padXCqw}cqw`,
        borderRadius: `${radiusCqw}cqw`,
        background: `linear-gradient(180deg, rgba(20,53,101,${bgAlpha}) 0%, rgba(14,39,72,${bgAlpha}) 100%)`,
        boxShadow:
          `inset 0 0.08cqw 0 rgba(255,255,255,${0.18 * bgAlpha}), inset 0 0 0 0.12cqw rgba(42,107,181,${bgAlpha})`,
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
    <div className="flex items-center" style={{ gap: "1.1cqw" }}>
      <img
        src={medal}
        alt=""
        className="shrink-0"
        style={{ width: "2.1cqw", height: "auto", filter: "drop-shadow(0 0.3cqw 0.6cqw rgba(0,0,0,0.5))" }}
      />
      <Avatar src={r.avatar} name={r.name} sizeCqw={5.6} />
      <NamePill name={r.name} fontCqw={1.85} padXCqw={1.4} padYCqw={1.0} radiusCqw={0.8} />
    </div>
  );
}

function RankRow({ r, rank }: { r: Affiliate; rank: number }) {
  return (
    <div className="flex items-center" style={{ gap: "1.4cqw" }}>
      <div
        className="shrink-0 text-white font-['Poppins'] font-black text-center"
        style={{
          width: "2cqw",
          fontSize: "1.4cqw",
        }}
      >
        {rank}
      </div>
      <Avatar src={r.avatar} name={r.name} sizeCqw={3.5} />
      <NamePill name={r.name} fontCqw={1.6} padXCqw={1.4} padYCqw={0.88} radiusCqw={0.7} bgAlpha={0.6} />
    </div>
  );
}
