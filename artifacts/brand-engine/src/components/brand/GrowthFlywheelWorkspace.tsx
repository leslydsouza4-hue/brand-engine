import { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const hlIcon = (name: string) =>
  `${BASE}assets/icons/Icon=${name}, Glass=Medium, Color=None (Glass).png`;

// ─────────────────────────────────────────────────────────────────────────────
// Types & data

type StageId = "capture" | "nurture" | "close" | "evangelize" | "reactivate";

interface Stage {
  id: StageId;
  title: string;
  tagline: string;
  items: string[];
}

// Official HighLevel brand palette: Capture Yellow, Nurture Blue, Close Green,
// Reactivate Navy. Evangelize uses an HL-friendly warm coral/orange accent
// (HL only ships 3 named bundle colors, so this complements without colliding).
const STAGE_THEME: Record<StageId, {
  color: string;
  rgb: string;
  iconPath: string;
  stageNum: string;
  badge: string;
}> = {
  capture: {
    color: "#FFCD2D",          // HL Capture Yellow
    rgb: "255,205,45",
    iconPath: hlIcon("Capture"),
    stageNum: "01",
    badge: "STAGE 01",
  },
  nurture: {
    color: "#2EA3F0",          // HL Nurture Blue
    rgb: "46,163,240",
    iconPath: hlIcon("Nurture"),
    stageNum: "02",
    badge: "STAGE 02",
  },
  close: {
    color: "#17D94B",          // HL Close Green
    rgb: "23,217,75",
    iconPath: hlIcon("Close"),
    stageNum: "03",
    badge: "STAGE 03",
  },
  evangelize: {
    color: "#F97316",          // HL-styled celebration coral
    rgb: "249,115,22",
    iconPath: hlIcon("Evangelize"),
    stageNum: "04",
    badge: "STAGE 04",
  },
  reactivate: {
    color: "#1B2A66",          // HL Navy
    rgb: "27,42,102",
    iconPath: hlIcon("Reactivate"),
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
    <div
      className="flex-1 overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg, #EFF6FF 0%, #E0F2FE 55%, #EFF6FF 100%)",
      }}
    >
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
  const SIZE = 560;
  const CENTER = SIZE / 2;
  const OUTER_R = 210;
  const INNER_R = 110;
  const ICON_R = 160;
  const CENTER_R = 100;
  const BOUNDARY_R = (OUTER_R + INNER_R) / 2;
  // Cutout / badge radius — equals half the ring thickness so the cutout
  // bites cleanly from inner edge to outer edge (puzzle-piece notches).
  const BADGE_R = (OUTER_R - INNER_R) / 2;

  const outerOrder: StageId[] = ["capture", "nurture", "close", "evangelize"];
  const sweep = 360 / outerOrder.length;
  const startAngle = -90;
  // Segments meet edge-to-edge — the visual "gap" comes from the puzzle-piece
  // cutouts that hold the arrow badges, not from angular spacing.
  const SEGMENT_GAP_DEG = 0;

  // Clockwise flow arrow at each gap. The boundary angle (in degrees,
  // canvas-space where 0° = right, 90° = bottom) determines which chevron
  // points cleanly along the tangent of the wheel.
  const ChevronAt: Record<number, typeof ChevronRight> = {
    0: ChevronDown,    // right side  → flow downward (Capture→Nurture)
    90: ChevronLeft,   // bottom side → flow leftward (Nurture→Close)
    180: ChevronUp,    // left side   → flow upward   (Close→Evangelize)
    270: ChevronRight, // top side    → flow rightward (Evangelize→Capture)
  };

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  // Puzzle-piece segment — at each boundary the segment edge is a concave
  // half-circle of radius BADGE_R that wraps around the arrow badge sitting
  // in the gap. Outer/inner arcs run between the boundary angles.
  const segmentPath = (a1: number, a2: number) => {
    const p1Outer = polar(a1, OUTER_R);
    const p2Outer = polar(a2, OUTER_R);
    const p1Inner = polar(a1, INNER_R);
    const p2Inner = polar(a2, INNER_R);
    const large = a2 - a1 > 180 ? 1 : 0;
    return [
      `M ${p1Outer.x} ${p1Outer.y}`,
      // Outer arc clockwise from a1 to a2
      `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${p2Outer.x} ${p2Outer.y}`,
      // Concave cutout at a2 (outer → inner, bulging into segment)
      `A ${BADGE_R} ${BADGE_R} 0 0 0 ${p2Inner.x} ${p2Inner.y}`,
      // Inner arc counter-clockwise back from a2 to a1
      `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${p1Inner.x} ${p1Inner.y}`,
      // Concave cutout at a1 (inner → outer, bulging into segment)
      `A ${BADGE_R} ${BADGE_R} 0 0 0 ${p1Outer.x} ${p1Outer.y}`,
      "Z",
    ].join(" ");
  };

  const segmentMeta = outerOrder.map((id, i) => {
    const a1 = startAngle + i * sweep + SEGMENT_GAP_DEG / 2;
    const a2 = startAngle + (i + 1) * sweep - SEGMENT_GAP_DEG / 2;
    const mid = (a1 + a2) / 2;
    return { id, a1, a2, mid };
  });

  // Boundaries between segments — where clockwise flow arrows sit.
  // Each boundary is at the seam between segment[i] (prev) and segment[i+1] (next).
  const boundaries = outerOrder.map((id, i) => {
    const angle = startAngle + (i + 1) * sweep; // 0, 90, 180, 270
    const next = outerOrder[(i + 1) % outerOrder.length];
    return { angle, prev: id, next };
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
                <stop offset="100%" stopColor={c} stopOpacity={0.86} />
              </linearGradient>
            );
          })}

          {/* Stronger soft drop shadow under the whole donut */}
          <filter id="fw-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
            <feOffset dy="10" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.28" />
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

          {/* Stronger raised-hub shadow for the center disc */}
          <filter id="fw-hub-shadow" x="-40%" y="-40%" width="180%" height="180%">
            {/* main soft drop */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b1" />
            <feOffset in="b1" dy="8" result="o1" />
            <feComponentTransfer in="o1" result="s1">
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            {/* tight contact shadow */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b2" />
            <feOffset in="b2" dy="2" result="o2" />
            <feComponentTransfer in="o2" result="s2">
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="s1" />
              <feMergeNode in="s2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Small drop shadow for the arrow badges */}
          <filter id="fw-arrow-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dy="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
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
          // Anchor dot at the outer edge of the donut on the segment midline
          const dot = polar(mid, OUTER_R + 4);
          // Label position close to the segment — stays within SVG bounds even
          // for the longest word ("EVANGELIZE").
          const labelPos = polar(mid, OUTER_R + 24);
          const isHover = hoveredStage === id;
          // Horizontal anchor based on quadrant
          const anchor: "start" | "end" =
            labelPos.x < CENTER ? "end" : "start";
          const labelX = labelPos.x + (anchor === "end" ? -2 : 2);
          return (
            <g
              key={`callout-${id}`}
              style={{
                opacity: hoveredStage && !isHover ? 0.45 : 1,
                transition: "opacity 220ms ease",
              }}
            >
              <line
                x1={dot.x}
                y1={dot.y}
                x2={labelPos.x}
                y2={labelPos.y}
                stroke={t.color}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
              <circle cx={dot.x} cy={dot.y} r={3.5} fill={t.color} />
              <text
                x={labelX}
                y={labelPos.y - 3}
                textAnchor={anchor}
                fontSize={14}
                fontWeight={900}
                fill={t.color}
                style={{ letterSpacing: "1.2px", textTransform: "uppercase" }}
              >
                {id.toUpperCase()}
              </text>
              <text
                x={labelX}
                y={labelPos.y + 12}
                textAnchor={anchor}
                fontSize={9.5}
                fontWeight={800}
                fill="#64748B"
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
                      ? `drop-shadow(0 0 26px rgba(${t.rgb}, 0.7)) url(#fw-inset)`
                      : `drop-shadow(0 0 14px rgba(${t.rgb}, 0.22)) url(#fw-inset)`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => onHover(id)}
                  onMouseLeave={() => onHover(null)}
                />
              </g>
            );
          })}
        </g>

        {/* Clockwise flow arrows — white badges that nest perfectly into the
            puzzle cutouts at each segment boundary. */}
        {boundaries.map(({ angle, next }) => {
          const pos = polar(angle, BOUNDARY_R);
          const nextTheme = STAGE_THEME[next];
          const Chevron = ChevronAt[((angle % 360) + 360) % 360] || ChevronRight;
          // Slightly smaller than the cutout so a hairline of segment color
          // shows through, giving the puzzle look definition.
          const R_BADGE = BADGE_R - 4;
          const R_CHEV = R_BADGE * 0.72;
          return (
            <g key={`arrow-${angle}`} pointerEvents="none">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={R_BADGE}
                fill="white"
                filter="url(#fw-arrow-shadow)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={R_BADGE}
                fill="none"
                stroke={`rgba(${nextTheme.rgb}, 0.45)`}
                strokeWidth={1.5}
              />
              <foreignObject
                x={pos.x - R_CHEV}
                y={pos.y - R_CHEV}
                width={R_CHEV * 2}
                height={R_CHEV * 2}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: nextTheme.color,
                  }}
                >
                  <Chevron
                    style={{ width: R_CHEV * 1.4, height: R_CHEV * 1.4 }}
                    strokeWidth={3}
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Stage icon badges inside each segment — official HL glass icons */}
        {segmentMeta.map(({ id, mid }) => {
          const t = STAGE_THEME[id];
          const pos = polar(mid, ICON_R);
          const BG_R = 32;
          const ICON_SIZE = 48;
          return (
            <g key={`icon-${id}`} pointerEvents="none">
              {/* White circular backdrop so the dark glass icon reads on
                  any segment color */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill="white"
                style={{
                  filter: "drop-shadow(0 2px 6px rgba(15,23,42,0.18))",
                }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill="none"
                stroke={`rgba(${t.rgb}, 0.35)`}
                strokeWidth={1.25}
              />
              <image
                href={t.iconPath}
                x={pos.x - ICON_SIZE / 2}
                y={pos.y - ICON_SIZE / 2}
                width={ICON_SIZE}
                height={ICON_SIZE}
                preserveAspectRatio="xMidYMid meet"
              />
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
            <image
              href={STAGE_THEME.reactivate.iconPath}
              x={CENTER - 32}
              y={CENTER - 56}
              width={64}
              height={64}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: "drop-shadow(0 3px 6px rgba(15,23,42,0.2))" }}
            />
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
        <img
          src={t.iconPath}
          alt=""
          className="w-[40px] h-[40px] shrink-0 select-none"
          style={{ filter: `drop-shadow(0 3px 8px rgba(${t.rgb}, 0.35))` }}
        />
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
