import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronDown,
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
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import { addExport, createThumbnail } from "./exportStore";
import { LivePreview } from "./LivePreview";

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
const ICON_BASE = `${BASE}assets/hl-icons`;

const STAGE_THEME: Record<StageId, {
  color: string;
  rgb: string;
  Icon: LucideIcon;
  iconSrc: string;
  stageNum: string;
  badge: string;
}> = {
  capture: {
    color: "#FFC107",          // HL Capture Yellow — bolder
    rgb: "255,193,7",
    Icon: Filter,
    iconSrc: `${ICON_BASE}/capture.svg`,
    stageNum: "01",
    badge: "STAGE 01",
  },
  nurture: {
    color: "#1B96E0",          // HL Nurture Blue — bolder
    rgb: "27,150,224",
    Icon: MessagesSquare,
    iconSrc: `${ICON_BASE}/nurture.svg`,
    stageNum: "02",
    badge: "STAGE 02",
  },
  close: {
    color: "#10B838",          // HL Close Green — bolder
    rgb: "16,184,56",
    Icon: DollarSign,
    iconSrc: `${ICON_BASE}/close.svg`,
    stageNum: "03",
    badge: "STAGE 03",
  },
  evangelize: {
    color: "#F25C19",          // HL-styled celebration coral — bolder
    rgb: "242,92,25",
    Icon: Trophy,
    iconSrc: `${ICON_BASE}/evangelize.svg`,
    stageNum: "04",
    badge: "STAGE 04",
  },
  reactivate: {
    color: "#13235A",          // HL Navy — deeper
    rgb: "19,35,90",
    Icon: RefreshCw,
    iconSrc: `${ICON_BASE}/reactivate.svg`,
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

const SLIDE_W = 1920;
const SLIDE_H = 1080;

type SlideTheme = "light" | "dark";
type ExportScope = "slide" | "wheel";

const THEME_VARS: Record<SlideTheme, Record<string, string>> = {
  light: {
    "--slide-bg":
      "radial-gradient(ellipse 90% 70% at 50% 35%, #EFF6FF 0%, #DBEAFE 45%, #BFDBFE 80%, #93C5FD 100%)",
    "--slide-text": "#0F172A",
    "--slide-text-muted": "#475569",
    "--card-bg": "#FFFFFF",
    "--card-text": "#0F172A",
    "--card-text-muted": "#475569",
    "--card-bullet-text": "#1E293B",
    "--card-shadow-inner": "rgba(15,23,42,0.04)",
    "--card-border": "1px solid transparent",
    "--card-backdrop": "none",
    "--hub-sub-text": "#475569",
    "--header-bg": "#FFFFFF",
    "--header-text": "#0F172A",
    "--header-text-muted": "#475569",
    "--badge-bg": "rgba(15,23,42,0.06)",
    "--badge-text": "#0F172A",
  },
  dark: {
    // Deep blue radial — navy at the center fading into nearly black
    // at the edges, giving the glass cards plenty of color to refract.
    "--slide-bg":
      "radial-gradient(ellipse 100% 80% at 50% 30%, #1E40AF 0%, #1E3A8A 28%, #172554 60%, #0B1A3A 100%)",
    "--slide-text": "#F8FAFC",
    "--slide-text-muted": "#CBD5E1",
    // Glassmorphism: translucent navy + backdrop blur + hairline border.
    // The blur picks up the deep blue gradient behind for a frosted look.
    "--card-bg": "rgba(30, 41, 59, 0.42)",
    "--card-text": "#F8FAFC",
    "--card-text-muted": "#CBD5E1",
    "--card-bullet-text": "#E2E8F0",
    "--card-shadow-inner": "rgba(0,0,0,0.45)",
    "--card-border": "1px solid rgba(255,255,255,0.10)",
    "--card-backdrop": "blur(24px) saturate(180%)",
    "--hub-sub-text": "#CBD5E1",
    "--header-bg": "#1E293B",
    "--header-text": "#F8FAFC",
    "--header-text-muted": "#CBD5E1",
    "--badge-bg": "rgba(248,250,252,0.10)",
    "--badge-text": "#F8FAFC",
  },
};

export function GrowthFlywheelWorkspace() {
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [hero, setHero] = useState<HeroContent>(INITIAL_HERO);
  const [openSection, setOpenSection] = useState<EditTarget>("hero");
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [exportScope, setExportScope] = useState<ExportScope>("slide");
  const [theme, setTheme] = useState<SlideTheme>("light");
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // When a section opens, scroll it into view inside the sidebar so the
  // user can immediately see (and edit) the expanded fields without
  // having to discover the scrollbar.
  useEffect(() => {
    if (!openSection) return;
    const container = sidebarScrollRef.current;
    if (!container) return;
    // Wait for the accordion's max-height transition (200ms) to expand
    // before scrolling — otherwise we measure the collapsed position.
    const t = window.setTimeout(() => {
      const target = container.querySelector(
        `[data-section-id="${openSection}"]`,
      ) as HTMLElement | null;
      if (!target) return;
      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const offset = tRect.top - cRect.top + container.scrollTop - 8;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      container.scrollTo({
        top: offset,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }, 220);
    return () => window.clearTimeout(t);
  }, [openSection]);

  const themeVars = THEME_VARS[theme] as React.CSSProperties;

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
    const isWheel = exportScope === "wheel";
    const sourceEl = isWheel ? wheelRef.current : previewRef.current;
    if (!sourceEl) return;
    setIsExporting(true);
    try {
      // Wheel-only export: snapshot the wheel container at the SVG's
      // natural 600×600 size (the halo is 500×500 but the wheel SVG
      // overflows it slightly to fit labels and corner badges). Reset
      // the centering transform so the captured content isn't clipped
      // off the top-left of the canvas.
      // Slide export: full 1920×1080 → 13.333"×7.5" landscape.
      const WHEEL_NATURAL = 600;
      const w = isWheel ? WHEEL_NATURAL : SLIDE_W;
      const h = isWheel ? WHEEL_NATURAL : SLIDE_H;
      const DPI = 200;
      const pageW = isWheel ? 9 : 13.333;
      const pageH = (h / w) * pageW;
      const pxW = pageW * DPI;
      const pixelRatio = pxW / w;
      const dataUrl = await toPng(sourceEl, {
        width: w,
        height: h,
        pixelRatio,
        cacheBust: true,
        skipAutoScale: true,
        backgroundColor: isWheel ? "transparent" : undefined,
        style: isWheel
          ? ({
              transform: "none",
              position: "static",
              width: `${w}px`,
              height: `${h}px`,
              background: "transparent",
              border: "none",
              boxShadow: "none",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              borderRadius: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            } as Partial<CSSStyleDeclaration>)
          : {
              transform: "none",
              borderRadius: "0",
            },
      });
      const baseName = isWheel
        ? "Growth_Flywheel_Wheel"
        : hero.title || "Growth_Flywheel";
      const safeName = baseName
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "_");
      const d = new Date();
      const dp = `${d.getMonth() + 1}_${d.getDate()}_${String(d.getFullYear()).slice(-2)}`;
      const fname = `${safeName}_${theme}_${dp}`;
      const sourceLabel = isWheel
        ? "Growth Flywheel (Wheel)"
        : "Growth Flywheel";
      if (exportFormat === "pdf") {
        const resp = await fetch(`${BASE}api/convert-cmyk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: dataUrl,
            filename: `${fname}.pdf`,
            pageWidth: pageW,
            pageHeight: pageH,
            colorSpace: "rgb",
          }),
        });
        if (!resp.ok)
          throw new Error(`PDF conversion failed: ${resp.statusText}`);
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
            source: sourceLabel,
            format: "pdf",
            thumbnail: t,
            dimensions: `${pageW}×${pageH.toFixed(1)}in (RGB)`,
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
            source: sourceLabel,
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
  }, [hero.title, exportFormat, exportScope, theme]);

  const toggleSection = (target: EditTarget) =>
    setOpenSection((prev) => (prev === target ? null : target));

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* LEFT SIDEBAR EDITOR */}
      <LeftSidebar
        scrollContainerRef={sidebarScrollRef}
        stages={stages}
        hero={hero}
        openSection={openSection}
        onToggleSection={toggleSection}
        onUpdateStage={updateStage}
        onUpdateHero={setHero}
        onReset={resetAll}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        exportScope={exportScope}
        onExportScopeChange={setExportScope}
        theme={theme}
        onThemeChange={setTheme}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* RIGHT PREVIEW AREA — shared LivePreview frame */}
      <LivePreview>
        <div
          ref={stageRef}
          className="w-full h-full flex items-center justify-center"
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
              background: "var(--slide-bg)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "34px 36px 28px",
              fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
              ...themeVars,
            }}
          >
            {/* Hero header — headline only, sized large to anchor the
                top of the slide with confident presence. */}
            <div className="text-center" style={{ marginBottom: 28 }}>
              <img
                src={`${BASE}assets/logos/Lockup=Full Horizontal, Color=${theme === "dark" ? "Light" : "Dark"}.png`}
                alt="HighLevel"
                style={{
                  height: 40,
                  width: "auto",
                  display: "inline-block",
                  marginBottom: 16,
                }}
              />
              <h1
                className="text-[44px] font-bold tracking-[-0.8px] leading-[1.1]"
                style={{
                  fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
                  color: "var(--slide-text)",
                }}
              >
                {hero.title}
              </h1>
            </div>

            {/* Slide layout:
                Top zone — 2 rows × 2 cards with the flywheel floating
                centered above. Bottom row — Reactivate wide card. */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Top zone: rows 1+2 + flywheel overlay */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Row 1 — top row mirrors the flywheel's top half:
                    Evangelize sits top-LEFT (top-left segment, orange)
                    Capture   sits top-RIGHT (top-right segment, yellow)
                    The fixed 520px middle column reserves real estate for
                    the absolutely-positioned wheel, so card content stays
                    naturally left-aligned and never sits under the wheel. */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 520px 1fr",
                    gap: "14px",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  <InfoCard stage={getStage("evangelize")} align="left" />
                  <div aria-hidden />
                  <InfoCard stage={getStage("capture")} align="right" />
                </div>

                {/* Row 2 — bottom row mirrors the flywheel's bottom half:
                    Close   sits bottom-LEFT (bottom-left segment, green)
                    Nurture sits bottom-RIGHT (bottom-right segment, blue) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 520px 1fr",
                    gap: "14px",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  <InfoCard stage={getStage("close")} align="left" />
                  <div aria-hidden />
                  <InfoCard stage={getStage("nurture")} align="right" />
                </div>

                {/* Flywheel — absolutely centered over rows 1+2.
                    The halo disc shares the card background so it
                    visually fuses with the surrounding info cards
                    rather than reading as a separate floating layer. */}
                <div
                  ref={wheelRef}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 10,
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "var(--card-bg)",
                    border: "var(--card-border)",
                    backdropFilter: "var(--card-backdrop)",
                    WebkitBackdropFilter: "var(--card-backdrop)" as React.CSSProperties["backdropFilter"],
                    boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Flywheel theme={theme} />
                </div>
              </div>

              {/* Row 3 — Reactivate wide */}
              <div style={{ flexShrink: 0 }}>
                <InfoCard stage={getStage("reactivate")} wide />
              </div>
            </div>
          </div>
          </div>
        </div>
      </LivePreview>
    </div>
  );
}

// Flywheel SVG — clean donut + external corner callouts with connector lines

function Flywheel({ theme = "light" }: { theme?: SlideTheme }) {
  const SIZE = 600;
  const CENTER = SIZE / 2;
  const OUTER_R = 240;
  const HUB_R = 102;          // inner edge of petals = outer edge of center hub
  const CENTER_R = 92;        // white REACTIVATE disc radius (slightly inside hub)
  // Icon badge size — uniform across all four petals.
  // BG_R is in SVG units; with SIZE=600 rendered into a ~480px box this
  // works out to roughly 54px badges on screen, matching the spec.
  const BG_R = 34;

  // Per-stage badge placement. Percentages are RELATIVE TO THE WHEEL
  // CIRCLE (not the outer SVG box which has padding for the drop shadow)
  // so a position of (top: 50%, left: 50%) lands at the wheel center.
  // Each badge sits inside the colored ring, balanced between hub and rim.
  const WHEEL_DIAM = 2 * OUTER_R;
  const WHEEL_LEFT = CENTER - OUTER_R;
  const WHEEL_TOP = CENTER - OUTER_R;
  const wheelPos = (leftPct: number, topPct: number) => ({
    cx: WHEEL_LEFT + leftPct * WHEEL_DIAM,
    cy: WHEEL_TOP + topPct * WHEEL_DIAM,
  });
  // Each badge sits at the TRUE CARDINAL of its stage's petal head
  // (matches the reference: trophy = top, funnel = right, chat = bottom,
  // dollar = left). The percentage from the cardinal edge places the
  // badge cleanly inside the colored ring — not touching the rim, not
  // touching the center "REACTIVATE" disc.
  const ICON_LAYOUT: Record<StageId, { cx: number; cy: number }> = {
    evangelize: wheelPos(0.50, 0.14), // trophy at TOP
    capture:    wheelPos(0.86, 0.50), // funnel at RIGHT
    nurture:    wheelPos(0.50, 0.86), // chat   at BOTTOM
    close:      wheelPos(0.14, 0.50), // dollar at LEFT
  };

  const outerOrder: StageId[] = ["capture", "nurture", "close", "evangelize"];
  const sweep = 360 / outerOrder.length;
  const startAngle = -90;

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  // Per-stage gradient stops — saturated highlight at the OUTER edge of
  // each petal fading to a deep, punchy shade near the hub. Each gradient
  // is rendered in user-space along the petal's mid radial so the lit
  // edge always reads as the rim of the wheel (matches the reference).
  const PETAL_GRADIENT: Record<StageId, [string, string]> = {
    capture:    ["#FFD54F", "#E65100"], // bright amber → deep orange
    nurture:    ["#29B6F6", "#01579B"], // vivid cyan-blue → deep blue
    close:      ["#43A047", "#1B5E20"], // bright green → forest
    evangelize: ["#FF7043", "#BF360C"], // vivid coral → burnt orange
    reactivate: ["#1E40AF", "#0B1A3A"], // (only used for icon tint, not petal)
  };

  // Pinwheel petal. Each petal fills a 90° sweep around the wheel, but the
  // two boundaries between adjacent petals are S-curves (semicircles) of
  // radius (OUTER_R - HUB_R) / 2 instead of straight radial lines. Every
  // boundary bulges in the same rotational direction (clockwise here),
  // which produces the swirling yin-yang / pinwheel look.
  const segmentPath = (a1: number, a2: number) => {
    const p1Outer = polar(a1, OUTER_R);
    const p2Outer = polar(a2, OUTER_R);
    const p1Hub = polar(a1, HUB_R);
    const p2Hub = polar(a2, HUB_R);
    const boundaryR = (OUTER_R - HUB_R) / 2;
    const large = a2 - a1 > 180 ? 1 : 0;
    return [
      `M ${p1Outer.x} ${p1Outer.y}`,
      // Outer arc clockwise from a1 → a2
      `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${p2Outer.x} ${p2Outer.y}`,
      // CW boundary curve: semicircle from outer(a2) → hub(a2),
      // bulging clockwise (eats into the *next* petal).
      `A ${boundaryR} ${boundaryR} 0 0 1 ${p2Hub.x} ${p2Hub.y}`,
      // Inner arc counter-clockwise from hub(a2) → hub(a1)
      `A ${HUB_R} ${HUB_R} 0 ${large} 0 ${p1Hub.x} ${p1Hub.y}`,
      // CCW boundary curve: same physical semicircle as the previous
      // petal's CW edge, traversed backwards (sweep flag flipped).
      `A ${boundaryR} ${boundaryR} 0 0 0 ${p1Outer.x} ${p1Outer.y}`,
      "Z",
    ].join(" ");
  };

  const segmentMeta = outerOrder.map((id, i) => {
    const a1 = startAngle + i * sweep;
    const a2 = startAngle + (i + 1) * sweep;
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
          fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
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

          {/* Per-petal linear gradients in user space — light highlight at
              the OUTER rim of the petal, deep shade near the hub. The
              gradient runs along each petal's mid radial, so every petal
              reads with the same "lit edge → shaded core" treatment. */}
          {segmentMeta.map(({ id, mid }) => {
            const [light, dark] = PETAL_GRADIENT[id];
            const outer = polar(mid, OUTER_R);
            const inner = polar(mid, HUB_R);
            return (
              <linearGradient
                key={`grad-${id}`}
                id={`fw-grad-${id}`}
                gradientUnits="userSpaceOnUse"
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
              >
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
            );
          })}

          {/* Invisible arc paths for the curved stage labels. Each
              petal is an S-curve: it bulges out at the head (a2, where
              the icon sits) and tapers toward the tail (a1). To keep
              the text inside the petal body — not bleeding into the
              neighbouring petal at the tail end — we shift the arc
              toward the head and leave explicit margins on both ends.
              Top-half petals use a CW arc and bottom-half petals use a
              CCW arc so the text always reads right-side up. */}
          {segmentMeta.map(({ id, a1, a2 }) => {
            const TEXT_R = 178;
            const tailMargin = 22; // clear of the tapered tail
            const headMargin = 14; // clear of the icon badge at the head
            const lo = a1 + tailMargin;
            const hi = a2 - headMargin;
            const labelMid = (lo + hi) / 2;
            const isBottomHalf =
              Math.sin((labelMid * Math.PI) / 180) > 0;
            const sweep = isBottomHalf ? 0 : 1;
            const fromAngle = isBottomHalf ? hi : lo;
            const toAngle = isBottomHalf ? lo : hi;
            const start = polar(fromAngle, TEXT_R);
            const end = polar(toAngle, TEXT_R);
            return (
              <path
                key={`textpath-${id}`}
                id={`fw-textpath-${id}`}
                d={`M ${start.x} ${start.y} A ${TEXT_R} ${TEXT_R} 0 0 ${sweep} ${end.x} ${end.y}`}
                fill="none"
              />
            );
          })}
        </defs>

        {/* Pinwheel petals — gradient brand fills, no flow arrows. */}
        <g filter="url(#fw-shadow)">
          {segmentMeta.map(({ id, a1, a2 }) => (
            <path
              key={id}
              d={segmentPath(a1, a2)}
              fill={`url(#fw-grad-${id})`}
            />
          ))}
        </g>

        {/* Curved stage labels — each name follows an arc inside its
            petal body, sitting between the head (where the icon lives)
            and the tail. Bold white text reads cleanly on every petal. */}
        <g pointerEvents="none">
          {segmentMeta.map(({ id }) => (
            <text
              key={`label-${id}`}
              fontSize={19}
              fontWeight={800}
              fill="white"
              style={{
                letterSpacing: "2.5px",
                fontFamily:
                  "Poppins, ui-sans-serif, system-ui, sans-serif",
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
          ))}
        </g>

        {/* Center hub: white disc with REACTIVATE label + icon (matches
            the reference's clean white center). */}
        <g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER_R}
            fill="white"
            filter="url(#fw-hub-shadow)"
          />
          <g pointerEvents="none">
            <foreignObject
              x={CENTER - 17}
              y={CENTER - 48}
              width={34}
              height={34}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 31,
                    height: 31,
                    backgroundColor:
                      theme === "dark"
                        ? "#93C5FD"
                        : STAGE_THEME.reactivate.color,
                    WebkitMaskImage: `url(${STAGE_THEME.reactivate.iconSrc})`,
                    maskImage: `url(${STAGE_THEME.reactivate.iconSrc})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
              </div>
            </foreignObject>
            <text
              x={CENTER}
              y={CENTER + 12}
              textAnchor="middle"
              fontSize={18}
              fontWeight={800}
              fill={
                theme === "dark"
                  ? "#93C5FD"
                  : STAGE_THEME.reactivate.color
              }
              style={{
                letterSpacing: "1.6px",
                fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              REACTIVATE
            </text>
          </g>
        </g>

        {/* Stage icon badges anchored on each petal's CW boundary radial
            (cardinal directions: top/right/bottom/left) — that's the fat
            lobe of every petal in our CW pinwheel, matching the reference
            layout. Rendered LAST so they paint cleanly on top of the
            colored petals and the hub disc. */}
        {segmentMeta.map(({ id }) => {
          const t = STAGE_THEME[id];
          const pos = { x: ICON_LAYOUT[id].cx, y: ICON_LAYOUT[id].cy };
          const ICON_PX = 34;
          // Reference style: pure white disc + deep navy icon glyph.
          // No colored tint / no colored stroke — the badge reads cleanly
          // against the saturated petal underneath.
          return (
            <g key={`inner-icon-${id}`} pointerEvents="none">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BG_R}
                fill="white"
                style={{
                  filter:
                    "drop-shadow(0 4px 10px rgba(15,23,42,0.22)) drop-shadow(0 1px 2px rgba(15,23,42,0.12))",
                }}
              />
              <foreignObject
                x={pos.x - ICON_PX / 2}
                y={pos.y - ICON_PX / 2}
                width={ICON_PX}
                height={ICON_PX}
              >
                <div
                  style={{
                    width: ICON_PX,
                    height: ICON_PX,
                    backgroundColor: STAGE_THEME.reactivate.color,
                    WebkitMaskImage: `url(${t.iconSrc})`,
                    maskImage: `url(${t.iconSrc})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
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
  align = "full",
}: {
  stage: Stage;
  wide?: boolean;
  align?: "left" | "right" | "full";
}) {
  const t = STAGE_THEME[stage.id];

  // Split items into 2 columns when wide (Reactivate)
  const cols = wide
    ? [
        stage.items.slice(0, Math.ceil(stage.items.length / 2)),
        stage.items.slice(Math.ceil(stage.items.length / 2)),
      ]
    : [stage.items];

  // All cards are left-aligned: content fills the card naturally from
  // the left edge with the card's standard padding. The `align` prop is
  // kept only so the soft radial glow lights up the correct corner of
  // each card (left cards glow from top-left, right cards from top-right).
  const contentBoxStyle: React.CSSProperties = {};
  const glowCorner = align === "right" ? "100% 0%" : "0% 0%";

  return (
    <div
      className="relative rounded-[12px] w-full h-full overflow-hidden"
      style={{
        background: "var(--card-bg)",
        border: "var(--card-border)",
        backdropFilter: "var(--card-backdrop)",
        WebkitBackdropFilter: "var(--card-backdrop)" as React.CSSProperties["backdropFilter"],
        boxShadow: `0 1px 2px var(--card-shadow-inner), 0 12px 26px -12px rgba(${t.rgb}, 0.26)`,
      }}
    >
      {/* Soft tinted radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowCorner}, rgba(${t.rgb}, 0.14) 0%, transparent 55%)`,
        }}
      />

      {/* Inner content box — constrained when aligned */}
      <div className="relative" style={contentBoxStyle}>

      {/* Header row */}
      <div className="relative pl-[28px] pr-[26px] pt-[14px] pb-[6px] flex items-start gap-[14px]">
        {/* Icon chip */}
        <div
          className="w-[50px] h-[50px] shrink-0 rounded-[13px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${t.color} 0%, rgba(${t.rgb}, 0.80) 100%)`,
            boxShadow: `0 8px 18px -5px rgba(${t.rgb}, 0.55), inset 0 1px 0 rgba(255,255,255,0.30)`,
          }}
        >
          <img
            src={t.iconSrc}
            alt=""
            aria-hidden
            style={{ width: 28, height: 28, filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* Title + tagline stacked together, sitting next to the icon
            for a tight, scannable header (no divider needed below). */}
        <div className="flex-1 min-w-0 pt-[2px]">
          <div
            className="text-[26px] font-bold tracking-[-0.4px] leading-[1.15]"
            style={{
              fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
              color: "var(--card-text)",
            }}
          >
            {stage.title}
          </div>
          <p
            className="text-[15px] leading-[1.4] mt-[4px]"
            style={{ color: "var(--card-text-muted)" }}
          >
            {stage.tagline}
          </p>
        </div>
      </div>

      {/* Bullet list */}
      <div className="pl-[28px] pr-[26px] pt-[12px] pb-[14px]">
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
              className="flex items-start gap-[12px] text-[19px] leading-[1.4] font-medium"
              style={{ color: "var(--card-bullet-text)" }}
            >
              <div
                className="w-[9px] h-[9px] rounded-full mt-[8px] shrink-0"
                style={{ background: t.color }}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      </div>
      {/* /Inner content box */}
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
  scrollContainerRef,
  stages,
  hero,
  openSection,
  onToggleSection,
  onUpdateStage,
  onUpdateHero,
  onReset,
  exportFormat,
  onExportFormatChange,
  exportScope,
  onExportScopeChange,
  theme,
  onThemeChange,
  onExport,
  isExporting,
}: {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  stages: Stage[];
  hero: HeroContent;
  openSection: EditTarget;
  onToggleSection: (t: EditTarget) => void;
  onUpdateStage: (id: StageId, patch: Partial<Stage>) => void;
  onUpdateHero: (h: HeroContent) => void;
  onReset: () => void;
  exportFormat: "pdf" | "png";
  onExportFormatChange: (f: "pdf" | "png") => void;
  exportScope: ExportScope;
  onExportScopeChange: (s: ExportScope) => void;
  theme: SlideTheme;
  onThemeChange: (t: SlideTheme) => void;
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
          <div
            className="flex-1 flex items-center gap-[8px] py-[9px] px-[12px] rounded-[10px] border"
            style={{
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.04) 100%)",
              borderColor: "rgba(34,197,94,0.28)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(34,197,94,0.06)",
            }}
          >
            <span className="relative flex w-[8px] h-[8px] shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#22C55E] opacity-75 animate-ping" />
              <span className="relative inline-flex w-[8px] h-[8px] rounded-full bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-bold text-[#86EFAC] tracking-[0.2px]">
                Live Editing
              </span>
              <span className="text-[9px] font-medium text-[#22C55E]/70 mt-[2px] uppercase tracking-[0.6px]">
                Auto-saving
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-[40px] h-[40px] shrink-0 flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#FF8A8A] hover:border-[rgba(255,77,77,0.3)] hover:bg-[rgba(255,77,77,0.06)] cursor-pointer transition-all"
            title="Reset to defaults"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>

      {/* MIDDLE — scrollable. Uses the visible `editor-scroll` thin
          scrollbar so users can clearly see there's more content
          below when stages are open. */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto editor-scroll px-[14px] py-[14px] flex flex-col gap-[8px]"
      >
        <div data-section-id="hero">
          <SidebarSection
            label="Hero"
            accent="#94A3B8"
            accentRgb="148,163,184"
            isOpen={openSection === "hero"}
            onToggle={() => onToggleSection("hero")}
          >
            <HeroPane hero={hero} onUpdate={onUpdateHero} />
          </SidebarSection>
        </div>

        {stages.map((s) => {
          const t = STAGE_THEME[s.id];
          return (
            <div key={s.id} data-section-id={s.id}>
              <SidebarSection
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
            </div>
          );
        })}
        {/* Spacer so the last opened section can scroll up into view */}
        <div className="h-[8px] shrink-0" />
      </div>

      {/* BOTTOM — fixed */}
      <div className="p-[14px] pt-[12px] border-t border-white/5 bg-[rgba(0,0,0,0.25)] flex flex-col gap-[8px]">
        {/* Theme + Format — side-by-side to save vertical room */}
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <div className="text-[9.5px] font-semibold uppercase tracking-[1.2px] text-[#94a3b880] mb-[4px]">
              Theme
            </div>
            <div className="flex gap-[3px]">
              {(["light", "dark"] as const).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => onThemeChange(th)}
                  className={`flex-1 py-[6px] rounded-[7px] text-[10.5px] font-bold border cursor-pointer transition-all uppercase ${
                    theme === th
                      ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                      : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9.5px] font-semibold uppercase tracking-[1.2px] text-[#94a3b880] mb-[4px]">
              Format
            </div>
            <div className="flex gap-[3px]">
              {(["pdf", "png"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onExportFormatChange(f)}
                  className={`flex-1 py-[6px] rounded-[7px] text-[10.5px] font-bold border cursor-pointer transition-all uppercase ${
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
        </div>

        {/* Export scope toggle */}
        <div>
          <div className="text-[9.5px] font-semibold uppercase tracking-[1.2px] text-[#94a3b880] mb-[4px]">
            Export Scope
          </div>
          <div className="flex gap-[3px]">
            {(
              [
                { id: "slide", label: "Full Slide" },
                { id: "wheel", label: "Wheel Only" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onExportScopeChange(opt.id)}
                className={`flex-1 py-[6px] rounded-[7px] text-[10.5px] font-bold border cursor-pointer transition-all uppercase tracking-[0.4px] ${
                  exportScope === opt.id
                    ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-[8px] py-[10px] mt-[2px] rounded-[12px] text-[12.5px] font-bold cursor-pointer transition-all bg-gradient-to-r from-[#2896FB] to-[#095DC3] text-white shadow-[0_4px_20px_rgba(40,150,251,0.3)] hover:shadow-[0_6px_28px_rgba(40,150,251,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border-none"
        >
          {isExporting ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <Download className="w-[16px] h-[16px]" />
          )}
          {isExporting
            ? "Exporting…"
            : `Download ${exportScope === "wheel" ? "Wheel" : "Slide"} ${exportFormat.toUpperCase()}`}
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
