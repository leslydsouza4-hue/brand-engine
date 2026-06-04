// Summer of AI — campaign workspace.
//
// Two-pane layout: a left control panel (theme header, section selector, and
// editor scoped to the ACTIVE design card) and a right stage that stacks every
// design card in the section (like the HighLevel Email Templates composer).
// Paste a Google Doc whose image briefs are labeled "IMAGE COPY" → one finished,
// editable, themed design card per brief, each with its own generated
// background. Add cards by hand, edit each one, and download individually or as
// a single ZIP. All chrome is theme-driven.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Sparkles, Loader2, Download, Trash2, Check, Copy, Mail, Megaphone, Share2, Images, ChevronDown, ImagePlus, X, Link2, Plus, Upload } from "lucide-react";
import {
  SUMMER_THEMES,
  SUMMER_SECTIONS,
  formatsForSection,
  parseImageCopies,
  defaultContent,
  defaultLayoutFor,
  orientationFor,
  SUMMER_FORMATS,
  type SummerThemeId,
  type SummerSection,
  type SummerFormat,
  type SummerContent,
  type SummerElementKey,
  type SummerColors,
  type SummerOverlay,
} from "./summerThemes";
import { ScaledCanvasPreview, SummerCanvasNode } from "./SummerCanvas";
import { useSummerAssets, addSummerAsset, removeSummerAsset } from "./summerStore";
import { getFontEmbedCSS } from "./fontEmbed";
import { fontDefFor, getGoogleFontEmbedCSS } from "./googleFonts";
import { SummerFontPicker } from "./SummerFontPicker";

/** Content sections that hold a stack of design cards (everything but assets). */
const CONTENT_SECTIONS = ["emailers", "ads", "social"] as const;
type ContentSection = (typeof CONTENT_SECTIONS)[number];

/** A single finished, editable, themed design in a section's stack. */
interface SummerCard {
  id: string;
  /** Which format (size) this card renders at. */
  formatKey: string;
  /** Copy / colors / font / overlay / layout / background for this card. */
  content: SummerContent;
  /** The image-generation brief used to produce this card's background. */
  imagePrompt: string;
  /** True while this card's background is being generated. */
  generating: boolean;
  /** Last generation error for this card, if any. */
  error: string | null;
}

type CardMap = Record<ContentSection, SummerCard[]>;
type ActiveMap = Record<ContentSection, string>;

