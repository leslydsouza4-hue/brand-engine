import type { CSSProperties } from "react";
import type { Affiliate } from "./LeaderBoardWorkspace";
import bgRising from "@assets/1fe1f0ff-e856-4e9a-9a63-80696e4549d0_1789517422806.png";
import cMedal1 from "@assets/Asset_3@4x-8_1778887779024.png";
import cMedal2 from "@assets/Asset_2@4x-8_1778887779024.png";
import cMedal3 from "@assets/Asset_1@4x-8_1778887779024.png";

const cardStyle: CSSProperties = {
  background: "rgba(5, 18, 38, 0.9)",
  borderRadius: "1cqw",
  border: "1px solid rgba(150, 200, 230, 0.12)",
};

export function RisingBoard({ rows, month }: { rows: Affiliate[]; month: string }) {
  return (
    <>
      <img src={bgRising} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute pointer-events-none" style={{ inset: "2%", border: "0.12cqw solid rgba(50,225,233,0.55)", borderRadius: "1.5cqw", boxShadow: "inset 0 0 2cqw rgba(0,210,220,0.12), 0 0 1cqw rgba(0,210,220,0.2)" }} />

      <div className="absolute text-center" style={{ top: "7%", left: "7%", right: "7%" }}>
        <div
          className="font-['Bebas_Neue'] font-semibold uppercase whitespace-nowrap"
          style={{
            fontSize: "3.78cqw",
            lineHeight: 1.3,
            paddingBottom: "0.4cqw",
            letterSpacing: "0.04em",
            background: "linear-gradient(180deg, #A8F0FF 0%, #00B8D9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0.15cqw 0.35cqw rgba(0,0,0,0.45))",
          }}
        >
          Rising Affiliate Leaderboard
        </div>
        <div className="font-['Bebas_Neue'] text-white" style={{ fontSize: "2.16cqw", lineHeight: 1, letterSpacing: "0.2em", marginTop: "0.3cqw" }}>
          {month || "—"}
        </div>
      </div>

      <div className="absolute grid items-stretch" style={{ top: "23.6%", left: "5%", right: "7%", gridTemplateColumns: "minmax(0, 45.15fr) minmax(0, 40.42fr)", columnGap: "2.43cqw" }}>
        <div className="grid" style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))", gap: "1cqw" }}>
          {rows.slice(0, 3).map((r, i) => (
            <TopCard key={r.id} row={r} rank={i + 1} />
          ))}
        </div>
        <div className="flex flex-col" style={{ gap: "0.86cqw" }}>
          {rows.slice(3, 10).map((r, i) => (
            <SupportingCard key={r.id} row={r} rank={i + 4} />
          ))}
        </div>
      </div>
    </>
  );
}

function Mrr({ value, prominent = false }: { value?: string; prominent?: boolean }) {
  return (
    <div className="flex flex-col items-end shrink-0 font-['Poppins']">
      <div className="font-bold" style={{ fontSize: prominent ? "3cqw" : "1.5cqw", color: "#00B8D9", lineHeight: 1.1 }}>
        {value || "$0"}
      </div>
      <div className="font-semibold" style={{ fontSize: "0.95cqw", color: "#A9BDCF", letterSpacing: "0.05em", lineHeight: 1.1 }}>
        NEW MRR
      </div>
    </div>
  );
}

function TopCard({ row, rank }: { row: Affiliate; rank: number }) {
  return (
    <div className="flex items-center min-w-0 shrink-0" style={{ ...cardStyle, minHeight: "6.5cqw", padding: "0.6cqw 1.5cqw", gap: "1cqw" }}>
      <img
        src={[cMedal1, cMedal2, cMedal3][rank - 1]}
        alt={`Rank ${rank}`}
        className="shrink-0 object-contain filter drop-shadow-md"
        style={{ width: "4.14cqw", height: "4.6cqw" }}
      />
      <div
        className="min-w-0 flex-1 font-bold text-white font-['Poppins']"
        style={{ fontSize: "2.25cqw", lineHeight: 1.2, letterSpacing: "-0.01em", overflowWrap: "anywhere", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
      >
        {row.name || "—"}
      </div>
      <Mrr value={row.mrr} prominent />
    </div>
  );
}

function SupportingCard({ row, rank }: { row: Affiliate; rank: number }) {
  return (
    <div
      className="flex items-center"
      style={{ ...cardStyle, height: "4.5cqw", padding: "0.6cqw 1.3cqw", gap: "1cqw", flexShrink: 0 }}
    >
      <div className="flex flex-1 min-w-0 items-center" style={{ gap: "1cqw" }}>
        <div className="font-['Bebas_Neue'] text-center shrink-0" style={{ width: "2.2cqw", fontSize: "2.7cqw", color: "#00B8D9", lineHeight: 1 }}>
          {rank}
        </div>
        <div
          className="min-w-0 font-bold text-white font-['Poppins']"
          style={{ fontSize: "1.8cqw", lineHeight: 1.2, letterSpacing: "-0.01em", overflowWrap: "anywhere", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
        >
          {row.name || "—"}
        </div>
      </div>
      <Mrr value={row.mrr} />
    </div>
  );
}