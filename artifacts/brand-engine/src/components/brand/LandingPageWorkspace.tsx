import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Loader2, Sparkles, Download, Copy, Check, Monitor, Tablet, Smartphone, Wand2 } from "lucide-react";

const WIDTH_PRESETS = [
  { id: "desktop", label: "Desktop", w: 1440, icon: Monitor },
  { id: "tablet", label: "Tablet", w: 834, icon: Tablet },
  { id: "mobile", label: "Mobile", w: 414, icon: Smartphone },
] as const;

const LENGTH_PRESETS = [
  { id: "short", label: "Short", h: 2400, hint: "Hero + 2-3 sections" },
  { id: "medium", label: "Medium", h: 3600, hint: "Hero + 5-6 sections" },
  { id: "long", label: "Long", h: 5200, hint: "Full marketing page" },
  { id: "epic", label: "Epic", h: 7200, hint: "Long-form scroll" },
] as const;

type VibeId =
  | "editorial-bold"
  | "glass-aurora"
  | "brutalist-type"
  | "minimal-swiss"
  | "bento-showcase"
  | "dark-tech";

const VIBES: { id: VibeId; label: string; tag: string; tint: string; ring: string; }[] = [
  { id: "glass-aurora",    label: "Glass Aurora",    tag: "Linear · Arc",         tint: "from-[#2896FB] via-[#A855F7] to-[#17D94B]", ring: "rgba(168,85,247,0.55)" },
  { id: "editorial-bold",  label: "Editorial Bold",  tag: "NYT × Apple",          tint: "from-[#FFC328] via-[#F25C19] to-[#0B1426]", ring: "rgba(255,195,40,0.55)" },
  { id: "bento-showcase",  label: "Bento Showcase",  tag: "Apple · shadcn",       tint: "from-[#17D94B] via-[#FFC328] to-[#F25C19]", ring: "rgba(23,217,75,0.55)" },
  { id: "dark-tech",       label: "Dark Tech",       tag: "Anthropic · a16z",     tint: "from-[#0F172A] via-[#475569] to-[#FFC328]", ring: "rgba(255,195,40,0.45)" },
  { id: "minimal-swiss",   label: "Minimal Swiss",   tag: "Notion · Krea",        tint: "from-[#FFFFFF] via-[#CBD5E1] to-[#2896FB]", ring: "rgba(40,150,251,0.45)" },
  { id: "brutalist-type",  label: "Brutalist Type",  tag: "Vercel · Mercury",     tint: "from-[#FFFFFF] via-[#FFC328] to-[#0F172A]", ring: "rgba(255,255,255,0.55)" },
];

const QUICK_PROMPTS: { label: string; prompt: string; }[] = [
  {
    label: "AI Voice Agent",
    prompt: "Landing page for HighLevel AI Voice Agent — an always-on phone receptionist that books appointments, answers FAQs, and routes hot leads to humans. Hero with a phone-call UI mockup showing a live transcript. Features grid for the 6 capabilities (24/7 answering, calendar booking, lead qualification, CRM sync, multilingual, post-call summaries). Founder testimonial from a med-spa owner. 3-tier pricing.",
  },
  {
    label: "All-in-One CRM",
    prompt: "Landing page for HighLevel — the all-in-one CRM, marketing automation, and pipeline platform that replaces 8 tools (HubSpot, Calendly, Mailchimp, Twilio, Typeform, etc). Hero shows a stack of competitor logos being replaced by HighLevel. Bento grid for the 6 product modules. Stats band: 70k+ agencies, $X saved monthly. Comparison table vs HubSpot. 3 pricing tiers.",
  },
  {
    label: "Workflow Builder",
    prompt: "Landing page for HighLevel Workflows — a no-code automation canvas where you wire SMS, email, calls, payments, and AI together. Hero shows the canvas UI with nodes connected by curves. Features grid: triggers, actions, branching, AI steps, integrations. Testimonial from an agency owner who replaced Zapier. Pricing.",
  },
  {
    label: "Email Marketing",
    prompt: "Landing page for HighLevel Email Marketing — drag-and-drop email builder + audience segmentation + AI subject lines + deliverability monitoring. Hero with a stylized email composer mockup. Bento grid for the 6 features. Marquee logo strip. Pricing comparison vs Mailchimp.",
  },
  {
    label: "AI Employee",
    prompt: "Landing page for HighLevel AI Employee — a single AI agent that handles SMS, email, voice, chat, and reviews 24/7 across all your client comms. Hero with a chat-style demo of the AI replying to a lead. Stats band: hours saved, deals booked, response time. Testimonial from an agency. Pricing.",
  },
  {
    label: "Reputation",
    prompt: "Landing page for HighLevel Reputation — automated review requests, 5-star funnel, public review monitoring across Google/Facebook/Yelp, and AI review responses. Hero with a star-rating animation and a sample review feed. 3-tier pricing.",
  },
];

