import { useEffect, useMemo, useRef, useState } from "react";
import {
  Filter, MessagesSquare, DollarSign, Trophy, RefreshCw,
  Plus, X, Pencil, RotateCcw, Check, Download, Sparkles,
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants

type StageId = "capture" | "nurture" | "close" | "evangelize" | "reactivate";

interface Stage {
  id: StageId;
  title: string;
  tagline: string;
  description: string;
  items: string[];
}

const STORAGE_KEY = "brandengine.growthFlywheel.v1";

const STAGE_THEME: Record<StageId, {
  color: string;        // primary hex
  rgb: string;          // "r,g,b" for rgba
  Icon: typeof Filter;
  stageNum: string;
  badge: string;        // STAGE label
}> = {
  capture: {
    color: "#22C55E",       // green
    rgb: "34,197,94",
    Icon: Filter,
    stageNum: "01",
    badge: "STAGE 01",
  },
  nurture: {
    color: "#F59E0B",       // amber/orange
    rgb: "245,158,11",
    Icon: MessagesSquare,
    stageNum: "02",
    badge: "STAGE 02",
  },
  close: {
    color: "#3B82F6",       // blue
    rgb: "59,130,246",
    Icon: DollarSign,
    stageNum: "03",
    badge: "STAGE 03",
  },
  evangelize: {
    color: "#06B6D4",       // teal / cyan
    rgb: "6,182,212",
    Icon: Trophy,
    stageNum: "04",
    badge: "STAGE 04",
  },
  reactivate: {
    color: "#7C5CFF",       // indigo-purple for card UI (SVG center uses dark slate)
    rgb: "124,92,255",
    Icon: RefreshCw,
    stageNum: "05",
    badge: "STAGE 05 · THE LOOP",
  },
};

const DEFAULT_STAGES: Stage[] = [
  {
    id: "capture",
    title: "Capture",
    tagline: "Consistently capture new leads",
    description: "Pull strangers in from every channel and route them straight into the CRM where the rest of the flywheel can take over.",
    items: [
      "CRM",
      "Forms, Surveys & Quizzes",
      "Websites, Funnels & Landing Pages",
      "Webinar Funnels",
      "Chat Widget / Conversation AI",
      "Call Tracking",
      "Inbound SMS",
      "Social Planner",
      "Social DM",
      "Missed Call Text-Back",
      "Voice AI",
      "LeadConnector App (AI Biz Card Scanner)",
      "QR Codes",
      "Prospecting Tool",
      "Desktop Phone Integration",
      "Ad Manager (Google / FB / Insta Ads)",
    ],
  },
  {
    id: "nurture",
    title: "Nurture",
    tagline: "Engage and book appointments — fast",
    description: "Immediately engage and nurture leads into conversations and booked appointments so no opportunity goes cold.",
    items: [
      "Workflows / Automation Builder (Fast 5)",
      "Calendars",
      "AI Conversational Bot",
      "CRM Pipeline Stages",
      "Appointment Reminders",
      "Ringless Voicemail",
      "Mobile App (video messages)",
      "Automated Outbound Call Connect",
    ],
  },
  {
    id: "close",
    title: "Close",
    tagline: "Frictionless from quote to paid",
    description: "Make it effortless for customers to pay you — every payment surface you'd ever need, in one place.",
    items: [
      "Lead Scoring",
      "Estimates & Proposals",
      "Invoicing",
      "Payment Integrations",
      "Paid Calendars",
      "Order Forms / Upsells / Downsells",
      "Membership Offers / Courses (paid content access)",
      "One-click Upsell Funnels",
      "E-commerce Sites",
      "Text-2-Pay",
      "Tap-2-Pay",
      "Gift Cards (coming soon)",
    ],
  },
  {
    id: "evangelize",
    title: "Evangelize",
    tagline: "Turn customers into a referral engine",
    description: "Convert sales into reviews, referrals and recommendations so every closed deal seeds the next one.",
    items: [
      "Reputation Management",
      "Automated Review Requests",
      "Affiliate Manager (referral tracking)",
      "Website Review Widget",
      "Video Review Capture (coming soon)",
      "Video Review Widget (coming soon)",
      "Workflow Automations for Recommendation Requests",
      "AI Review Reply",
      "Social Planner Auto-Review Posts",
      "Communities",
      "Loyalty",
    ],
  },
  {
    id: "reactivate",
    title: "Reactivate",
    tagline: "Restart the wheel with the database you already own",
    description: "Re-engage past leads and customers with stories, offers, promotions, and updates — turning the flywheel without buying new traffic.",
    items: [
      "Campaigns — Email / SMS / WhatsApp Broadcasts",
      "Smart Lists / Segmentation",
      "Reactivation Workflows (Auto Birthday / Seasonal Offers)",
      "Database Reactivation Templates",
      "Newsletter Automation",
      "Content AI",
      "Loyalty (coming soon)",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Storage

function loadStages(): Stage[] {
  if (typeof window === "undefined") return DEFAULT_STAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STAGES;
    const parsed = JSON.parse(raw) as { stages?: Stage[] } | Stage[];
    const arr = Array.isArray(parsed) ? parsed : parsed.stages;
    if (!arr || !Array.isArray(arr)) return DEFAULT_STAGES;
    // Merge with defaults to ensure all 5 stages always exist in the right order.
    return DEFAULT_STAGES.map((d) => {
      const found = arr.find((s) => s.id === d.id);
      return found ? { ...d, ...found, id: d.id } : d;
    });
  } catch {
    return DEFAULT_STAGES;
  }
}

function saveStages(stages: Stage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stages, savedAt: Date.now() }));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Main workspace

export function GrowthFlywheelWorkspace() {
  const [stages, setStages] = useState<Stage[]>(() => loadStages());
  const [hoveredStage, setHoveredStage] = useState<StageId | null>(null);
  const [activeStage, setActiveStage] = useState<StageId | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { saveStages(stages); }, [stages]);

  const totalItems = useMemo(() => stages.reduce((s, x) => s + x.items.length, 0), [stages]);

  const updateStage = (id: StageId, patch: Partial<Stage>) => {
    setStages((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addItem = (id: StageId, value: string) => {
    if (!value.trim()) return;
    setStages((arr) => arr.map((s) => (s.id === id ? { ...s, items: [...s.items, value.trim()] } : s)));
  };

  const updateItem = (id: StageId, idx: number, value: string) => {
    setStages((arr) => arr.map((s) => {
      if (s.id !== id) return s;
      const items = [...s.items];
      const v = value.trim();
      if (!v) {
        items.splice(idx, 1);
      } else {
        items[idx] = v;
      }
      return { ...s, items };
    }));
  };

  const removeItem = (id: StageId, idx: number) => {
    setStages((arr) => arr.map((s) => {
      if (s.id !== id) return s;
      const items = [...s.items];
      items.splice(idx, 1);
      return { ...s, items };
    }));
  };

  const resetAll = () => {
    if (!confirm("Reset the flywheel back to the default HighLevel features? Your edits will be lost.")) return;
    setStages(DEFAULT_STAGES);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ stages, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growth-flywheel-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStageClick = (id: StageId) => {
    setActiveStage(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setActiveStage(null), 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#060B16] relative">
      {/* Background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(40,150,251,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(168,85,247,0.08), transparent 60%)",
        }}
      />

      <div className="relative z-[1] max-w-[1400px] mx-auto px-[24px] md:px-[40px] py-[36px] md:py-[48px]">
        {/* Hero */}
        <div className="text-center mb-[40px]">
          <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-[20px]">
            <Sparkles className="w-[12px] h-[12px] text-[#FFC328]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[2px] text-white/80">The HighLevel Growth Flywheel</span>
          </div>
          <h1 className="text-[32px] md:text-[44px] font-bold tracking-[-0.6px] leading-[1.1] text-white mb-[14px]">
            Every Feature, Mapped to <br className="hidden sm:block" />Every Stage of Growth
          </h1>
          <p className="text-[14px] md:text-[16px] text-[#94A3B8] max-w-[760px] mx-auto leading-[1.6]">
            One connected system to{" "}
            <span style={{ color: STAGE_THEME.capture.color }} className="font-semibold">capture</span>,{" "}
            <span style={{ color: STAGE_THEME.nurture.color }} className="font-semibold">nurture</span>,{" "}
            <span style={{ color: STAGE_THEME.close.color }} className="font-semibold">close</span>,{" "}
            <span style={{ color: STAGE_THEME.evangelize.color }} className="font-semibold">evangelize</span> &{" "}
            <span style={{ color: STAGE_THEME.reactivate.color }} className="font-semibold">reactivate</span>{" "}
            — turning strangers into raving fans, then doing it all over again.
          </p>

          <div className="mt-[22px] flex items-center justify-center gap-[8px] flex-wrap">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#CBD5E1] hover:text-white text-[11.5px] transition-all cursor-pointer"
              title="Reset to default features"
            >
              <RotateCcw className="w-[12px] h-[12px]" /> Reset
            </button>
            <button
              onClick={exportJson}
              className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#CBD5E1] hover:text-white text-[11.5px] transition-all cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-[12px] h-[12px]" /> Export JSON
            </button>
            <span className="text-[10.5px] text-[#475569] ml-[4px]">{totalItems} features mapped · auto-saved locally</span>
          </div>
        </div>

        {/* Flywheel visualization */}
        <div className="flex justify-center mb-[60px]">
          <Flywheel
            stages={stages}
            hoveredStage={hoveredStage}
            onHover={setHoveredStage}
            onStageClick={handleStageClick}
          />
        </div>

        {/* Editable stage cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[20px] auto-rows-fr">
          {stages.map((stage) => (
            <div
              key={stage.id}
              ref={(el) => { cardRefs.current[stage.id] = el; }}
            >
              <StageCard
                stage={stage}
                highlighted={activeStage === stage.id || hoveredStage === stage.id}
                onUpdate={(patch) => updateStage(stage.id, patch)}
                onAddItem={(v) => addItem(stage.id, v)}
                onUpdateItem={(idx, v) => updateItem(stage.id, idx, v)}
                onRemoveItem={(idx) => removeItem(stage.id, idx)}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-[40px] text-[11px] text-[#475569]">
          Click any feature to edit · use <kbd className="px-[5px] py-[1px] rounded-[4px] bg-white/[0.05] border border-white/[0.08] text-[10px]">+</kbd> to add · changes save automatically.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flywheel SVG visualization

function Flywheel({
  stages, hoveredStage, onHover, onStageClick,
}: {
  stages: Stage[];
  hoveredStage: StageId | null;
  onHover: (id: StageId | null) => void;
  onStageClick: (id: StageId) => void;
}) {
  const SIZE = 560;
  const CENTER = SIZE / 2;
  const OUTER_R = 240;       // thick donut outer
  const INNER_R = 140;       // thick donut inner
  // Text on a path renders glyphs ABOVE the baseline. For top-half segments
  // (CW arc), "above" = outward from center; for bottom-half (CCW arc),
  // "above" = inward toward center. We pick radii so both end up in the same
  // visual band hugging the outer edge: ~207–233.
  const TEXT_R_TOP = 207;    // baseline for top segments (Capture, Evangelize)
  const TEXT_R_BOT = 233;    // baseline for bottom segments (Nurture, Close)
  const ICON_R = 175;        // icon-circle centers (inner half of the donut)
  const CENTER_R = INNER_R - 10;
  const BOUNDARY_R = OUTER_R; // chevron circles sit on the outer edge

  // 4 outer stages, Reactivate is the center loop.
  const outerOrder: StageId[] = ["capture", "nurture", "close", "evangelize"];
  const sweep = 360 / outerOrder.length; // 90deg each
  // Start at -90° so Capture sits in the top-right quadrant.
  const startAngle = -90;

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  // Donut segment path
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

  // Curved arc path for textPath. CW for top half (text reads upright),
  // CCW for bottom half (so text doesn't appear upside-down).
  const textArcPath = (a1: number, a2: number, ccw: boolean) => {
    const r = ccw ? TEXT_R_BOT : TEXT_R_TOP;
    const start = polar(ccw ? a2 : a1, r);
    const end   = polar(ccw ? a1 : a2, r);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${ccw ? 0 : 1} ${end.x} ${end.y}`;
  };

  // Per-stage path config — small angular gap between segments for the clean
  // "nicely separated" look from the spec.
  const SEGMENT_GAP_DEG = 4;
  const segmentMeta = outerOrder.map((id, i) => {
    const a1 = startAngle + i * sweep + SEGMENT_GAP_DEG / 2;
    const a2 = startAngle + (i + 1) * sweep - SEGMENT_GAP_DEG / 2;
    const mid = (a1 + a2) / 2;
    // Use CCW path on segments whose midpoint sits in the lower half (y > 0)
    // i.e. midpoint angle in [0, 180) — these are nurture (mid 45) and close (mid 135).
    const ccw = mid > 0 && mid < 180;
    return { id, a1, a2, mid, ccw };
  });

  // Boundary chevrons (between segments) — 4 of them at the segment seams
  const boundaries = outerOrder.map((id, i) => {
    const angle = startAngle + (i + 1) * sweep; // end of segment i / start of next
    const next = outerOrder[(i + 1) % outerOrder.length];
    return { angle, prev: id, next };
  });

  // Chevron icon to use at each boundary, points from current → next segment
  const ChevronAt: Record<number, typeof ChevronRight> = {
    [-90 + 90]: ChevronDown,   // 0° (right) — points down toward Nurture
    [-90 + 180]: ChevronLeft,  // 90° (bottom) — points left toward Close
    [-90 + 270]: ChevronUp,    // 180° (left) — points up toward Evangelize
    [-90 + 360]: ChevronRight, // 270° / -90 (top) — points right toward Capture
  };

  return (
    <div
      className="relative flex items-center justify-center rounded-[36px]"
      style={{
        width: SIZE + 80,
        height: SIZE + 80,
        background:
          "radial-gradient(120% 120% at 50% 0%, #FFFFFF 0%, #F8FAFC 55%, #EEF2F7 100%)",
        boxShadow:
          "0 30px 60px -25px rgba(15,23,42,0.45), 0 12px 30px -12px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Subtle ambient color halo behind the wheel */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: SIZE * 0.85,
          height: SIZE * 0.85,
          background:
            "conic-gradient(from -90deg, rgba(34,197,94,0.10), rgba(245,158,11,0.10), rgba(59,130,246,0.10), rgba(6,182,212,0.10), rgba(34,197,94,0.10))",
          filter: "blur(34px)",
          opacity: 0.7,
        }}
      />

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative"
        style={{ overflow: "visible", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}
      >
        <defs>
          {outerOrder.map((id) => {
            const c = STAGE_THEME[id].color;
            return (
              <linearGradient
                key={`g-${id}`}
                id={`grad-${id}`}
                x1="0%" y1="0%" x2="0%" y2="100%"
              >
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.92} />
              </linearGradient>
            );
          })}

          {/* Curved text paths, one per segment */}
          {segmentMeta.map(({ id, a1, a2, ccw }) => (
            <path
              key={`tp-${id}`}
              id={`textpath-${id}`}
              d={textArcPath(a1, a2, ccw)}
              fill="none"
            />
          ))}

          {/* Soft drop shadow for the donut */}
          <filter id="fw-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dy="4" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.28" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle inner highlight + inset shadow on each segment for depth */}
          <filter id="fw-inset" x="-5%" y="-5%" width="110%" height="110%">
            {/* top inner highlight (very subtle) */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dy="-1.5" result="offsetBlur" />
            <feFlood floodColor="white" floodOpacity="0.18" result="hl" />
            <feComposite in="hl" in2="offsetBlur" operator="in" result="hlInset" />
            {/* bottom inner shadow */}
            <feOffset in="blur" dy="2" result="offsetBlur2" />
            <feFlood floodColor="black" floodOpacity="0.22" result="sh" />
            <feComposite in="sh" in2="offsetBlur2" operator="in" result="shInset" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="hlInset" />
              <feMergeNode in="shInset" />
            </feMerge>
          </filter>

          {/* Soft drop shadow for the center hub */}
          <filter id="fw-hub-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dy="6" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* SEGMENTS */}
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
                  filter="url(#fw-inset)"
                  opacity={hoveredStage && !isHover ? 0.7 : 1}
                  style={{
                    transition: "opacity 220ms ease, filter 220ms ease",
                    filter: isHover
                      ? `drop-shadow(0 0 24px rgba(${t.rgb}, 0.55)) url(#fw-inset)`
                      : "url(#fw-inset)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => onHover(id)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onStageClick(id)}
                />
              </g>
            );
          })}
        </g>

        {/* Curved stage labels (above segments, separate so hover-scale doesn't move text) */}
        {segmentMeta.map(({ id }) => (
          <text
            key={`label-${id}`}
            fontSize={26}
            fontWeight={800}
            fill="white"
            letterSpacing="1.6"
            style={{
              pointerEvents: "none",
              textTransform: "uppercase",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.22))",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            <textPath href={`#textpath-${id}`} startOffset="50%" textAnchor="middle">
              {(stages.find((s) => s.id === id)?.title || id).toUpperCase()}
            </textPath>
          </text>
        ))}

        {/* Stage icon badges inside each segment */}
        {segmentMeta.map(({ id, mid }) => {
          const t = STAGE_THEME[id];
          const Icon = t.Icon;
          const pos = polar(mid, ICON_R);
          return (
            <g key={`icon-${id}`} pointerEvents="none">
              <circle
                cx={pos.x} cy={pos.y} r={22}
                fill="white"
                style={{ filter: "drop-shadow(0 3px 8px rgba(15,23,42,0.22))" }}
              />
              <circle cx={pos.x} cy={pos.y} r={22} fill="none" stroke={`rgba(${t.rgb}, 0.18)`} strokeWidth={1} />
              <foreignObject x={pos.x - 13} y={pos.y - 13} width={26} height={26}>
                <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", color: t.color }}>
                  <Icon style={{ width: 18, height: 18 }} strokeWidth={2.4} />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Small flow-arrow indicators in each gap between segments */}
        {boundaries.map(({ angle, next }) => {
          const pos = polar(angle, BOUNDARY_R - 6);
          const nextTheme = STAGE_THEME[next];
          const Chevron = ChevronAt[((angle % 360) + 360) % 360] || ChevronRight;
          return (
            <g key={`chev-${angle}`} pointerEvents="none">
              <circle
                cx={pos.x} cy={pos.y} r={13}
                fill="white"
                style={{ filter: "drop-shadow(0 2px 5px rgba(15,23,42,0.20))" }}
              />
              <circle cx={pos.x} cy={pos.y} r={13} fill="none" stroke={`rgba(${nextTheme.rgb}, 0.28)`} strokeWidth={1} />
              <foreignObject x={pos.x - 9} y={pos.y - 9} width={18} height={18}>
                <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", color: nextTheme.color }}>
                  <Chevron style={{ width: 14, height: 14 }} strokeWidth={3} />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* CENTER HUB (REACTIVATE) */}
        <g>
          <circle
            cx={CENTER} cy={CENTER} r={CENTER_R}
            fill="#F8FAFC"
            filter="url(#fw-hub-shadow)"
            onMouseEnter={() => onHover("reactivate")}
            onMouseLeave={() => onHover(null)}
            onClick={() => onStageClick("reactivate")}
            style={{ cursor: "pointer" }}
          />
          {/* subtle inner ring */}
          <circle cx={CENTER} cy={CENTER} r={CENTER_R - 1} fill="none" stroke="rgba(15,23,42,0.07)" strokeWidth={1} pointerEvents="none" />
          <g pointerEvents="none">
            {/* Loop arrow icon */}
            <foreignObject x={CENTER - 18} y={CENTER - 38} width={36} height={36}>
              <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#0F172A" }}>
                <RefreshCw style={{ width: 28, height: 28 }} strokeWidth={2.4} />
              </div>
            </foreignObject>
            <text
              x={CENTER} y={CENTER + 12}
              textAnchor="middle"
              fontSize={22}
              fontWeight={800}
              fill="#0F172A"
              style={{ letterSpacing: "2px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              REACTIVATE
            </text>
            <text
              x={CENTER} y={CENTER + 34}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="rgba(15,23,42,0.45)"
              style={{ letterSpacing: "1.8px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
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
// Editable stage card

function StageCard({
  stage, highlighted, onUpdate, onAddItem, onUpdateItem, onRemoveItem,
}: {
  stage: Stage;
  highlighted: boolean;
  onUpdate: (patch: Partial<Stage>) => void;
  onAddItem: (value: string) => void;
  onUpdateItem: (idx: number, value: string) => void;
  onRemoveItem: (idx: number) => void;
}) {
  const t = STAGE_THEME[stage.id];
  const Icon = t.Icon;

  return (
    <div
      className={`relative rounded-[18px] bg-[#0A1220] border transition-all duration-300 overflow-hidden h-full flex flex-col`}
      style={{
        borderColor: highlighted ? `rgba(${t.rgb}, 0.55)` : "rgba(255,255,255,0.06)",
        boxShadow: highlighted
          ? `0 12px 40px rgba(${t.rgb}, 0.18), 0 0 0 1px rgba(${t.rgb}, 0.22)`
          : "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      {/* Color-coded top bar */}
      <div
        className="h-[5px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)`,
          boxShadow: `0 0 14px rgba(${t.rgb}, 0.45)`,
        }}
      />

      {/* Header */}
      <div className="px-[18px] pt-[16px] pb-[12px] flex items-start gap-[12px]">
        <div
          className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${t.color}, ${t.color}aa)`,
            boxShadow: `0 4px 14px rgba(${t.rgb}, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[1.6px]" style={{ color: t.color, opacity: 0.85 }}>
            {t.badge}
          </div>
          <EditableText
            value={stage.title}
            onSave={(v) => onUpdate({ title: v || stage.title })}
            className="text-[22px] font-bold tracking-[-0.4px] text-white leading-[1.2] mt-[2px]"
            singleLine
          />
        </div>
      </div>

      {/* Tagline */}
      <div className="px-[18px] pb-[10px]">
        <EditableText
          value={stage.tagline}
          onSave={(v) => onUpdate({ tagline: v || stage.tagline })}
          placeholder="One-line tagline…"
          className="text-[12.5px] font-semibold text-[#E2E8F0] leading-[1.45]"
          singleLine
        />
      </div>

      {/* Description */}
      <div className="px-[18px] pb-[14px]">
        <EditableText
          value={stage.description}
          onSave={(v) => onUpdate({ description: v })}
          placeholder="Add a longer description for this stage…"
          className="text-[12px] text-[#94A3B8] leading-[1.55]"
        />
      </div>

      {/* Divider with stage color */}
      <div
        className="h-[1px] mx-[18px]"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${t.rgb}, 0.4), transparent)` }}
      />

      {/* Feature list */}
      <div className="px-[18px] py-[14px] flex-1 overflow-y-auto">
        <div className="text-[9.5px] font-bold uppercase tracking-[1.6px] mb-[10px]" style={{ color: t.color, opacity: 0.8 }}>
          Features · {stage.items.length}
        </div>
        <ul className="space-y-[2px]">
          {stage.items.map((item, idx) => (
            <FeatureRow
              key={idx}
              value={item}
              color={t.color}
              rgb={t.rgb}
              onSave={(v) => onUpdateItem(idx, v)}
              onRemove={() => onRemoveItem(idx)}
            />
          ))}
        </ul>
        <AddRow color={t.color} rgb={t.rgb} onAdd={(v) => onAddItem(v)} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature row + add row

function FeatureRow({
  value, color, rgb, onSave, onRemove,
}: {
  value: string;
  color: string;
  rgb: string;
  onSave: (v: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  return (
    <li
      className="group flex items-start gap-[8px] py-[5px] px-[6px] -mx-[6px] rounded-[8px] hover:bg-white/[0.03] transition-colors"
    >
      <span
        className="w-[6px] h-[6px] rounded-full mt-[8px] shrink-0"
        style={{
          background: color,
          boxShadow: `0 0 8px rgba(${rgb}, 0.7)`,
        }}
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="flex-1 bg-transparent outline-none text-[12.5px] text-white leading-[1.45] border-b border-dashed"
          style={{ borderColor: `rgba(${rgb}, 0.45)` }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-[12.5px] text-[#CBD5E1] leading-[1.45] hover:text-white transition-colors cursor-text"
          title="Click to edit"
        >
          {value}
        </button>
      )}
      {!editing && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#FCA5A5] hover:bg-white/[0.05] cursor-pointer shrink-0"
          title="Remove"
          aria-label="Remove feature"
        >
          <X className="w-[12px] h-[12px]" />
        </button>
      )}
    </li>
  );
}

function AddRow({ color, rgb, onAdd }: { color: string; rgb: string; onAdd: (v: string) => void }) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active && inputRef.current) inputRef.current.focus();
  }, [active]);

  const commit = () => {
    if (draft.trim()) {
      onAdd(draft.trim());
      setDraft("");
      // Stay open so users can keep adding rapidly.
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setActive(false);
    }
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="mt-[10px] w-full flex items-center justify-center gap-[6px] py-[8px] rounded-[8px] border border-dashed text-[11.5px] transition-all cursor-pointer"
        style={{
          borderColor: `rgba(${rgb}, 0.3)`,
          color: color,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb}, 0.08)`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <Plus className="w-[12px] h-[12px]" /> Add feature
      </button>
    );
  }

  return (
    <div
      className="mt-[10px] flex items-center gap-[6px] rounded-[8px] border px-[8px] py-[6px]"
      style={{
        borderColor: `rgba(${rgb}, 0.4)`,
        background: `rgba(${rgb}, 0.06)`,
      }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 8px rgba(${rgb}, 0.7)` }}
      />
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          else if (e.key === "Escape") { setDraft(""); setActive(false); }
        }}
        onBlur={() => { if (!draft.trim()) setActive(false); }}
        placeholder="New feature, then Enter…"
        className="flex-1 bg-transparent outline-none text-[12.5px] text-white placeholder:text-[#475569]"
      />
      <button
        onClick={commit}
        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center cursor-pointer"
        style={{ background: color, color: "white" }}
        title="Add"
      >
        <Check className="w-[12px] h-[12px]" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editable text (single or multi-line)

function EditableText({
  value, onSave, className, placeholder, singleLine,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  singleLine?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (editing) {
    if (singleLine) {
      return (
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className={`w-full bg-transparent outline-none border-b border-dashed border-white/30 ${className || ""}`}
          placeholder={placeholder}
        />
      );
    }
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className={`w-full bg-transparent outline-none border border-dashed border-white/20 rounded-[6px] px-[6px] py-[4px] resize-none ${className || ""}`}
        placeholder={placeholder}
        rows={3}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group inline-flex items-center gap-[6px] text-left w-full cursor-text hover:opacity-90 ${className || ""}`}
      title="Click to edit"
    >
      <span className={value ? "" : "text-[#475569]"}>{value || placeholder || "Click to add…"}</span>
      <Pencil className="w-[10px] h-[10px] opacity-0 group-hover:opacity-50 shrink-0" />
    </button>
  );
}
