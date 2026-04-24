import { useState } from "react";
import {
  Filter,
  MessagesSquare,
  DollarSign,
  Trophy,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & data

type StageId = "capture" | "nurture" | "close" | "evangelize" | "reactivate";

interface Stage {
  id: StageId;
  title: string;
  tagline: string;
  items: string[];
}

const STAGE_THEME: Record<StageId, {
  color: string;
  rgb: string;
  Icon: typeof Filter;
  stageNum: string;
  badge: string;
}> = {
  capture: {
    color: "#22C55E",
    rgb: "34,197,94",
    Icon: Filter,
    stageNum: "01",
    badge: "STAGE 01",
  },
  nurture: {
    color: "#F97316",
    rgb: "249,115,22",
    Icon: MessagesSquare,
    stageNum: "02",
    badge: "STAGE 02",
  },
  close: {
    color: "#3B82F6",
    rgb: "59,130,246",
    Icon: DollarSign,
    stageNum: "03",
    badge: "STAGE 03",
  },
  evangelize: {
    color: "#FBBF24",
    rgb: "251,191,36",
    Icon: Trophy,
    stageNum: "04",
    badge: "STAGE 04",
  },
  reactivate: {
    color: "#1E3A8A",
    rgb: "30,58,138",
    Icon: RefreshCw,
    stageNum: "05",
    badge: "STAGE 05 · THE LOOP",
  },
};

const STAGES: Stage[] = [
  {
    id: "capture",
    title: "Capture",
    tagline: "Consistently capture new leads from every channel.",
    items: [
      "CRM",
      "Websites, Funnels & Landing Pages",
      "Forms, Surveys & Quizzes",
      "Chat Widget / Conversation AI",
      "Voice AI & Missed-Call Text-Back",
      "Ad Manager (Google / FB / Insta)",
    ],
  },
  {
    id: "nurture",
    title: "Nurture",
    tagline: "Turn leads into conversations & booked appointments — fast.",
    items: [
      "Workflows / Automation Builder (Fast 5)",
      "Calendars & Appointment Reminders",
      "AI Conversational Bot",
      "CRM Pipeline Stages",
      "Ringless Voicemail & Auto Call Connect",
      "Mobile App (video messaging)",
    ],
  },
  {
    id: "close",
    title: "Close",
    tagline: "Make it frictionless for customers to pay you.",
    items: [
      "Estimate & Proposals",
      "Invoicing & Payment Integrations",
      "Text-2-Pay & Tap-2-Pay",
      "Order Forms / Upsells / Downsells",
      "Paid Calendars & Memberships",
      "E-commerce Sites",
    ],
  },
  {
    id: "evangelize",
    title: "Evangelize",
    tagline: "Turn sales into reviews, referrals & recommendations.",
    items: [
      "Reputation Management",
      "Automated Review Requests",
      "AI Review Reply",
      "Affiliate Manager (referral tracking)",
      "Website Review Widget",
      "Communities & Loyalty",
    ],
  },
  {
    id: "reactivate",
    title: "Reactivate",
    tagline:
      "Re-engage past leads & customers with stories, offers & updates — restarting the flywheel.",
    items: [
      "Email / SMS / WhatsApp Campaigns",
      "Smart Lists & Segmentation",
      "Reactivation Workflows (birthday, seasonal)",
      "Database Reactivation Templates",
      "Newsletter Automation",
      "Content AI",
    ],
  },
];

const getStage = (id: StageId): Stage =>
  STAGES.find((s) => s.id === id) as Stage;

// ─────────────────────────────────────────────────────────────────────────────
// Main workspace — static infographic layout

export function GrowthFlywheelWorkspace() {
  const [hoveredStage, setHoveredStage] = useState<StageId | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1320px] mx-auto px-[20px] md:px-[36px] py-[36px] md:py-[52px]">
        {/* Hero */}
        <div className="text-center mb-[36px] md:mb-[44px]">
          <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-white border border-[#E2E8F0] mb-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Sparkles className="w-[12px] h-[12px] text-[#F59E0B]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[2px] text-[#475569]">
              The HighLevel Growth Flywheel
            </span>
          </div>
          <h1
            className="text-[30px] md:text-[42px] font-bold tracking-[-0.6px] leading-[1.1] text-[#0F172A] mb-[14px]"
            style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            Every Feature, Mapped to Every Stage of Growth
          </h1>
          <p className="text-[14px] md:text-[15.5px] text-[#475569] max-w-[820px] mx-auto leading-[1.6]">
            One connected system to{" "}
            <span style={{ color: STAGE_THEME.capture.color }} className="font-semibold">
              capture
            </span>
            ,{" "}
            <span style={{ color: STAGE_THEME.nurture.color }} className="font-semibold">
              nurture
            </span>
            ,{" "}
            <span style={{ color: STAGE_THEME.close.color }} className="font-semibold">
              close
            </span>
            ,{" "}
            <span style={{ color: STAGE_THEME.evangelize.color }} className="font-semibold">
              evangelize
            </span>{" "}
            &{" "}
            <span style={{ color: STAGE_THEME.reactivate.color }} className="font-semibold">
              reactivate
            </span>{" "}
            — turning strangers into raving fans, then doing it all over again.
          </p>
        </div>

        {/* 3-column infographic grid */}
        <div
          className="grid gap-[20px] md:gap-[24px] items-start"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 540px) minmax(0, 1fr)",
          }}
        >
          {/* LEFT column */}
          <div className="flex flex-col gap-[20px] md:gap-[24px]">
            <InfoCard
              stage={getStage("evangelize")}
              hovered={hoveredStage === "evangelize"}
              onHover={setHoveredStage}
            />
            <InfoCard
              stage={getStage("close")}
              hovered={hoveredStage === "close"}
              onHover={setHoveredStage}
            />
          </div>

          {/* CENTER column */}
          <div className="flex flex-col items-center gap-[20px] md:gap-[24px]">
            <Flywheel
              hoveredStage={hoveredStage}
              onHover={setHoveredStage}
            />
            <InfoCard
              stage={getStage("reactivate")}
              hovered={hoveredStage === "reactivate"}
              onHover={setHoveredStage}
              wide
            />
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-[20px] md:gap-[24px]">
            <InfoCard
              stage={getStage("capture")}
              hovered={hoveredStage === "capture"}
              onHover={setHoveredStage}
            />
            <InfoCard
              stage={getStage("nurture")}
              hovered={hoveredStage === "nurture"}
              onHover={setHoveredStage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flywheel SVG — clean donut + external corner callouts with connector lines

function Flywheel({
  hoveredStage,
  onHover,
}: {
  hoveredStage: StageId | null;
  onHover: (id: StageId | null) => void;
}) {
  const SIZE = 520;
  const CENTER = SIZE / 2;
  const OUTER_R = 175;
  const INNER_R = 100;
  const ICON_R = 138;
  const CENTER_R = 92;

  const outerOrder: StageId[] = ["capture", "nurture", "close", "evangelize"];
  const sweep = 360 / outerOrder.length;
  const startAngle = -90;
  const SEGMENT_GAP_DEG = 4;

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  const segmentPath = (a1: number, a2: number) => {
    const p1Outer = polar(a1, OUTER_R);
    const p2Outer = polar(a2, OUTER_R);
    const p1Inner = polar(a1, INNER_R);
    const p2Inner = polar(a2, INNER_R);
    const large = a2 - a1 > 180 ? 1 : 0;
    return [
      `M ${p1Outer.x} ${p1Outer.y}`,
      `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${p2Outer.x} ${p2Outer.y}`,
      `L ${p2Inner.x} ${p2Inner.y}`,
      `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${p1Inner.x} ${p1Inner.y}`,
      "Z",
    ].join(" ");
  };

  const segmentMeta = outerOrder.map((id, i) => {
    const a1 = startAngle + i * sweep + SEGMENT_GAP_DEG / 2;
    const a2 = startAngle + (i + 1) * sweep - SEGMENT_GAP_DEG / 2;
    const mid = (a1 + a2) / 2;
    return { id, a1, a2, mid };
  });

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          overflow: "visible",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <defs>
          {outerOrder.map((id) => {
            const c = STAGE_THEME[id].color;
            return (
              <linearGradient
                key={`g-${id}`}
                id={`grad-${id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.92} />
              </linearGradient>
            );
          })}

          {/* Soft drop shadow under the donut */}
          <filter id="fw-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dy="6" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.16" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle inset shadow for depth on each segment */}
          <filter id="fw-inset" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dy="-1.5" result="offsetBlur" />
            <feFlood floodColor="white" floodOpacity="0.18" result="hl" />
            <feComposite in="hl" in2="offsetBlur" operator="in" result="hlInset" />
            <feOffset in="blur" dy="2" result="offsetBlur2" />
            <feFlood floodColor="black" floodOpacity="0.18" result="sh" />
            <feComposite in="sh" in2="offsetBlur2" operator="in" result="shInset" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="hlInset" />
              <feMergeNode in="shInset" />
            </feMerge>
          </filter>

          {/* Soft drop shadow for the center hub */}
          <filter id="fw-hub-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dy="4" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.14" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* External corner callouts: thin connector + label */}
        {segmentMeta.map(({ id, mid }) => {
          const t = STAGE_THEME[id];
          // Anchor dot just outside the donut on the segment midline
          const dot = polar(mid, OUTER_R + 6);
          // Label position further out diagonally
          const labelPos = polar(mid, OUTER_R + 70);
          const isHover = hoveredStage === id;
          // Horizontal anchor based on quadrant
          const anchor: "start" | "end" =
            labelPos.x < CENTER ? "end" : "start";
          // Adjust label x for visual breathing room
          const labelX = labelPos.x + (anchor === "end" ? -4 : 4);
          return (
            <g
              key={`callout-${id}`}
              style={{
                opacity: hoveredStage && !isHover ? 0.5 : 1,
                transition: "opacity 220ms ease",
              }}
            >
              <line
                x1={dot.x}
                y1={dot.y}
                x2={labelPos.x}
                y2={labelPos.y}
                stroke={t.color}
                strokeWidth={1.25}
                strokeOpacity={0.55}
              />
              <circle cx={dot.x} cy={dot.y} r={3} fill={t.color} />
              <text
                x={labelX}
                y={labelPos.y - 4}
                textAnchor={anchor}
                fontSize={14}
                fontWeight={800}
                fill={t.color}
                style={{ letterSpacing: "1.4px", textTransform: "uppercase" }}
              >
                {id.toUpperCase()}
              </text>
              <text
                x={labelX}
                y={labelPos.y + 12}
                textAnchor={anchor}
                fontSize={9}
                fontWeight={700}
                fill="#94A3B8"
                style={{ letterSpacing: "1.6px" }}
              >
                STAGE {t.stageNum}
              </text>
            </g>
          );
        })}

        {/* Donut segments */}
        <g filter="url(#fw-shadow)">
          {segmentMeta.map(({ id, a1, a2 }) => {
            const isHover = hoveredStage === id;
            const t = STAGE_THEME[id];
            return (
              <g
                key={id}
                style={{
                  transform: isHover ? "scale(1.025)" : "scale(1)",
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                  transition: "transform 220ms ease",
                }}
              >
                <path
                  d={segmentPath(a1, a2)}
                  fill={`url(#grad-${id})`}
                  opacity={hoveredStage && !isHover ? 0.55 : 1}
                  style={{
                    transition: "opacity 220ms ease, filter 220ms ease",
                    filter: isHover
                      ? `drop-shadow(0 0 18px rgba(${t.rgb}, 0.45)) url(#fw-inset)`
                      : "url(#fw-inset)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => onHover(id)}
                  onMouseLeave={() => onHover(null)}
                />
              </g>
            );
          })}
        </g>

        {/* Stage icon badges inside each segment */}
        {segmentMeta.map(({ id, mid }) => {
          const t = STAGE_THEME[id];
          const Icon = t.Icon;
          const pos = polar(mid, ICON_R);
          return (
            <g key={`icon-${id}`} pointerEvents="none">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={19}
                fill="white"
                style={{ filter: "drop-shadow(0 2px 6px rgba(15,23,42,0.18))" }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={19}
                fill="none"
                stroke={`rgba(${t.rgb}, 0.18)`}
                strokeWidth={1}
              />
              <foreignObject
                x={pos.x - 12}
                y={pos.y - 12}
                width={24}
                height={24}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: t.color,
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} strokeWidth={2.4} />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Center hub: REACTIVATE */}
        <g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER_R}
            fill="white"
            filter="url(#fw-hub-shadow)"
            onMouseEnter={() => onHover("reactivate")}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER_R - 1}
            fill="none"
            stroke="rgba(15,23,42,0.06)"
            strokeWidth={1}
            pointerEvents="none"
          />
          <g pointerEvents="none">
            <foreignObject
              x={CENTER - 16}
              y={CENTER - 36}
              width={32}
              height={32}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: STAGE_THEME.reactivate.color,
                }}
              >
                <RefreshCw style={{ width: 26, height: 26 }} strokeWidth={2.4} />
              </div>
            </foreignObject>
            <text
              x={CENTER}
              y={CENTER + 10}
              textAnchor="middle"
              fontSize={18}
              fontWeight={800}
              fill="#0F172A"
              style={{
                letterSpacing: "1.8px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              REACTIVATE
            </text>
            <text
              x={CENTER}
              y={CENTER + 28}
              textAnchor="middle"
              fontSize={8.5}
              fontWeight={700}
              fill="#94A3B8"
              style={{
                letterSpacing: "1.6px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              STAGE 05 · THE LOOP
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static info card

function InfoCard({
  stage,
  hovered,
  onHover,
  wide,
}: {
  stage: Stage;
  hovered: boolean;
  onHover: (id: StageId | null) => void;
  wide?: boolean;
}) {
  const t = STAGE_THEME[stage.id];
  const Icon = t.Icon;

  // Split items into 2 columns when wide (Reactivate)
  const cols = wide
    ? [
        stage.items.slice(0, Math.ceil(stage.items.length / 2)),
        stage.items.slice(Math.ceil(stage.items.length / 2)),
      ]
    : [stage.items];

  return (
    <div
      onMouseEnter={() => onHover(stage.id)}
      onMouseLeave={() => onHover(null)}
      className="relative bg-white rounded-[14px] border overflow-hidden transition-all duration-300 w-full"
      style={{
        borderColor: hovered ? `rgba(${t.rgb}, 0.45)` : "#E2E8F0",
        boxShadow: hovered
          ? `0 12px 28px -10px rgba(${t.rgb}, 0.35), 0 4px 10px rgba(15,23,42,0.06)`
          : "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.05)",
      }}
    >
      {/* Colored top border */}
      <div
        className="h-[4px] w-full"
        style={{ backgroundColor: t.color }}
      />

      {/* Header */}
      <div className="px-[18px] pt-[16px] pb-[10px] flex items-start gap-[12px]">
        <div
          className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${t.color}, ${t.color}d9)`,
            boxShadow: `0 3px 10px rgba(${t.rgb}, 0.3)`,
          }}
        >
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-[1.6px] mb-[2px]"
            style={{ color: "#94A3B8" }}
          >
            {t.badge}
          </div>
          <div
            className="text-[20px] font-bold tracking-[-0.3px] text-[#0F172A] leading-[1.15]"
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {stage.title}
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="px-[18px] pb-[12px]">
        <p className="text-[12.5px] text-[#475569] leading-[1.5]">
          {stage.tagline}
        </p>
      </div>

      {/* Bullet list */}
      <div className="px-[18px] pb-[18px]">
        <div
          className={
            wide
              ? "grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[6px]"
              : "flex flex-col gap-[6px]"
          }
        >
          {cols.flat().map((item, idx) => (
            <div
              key={`${stage.id}-${idx}`}
              className="flex items-start gap-[8px] text-[12.5px] text-[#334155] leading-[1.45]"
            >
              <span
                className="w-[5px] h-[5px] rounded-full mt-[7px] shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
