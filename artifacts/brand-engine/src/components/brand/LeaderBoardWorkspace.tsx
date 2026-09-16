import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Upload, X, User as UserIcon, GripVertical, Check, ChevronDown } from "lucide-react";
import { useExport } from "./useExport";
import { LivePreview } from "./LivePreview";
import { RisingBoard } from "./RisingBoard";
import bgAsset from "@assets/Group_1_1778888276448.png";
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
import comboBg from "@assets/image222_1780516914399.png";

export interface Affiliate {
  id: string;
  name: string;
  avatar: string | null;
  mrr?: string;
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

type SingleBoard = "highlevel" | "commander" | "rising";
type BoardKey = SingleBoard | "combo";
const BOARD_LABELS: Record<BoardKey, string> = {
  highlevel: "Top HighLevel Affiliates",
  commander: "Commander Leader Board",
  rising: "Rising Affiliate Leaderboard",
  combo: "Commander + Affiliate",
};

const RISING_SEED: Affiliate[] = Array.from({ length: 10 }, (_, i) => ({
  id: `r${i + 1}`,
  name: "Affiliate Name",
  avatar: null,
}));

// Combo board = Commander (7) on the left + Affiliate (10) on the right, over one boxless bg image.
const COMBO_CMDR_SEED: Affiliate[] = COMMANDER_ROSTER.slice(0, 7).map((p, i) => ({
  id: `xc${i + 1}`,
  name: p.name,
  avatar: p.avatar,
}));
const COMBO_AFF_SEED: Affiliate[] = HIGHLEVEL_SEED.slice(0, 10).map((p, i) => ({
  id: `xa${i + 1}`,
  name: p.name,
  avatar: p.avatar,
}));

export function LeaderBoardWorkspace() {
  const [boards, setBoards] = useState<Record<SingleBoard, Affiliate[]>>({
    highlevel: HIGHLEVEL_SEED,
    commander: COMMANDER_SEED,
    rising: RISING_SEED,
  });
  const [comboCmdr, setComboCmdr] = useState<Affiliate[]>(COMBO_CMDR_SEED);
  const [comboAff, setComboAff] = useState<Affiliate[]>(COMBO_AFF_SEED);
  const [comboMonthYear, setComboMonthYear] = useState("FEBRUARY 2026");
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
  const [highlevelMonthYear, setHighlevelMonthYear] = useState("MARCH 2026");
  const [risingMonthYear, setRisingMonthYear] = useState("MARCH 2026");
  const previewRef = useRef<HTMLDivElement>(null);
  const { isExporting, handleExport } = useExport();

  const isCommander = board === "commander";
  const isCombo = board === "combo";
  const singleRows = isCombo ? [] : boards[board as SingleBoard];
  const setSingleRows = (next: Affiliate[]) =>
    setBoards(b => ({ ...b, [board as SingleBoard]: next }));

  const onDownload = () => {
    if (previewRef.current) void handleExport("png", previewRef.current);
  };

  const top3 = singleRows.slice(0, 3);
  const rest = singleRows.slice(3, 10);
  const cmdrLeft = singleRows.slice(0, 5);
  const cmdrRight = singleRows.slice(5, 10);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[340px] shrink-0 border-r border-white/5 bg-[rgba(255,255,255,0.015)] overflow-y-auto">
        <div className="p-[20px] flex flex-col gap-[18px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Board</div>
            <div className="relative" ref={boardRef}>
              <button
                type="button"
                onClick={() => setBoardOpen(o => !o)}
                className="w-full flex items-center gap-[10px] py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-left cursor-pointer hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(40,150,251,0.35)] transition-colors"
              >
                <div className="flex-1 min-w-0 text-[13px] font-semibold text-white truncate">{BOARD_LABELS[board]}</div>
                <ChevronDown className={`w-[14px] h-[14px] text-[#94A3B8] transition-transform shrink-0 ${boardOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
              </button>
              {boardOpen && (
                <div className="absolute z-30 left-0 right-0 mt-[6px] p-[4px] rounded-[10px] bg-[#0F172A] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
                  {(Object.keys(BOARD_LABELS) as BoardKey[]).map(k => {
                    const isActive = board === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setBoard(k);
                          setBoardOpen(false);
                        }}
                        className={`w-full flex items-center gap-[10px] py-[9px] px-[12px] rounded-[8px] text-left cursor-pointer transition-colors ${
                          isActive ? "bg-[rgba(40,150,251,0.10)] text-white" : "text-[#CBD5E1] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                        }`}
                      >
                        <div className="flex-1 min-w-0 text-[12px] font-semibold truncate">{BOARD_LABELS[k]}</div>
                        {isActive && <Check className="w-[12px] h-[12px] text-[#2896FB] shrink-0" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Month / Year</div>
            <input
              type="text"
              value={isCombo ? comboMonthYear : isCommander ? commanderMonthYear : board === "rising" ? risingMonthYear : highlevelMonthYear}
              onChange={e => {
                const v = e.target.value.toUpperCase();
                if (isCombo) setComboMonthYear(v);
                else if (isCommander) setCommanderMonthYear(v);
                else if (board === "rising") setRisingMonthYear(v);
                else setHighlevelMonthYear(v);
              }}
              placeholder="MARCH 2026"
              className="w-full py-[9px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-[13px] font-semibold text-white outline-none focus:border-[rgba(40,150,251,0.4)] uppercase tracking-[0.1em]"
            />
          </div>
          {isCombo ? (
            <>
              <EditableRows title="Commander (1–7)" rows={comboCmdr} onChange={setComboCmdr} />
              <EditableRows title="Affiliate (1–10)" rows={comboAff} onChange={setComboAff} />
            </>
          ) : (
            <EditableRows 
              key={board} 
              title={board === "rising" ? "RISING AFFILIATES (1–10)" : `${BOARD_LABELS[board]} (1–10)`} 
              rows={singleRows} 
              onChange={setSingleRows} 
              noAvatar={board === "rising"}
            />
          )}

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
            aspectRatio: isCombo ? "1536 / 1024" : isCommander ? "2068 / 1324" : "1920 / 1080",
            background: "#000",
            containerType: "inline-size",
            maxWidth: "min(100%, calc((100vh - 200px) * " + (isCombo ? "1.5" : isCommander ? "1.562" : "1.778") + "))",
          }}
        >
            {isCombo ? (
              <ComboBoard cmdr={comboCmdr} aff={comboAff} month={comboMonthYear} />
            ) : board === "rising" ? (
              <RisingBoard rows={boards.rising} month={risingMonthYear} />
            ) : (
            <>
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
                  <span
                    className="font-['Bebas_Neue'] inline-block"
                    style={{
                      fontSize: "6.2cqw",
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                      backgroundImage: "linear-gradient(180deg, #FFE89A 0%, #C58B2C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "#E0B156",
                      filter: "drop-shadow(0 0.2cqw 0.4cqw rgba(0,0,0,0.5))",
                    }}
                  >
                    COMMANDER LEADERBOARD
                  </span>
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
              <>
                {/* Title overlay */}
                <div className="absolute text-center" style={{ top: "10%", left: "8%", right: "5%" }}>
                  <div
                    className="font-['Poppins'] font-bold whitespace-nowrap"
                    style={{
                      fontSize: "2.72cqw",
                      lineHeight: 1.3,
                      paddingBottom: "0.4cqw",
                      letterSpacing: "-0.01em",
                      background: "linear-gradient(180deg, #BEEAFF 0%, #2896FB 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0.15cqw 0.35cqw rgba(0,0,0,0.45))",
                    }}
                  >
                    Top HighLevel Affiliates {highlevelMonthYear || "—"}
                  </div>
                </div>
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
              </>
            )}
            </>
            )}
        </div>
      </LivePreview>
    </div>
  );
}

