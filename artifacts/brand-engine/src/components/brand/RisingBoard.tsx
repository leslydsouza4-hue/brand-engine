import type { Affiliate } from "./LeaderBoardWorkspace";
import bgRising from "@assets/1fe1f0ff-e856-4e9a-9a63-80696e4549d0_1789515519458.png";
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

      {/* Mascot bottom left */}
      <img
        src={`${import.meta.env.BASE_URL}assets/highly/highly-waving.png`}
        alt="Highly Mascot"
        className="absolute"
        style={{
          left: "2%",
          bottom: "2%",
          height: "25%",
          objectFit: "contain",
          filter: "drop-shadow(0 1cqw 2cqw rgba(0,0,0,0.5))",
          zIndex: 10,
        }}
      />

      {/* Title */}
      <div className="absolute text-center" style={{ top: "10%", left: "5%", right: "5%" }}>
        <div
          className="font-['Poppins'] font-bold whitespace-nowrap"
          style={{
            fontSize: "2.72cqw",
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
        <div className="font-['Bebas_Neue'] text-white" style={{ fontSize: "1.6cqw", letterSpacing: "0.2em", marginTop: "0.5cqw" }}>
          {month || "—"}
        </div>
      </div>

      {/* Grid */}
      <div
        className="absolute grid"
        style={{
          top: "27%",
          left: "16%",
          right: "4%",
          bottom: "12%",
          gridTemplateColumns: "40% 50%",
          columnGap: "3%",
        }}
      >
        {/* Left Column (1-3) */}
        <div className="flex flex-col justify-center" style={{ gap: "4cqw" }}>
          {top3.map((r, i) => (
            <RisingRow key={r.id} r={r} rank={i + 1} prominent />
          ))}
        </div>
        
        {/* Right Column (4-10) */}
        <div className="flex flex-col justify-center" style={{ gap: "0.7cqw" }}>
          {rest.map((r, i) => (
            <RisingRow key={r.id} r={r} rank={i + 4} />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="absolute font-['Poppins'] font-semibold text-white/70 tracking-wide text-center"
        style={{
          bottom: "4%",
          left: "0",
          right: "0",
          fontSize: "1cqw",
        }}
      >
        Meet with your Affiliate Manager
      </div>
    </>
  );
}

function RisingRow({ r, rank, prominent = false }: { r: Affiliate; rank: number; prominent?: boolean }) {
  const isTop3 = rank <= 3;
  const medal = isTop3 ? [cMedal1, cMedal2, cMedal3][rank - 1] : null;

  return (
    <div
      className="flex items-center w-full"
      style={{
        gap: prominent ? "0.8cqw" : "1cqw",
        background: "linear-gradient(90deg, rgba(0,25,50,0.6) 0%, rgba(0,25,50,0.2) 100%)",
        padding: prominent ? "1cqw 1cqw" : "0.35cqw 1cqw",
        borderRadius: "1cqw",
        borderLeft: prominent ? "0.3cqw solid #00B8D9" : "0.2cqw solid #00B8D9",
        boxShadow: "inset 0 0 1cqw rgba(0, 184, 217, 0.1)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: prominent ? "4.5cqw" : "3.5cqw", height: prominent ? "4.5cqw" : "3.5cqw" }}
      >
        {medal ? (
          <img src={medal} alt="" className="max-w-full max-h-full object-contain filter drop-shadow-md" />
        ) : (
          <div
            className="font-['Bebas_Neue'] text-center"
            style={{
              fontSize: prominent ? "2.8cqw" : "2.2cqw",
              color: "#00B8D9",
              letterSpacing: "0.02em",
            }}
          >
            {rank}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-baseline justify-between font-['Poppins']">
        <div
          className="truncate font-bold text-white"
          style={{
            fontSize: prominent ? "1.65cqw" : "1.55cqw",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {r.name || "—"}
        </div>
        <div className="flex flex-col items-end shrink-0 ml-2">
          <div
            className="font-bold"
            style={{
              fontSize: prominent ? "1.45cqw" : "1.3cqw",
              color: "#00B8D9",
            }}
          >
            {r.mrr || "$0"}
          </div>
          <div
            className="font-semibold text-white/50"
            style={{
              fontSize: prominent ? "0.9cqw" : "0.7cqw",
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