const SECTION_LIBRARY = [
  { id: "nav", label: "Nav Bar", default: true },
  { id: "hero", label: "Hero", default: true },
  { id: "social-proof", label: "Social Proof", default: true },
  { id: "features", label: "Features Grid", default: true },
  { id: "product", label: "Product Mockup", default: true },
  { id: "how-it-works", label: "How It Works", default: false },
  { id: "stats", label: "Stats Band", default: false },
  { id: "testimonial", label: "Testimonial", default: true },
  { id: "comparison", label: "vs Competitors", default: false },
  { id: "pricing", label: "Pricing", default: true },
  { id: "faq", label: "FAQ", default: false },
  { id: "final-cta", label: "Final CTA", default: true },
  { id: "footer", label: "Footer", default: true },
] as const;

const SECTION_PROMPTS: Record<string, string> = {
  nav: 'NAV BAR (slim, ~72px tall — logo left, 4-5 nav links center in #94A3B8, "Get Started" CTA pill on right; frosted-glass background)',
  hero: 'HERO (the headline moment — eyebrow + giant display headline + 14-word subhead + primary CTA + secondary text-link action; product mockup or hero illustration anchored on the right; ~720-900px tall)',
  "social-proof": 'SOCIAL PROOF (logo wall — 5-7 fictional but realistic SaaS company wordmarks in muted #94A3B8 weight 600, optional small kicker like "Trusted by 35,000+ agencies"; ~140-180px tall, separator hairlines top + bottom)',
  features: 'FEATURES GRID (3 or 4 column grid — each with a small disc-icon, headline, 2-line benefit-led description; ~520-640px tall)',
  product: 'PRODUCT SECTION (a "see it in action" mockup — render a realistic in-browser HighLevel UI frame using the Product UI Reference Library, with a kicker + section headline + 1-paragraph benefit text on the opposite side; ~640-760px tall)',
  "how-it-works": 'HOW IT WORKS (3-step process — numbered cards 01/02/03 with connecting line between them, each step has a headline + 1-2 line description; ~520px tall)',
  stats: 'STATS BAND (4 huge KPI numerals across one row — each with a big number in #2896FB or #FFC328 and a small label below; ~280px tall)',
  testimonial: 'TESTIMONIAL (single big pull-quote with attribution — name, role, company; small avatar circle; or 2-3 quote cards in a row; ~440-540px tall)',
  comparison: 'COMPARISON (vs competitors — 3-column table: Us / Competitor A / Competitor B with checkmarks/X across 6-8 rows; ~520px tall)',
  pricing: 'PRICING (2-3 pricing tier cards with feature checklists, "Most Popular" yellow badge on middle tier, prices like $29/$79/$199 mo; ~640px tall)',
  faq: 'FAQ (5-7 accordion-style question rows with chevrons — show 2 expanded with answers visible, others collapsed; ~640px tall)',
  "final-cta": 'FINAL CTA (centered hook headline + huge primary CTA button + small "No credit card required" disclaimer line; full-bleed brand-gradient background; ~360-440px tall)',
  footer: 'FOOTER (4-column link grid: Product / Company / Resources / Legal — each with 5-6 link items in #94A3B8; logo + tagline above the columns; copyright line + social icons at the bottom; ~320px tall)',
};

