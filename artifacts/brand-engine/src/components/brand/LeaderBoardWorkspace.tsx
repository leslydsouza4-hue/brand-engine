import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Upload, X, User as UserIcon, GripVertical, Check, ChevronDown } from "lucide-react";
import { useExport } from "./useExport";
import { LivePreview } from "./LivePreview";
import bgAsset from "@assets/Group_1_1778872511433.png";
import bgCommander from "@assets/Commander-Leaderboard-Mar.-2026-(1)_1778885211192.png";
import medal1 from "@assets/1lugarrrrr_1778871874914.png";
import medal2 from "@assets/2lugarrrr_1778871874915.png";
import medal3 from "@assets/3lugarrrrrr_1778871874915.png";
import cMedal1 from "@assets/Asset_3@4x-8_1778887779024.png";
import cMedal2 from "@assets/Asset_2@4x-8_1778887779024.png";
import cMedal3 from "@assets/Asset_1@4x-8_1778887779024.png";
import photoDeclan from "@assets/20e391502323bad41fd3e968fb3c036a_(1)_(1)_copy_2_1778875414163.png";
import photoCharlie from "@assets/Charlie_Chang_copy_1778875414164.png";
import photoKai from "@assets/image_(100)_copy_1778875414164.png";
import photoDar from "@assets/tmpq89e1nnr_1778875414165.png";
import photoChris from "@assets/IMG_7271_(1)_1778875414164.png";
import photoCarson from "@assets/Carson_Reed_copy_5_1778875414164.png";
import photoMax from "@assets/40967358-1712920779192-4287537bb71b7_(1)_1778875414163.png";
import photoFrancisco from "@assets/b07c242a-2879-49ec-9f4a-65ae47117064_copy_2_1778875414164.png";
import photoBeant from "@assets/Asset_1@2x_1778875414164.png";
import photoPavel from "@assets/image_1778886967955.png";
import photoJason from "@assets/image_1778886996113.png";
import photoNick from "@assets/image_1778887019751.png";
import photoJasper from "@assets/image_1778887174334.png";
import photoAdam from "@assets/image_1778887201450.png";
import photoDan from "@assets/image_1778887227001.png";
import photoKeaton from "@assets/image_1778887253935.png";
import photoMichael from "@assets/image_1778887288526.png";
import photoClay from "@assets/image_1778887313620.png";
import photoMatt from "@assets/image_1778887339817.png";

interface Affiliate {
  id: string;
  name: string;
  avatar: string | null;
}

const HIGHLEVEL_SEED: Affiliate[] = [
  { id: "h1", name: "Declan O'Reilly", avatar: photoDeclan },
  { id: "h2", name: "Charlie Chang", avatar: photoCharlie },
  { id: "h3", name: "Kai Stone", avatar: photoKai },
  { id: "h4", name: "Dar Holdsworth", avatar: photoDar },
  { id: "h5", name: "Chris Koerner", avatar: photoChris },
  { id: "h6", name: "Carson Reed", avatar: photoCarson },
  { id: "h7", name: "Max Perzon", avatar: photoMax },
  { id: "h8", name: "Francisco & Jorge", avatar: photoFrancisco },
  { id: "h9", name: "Beant Singh", avatar: photoBeant },
  { id: "h10", name: "Theo Cavaliere", avatar: null },
];

const COMMANDER_ROSTER: Array<{ name: string; avatar: string | null }> = [
  { name: "Pavel Ketsuk", avatar: photoPavel },
  { name: "Jason Wardrop", avatar: photoJason },
  { name: "Nick Ponte", avatar: photoNick },
  { name: "Jasper Aiken", avatar: photoJasper },
  { name: "Adam Erhart", avatar: photoAdam },
  { name: "Dan Wardrope", avatar: photoDan },
  { name: "Keaton Walker", avatar: photoKeaton },
  { name: "Michael Cooch", avatar: photoMichael },
  { name: "Clay Lawrence", avatar: photoClay },
  { name: "Matt Deseno", avatar: photoMatt },
];
const COMMANDER_SEED: Affiliate[] = COMMANDER_ROSTER.map((p, i) => ({
  id: `c${i + 1}`,
  name: p.name,
  avatar: p.avatar,
}));

