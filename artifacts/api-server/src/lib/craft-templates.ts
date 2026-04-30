// Pre-validated CSS Grid templates for the Craft Magic graphic generator.
//
// Each template renders a complete <!doctype html> document where every
// content element lives in a named CSS Grid cell. Because Grid distributes
// space deterministically and cells do not overflow into siblings unless
// explicitly told to, overlap between text and visual elements is
// MATHEMATICALLY IMPOSSIBLE. There is no position: absolute on any content
// element — only on decorative orbs at z-index 0.
//
// The classifier (in claude-design.ts) picks a templateId and extracts slot
// values from the user's prompt. The template's render() function fills the
// slots into the grid and returns a string of HTML.

export type Dims = { W: number; H: number };

export type ChatMessage = { role: "lead" | "ai"; text: string };

export type Card =
  | { kind: "chat"; pillText?: string; messages: ChatMessage[] }
  | { kind: "stats"; pillText?: string; stats: { value: string; label: string }[] }
  | { kind: "dashboard"; pillText?: string; metric: { value: string; label: string }; sparkline?: number[] };

export type Slots = {
  eyebrow?: string;
  headline?: string;
  accentWord?: string;
  subhead?: string;
  ctaText?: string;
  footnote?: string;
  kicker?: string;
  statNumber?: string;
  statLabel?: string;
  contextHeadline?: string;
  quote?: string;
  attributionName?: string;
  attributionRole?: string;
  card?: Card;
};

export type Assets = {
  logoUrl?: string;
  logoTagline?: string;
  brandTag?: string;
};

export type RenderInput = {
  slots: Slots;
  dims: Dims;
  assets: Assets;
};

export type TemplateId =
  | "text-left-card-right"
  | "centered-with-card-below"
  | "centered-hero"
  | "stat-hero"
  | "quote-card";

export type Template = {
  id: TemplateId;
  description: string;
  bestFor: string;
  supports: ("landscape" | "portrait" | "square")[];
  render: (input: RenderInput) => string;
};

// Brand palette (HARD constraint — keep in sync with claude-design.ts)
const C = {
  bgNavy: "#0B1426",
  bgNavyDeep: "#070C18",
  bgNavyMid: "#13213B",
  blue: "#2896FB",
  blueDim: "#1B6FBE",
  green: "#17D94B",
  yellow: "#FFC328",
  white: "#FFFFFF",
  muted: "#94A3B8",
  mutedDim: "#64748B",
  cardBg: "rgba(15,28,52,0.78)",
  cardBorder: "rgba(120,170,230,0.18)",
  pillBg: "rgba(23,217,75,0.14)",
  pillBorder: "rgba(23,217,75,0.42)",
};

// HTML escape: every slot value passes through this. Non-negotiable.
function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Highlight an accent substring inside the headline (case-insensitive).
function renderHeadline(headline: string, accent?: string, color: string = C.green): string {
  const safe = esc(headline);
  if (!accent) return safe;
  const safeAccent = esc(accent);
  const idx = safe.toLowerCase().indexOf(safeAccent.toLowerCase());
  if (idx < 0) return safe;
  const before = safe.slice(0, idx);
  const match = safe.slice(idx, idx + safeAccent.length);
  const after = safe.slice(idx + safeAccent.length);
  return `${before}<span style="color:${color};font-style:italic;">${match}</span>${after}`;
}

function orientationOf(dims: Dims): "landscape" | "portrait" | "square" {
  const r = dims.W / dims.H;
  if (r > 1.15) return "landscape";
  if (r < 0.87) return "portrait";
  return "square";
}

// Compute a "chrome scale factor" so that pills, CTAs, footnotes, orbs, and
// other fixed-pixel chrome elements stay proportional on small canvases
// (e.g. 600×200 email headers) instead of overflowing the design. Original
// values were calibrated for 1080+ social canvases (scale=1.0).
function chromeScale(dims: Dims): number {
  const minDim = Math.min(dims.W, dims.H);
  // Linearly map 1080 → 1.0, with a floor of 0.35 to keep text legible
  // and a ceiling of 1.0 (we don't enlarge beyond the original calibration).
  return Math.max(0.35, Math.min(1.0, minDim / 1080));
}

