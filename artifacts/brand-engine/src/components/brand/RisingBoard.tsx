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

      <div className="absolute text-center" style={{ top: "9%", left: "7%", right: "7%" }}>
        <div
          className="font-['Poppins'] font-bold whitespace-nowrap"
          style={{
            fontSize: "3.15cqw",
            lineHeight: 1.3,
            paddingBottom: "0.4cqw",
            letterSpacing: "-0.01em",
            background: "linear-gradient(180deg, #A8F0FF 0%, #00B8D9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0.15cqw 0.35cqw rgba(0,0,0,0.45))",
          }}
        >
          Rising Affiliate Leaderboard
        </div>
        <div className="font-['Bebas_Neue'] text-white" style={{ fontSize: "1.8cqw", lineHeight: 1, letterSpacing: "0.2em", marginTop: "0.3cqw" }}>
          {month || "—"}
        </div>
      </div>

      <div className="absolute flex flex-col" style={{ top: "23.3%", left: "7%", right: "7%" }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.1cqw", height: "9cqw" }}>
          {rows.slice(0, 3).map((r, i) => (
            <TopCard key={r.id} row={r} rank={i + 1} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center" style={{ marginTop: "1.666667cqw", gap: "0.833333cqw" }}>
          {rows.slice(3, 10).map((r, i) => (
            <SupportingCard key={r.id} row={r} rank={i + 4} />
          ))}
        </div>
        <div
          className="font-['Poppins'] font-semibold text-white/70 tracking-wide text-center"
          style={{ marginTop: "1.4cqw", fontSize: "1.1cqw", lineHeight: 1.2 }}
        >
          Meet with your Affiliate Manager
        </div>
      </div>
    </>
  );
}

function Mrr({ value, prominent = false }: { value?: string; prominent?: boolean }) {
  return (
    <div className="flex flex-col items-end shrink-0 font-['Poppins']">
      <div className="font-bold" style={{ fontSize: prominent ? "1.45cqw" : "1.4cqw", color: "#00B8D9", lineHeight: 1.1 }}>
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
    <div className="flex items-center h-full min-w-0" style={{ ...cardStyle, padding: "1cqw 1.1cqw", gap: "0.8cqw" }}>
      <img
        src={[cMedal1, cMedal2, cMedal3][rank - 1]}
        alt={`Rank ${rank}`}
        className="shrink-0 object-contain filter drop-shadow-md"
        style={{ width: "3.6cqw", height: "4cqw" }}
      />
      <div
        className="min-w-0 flex-1 font-bold text-white font-['Poppins']"
        style={{ fontSize: "1.55cqw", lineHeight: 1.2, letterSpacing: "-0.01em", overflowWrap: "anywhere", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
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
      className="flex flex-col justify-between"
      style={{ ...cardStyle, width: "calc((100% - 2.5cqw) / 4)", height: "8.5cqw", padding: "1.2cqw", gap: "0.65cqw", flexShrink: 0 }}
    >
      <div className="flex items-center" style={{ gap: "0.65cqw" }}>
        <div className="font-['Bebas_Neue'] text-center shrink-0" style={{ width: "2.2cqw", fontSize: "2.7cqw", color: "#00B8D9", lineHeight: 1 }}>
          {rank}
        </div>
        <div
          className="min-w-0 font-bold text-white font-['Poppins']"
          style={{ fontSize: "1.45cqw", lineHeight: 1.2, letterSpacing: "-0.01em", overflowWrap: "anywhere", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
        >
          {row.name || "—"}
        </div>
      </div>
      <Mrr value={row.mrr} />
    </div>
  );
}