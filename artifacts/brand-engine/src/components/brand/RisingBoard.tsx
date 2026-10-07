import type { CSSProperties } from "react";
import type { Affiliate } from "./LeaderBoardWorkspace";
import bgRising from "@assets/image_1789777984354.png";

const LineArrow = ({ right, className, style }: { right?: boolean; className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 100 20" preserveAspectRatio="none" fill="none" className={className} style={{ ...style, transform: right ? "scaleX(-1)" : "none" }}>
    <path d="M100 10L85 0V9H0V11H85V20L100 10Z" fill="#32E4C4" />
  </svg>
);

export function RisingBoard({ rows, month }: { rows: Affiliate[]; month: string }) {
  return (
    <>
      <img src={bgRising} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Header */}
      <div className="absolute text-center flex flex-col items-center" style={{ top: "9%", left: "10%", right: "10%" }}>
        <div
          className="font-['Bebas_Neue'] uppercase whitespace-nowrap"
          style={{
            fontSize: "8.5cqw",
            lineHeight: 0.9,
            letterSpacing: "0.02em",
            background: "linear-gradient(180deg, #5CA9FF 0%, #2062F0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0.2cqw 0.4cqw rgba(0,0,0,0.6))",
          }}
        >
          Rising Affiliate
        </div>

        <div className="flex items-center justify-center w-full" style={{ gap: "2cqw", marginTop: "1.2cqw" }}>
          <LineArrow className="w-[18cqw] h-[0.5cqw]" />
          <div
            className="font-['Bebas_Neue'] uppercase"
            style={{
              fontSize: "4cqw",
              lineHeight: 1,
              letterSpacing: "0.25em",
              color: "#32E4C4",
              textShadow: "0 0.2cqw 0.4cqw rgba(0,0,0,0.5)",
            }}
          >
            Leaderboard
          </div>
          <LineArrow right className="w-[18cqw] h-[0.5cqw]" />
        </div>

        {/* Month Ribbon */}
        <div className="relative flex items-center justify-center" style={{ marginTop: "1cqw", filter: "drop-shadow(0 0.3cqw 0.4cqw rgba(0,0,0,0.5))" }}>
          <svg viewBox="0 0 240 36" fill="none" style={{ width: "20cqw", height: "auto" }}>
            <path d="M0 0 H240 L232 18 L240 36 H0 L8 18 Z" fill="#FDE073" />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center font-['Bebas_Neue'] text-[#07152B]"
            style={{ fontSize: "1.8cqw", letterSpacing: "0.15em", paddingTop: "0.2cqw" }}
          >
            {month || "—"}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="absolute grid"
        style={{
          top: "38%",
          left: "11%",
          right: "11%",
          bottom: "15%",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "3cqw",
        }}
      >
        <div className="flex flex-col justify-between">
          {rows.slice(0, 5).map((r, i) => (
            <RisingRow key={r.id} row={r} rank={i + 1} />
          ))}
        </div>
        <div className="flex flex-col justify-between">
          {rows.slice(5, 10).map((r, i) => (
            <RisingRow key={r.id} row={r} rank={i + 6} />
          ))}
        </div>
      </div>

      {/* Bottom HighLevel Icon */}
      <img
        src={`${import.meta.env.BASE_URL}assets/logos/Lockup=Icon, Color=Full.png`}
        alt="HighLevel"
        className="absolute object-contain"
        style={{
          top: "92%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "4.5cqw",
          height: "4.5cqw"
        }}
      />
    </>
  );
}

function RisingRow({ row, rank }: { row: Affiliate; rank: number }) {
  const isLeft = rank <= 5;
  const wedgeBg = isLeft
    ? "linear-gradient(180deg, #3A89FF 0%, #1754C2 100%)"
    : "linear-gradient(180deg, #48E59B 0%, #1D9154 100%)";

  return (
    <div
      className="flex items-center overflow-hidden"
      style={{
        height: "5.5cqw",
        background: "rgba(5, 20, 45, 0.75)",
        border: "1px solid rgba(50, 228, 196, 0.2)",
        borderRadius: "0.6cqw",
      }}
    >
      <div
        className="flex items-center justify-center font-['Bebas_Neue'] text-white shrink-0"
        style={{
          width: "18%",
          height: "100%",
          background: wedgeBg,
          clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)",
          fontSize: "3.5cqw",
          lineHeight: 1,
          paddingRight: "0.5cqw",
          paddingTop: "0.2cqw",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}
      >
        {rank}
      </div>
      <div
        className="flex-1 min-w-0 font-['Bebas_Neue'] text-white truncate"
        style={{
          fontSize: "2.6cqw",
          letterSpacing: "0.04em",
          lineHeight: 1,
          paddingLeft: "1.5cqw",
          paddingRight: "1.5cqw",
          paddingTop: "0.2cqw"
        }}
      >
        {row.name || "—"}
      </div>
    </div>
  );
}
