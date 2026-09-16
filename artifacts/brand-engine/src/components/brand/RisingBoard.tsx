import type { Affiliate } from "./LeaderBoardWorkspace";
import bgRising from "@assets/1fe1f0ff-e856-4e9a-9a63-80696e4549d0_1789517422806.png";
import cMedal1 from "@assets/Asset_3@4x-8_1778887779024.png";
import cMedal2 from "@assets/Asset_2@4x-8_1778887779024.png";
import cMedal3 from "@assets/Asset_1@4x-8_1778887779024.png";

export function RisingBoard({ rows, month }: { rows: Affiliate[]; month: string }) {
  const top3 = rows.slice(0, 3);
  const leftRest = rows.slice(3, 7);
  const rightRest = rows.slice(7, 10);

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

      {/* Top 3 Podium */}
      <div
        className="absolute grid"
        style={{
          top: "23%",
          left: "7%",
          right: "7%",
          height: "26%",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          columnGap: "2.4cqw",
        }}
      >
        {top3.map((r, i) => (
          <PodiumCard key={r.id || i} r={r} rank={i + 1} />
        ))}
      </div>

      {/* Ranks 4-10 */}
      <div
        className="absolute grid"
        style={{
          top: "52%",
          left: "7%",
          right: "7%",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          columnGap: "2.4cqw",
        }}
      >
        <div className="flex flex-col" style={{ gap: "0.7cqw" }}>
          {leftRest.map((r, i) => (
            <RisingRow key={r.id || i} r={r} rank={i + 4} />
          ))}
        </div>
        <div className="flex flex-col" style={{ gap: "0.7cqw" }}>
          {rightRest.map((r, i) => (
            <RisingRow key={r.id || i} r={r} rank={i + 8} />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="absolute font-['Poppins'] font-semibold text-white/70 tracking-wide text-center"
        style={{
          bottom: "9%",
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

function PodiumCard({ r, rank }: { r: Affiliate; rank: number }) {
  const medal = [cMedal1, cMedal2, cMedal3][rank - 1];
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{
         background: "rgba(5, 18, 38, 0.9)",
         padding: "1.2cqw 1cqw",
         borderRadius: "1cqw",
         border: "1px solid rgba(150, 200, 230, 0.12)",
      }}
    >
      <div className="shrink-0 flex items-center justify-center mb-[0.6cqw]" style={{ height: "5cqw" }}>
         {medal && <img src={medal} alt="" className="max-w-full max-h-full object-contain filter drop-shadow-md" />}
      </div>
      <div
         className="truncate font-bold text-white font-['Poppins'] text-center mb-[0.4cqw]"
         style={{
            fontSize: "2.1cqw",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            width: "100%",
            lineHeight: 1.2,
         }}
      >
        {r?.name || "—"}
      </div>
      <div className="flex flex-col items-center shrink-0 font-['Poppins']">
        <div
          className="font-bold"
          style={{
            fontSize: "2cqw",
            color: "#00B8D9",
            lineHeight: 1.1,
          }}
        >
          {r?.mrr || "$0"}
        </div>
        <div
          className="font-semibold"
          style={{
            fontSize: "1.1cqw",
            color: "#A9BDCF",
            letterSpacing: "0.05em",
            lineHeight: 1.1,
          }}
        >
          NEW MRR
        </div>
      </div>
    </div>
  );
}

function RisingRow({ r, rank }: { r: Affiliate; rank: number }) {
  return (
    <div
      className="flex items-center w-full"
      style={{
         gap: "1.5cqw",
         background: "rgba(5, 18, 38, 0.9)",
         padding: "0.3cqw 2cqw 0.3cqw 1.3cqw",
         height: "4.2cqw",
         flexShrink: 0,
         borderRadius: "1cqw",
         border: "1px solid rgba(150, 200, 230, 0.12)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: "3cqw", height: "3cqw" }}
      >
          <div
            className="font-['Bebas_Neue'] text-center"
            style={{
              fontSize: "2.7cqw",
              color: "#00B8D9",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {rank}
          </div>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between font-['Poppins']" style={{ gap: "1.2cqw" }}>
        <div
          className="truncate font-bold text-white"
          style={{
             fontSize: "2cqw",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {r?.name || "—"}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div
            className="font-bold"
            style={{
              fontSize: "1.65cqw",
              color: "#00B8D9",
              lineHeight: 1.1,
            }}
          >
            {r?.mrr || "$0"}
          </div>
          <div
            className="font-semibold"
            style={{
              fontSize: "1.1cqw",
              color: "#A9BDCF",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            NEW MRR
          </div>
        </div>
      </div>
    </div>
  );
}
