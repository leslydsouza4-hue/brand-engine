// Summer of AI — campaign workspace.
//
// Two-pane layout (matching Craft Magic): a left control panel (theme header,
// section selector, format picker, copy fields, AI background generation) and a
// right live-preview / asset-library stage. All chrome is theme-driven.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Sparkles, Loader2, Download, Trash2, Check, Mail, Megaphone, Share2, Images, ChevronDown, ImagePlus, X } from "lucide-react";
import {
  SUMMER_THEMES,
  SUMMER_SECTIONS,
  formatsForSection,
  defaultContent,
  defaultLayout,
  defaultLayoutFor,
  orientationFor,
  type SummerThemeId,
  type SummerSection,
  type SummerFormat,
  type SummerContent,
  type SummerElementKey,
  type SummerColors,
  type SummerLayoutMap,
  type SummerOverlay,
} from "./summerThemes";
import { ScaledCanvasPreview, SummerCanvasNode } from "./SummerCanvas";
import { useSummerAssets, addSummerAsset, removeSummerAsset } from "./summerStore";
import { getFontEmbedCSS } from "./fontEmbed";
import { fontDefFor, getGoogleFontEmbedCSS } from "./googleFonts";
import { SummerFontPicker } from "./SummerFontPicker";

/** Combined embed CSS for export: brand body fonts + the chosen Google heading font. */
async function buildEmbedCSS(headlineFont: string): Promise<string> {
  const def = fontDefFor(headlineFont);
  const [brand, google] = await Promise.all([
    getFontEmbedCSS(),
    getGoogleFontEmbedCSS(def.family, def.weight),
  ]);
  return google ? `${brand}\n${google}` : brand;
}

const ELEMENT_LABELS: [SummerElementKey, string][] = [
  ["eyebrow", "Eyebrow"],
  ["headline", "Headline"],
  ["subtext", "Subtext"],
  ["cta", "Button"],
];

const SECTION_ICON = { emailers: Mail, ads: Megaphone, social: Share2, assets: Images } as const;

