import { useState, useRef, useCallback, useEffect } from "react";
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
  Plus,
  Trash2,
  Download,
  Loader2,
  Edit3,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import { addExport, createThumbnail } from "./exportStore";

const BASE = import.meta.env.BASE_URL;

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
// Main workspace — fixed-size slide with left sidebar editor + export

const SLIDE_W = 1280;
const SLIDE_H = 960;

export function GrowthFlywheelWorkspace() {
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [hero, setHero] = useState<HeroContent>(INITIAL_HERO);
  const [openSection, setOpenSection] = useState<EditTarget>("hero");
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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

  // Auto-scale the slide to fit the available preview area
  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;
    const compute = () => {
      const padding = 40;
      const w = container.clientWidth - padding;
      const h = container.clientHeight - padding;
      const s = Math.min(w / SLIDE_W, h / SLIDE_H, 1);
      setScale(s > 0 ? s : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const el = previewRef.current;
      const w = SLIDE_W;
      const h = SLIDE_H;
      const DPI = 200;
      // Landscape page at 11x8.5
      const pageW = 11;
      const pageH = (h / w) * pageW;
      const pxW = pageW * DPI;
      const pixelRatio = pxW / w;
      const dataUrl = await toPng(el, {
        width: w,
        height: h,
        pixelRatio,
        cacheBust: true,
        skipAutoScale: true,
        style: {
          transform: "none",
          borderRadius: "0",
        },
      });
      const safeName = (hero.title || "Growth_Flywheel")
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "_");
      const d = new Date();
      const dp = `${d.getMonth() + 1}_${d.getDate()}_${String(d.getFullYear()).slice(-2)}`;
      const fname = `${safeName}_${dp}`;
      if (exportFormat === "pdf") {
        const resp = await fetch(`${BASE}api/convert-cmyk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: dataUrl,
            filename: `${fname}.pdf`,
            pageWidth: pageW,
            pageHeight: pageH,
          }),
        });
        if (!resp.ok)
          throw new Error(`CMYK conversion failed: ${resp.statusText}`);
        const { pdf: pdfBase64 } = await resp.json();
        const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) =>
          c.charCodeAt(0),
        );
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fname}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        createThumbnail(dataUrl).then((t) =>
          addExport({
            name: `${fname}.pdf`,
            source: "Growth Flywheel",
            format: "pdf",
            thumbnail: t,
            dimensions: `${pageW}×${pageH.toFixed(1)}in (CMYK)`,
          }),
        );
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fname}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        createThumbnail(dataUrl).then((t) =>
          addExport({
            name: `${fname}.png`,
            source: "Growth Flywheel",
            format: "png",
            thumbnail: t,
            dimensions: `${Math.round(pxW)}×${Math.round(h * pixelRatio)}`,
          }),
        );
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [hero.title, exportFormat]);

  const toggleSection = (target: EditTarget) =>
    setOpenSection((prev) => (prev === target ? null : target));

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* LEFT SIDEBAR EDITOR */}
      <LeftSidebar
        stages={stages}
        hero={hero}
        openSection={openSection}
        onToggleSection={toggleSection}
        onUpdateStage={updateStage}
        onUpdateHero={setHero}
        onReset={resetAll}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* RIGHT PREVIEW AREA */}
      <div
        ref={stageRef}
        className="flex-1 overflow-hidden flex items-center justify-center p-[20px] bg-[rgba(6,11,22,0.5)]"
      >
        <div
          style={{
            width: SLIDE_W * scale,
            height: SLIDE_H * scale,
            position: "relative",
          }}
        >
          <div
            ref={previewRef}
            style={{
              width: SLIDE_W,
              height: SLIDE_H,
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background:
                "radial-gradient(ellipse 90% 70% at 50% 35%, #EFF6FF 0%, #DBEAFE 45%, #BFDBFE 80%, #93C5FD 100%)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "32px 36px 28px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {/* Hero */}
            <div className="text-center" style={{ marginBottom: "20px" }}>
              <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-white border border-[#E2E8F0] mb-[14px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Sparkles className="w-[12px] h-[12px] text-[#F59E0B]" />
                <span className="text-[10.5px] font-bold uppercase tracking-[2px] text-[#475569]">
                  {hero.eyebrow}
                </span>
              </div>
              <h1
                className="text-[34px] font-bold tracking-[-0.6px] leading-[1.1] text-[#0F172A] mb-[10px]"
                style={{
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                }}
              >
                {hero.title}
              </h1>
              <p className="text-[14px] text-[#475569] max-w-[860px] mx-auto leading-[1.55]">
                {hero.subtitle}
              </p>
            </div>

            {/* 3-column infographic grid */}
            <div
              className="grid items-start"
              style={{
                gap: "20px",
                gridTemplateColumns:
                  "minmax(0, 1fr) minmax(0, 520px) minmax(0, 1fr)",
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* LEFT column */}
              <div className="flex flex-col gap-[18px]">
                <InfoCard stage={getStage("evangelize")} />
                <InfoCard stage={getStage("close")} />
              </div>

              {/* CENTER column */}
              <div className="flex flex-col items-center gap-[14px]">
                <Flywheel />
                <InfoCard stage={getStage("reactivate")} wide />
              </div>

              {/* RIGHT column */}
              <div className="flex flex-col gap-[18px]">
                <InfoCard stage={getStage("capture")} />
                <InfoCard stage={getStage("nurture")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flywheel SVG — clean donut + external corner callouts with connector lines

function Flywheel() {
  const SIZE = 460;
  const CENTER = SIZE / 2;
  const OUTER_R = 172;
  const INNER_R = 90;
  const ICON_R = 131;
  const CENTER_R = 82;
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
          const R_TEXT = 141;
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
                fontSize={16}
                fontWeight={900}
                fill="white"
                style={{
                  letterSpacing: "1.1px",
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
}: {
  stage: Stage;
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
      className="relative rounded-[16px] w-full bg-white overflow-hidden"
      style={{
        border: `1px solid rgba(${t.rgb}, 0.18)`,
        boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 18px 40px -16px rgba(${t.rgb}, 0.28), 0 0 0 1px rgba(15,23,42,0.02)`,
      }}
    >
      {/* Vertical left accent bar */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{
          background: `linear-gradient(180deg, ${t.color} 0%, rgba(${t.rgb}, 0.65) 100%)`,
        }}
      />

      {/* Soft tinted radial glow in upper-right corner */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, rgba(${t.rgb}, 0.10) 0%, transparent 55%)`,
        }}
      />

      {/* Header row */}
      <div className="relative pl-[20px] pr-[18px] pt-[16px] pb-[12px] flex items-start gap-[12px]">
        {/* Icon chip */}
        <div
          className="w-[42px] h-[42px] shrink-0 rounded-[11px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${t.color} 0%, rgba(${t.rgb}, 0.80) 100%)`,
            boxShadow: `0 6px 14px -4px rgba(${t.rgb}, 0.55), inset 0 1px 0 rgba(255,255,255,0.30)`,
          }}
        >
          <t.Icon className="w-[21px] h-[21px] text-white" strokeWidth={2.4} />
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0 pt-[1px]">
          <div className="flex items-center gap-[7px] mb-[4px]">
            <span
              className="inline-flex items-center px-[7px] py-[2px] rounded-[5px] text-[9.5px] font-bold uppercase tracking-[1.2px]"
              style={{
                color: t.color,
                background: `rgba(${t.rgb}, 0.12)`,
              }}
            >
              {t.badge}
            </span>
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

        {/* Big watermark number */}
        <div
          aria-hidden
          className="font-black leading-none select-none pointer-events-none -mt-[2px]"
          style={{
            fontSize: "44px",
            color: `rgba(${t.rgb}, 0.18)`,
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            letterSpacing: "-2.5px",
          }}
        >
          {t.stageNum}
        </div>
      </div>

      {/* Tagline */}
      <div className="pl-[20px] pr-[18px] pb-[12px]">
        <p className="text-[12.5px] text-[#475569] leading-[1.55]">
          {stage.tagline}
        </p>
      </div>

      {/* Hairline divider */}
      <div className="pl-[20px] pr-[18px]">
        <div
          className="h-px w-full"
          style={{ background: `rgba(${t.rgb}, 0.14)` }}
        />
      </div>

      {/* Bullet list */}
      <div className="pl-[20px] pr-[18px] pt-[11px] pb-[15px]">
        <div
          className={
            wide
              ? "grid grid-cols-1 sm:grid-cols-2 gap-x-[18px] gap-y-[7px]"
              : "flex flex-col gap-[7px]"
          }
        >
          {cols.flat().map((item, idx) => (
            <div
              key={`${stage.id}-${idx}`}
              className="flex items-start gap-[9px] text-[12.5px] text-[#1E293B] leading-[1.45]"
            >
              <div
                className="w-[5px] h-[5px] rounded-full mt-[7px] shrink-0"
                style={{ background: t.color }}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Field primitives ──────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Left Sidebar — collapsible accordion editor + theme/export/download

function LeftSidebar({
  stages,
  hero,
  openSection,
  onToggleSection,
  onUpdateStage,
  onUpdateHero,
  onReset,
  exportFormat,
  onExportFormatChange,
  onExport,
  isExporting,
}: {
  stages: Stage[];
  hero: HeroContent;
  openSection: EditTarget;
  onToggleSection: (t: EditTarget) => void;
  onUpdateStage: (id: StageId, patch: Partial<Stage>) => void;
  onUpdateHero: (h: HeroContent) => void;
  onReset: () => void;
  exportFormat: "pdf" | "png";
  onExportFormatChange: (f: "pdf" | "png") => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="w-[300px] shrink-0 border-r border-white/5 bg-[rgba(3,11,23,0.6)] flex flex-col h-full">
      {/* TOP — fixed */}
      <div className="p-[18px] pb-[12px] border-b border-white/5 flex flex-col gap-[12px]">
        <div>
          <h2 className="text-white text-[15px] font-semibold mb-[4px]">
            Growth Flywheel
          </h2>
          <p className="text-[11px] text-[#64748B] leading-[1.5]">
            Presentation slide — edit content and export.
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="flex-1 flex items-center gap-[6px] py-[8px] px-[10px] rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
            <Edit3 className="w-[12px] h-[12px] text-[#94A3B8]" />
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              Live editing on
            </span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#FF8A8A] hover:border-[rgba(255,77,77,0.3)] cursor-pointer transition-all"
            title="Reset to defaults"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="w-[12px] h-[12px]" />
          </button>
        </div>
      </div>

      {/* MIDDLE — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll p-[18px] flex flex-col gap-[10px]">
        <SidebarSection
          label="Hero"
          accent="#94A3B8"
          accentRgb="148,163,184"
          isOpen={openSection === "hero"}
          onToggle={() => onToggleSection("hero")}
        >
          <HeroPane hero={hero} onUpdate={onUpdateHero} />
        </SidebarSection>

        {stages.map((s) => {
          const t = STAGE_THEME[s.id];
          return (
            <SidebarSection
              key={s.id}
              label={s.title}
              eyebrow={t.badge}
              accent={t.color}
              accentRgb={t.rgb}
              isOpen={openSection === s.id}
              onToggle={() => onToggleSection(s.id)}
            >
              <StagePane
                stage={s}
                onUpdate={(patch) => onUpdateStage(s.id, patch)}
              />
            </SidebarSection>
          );
        })}
      </div>

      {/* BOTTOM — fixed */}
      <div className="p-[18px] pt-[14px] border-t border-white/5 bg-[rgba(0,0,0,0.25)] flex flex-col gap-[10px]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#94a3b880] mb-[6px]">
            Export Format
          </div>
          <div className="flex gap-[4px]">
            {(["pdf", "png"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onExportFormatChange(f)}
                className={`flex-1 py-[7px] rounded-[8px] text-[11px] font-bold border cursor-pointer transition-all uppercase ${
                  exportFormat === f
                    ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[14px] text-[13px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#2896FB] to-[#095DC3] text-white shadow-[0_4px_20px_rgba(40,150,251,0.3)] hover:shadow-[0_6px_28px_rgba(40,150,251,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none"
        >
          {isExporting ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <Download className="w-[16px] h-[16px]" />
          )}
          {isExporting ? "Exporting…" : `Download ${exportFormat.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}

// Collapsible accordion section
function SidebarSection({
  label,
  eyebrow,
  accent,
  accentRgb,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  eyebrow?: string;
  accent: string;
  accentRgb: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[10px] border overflow-hidden transition-colors"
      style={{
        borderColor: isOpen
          ? `rgba(${accentRgb}, 0.35)`
          : "rgba(255,255,255,0.06)",
        background: isOpen
          ? `rgba(${accentRgb}, 0.06)`
          : "rgba(255,255,255,0.02)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-[10px] px-[12px] cursor-pointer bg-transparent border-none outline-none"
      >
        <div className="flex items-center gap-[10px] min-w-0">
          <span
            className="w-[8px] h-[8px] rounded-full shrink-0"
            style={{ background: accent }}
          />
          <div className="min-w-0 text-left">
            {eyebrow && (
              <div
                className="text-[8.5px] font-bold uppercase tracking-[1.6px] mb-[1px] truncate"
                style={{ color: accent, opacity: 0.85 }}
              >
                {eyebrow}
              </div>
            )}
            <div className="text-[12.5px] font-semibold text-white truncate">
              {label}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-[14px] h-[14px] text-[#94A3B8] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[1600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-[12px] pb-[12px] pt-[2px]">{children}</div>
      </div>
    </div>
  );
}

// Hero editing pane (used inside SidebarSection)
function HeroPane({
  hero,
  onUpdate,
}: {
  hero: HeroContent;
  onUpdate: (h: HeroContent) => void;
}) {
  const accent = { color: "#3B82F6", rgb: "59 130 246" };
  return (
    <div className="space-y-[12px]">
      <div>
        <SidebarFieldLabel hint="Top pill">Eyebrow</SidebarFieldLabel>
        <TextInput
          value={hero.eyebrow}
          onChange={(v) => onUpdate({ ...hero, eyebrow: v })}
          placeholder="The HighLevel Growth Flywheel"
          accent={accent}
        />
      </div>
      <div>
        <SidebarFieldLabel hint={`${hero.title.length} chars`}>
          Headline
        </SidebarFieldLabel>
        <TextArea
          value={hero.title}
          rows={2}
          onChange={(v) => onUpdate({ ...hero, title: v })}
          placeholder="Main slide title"
          accent={accent}
        />
      </div>
      <div>
        <SidebarFieldLabel hint={`${hero.subtitle.length} chars`}>
          Sub-headline
        </SidebarFieldLabel>
        <TextArea
          value={hero.subtitle}
          rows={4}
          onChange={(v) => onUpdate({ ...hero, subtitle: v })}
          placeholder="Supporting paragraph"
          accent={accent}
        />
      </div>
    </div>
  );
}

// Stage editing pane (used inside SidebarSection)
function StagePane({
  stage,
  onUpdate,
}: {
  stage: Stage;
  onUpdate: (patch: Partial<Stage>) => void;
}) {
  const t = STAGE_THEME[stage.id];
  const accent = { color: t.color, rgb: t.rgb.replace(/,/g, " ") };

  const updateItem = (idx: number, value: string) => {
    const next = [...stage.items];
    next[idx] = value;
    onUpdate({ items: next });
  };
  const addItem = () =>
    onUpdate({ items: [...stage.items, "New feature"] });
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
    <div className="space-y-[12px]">
      <div>
        <SidebarFieldLabel hint={`${stage.title.length} chars`}>
          Title
        </SidebarFieldLabel>
        <TextInput
          value={stage.title}
          onChange={(v) => onUpdate({ title: v })}
          placeholder="e.g. Capture"
          accent={accent}
        />
      </div>
      <div>
        <SidebarFieldLabel hint={`${stage.tagline.length} chars`}>
          Tagline
        </SidebarFieldLabel>
        <TextArea
          value={stage.tagline}
          rows={3}
          onChange={(v) => onUpdate({ tagline: v })}
          placeholder="One-sentence summary"
          accent={accent}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-[6px]">
          <label className="block text-[10px] font-bold uppercase tracking-[1.2px] text-[#94A3B8]">
            Bullets
          </label>
          <span
            className="px-[7px] py-[1px] rounded-full text-[9.5px] font-bold"
            style={{
              background: `rgba(${t.rgb}, 0.18)`,
              color: t.color,
            }}
          >
            {stage.items.length}
          </span>
        </div>
        <div className="space-y-[6px]">
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
            <div className="px-[12px] py-[14px] rounded-[8px] border-2 border-dashed border-[rgba(255,255,255,0.10)] text-center">
              <div className="text-[11px] text-[#64748B]">
                No bullets yet — add one below.
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={addItem}
            className="w-full mt-[2px] px-[12px] py-[10px] rounded-[8px] border-2 border-dashed flex items-center justify-center gap-[6px] text-[11.5px] font-semibold transition hover:bg-white"
            style={{
              borderColor: `rgba(${t.rgb}, 0.45)`,
              color: t.color,
              background: `rgba(${t.rgb}, 0.06)`,
            }}
          >
            <Plus className="w-[12px] h-[12px]" strokeWidth={2.6} />
            Add bullet
          </button>
        </div>
      </div>
    </div>
  );
}

// Sidebar variant of FieldLabel — lighter colors for dark sidebar
function SidebarFieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-[6px]">
      <label className="block text-[10px] font-bold uppercase tracking-[1.2px] text-[#94A3B8]">
        {children}
      </label>
      {hint && (
        <span className="text-[9.5px] font-medium text-[#64748B]">{hint}</span>
      )}
    </div>
  );
}
