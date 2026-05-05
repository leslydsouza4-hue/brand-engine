import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Sparkles, Loader2, Download, RefreshCw, ArrowLeftRight, Check, Image as ImageIcon, Wand2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { useLibrary, searchLibrary, extractPeopleCount, type LibraryImage } from "./levelUpStore";
import { LEVELUP_TEMPLATES, SOCIAL_SIZES, LevelUpCanvas, pickTemplateForBrief, emptyBrief, type LevelUpTemplate, type SocialSize, type PostBrief } from "./levelUpTemplates";
import { BRAND_THEMES } from "./brandModeStore";
import { addExport, createThumbnail } from "./exportStore";

const theme = BRAND_THEMES.levelup26;

function urlToDataUrl(u: string): Promise<string> {
  return fetch(u)
    .then((r) => r.blob())
    .then((b) => new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(b);
    }));
}

export function LevelUpComposerWorkspace() {
  const lib = useLibrary();
  const [brief, setBrief] = useState<PostBrief>(emptyBrief());
  const [smartBrief, setSmartBrief] = useState("");
  const [picked, setPicked] = useState<{ template: LevelUpTemplate; reason: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState<SocialSize>(SOCIAL_SIZES[0]);
  const [photoCandidates, setPhotoCandidates] = useState<LibraryImage[]>([]);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      let parsed: { keywords?: string[]; peopleCount?: number | null; vibe?: string[]; mood?: string | null; scene?: string | null } = {};
      try {
        const r = await fetch("/api/levelup/vision/parse-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: smartBrief }),
        });
        if (r.ok) parsed = await r.json();
      } catch {
        /* fall back to local heuristics below */
      }
      const peopleCount = parsed.peopleCount ?? extractPeopleCount(smartBrief);
      const vibeHints = parsed.vibe ?? [];

      // Pull anything that looks like a headline / CTA / date out of the
      // brief — simple regex sweeps. The user can override in the form.
      const headlineMatch = smartBrief.match(/(?:headline|tagline|title|saying)\s*[:\-]\s*"?([^"\n]+)"?/i);
      const ctaMatch = smartBrief.match(/(?:cta|call to action|button)\s*[:\-]\s*"?([^"\n]+)"?/i);
      const dateMatch = smartBrief.match(/\b(?:on |dated |date[:\-] ?)?(\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?|[A-Z][a-z]+\s+\d{1,2}(?:[-–]\d{1,2})?,?\s*\d{0,4}|Q[1-4]\s*\d{4})/);
      const newBrief: PostBrief = {
        ...emptyBrief(),
        headline: headlineMatch?.[1]?.trim() || smartBrief.split(".")[0]?.slice(0, 80) || "",
        subtext: smartBrief.split(".").slice(1).join(".").trim().slice(0, 140),
        cta: ctaMatch?.[1]?.trim() || "",
        date: dateMatch?.[1]?.trim() || "",
        photos: [],
        desiredPeopleCount: peopleCount,
        vibeHints,
        attribution: "",
        guestName: "",
        guestRole: "",
        location: "",
      };

      // Find best photo candidates from the library.
      const matches = searchLibrary(lib.images, smartBrief, 8);
      setPhotoCandidates(matches);
      const initialPhotos = matches.slice(0, 3).map((m) => m.fullUrl);
      newBrief.photos = initialPhotos;

      const pick = pickTemplateForBrief(newBrief);
      setBrief(newBrief);
      setPicked(pick);

      // Convert chosen photos to data URLs so html-to-image can export them
      // without CORS issues. We do this lazily for just the visible photos.
      const dataUrls = await Promise.all(initialPhotos.map((u) => urlToDataUrl(u).catch(() => "")));
      setPhotoDataUrls(dataUrls);
    } finally {
      setGenerating(false);
    }
  }, [smartBrief, lib.images]);

  // Re-pick template when photo count changes manually
  useEffect(() => {
    if (!picked) return;
    if (brief.photos.length === picked.template.photoMode) return;
    // Don't auto-repick if user is editing manually — only when the photo
    // array length implies a different template family.
  }, [brief.photos.length, picked]);

  const swapPhoto = useCallback(async (slot: number, candidate: LibraryImage) => {
    const next = [...brief.photos];
    next[slot] = candidate.fullUrl;
    setBrief({ ...brief, photos: next });
    const data = await urlToDataUrl(candidate.fullUrl).catch(() => "");
    setPhotoDataUrls((prev) => {
      const arr = [...prev];
      arr[slot] = data;
      return arr;
    });
  }, [brief]);

  const exportSize = useCallback(async (size: SocialSize): Promise<string | null> => {
    const node = previewRefs.current[size.key];
    if (!node) return null;
    try {
      const png = await toPng(node, {
        pixelRatio: size.width / node.getBoundingClientRect().width,
        skipFonts: true,
        cacheBust: true,
        backgroundColor: "#000",
      });
      return png;
    } catch (e) {
      console.error("export failed", e);
      return null;
    }
  }, []);

  const downloadOne = useCallback(async () => {
    if (!picked) return;
    setExporting(true);
    try {
      const png = await exportSize(selectedSize);
      if (!png) return;
      const a = document.createElement("a");
      a.href = png;
      a.download = `levelup26-${picked.template.id}-${selectedSize.key}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      const thumb = await createThumbnail(png);
      addExport({ name: `LU26 ${picked.template.name} (${selectedSize.label})`, source: "LevelUp 26 Composer", format: "PNG", thumbnail: thumb, dimensions: `${selectedSize.width}×${selectedSize.height}`, mode: "levelup26", templateId: picked.template.id });
    } finally {
      setExporting(false);
    }
  }, [exportSize, picked, selectedSize]);

  const downloadZip = useCallback(async () => {
    if (!picked) return;
    setExportingZip(true);
    try {
      const zip = new JSZip();
      for (const size of SOCIAL_SIZES) {
        const png = await exportSize(size);
        if (!png) continue;
        const b64 = png.split(",")[1];
        zip.file(`levelup26-${picked.template.id}-${size.key}-${size.width}x${size.height}.png`, b64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `levelup26-${picked.template.id}-size-pack.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addExport({ name: `LU26 ${picked.template.name} — Size Pack`, source: "LevelUp 26 Composer", format: "ZIP", thumbnail: "", dimensions: "4 sizes", mode: "levelup26", templateId: picked.template.id });
    } finally {
      setExportingZip(false);
    }
  }, [exportSize, picked]);

  // Brief used for actual rendering — swaps photo URLs with data URLs.
  const renderBrief: PostBrief = useMemo(() => {
    if (!picked) return brief;
    return { ...brief, photos: brief.photos.map((u, i) => photoDataUrls[i] || u) };
  }, [brief, picked, photoDataUrls]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-[28px] pt-[20px] pb-[14px]">
        <div className="flex items-center gap-[12px] mb-[6px]">
          <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
            <Wand2 className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <div className="text-[18px] font-bold text-white tracking-[-0.3px]">Social Post Composer</div>
            <div className="text-[12px] text-[#94A3B8]">Describe the post in plain English. We pick the template + photos automatically.</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[28px] pb-[28px] flex flex-col lg:flex-row gap-[24px]">
        <div className="lg:w-[400px] shrink-0 space-y-[14px]">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[6px]">Brief</label>
            <textarea
              value={smartBrief}
              onChange={(e) => setSmartBrief(e.target.value)}
              rows={6}
              placeholder='Examples:&#10;&#10;"Make a social post celebrating Day 1 of the summit. 4 guys taking a selfie. Tagline: The energy was unreal."&#10;&#10;"Speaker spotlight for Sarah Chen, Founder of Acme. Date: April 25. CTA: Save my seat."'
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[12px] px-[14px] py-[12px] text-[13px] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[var(--lu-accent)] resize-none"
              style={{ ['--lu-accent' as never]: theme.accent }}
            />
          </div>
          <button
            onClick={generate}
            disabled={generating || !smartBrief.trim() || lib.images.length === 0}
            className="w-full px-[16px] py-[12px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: theme.cta, color: "#10031F" }}
          >
            {generating ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Sparkles className="w-[14px] h-[14px]" />}
            Generate Post
          </button>
          {lib.images.length === 0 && (
            <div className="text-[11px] text-amber-300/80">Ingest a Drive folder in the Image Library workspace first.</div>
          )}

          {picked && (
            <>
              <div className="border-t border-white/[0.06] pt-[14px]">
                <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[6px]">Template Pick</div>
                <div className="flex items-center gap-[10px] p-[10px] rounded-[10px] bg-white/[0.04] border border-white/[0.06]">
                  <Check className="w-[14px] h-[14px]" style={{ color: theme.accent }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-white">{picked.template.name}</div>
                    <div className="text-[11px] text-[#94A3B8]">{picked.reason}</div>
                  </div>
                </div>
                <select
                  value={picked.template.id}
                  onChange={(e) => {
                    const t = LEVELUP_TEMPLATES.find((x) => x.id === e.target.value);
                    if (t) setPicked({ template: t, reason: t.description });
                  }}
                  className="w-full mt-[6px] bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[10px] py-[7px] text-[12px] text-white cursor-pointer"
                >
                  {LEVELUP_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#10031F]">
                      {t.name} {t.photoMode === 0 ? "(text-only)" : `(${t.photoMode} photo${t.photoMode > 1 ? "s" : ""})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-[8px]">
                <Field label="Headline" value={brief.headline} onChange={(v) => setBrief({ ...brief, headline: v })} full />
                <Field label="Subtext" value={brief.subtext} onChange={(v) => setBrief({ ...brief, subtext: v })} full textarea />
                <Field label="CTA" value={brief.cta} onChange={(v) => setBrief({ ...brief, cta: v })} />
                <Field label="Date" value={brief.date} onChange={(v) => setBrief({ ...brief, date: v })} />
                <Field label="Guest Name" value={brief.guestName} onChange={(v) => setBrief({ ...brief, guestName: v })} />
                <Field label="Guest Role" value={brief.guestRole} onChange={(v) => setBrief({ ...brief, guestRole: v })} />
                <Field label="Location" value={brief.location} onChange={(v) => setBrief({ ...brief, location: v })} />
                <Field label="Attribution" value={brief.attribution} onChange={(v) => setBrief({ ...brief, attribution: v })} />
              </div>

              {picked.template.photoMode > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[6px]">Photos in Use</div>
                  <div className="flex gap-[8px] mb-[10px]">
                    {Array.from({ length: picked.template.photoMode }).map((_, slot) => (
                      <div key={slot} className="flex-1 aspect-square rounded-[10px] overflow-hidden bg-black border border-white/[0.08] relative">
                        {brief.photos[slot] ? (
                          <img src={brief.photos[slot]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#64748B]"><ImageIcon className="w-[20px] h-[20px]" /></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[6px]">Tap to swap (matched from library)</div>
                  <div className="grid grid-cols-4 gap-[6px] max-h-[280px] overflow-y-auto">
                    {photoCandidates.map((c) => (
                      <PhotoSwap key={c.id} cand={c} onSwap={(slot) => swapPhoto(slot, c)} slots={picked.template.photoMode} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {picked && (
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-[8px] mb-[12px] flex-wrap">
              {SOCIAL_SIZES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSize(s)}
                  className="px-[12px] py-[6px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: selectedSize.key === s.key ? theme.accent : "rgba(255,255,255,0.04)",
                    color: selectedSize.key === s.key ? "#0A0118" : "#CBD5E1",
                    border: `1px solid ${selectedSize.key === s.key ? theme.accent : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {s.label} <span className="opacity-60">{s.width}×{s.height}</span>
                </button>
              ))}
              <div className="ml-auto flex gap-[6px]">
                <button
                  onClick={downloadOne}
                  disabled={exporting}
                  className="px-[14px] py-[8px] rounded-[8px] text-[12px] font-bold flex items-center gap-[6px] cursor-pointer disabled:opacity-50"
                  style={{ background: theme.cta, color: "#10031F" }}
                >
                  {exporting ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
                  Download
                </button>
                <button
                  onClick={downloadZip}
                  disabled={exportingZip}
                  className="px-[14px] py-[8px] rounded-[8px] text-[12px] font-bold flex items-center gap-[6px] cursor-pointer disabled:opacity-50 border"
                  style={{ borderColor: theme.accent, color: theme.accent }}
                >
                  {exportingZip ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
                  All 4 Sizes (.zip)
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 rounded-[18px] bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] flex items-center justify-center p-[24px] overflow-hidden">
              <div
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  aspectRatio: `${selectedSize.width}/${selectedSize.height}`,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div ref={(el) => { previewRefs.current[selectedSize.key] = el; }} style={{ width: "100%", height: "100%" }}>
                  <LevelUpCanvas template={picked.template} size={selectedSize} brief={renderBrief} />
                </div>
              </div>
            </div>

            {/* Hidden offscreen renderers for the other sizes — needed by the
                ZIP export so we can capture each size at full resolution
                without forcing the user to click each tab. */}
            <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
              {SOCIAL_SIZES.filter((s) => s.key !== selectedSize.key).map((s) => (
                <div key={s.key} style={{ width: s.width, height: s.height }} ref={(el) => { previewRefs.current[s.key] = el; }}>
                  <LevelUpCanvas template={picked.template} size={s} brief={renderBrief} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!picked && (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-[420px]">
              <Wand2 className="w-[48px] h-[48px] mx-auto mb-[14px]" style={{ color: theme.accent }} />
              <div className="text-[16px] font-semibold text-white mb-[6px]">Describe a post to start</div>
              <div className="text-[13px] text-[#94A3B8]">Type a brief on the left and we'll pick the right template, find matching photos in your library, and render the design.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, full, textarea }: { label: string; value: string; onChange: (v: string) => void; full?: boolean; textarea?: boolean }) {
  return (
    <label className={full ? "block col-span-2" : "block"}>
      <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[4px]">{label}</div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[8px] py-[5px] text-[12px] text-white resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[8px] py-[5px] text-[12px] text-white" />
      )}
    </label>
  );
}

function PhotoSwap({ cand, onSwap, slots }: { cand: LibraryImage; onSwap: (slot: number) => void; slots: number }) {
  const [open, setOpen] = useState(false);
  if (slots === 1) {
    return (
      <button onClick={() => onSwap(0)} className="aspect-square rounded-[6px] overflow-hidden bg-black border border-white/[0.06] hover:border-white/[0.2] cursor-pointer">
        <img src={cand.thumbUrl} alt="" className="w-full h-full object-cover" />
      </button>
    );
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full aspect-square rounded-[6px] overflow-hidden bg-black border border-white/[0.06] hover:border-white/[0.2] cursor-pointer">
        <img src={cand.thumbUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
          <ArrowLeftRight className="w-[14px] h-[14px] text-white" />
        </div>
      </button>
      {open && (
        <div className="absolute z-10 left-0 top-full mt-[2px] bg-[#10031F] border border-white/[0.1] rounded-[6px] p-[4px] flex gap-[2px]">
          {Array.from({ length: slots }).map((_, i) => (
            <button key={i} onClick={() => { onSwap(i); setOpen(false); }} className="px-[8px] py-[3px] text-[10px] rounded-[4px] hover:bg-white/[0.1] text-white cursor-pointer">
              Slot {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