type BoardKey = "highlevel" | "commander";
const BOARD_LABELS: Record<BoardKey, string> = {
  highlevel: "Top HighLevel Affiliates",
  commander: "Commander Leader Board",
};

export function LeaderBoardWorkspace() {
  const [boards, setBoards] = useState<Record<BoardKey, Affiliate[]>>({
    highlevel: HIGHLEVEL_SEED,
    commander: COMMANDER_SEED,
  });
  const [board, setBoard] = useState<BoardKey>("highlevel");
  const [boardOpen, setBoardOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!boardOpen) return;
    const onClick = (e: MouseEvent) => {
      if (boardRef.current && !boardRef.current.contains(e.target as Node)) setBoardOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [boardOpen]);
  const [commanderMonthYear, setCommanderMonthYear] = useState("MARCH 2026");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { isExporting, handleExport } = useExport();

  const rows = boards[board];
  const setRows = (updater: (rs: Affiliate[]) => Affiliate[]) =>
    setBoards(b => ({ ...b, [board]: updater(b[board]) }));

  const update = (id: string, patch: Partial<Affiliate>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setRows(rs => {
      const next = rs.slice();
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
  };

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
  const isCommander = board === "commander";
  const cmdrLeft = rows.slice(0, 5);
  const cmdrRight = rows.slice(5, 10);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[340px] shrink-0 border-r border-white/5 bg-[rgba(255,255,255,0.015)] overflow-y-auto">
        <div className="p-[20px] flex flex-col gap-[18px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Board</div>
            <div className="relative" ref={boardRef}>
              {(() => {
                const meta = (k: BoardKey) =>
                  k === "highlevel"
                    ? { from: "#00B2A9", to: "#2896FB", thumb: bgAsset, dims: "1920 × 1080" }
                    : { from: "#FFD24A", to: "#C58B2C", thumb: bgCommander, dims: "2068 × 1324" };
                const active = meta(board);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setBoardOpen(o => !o)}
                      className="w-full flex items-center gap-[10px] py-[8px] pl-[8px] pr-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-left cursor-pointer hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(40,150,251,0.35)] transition-colors"
                    >
                      <div
                        className="w-[36px] h-[36px] rounded-[8px] shrink-0 bg-cover bg-center ring-1 ring-white/10"
                        style={{ backgroundImage: `url(${active.thumb})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-white leading-tight truncate">{BOARD_LABELS[board]}</div>
                        <div className="text-[9px] uppercase tracking-[0.12em] text-[#64748B] mt-[2px]">{active.dims}</div>
                      </div>
                      <div
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${active.from}, ${active.to})` }}
                      >
                        <ChevronDown className={`w-[11px] h-[11px] text-[#0B1220] transition-transform ${boardOpen ? "rotate-180" : ""}`} strokeWidth={3} />
                      </div>
                    </button>
                    {boardOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-[6px] p-[4px] rounded-[10px] bg-[#0F172A] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
                        {(Object.keys(BOARD_LABELS) as BoardKey[]).map(k => {
                          const m = meta(k);
                          const isActive = board === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                setBoard(k);
                                setBoardOpen(false);
                                setDragIndex(null);
                                setOverIndex(null);
                              }}
                              className={`w-full flex items-center gap-[10px] py-[7px] pl-[7px] pr-[10px] rounded-[8px] text-left cursor-pointer transition-colors ${
                                isActive ? "bg-[rgba(40,150,251,0.10)]" : "hover:bg-[rgba(255,255,255,0.04)]"
                              }`}
                            >
                              <div
                                className="w-[34px] h-[34px] rounded-[7px] shrink-0 bg-cover bg-center ring-1 ring-white/10"
                                style={{ backgroundImage: `url(${m.thumb})` }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-[12px] font-semibold leading-tight truncate ${isActive ? "text-white" : "text-[#CBD5E1]"}`}>
                                  {BOARD_LABELS[k]}
                                </div>
                                <div className="text-[9px] uppercase tracking-[0.12em] text-[#64748B] mt-[2px]">{m.dims}</div>
                              </div>
                              {isActive && (
                                <div
                                  className="w-[16px] h-[16px] rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}
                                >
                                  <Check className="w-[9px] h-[9px] text-[#0B1220]" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          {isCommander && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Month / Year</div>
              <input
                type="text"
                value={commanderMonthYear}
                onChange={e => setCommanderMonthYear(e.target.value.toUpperCase())}
                placeholder="MARCH 2026"
                className="w-full py-[9px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-[13px] font-semibold text-white outline-none focus:border-[rgba(40,150,251,0.4)] uppercase tracking-[0.1em]"
              />
            </div>
          )}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">{BOARD_LABELS[board]} (1–10)</div>
            <div className="flex flex-col gap-[8px]">
              {rows.map((r, i) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={e => {
                    setDragIndex(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overIndex !== i) setOverIndex(i);
                  }}
                  onDragLeave={() => {
                    if (overIndex === i) setOverIndex(null);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragIndex !== null) reorder(dragIndex, i);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`p-[10px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border flex items-center gap-[8px] transition-colors ${
                    overIndex === i && dragIndex !== null && dragIndex !== i
                      ? "border-[rgba(40,150,251,0.7)] bg-[rgba(40,150,251,0.08)]"
                      : "border-[rgba(255,255,255,0.06)]"
                  } ${dragIndex === i ? "opacity-40" : ""}`}
                >
                  <div
                    className="shrink-0 flex items-center justify-center w-[18px] h-[26px] text-[#64748B] hover:text-[#7CC8FF] cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-[14px] h-[14px]" />
                  </div>
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

          <button
            onClick={onDownload}
            disabled={isExporting}
            className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(40,150,251,0.3)] disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
            {isExporting ? "Exporting..." : "Download PNG"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <LivePreview>
        <div
          ref={previewRef}
          data-export-preview
          data-export-name="Leader Board"
          className="relative rounded-[14px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)] w-full"
          style={{
            aspectRatio: isCommander ? "2068 / 1324" : "1920 / 1080",
            background: "#000",
            containerType: "inline-size",
            maxWidth: "min(100%, calc((100vh - 200px) * " + (isCommander ? "1.562" : "1.778") + "))",
          }}
        >
            {/* Background */}
            <img
              src={isCommander ? bgCommander : bgAsset}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />

            {isCommander ? (
              <>
                {/* Title */}
                <div className="absolute left-0 right-0 text-center" style={{ top: "12%" }}>
                  <div
                    className="font-['Bebas_Neue']"
                    style={{
                      fontSize: "6.2cqw",
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                      background: "linear-gradient(180deg, #FFE89A 0%, #C58B2C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0.2cqw 0.4cqw rgba(0,0,0,0.5))",
                    }}
                  >
                    COMMANDER LEADERBOARD
                  </div>
                  <div className="flex items-center justify-center" style={{ gap: "1cqw", marginTop: "0.8cqw" }}>
                    <div style={{ height: "0.18cqw", width: "8cqw", background: "linear-gradient(90deg, transparent 0%, #C58B2C 100%)" }} />
                    <div className="font-['Bebas_Neue'] text-white" style={{ fontSize: "1.9cqw", letterSpacing: "0.22em", lineHeight: 1 }}>
                      {commanderMonthYear || "—"}
                    </div>
                    <div style={{ height: "0.18cqw", width: "8cqw", background: "linear-gradient(90deg, #C58B2C 0%, transparent 100%)" }} />
                  </div>
                </div>

                {/* 5 + 5 grid — fits inside frame interior */}
                <div
                  className="absolute grid"
                  style={{
                    top: "27%",
                    left: "7%",
                    right: "11%",
                    bottom: "13%",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "0.6cqw",
                    rowGap: "1.2cqw",
                  }}
                >
                  <div className="flex flex-col justify-center items-end" style={{ gap: "0.7cqw" }}>
                    {cmdrLeft.map((r, i) => (
                      <div key={r.id} style={{ width: "71.5%" }}>
                        <CommanderRow r={r} rank={i + 1} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-center items-start" style={{ gap: "0.7cqw" }}>
                    {cmdrRight.map((r, i) => (
                      <div key={r.id} style={{ width: "71.5%" }}>
                        <CommanderRow r={r} rank={i + 6} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                className="absolute grid"
                style={{
                  top: "19%",
                  left: "16%",
                  right: "4%",
                  bottom: "7%",
                  gridTemplateColumns: "40% 50%",
                  columnGap: "3%",
                }}
              >
                <div className="flex flex-col" style={{ gap: "4.7cqw" }}>
                  {top3.map((r, i) => (
                    <TopRow key={r.id} r={r} medal={[medal1, medal2, medal3][i]!} />
                  ))}
                </div>
                <div className="flex flex-col" style={{ gap: "1.4cqw" }}>
                  {rest.map((r, i) => (
                    <RankRow key={r.id} r={r} rank={i + 4} />
                  ))}
                </div>
              </div>
            )}
        </div>
      </LivePreview>
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
        style={{ width: "2.31cqw", height: "auto", filter: "drop-shadow(0 0.3cqw 0.6cqw rgba(0,0,0,0.5))" }}
      />
      <Avatar src={r.avatar} name={r.name} sizeCqw={5.6} />
      <NamePill name={r.name} fontCqw={1.85} padXCqw={1.4} padYCqw={1.0} radiusCqw={0.8} />
    </div>
  );
}

const ORDINAL = ["1ST", "2ND", "3RD", "4TH", "5TH", "6TH", "7TH", "8TH", "9TH", "10TH"];

function CommanderRow({ r, rank }: { r: Affiliate; rank: number }) {
  const useMedal = rank <= 3;
  const medal = [cMedal1, cMedal2, cMedal3][rank - 1];
  const ROW_H = 5.94;
  const ICON_BOX = 3.3;
  return (
    <div
      className="flex items-center overflow-hidden"
      style={{
        height: `${ROW_H}cqw`,
        gap: "0.8cqw",
        padding: "0 1cqw 0 0.6cqw",
        borderRadius: "0.8cqw",
        background: "linear-gradient(180deg, rgba(13,32,64,0.85) 0%, rgba(8,20,42,0.85) 100%)",
        boxShadow: "inset 0 0 0 0.12cqw #4FC3FF",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: `${ICON_BOX}cqw`, height: `${ICON_BOX}cqw` }}
      >
        {useMedal && medal ? (
          <img
            src={medal}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div
            className="font-['Bebas_Neue'] text-center"
            style={{
              fontSize: "1.7cqw",
              lineHeight: 1,
              background: "linear-gradient(180deg, #FFE89A 0%, #C58B2C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.02em",
            }}
          >
            {ORDINAL[rank - 1]}
          </div>
        )}
      </div>
      <Avatar src={r.avatar} name={r.name} sizeCqw={ICON_BOX} />
      <div
        className="flex-1 min-w-0 truncate font-['Bebas_Neue'] text-white"
        style={{ fontSize: "2.2cqw", letterSpacing: "0.04em", lineHeight: 1 }}
      >
        {r.name || "—"}
      </div>
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
      <NamePill name={r.name} fontCqw={1.85} padXCqw={1.4} padYCqw={1.0} radiusCqw={0.8} bgAlpha={0.6} />
    </div>
  );
}