function Avatar({ src, name, sizeCqw, ringColor = "#7CC8FF" }: { src: string | null; name: string; sizeCqw: number; ringColor?: string }) {
  const px = `${sizeCqw}cqw`;
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#0B1B30]"
      style={{
        width: px,
        height: px,
        boxShadow: `0 0 0 0.25cqw ${ringColor}`,
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

function EditableRows({
  title,
  rows,
  onChange,
  noAvatar,
  showMrr,
}: {
  title: string;
  rows: Affiliate[];
  onChange: (next: Affiliate[]) => void;
  noAvatar?: boolean;
  showMrr?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const update = (id: string, patch: Partial<Affiliate>) =>
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  };

  const onAvatar = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => update(id, { avatar: String(e.target?.result || "") });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">{title}</div>
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
            {!noAvatar && (r.avatar ? (
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
            ))}
            <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
              <input
                value={r.name}
                onChange={e => update(r.id, { name: e.target.value })}
                placeholder="Name"
                className="w-full py-[7px] px-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[7px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)]"
              />
              {showMrr && (
                <input
                  value={r.mrr || ""}
                  onChange={e => update(r.id, { mrr: e.target.value })}
                  placeholder="New MRR (e.g. $8,420)"
                  className="w-full py-[5px] px-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[7px] text-[11px] text-[#94A3B8] outline-none focus:border-[rgba(40,150,251,0.3)] font-mono"
                />
              )}
            </div>
            {!noAvatar && r.avatar && (
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
  );
}

// Boxless frame image222 (1536x1024): left (gold) panel inner ~x0.035-0.482,
// right (blue) panel inner ~x0.530-0.968, both y ~0.045-0.93. No printed boxes —
// we draw our own rows. Dotted accents sit near each panel's inner edge, so the
// content insets stop short of them.
const COMBO_LEFT = { left: 0.048, width: 0.4 };
const COMBO_RIGHT = { left: 0.533, width: 0.4 };
const COMBO_ROWS_TOP = 0.2;
const COMBO_ROWS_BOT = 0.9;

// Evenly distribute n rows in the panel's content band; returns center-Y and row height (board fractions).
function comboRowGeom(n: number, i: number) {
  const span = (COMBO_ROWS_BOT - COMBO_ROWS_TOP) / Math.max(n, 1);
  const cy = COMBO_ROWS_TOP + span * (i + 0.5);
  const h = span * (n <= 7 ? 0.8 : 0.84);
  return { cy, h };
}

function ComboBoard({ cmdr, aff, month }: { cmdr: Affiliate[]; aff: Affiliate[]; month: string }) {
  const cmdrRows = cmdr.slice(0, 7);
  const affRows = aff.slice(0, 10);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={comboBg}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
        style={{ objectFit: "fill" }}
      />

      <ComboTitle title="COMMANDER LEADERBOARD" month={month} accent="gold" box={COMBO_LEFT} />
      <ComboTitle title="AFFILIATE LEADERBOARD" month={month} accent="cyan" box={COMBO_RIGHT} />

      {cmdrRows.map((r, i) => {
        const g = comboRowGeom(cmdrRows.length, i);
        return <ComboSlot key={`c${i}`} cy={g.cy} h={g.h} box={COMBO_LEFT} side="left" r={r} rank={i + 1} />;
      })}
      {affRows.map((r, i) => {
        const g = comboRowGeom(affRows.length, i);
        return <ComboSlot key={`a${i}`} cy={g.cy} h={g.h} box={COMBO_RIGHT} side="right" r={r} rank={i + 1} />;
      })}

      <ComboCenterEmblem />
    </div>
  );
}

function ComboCenterEmblem() {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: "50%",
        top: "92.5%",
        width: "6cqw",
        height: "6cqw",
        transform: "translate(-50%, -50%)",
        borderRadius: "9999px",
        background: "radial-gradient(circle at 50% 40%, #0c1a33 0%, #050d1c 100%)",
        border: "0.25cqw solid #E7B65C",
        boxShadow: "0 0 1.4cqw rgba(231,182,92,0.55), inset 0 0 0.8cqw rgba(231,182,92,0.3)",
        zIndex: 6,
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}assets/logos/Lockup=Icon, Color=Full.png`}
        alt=""
        draggable={false}
        style={{ width: "3.2cqw", height: "3.2cqw", objectFit: "contain" }}
      />
    </div>
  );
}

function ComboTitle({
  title,
  month,
  accent,
  box,
}: {
  title: string;
  month: string;
  accent: "gold" | "cyan";
  box: { left: number; width: number };
}) {
  const gold = accent === "gold";
  const dash = gold ? "#C58B2C" : "#4FC3FF";
  return (
    <div
      className="absolute flex flex-col items-center justify-center text-center"
      style={{ left: `${box.left * 100}%`, width: `${box.width * 100}%`, top: "6.5%", height: "11%" }}
    >
      <div
        className="font-['Bebas_Neue']"
        style={{
          fontSize: "3.3cqw",
          lineHeight: 1,
          letterSpacing: "0.04em",
          backgroundImage: gold
            ? "linear-gradient(180deg, #FFE89A 0%, #C58B2C 100%)"
            : "linear-gradient(180deg, #BEEAFF 0%, #2896FB 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: gold ? "#E0B156" : "#56B8FB",
          filter: "drop-shadow(0 0.2cqw 0.4cqw rgba(0,0,0,0.5))",
        }}
      >
        {title}
      </div>
      <div className="flex items-center justify-center" style={{ gap: "0.8cqw", marginTop: "0.6cqw" }}>
        <div style={{ height: "0.16cqw", width: "4cqw", background: `linear-gradient(90deg, transparent 0%, ${dash} 100%)` }} />
        <div className="font-['Bebas_Neue'] text-white" style={{ fontSize: "1.5cqw", letterSpacing: "0.2em", lineHeight: 1 }}>
          {month || "—"}
        </div>
        <div style={{ height: "0.16cqw", width: "4cqw", background: `linear-gradient(90deg, ${dash} 0%, transparent 100%)` }} />
      </div>
    </div>
  );
}

function ComboSlot({
  cy,
  h,
  box,
  side,
  r,
  rank,
}: {
  cy: number;
  h: number;
  box: { left: number; width: number };
  side: "left" | "right";
  r?: Affiliate;
  rank: number;
}) {
  if (!r) return null;
  const isRight = side === "right";
  const common = {
    top: `${(cy - h / 2) * 100}%`,
    height: `${h * 100}%`,
    left: `${box.left * 100}%`,
    width: `${box.width * 100}%`,
  } as const;

  if (isRight) {
    // Affiliate: white rank number (left, outside the pill) + blue gradient pill.
    return (
      <div className="absolute flex items-center" style={{ ...common, gap: "0.9cqw" }}>
        <div
          className="shrink-0 text-center font-['Bebas_Neue']"
          style={{ width: "3cqw", color: "#FFFFFF", fontSize: "2.4cqw", lineHeight: 1 }}
        >
          {rank}
        </div>
        <div
          className="flex-1 min-w-0 h-full flex items-center"
          style={{
            background: "linear-gradient(95deg, #0140ea 0%, #2f86ff 100%)",
            borderRadius: "1cqw",
            padding: "0 1.3cqw",
            gap: "1cqw",
            boxShadow:
              "inset 0 0.18cqw 0.4cqw rgba(255,255,255,0.22), inset 0 -0.2cqw 0.4cqw rgba(0,0,0,0.25), 0 0.25cqw 0.6cqw rgba(0,0,0,0.35)",
          }}
        >
          <Avatar src={r.avatar ?? null} name={r.name ?? ""} sizeCqw={2.9} ringColor="#CFE6FF" />
          <div
            className="flex-1 min-w-0 truncate"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1.75cqw",
              color: "#FFFFFF",
              lineHeight: 1.05,
              textShadow: "0 0.12cqw 0.3cqw rgba(3,16,40,0.5)",
            }}
          >
            {r.name ?? ""}
          </div>
        </div>
      </div>
    );
  }

  // Commander: glossy navy box (bright cyan left accent + top sheen) like the reference.
  return (
    <div
      className="absolute flex items-center"
      style={{
        ...common,
        padding: "0 1.3cqw 0 1.6cqw",
        gap: "1.1cqw",
        overflow: "hidden",
        background: "transparent",
        border: "0.12cqw solid rgba(150,195,255,0.45)",
        borderRadius: "1cqw",
        boxShadow:
          "inset 0 0.16cqw 0.14cqw rgba(185,220,255,0.20), " +
          "inset 0.22cqw 0 0 rgba(38,222,240,0.7), " +
          "0 0 0.6cqw rgba(120,180,255,0.18)",
      }}
    >
      <ComboRankBadge rank={rank} />
      <Avatar src={r.avatar ?? null} name={r.name ?? ""} sizeCqw={3.6} ringColor="#A9C1DB" />
      <div
        className="flex-1 min-w-0 truncate"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "2.7cqw",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: "#FFFFFF",
          textTransform: "uppercase",
          textShadow: "0 0.1cqw 0.3cqw rgba(0,0,0,0.45)",
        }}
      >
        {r.name ?? ""}
      </div>
    </div>
  );
}

function ComboRankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const color = rank === 2 ? "#C6D2E0" : "#E7B65C";
    return (
      <div
        className="shrink-0 flex items-center justify-center font-['Bebas_Neue']"
        style={{
          width: "3.1cqw",
          height: "3.1cqw",
          border: `0.22cqw solid ${color}`,
          borderRadius: "0.6cqw",
          color,
          fontSize: "2.1cqw",
          lineHeight: 1,
          background: "rgba(2,12,28,0.45)",
          boxShadow: `0 0 0.7cqw ${color}40, inset 0 0 0.5cqw ${color}25`,
        }}
      >
        {rank}
      </div>
    );
  }
  return (
    <div
      className="shrink-0 text-center font-['Bebas_Neue']"
      style={{ width: "3.1cqw", color: "#EAF2FB", fontSize: "2cqw", lineHeight: 1, letterSpacing: "0.02em" }}
    >
      {rank}TH
    </div>
  );
}
