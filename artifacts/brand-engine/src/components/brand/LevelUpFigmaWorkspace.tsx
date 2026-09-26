import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Search, Scissors, X } from "lucide-react";
import { toPng } from "html-to-image";
import { getFontEmbedCSS } from "./fontEmbed";
import { FIGMA_LAYOUTS, LevelUpFigmaCanvas, hydrateLevelUpEdits, levelUpArtworkAsset, levelUpCutout, levelUpRestore, type LevelUpCategory, type LevelUpEdits } from "./levelUpFigmaLayouts";
import { useLibrary } from "./levelUpStore";
import { useSessionState } from "./sessions/useSessionState";
import { addExport, createThumbnail } from "./exportStore";

// Vite's BASE_URL is the JS bundle prefix (/brand-engine/ in preview), but
// public/ assets are served from the app root. Prefixing it here returns the
// SPA HTML instead of an image at /brand-engine/levelup26/...
const assetBase = "/";
function canonicalAssetUrl(url: string | undefined) {
  if (!url) return "";
  const oldPrefix = `${import.meta.env.BASE_URL}levelup26/`;
  return oldPrefix !== "/levelup26/" && url.startsWith(oldPrefix) ? url.replace(oldPrefix, "/levelup26/") : url;
}
const CUTOUTS = new Set(["adley-kinsman", "alex-schlinsky", "brittainy-long", "kai-stone", "kaitlyn-lemus-portillo", "paige-battcher", "shawn-kanugo", "unnamed-photo", "yesenia-nelson"]);
function compositingUrl(url: string) {
  const name = url.match(/\/levelup26\/([^/?]+)\.png$/)?.[1];
  return name && CUTOUTS.has(name) ? `${assetBase}levelup26/cutouts/${name}.png` : url;
}
export interface FigmaPhoto { name: string; url: string; category: string }
interface FigmaAsset extends FigmaPhoto { id: string; kind: string }
const localAsset = (url: string) => /^\/levelup26\/[\w/-]+\.(png|jpe?g|webp|svg)$/i.test(url);
function useFigmaAssets() {
  const [assets, setAssets] = useState<FigmaAsset[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`${assetBase}levelup26/assets.json`).then(async r => {
      if (!r.ok) throw new Error(`LevelUp asset manifest could not load (${r.status})`);
      if (!r.headers.get("content-type")?.includes("application/json")) throw new Error("LevelUp asset manifest did not return JSON.");
      return r.json();
    }).then(data => {
      if (!Array.isArray(data.assets)) throw new Error("LevelUp asset manifest is invalid.");
      const entries = data.assets.filter((a: FigmaAsset) => a && typeof a.id === "string" && typeof a.name === "string" && typeof a.url === "string" && localAsset(a.url) && ["logo", "background", "speakerPortrait", "headshot", "unidentifiedPortrait"].includes(a.kind))
        .map((a: FigmaAsset) => ({ id: a.id, name: a.name, url: `${assetBase}${a.url.slice(1)}`, kind: a.kind, category: a.kind }));
      if (active) setAssets(entries);
    }).catch(e => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, []);
  return { assets, error };
}
export function useFigmaPhotos() {
  const { assets, error } = useFigmaAssets();
  return { photos: assets.filter(a => ["speakerPortrait", "headshot", "unidentifiedPortrait"].includes(a.kind)), error };
}

const categoryTitle: Record<LevelUpCategory, string> = {
  speaker: "Speaker Graphics", email: "Marketing Emails", community: "Community Posts", cover: "Social Covers"
};
const labels: (keyof Pick<LevelUpEdits, "name" | "headline" | "subline" | "date" | "cta">)[] = ["name", "headline", "subline", "date", "cta"];