function triggerDownload(dataUrl: string, name: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Ensure every <img> inside the node has fully decoded before we rasterize —
// otherwise toPng can capture a blank/half-loaded background (export race).
async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

async function nodeToPng(node: HTMLElement, format: SummerFormat, fontEmbedCSS: string): Promise<string> {
  await waitForImages(node);
  return toPng(node, {
    width: format.width,
    height: format.height,
    pixelRatio: 1,
    cacheBust: true,
    fontEmbedCSS,
  });
}

export function SummerOfAiWorkspace({ themeId }: { themeId: SummerThemeId }) {
  const theme = SUMMER_THEMES[themeId];
  const [section, setSection] = useState<SummerSection>("emailers");
  const sectionFormats = useMemo(
    () => (section === "assets" ? [] : formatsForSection(section)),
    [section]
  );
  const [activeFormatKey, setActiveFormatKey] = useState<string>(sectionFormats[0]?.key ?? "");
  const [content, setContent] = useState<SummerContent>(() => defaultContent(themeId));
  // Layout (element placement) is kept per format so each size can be arranged
  // independently; copy / colors / font are shared across sizes.
  const [layouts, setLayouts] = useState<Record<string, SummerLayoutMap>>({});
  const [selected, setSelected] = useState<SummerElementKey | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>(theme.sampleImagePrompt);
  const [refImages, setRefImages] = useState<string[]>([]);
  const refInputRef = useRef<HTMLInputElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const assets = useSummerAssets(themeId);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset content + prompt whenever the theme changes.
  useEffect(() => {
    setContent(defaultContent(themeId));
    setLayouts({});
    setImagePrompt(SUMMER_THEMES[themeId].sampleImagePrompt);
    setRefImages([]);
    setGenError(null);
    setSelected(null);
  }, [themeId]);

  // Keep a valid active format when the section changes.
  useEffect(() => {
    if (section === "assets") return;
    const fmts = formatsForSection(section);
    if (!fmts.some((f) => f.key === activeFormatKey)) {
      setActiveFormatKey(fmts[0]?.key ?? "");
    }
  }, [section, activeFormatKey]);

  const activeFormat = sectionFormats.find((f) => f.key === activeFormatKey) ?? sectionFormats[0];

  const set = useCallback(<K extends keyof SummerContent>(key: K, value: SummerContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
  }, []);

  const activeKey = activeFormat?.key ?? "";

  const moveElement = useCallback(
    (k: SummerElementKey, x: number, y: number) => {
      if (!activeFormat) return;
      setLayouts((prev) => {
        const cur = prev[activeFormat.key] ?? defaultLayoutFor(activeFormat.width, activeFormat.height);
        return { ...prev, [activeFormat.key]: { ...cur, [k]: { ...cur[k], x, y } } };
      });
    },
    [activeFormat]
  );

  const setColor = useCallback((k: keyof SummerColors, v: string) => {
    setContent((c) => ({ ...c, colors: { ...c.colors, [k]: v } }));
  }, []);

  const setSize = useCallback(
    (k: SummerElementKey, size: number) => {
      if (!activeFormat) return;
      setLayouts((prev) => {
        const cur = prev[activeFormat.key] ?? defaultLayoutFor(activeFormat.width, activeFormat.height);
        return { ...prev, [activeFormat.key]: { ...cur, [k]: { ...cur[k], size } } };
      });
    },
    [activeFormat]
  );

  const setOverlay = useCallback((patch: Partial<SummerOverlay>) => {
    setContent((c) => ({ ...c, overlay: { ...c.overlay, ...patch } }));
  }, []);

  const resetLayout = useCallback(() => {
    if (!activeFormat) return;
    setLayouts((prev) => ({ ...prev, [activeFormat.key]: defaultLayoutFor(activeFormat.width, activeFormat.height) }));
    setSelected(null);
  }, [activeFormat]);

  // The content fed to the canvas uses the active format's saved layout, falling
  // back to a layout tuned for this format's aspect ratio.
  const activeContent = useMemo<SummerContent>(
    () => ({
      ...content,
      layout: layouts[activeKey] ?? (activeFormat ? defaultLayoutFor(activeFormat.width, activeFormat.height) : defaultLayout()),
    }),
    [content, layouts, activeKey, activeFormat]
  );

  const generate = useCallback(async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) return;
    setGenerating(true);
    setGenError(null);
    try {
      const r = await fetch("/api/summer/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId,
          prompt,
          orientation: activeFormat ? orientationFor(activeFormat) : undefined,
          width: activeFormat?.width,
          height: activeFormat?.height,
          referenceImages: refImages,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `request failed (${r.status})`);
      }
      const j = (await r.json()) as { dataUrl: string };
      const { persisted } = addSummerAsset(themeId, j.dataUrl, prompt);
      set("bgImage", j.dataUrl);
      if (!persisted) {
        setGenError("Image added but your library storage is full — older assets may not survive a reload.");
      }
    } catch (err) {
      setGenError((err as Error).message || "generation failed");
    } finally {
      setGenerating(false);
    }
  }, [imagePrompt, themeId, activeFormat, refImages, set]);

  // Read uploaded reference image files into data URLs (capped at 3 total).
  // Uses allSettled so one unreadable file doesn't drop the whole batch.
  const addRefFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const results = await Promise.allSettled(
      imgs.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(f);
          })
      )
    );
    const urls = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    if (urls.length > 0) {
      setRefImages((prev) => [...prev, ...urls].slice(0, 3));
    }
    const failed = results.length - urls.length;
    setGenError(failed > 0 ? `${failed} reference image${failed > 1 ? "s" : ""} couldn't be read and were skipped.` : null);
  }, []);

  const removeRefImage = useCallback((idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const exportOne = useCallback(async () => {
    if (!activeFormat) return;
    const node = exportRefs.current[activeFormat.key];
    if (!node) return;
    setExporting(true);
    try {
      const fontEmbedCSS = await buildEmbedCSS(content.headlineFont);
      const dataUrl = await nodeToPng(node, activeFormat, fontEmbedCSS);
      triggerDownload(dataUrl, `summer-${themeId}-${activeFormat.key}.png`);
    } finally {
      setExporting(false);
    }
  }, [activeFormat, themeId, content.headlineFont]);

  const exportZip = useCallback(async () => {
    if (sectionFormats.length === 0) return;
    setExportingZip(true);
    try {
      const fontEmbedCSS = await buildEmbedCSS(content.headlineFont);
      const zip = new JSZip();
      for (const fmt of sectionFormats) {
        const node = exportRefs.current[fmt.key];
        if (!node) continue;
        const dataUrl = await nodeToPng(node, fmt, fontEmbedCSS);
        zip.file(`summer-${themeId}-${fmt.key}.png`, dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `summer-${themeId}-${section}.zip`);
      URL.revokeObjectURL(url);
    } finally {
      setExportingZip(false);
    }
  }, [sectionFormats, themeId, section, content.headlineFont]);

  const p = theme.palette;
  const accentInk = themeId === "feral" ? "#fff" : "#06121a";
  const labelCls = "text-[10px] font-bold uppercase tracking-[1.5px] text-[#7C8BA5] mb-[8px] block";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    color: "#E2E8F0",
    padding: "12px 14px",
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
  };

  const onPromptKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!generating) void generate();
      }
    },
    [generate, generating]
  );

  const generateBtn = (label: string) => (
    <button
      onClick={generate}
      disabled={generating}
      className="mt-[10px] w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
      style={{ background: p.gradient, color: "#fff" }}
    >
      {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
      {generating ? "Generating…" : label}
    </button>
  );

  // Reference-image uploader: thumbnails of any uploaded references + an add
  // button. References are sent to the model as visual guidance (max 3).
  const referenceUploader = () => (
    <div className="mt-[10px]">
      <input
        ref={refInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addRefFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-[8px]">
        {refImages.map((src, i) => (
          <div key={i} className="relative w-[52px] h-[52px] rounded-[10px] overflow-hidden border border-white/[0.14]">
            <img src={src} alt={`reference ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeRefImage(i)}
              aria-label="Remove reference"
              className="absolute top-[2px] right-[2px] w-[16px] h-[16px] rounded-full flex items-center justify-center cursor-pointer border-none bg-black/70 hover:bg-black text-white transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {refImages.length < 3 && (
          <button
            type="button"
            onClick={() => refInputRef.current?.click()}
            className="w-[52px] h-[52px] rounded-[10px] flex flex-col items-center justify-center gap-[2px] cursor-pointer bg-white/[0.04] border border-dashed border-white/[0.2] text-[#94A3B8] hover:text-white hover:border-white/[0.4] transition-colors"
          >
            <ImagePlus size={16} />
            <span className="text-[8px] font-bold uppercase tracking-[0.5px]">Ref</span>
          </button>
        )}
      </div>
      <p className="text-[10.5px] text-[#64748B] mt-[7px] leading-[1.45]">
        {refImages.length > 0
          ? `${refImages.length} reference${refImages.length > 1 ? "s" : ""} — the AI will match their subject & composition, in the ${theme.name} style.`
          : "Optional: upload a reference photo to guide the result (subject, composition, colors)."}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {/* LEFT — control panel */}
      <div className="w-full md:w-[400px] md:min-w-[400px] overflow-y-auto overflow-x-hidden py-[22px] px-[20px] md:px-[26px] pb-[40px] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col gap-[20px] max-h-[46vh] md:max-h-none">
        {/* Theme header */}
        <div className="flex items-center gap-[12px]">
          <div
            className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
            style={{ background: p.gradient, boxShadow: `0 10px 26px -10px ${p.accent}` }}
          >
            <Sparkles size={21} color="#fff" />
          </div>
          <div className="min-w-0">
            <h1
              className="m-0 text-[23px] text-white leading-[1.04]"
              style={{ fontFamily: theme.fontHeading, fontWeight: theme.headingWeight, letterSpacing: theme.headingTracking, textTransform: theme.headingTransform }}
            >
              {theme.name}
            </h1>
            <p className="m-0 text-[11.5px] text-[#94A3B8] leading-[1.35] truncate">{theme.tagline}</p>
          </div>
        </div>

        {/* Section selector */}
        <div>
          <div className={labelCls}>Section</div>
          <div className="grid grid-cols-4 gap-[6px]">
            {SUMMER_SECTIONS.map((s) => {
              const Icon = SECTION_ICON[s.id];
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className="flex flex-col items-center justify-center gap-[5px] py-[11px] px-[3px] rounded-[11px] cursor-pointer transition-all border"
                  style={
                    active
                      ? { background: `${p.accent}24`, borderColor: `${p.accent}8c`, boxShadow: `0 0 18px -6px ${p.accent}` }
                      : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }
                  }
                >
                  <Icon size={16} color={active ? p.accent : "#94A3B8"} />
                  <span className="text-[9.5px] font-bold leading-[1.1] text-center" style={{ color: active ? "#fff" : "#CBD5E1" }}>
                    {s.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {section === "assets" ? (
          <div>
            <div className={labelCls}>Generate a new {theme.name} asset</div>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              onKeyDown={onPromptKeyDown}
              placeholder="Describe the subject…  (⌘/Ctrl+Enter to generate)"
            />
            {referenceUploader()}
            {generateBtn("Generate asset")}
            {genError && <div className="text-[#ff9b9b] text-[12px] mt-[8px] leading-[1.45]">{genError}</div>}
            <p className="text-[11px] text-[#64748B] mt-[14px] leading-[1.5]">
              Every asset is locked to the {theme.name} visual style and saved to this theme's library.
            </p>
          </div>
        ) : (
          <>
            {/* Format picker (dropdown) */}
            <div>
              <div className={labelCls}>Format</div>
              <div className="relative">
                <select
                  value={activeFormatKey}
                  onChange={(e) => setActiveFormatKey(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer", paddingRight: 40, fontWeight: 600 }}
                >
                  {sectionFormats.map((f) => (
                    <option key={f.key} value={f.key} style={{ background: "#0B1020", color: "#E2E8F0" }}>
                      {f.label} — {f.width}×{f.height}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7C8BA5]" />
              </div>
              {activeFormat && <p className="mt-[7px] text-[11px] text-[#7C8BA5] leading-[1.4]">{activeFormat.note}</p>}
            </div>

            {/* Copy */}
            <div className="flex flex-col gap-[14px]">
              <div>
                <div className={labelCls}>Eyebrow</div>
                <input style={inputStyle} value={content.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
              </div>
              <div>
                <div className={labelCls}>Headline</div>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 58 }} value={content.headline} onChange={(e) => set("headline", e.target.value)} />
              </div>
              <div>
                <div className={labelCls}>Subtext</div>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 58 }} value={content.subtext} onChange={(e) => set("subtext", e.target.value)} />
              </div>
              <div>
                <div className={labelCls}>Call to action</div>
                <input style={inputStyle} value={content.cta} onChange={(e) => set("cta", e.target.value)} />
              </div>
            </div>

            {/* Design — fonts, colors, layout */}
            <div className="pt-[18px] border-t border-white/[0.07] flex flex-col gap-[14px]">
              <div>
                <div className={labelCls}>Heading font</div>
                <SummerFontPicker value={content.headlineFont} onChange={(fam) => set("headlineFont", fam)} />
              </div>

              {/* Contextual element editor (Canva-style) — size + color target the
                  element selected on the canvas (or picked from the pills below). */}
              <div>
                <div className={labelCls}>Element</div>
                <div className="flex gap-[5px] mb-[12px]">
                  {ELEMENT_LABELS.map(([k, label]) => {
                    const on = (selected && selected !== "logo" ? selected : "headline") === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelected(k)}
                        className="flex-1 rounded-[8px] px-[6px] py-[7px] text-[11px] font-semibold transition-colors"
                        style={{
                          border: on ? `1px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)",
                          background: on ? `${p.accent}22` : "rgba(255,255,255,0.04)",
                          color: on ? "#fff" : "#CBD5E1",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const target = selected && selected !== "logo" ? selected : "headline";
                  const size = (activeContent.layout)[target].size ?? 1;
                  const isText = target !== "cta";
                  return (
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex items-center gap-[12px]">
                        <span className="text-[11px] text-[#8C9AAE] w-[40px] shrink-0">Size</span>
                        <input
                          type="range"
                          min={0.5}
                          max={2.2}
                          step={0.05}
                          value={size}
                          onChange={(e) => setSize(target, parseFloat(e.target.value))}
                          className="flex-1 cursor-pointer"
                          style={{ accentColor: p.accent }}
                          aria-label="Text size"
                        />
                        <span className="text-[11px] tabular-nums text-[#8C9AAE] w-[42px] text-right">{Math.round(size * 100)}%</span>
                      </div>
                      {isText ? (
                        <div className="flex items-center gap-[12px]">
                          <span className="text-[11px] text-[#8C9AAE] w-[40px] shrink-0">Color</span>
                          <span className="flex-1 text-[11px] tabular-nums text-[#8C9AAE] uppercase">{content.colors[target as keyof SummerColors]}</span>
                          <input
                            type="color"
                            value={content.colors[target as keyof SummerColors]}
                            onChange={(e) => setColor(target as keyof SummerColors, e.target.value)}
                            className="w-[42px] h-[30px] rounded-[8px] cursor-pointer bg-transparent border border-white/15 p-0"
                            aria-label="Text color"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-[12px]">
                          <span className="text-[11px] text-[#8C9AAE] w-[40px] shrink-0">Color</span>
                          <span className="inline-block w-[18px] h-[18px] rounded-[5px]" style={{ background: "#FFD000" }} />
                          <span className="flex-1 text-[11px] text-[#8C9AAE]">Brand yellow — fixed by design</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Summer of AI logo — show, color variant, position, size */}
              <div className="pt-[14px] border-t border-white/[0.07]">
                <div className="flex items-center justify-between mb-[10px]">
                  <div className={labelCls} style={{ marginBottom: 0 }}>Summer of AI logo</div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={content.logo.show}
                    onClick={() => set("logo", { ...content.logo, show: !content.logo.show })}
                    className="relative w-[42px] h-[24px] rounded-full transition-colors shrink-0"
                    style={{ background: content.logo.show ? p.accent : "rgba(255,255,255,0.16)" }}
                    aria-label="Toggle logo"
                  >
                    <span
                      className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                      style={{ left: content.logo.show ? 21 : 3 }}
                    />
                  </button>
                </div>

                {content.logo.show && (
                  <div className="flex flex-col gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[11px] text-[#8C9AAE] w-[52px] shrink-0">Color</span>
                      <div className="flex gap-[6px]">
                        {(["yellow", "blue"] as const).map((v) => {
                          const on = content.logo.variant === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => set("logo", { ...content.logo, variant: v })}
                              className="px-[12px] py-[6px] rounded-[8px] text-[11px] font-semibold capitalize flex items-center gap-[7px] transition-colors"
                              style={{
                                border: on ? `1px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)",
                                background: on ? `${p.accent}22` : "rgba(255,255,255,0.04)",
                                color: on ? "#fff" : "#CBD5E1",
                              }}
                            >
                              <span
                                className="w-[13px] h-[13px] rounded-full"
                                style={{ background: v === "yellow" ? "#FFD400" : "#2F86FF" }}
                              />
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-[12px]">
                      <span className="text-[11px] text-[#8C9AAE] w-[52px] shrink-0">Position</span>
                      <div className="flex gap-[6px]">
                        <button
                          type="button"
                          onClick={() => moveElement("logo", 0.06, 0.05)}
                          className="px-[12px] py-[6px] rounded-[8px] text-[11px] font-semibold text-[#CBD5E1] border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                        >
                          Top left
                        </button>
                        <button
                          type="button"
                          onClick={() => moveElement("logo", Math.max(0, (1 - activeContent.layout.logo.w) / 2), 0.05)}
                          className="px-[12px] py-[6px] rounded-[8px] text-[11px] font-semibold text-[#CBD5E1] border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                        >
                          Top center
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-[12px]">
                      <span className="text-[11px] text-[#8C9AAE] w-[52px] shrink-0">Size</span>
                      <input
                        type="range"
                        min={0.5}
                        max={2.2}
                        step={0.05}
                        value={activeContent.layout.logo.size ?? 1}
                        onChange={(e) => setSize("logo", parseFloat(e.target.value))}
                        className="flex-1 cursor-pointer"
                        style={{ accentColor: p.accent }}
                        aria-label="Logo size"
                      />
                      <span className="text-[11px] tabular-nums text-[#8C9AAE] w-[42px] text-right">
                        {Math.round((activeContent.layout.logo.size ?? 1) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] leading-snug text-[#8C9AAE]">Click an element on the canvas to edit it, then drag it to reposition.</p>
                <button
                  type="button"
                  onClick={resetLayout}
                  className="shrink-0 rounded-[8px] px-3 py-2 text-[12px] text-white border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  Reset layout
                </button>
              </div>
            </div>

            {/* AI background */}
            <div className="pt-[18px] border-t border-white/[0.07]">
              <div className={labelCls}>AI background · {theme.name} style</div>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 54 }}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                onKeyDown={onPromptKeyDown}
                placeholder="Describe the subject…  (⌘/Ctrl+Enter to generate)"
              />
              {referenceUploader()}
              {generateBtn("Generate background")}
              {genError && <div className="text-[#ff9b9b] text-[12px] mt-[8px] leading-[1.45]">{genError}</div>}
              {content.bgImage && (
                <button
                  onClick={() => set("bgImage", null)}
                  className="mt-[8px] w-full py-[9px] rounded-[10px] text-[12.5px] cursor-pointer bg-transparent border border-white/[0.14] text-[#94A3B8] hover:text-white hover:border-white/[0.25] transition-colors"
                >
                  Clear background (use gradient)
                </button>
              )}

              {/* Image overlay — flat black/white wash with opacity */}
              <div className="mt-[16px]">
                <div className={labelCls}>Image overlay</div>
                <div className="flex items-center gap-[10px]">
                  <div className="flex gap-[5px] shrink-0">
                    {(["black", "white"] as const).map((c) => {
                      const on = content.overlay.color === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setOverlay({ color: c, opacity: content.overlay.opacity === 0 ? 0.35 : content.overlay.opacity })}
                          className="w-[30px] h-[30px] rounded-[8px] cursor-pointer transition-transform"
                          style={{
                            background: c === "black" ? "#0A0A0A" : "#FFFFFF",
                            border: on ? `2px solid ${p.accent}` : "1px solid rgba(255,255,255,0.22)",
                          }}
                          aria-label={`${c} overlay`}
                          title={`${c} overlay`}
                        />
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.85}
                    step={0.05}
                    value={content.overlay.opacity}
                    onChange={(e) => setOverlay({ opacity: parseFloat(e.target.value) })}
                    className="flex-1 cursor-pointer"
                    style={{ accentColor: p.accent }}
                    aria-label="Overlay opacity"
                  />
                  <span className="text-[11px] tabular-nums text-[#8C9AAE] w-[42px] text-right">{Math.round(content.overlay.opacity * 100)}%</span>
                </div>
                <p className="mt-[6px] text-[11px] text-[#8C9AAE] leading-[1.4]">
                  A flat {content.overlay.color} layer over the image — dial up the opacity for cleaner, more legible text.
                </p>
              </div>

              {assets.length > 0 && (
                <div className="mt-[14px]">
                  <div className={labelCls}>From library</div>
                  <div className="grid grid-cols-4 gap-[6px]">
                    {assets.slice(0, 8).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => set("bgImage", a.dataUrl)}
                        title={a.prompt}
                        className="relative aspect-square rounded-[8px] overflow-hidden cursor-pointer p-0 bg-black"
                        style={{ border: content.bgImage === a.dataUrl ? `2px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)" }}
                      >
                        <img src={a.dataUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT — preview / asset library */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-[20px] md:p-[30px]">
        {section === "assets" ? (
          <AssetGrid
            assets={assets}
            accent={p.accent}
            accentInk={accentInk}
            onUse={(url) => {
              set("bgImage", url);
              setSection("social");
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-[16px] gap-[12px] flex-wrap">
              <div className="text-[13px] text-[#94A3B8]">
                {activeFormat ? `${activeFormat.label} · ${activeFormat.width}×${activeFormat.height}` : ""}
              </div>
              <div className="flex gap-[10px]">
                <button
                  onClick={exportOne}
                  disabled={exporting || !activeFormat}
                  className="flex items-center gap-[7px] py-[9px] px-[16px] rounded-[10px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: p.accent, color: accentInk }}
                >
                  {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  PNG
                </button>
                <button
                  onClick={exportZip}
                  disabled={exportingZip}
                  className="flex items-center gap-[7px] py-[9px] px-[16px] rounded-[10px] font-semibold text-[13px] cursor-pointer bg-transparent border border-white/[0.16] text-white disabled:opacity-60 disabled:cursor-not-allowed hover:border-white/[0.3] transition-colors"
                >
                  {exportingZip ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  All ({sectionFormats.length}) ZIP
                </button>
              </div>
            </div>

            <div
              className="flex justify-center items-start p-[24px] rounded-[18px] border border-white/[0.07]"
              style={{ background: "rgba(0,0,0,0.28)", minHeight: 420 }}
            >
              {activeFormat && (
                <div style={{ width: previewWidth(activeFormat), maxWidth: "100%" }}>
                  <ScaledCanvasPreview
                    theme={theme}
                    format={activeFormat}
                    content={activeContent}
                    selected={selected}
                    onSelect={setSelected}
                    onMove={moveElement}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden full-size export nodes for the current section */}
      <div style={{ position: "fixed", left: -99999, top: 0, opacity: 0, pointerEvents: "none" }} aria-hidden>
        {sectionFormats.map((f) => (
          <SummerCanvasNode
            key={f.key}
            theme={theme}
            format={f}
            content={{ ...content, layout: layouts[f.key] ?? defaultLayoutFor(f.width, f.height) }}
            innerRef={(el) => {
              exportRefs.current[f.key] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}

function previewWidth(format: SummerFormat): number {
  // Constrain tall formats so they don't blow past the viewport height.
  const ratio = format.width / format.height;
  if (ratio < 0.7) return 360; // story / portrait
  if (ratio < 1) return 460;
  return 720;
}

function AssetGrid({
  assets,
  accent,
  accentInk,
  onUse,
}: {
  assets: ReturnType<typeof useSummerAssets>;
  accent: string;
  accentInk: string;
  onUse: (url: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <div className="border border-dashed border-white/[0.16] rounded-[18px] py-[70px] px-[20px] text-center text-[#7C8BA5]">
        <Images size={34} className="mx-auto mb-[12px] opacity-60" />
        <div className="text-[15px] text-[#CBD5E1]">No assets yet</div>
        <div className="text-[12.5px] mt-[6px] text-[#5C6B85]">Generate your first on-brand image from the panel on the left.</div>
      </div>
    );
  }
  return (
    <div className="grid gap-[16px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
      {assets.map((a) => (
        <div key={a.id} className="rounded-[14px] overflow-hidden border border-white/[0.1]" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="aspect-square bg-black">
            <img src={a.dataUrl} alt={a.prompt} className="w-full h-full object-cover" />
          </div>
          <div className="p-[12px]">
            <div
              className="text-[12px] text-[#94A3B8] leading-[1.4] mb-[10px]"
              style={{ minHeight: 34, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {a.prompt}
            </div>
            <div className="flex gap-[8px]">
              <button
                onClick={() => onUse(a.dataUrl)}
                className="flex-1 flex items-center justify-center gap-[6px] py-[8px] rounded-[8px] font-bold text-[13px] cursor-pointer border-none"
                style={{ background: accent, color: accentInk }}
              >
                <Check size={14} /> Use
              </button>
              <button
                onClick={() => removeSummerAsset(a.id)}
                className="py-[8px] px-[10px] rounded-[8px] bg-transparent border border-white/[0.16] text-[#94A3B8] cursor-pointer hover:text-white transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
