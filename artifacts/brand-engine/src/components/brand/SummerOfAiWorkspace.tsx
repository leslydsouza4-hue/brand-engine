// Summer of AI — campaign workspace.
//
// Two-pane layout (matching Craft Magic): a left control panel (theme header,
// section selector, format picker, copy fields, AI background generation) and a
// right live-preview / asset-library stage. All chrome is theme-driven.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Sparkles, Loader2, Download, Trash2, Check, Mail, Megaphone, Share2, Images } from "lucide-react";
import {
  SUMMER_THEMES,
  SUMMER_SECTIONS,
  formatsForSection,
  defaultContent,
  orientationFor,
  type SummerThemeId,
  type SummerSection,
  type SummerFormat,
  type SummerContent,
} from "./summerThemes";
import { ScaledCanvasPreview, SummerCanvasNode } from "./SummerCanvas";
import { useSummerAssets, addSummerAsset, removeSummerAsset } from "./summerStore";
import { getFontEmbedCSS } from "./fontEmbed";

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
  const [imagePrompt, setImagePrompt] = useState<string>(theme.sampleImagePrompt);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const assets = useSummerAssets(themeId);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset content + prompt whenever the theme changes.
  useEffect(() => {
    setContent(defaultContent(themeId));
    setImagePrompt(SUMMER_THEMES[themeId].sampleImagePrompt);
    setGenError(null);
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
  }, [imagePrompt, themeId, activeFormat, set]);

  const exportOne = useCallback(async () => {
    if (!activeFormat) return;
    const node = exportRefs.current[activeFormat.key];
    if (!node) return;
    setExporting(true);
    try {
      const fontEmbedCSS = await getFontEmbedCSS();
      const dataUrl = await nodeToPng(node, activeFormat, fontEmbedCSS);
      triggerDownload(dataUrl, `summer-${themeId}-${activeFormat.key}.png`);
    } finally {
      setExporting(false);
    }
  }, [activeFormat, themeId]);

  const exportZip = useCallback(async () => {
    if (sectionFormats.length === 0) return;
    setExportingZip(true);
    try {
      const fontEmbedCSS = await getFontEmbedCSS();
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
  }, [sectionFormats, themeId, section]);

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
            {generateBtn("Generate asset")}
            {genError && <div className="text-[#ff9b9b] text-[12px] mt-[8px] leading-[1.45]">{genError}</div>}
            <p className="text-[11px] text-[#64748B] mt-[14px] leading-[1.5]">
              Every asset is locked to the {theme.name} visual style and saved to this theme's library.
            </p>
          </div>
        ) : (
          <>
            {/* Format picker */}
            <div>
              <div className={labelCls}>Format</div>
              <div className="flex flex-col gap-[7px]">
                {sectionFormats.map((f) => {
                  const active = f.key === activeFormatKey;
                  const r = f.width / f.height;
                  let tw = 30;
                  let th = 30;
                  if (r >= 1) th = 30 / r;
                  else tw = 30 * r;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFormatKey(f.key)}
                      className="flex items-center gap-[12px] text-left p-[10px] rounded-[12px] cursor-pointer transition-all border"
                      style={
                        active
                          ? { background: "rgba(255,255,255,0.06)", borderColor: `${p.accent}8c`, boxShadow: `0 0 16px -8px ${p.accent}` }
                          : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }
                      }
                    >
                      <span className="w-[34px] h-[34px] flex items-center justify-center shrink-0">
                        <span style={{ width: tw, height: th, borderRadius: 4, background: active ? p.gradient : "rgba(255,255,255,0.22)" }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-white truncate">{f.label}</span>
                        <span className="block text-[11px] text-[#7C8BA5] truncate">{f.note} · {f.width}×{f.height}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
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
                  <ScaledCanvasPreview theme={theme} format={activeFormat} content={content} />
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
            content={content}
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