export function LevelUpFigmaWorkspace({ category, social = false }: { category: LevelUpCategory; social?: boolean }) {
  const layouts = FIGMA_LAYOUTS.filter(l => l.category === category);
  const [layoutId, setLayoutId] = useSessionState(`lu26.${category}.layout`, layouts[0].id);
  const layout = layouts.find(l => l.id === layoutId) ?? layouts[0];
  const [drafts, setDrafts] = useSessionState<Record<string, LevelUpEdits>>(`lu26.${category}.edits`, {});
  const defaultPhoto = `${assetBase}levelup26/cutouts/alex-schlinsky.png`;
  const saved = drafts[layout.id];
  const edits: LevelUpEdits = saved ? hydrateLevelUpEdits(saved, canonicalAssetUrl) : {
    ...layout.defaults,
    photo: layout.id.startsWith("speaker-") ? defaultPhoto : layout.id === "email-building" ? `${assetBase}levelup26/email-building-photo-accent.png` : "",
    groupPhotos: layout.group ? ["paige-battcher", "adley-kinsman", "shawn-kanugo", "kaitlyn-lemus-portillo", "alex-schlinsky"].map(n => `${assetBase}levelup26/cutouts/${n}.png`) : []
  };
  const update = (patch: Partial<LevelUpEdits>) => setDrafts(previous => ({ ...previous, [layout.id]: { ...edits, ...patch } }));
  const lib = useLibrary();
  const { assets, error: manifestError } = useFigmaAssets();
  const photos = useMemo(() => assets.filter(a => ["speakerPortrait", "headshot", "unidentifiedPortrait"].includes(a.kind)), [assets]);
  const available = useMemo(() => [
    ...photos,
    ...lib.images.map(i => ({ name: i.name, url: i.fullUrl, category: "Drive Library" }))
  ], [photos, lib.images]);
  const [picker, setPicker] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [imageError, setImageError] = useState("");
  const [removingSlot, setRemovingSlot] = useState<number | null>(null);
  const imageRun = useRef(0);
  useEffect(() => {
    imageRun.current++;
    setRemovingSlot(null);
    setImageError("");
    return () => { imageRun.current++; };
  }, [layout.id]);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(600);
  useEffect(() => {
    if (!previewRef.current) return;
    const observer = new ResizeObserver(entries => setPreviewWidth(entries[0].contentRect.width));
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, []);
  const previewScale = Math.min(1, (previewWidth - 30) / layout.width, 580 / layout.height);
  const filtered = available.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()));

  async function choose(url: string) {
    const run = ++imageRun.current;
    const slot = picker;
    setRemovingSlot(null);
    setImageError("");
    try {
      // Remote Drive URLs must be inlined for cross-origin browser exports.
      const src = url.includes("/api/levelup/") || /^https?:/.test(url)
        ? await fetch(url).then(r => { if (!r.ok) throw new Error(`Image request failed (${r.status})`); return r.blob(); }).then(blob => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); }))
        : compositingUrl(url);
      if (run !== imageRun.current || slot === null) return;
      if (slot === -1) update({ photo: src, photoOriginal: src });
      else {
        const groupPhotos = Array.from({ length: Math.max(5, edits.groupPhotos.length) }, (_, i) => edits.groupPhotos[i] ?? "");
        const groupOriginals = Array.from({ length: groupPhotos.length }, (_, i) => edits.groupOriginals?.[i] ?? edits.groupPhotos[i] ?? "");
        groupPhotos[slot] = src;
        groupOriginals[slot] = src;
        update({ groupPhotos, groupOriginals });
      }
      setPicker(null);
      setExportError("");
    } catch (e) { if (run === imageRun.current) setImageError(`Could not use this image: ${(e as Error).message}`); }
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) { setImageError("Choose an image file."); return; }
    const run = ++imageRun.current;
    const reader = new FileReader();
    reader.onload = () => { if (run === imageRun.current) void choose(String(reader.result)); };
    reader.onerror = () => { if (run === imageRun.current) setImageError("Could not read image file."); };
    reader.readAsDataURL(file);
  }

  async function removePhotoBackground(slot: number) {
    const src = slot === -1 ? edits.photoOriginal || edits.photo : edits.groupOriginals?.[slot] || edits.groupPhotos[slot];
    if (!src) { setImageError("Select a photo before removing its background."); return; }
    const run = ++imageRun.current;
    setRemovingSlot(slot);
    setImageError("");
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Photo request failed (${response.status}): ${src}`);
      const input = await response.blob();
      if (!input.type.startsWith("image/")) throw new Error(`Photo returned ${input.type || "no content type"} instead of an image: ${src}`);
      // Validate image bytes before loading the (large) local inference model;
      // a SPA's HTML fallback can otherwise surface as IMG.LY's "Invalid format".
      const decoded = await createImageBitmap(input);
      decoded.close();
      if (run !== imageRun.current) return;
      const { removeBackground } = await import("@imgly/background-removal");
      // The result is a session-safe data URL, not a temporary object URL.
      const blob = await removeBackground(input, { model: "isnet_fp16", output: { format: "image/png" } });
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the transparent PNG."));
        reader.readAsDataURL(blob);
      });
      if (run !== imageRun.current) return;
      update(levelUpCutout(edits, slot, result, src));
    } catch (e) {
      if (run === imageRun.current) setImageError(`Background removal failed; original photo kept. ${(e as Error).message}`);
    } finally {
      if (run === imageRun.current) setRemovingSlot(null);
    }
  }

  async function download() {
    if (!exportRef.current) return;
    setExporting(true);
    setExportError("");
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(exportRef.current.querySelectorAll("img")).map(async img => { await img.decode(); }));
      // html-to-image clones CSS backgrounds separately; verify the selected asset is loadable.
      if (edits.backgroundUrl) {
        const bg = new Image();
        bg.src = edits.backgroundUrl;
        await bg.decode();
      }
      const fontEmbedCSS = await getFontEmbedCSS();
      const data = await toPng(exportRef.current, { width: layout.width, height: layout.height, pixelRatio: 1, cacheBust: true, backgroundColor: "#09233f", fontEmbedCSS });
      const link = document.createElement("a");
      link.href = data;
      link.download = `levelup26-${layout.id}-${layout.width}x${layout.height}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      addExport({ name: `LevelUp 26 ${layout.title}`, source: categoryTitle[category], format: "PNG", thumbnail: await createThumbnail(data), dimensions: `${layout.width}×${layout.height}`, mode: "levelup26", templateId: layout.id });
    } catch (e) { setExportError(`Export failed: ${(e as Error).message}`); }
    finally { setExporting(false); }
  }

  const field = "w-full min-w-0 bg-[#071b31] border border-white/[0.12] rounded-[9px] px-3 py-2 text-[12px] text-white outline-none focus:border-[#2896FB]";
  const secondary = "rounded-[9px] border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.09] px-3 py-2 text-[12px] font-semibold text-slate-200 disabled:opacity-50";
  const sourceOriginal = edits.photoOriginal || edits.photo;
  return <div className="flex-1 min-h-0 flex flex-col overflow-hidden text-white">
    <header className="px-5 lg:px-7 pt-5 pb-4 border-b border-white/[0.07]">
      <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#2896FB]">LevelUp 26 / Source layouts</div>
      <h1 className="text-[20px] font-bold mt-1">{social ? "Social Posts · Speaker Formats" : categoryTitle[category]}</h1>
      <p className="text-[12px] text-slate-400 mt-1">Edit the supplied source frames. Photo and layout coverage is partial; save your session to keep changes.{social ? " The separate Social Posts page was not supplied." : ""}</p>
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(310px,370px)_minmax(0,1fr)] gap-5 p-5 lg:px-7">
      <aside className="space-y-4 min-w-0">
        <section className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
          <h2 className="text-[13px] font-bold">Source frame</h2>
          <select data-testid="select-lu26-layout" aria-label="Source frame" value={layout.id} onChange={e => setLayoutId(e.target.value)} className={field}>{layouts.map(l => <option key={l.id} value={l.id}>{l.title} · {l.width} × {l.height}</option>)}</select>
          <p className="text-[11px] text-slate-500">Figma frame {layout.sourceNode}</p>
        </section>
        <section className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
          <h2 className="text-[13px] font-bold">Content</h2>
          {labels.filter(key => key !== "name" || category === "speaker").filter(key => key !== "subline" || ["speaker", "cover"].includes(category)).filter(key => key !== "cta" || !layout.id.startsWith("community-")).filter(key => key !== "date" || layout.id === "community-webinar" || !layout.id.startsWith("community-")).filter(key => key !== "headline" || category !== "speaker").map(key => <label className="block" key={key}><span className="block text-[11px] font-medium text-slate-300 mb-1">{key === "subline" ? "Supporting copy" : key === "cta" ? "Button copy" : key === "date" ? "Date / location" : key === "name" ? "Speaker name" : "Headline"}</span>{key === "headline" || key === "subline" ? <textarea data-testid={`input-lu26-${key}`} rows={2} value={edits[key]} onChange={e => update({ [key]: e.target.value })} className={field} /> : <input data-testid={`input-lu26-${key}`} value={edits[key]} onChange={e => update({ [key]: e.target.value })} className={field} />}</label>)}
        </section>
        <section className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
          <h2 className="text-[13px] font-bold">Artwork assets</h2>
          <label className="block text-[11px] text-slate-300">Background
            <select data-testid="select-lu26-background" value={edits.backgroundAssetId || ""} onChange={e => { const a = assets.find(item => item.id === e.target.value); update(levelUpArtworkAsset(edits, "background", a?.id || "", a?.url || "")); }} className={`${field} mt-1`}>
              <option value="">Source default · dark gradient</option>{assets.filter(a => a.kind === "background").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-slate-300">LevelUp logo
            <select data-testid="select-lu26-logo" value={edits.logoAssetId || ""} onChange={e => { const a = assets.find(item => item.id === e.target.value); update(levelUpArtworkAsset(edits, "logo", a?.id || "", a?.url || "")); }} className={`${field} mt-1`}>
              <option value="">Source default · light logo + HighLevel</option>{assets.filter(a => a.kind === "logo").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <p className="text-[11px] text-slate-500">Only verified files in the supplied LevelUp manifest are shown. Other background and 3D icon collections were not supplied.</p>
        </section>
        {layout.photo && <section className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
          <h2 className="text-[13px] font-bold">Photography</h2>
          {layout.group ? Array.from({ length: 5 }, (_, i) => <div key={i} className="flex gap-2 items-center">
            <button data-testid={`button-photo-slot-${i}`} onClick={() => { setSearch(""); setPicker(i); }} className={`${secondary} flex-1 text-left`}>Speaker {i + 1} · {edits.groupPhotos[i] ? "Change photo" : "Choose photo"}</button>
            {edits.groupPhotos[i] && <button data-testid={`button-remove-bg-slot-${i}`} title="Remove background" aria-label={`Remove speaker ${i + 1} background`} disabled={removingSlot !== null} onClick={() => void removePhotoBackground(i)} className={secondary}><Scissors size={15} /></button>}
            {edits.groupOriginals?.[i] && edits.groupOriginals[i] !== edits.groupPhotos[i] && <button data-testid={`button-restore-photo-slot-${i}`} onClick={() => update(levelUpRestore(edits, i))} className={secondary}>Undo</button>}
          </div>) : <>
            <button data-testid="button-choose-speaker-photo" onClick={() => { setSearch(""); setPicker(-1); }} className={`${secondary} w-full inline-flex items-center justify-center gap-2`}><ImagePlus size={15} /> Choose or upload photo</button>
            {edits.photo && <div className="flex gap-2">
              <button data-testid="button-remove-lu26-background" disabled={removingSlot !== null} onClick={() => void removePhotoBackground(-1)} className={`${secondary} flex-1 inline-flex items-center justify-center gap-2`}><Scissors size={14} />{removingSlot === -1 ? "Removing background…" : "Remove background"}</button>
              {sourceOriginal !== edits.photo && <button data-testid="button-restore-lu26-photo" onClick={() => update(levelUpRestore(edits, -1))} className={secondary}>Restore original</button>}
            </div>}
            {category === "speaker" && <div className="grid grid-cols-2 gap-2">{(["photoX", "photoY"] as const).map(key => <label key={key} className="text-[11px] text-slate-300">{key === "photoX" ? "Horizontal offset %" : "Vertical offset %"}<input data-testid={`input-lu26-${key}`} type="number" min="-50" max="50" step="1" className={`${field} mt-1`} value={edits[key] ?? 0} onChange={e => update({ [key]: Number(e.target.value) })} /></label>)}</div>}
          </>}
          {removingSlot !== null && <div className="flex items-center justify-between gap-2"><span role="status" data-testid="status-lu26-removal" className="text-[11px] text-[#2896FB]">Removing background from {removingSlot === -1 ? "photo" : `speaker ${removingSlot + 1}`}…</span><button data-testid="button-cancel-lu26-removal" onClick={() => { imageRun.current++; setRemovingSlot(null); }} className={secondary}>Cancel</button></div>}
          {imageError && <p role="alert" data-testid="error-lu26-image" className="text-[11px] text-red-300">{imageError}</p>}
        </section>}
      </aside>
      <main className="min-w-0 flex flex-col">
        <div className="flex items-center gap-3 mb-3 flex-wrap"><span className="text-[12px] text-slate-400">{layout.title} · {layout.width} × {layout.height}</span><button data-testid="button-download-lu26" disabled={exporting} onClick={download} className="ml-auto bg-[#2896FB] hover:bg-[#1685eb] text-white font-semibold text-[12px] rounded-[9px] px-4 py-2 inline-flex items-center gap-2 disabled:opacity-60"><Download size={15} /> {exporting ? "Rendering…" : "Download PNG"}</button></div>
        <p data-testid="warning-lu26-source-font" className="text-[11px] text-amber-200/80 mb-3">Source typography cannot be reproduced exactly: the licensed Monument Extended font file and verified 2026 font specifications were not supplied. Preview and PNG use available fallback fonts.</p>
        {manifestError && <p role="alert" className="text-[11px] text-amber-300 mb-3">{manifestError}</p>}
        {exportError && <p role="alert" className="text-red-300 text-xs mb-3">{exportError}</p>}
        <div ref={previewRef} className="rounded-[16px] border border-white/[0.07] bg-[#030b17] min-h-[320px] flex items-center justify-center p-4 overflow-hidden">
          <div data-session-preview style={{ width: layout.width * previewScale, height: layout.height * previewScale, flexShrink: 0, overflow: "hidden" }}>
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}><LevelUpFigmaCanvas layout={layout} edits={edits} /></div>
          </div>
        </div>
      </main>
    </div>
    <div aria-hidden style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none" }}><div ref={exportRef}><LevelUpFigmaCanvas layout={layout} edits={edits} /></div></div>
    {picker !== null && <div role="dialog" aria-label="Choose LevelUp photo" className="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center" onClick={() => { imageRun.current++; setPicker(null); }}><div onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[85vh] bg-[#0b1930] border border-white/10 rounded-[16px] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-[16px]">Choose a photo</h2><button data-testid="button-close-lu26-picker" aria-label="Close picker" onClick={() => { imageRun.current++; setPicker(null); }}><X size={20} /></button></div>
      <label className="flex items-center gap-2 border border-white/10 rounded-[9px] px-3 mb-3"><Search size={16} /><input data-testid="input-search-lu26-photos" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sourced LevelUp portraits and Drive images" className="bg-transparent p-3 text-sm flex-1 outline-none" /></label>
      <label className="cursor-pointer text-xs text-[#2896FB] mb-3">Upload a photo from your computer<input data-testid="input-upload-lu26-photo" type="file" accept="image/*" className="sr-only" onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0]); e.target.value = ""; }} /></label>
      {imageError && <p role="alert" className="text-red-300 text-xs mb-3">{imageError}</p>}
      {manifestError && <div role="alert" className="text-amber-300 text-xs mb-3">{manifestError}</div>}
      <div className="overflow-auto grid grid-cols-2 sm:grid-cols-4 gap-3">{filtered.map((p, i) => <button data-testid={`button-select-lu26-photo-${i}`} key={`${p.url}-${i}`} onClick={() => void choose(p.url)} className="bg-white/5 hover:bg-white/10 p-1 rounded-[9px] text-left"><img loading="lazy" src={p.url} alt={p.name} className="aspect-square w-full object-contain bg-black/30 rounded" /><span className="block text-xs mt-2 truncate px-1">{p.name}</span><span className="block text-[10px] text-slate-400 px-1 truncate">{p.category}</span></button>)}</div>
      {filtered.length === 0 && <p className="text-sm text-slate-400">No matching photos. Upload an image above or import one in the Image Library.</p>}
    </div></div>}
  </div>;
}