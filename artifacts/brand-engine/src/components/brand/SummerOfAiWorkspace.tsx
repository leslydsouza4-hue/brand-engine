import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Sparkles, Loader2, Download, Trash2, ImagePlus, Check } from "lucide-react";
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
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ padding: "28px 32px", color: "#fff", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: p.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: theme.fontHeading, fontWeight: theme.headingWeight, fontSize: 30, letterSpacing: theme.headingTracking, textTransform: theme.headingTransform }}>
            {theme.name}
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{theme.mood}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0 24px", flexWrap: "wrap" }}>
        {SUMMER_SECTIONS.map((s) => {
          const active = s.id === section;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                padding: "9px 18px",
                borderRadius: 999,
                border: active ? "none" : "1px solid rgba(255,255,255,0.14)",
                background: active ? p.primary : "transparent",
                color: active ? (themeId === "sun-drunk" ? "#1c130a" : "#fff") : "rgba(255,255,255,0.7)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {section === "assets" ? (
        <AssetLibrary
          themeId={themeId}
          assets={assets}
          imagePrompt={imagePrompt}
          setImagePrompt={setImagePrompt}
          generate={generate}
          generating={generating}
          genError={genError}
          onUse={(url) => {
            set("bgImage", url);
            setSection("social");
          }}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          accent={p.accent}
          primary={p.primary}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 28, alignItems: "start" }}>
          {/* Left: controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Format picker */}
            <div>
              <span style={labelStyle}>Format</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sectionFormats.map((f) => {
                  const active = f.key === activeFormatKey;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFormatKey(f.key)}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: active ? `1px solid ${p.accent}` : "1px solid rgba(255,255,255,0.1)",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{f.note} · {f.width}×{f.height}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Copy fields */}
            <div>
              <span style={labelStyle}>Eyebrow</span>
              <input style={inputStyle} value={content.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
            </div>
            <div>
              <span style={labelStyle}>Headline</span>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={content.headline} onChange={(e) => set("headline", e.target.value)} />
            </div>
            <div>
              <span style={labelStyle}>Subtext</span>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={content.subtext} onChange={(e) => set("subtext", e.target.value)} />
            </div>
            <div>
              <span style={labelStyle}>Call to action</span>
              <input style={inputStyle} value={content.cta} onChange={(e) => set("cta", e.target.value)} />
            </div>

            {/* AI image */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
              <span style={labelStyle}>AI Background — {theme.name} style</span>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the subject…"
              />
              <button
                onClick={generate}
                disabled={generating}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: p.gradient,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: generating ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: generating ? 0.7 : 1,
                }}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Generating…" : "Generate background"}
              </button>
              {genError && <div style={{ color: "#ff8a8a", fontSize: 12, marginTop: 8 }}>{genError}</div>}
              {content.bgImage && (
                <button
                  onClick={() => set("bgImage", null)}
                  style={{ marginTop: 8, width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}
                >
                  Clear background (use gradient)
                </button>
              )}

              {assets.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <span style={labelStyle}>Library</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {assets.slice(0, 9).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => set("bgImage", a.dataUrl)}
                        title={a.prompt}
                        style={{
                          position: "relative",
                          aspectRatio: "1/1",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: content.bgImage === a.dataUrl ? `2px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)",
                          padding: 0,
                          cursor: "pointer",
                          background: "#000",
                        }}
                      >
                        <img src={a.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: preview + export */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                {activeFormat ? `${activeFormat.label} · ${activeFormat.width}×${activeFormat.height}` : ""}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={exportOne}
                  disabled={exporting || !activeFormat}
                  style={ctaBtn(p.primary, themeId === "sun-drunk", exporting)}
                >
                  {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  PNG
                </button>
                <button
                  onClick={exportZip}
                  disabled={exportingZip}
                  style={ghostBtn(exportingZip)}
                >
                  {exportingZip ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  All ({sectionFormats.length}) ZIP
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 24,
                background: "rgba(0,0,0,0.25)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {activeFormat && (
                <div style={{ width: previewWidth(activeFormat), maxWidth: "100%" }}>
                  <ScaledCanvasPreview theme={theme} format={activeFormat} content={content} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

function ctaBtn(bg: string, darkInk: boolean, busy: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 16px",
    borderRadius: 10,
    border: "none",
    background: bg,
    color: darkInk ? "#1c130a" : "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
  };
}

function ghostBtn(busy: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "transparent",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
  };
}

function AssetLibrary({
  assets,
  imagePrompt,
  setImagePrompt,
  generate,
  generating,
  genError,
  onUse,
  inputStyle,
  labelStyle,
  accent,
  primary,
}: {
  themeId: SummerThemeId;
  assets: ReturnType<typeof useSummerAssets>;
  imagePrompt: string;
  setImagePrompt: (v: string) => void;
  generate: () => void;
  generating: boolean;
  genError: string | null;
  onUse: (url: string) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  accent: string;
  primary: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 22, maxWidth: 720 }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>Generate a new on-brand asset</span>
          <input
            style={inputStyle}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the subject…"
            onKeyDown={(e) => {
              if (e.key === "Enter") generate();
            }}
          />
        </div>
        <button
          onClick={generate}
          disabled={generating}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 10,
            border: "none",
            background: primary,
            color: "#1c130a",
            fontWeight: 700,
            fontSize: 14,
            cursor: generating ? "default" : "pointer",
            opacity: generating ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Generate
        </button>
      </div>
      {genError && <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 16 }}>{genError}</div>}

      {assets.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(255,255,255,0.18)",
            borderRadius: 16,
            padding: "60px 20px",
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <ImagePlus size={32} style={{ marginBottom: 12, opacity: 0.6 }} />
          <div style={{ fontSize: 15 }}>No assets yet. Generate your first on-brand image above.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {assets.map((a) => (
            <div
              key={a.id}
              style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}
            >
              <div style={{ aspectRatio: "1/1", background: "#000" }}>
                <img src={a.dataUrl} alt={a.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, minHeight: 34, marginBottom: 10 }}>{a.prompt}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onUse(a.dataUrl)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: "none", background: accent, color: "#06121a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    <Check size={14} /> Use
                  </button>
                  <button
                    onClick={() => removeSummerAsset(a.id)}
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.16)", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
