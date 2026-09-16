import type { Affiliate } from "./LeaderBoardWorkspace";
import bgRising from "@assets/267ec670-6e5b-4a7e-aaa7-9799fb329bce_1789516902046.png";
import cMedal1 from "@assets/Asset_3@4x-8_1778887779024.png";
import cMedal2 from "@assets/Asset_2@4x-8_1778887779024.png";
import cMedal3 from "@assets/Asset_1@4x-8_1778887779024.png";

export function RisingBoard({ rows, month }: { rows: Affiliate[]; month: string }) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

  return (
    <>
      <img src={bgRising} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute pointer-events-none" style={{ inset: "2%", border: "0.12cqw solid rgba(50,225,233,0.55)", borderRadius: "1.5cqw", boxShadow: "inset 0 0 2cqw rgba(0,210,220,0.12), 0 0 1cqw rgba(0,210,220,0.2)" }} />

      {/* Title */}
      <div className="absolute text-center" style={{ top: "9%", left: "7%", right: "7%" }}>
        <div
          className="font-['Poppins'] font-bold whitespace-nowrap"
          style={{
            fontSize: "3.15cqw",
            lineHeight: 1.3,
            paddingBottom: "0.4cqw",
            letterSpacing: "-0.01em",
            // Teal/cyan gradient
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

      {/* Grid */}
      <div
        className="absolute grid"
        style={{
          top: "25%",
          left: "7%",
          right: "7%",
          bottom: "16%",
          gridTemplateColumns: "minmax(0, 53fr) minmax(0, 47fr)",
          columnGap: "2.4cqw",
        }}
      >
        {/* Left Column (1-3) */}
        <div className="flex flex-col justify-center" style={{ gap: "0.833333cqw", width: "96%", justifySelf: "center" }}>
          {top3.map((r, i) => (
            <RisingRow key={r.id} r={r} rank={i + 1} prominent />
          ))}
        </div>
        
        {/* Right Column (4-10) */}
        <div className="flex flex-col justify-center" style={{ gap: "0.3cqw" }}>
          {rest.map((r, i) => (
            <RisingRow key={r.id} r={r} rank={i + 4} />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="absolute font-['Poppins'] font-semibold text-white/70 tracking-wide text-center"
        style={{
          bottom: "11%",
          left: "7%",
          right: "7%",
          fontSize: "1.1cqw",
          lineHeight: 1.2,
        }}
      >
        Meet with your Affiliate Manager
      </div>
    </>
  );
}

function RisingRow({ r, rank, prominent = false }: { r: Affiliate; rank: number; prominent?: boolean }) {
  const isTop3 = rank <= 3;
  const isFirst = prominent && rank === 1;
  const medal = isTop3 ? [cMedal1, cMedal2, cMedal3][rank - 1] : null;

  return (
    <div
      className="flex items-center w-full"
      style={{
         gap: prominent ? "1.1cqw" : "1.8cqw",
         background: "rgba(5, 18, 38, 0.9)",
         padding: "0.3cqw 2cqw 0.3cqw 1.3cqw",
         height: prominent ? "5.4cqw" : "4.4cqw",
        flexShrink: 0,
        borderRadius: "1cqw",
         border: "1px solid rgba(150, 200, 230, 0.12)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: prominent ? (isFirst ? "4.8cqw" : "4.6cqw") : "3.5cqw", height: prominent ? (isFirst ? "4.8cqw" : "4.6cqw") : "3.5cqw" }}
      >
        {medal ? (
          <img src={medal} alt="" className="max-w-full max-h-full object-contain filter drop-shadow-md" />
        ) : (
          <div
            className="font-['Bebas_Neue'] text-center"
            style={{
              fontSize: prominent ? "2.8cqw" : "2.7cqw",
              color: "#00B8D9",
              letterSpacing: "0.02em",
            }}
          >
            {rank}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between font-['Poppins']" style={{ gap: "1.2cqw" }}>
        <div
          className="truncate font-bold text-white"
          style={{
             fontSize: prominent ? (isFirst ? "2.35cqw" : "2.25cqw") : "2cqw",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {r.name || "—"}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div
            className="font-bold"
            style={{
              fontSize: prominent ? (isFirst ? "2.05cqw" : "1.95cqw") : "1.65cqw",
              color: "#00B8D9",
            }}
          >
            {r.mrr || "$0"}
          </div>
          <div
            className="font-semibold"
            style={{
              fontSize: prominent ? "1.16cqw" : "1.1cqw",
              color: "#A9BDCF",
              letterSpacing: "0.05em",
            }}
          >
            NEW MRR
          </div>
        </div>
      </div>
    </div>
  );
}