// Small px helper: scale a base value, then enforce a minimum (so a 4px
// font on a 200px canvas doesn't disappear). Use this for all chrome.
function s(base: number, dims: Dims, minPx = 0): number {
  return Math.max(minPx, Math.round(base * chromeScale(dims)));
}

// Common scaffold (head + base styles). All templates share this so they
// behave identically across browsers and the iframe renderer.
function pageShell(dims: Dims, body: string): string {
  // Pre-scale all chrome values once and interpolate them directly into the
  // class-based rules below. This keeps the template markup unchanged across
  // canvas sizes — only the dimensions and scaled px values vary.
  const cs = chromeScale(dims);
  const orbBlur = Math.max(20, Math.round(80 * cs));
  const pillFont = s(12, dims, 9);
  const pillPadY = s(8, dims, 4);
  const pillPadX = s(16, dims, 8);
  const ctaFont = s(15, dims, 11);
  const ctaPadY = s(16, dims, 8);
  const ctaPadX = s(28, dims, 14);
  const footnoteFont = s(13, dims, 9);
  const kickerFont = s(14, dims, 10);
  const brandTagFont = s(12, dims, 9);
  const cardRadius = s(22, dims, 10);
  const cardPad = s(22, dims, 10);
  const cardGap = s(14, dims, 6);
  const msgFont = s(14, dims, 10);
  const msgPadY = s(12, dims, 6);
  const msgPadX = s(16, dims, 8);
  const msgRadius = s(16, dims, 8);
  const statLabelFont = s(12, dims, 9);
  const logoHeight = s(36, dims, 20);
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500;1,700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${C.bgNavyDeep}; }
  body { font-family: 'Inter Tight','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: ${C.white}; -webkit-font-smoothing: antialiased; }
  .canvas { position: relative; width: ${dims.W}px; height: ${dims.H}px; overflow: hidden; background: radial-gradient(120% 100% at 0% 0%, #14274A 0%, ${C.bgNavy} 55%, ${C.bgNavyDeep} 100%); }
  .orb { position: absolute; border-radius: 50%; filter: blur(${orbBlur}px); pointer-events: none; z-index: 0; }
  .orb-blue { background: rgba(40,150,251,0.35); }
  .orb-green { background: rgba(23,217,75,0.22); }
  .orb-yellow { background: rgba(255,195,40,0.18); }
  .pill { display: inline-flex; align-items: center; gap: ${s(8, dims, 4)}px; padding: ${pillPadY}px ${pillPadX}px; border-radius: 999px; background: ${C.pillBg}; border: 1px solid ${C.pillBorder}; color: ${C.green}; font-weight: 700; font-size: ${pillFont}px; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
  .pill-blue { background: rgba(40,150,251,0.14); border-color: rgba(40,150,251,0.42); color: ${C.blue}; }
  .pill-yellow { background: rgba(255,195,40,0.18); border-color: rgba(255,195,40,0.55); color: ${C.yellow}; }
  .pill-dot { width: ${s(7, dims, 4)}px; height: ${s(7, dims, 4)}px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
  .cta { display: inline-flex; align-items: center; gap: ${s(10, dims, 5)}px; padding: ${ctaPadY}px ${ctaPadX}px; border-radius: 999px; background: ${C.yellow}; color: ${C.bgNavy}; font-weight: 800; font-size: ${ctaFont}px; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 ${s(18, dims, 4)}px ${s(40, dims, 8)}px -${s(16, dims, 4)}px rgba(255,195,40,0.55); }
  .footnote { color: ${C.muted}; font-size: ${footnoteFont}px; letter-spacing: 0.02em; }
  .kicker { color: ${C.blue}; font-weight: 600; font-size: ${kickerFont}px; letter-spacing: 0.02em; }
  .subhead { color: rgba(255,255,255,0.78); font-weight: 400; line-height: 1.45; }
  .brand-tag { color: ${C.green}; font-weight: 700; font-size: ${brandTagFont}px; letter-spacing: 0.18em; text-transform: uppercase; }
  .card { background: ${C.cardBg}; border: 1px solid ${C.cardBorder}; border-radius: ${cardRadius}px; backdrop-filter: blur(14px) saturate(140%); box-shadow: 0 ${s(30, dims, 6)}px ${s(80, dims, 16)}px -${s(30, dims, 6)}px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08); padding: ${cardPad}px; display: flex; flex-direction: column; gap: ${cardGap}px; }
  .msg { display: flex; max-width: 86%; padding: ${msgPadY}px ${msgPadX}px; border-radius: ${msgRadius}px; font-size: ${msgFont}px; line-height: 1.4; }
  .msg-lead { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.92); align-self: flex-start; border-bottom-left-radius: ${s(4, dims, 2)}px; }
  .msg-ai { background: ${C.blue}; color: ${C.white}; align-self: flex-end; border-bottom-right-radius: ${s(4, dims, 2)}px; font-weight: 600; }
  .stat-block { display: flex; flex-direction: column; gap: ${s(4, dims, 2)}px; }
  .stat-value { font-weight: 800; color: ${C.white}; line-height: 1; letter-spacing: -0.02em; }
  .stat-label { color: ${C.muted}; font-size: ${statLabelFont}px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
  .logo-img { display: block; height: ${logoHeight}px; width: auto; }
</style>
</head>
<body>
${body}
</body></html>`;
}

// Small helpers for orb placement (decorative, z-index 0, can't overlap content).
// Sizes/offsets scale with canvas so a 600×200 email banner doesn't get
// painted with three 420px orbs that overflow the entire design.
function orbsCorner(dims: Dims): string {
  const blueSize = s(420, dims, 120);
  const greenSize = s(360, dims, 100);
  const yellowSize = s(220, dims, 60);
  const blueOffsetTop = s(120, dims, 40);
  const blueOffsetRight = s(100, dims, 30);
  const greenOffsetBottom = s(160, dims, 50);
  const greenOffsetLeft = s(80, dims, 25);
  return `
  <div class="orb orb-blue" style="top: -${blueOffsetTop}px; right: -${blueOffsetRight}px; width: ${blueSize}px; height: ${blueSize}px;"></div>
  <div class="orb orb-green" style="bottom: -${greenOffsetBottom}px; left: -${greenOffsetLeft}px; width: ${greenSize}px; height: ${greenSize}px;"></div>
  <div class="orb orb-yellow" style="top: 40%; left: 35%; width: ${yellowSize}px; height: ${yellowSize}px; opacity: 0.6;"></div>`;
}

function logoCell(assets: Assets, dims: Dims, justify: "between" | "left" = "between"): string {
  const wordmarkSize = s(22, dims, 14);
  const left = assets.logoUrl
    ? `<img class="logo-img" src="${esc(assets.logoUrl)}" alt="HighLevel" />`
    : `<div style="font-weight:800;font-size:${wordmarkSize}px;letter-spacing:-0.02em;color:${C.white};">HighLevel</div>`;
  const right = assets.logoTagline
    ? `<div class="pill pill-yellow">${esc(assets.logoTagline)}</div>`
    : "";
  if (justify === "left" || !right) return left;
  return `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">${left}${right}</div>`;
}

// ----- Card renderers (deterministic geometry; live inside their grid cell) -----
// All renderers accept `dims` so internal px values (gaps, font sizes, dot
// sizes) can scale with canvas. Without this, an embedded chat card on a
// 600×400 email canvas would have 14px message text inside a 22px-padded
// shell, looking laughably oversized.

function renderChatCard(card: Extract<Card, { kind: "chat" }>, dims: Dims): string {
  const messages = (card.messages ?? []).slice(0, 4);
  const msgsHtml = messages
    .map((m) =>
      m.role === "ai"
        ? `<div class="msg msg-ai">${esc(m.text)}</div>`
        : `<div class="msg msg-lead">${esc(m.text)}</div>`,
    )
    .join("");
  const dot = s(8, dims, 4);
  const pill = card.pillText
    ? `<div style="display:flex;align-items:center;justify-content:space-between;"><div class="pill"><span class="pill-dot"></span>${esc(card.pillText)}</div><div style="display:flex;gap:${s(5, dims, 3)}px;"><span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${C.green};opacity:0.55;"></span><span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${C.green};opacity:0.85;"></span><span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${C.green};"></span></div></div>`
    : "";
  return `<div class="card" style="width:100%;">
    ${pill}
    <div style="display:flex;flex-direction:column;gap:${s(10, dims, 5)}px;">${msgsHtml}</div>
  </div>`;
}

function renderStatsCard(card: Extract<Card, { kind: "stats" }>, dims: Dims): string {
  const stats = (card.stats ?? []).slice(0, 4);
  if (stats.length === 0) return "";
  const cols = stats.length <= 2 ? stats.length : 2;
  const statValue = s(48, dims, 22);
  const itemsHtml = stats
    .map(
      (st) =>
        `<div class="stat-block"><div class="stat-value" style="font-size:${statValue}px;">${esc(st.value)}</div><div class="stat-label">${esc(st.label)}</div></div>`,
    )
    .join("");
  const pill = card.pillText
    ? `<div class="pill pill-blue"><span class="pill-dot"></span>${esc(card.pillText)}</div>`
    : "";
  return `<div class="card" style="width:100%;">
    ${pill}
    <div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${s(24, dims, 10)}px;">${itemsHtml}</div>
  </div>`;
}

function renderDashboardCard(card: Extract<Card, { kind: "dashboard" }>, dims: Dims): string {
  const series = (card.sparkline && card.sparkline.length >= 3 ? card.sparkline : [12, 18, 24, 22, 32, 38, 46, 52, 60, 72, 80, 92]).slice(0, 16);
  const max = Math.max(...series, 1);
  const W = 320;
  const H = 90;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * W},${H - (v / max) * H}`).join(" ");
  const fillPts = `0,${H} ${pts} ${W},${H}`;
  const pill = card.pillText
    ? `<div class="pill pill-blue"><span class="pill-dot"></span>${esc(card.pillText)}</div>`
    : "";
  const metricSize = s(64, dims, 28);
  const sparkH = s(90, dims, 36);
  return `<div class="card" style="width:100%;">
    ${pill}
    <div class="stat-block"><div class="stat-value" style="font-size:${metricSize}px;color:${C.green};">${esc(card.metric.value)}</div><div class="stat-label">${esc(card.metric.label)}</div></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${sparkH}px;display:block;">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${C.green}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="${C.green}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${fillPts}" fill="url(#sparkFill)"/>
      <polyline points="${pts}" fill="none" stroke="${C.green}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
  </div>`;
}

function renderCard(card: Card | undefined, dims: Dims): string {
  if (!card) return "";
  if (card.kind === "chat") return renderChatCard(card, dims);
  if (card.kind === "stats") return renderStatsCard(card, dims);
  if (card.kind === "dashboard") return renderDashboardCard(card, dims);
  return "";
}

// ----- TEMPLATE 1: text-left + card-right (the #1 failure case) -----

const textLeftCardRight: Template = {
  id: "text-left-card-right",
  description:
    "Landscape composition with the headline column on the LEFT (eyebrow + headline + subhead + optional CTA) and a UI card on the RIGHT (chat / stats / dashboard). Use whenever the prompt mentions a chat panel, dashboard, dialer, or any visual UI mockup alongside a value-prop headline.",
  bestFor: "Landscape graphics that pair a value-prop headline with a UI demo card.",
  supports: ["landscape"],
  render: ({ slots, dims, assets }) => {
    const headlineSize = Math.max(16, Math.round(Math.min(dims.W, dims.H) * 0.085));
    const subheadSize = Math.max(11, Math.round(Math.min(dims.W, dims.H) * 0.025));
    const colGap = s(24, dims, 8);
    const eyebrow = slots.eyebrow ? `<div class="brand-tag" style="color:${C.green};">${esc(slots.eyebrow)}</div>` : "";
    const subhead = slots.subhead ? `<p class="subhead" style="font-size:${subheadSize}px;max-width:42ch;">${esc(slots.subhead)}</p>` : "";
    const cta = slots.ctaText ? `<div><div class="cta">${esc(slots.ctaText)}</div></div>` : "";
    const footnote = slots.footnote ? `<div class="footnote">${esc(slots.footnote)}</div>` : "";
    const headlineHtml = renderHeadline(slots.headline ?? "", slots.accentWord);
    const body = `
<div class="canvas">
  ${orbsCorner(dims)}
  <div style="position:relative;z-index:1;width:100%;height:100%;display:grid;grid-template-columns:6% minmax(0,50%) 4% minmax(0,34%) 6%;grid-template-rows:7% auto 7%;gap:0;">
    <div style="grid-row:1;grid-column:2 / 5;display:flex;align-items:center;justify-content:space-between;">${logoCell(assets, dims)}</div>
    <div style="grid-row:2;grid-column:2;display:flex;flex-direction:column;justify-content:center;gap:${colGap}px;min-width:0;">
      ${eyebrow}
      <h1 style="font-size:${headlineSize}px;font-weight:800;line-height:1.02;letter-spacing:-0.035em;color:${C.white};">${headlineHtml}</h1>
      ${subhead}
      ${cta}
      ${footnote}
    </div>
    <div style="grid-row:2;grid-column:4;display:flex;align-items:center;justify-content:center;min-width:0;">
      ${renderCard(slots.card, dims)}
    </div>
    <div style="grid-row:3;grid-column:2;display:flex;align-items:end;">
      ${assets.brandTag ? `<div class="brand-tag" style="color:${C.green};">${esc(assets.brandTag)}</div>` : ""}
    </div>
  </div>
</div>`;
    return pageShell(dims, body);
  },
};

// ----- TEMPLATE 2: centered text on top, card BELOW (vertical-overlap killer) -----

const centeredWithCardBelow: Template = {
  id: "centered-with-card-below",
  description:
    "Portrait or square composition with eyebrow + headline + (optional subhead) centered at the TOP, and a UI card positioned BELOW the text in its own grid row. The grid guarantees a 32px+ gutter between the headline and the card, so the card can never cover the headline.",
  bestFor: "Portrait/square graphics that pair a centered headline with a chat panel, stats card, or dashboard below.",
  supports: ["portrait", "square"],
  render: ({ slots, dims, assets }) => {
    const headlineSize = Math.max(16, Math.round(Math.min(dims.W, dims.H) * 0.082));
    const subheadSize = Math.max(11, Math.round(Math.min(dims.W, dims.H) * 0.024));
    const headerGap = s(18, dims, 6);
    const footerGap = s(14, dims, 6);
    const footerPadTop = s(24, dims, 8);
    const cardMaxWidth = Math.min(s(620, dims, 200), Math.round(dims.W * 0.92));
    const eyebrow = slots.eyebrow ? `<div class="kicker" style="text-align:center;">${esc(slots.eyebrow)}</div>` : "";
    const subhead = slots.subhead
      ? `<p class="subhead" style="font-size:${subheadSize}px;text-align:center;max-width:36ch;margin:0 auto;">${esc(slots.subhead)}</p>`
      : "";
    const headlineHtml = renderHeadline(slots.headline ?? "", slots.accentWord);
    const footnote = slots.footnote ? `<div class="footnote" style="text-align:center;">${esc(slots.footnote)}</div>` : "";
    const cta = slots.ctaText ? `<div style="display:flex;justify-content:center;"><div class="cta">${esc(slots.ctaText)}</div></div>` : "";
    const body = `
<div class="canvas">
  ${orbsCorner(dims)}
  <div style="position:relative;z-index:1;width:100%;height:100%;display:grid;grid-template-columns:7% 1fr 7%;grid-template-rows:6% auto 4% auto auto 6%;gap:0;">
    <div style="grid-row:1;grid-column:2;display:flex;align-items:center;justify-content:space-between;">${logoCell(assets, dims)}</div>
    <div style="grid-row:2;grid-column:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${headerGap}px;text-align:center;">
      ${eyebrow}
      <h1 style="font-size:${headlineSize}px;font-weight:800;line-height:1.0;letter-spacing:-0.035em;color:${C.white};text-align:center;">${headlineHtml}</h1>
      ${subhead}
    </div>
    <div style="grid-row:3;grid-column:2;"></div>
    <div style="grid-row:4;grid-column:2;display:flex;justify-content:center;">
      <div style="width:min(${cardMaxWidth}px,100%);">${renderCard(slots.card, dims)}</div>
    </div>
    <div style="grid-row:5;grid-column:2;display:flex;flex-direction:column;align-items:center;gap:${footerGap}px;padding-top:${footerPadTop}px;">
      ${cta}
      ${footnote}
    </div>
    <div style="grid-row:6;grid-column:2;display:flex;align-items:end;justify-content:flex-end;">
      ${assets.brandTag ? `<div class="brand-tag" style="color:${C.green};">${esc(assets.brandTag)}</div>` : ""}
    </div>
  </div>
</div>`;
    return pageShell(dims, body);
  },
};

// ----- TEMPLATE 3: centered hero (text only — eyebrow + headline + subhead + CTA) -----

const centeredHero: Template = {
  id: "centered-hero",
  description:
    "Pure text-driven hero — eyebrow + headline + subhead + CTA centered with no card / chat / stats. Use when the prompt is a value-prop or announcement that does NOT need a UI mockup.",
  bestFor: "All aspects when the prompt is text-driven and does not call for a UI demo, chat, or stats card.",
  supports: ["landscape", "portrait", "square"],
  render: ({ slots, dims, assets }) => {
    const headlineSize = Math.max(18, Math.round(Math.min(dims.W, dims.H) * 0.105));
    const subheadSize = Math.max(11, Math.round(Math.min(dims.W, dims.H) * 0.027));
    const stackGap = s(24, dims, 8);
    const ctaMargin = s(8, dims, 4);
    const eyebrow = slots.eyebrow ? `<div class="kicker" style="text-align:center;">${esc(slots.eyebrow)}</div>` : "";
    const subhead = slots.subhead
      ? `<p class="subhead" style="font-size:${subheadSize}px;text-align:center;max-width:34ch;margin:0 auto;">${esc(slots.subhead)}</p>`
      : "";
    const cta = slots.ctaText ? `<div style="display:flex;justify-content:center;margin-top:${ctaMargin}px;"><div class="cta">${esc(slots.ctaText)}</div></div>` : "";
    const headlineHtml = renderHeadline(slots.headline ?? "", slots.accentWord);
    const body = `
<div class="canvas">
  ${orbsCorner(dims)}
  <div style="position:relative;z-index:1;width:100%;height:100%;display:grid;grid-template-columns:7% 1fr 7%;grid-template-rows:7% 1fr 7%;">
    <div style="grid-row:1;grid-column:2;display:flex;align-items:center;justify-content:space-between;">${logoCell(assets, dims)}</div>
    <div style="grid-row:2;grid-column:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${stackGap}px;text-align:center;">
      ${eyebrow}
      <h1 style="font-size:${headlineSize}px;font-weight:800;line-height:0.98;letter-spacing:-0.04em;color:${C.white};text-align:center;max-width:18ch;">${headlineHtml}</h1>
      ${subhead}
      ${cta}
    </div>
    <div style="grid-row:3;grid-column:2;display:flex;align-items:end;justify-content:space-between;">
      <div class="footnote">${esc(slots.footnote ?? "")}</div>
      ${assets.brandTag ? `<div class="brand-tag" style="color:${C.green};">${esc(assets.brandTag)}</div>` : ""}
    </div>
  </div>
</div>`;
    return pageShell(dims, body);
  },
};

// ----- TEMPLATE 4: stat hero (huge single number + label + context line) -----

const statHero: Template = {
  id: "stat-hero",
  description:
    "Editorial stat card — one massive numeric value (with unit/percent) as the absolute hero, small label below, optional context headline. Use for metric-driven brags ('94% close rate', '10,000 calls / day').",
  bestFor: "Stat-driven posts where one big number is the entire message.",
  supports: ["landscape", "portrait", "square"],
  render: ({ slots, dims, assets }) => {
    const statSize = Math.max(36, Math.round(Math.min(dims.W, dims.H) * 0.32));
    const ctxSize = Math.max(13, Math.round(Math.min(dims.W, dims.H) * 0.038));
    const stackGap = s(18, dims, 6);
    const statLabelSize = s(14, dims, 9);
    const statShadowY = s(24, dims, 6);
    const statShadowBlur = s(80, dims, 16);
    const eyebrow = slots.eyebrow ? `<div class="kicker" style="text-align:center;">${esc(slots.eyebrow)}</div>` : "";
    const ctx = slots.contextHeadline
      ? `<p style="font-size:${ctxSize}px;font-weight:600;color:${C.white};line-height:1.18;letter-spacing:-0.015em;text-align:center;max-width:24ch;margin:0 auto;">${esc(slots.contextHeadline)}</p>`
      : "";
    const cta = slots.ctaText ? `<div style="display:flex;justify-content:center;"><div class="cta">${esc(slots.ctaText)}</div></div>` : "";
    const body = `
<div class="canvas">
  ${orbsCorner(dims)}
  <div style="position:relative;z-index:1;width:100%;height:100%;display:grid;grid-template-columns:7% 1fr 7%;grid-template-rows:7% 1fr 7%;">
    <div style="grid-row:1;grid-column:2;display:flex;align-items:center;justify-content:space-between;">${logoCell(assets, dims)}</div>
    <div style="grid-row:2;grid-column:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${stackGap}px;text-align:center;">
      ${eyebrow}
      <div style="font-size:${statSize}px;font-weight:800;color:${C.green};line-height:0.9;letter-spacing:-0.06em;text-shadow:0 ${statShadowY}px ${statShadowBlur}px rgba(23,217,75,0.35);">${esc(slots.statNumber ?? "")}</div>
      <div class="stat-label" style="font-size:${statLabelSize}px;letter-spacing:0.2em;">${esc(slots.statLabel ?? "")}</div>
      ${ctx}
      ${cta}
    </div>
    <div style="grid-row:3;grid-column:2;display:flex;align-items:end;justify-content:space-between;">
      <div class="footnote">${esc(slots.footnote ?? "")}</div>
      ${assets.brandTag ? `<div class="brand-tag" style="color:${C.green};">${esc(assets.brandTag)}</div>` : ""}
    </div>
  </div>
</div>`;
    return pageShell(dims, body);
  },
};

// ----- TEMPLATE 5: quote card (testimonial / pull-quote) -----

const quoteCard: Template = {
  id: "quote-card",
  description:
    "Customer testimonial / pullquote card. Big opening quote mark, then a short customer pullquote (12-22 words) in semibold serif-feeling type, attribution line below ('— Name, Role · Company').",
  bestFor: "Testimonials, customer wins, founder quotes.",
  supports: ["landscape", "portrait", "square"],
  render: ({ slots, dims, assets }) => {
    const quoteSize = Math.max(13, Math.round(Math.min(dims.W, dims.H) * 0.058));
    const stackGap = s(28, dims, 10);
    const attrGap = s(4, dims, 2);
    const attrFont = s(18, dims, 11);
    const quoteMarkOffset = s(12, dims, 4);
    const eyebrow = slots.eyebrow ? `<div class="kicker">${esc(slots.eyebrow)}</div>` : "";
    const quote = slots.quote ?? "";
    const attribution = slots.attributionName
      ? `<div style="display:flex;flex-direction:column;gap:${attrGap}px;"><div style="font-weight:700;color:${C.white};font-size:${attrFont}px;">— ${esc(slots.attributionName)}</div>${slots.attributionRole ? `<div class="footnote">${esc(slots.attributionRole)}</div>` : ""}</div>`
      : "";
    const body = `
<div class="canvas">
  ${orbsCorner(dims)}
  <div style="position:relative;z-index:1;width:100%;height:100%;display:grid;grid-template-columns:8% 1fr 8%;grid-template-rows:7% 1fr 7%;">
    <div style="grid-row:1;grid-column:2;display:flex;align-items:center;justify-content:space-between;">${logoCell(assets, dims)}</div>
    <div style="grid-row:2;grid-column:2;display:flex;flex-direction:column;justify-content:center;gap:${stackGap}px;">
      ${eyebrow}
      <div style="position:relative;">
        <div aria-hidden="true" style="position:absolute;left:-${quoteMarkOffset}px;top:-${Math.round(quoteSize * 0.7)}px;font-family:'Georgia',serif;font-size:${Math.round(quoteSize * 2.2)}px;line-height:1;color:${C.green};opacity:0.55;">&ldquo;</div>
        <p style="font-size:${quoteSize}px;font-weight:600;line-height:1.18;letter-spacing:-0.015em;color:${C.white};max-width:24ch;">${esc(quote)}</p>
      </div>
      ${attribution}
    </div>
    <div style="grid-row:3;grid-column:2;display:flex;align-items:end;justify-content:space-between;">
      <div class="footnote">${esc(slots.footnote ?? "")}</div>
      ${assets.brandTag ? `<div class="brand-tag" style="color:${C.green};">${esc(assets.brandTag)}</div>` : ""}
    </div>
  </div>
</div>`;
    return pageShell(dims, body);
  },
};

// ----- Registry & lookup -----

export const TEMPLATES: Record<TemplateId, Template> = {
  "text-left-card-right": textLeftCardRight,
  "centered-with-card-below": centeredWithCardBelow,
  "centered-hero": centeredHero,
  "stat-hero": statHero,
  "quote-card": quoteCard,
};

export function templateForOrientation(id: TemplateId, dims: Dims): boolean {
  const t = TEMPLATES[id];
  if (!t) return false;
  return t.supports.includes(orientationOf(dims));
}

/**
 * Given an originally-classified template and a target canvas size, pick the best
 * template id to render the SAME slots into. Used by the "size pack" path so a
 * single classifier call can fan out to square / portrait / story / landscape.
 *
 * Rule: prefer the original template if it supports the target orientation,
 * otherwise pick the closest sibling. Card-bearing templates fall back to other
 * card-bearing templates per orientation. Card-less templates preserve their
 * stylistic intent (stat-hero stays a stat, quote stays a quote, etc.).
 */
export function pickTemplateForAspect(
  originalId: TemplateId,
  dims: Dims,
  hasCard: boolean,
): TemplateId | null {
  const orient = orientationOf(dims);
  // 1) Original fits — use it.
  if (TEMPLATES[originalId]?.supports.includes(orient)) return originalId;

  // 2) Stylistic fallbacks that work in all orientations
  if (originalId === "stat-hero") return "stat-hero";
  if (originalId === "quote-card") return "quote-card";
  if (originalId === "centered-hero") return "centered-hero";

  // 3) Card-bearing fallbacks: swap between text-left-card-right (landscape)
  // and centered-with-card-below (portrait/square).
  if (originalId === "text-left-card-right") {
    return hasCard ? "centered-with-card-below" : "centered-hero";
  }
  if (originalId === "centered-with-card-below") {
    return hasCard ? "text-left-card-right" : "centered-hero";
  }
  return "centered-hero";
}

/**
 * Standard "size pack" target aspects — square, portrait, story, landscape.
 * Mirrors the social-size dropdown in TemplatesWorkspace.tsx.
 */
export const SIZE_PACK_ASPECTS: { aspect: string; W: number; H: number; label: string }[] = [
  { aspect: "1080x1080", W: 1080, H: 1080, label: "Square" },
  { aspect: "1080x1350", W: 1080, H: 1350, label: "Portrait" },
  { aspect: "1080x1920", W: 1080, H: 1920, label: "Story" },
  { aspect: "1200x628", W: 1200, H: 628, label: "Landscape" },
];

export function listTemplatesForClassifier(): string {
  return Object.values(TEMPLATES)
    .map((t) => `- ${t.id} (supports: ${t.supports.join(",")}): ${t.description}`)
    .join("\n");
}

export function renderTemplate(id: TemplateId, input: RenderInput): string | null {
  const t = TEMPLATES[id];
  if (!t) return null;
  return t.render(input);
}