let cardSeq = 0;
function uid(): string {
  cardSeq += 1;
  return `c_${Date.now().toString(36)}_${cardSeq.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatByKey(key: string): SummerFormat | undefined {
  return SUMMER_FORMATS.find((f) => f.key === key);
}

/** Build a fresh card seeded from the theme defaults at a given format. */
function makeCard(
  themeId: SummerThemeId,
  format: SummerFormat,
  opts?: { imagePrompt?: string; bgImage?: string | null }
): SummerCard {
  const base = defaultContent(themeId);
  return {
    id: uid(),
    formatKey: format.key,
    content: { ...base, layout: defaultLayoutFor(format.width, format.height), bgImage: opts?.bgImage ?? null },
    imagePrompt: opts?.imagePrompt ?? SUMMER_THEMES[themeId].sampleImagePrompt,
    generating: false,
    error: null,
  };
}

/** Seed every content section with a single default card. */
function initCards(themeId: SummerThemeId): { cards: CardMap; active: ActiveMap } {
  const cards = {} as CardMap;
  const active = {} as ActiveMap;
  for (const s of CONTENT_SECTIONS) {
    const fmt = formatsForSection(s)[0]!;
    const card = makeCard(themeId, fmt);
    cards[s] = [card];
    active[s] = card.id;
  }
  return { cards, active };
}

/** Combined embed CSS for export: brand body fonts + the chosen Google heading font. */
async function buildEmbedCSS(headlineFont: string): Promise<string> {
  const def = fontDefFor(headlineFont);
  const [brand, google] = await Promise.all([getFontEmbedCSS(), getGoogleFontEmbedCSS(def.family, def.weight)]);
  return google ? `${brand}\n${google}` : brand;
}

const ELEMENT_LABELS: [SummerElementKey, string][] = [
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

/** Request one themed background image for a brief at a given format. */
async function requestImage(
  themeId: SummerThemeId,
  prompt: string,
  format: SummerFormat,
  refImages: string[]
): Promise<string> {
  const r = await fetch("/api/summer/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      themeId,
      prompt,
      orientation: orientationFor(format),
      width: format.width,
      height: format.height,
      referenceImages: refImages,
    }),
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || `request failed (${r.status})`);
  }
  const j = (await r.json()) as { dataUrl: string };
  return j.dataUrl;
}

export function SummerOfAiWorkspace({ themeId }: { themeId: SummerThemeId }) {
  const theme = SUMMER_THEMES[themeId];
  const [section, setSection] = useState<SummerSection>("emailers");

  const [{ cards, active }, setStacks] = useState<{ cards: CardMap; active: ActiveMap }>(() => initCards(themeId));
  const [selected, setSelected] = useState<SummerElementKey | null>(null);

  // Reference images + asset-tab prompt (shared across the workspace).
  const [refImages, setRefImages] = useState<string[]>([]);
  const refInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const [assetPrompt, setAssetPrompt] = useState<string>(theme.sampleImagePrompt);
  const [assetGenerating, setAssetGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Google-Doc import state.
  const [docUrl, setDocUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Export state.
  const [exportingZip, setExportingZip] = useState(false);

  // Run token: bumped on theme/section change so an in-flight batch can't write
  // stale state into a section the user has navigated away from.
  const batchJobRef = useRef(0);

  const assets = useSummerAssets(themeId);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Reset everything whenever the theme changes.
  useEffect(() => {
    setStacks(initCards(themeId));
    setSelected(null);
    setRefImages([]);
    setAssetPrompt(SUMMER_THEMES[themeId].sampleImagePrompt);
    setGenError(null);
    setDocUrl("");
    setImportMsg(null);
    batchJobRef.current += 1; // invalidate any in-flight batch
  }, [themeId]);

  // Navigating to another section abandons any in-flight import/batch so its
  // late-resolving writes can't land after the user has moved on.
  useEffect(() => {
    batchJobRef.current += 1;
  }, [section]);

  const isContent = section !== "assets";
  const contentSection = (isContent ? section : "emailers") as ContentSection;
  const sectionCards = cards[contentSection];
  const activeId = active[contentSection];
  const activeCard = sectionCards.find((c) => c.id === activeId) ?? sectionCards[0];

  const sectionFormats = useMemo(() => (isContent ? formatsForSection(contentSection) : []), [isContent, contentSection]);
  const activeFormat = activeCard ? formatByKey(activeCard.formatKey) ?? sectionFormats[0] : sectionFormats[0];
  const activeContent = activeCard?.content;

  // ── Card mutators (scoped to the active content section) ──────────────────
  const updateCard = useCallback(
    (id: string, fn: (c: SummerCard) => SummerCard) => {
      setStacks((prev) => ({
        ...prev,
        cards: { ...prev.cards, [contentSection]: prev.cards[contentSection].map((c) => (c.id === id ? fn(c) : c)) },
      }));
    },
    [contentSection]
  );

  const patchContent = useCallback(
    (id: string, patch: Partial<SummerContent>) => {
      updateCard(id, (c) => ({ ...c, content: { ...c.content, ...patch } }));
    },
    [updateCard]
  );

  const set = useCallback(
    <K extends keyof SummerContent>(key: K, value: SummerContent[K]) => {
      if (activeCard) patchContent(activeCard.id, { [key]: value } as Partial<SummerContent>);
    },
    [activeCard, patchContent]
  );

  const moveElementFor = useCallback(
    (id: string, k: SummerElementKey, x: number, y: number) => {
      updateCard(id, (c) => ({ ...c, content: { ...c.content, layout: { ...c.content.layout, [k]: { ...c.content.layout[k], x, y } } } }));
    },
    [updateCard]
  );

  const moveElement = useCallback(
    (k: SummerElementKey, x: number, y: number) => {
      if (activeCard) moveElementFor(activeCard.id, k, x, y);
    },
    [activeCard, moveElementFor]
  );

  const setColor = useCallback(
    (k: keyof SummerColors, v: string) => {
      if (activeCard) updateCard(activeCard.id, (c) => ({ ...c, content: { ...c.content, colors: { ...c.content.colors, [k]: v } } }));
    },
    [activeCard, updateCard]
  );

  const setSize = useCallback(
    (k: SummerElementKey, size: number) => {
      if (activeCard) updateCard(activeCard.id, (c) => ({ ...c, content: { ...c.content, layout: { ...c.content.layout, [k]: { ...c.content.layout[k], size } } } }));
    },
    [activeCard, updateCard]
  );

  const setOverlay = useCallback(
    (patch: Partial<SummerOverlay>) => {
      if (activeCard) updateCard(activeCard.id, (c) => ({ ...c, content: { ...c.content, overlay: { ...c.content.overlay, ...patch } } }));
    },
    [activeCard, updateCard]
  );

  const resetLayout = useCallback(() => {
    if (!activeCard || !activeFormat) return;
    patchContent(activeCard.id, { layout: defaultLayoutFor(activeFormat.width, activeFormat.height) });
    setSelected(null);
  }, [activeCard, activeFormat, patchContent]);

  const setActiveFormat = useCallback(
    (key: string) => {
      const fmt = formatByKey(key);
      if (!activeCard || !fmt) return;
      updateCard(activeCard.id, (c) => ({ ...c, formatKey: key, content: { ...c.content, layout: defaultLayoutFor(fmt.width, fmt.height) } }));
    },
    [activeCard, updateCard]
  );

  const setActive = useCallback(
    (id: string) => {
      setStacks((prev) => (prev.active[contentSection] === id ? prev : { ...prev, active: { ...prev.active, [contentSection]: id } }));
    },
    [contentSection]
  );

  const setPrompt = useCallback(
    (id: string, value: string) => {
      updateCard(id, (c) => ({ ...c, imagePrompt: value }));
    },
    [updateCard]
  );

  // ── Add / duplicate / remove ──────────────────────────────────────────────
  const scrollToCard = useCallback((id: string) => {
    setTimeout(() => cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }, []);

  const addCard = useCallback(() => {
    if (!activeFormat) return;
    const card = makeCard(themeId, activeFormat);
    setStacks((prev) => ({
      cards: { ...prev.cards, [contentSection]: [...prev.cards[contentSection], card] },
      active: { ...prev.active, [contentSection]: card.id },
    }));
    scrollToCard(card.id);
  }, [activeFormat, themeId, contentSection, scrollToCard]);

  const duplicateCard = useCallback(
    (id: string) => {
      setStacks((prev) => {
        const list = prev.cards[contentSection];
        const src = list.find((c) => c.id === id);
        if (!src) return prev;
        const copy: SummerCard = { ...src, id: uid(), content: { ...src.content, colors: { ...src.content.colors }, layout: { ...src.content.layout }, overlay: { ...src.content.overlay }, logo: { ...src.content.logo } }, generating: false, error: null };
        const idx = list.findIndex((c) => c.id === id);
        const next = [...list.slice(0, idx + 1), copy, ...list.slice(idx + 1)];
        return { cards: { ...prev.cards, [contentSection]: next }, active: { ...prev.active, [contentSection]: copy.id } };
      });
    },
    [contentSection]
  );

  const removeCard = useCallback(
    (id: string) => {
      setStacks((prev) => {
        const list = prev.cards[contentSection];
        if (list.length <= 1) {
          const fmt = formatsForSection(contentSection)[0]!;
          const fresh = makeCard(themeId, fmt);
          return { cards: { ...prev.cards, [contentSection]: [fresh] }, active: { ...prev.active, [contentSection]: fresh.id } };
        }
        const idx = list.findIndex((c) => c.id === id);
        const next = list.filter((c) => c.id !== id);
        const newActive = prev.active[contentSection] === id ? next[Math.min(idx, next.length - 1)].id : prev.active[contentSection];
        return { cards: { ...prev.cards, [contentSection]: next }, active: { ...prev.active, [contentSection]: newActive } };
      });
    },
    [contentSection, themeId]
  );

  // ── Generation ────────────────────────────────────────────────────────────
  const generateActive = useCallback(async () => {
    if (!activeCard || !activeFormat) return;
    const prompt = activeCard.imagePrompt.trim();
    if (!prompt) return;
    const id = activeCard.id;
    const sec = contentSection;
    setGenError(null);
    setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === id ? { ...c, generating: true, error: null } : c)) } }));
    try {
      const dataUrl = await requestImage(themeId, prompt, activeFormat, refImages);
      const { persisted } = addSummerAsset(themeId, dataUrl, prompt);
      setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === id ? { ...c, generating: false, content: { ...c.content, bgImage: dataUrl } } : c)) } }));
      if (!persisted) setGenError("Image added but your library storage is full — older assets may not survive a reload.");
    } catch (err) {
      const msg = (err as Error).message || "generation failed";
      setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === id ? { ...c, generating: false, error: msg } : c)) } }));
      setGenError(msg);
    }
  }, [activeCard, activeFormat, contentSection, themeId, refImages]);

  // Generate themed backgrounds for a list of cards, one at a time. A run token
  // makes a stale run (theme/section changed) abandon without writing state.
  const runBatch = useCallback(
    async (sec: ContentSection, fmt: SummerFormat, list: SummerCard[], job: number) => {
      const stale = () => batchJobRef.current !== job;
      for (const card of list) {
        if (stale()) return;
        setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === card.id ? { ...c, generating: true, error: null } : c)) } }));
        try {
          const dataUrl = await requestImage(themeId, card.imagePrompt, fmt, refImages);
          if (stale()) return;
          addSummerAsset(themeId, dataUrl, card.imagePrompt);
          setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === card.id ? { ...c, generating: false, content: { ...c.content, bgImage: dataUrl } } : c)) } }));
        } catch (err) {
          if (stale()) return;
          const msg = (err as Error).message || "failed";
          setStacks((prev) => ({ ...prev, cards: { ...prev.cards, [sec]: prev.cards[sec].map((c) => (c.id === card.id ? { ...c, generating: false, error: msg } : c)) } }));
        }
      }
    },
    [themeId, refImages]
  );

  // Import a Google Doc → one card per "IMAGE COPY" brief → generate each bg.
  const importDoc = useCallback(async () => {
    const url = docUrl.trim();
    if (!url || !activeFormat) return;
    const sec = contentSection;
    const fmt = activeFormat;
    // Take a run token up front; theme/section changes bump it, so any write
    // below (including after the fetch resolves) is skipped if this run is stale.
    const job = ++batchJobRef.current;
    const stale = () => batchJobRef.current !== job;
    setImporting(true);
    setImportMsg(null);
    try {
      const r = await fetch("/api/import-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `request failed (${r.status})`);
      }
      const j = (await r.json()) as { text?: string };
      if (stale()) return;
      const copies = parseImageCopies(j.text || "");
      if (copies.length === 0) {
        setImportMsg({ kind: "err", text: 'No "IMAGE COPY" briefs were found in that doc. Make sure each image brief is labeled "IMAGE COPY".' });
        return;
      }
      const newCards = copies.map((pr) => makeCard(themeId, fmt, { imagePrompt: pr }));
      if (stale()) return;
      setStacks((prev) => ({ cards: { ...prev.cards, [sec]: newCards }, active: { ...prev.active, [sec]: newCards[0].id } }));
      setImportMsg({ kind: "ok", text: `Imported ${copies.length} brief${copies.length === 1 ? "" : "s"} — generating designs…` });
      await runBatch(sec, fmt, newCards, job);
      if (!stale()) setImportMsg({ kind: "ok", text: `${copies.length} design${copies.length === 1 ? "" : "s"} ready — edit any card, then download.` });
    } catch (err) {
      if (!stale()) setImportMsg({ kind: "err", text: (err as Error).message || "could not import that doc" });
    } finally {
      // Always clear our own loading flag — a stale guard here would leave the
      // Import button stuck spinning after a theme/section switch.
      setImporting(false);
    }
  }, [docUrl, activeFormat, contentSection, themeId, runBatch]);

  // Generate a standalone asset (Asset Library tab) from the shared prompt.
  const generateAsset = useCallback(async () => {
    const prompt = assetPrompt.trim();
    if (!prompt) return;
    const fmt = formatsForSection("social")[0]!; // square library asset
    setAssetGenerating(true);
    setGenError(null);
    try {
      const dataUrl = await requestImage(themeId, prompt, fmt, refImages);
      const { persisted } = addSummerAsset(themeId, dataUrl, prompt);
      if (!persisted) setGenError("Image added but your library storage is full — older assets may not survive a reload.");
    } catch (err) {
      setGenError((err as Error).message || "generation failed");
    } finally {
      setAssetGenerating(false);
    }
  }, [assetPrompt, themeId, refImages]);

  // ── Reference uploads ─────────────────────────────────────────────────────
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
    const urls = results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map((r) => r.value);
    if (urls.length > 0) setRefImages((prev) => [...prev, ...urls].slice(0, 3));
    const failed = results.length - urls.length;
    setGenError(failed > 0 ? `${failed} reference image${failed > 1 ? "s" : ""} couldn't be read and were skipped.` : null);
  }, []);

  const removeRefImage = useCallback((idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Manually set the active card's background from an uploaded image file.
  const uploadBg = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !activeCard) return;
      const file = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (!file) {
        setGenError("That file isn't an image — pick a PNG, JPG or WebP.");
        return;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        patchContent(activeCard.id, { bgImage: dataUrl });
        setGenError(null);
      } catch {
        setGenError("Couldn't read that image — try a different file.");
      }
    },
    [activeCard, patchContent]
  );

  // ── Export ────────────────────────────────────────────────────────────────
  const exportCard = useCallback(
    async (id: string) => {
      const node = exportRefs.current[id];
      const card = sectionCards.find((c) => c.id === id);
      if (!node || !card) return;
      const fmt = formatByKey(card.formatKey);
      if (!fmt) return;
      const idx = sectionCards.findIndex((c) => c.id === id);
      const fontEmbedCSS = await buildEmbedCSS(card.content.headlineFont);
      const dataUrl = await nodeToPng(node, fmt, fontEmbedCSS);
      triggerDownload(dataUrl, `summer-${themeId}-${contentSection}-${idx + 1}.png`);
    },
    [sectionCards, themeId, contentSection]
  );

  const exportZip = useCallback(async () => {
    if (sectionCards.length === 0) return;
    setExportingZip(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < sectionCards.length; i++) {
        const card = sectionCards[i];
        const node = exportRefs.current[card.id];
        const fmt = formatByKey(card.formatKey);
        if (!node || !fmt) continue;
        const fontEmbedCSS = await buildEmbedCSS(card.content.headlineFont);
        const dataUrl = await nodeToPng(node, fmt, fontEmbedCSS);
        zip.file(`summer-${themeId}-${contentSection}-${i + 1}.png`, dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `summer-${themeId}-${contentSection}.zip`);
      URL.revokeObjectURL(url);
    } finally {
      setExportingZip(false);
    }
  }, [sectionCards, themeId, contentSection]);

  // ── Styling helpers ───────────────────────────────────────────────────────
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
        if (section === "assets") {
          if (!assetGenerating) void generateAsset();
        } else if (activeCard && !activeCard.generating) {
          void generateActive();
        }
      }
    },
    [section, assetGenerating, generateAsset, activeCard, generateActive]
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

  const generatingCount = sectionCards.filter((c) => c.generating).length;

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {/* LEFT — control panel */}
      <div className="w-full md:w-[400px] md:min-w-[400px] overflow-y-auto overflow-x-hidden py-[22px] px-[20px] md:px-[26px] pb-[40px] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col gap-[20px] max-h-[46vh] md:max-h-none">
        {/* Theme header */}
        <div className="flex items-center gap-[12px]">
          <div className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0" style={{ background: p.gradient, boxShadow: `0 10px 26px -10px ${p.accent}` }}>
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
              const isActive = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className="flex flex-col items-center justify-center gap-[5px] py-[11px] px-[3px] rounded-[11px] cursor-pointer transition-all border"
                  style={
                    isActive
                      ? { background: `${p.accent}24`, borderColor: `${p.accent}8c`, boxShadow: `0 0 18px -6px ${p.accent}` }
                      : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }
                  }
                >
                  <Icon size={16} color={isActive ? p.accent : "#94A3B8"} />
                  <span className="text-[9.5px] font-bold leading-[1.1] text-center" style={{ color: isActive ? "#fff" : "#CBD5E1" }}>
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
              value={assetPrompt}
              onChange={(e) => setAssetPrompt(e.target.value)}
              onKeyDown={onPromptKeyDown}
              placeholder="Describe the subject…  (⌘/Ctrl+Enter to generate)"
            />
            {referenceUploader()}
            <button
              onClick={() => void generateAsset()}
              disabled={assetGenerating}
              className="mt-[10px] w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
              style={{ background: p.gradient, color: "#fff" }}
            >
              {assetGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {assetGenerating ? "Generating…" : "Generate asset"}
            </button>
            {genError && <div className="text-[#ff9b9b] text-[12px] mt-[8px] leading-[1.45]">{genError}</div>}
            <p className="text-[11px] text-[#64748B] mt-[14px] leading-[1.5]">
              Every asset is locked to the {theme.name} visual style and saved to this theme's library.
            </p>
          </div>
        ) : (
          <>
            {/* Import from a Google Doc → one design per IMAGE COPY brief */}
            <div className="pb-[18px] border-b border-white/[0.07]">
              <div className={labelCls}>Import from Google Doc</div>
              <div className="flex gap-[8px]">
                <input
                  style={inputStyle}
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void importDoc();
                    }
                  }}
                  placeholder="Paste a public Google Doc link…"
                />
                <button
                  type="button"
                  onClick={() => void importDoc()}
                  disabled={importing || !docUrl.trim()}
                  className="shrink-0 flex items-center justify-center gap-[6px] px-[14px] rounded-[10px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#E2E8F0" }}
                >
                  {importing ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                  Import
                </button>
              </div>
              <p className="text-[11px] text-[#64748B] mt-[8px] leading-[1.5]">
                Label each image brief in the doc with the text <span className="text-[#CBD5E1] font-semibold">IMAGE COPY</span>. We'll create one finished {theme.name} design per brief.
              </p>
              {importMsg && <div className={`mt-[8px] text-[12px] leading-[1.45] ${importMsg.kind === "ok" ? "text-[#9ad9b4]" : "text-[#ff9b9b]"}`}>{importMsg.text}</div>}
            </div>

            {activeCard && activeContent && activeFormat && (
              <>
                {/* Format picker (this card's size) */}
                <div>
                  <div className={labelCls}>Format</div>
                  <div className="relative">
                    <select
                      value={activeCard.formatKey}
                      onChange={(e) => setActiveFormat(e.target.value)}
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
                  <p className="mt-[7px] text-[11px] text-[#7C8BA5] leading-[1.4]">{activeFormat.note}</p>
                </div>

                {/* Copy */}
                <div className="flex flex-col gap-[14px]">
                  <div>
                    <div className={labelCls}>Headline</div>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 58 }} value={activeContent.headline} onChange={(e) => set("headline", e.target.value)} />
                  </div>
                  <div>
                    <div className={labelCls}>Subtext</div>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 58 }} value={activeContent.subtext} onChange={(e) => set("subtext", e.target.value)} />
                  </div>
                  <div>
                    <div className={labelCls}>Call to action</div>
                    <input style={inputStyle} value={activeContent.cta} onChange={(e) => set("cta", e.target.value)} />
                  </div>
                </div>

                {/* Design — fonts, colors, layout */}
                <div className="pt-[18px] border-t border-white/[0.07] flex flex-col gap-[14px]">
                  <div>
                    <div className={labelCls}>Heading font</div>
                    <SummerFontPicker value={activeContent.headlineFont} onChange={(fam) => set("headlineFont", fam)} />
                  </div>

                  {/* Contextual element editor (Canva-style). */}
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
                      const size = activeContent.layout[target].size ?? 1;
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
                              <span className="flex-1 text-[11px] tabular-nums text-[#8C9AAE] uppercase">{activeContent.colors[target as keyof SummerColors]}</span>
                              <input
                                type="color"
                                value={activeContent.colors[target as keyof SummerColors]}
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

                  {/* Summer of AI logo */}
                  <div className="pt-[14px] border-t border-white/[0.07]">
                    <div className="flex items-center justify-between mb-[10px]">
                      <div className={labelCls} style={{ marginBottom: 0 }}>Summer of AI logo</div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={activeContent.logo.show}
                        onClick={() => set("logo", { ...activeContent.logo, show: !activeContent.logo.show })}
                        className="relative w-[42px] h-[24px] rounded-full transition-colors shrink-0"
                        style={{ background: activeContent.logo.show ? p.accent : "rgba(255,255,255,0.16)" }}
                        aria-label="Toggle logo"
                      >
                        <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: activeContent.logo.show ? 21 : 3 }} />
                      </button>
                    </div>

                    {activeContent.logo.show && (
                      <div className="flex flex-col gap-[12px]">
                        <div className="flex items-center gap-[12px]">
                          <span className="text-[11px] text-[#8C9AAE] w-[52px] shrink-0">Color</span>
                          <div className="flex gap-[6px]">
                            {(["yellow", "blue"] as const).map((v) => {
                              const on = activeContent.logo.variant === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => set("logo", { ...activeContent.logo, variant: v })}
                                  className="px-[12px] py-[6px] rounded-[8px] text-[11px] font-semibold capitalize flex items-center gap-[7px] transition-colors"
                                  style={{
                                    border: on ? `1px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)",
                                    background: on ? `${p.accent}22` : "rgba(255,255,255,0.04)",
                                    color: on ? "#fff" : "#CBD5E1",
                                  }}
                                >
                                  <span className="w-[13px] h-[13px] rounded-full" style={{ background: v === "yellow" ? "#FFD400" : "#2F86FF" }} />
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
                          <span className="text-[11px] tabular-nums text-[#8C9AAE] w-[42px] text-right">{Math.round((activeContent.layout.logo.size ?? 1) * 100)}%</span>
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

                {/* Background — generate with AI or upload your own */}
                <div className="pt-[18px] border-t border-white/[0.07]">
                  <div className={labelCls}>AI background · {theme.name} style</div>
                  <textarea
                    style={{ ...inputStyle, resize: "vertical", minHeight: 54 }}
                    value={activeCard.imagePrompt}
                    onChange={(e) => setPrompt(activeCard.id, e.target.value)}
                    onKeyDown={onPromptKeyDown}
                    placeholder="Describe the subject…  (⌘/Ctrl+Enter to generate)"
                  />
                  {referenceUploader()}
                  <button
                    onClick={() => void generateActive()}
                    disabled={activeCard.generating}
                    className="mt-[10px] w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
                    style={{ background: p.gradient, color: "#fff" }}
                  >
                    {activeCard.generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {activeCard.generating ? "Generating…" : "Generate background"}
                  </button>

                  <div className="flex items-center gap-[10px] my-[12px]">
                    <div className="h-px flex-1 bg-white/[0.08]" />
                    <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#5E6B82]">or</span>
                    <div className="h-px flex-1 bg-white/[0.08]" />
                  </div>

                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void uploadBg(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    disabled={activeCard.generating}
                    className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-colors bg-transparent border border-white/[0.16] text-[#D7DEEA] hover:border-white/[0.32] hover:text-white"
                  >
                    <Upload size={15} />
                    Upload your own image
                  </button>

                  {genError && <div className="text-[#ff9b9b] text-[12px] mt-[8px] leading-[1.45]">{genError}</div>}
                  {activeContent.bgImage && (
                    <button
                      onClick={() => set("bgImage", null)}
                      className="mt-[8px] w-full py-[9px] rounded-[10px] text-[12.5px] cursor-pointer bg-transparent border border-white/[0.14] text-[#94A3B8] hover:text-white hover:border-white/[0.25] transition-colors"
                    >
                      Clear background (use gradient)
                    </button>
                  )}

                  {/* Image overlay */}
                  <div className="mt-[16px]">
                    <div className={labelCls}>Image overlay</div>
                    <div className="flex items-center gap-[10px]">
                      <div className="flex gap-[5px] shrink-0">
                        {(["black", "white"] as const).map((c) => {
                          const on = activeContent.overlay.color === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setOverlay({ color: c, opacity: activeContent.overlay.opacity === 0 ? 0.35 : activeContent.overlay.opacity })}
                              className="w-[30px] h-[30px] rounded-[8px] cursor-pointer transition-transform"
                              style={{ background: c === "black" ? "#0A0A0A" : "#FFFFFF", border: on ? `2px solid ${p.accent}` : "1px solid rgba(255,255,255,0.22)" }}
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
                        value={activeContent.overlay.opacity}
                        onChange={(e) => setOverlay({ opacity: parseFloat(e.target.value) })}
                        className="flex-1 cursor-pointer"
                        style={{ accentColor: p.accent }}
                        aria-label="Overlay opacity"
                      />
                      <span className="text-[11px] tabular-nums text-[#8C9AAE] w-[42px] text-right">{Math.round(activeContent.overlay.opacity * 100)}%</span>
                    </div>
                    <p className="mt-[6px] text-[11px] text-[#8C9AAE] leading-[1.4]">
                      A flat {activeContent.overlay.color} layer over the image — dial up the opacity for cleaner, more legible text.
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
                            style={{ border: activeContent.bgImage === a.dataUrl ? `2px solid ${p.accent}` : "1px solid rgba(255,255,255,0.12)" }}
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
          </>
        )}
      </div>

      {/* RIGHT — preview stack / asset library */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-[20px] md:p-[30px]">
        {section === "assets" ? (
          <AssetGrid
            assets={assets}
            accent={p.accent}
            accentInk={accentInk}
            onUse={(url) => {
              setSection("social");
              setStacks((prev) => {
                const aid = prev.active.social;
                return { ...prev, cards: { ...prev.cards, social: prev.cards.social.map((c) => (c.id === aid ? { ...c, content: { ...c.content, bgImage: url } } : c)) } };
              });
            }}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-[18px] gap-[12px] flex-wrap">
              <div className="text-[13px] text-[#94A3B8]">
                {sectionCards.length} design{sectionCards.length === 1 ? "" : "s"}
                {generatingCount > 0 && <span className="ml-[8px] text-[#CBD5E1]">· generating {generatingCount}…</span>}
              </div>
              <button
                onClick={() => void exportZip()}
                disabled={exportingZip}
                className="flex items-center gap-[7px] py-[9px] px-[16px] rounded-[10px] font-bold text-[13px] cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: p.accent, color: accentInk }}
              >
                {exportingZip ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download all ({sectionCards.length}) ZIP
              </button>
            </div>

            {/* Card stack */}
            <div className="flex flex-col gap-[26px]">
              {sectionCards.map((card, i) => {
                const fmt = formatByKey(card.formatKey) ?? sectionFormats[0];
                const isActive = card.id === activeId;
                return (
                  <div
                    key={card.id}
                    ref={(el) => {
                      cardRefs.current.set(card.id, el);
                    }}
                    className="rounded-[18px] border p-[18px] transition-colors"
                    style={{ background: "rgba(0,0,0,0.28)", borderColor: isActive ? `${p.accent}66` : "rgba(255,255,255,0.07)" }}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-[14px] gap-[10px]">
                      <div className="flex items-center gap-[9px] min-w-0">
                        <span className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: `${p.accent}22`, color: p.accent }}>
                          {i + 1}
                        </span>
                        <span className="text-[13px] text-[#CBD5E1] font-semibold truncate">{fmt.label}</span>
                        <span className="text-[11px] text-[#64748B] shrink-0">{fmt.width}×{fmt.height}</span>
                        {isActive && (
                          <span className="text-[9px] font-bold uppercase tracking-[1px] px-[7px] py-[3px] rounded-full shrink-0" style={{ background: `${p.accent}22`, color: p.accent }}>
                            Editing
                          </span>
                        )}
                      </div>
                      <div className="flex gap-[6px] shrink-0">
                        <button onClick={() => duplicateCard(card.id)} title="Duplicate" className="p-[7px] rounded-[8px] bg-transparent border border-white/[0.12] text-[#94A3B8] cursor-pointer hover:text-white transition-colors">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => void exportCard(card.id)} title="Download PNG" className="p-[7px] rounded-[8px] bg-transparent border border-white/[0.12] text-[#94A3B8] cursor-pointer hover:text-white transition-colors">
                          <Download size={14} />
                        </button>
                        <button onClick={() => removeCard(card.id)} title="Remove" className="p-[7px] rounded-[8px] bg-transparent border border-white/[0.12] text-[#94A3B8] cursor-pointer hover:text-white transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="flex justify-center">
                      <div
                        className="relative"
                        style={{ width: stackWidth(fmt), maxWidth: "100%" }}
                        onPointerDown={() => {
                          if (!isActive) setActive(card.id);
                        }}
                      >
                        <ScaledCanvasPreview
                          theme={theme}
                          format={fmt}
                          content={card.content}
                          selected={isActive ? selected : null}
                          onSelect={isActive ? setSelected : undefined}
                          onMove={isActive ? (k, x, y) => moveElementFor(card.id, k, x, y) : undefined}
                        />
                        {card.generating && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-[8px]" style={{ background: "rgba(0,0,0,0.55)" }}>
                            <Loader2 size={26} className="animate-spin" color={p.accent} />
                          </div>
                        )}
                        {card.error && !card.generating && (
                          <div className="absolute bottom-[8px] left-[8px] right-[8px] text-[11px] text-[#ff9b9b] bg-black/70 rounded-[7px] px-[10px] py-[6px] leading-[1.35]">
                            {card.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add another */}
              <button
                onClick={addCard}
                className="flex items-center justify-center gap-[8px] py-[16px] rounded-[16px] font-semibold text-[13.5px] cursor-pointer border border-dashed border-white/[0.18] text-[#CBD5E1] hover:text-white hover:border-white/[0.32] transition-colors bg-transparent"
              >
                <Plus size={17} /> Add another
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden full-size export nodes for every card in the section */}
      <div style={{ position: "fixed", left: -99999, top: 0, opacity: 0, pointerEvents: "none" }} aria-hidden>
        {sectionCards.map((card) => {
          const fmt = formatByKey(card.formatKey);
          if (!fmt) return null;
          return (
            <SummerCanvasNode
              key={card.id}
              theme={theme}
              format={fmt}
              content={card.content}
              innerRef={(el) => {
                exportRefs.current[card.id] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Preview width per orientation, tuned for a vertical stack. */
function stackWidth(format: SummerFormat): number {
  const r = format.width / format.height;
  if (r < 0.7) return 300; // story / tall
  if (r < 0.95) return 380; // portrait
  if (r < 1.15) return 440; // square
  return 600; // wide
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