export function LandingPageWorkspace() {
  const [width, setWidth] = useState<typeof WIDTH_PRESETS[number]["w"]>(1440);
  const [height, setHeight] = useState<typeof LENGTH_PRESETS[number]["h"]>(3600);
  const [creativeMode, setCreativeMode] = useState<"safe" | "bold" | "wild">("bold");
  const [model, setModel] = useState<"claude-sonnet-4-6" | "claude-opus-4-6" | "claude-opus-4-7">("claude-opus-4-7");
  const [vibe, setVibe] = useState<VibeId>("glass-aurora");
  const [prompt, setPrompt] = useState("");
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    () => new Set(SECTION_LIBRARY.filter(s => s.default).map(s => s.id))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const orderedSections = useMemo(() => {
    return SECTION_LIBRARY.filter(s => selectedSections.has(s.id)).map(s => SECTION_PROMPTS[s.id]);
  }, [selectedSections]);

  const toggleSection = (id: string) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-scale the preview iframe to fit the available width
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const containerW = el.clientWidth - 32; // padding
      const scale = Math.min(1, containerW / width);
      setPreviewScale(scale);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, html]);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/claude-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          aspect: `${width}x${height}`,
          model,
          creativeMode,
          pageMode: "landing-page",
          vibe,
          sections: orderedSections,
          format: "social",
          slideCount: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const out = typeof data.html === "string" ? data.html : "";
      if (!out) throw new Error("No HTML returned");
      setHtml(out);
    } catch (e: any) {
      setError(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-page-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {/* Left rail */}
      <div className="w-full md:w-[400px] md:min-w-[400px] overflow-y-auto overflow-x-hidden py-[22px] px-[20px] md:px-[26px] pb-[36px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.04)] flex flex-col gap-[6px] max-h-[50vh] md:max-h-none">
        <div className="flex items-center gap-[8px] mb-[1px]">
          <span className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center bg-gradient-to-br from-[#17D94B] via-[#2896FB] to-[#A855F7] shadow-[0_2px_8px_rgba(40,150,251,0.35)]">
            <FlaskConical className="w-[13px] h-[13px] text-white" strokeWidth={2.5} />
          </span>
          <div className="text-[14px] font-bold text-white">Page Lab</div>
        </div>
        <div className="text-[11.5px] text-[#475569] mb-[14px]">Cook up full HTML landing pages — hero, features, pricing, the works.</div>

        {/* Width preset */}
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Device Width</div>
        <div className="grid grid-cols-3 gap-[6px] mb-[14px]">
          {WIDTH_PRESETS.map(p => {
            const Icon = p.icon;
            const active = width === p.w;
            return (
              <button
                key={p.id}
                onClick={() => setWidth(p.w)}
                className={`flex flex-col items-center gap-[4px] py-[10px] px-[4px] rounded-[10px] cursor-pointer border transition-all ${
                  active
                    ? "bg-[rgba(40,150,251,0.14)] border-[rgba(40,150,251,0.55)]"
                    : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.07)]"
                }`}
              >
                <Icon className={`w-[16px] h-[16px] ${active ? "text-[#2896FB]" : "text-[#94A3B8]"}`} />
                <div className={`text-[10px] font-bold ${active ? "text-white" : "text-[#CBD5E1]"}`}>{p.label}</div>
                <div className="text-[9px] text-[#64748B]">{p.w}px</div>
              </button>
            );
          })}
        </div>

        {/* Length preset */}
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Page Length</div>
        <div className="grid grid-cols-2 gap-[6px] mb-[14px]">
          {LENGTH_PRESETS.map(p => {
            const active = height === p.h;
            return (
              <button
                key={p.id}
                onClick={() => setHeight(p.h)}
                title={p.hint}
                className={`flex flex-col items-start gap-[2px] py-[9px] px-[12px] rounded-[10px] cursor-pointer border transition-all text-left ${
                  active
                    ? "bg-[rgba(23,217,75,0.14)] border-[rgba(23,217,75,0.55)]"
                    : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.07)]"
                }`}
              >
                <div className={`text-[11px] font-bold ${active ? "text-white" : "text-[#CBD5E1]"}`}>{p.label}</div>
                <div className="text-[9.5px] text-[#64748B]">{p.h}px tall</div>
              </button>
            );
          })}
        </div>

        {/* Model + Creative Intensity */}
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Model</div>
        <div className="flex gap-[4px] p-[3px] mb-[12px] bg-[rgba(255,255,255,0.025)] rounded-[10px] border border-[rgba(255,255,255,0.05)]">
          {([
            { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
            { id: "claude-opus-4-6", label: "Opus 4.6" },
            { id: "claude-opus-4-7", label: "Opus 4.7" },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`flex-1 py-[7px] rounded-[7px] text-[10.5px] font-bold transition-all border-none cursor-pointer ${
                model === m.id ? "bg-[rgba(0,178,169,0.18)] text-[#17D94B]" : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Creative Intensity</div>
        <div className="flex gap-[4px] p-[3px] mb-[14px] bg-[rgba(255,255,255,0.025)] rounded-[10px] border border-[rgba(255,255,255,0.05)]">
          {([
            { id: "safe", label: "Safe" },
            { id: "bold", label: "Bold" },
            { id: "wild", label: "Wild" },
          ] as const).map(c => (
            <button
              key={c.id}
              onClick={() => setCreativeMode(c.id)}
              className={`flex-1 py-[7px] rounded-[7px] text-[10.5px] font-bold transition-all border-none cursor-pointer ${
                creativeMode === c.id
                  ? c.id === "wild"
                    ? "bg-[rgba(255,195,40,0.18)] text-[#FFC328]"
                    : c.id === "bold"
                    ? "bg-[rgba(40,150,251,0.18)] text-[#2896FB]"
                    : "bg-[rgba(0,178,169,0.18)] text-[#17D94B]"
                  : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Vibe */}
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Vibe</div>
        <div className="grid grid-cols-2 gap-[6px] mb-[14px]">
          {VIBES.map(v => {
            const active = vibe === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className="relative flex flex-col items-stretch gap-[6px] py-[9px] px-[10px] rounded-[10px] cursor-pointer border text-left transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
                  borderColor: active ? v.ring : "rgba(255,255,255,0.10)",
                  boxShadow: active ? `0 0 0 1px ${v.ring}, 0 8px 24px -6px ${v.ring}` : "none",
                }}
              >
                <div className={`h-[18px] w-full rounded-[5px] bg-gradient-to-r ${v.tint}`} style={{ opacity: active ? 1 : 0.7 }} />
                <div>
                  <div className={`text-[11px] font-bold leading-[1.1] ${active ? "text-white" : "text-[#CBD5E1]"}`}>{v.label}</div>
                  <div className="text-[9px] text-[#64748B] mt-[2px]">{v.tag}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sections */}
        <div className="flex items-baseline justify-between mb-[6px]">
          <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Sections</div>
          <div className="text-[9.5px] text-[#64748B]">{selectedSections.size} selected</div>
        </div>
        <div className="flex flex-wrap gap-[5px] mb-[14px]">
          {SECTION_LIBRARY.map(s => {
            const active = selectedSections.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSection(s.id)}
                className={`py-[6px] px-[10px] rounded-[999px] text-[10.5px] font-semibold border cursor-pointer transition-all ${
                  active
                    ? "bg-[rgba(40,150,251,0.16)] border-[rgba(40,150,251,0.45)] text-white"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.10)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.18)]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Quick prompts */}
        <div className="flex items-center gap-[6px] mb-[6px]">
          <Wand2 className="w-[10px] h-[10px] text-[#A855F7]" />
          <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Quick Prompts</div>
        </div>
        <div className="flex flex-wrap gap-[5px] mb-[14px]">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q.label}
              onClick={() => setPrompt(q.prompt)}
              className="py-[6px] px-[10px] rounded-[999px] text-[10.5px] font-semibold border cursor-pointer transition-all bg-[rgba(168,85,247,0.08)] border-[rgba(168,85,247,0.25)] text-[#C4B5FD] hover:bg-[rgba(168,85,247,0.16)] hover:text-white hover:border-[rgba(168,85,247,0.45)]"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div className="mb-[8px] text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Prompt</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Landing page for HighLevel AI Voice Agent — bold editorial design, dark navy hero with a yellow accent word, product mockup of the calling UI, founder testimonial, 3-tier pricing."
          rows={9}
          style={{ minHeight: 200 }}
          className="w-full mb-[12px] py-[14px] px-[16px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[12.5px] leading-[1.55] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] resize-y"
        />

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading || selectedSections.size === 0}
          className="mb-[8px] w-full flex items-center justify-center gap-[8px] py-[14px] px-[14px] rounded-[12px] text-[13px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: loading ? "rgba(40,150,251,0.08)" : "linear-gradient(135deg, rgba(40,150,251,0.30) 0%, rgba(0,178,169,0.22) 100%)",
            borderColor: "rgba(40,150,251,0.45)",
            color: "#2896FB",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-[14px] h-[14px] animate-spin" /> Generating page…
            </>
          ) : (
            <>
              <Sparkles className="w-[14px] h-[14px]" /> Generate Landing Page
            </>
          )}
        </button>
        <div className="text-[10px] text-[#64748B] mb-[12px] text-center">
          Opus 4.7 with this many sections takes 60-120 seconds
        </div>

        {error && (
          <div className="mb-[12px] py-[10px] px-[12px] rounded-[10px] bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.3)] text-[11.5px] text-[#FCA5A5]">
            {error}
          </div>
        )}

        {html && (
          <div className="flex gap-[6px] mt-[6px]">
            <button
              onClick={downloadHtml}
              className="flex-1 flex items-center justify-center gap-[6px] py-[10px] px-[12px] rounded-[10px] text-[11.5px] font-bold border cursor-pointer transition-all bg-[rgba(23,217,75,0.10)] border-[rgba(23,217,75,0.30)] text-[#17D94B] hover:bg-[rgba(23,217,75,0.18)]"
            >
              <Download className="w-[12px] h-[12px]" /> HTML
            </button>
            <button
              onClick={copyHtml}
              className="flex-1 flex items-center justify-center gap-[6px] py-[10px] px-[12px] rounded-[10px] text-[11.5px] font-bold border cursor-pointer transition-all bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)] text-[#CBD5E1] hover:bg-[rgba(255,255,255,0.08)]"
            >
              {copied ? <Check className="w-[12px] h-[12px] text-[#17D94B]" /> : <Copy className="w-[12px] h-[12px]" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0a1020]">
        <div className="flex items-center justify-between px-[24px] py-[14px] border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-[8px]">
            <span className="w-[8px] h-[8px] rounded-full bg-[#17D94B]" />
            <span className="text-[12px] text-[#94A3B8] font-semibold">Live Preview</span>
            {html && (
              <span className="text-[10px] text-[#64748B] ml-[8px]">
                {width}×{height} · scale {Math.round(previewScale * 100)}%
              </span>
            )}
          </div>
        </div>

        <div ref={previewWrapRef} className="flex-1 overflow-auto p-[16px]">
          {!html && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-[40px]">
              <div className="w-[64px] h-[64px] rounded-[16px] bg-gradient-to-br from-[rgba(23,217,75,0.15)] via-[rgba(40,150,251,0.12)] to-[rgba(168,85,247,0.10)] border border-[rgba(40,150,251,0.20)] flex items-center justify-center mb-[18px]">
                <FlaskConical className="w-[28px] h-[28px] text-[#2896FB]" strokeWidth={2.2} />
              </div>
              <div className="text-[18px] font-bold text-white mb-[8px]">Welcome to the Page Lab</div>
              <div className="text-[13px] text-[#94A3B8] max-w-[460px] leading-[1.55]">
                Pick the sections, write a prompt, and Claude cooks up a full multi-section landing page in HighLevel brand. Then download the HTML and host it anywhere.
              </div>
            </div>
          )}

          {loading && !html && (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-[40px] h-[40px] text-[#2896FB] animate-spin mb-[14px]" />
              <div className="text-[13px] font-bold text-white mb-[4px]">Composing your landing page…</div>
              <div className="text-[11.5px] text-[#64748B]">Opus 4.7 is writing all {selectedSections.size} sections</div>
            </div>
          )}

          {html && (
            <div className="mx-auto" style={{ width: width * previewScale }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  width,
                  height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                }}
              >
                <iframe
                  title="Landing page preview"
                  srcDoc={html}
                  sandbox="allow-same-origin allow-scripts"
                  className="block border-0"
                  style={{ width, height, background: "#0B1426" }}
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
