import { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Filter,
  MessagesSquare,
  DollarSign,
  Trophy,
  RefreshCw,
  Pencil,
  X,
  Plus,
  Trash2,
  GripVertical,
  type LucideIcon,
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

// Official HighLevel brand palette: Capture Yellow, Nurture Blue, Close Green,
// Reactivate Navy. Evangelize uses an HL-friendly warm coral/orange accent
// (HL only ships 3 named bundle colors, so this complements without colliding).
const STAGE_THEME: Record<StageId, {
  color: string;
  rgb: string;
  Icon: LucideIcon;
  stageNum: string;
  badge: string;
}> = {
  capture: {
    color: "#FFC107",          // HL Capture Yellow — bolder
    rgb: "255,193,7",
    Icon: Filter,
    stageNum: "01",
    badge: "STAGE 01",
  },
  nurture: {
    color: "#1B96E0",          // HL Nurture Blue — bolder
    rgb: "27,150,224",
    Icon: MessagesSquare,
    stageNum: "02",
    badge: "STAGE 02",
  },
  close: {
    color: "#10B838",          // HL Close Green — bolder
    rgb: "16,184,56",
    Icon: DollarSign,
    stageNum: "03",
    badge: "STAGE 03",
  },
  evangelize: {
    color: "#F25C19",          // HL-styled celebration coral — bolder
    rgb: "242,92,25",
    Icon: Trophy,
    stageNum: "04",
    badge: "STAGE 04",
  },
  reactivate: {
    color: "#13235A",          // HL Navy — deeper
    rgb: "19,35,90",
    Icon: RefreshCw,
    stageNum: "05",
    badge: "STAGE 05 · THE LOOP",
  },
};

const INITIAL_STAGES: Stage[] = [
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

interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
}

const INITIAL_HERO: HeroContent = {
  eyebrow: "The HighLevel Growth Flywheel",
  title: "Every Feature, Mapped to Every Stage of Growth",
  subtitle:
    "One connected system to capture, nurture, close, evangelize & reactivate — turning strangers into raving fans, then doing it all over again.",
};

type EditTarget = StageId | "hero" | null;

// ─────────────────────────────────────────────────────────────────────────────
// Main workspace — live-editable infographic

export function GrowthFlywheelWorkspace() {
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [hero, setHero] = useState<HeroContent>(INITIAL_HERO);
  const [editing, setEditing] = useState<EditTarget>(null);

  const getStage = (id: StageId): Stage =>
    stages.find((s) => s.id === id) as Stage;

  const updateStage = (id: StageId, patch: Partial<Stage>) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const resetAll = () => {
    setStages(INITIAL_STAGES);
    setHero(INITIAL_HERO);
  };

  return (
    <div
      className="flex-1 overflow-y-auto relative"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 35%, #EFF6FF 0%, #DBEAFE 45%, #BFDBFE 80%, #93C5FD 100%)",
      }}
    >
      {/* Editor Nav Bar */}
      <EditorNav
        stages={stages}
        editing={editing}
        onSelect={setEditing}
        onReset={resetAll}
      />

      <div className="max-w-[1320px] mx-auto px-[20px] md:px-[36px] py-[36px] md:py-[52px]">
        {/* Hero */}
        <div className="text-center mb-[36px] md:mb-[44px]">
          <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-white border border-[#E2E8F0] mb-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Sparkles className="w-[12px] h-[12px] text-[#F59E0B]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[2px] text-[#475569]">
              {hero.eyebrow}
            </span>
          </div>
          <h1
            className="text-[30px] md:text-[42px] font-bold tracking-[-0.6px] leading-[1.1] text-[#0F172A] mb-[14px]"
            style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            {hero.title}
          </h1>
          <p className="text-[14px] md:text-[15.5px] text-[#475569] max-w-[820px] mx-auto leading-[1.6]">
            {hero.subtitle}
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
            <InfoCard stage={getStage("evangelize")} onEdit={() => setEditing("evangelize")} />
            <InfoCard stage={getStage("close")} onEdit={() => setEditing("close")} />
          </div>

          {/* CENTER column */}
          <div className="flex flex-col items-center gap-[20px] md:gap-[24px]">
            <Flywheel />
            <InfoCard stage={getStage("reactivate")} wide onEdit={() => setEditing("reactivate")} />
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-[20px] md:gap-[24px]">
            <InfoCard stage={getStage("capture")} onEdit={() => setEditing("capture")} />
            <InfoCard stage={getStage("nurture")} onEdit={() => setEditing("nurture")} />
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer
        target={editing}
        stages={stages}
        hero={hero}
        onClose={() => setEditing(null)}
        onUpdateStage={updateStage}
        onUpdateHero={setHero}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flywheel SVG — clean donut + external corner callouts with connector lines

function Flywheel() {
  const SIZE = 560;
  const CENTER = SIZE / 2;
  const OUTER_R = 210;
  const INNER_R = 110;
  const ICON_R = 160;
  const CENTER_R = 100;
  const BOUNDARY_R = (OUTER_R + INNER_R) / 2;
  // Cutout / badge radius — sized so the white arrow badge clips flush into
  // the puzzle notch, with short flat radial edges of segment color above
  // and below the cutout (matches the reference look).
  const BADGE_R = 26;

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

  // Puzzle-piece segment. At each boundary the segment edge is:
  //   1) a short flat radial line from outer edge inward,
  //   2) a concave half-circle cutout of radius BADGE_R wrapping the badge,
  //   3) another short flat radial line continuing inward to the inner edge.
  const segmentPath = (a1: number, a2: number) => {
    const p1Outer = polar(a1, OUTER_R);
    const p2Outer = polar(a2, OUTER_R);
    const p1Inner = polar(a1, INNER_R);
    const p2Inner = polar(a2, INNER_R);
    // Cutout endpoints on the boundary radial lines
    const p1CutOut = polar(a1, BOUNDARY_R + BADGE_R);
    const p1CutIn = polar(a1, BOUNDARY_R - BADGE_R);
    const p2CutOut = polar(a2, BOUNDARY_R + BADGE_R);
    const p2CutIn = polar(a2, BOUNDARY_R - BADGE_R);
    const large = a2 - a1 > 180 ? 1 : 0;
    return [
      `M ${p1Outer.x} ${p1Outer.y}`,
      // Outer arc clockwise from a1 to a2
      `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${p2Outer.x} ${p2Outer.y}`,
      // Flat radial edge inward to where cutout begins on the outer side
      `L ${p2CutOut.x} ${p2CutOut.y}`,
      // Concave cutout wrapping around badge at a2
      `A ${BADGE_R} ${BADGE_R} 0 0 0 ${p2CutIn.x} ${p2CutIn.y}`,
      // Flat radial edge continuing inward to inner ring
      `L ${p2Inner.x} ${p2Inner.y}`,
      // Inner arc counter-clockwise back from a2 to a1
      `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${p1Inner.x} ${p1Inner.y}`,
      // Flat radial edge outward to where cutout begins on the inner side
      `L ${p1CutIn.x} ${p1CutIn.y}`,
      // Concave cutout wrapping around badge at a1
      `A ${BADGE_R} ${BADGE_R} 0 0 0 ${p1CutOut.x} ${p1CutOut.y}`,
      // Flat radial edge continuing outward to outer ring
      `L ${p1Outer.x} ${p1Outer.y}`,
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

        {/* Donut segments — solid HL brand fills, no hover states */}
        <g filter="url(#fw-shadow)">
          {segmentMeta.map(({ id, a1, a2 }) => {
            const t = STAGE_THEME[id];
            return (
              <path
                key={id}
                d={segmentPath(a1, a2)}
                fill={t.color}
              />
            );
          })}
        </g>

        {/* Clockwise flow arrows — white badges that nest perfectly into the
            puzzle cutouts at each segment boundary. */}
        {boundaries.map(({ angle, next }) => {
          const pos = polar(angle, BOUNDARY_R);
          const nextTheme = STAGE_THEME[next];
          const Chevron = ChevronAt[((angle % 360) + 360) % 360] || ChevronRight;
          // Arrow badge clips flush into the puzzle cutout
          const R_BADGE = BADGE_R;
          const R_CHEV = R_BADGE * 0.7;
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

        {/* Curved stage names that arc along each segment, following the
            donut's curve. Top segments use a left-to-right CW arc; bottom
            segments use a reversed (CCW) arc so the letters stay upright. */}
        {segmentMeta.map(({ id, a1, a2, mid }) => {
          const R_TEXT = 172;
          const inset = 6;
          const isTop = Math.sin((mid * Math.PI) / 180) < 0;
          const start = isTop
            ? polar(a1 + inset, R_TEXT)
            : polar(a2 - inset, R_TEXT);
          const end = isTop
            ? polar(a2 - inset, R_TEXT)
            : polar(a1 + inset, R_TEXT);
          const sweepFlag = isTop ? 1 : 0;
          const arcPath = `M ${start.x} ${start.y} A ${R_TEXT} ${R_TEXT} 0 0 ${sweepFlag} ${end.x} ${end.y}`;
          return (
            <g key={`label-${id}`} pointerEvents="none">
              <path
                id={`fw-textpath-${id}`}
                d={arcPath}
                fill="none"
                stroke="none"
              />
              <text
                fontSize={20}
                fontWeight={900}
                fill="white"
                style={{
                  letterSpacing: "1.4px",
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                }}
              >
                <textPath
                  href={`#fw-textpath-${id}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {id.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Center hub: REACTIVATE — no white disc, sits directly on the
            page gradient so the donut feels like an open ring. */}
        <g>
          <g pointerEvents="none">
            <foreignObject
              x={CENTER - 16}
              y={CENTER - 40}
              width={32}
              height={32}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
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
              y={CENTER + 4}
              textAnchor="middle"
              fontSize={14}
              fontWeight={800}
              fill={STAGE_THEME.reactivate.color}
              style={{
                letterSpacing: "1.4px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              REACTIVATE
            </text>
            <text
              x={CENTER}
              y={CENTER + 18}
              textAnchor="middle"
              fontSize={7.5}
              fontWeight={700}
              fill="#475569"
              style={{
                letterSpacing: "1.6px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              STAGE 05 · THE LOOP
            </text>
          </g>
        </g>

        {/* Stage icon badges on the inner edge of the donut, straddling the
            white center hub. Rendered LAST so they sit on top of both the
            colored ring and the hub disc. */}
        {segmentMeta.map(({ id, mid }) => {
          const t = STAGE_THEME[id];
          const Icon = t.Icon;
          const pos = polar(mid, INNER_R);
          const BG_R = 22;
          const ICON_PX = 22;
          return (
            <g key={`inner-icon-${id}`} pointerEvents="none">
              {/* Solid white base so the tinted overlay reads the same
                  whether it sits over the white hub or the colored ring. */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill="white"
                style={{
                  filter: "drop-shadow(0 2px 5px rgba(15,23,42,0.18))",
                }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill={`rgba(${t.rgb}, 0.22)`}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill="none"
                stroke={`rgba(${t.rgb}, 0.7)`}
                strokeWidth={1.5}
              />
              <foreignObject
                x={pos.x - ICON_PX / 2}
                y={pos.y - ICON_PX / 2}
                width={ICON_PX}
                height={ICON_PX}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: t.color,
                  }}
                >
                  <Icon
                    style={{ width: ICON_PX, height: ICON_PX }}
                    strokeWidth={2.4}
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static info card

function InfoCard({
  stage,
  wide,
  onEdit,
}: {
  stage: Stage;
  wide?: boolean;
  onEdit?: () => void;
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
      className="relative rounded-[18px] overflow-hidden w-full group"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)",
        border: "1px solid #E2E8F0",
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -8px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.015)",
      }}
    >
      {/* Edit button (top-right, fades in on hover) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-[12px] right-[12px] z-10 w-[28px] h-[28px] rounded-full bg-white/90 backdrop-blur border border-[#E2E8F0] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          style={{
            boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
          }}
          aria-label={`Edit ${stage.title}`}
        >
          <Pencil className="w-[12px] h-[12px] text-[#475569]" strokeWidth={2.4} />
        </button>
      )}
      {/* Bold colored top accent */}
      <div
        className="h-[5px] w-full"
        style={{
          background: `linear-gradient(90deg, ${t.color} 0%, rgba(${t.rgb}, 0.7) 100%)`,
        }}
      />

      {/* Header section with subtle tinted gradient + watermark stage number */}
      <div
        className="relative px-[18px] pt-[16px] pb-[14px]"
        style={{
          background: `linear-gradient(180deg, rgba(${t.rgb}, 0.07) 0%, rgba(${t.rgb}, 0) 100%)`,
        }}
      >
        {/* Big watermark stage number */}
        <div
          aria-hidden
          className="absolute right-[14px] top-[6px] font-black leading-none select-none pointer-events-none"
          style={{
            fontSize: "52px",
            color: `rgba(${t.rgb}, 0.11)`,
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            letterSpacing: "-2.5px",
          }}
        >
          {t.stageNum}
        </div>

        <div className="flex items-start gap-[12px] relative">
          {/* Premium gradient icon badge */}
          <div
            className="w-[44px] h-[44px] shrink-0 rounded-[12px] flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${t.color} 0%, rgba(${t.rgb}, 0.82) 100%)`,
              boxShadow: `0 6px 14px -4px rgba(${t.rgb}, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          >
            <t.Icon
              className="w-[22px] h-[22px] text-white"
              strokeWidth={2.4}
            />
          </div>
          <div className="flex-1 min-w-0 pt-[2px]">
            <div
              className="text-[10px] font-bold uppercase tracking-[1.8px] mb-[3px]"
              style={{ color: t.color, opacity: 0.85 }}
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
      </div>

      {/* Tagline */}
      <div className="px-[18px] pt-[10px] pb-[12px]">
        <p className="text-[12.5px] text-[#475569] leading-[1.55]">
          {stage.tagline}
        </p>
      </div>

      {/* Subtle gradient divider */}
      <div className="px-[18px]">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #E2E8F0 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Bullet list with chevron pills */}
      <div className="px-[18px] pt-[12px] pb-[16px]">
        <div
          className={
            wide
              ? "grid grid-cols-1 sm:grid-cols-2 gap-x-[20px] gap-y-[8px]"
              : "flex flex-col gap-[8px]"
          }
        >
          {cols.flat().map((item, idx) => (
            <div
              key={`${stage.id}-${idx}`}
              className="flex items-start gap-[10px] text-[12.5px] text-[#1E293B] leading-[1.45]"
            >
              <div
                className="w-[16px] h-[16px] rounded-full flex items-center justify-center mt-[1.5px] shrink-0"
                style={{ background: `rgba(${t.rgb}, 0.14)` }}
              >
                <ChevronRight
                  className="w-[10px] h-[10px]"
                  strokeWidth={3}
                  style={{ color: t.color }}
                />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor Nav Bar — top bar with chips for hero + 5 stages

function EditorNav({
  stages,
  editing,
  onSelect,
  onReset,
}: {
  stages: Stage[];
  editing: EditTarget;
  onSelect: (t: EditTarget) => void;
  onReset: () => void;
}) {
  return (
    <div
      className="sticky top-0 z-30 backdrop-blur-md border-b"
      style={{
        background: "rgba(255,255,255,0.82)",
        borderColor: "rgba(15,23,42,0.08)",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-[20px] md:px-[36px] py-[10px] flex items-center gap-[10px] flex-wrap">
        <div className="flex items-center gap-[6px] mr-[6px]">
          <Pencil className="w-[13px] h-[13px] text-[#475569]" strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#475569]">
            Live Editor
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect("hero")}
          className="px-[12px] py-[6px] rounded-full text-[12px] font-semibold border transition-colors"
          style={{
            background: editing === "hero" ? "#0F172A" : "#FFFFFF",
            color: editing === "hero" ? "#FFFFFF" : "#334155",
            borderColor: editing === "hero" ? "#0F172A" : "#E2E8F0",
          }}
        >
          Hero
        </button>

        {stages.map((s) => {
          const t = STAGE_THEME[s.id];
          const active = editing === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className="px-[12px] py-[6px] rounded-full text-[12px] font-semibold border transition-colors flex items-center gap-[7px]"
              style={{
                background: active ? t.color : "#FFFFFF",
                color: active ? "#FFFFFF" : "#334155",
                borderColor: active ? t.color : "#E2E8F0",
              }}
            >
              <span
                className="w-[8px] h-[8px] rounded-full"
                style={{ background: active ? "#FFFFFF" : t.color }}
              />
              {s.title}
            </button>
          );
        })}

        <div className="ml-auto">
          <button
            type="button"
            onClick={onReset}
            className="px-[10px] py-[6px] rounded-md text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Drawer — slides in from the right

function EditDrawer({
  target,
  stages,
  hero,
  onClose,
  onUpdateStage,
  onUpdateHero,
}: {
  target: EditTarget;
  stages: Stage[];
  hero: HeroContent;
  onClose: () => void;
  onUpdateStage: (id: StageId, patch: Partial<Stage>) => void;
  onUpdateHero: (h: HeroContent) => void;
}) {
  const open = target !== null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[460px] z-50 border-l shadow-2xl transition-transform duration-300 flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          borderColor: "rgba(15,23,42,0.10)",
          boxShadow: "-20px 0 60px -20px rgba(15,23,42,0.25)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {open && target === "hero" && (
          <HeroEditor hero={hero} onUpdate={onUpdateHero} onClose={onClose} />
        )}
        {open && target !== "hero" && target !== null && (
          <StageEditor
            stage={stages.find((s) => s.id === target) as Stage}
            onUpdate={(patch) => onUpdateStage(target, patch)}
            onClose={onClose}
          />
        )}
      </div>
    </>
  );
}

// Field primitives ──────────────────────────────────────────────────────────
function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-[8px]">
      <label className="block text-[11px] font-bold uppercase tracking-[1.4px] text-[#475569]">
        {children}
      </label>
      {hint && (
        <span className="text-[10.5px] font-medium text-[#94A3B8]">
          {hint}
        </span>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accent?: { color: string; rgb: string };
}) {
  const accentStyle = accent
    ? ({
        ["--accent" as never]: accent.color,
        ["--accent-rgb" as never]: accent.rgb,
      } as React.CSSProperties)
    : undefined;
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={accentStyle}
      className="w-full px-[14px] py-[11px] rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] outline-none transition shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:border-[var(--accent,#3B82F6)] focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb,59_130_246)/0.18)]"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  accent?: { color: string; rgb: string };
}) {
  const accentStyle = accent
    ? ({
        ["--accent" as never]: accent.color,
        ["--accent-rgb" as never]: accent.rgb,
      } as React.CSSProperties)
    : undefined;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={accentStyle}
      className="w-full px-[14px] py-[11px] rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] outline-none transition resize-y leading-[1.5] shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:border-[var(--accent,#3B82F6)] focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb,59_130_246)/0.18)]"
    />
  );
}

// Drawer header — premium gradient with watermark stage number ──────────────
function DrawerHeader({
  Icon,
  iconBg,
  iconShadow,
  eyebrow,
  eyebrowColor,
  title,
  watermark,
  bgGradient,
  onClose,
}: {
  Icon: LucideIcon;
  iconBg: string;
  iconShadow: string;
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  watermark?: string;
  bgGradient: string;
  onClose: () => void;
}) {
  return (
    <div
      className="relative px-[24px] pt-[22px] pb-[20px] border-b overflow-hidden"
      style={{
        background: bgGradient,
        borderColor: "rgba(15,23,42,0.08)",
      }}
    >
      {/* Watermark stage number */}
      {watermark && (
        <div
          aria-hidden
          className="absolute -right-[6px] -top-[8px] font-black leading-none select-none pointer-events-none"
          style={{
            fontSize: "120px",
            color: "rgba(15,23,42,0.04)",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            letterSpacing: "-6px",
          }}
        >
          {watermark}
        </div>
      )}

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[14px] right-[14px] w-[32px] h-[32px] rounded-full bg-white/70 hover:bg-white border border-[#E2E8F0] flex items-center justify-center text-[#475569] transition shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
        aria-label="Close editor"
      >
        <X className="w-[15px] h-[15px]" />
      </button>

      <div className="flex items-center gap-[14px] relative">
        <div
          className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0"
          style={{
            background: iconBg,
            boxShadow: `${iconShadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          <Icon className="w-[26px] h-[26px] text-white" strokeWidth={2.3} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10.5px] font-bold uppercase tracking-[1.8px] mb-[3px]"
            style={{ color: eyebrowColor }}
          >
            {eyebrow}
          </div>
          <div
            className="text-[22px] font-bold tracking-[-0.4px] text-[#0F172A] leading-[1.1]"
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

// Drawer footer ─────────────────────────────────────────────────────────────
function DrawerFooter({
  onClose,
  ctaColor,
  ctaRgb,
}: {
  onClose: () => void;
  ctaColor: string;
  ctaRgb: string;
}) {
  return (
    <div
      className="px-[24px] py-[14px] border-t flex items-center justify-between"
      style={{
        borderColor: "rgba(15,23,42,0.08)",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-[6px] text-[11px] text-[#64748B]">
        <span
          className="w-[6px] h-[6px] rounded-full animate-pulse"
          style={{ background: "#10B981" }}
        />
        Live preview enabled
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-[18px] py-[9px] rounded-[10px] text-white text-[13px] font-bold transition hover:brightness-110"
        style={{
          background: `linear-gradient(135deg, ${ctaColor} 0%, rgba(${ctaRgb}, 0.85) 100%)`,
          boxShadow: `0 4px 12px -2px rgba(${ctaRgb}, 0.45)`,
        }}
      >
        Done
      </button>
    </div>
  );
}

// Stage editor ──────────────────────────────────────────────────────────────
function StageEditor({
  stage,
  onUpdate,
  onClose,
}: {
  stage: Stage;
  onUpdate: (patch: Partial<Stage>) => void;
  onClose: () => void;
}) {
  const t = STAGE_THEME[stage.id];
  const accent = { color: t.color, rgb: t.rgb.replace(/,/g, " ") };

  const updateItem = (idx: number, value: string) => {
    const next = [...stage.items];
    next[idx] = value;
    onUpdate({ items: next });
  };
  const addItem = () => onUpdate({ items: [...stage.items, "New feature"] });
  const removeItem = (idx: number) =>
    onUpdate({ items: stage.items.filter((_, i) => i !== idx) });
  const moveItem = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= stage.items.length) return;
    const next = [...stage.items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onUpdate({ items: next });
  };

  return (
    <>
      <DrawerHeader
        Icon={t.Icon}
        iconBg={`linear-gradient(135deg, ${t.color} 0%, rgba(${t.rgb}, 0.82) 100%)`}
        iconShadow={`0 8px 18px -4px rgba(${t.rgb}, 0.55)`}
        eyebrow={`Editing · ${t.badge}`}
        eyebrowColor={t.color}
        title={stage.title || "Untitled stage"}
        watermark={t.stageNum}
        bgGradient={`linear-gradient(180deg, rgba(${t.rgb}, 0.12) 0%, rgba(${t.rgb}, 0.02) 100%)`}
        onClose={onClose}
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-[24px] py-[22px] space-y-[22px]">
        {/* Title field */}
        <div>
          <FieldLabel hint={`${stage.title.length} chars`}>
            Stage title
          </FieldLabel>
          <TextInput
            value={stage.title}
            onChange={(v) => onUpdate({ title: v })}
            placeholder="e.g. Capture"
            accent={accent}
          />
        </div>

        {/* Tagline field */}
        <div>
          <FieldLabel hint={`${stage.tagline.length} chars`}>
            Tagline
          </FieldLabel>
          <TextArea
            value={stage.tagline}
            rows={3}
            onChange={(v) => onUpdate({ tagline: v })}
            placeholder="One-sentence summary of this stage"
            accent={accent}
          />
        </div>

        {/* Bullet items section */}
        <div>
          <div className="flex items-center justify-between mb-[10px]">
            <div className="flex items-center gap-[8px]">
              <label className="block text-[11px] font-bold uppercase tracking-[1.4px] text-[#475569]">
                Feature bullets
              </label>
              <span
                className="px-[7px] py-[1px] rounded-full text-[10px] font-bold"
                style={{
                  background: `rgba(${t.rgb}, 0.14)`,
                  color: t.color,
                }}
              >
                {stage.items.length}
              </span>
            </div>
          </div>

          <div className="space-y-[8px]">
            {stage.items.map((item, idx) => (
              <ItemRow
                key={idx}
                idx={idx}
                value={item}
                accent={accent}
                themeColor={t.color}
                themeRgb={t.rgb}
                isFirst={idx === 0}
                isLast={idx === stage.items.length - 1}
                onChange={(v) => updateItem(idx, v)}
                onMoveUp={() => moveItem(idx, -1)}
                onMoveDown={() => moveItem(idx, 1)}
                onRemove={() => removeItem(idx)}
              />
            ))}

            {stage.items.length === 0 && (
              <div className="px-[14px] py-[20px] rounded-[10px] border-2 border-dashed border-[#E2E8F0] bg-white text-center">
                <div className="text-[12.5px] text-[#94A3B8]">
                  No bullets yet — add one below to get started.
                </div>
              </div>
            )}

            {/* Add item button */}
            <button
              type="button"
              onClick={addItem}
              className="w-full mt-[4px] px-[14px] py-[12px] rounded-[10px] border-2 border-dashed flex items-center justify-center gap-[6px] text-[12.5px] font-semibold transition hover:bg-white"
              style={{
                borderColor: `rgba(${t.rgb}, 0.35)`,
                color: t.color,
                background: `rgba(${t.rgb}, 0.04)`,
              }}
            >
              <Plus className="w-[14px] h-[14px]" strokeWidth={2.6} />
              Add new bullet
            </button>
          </div>
        </div>
      </div>

      <DrawerFooter onClose={onClose} ctaColor={t.color} ctaRgb={t.rgb} />
    </>
  );
}

// Numbered, polished item row ───────────────────────────────────────────────
function ItemRow({
  idx,
  value,
  accent,
  themeColor,
  themeRgb,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  idx: number;
  value: string;
  accent: { color: string; rgb: string };
  themeColor: string;
  themeRgb: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (v: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="group relative flex items-stretch rounded-[10px] border bg-white overflow-hidden transition shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.06)]"
      style={{ borderColor: "#E2E8F0" }}
    >
      {/* Colored left accent bar */}
      <div
        className="w-[3px] shrink-0"
        style={{ background: themeColor }}
      />

      {/* Number badge */}
      <div className="flex items-center justify-center pl-[10px] pr-[8px]">
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10.5px] font-bold"
          style={{
            background: `rgba(${themeRgb}, 0.12)`,
            color: themeColor,
          }}
        >
          {idx + 1}
        </div>
      </div>

      {/* Text input */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        style={{
          ["--accent" as never]: accent.color,
          ["--accent-rgb" as never]: accent.rgb,
        } as React.CSSProperties}
        className="flex-1 min-w-0 px-[6px] py-[10px] bg-transparent text-[13px] text-[#0F172A] outline-none resize-none leading-[1.45] focus:bg-[rgb(var(--accent-rgb)/0.05)]"
      />

      {/* Action cluster */}
      <div className="flex items-center gap-[1px] pr-[6px]">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="w-[26px] h-[26px] rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center transition"
          aria-label="Move up"
        >
          <ChevronUp className="w-[14px] h-[14px]" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="w-[26px] h-[26px] rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center transition"
          aria-label="Move down"
        >
          <ChevronDown className="w-[14px] h-[14px]" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-[26px] h-[26px] rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] flex items-center justify-center transition"
          aria-label="Remove"
        >
          <Trash2 className="w-[13px] h-[13px]" />
        </button>
      </div>
    </div>
  );
}

// Hero editor ───────────────────────────────────────────────────────────────
function HeroEditor({
  hero,
  onUpdate,
  onClose,
}: {
  hero: HeroContent;
  onUpdate: (h: HeroContent) => void;
  onClose: () => void;
}) {
  const accent = { color: "#0F172A", rgb: "15 23 42" };
  const ctaRgb = "15,23,42";

  return (
    <>
      <DrawerHeader
        Icon={Sparkles}
        iconBg="linear-gradient(135deg, #1E293B 0%, #0F172A 100%)"
        iconShadow="0 8px 18px -4px rgba(15,23,42,0.45)"
        eyebrow="Editing · Page Header"
        eyebrowColor="#475569"
        title="Hero Section"
        bgGradient="linear-gradient(180deg, #F1F5F9 0%, #FFFFFF 100%)"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-[24px] py-[22px] space-y-[22px]">
        <div>
          <FieldLabel hint="Small pill above title">Eyebrow</FieldLabel>
          <TextInput
            value={hero.eyebrow}
            onChange={(v) => onUpdate({ ...hero, eyebrow: v })}
            placeholder="The HighLevel Growth Flywheel"
            accent={accent}
          />
        </div>
        <div>
          <FieldLabel hint={`${hero.title.length} chars`}>Headline</FieldLabel>
          <TextArea
            value={hero.title}
            rows={2}
            onChange={(v) => onUpdate({ ...hero, title: v })}
            placeholder="Main page title"
            accent={accent}
          />
        </div>
        <div>
          <FieldLabel hint={`${hero.subtitle.length} chars`}>
            Sub-headline
          </FieldLabel>
          <TextArea
            value={hero.subtitle}
            rows={5}
            onChange={(v) => onUpdate({ ...hero, subtitle: v })}
            placeholder="Supporting paragraph beneath the title"
            accent={accent}
          />
        </div>
      </div>

      <DrawerFooter onClose={onClose} ctaColor="#0F172A" ctaRgb={ctaRgb} />
    </>
  );
}
