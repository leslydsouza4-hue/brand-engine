import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Award, Plus, Download, Upload, Loader2, Trash2, Copy, Eraser } from "lucide-react";
import { getFontEmbedCSS } from "./fontEmbed";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/certified-admin/bg.jpg`;
const BADGE_URL = `${BASE}assets/certified-admin/badge.png`;
const LOGO_URL = `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`;

const CARD_SIZE = 1080;

interface AdminCard {
  id: string;
  name: string;
  directory: string;
  photo: string | null;
  photoX: number;
  photoY: number;
  photoScale: number;
  showBadge: boolean;
}

function newId() {
  return `ca_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeCard(): AdminCard {
  return { id: newId(), name: "Certified Admin Name", directory: "directory.gohighlevel.com", photo: null, photoX: 50, photoY: 50, photoScale: 1, showBadge: true };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const BULK_LIMIT = 30;

/** Turn a Drive filename ("Jane_Doe.png" / "jane-doe.jpg") into a person name. */
function nameFromFilename(fn: string): string {
  const base = fn.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "Certified Admin Name";
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return blobToDataUrl(await res.blob());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );
}

async function nodeToPng(node: HTMLElement, fontEmbedCSS: string): Promise<string> {
  await waitForImages(node);
  return toPng(node, { width: CARD_SIZE, height: CARD_SIZE, pixelRatio: 1, cacheBust: true, fontEmbedCSS });
}

function triggerDownload(href: string, name: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function safeName(s: string): string {
  return (s || "certified-admin").trim().replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_") || "certified-admin";
}

/** The fixed Certified Admin graphic. All sizing in cqw so it scales to its container. */
function CertifiedAdminCard({
  card,
  interactive = false,
  onMovePhoto,
}: {
  card: AdminCard;
  interactive?: boolean;
  onMovePhoto?: (x: number, y: number) => void;
}) {
  const circleRef = useRef<HTMLDivElement | null>(null);
  const canDrag = interactive && !!card.photo && !!onMovePhoto;

  const startDrag = (e: React.PointerEvent) => {
    if (!canDrag || !circleRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = circleRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = card.photoX;
    const baseY = card.photoY;
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      onMovePhoto!(clamp(baseX - dx, 0, 100), clamp(baseY - dy, 0, 100));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div
      style={{
        containerType: "inline-size",
        aspectRatio: "1 / 1",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0A1B38 0%, #103C7A 55%, #2B7FFF 100%)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Background */}
      <img src={BG_URL} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      {/* HighLevel logo */}
      <img
        src={LOGO_URL}
        alt="HighLevel"
        style={{ position: "absolute", top: "6.5cqw", left: "6.5cqw", width: "27cqw", height: "auto" }}
      />

      {/* Heading */}
      <div
        style={{
          position: "absolute",
          left: "6.5cqw",
          top: "23cqw",
          width: "48cqw",
          fontWeight: 700,
          fontSize: "10.5cqw",
          lineHeight: 1.0,
          letterSpacing: "-0.01em",
          textAlign: "left",
          backgroundImage: "linear-gradient(180deg, #9CC6FB 0%, #FFFFFF 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        Certified<br />Admin
      </div>

      {/* Name */}
      <div
        style={{
          position: "absolute",
          left: "6.5cqw",
          top: "51cqw",
          width: "46cqw",
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: "4.9cqw",
          lineHeight: 1.14,
          textAlign: "left",
          wordBreak: "break-word",
          whiteSpace: "pre-line",
        }}
      >
        {card.name || " "}
      </div>

      {/* Directory URL */}
      <div
        style={{
          position: "absolute",
          left: "6.5cqw",
          bottom: "7cqw",
          color: "#FFFFFF",
          fontWeight: 400,
          fontSize: "3.4cqw",
        }}
      >
        {card.directory}
      </div>

      {/* Profile circle + badge */}
      <div style={{ position: "absolute", right: "6.5cqw", top: "50%", transform: "translateY(-50%)", width: "37cqw", height: "37cqw" }}>
        <div
          ref={circleRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: "0 0 0 0.6cqw rgba(124,200,255,0.9), 0 0 5cqw rgba(91,168,255,0.55)",
            touchAction: canDrag ? "none" : undefined,
          }}
        >
          {card.photo ? (
            <img
              src={card.photo}
              alt={card.name}
              draggable={false}
              onPointerDown={startDrag}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${card.photoX}% ${card.photoY}%`,
                transform: `scale(${card.photoScale})`,
                transformOrigin: "center",
                cursor: canDrag ? "grab" : undefined,
                userSelect: "none",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2B5C9E", fontSize: "3.4cqw", fontWeight: 500, textAlign: "center", padding: "0 4cqw" }}>
              Add a Certified Admin photo
            </div>
          )}
        </div>
        {card.showBadge && (
          <img
            src={BADGE_URL}
            alt="Certified Admin badge"
            style={{ position: "absolute", bottom: "-4cqw", right: "-1cqw", width: "17cqw", height: "17cqw", objectFit: "contain", filter: "drop-shadow(0 0.4cqw 1cqw rgba(0,0,0,0.4))" }}
          />
        )}
      </div>
    </div>
  );
}

export function CertifiedAdminWorkspace() {
  const [cards, setCards] = useState<AdminCard[]>(() => [makeCard()]);
  const [activeId, setActiveId] = useState<string>(() => cards[0].id);
  const [removeBg, setRemoveBg] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [bgMsg, setBgMsg] = useState<string | null>(null);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const active = cards.find((c) => c.id === activeId) ?? cards[0];

  const updateCard = useCallback((id: string, patch: Partial<AdminCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const addCard = () => {
    const c = makeCard();
    setCards((prev) => [...prev, c]);
    setActiveId(c.id);
  };

  const duplicateCard = (id: string) => {
    const src = cards.find((c) => c.id === id);
    if (!src) return;
    const copy = { ...src, id: newId() };
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveId(copy.id);
  };

  const removeCard = (id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = makeCard();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const importFromDrive = async () => {
    const url = driveUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setImportMsg("Reading folder…");
    try {
      const r = await fetch("/api/levelup/drive/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderUrl: url }),
      });
      if (!r.ok) {
        const e = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${r.status}`);
      }
      const data = (await r.json()) as { files: { name: string; fullUrl: string }[] };
      const all = data.files ?? [];
      if (all.length === 0) throw new Error("No images found in that folder. Make sure it's shared as 'anyone with the link'.");
      const files = all.slice(0, BULK_LIMIT);
      const results: (AdminCard | null)[] = new Array(files.length).fill(null);
      let failed = 0;
      let done = 0;
      let next = 0;
      const CONCURRENCY = 8;
      const worker = async () => {
        for (let i = next++; i < files.length; i = next++) {
          const f = files[i];
          try {
            const dataUrl = await urlToDataUrl(f.fullUrl);
            results[i] = { ...makeCard(), name: nameFromFilename(f.name), photo: dataUrl };
          } catch (err) {
            failed++;
            console.error("Drive image import failed:", f.name, err);
          }
          done++;
          setImportMsg(`Processing ${done} of ${files.length}…`);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
      const newCards = results.filter((c): c is AdminCard => c !== null);
      if (newCards.length === 0) throw new Error("Could not load any images from that folder.");
      setCards((prev) => {
        const pristine = prev.length === 1 && !prev[0].photo && prev[0].name === "Certified Admin Name";
        return pristine ? newCards : [...prev, ...newCards];
      });
      setActiveId(newCards[0].id);
      const skipped = all.length > BULK_LIMIT ? ` (folder had ${all.length}; limited to ${BULK_LIMIT})` : "";
      const failedNote = failed > 0 ? `, ${failed} skipped` : "";
      setImportMsg(`Imported ${newCards.length} card${newCards.length > 1 ? "s" : ""}${failedNote}${skipped}.`);
    } catch (err) {
      setImportMsg((err as Error).message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handlePhoto = async (id: string, files: FileList | null) => {
    const file = files && Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setBusy(id);
    try {
      let dataUrl = await blobToDataUrl(file);
      if (removeBg) {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(dataUrl, { output: { format: "image/png" } });
        dataUrl = await blobToDataUrl(blob);
      }
      updateCard(id, { photo: dataUrl, photoX: 50, photoY: 50, photoScale: 1 });
    } catch (err) {
      console.error("Photo processing failed:", err);
    } finally {
      setBusy(null);
    }
  };

  const removeCardBg = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card?.photo || busy === id) return;
    setBusy(id);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(card.photo, { output: { format: "image/png" } });
      updateCard(id, { photo: await blobToDataUrl(blob) });
    } catch (err) {
      console.error("Background removal failed:", err);
    } finally {
      setBusy(null);
    }
  };

  const removeAllBg = async () => {
    if (removingAll) return;
    const targets = cards.filter((c) => c.photo);
    if (targets.length === 0) return;
    setRemovingAll(true);
    setBgMsg(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      for (let i = 0; i < targets.length; i++) {
        const c = targets[i];
        setBgMsg(`Removing background ${i + 1} of ${targets.length}…`);
        setBusy(c.id);
        try {
          const blob = await removeBackground(c.photo!, { output: { format: "image/png" } });
          updateCard(c.id, { photo: await blobToDataUrl(blob) });
        } catch (err) {
          console.error("Background removal failed:", c.name, err);
        }
      }
      setBgMsg(`Done — backgrounds removed for ${targets.length} photo${targets.length > 1 ? "s" : ""}.`);
    } finally {
      setBusy(null);
      setRemovingAll(false);
    }
  };

  const exportCard = async (card: AdminCard) => {
    const node = exportRefs.current[card.id];
    if (!node) return;
    setBusy(card.id);
    try {
      const css = await getFontEmbedCSS();
      const dataUrl = await nodeToPng(node, css);
      triggerDownload(dataUrl, `${safeName(card.name)}.png`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setBusy(null);
    }
  };

  const exportZip = async () => {
    setZipping(true);
    try {
      const css = await getFontEmbedCSS();
      const zip = new JSZip();
      const used: Record<string, number> = {};
      for (const card of cards) {
        const node = exportRefs.current[card.id];
        if (!node) continue;
        const dataUrl = await nodeToPng(node, css);
        const blob = await (await fetch(dataUrl)).blob();
        let base = safeName(card.name);
        used[base] = (used[base] ?? 0) + 1;
        if (used[base] > 1) base = `${base}_${used[base]}`;
        zip.file(`${base}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      triggerDownload(url, "certified-admins.zip");
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error("ZIP export failed:", err);
    } finally {
      setZipping(false);
    }
  };

  const inputCls =
    "w-full bg-black/25 border border-white/[0.08] rounded-[12px] px-[14px] py-[11px] text-[13.5px] text-white placeholder:text-[#64748B] outline-none focus:border-[#2896FB]/60 transition-colors";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[1px] text-[#94A3B8] mb-[7px]";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {/* LEFT — control panel */}
      <div className="w-full md:w-[400px] md:min-w-[400px] overflow-y-auto overflow-x-hidden py-[22px] px-[20px] md:px-[26px] pb-[40px] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col gap-[20px] max-h-[46vh] md:max-h-none">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <div className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0 bg-gradient-to-br from-[#1AC0FF] to-[#2896FB] shadow-[0_10px_26px_-10px_rgba(40,150,251,0.8)]">
            <Award size={21} color="#fff" />
          </div>
          <div className="min-w-0">
            <h1 className="m-0 text-[22px] text-white leading-[1.04] font-semibold">Certified Admin</h1>
            <p className="m-0 text-[11.5px] text-[#94A3B8] leading-[1.35] truncate">Graphics for your HighLevel Certified Admins.</p>
          </div>
        </div>

        {/* Download all */}
        <button
          onClick={exportZip}
          disabled={zipping}
          className="w-full flex items-center justify-center gap-[8px] py-[11px] rounded-[14px] text-[13px] font-semibold text-white bg-gradient-to-br from-[#1AC0FF] to-[#2896FB] shadow-[0_8px_22px_-12px_rgba(40,150,251,0.9)] hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {zipping ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {zipping ? "Preparing ZIP…" : `Download all (${cards.length}) ZIP`}
        </button>

        {/* Remove all backgrounds */}
        <button
          onClick={removeAllBg}
          disabled={removingAll || !cards.some((c) => c.photo)}
          className="w-full flex items-center justify-center gap-[8px] py-[10px] rounded-[12px] text-[12.5px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {removingAll ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
          {removingAll ? (bgMsg ?? "Removing…") : "Remove all backgrounds"}
        </button>
        {bgMsg && !removingAll && <p className="m-0 -mt-[10px] text-[11px] text-[#94A3B8]">{bgMsg}</p>}

        <div className="h-px bg-white/[0.06]" />

        {/* Bulk import from Google Drive */}
        <div className="flex flex-col gap-[10px] rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-[14px]">
          <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B]">
            Bulk from Google Drive
          </div>
          <p className="m-0 text-[11.5px] text-[#94A3B8] leading-[1.4]">
            Paste a public folder link. Each photo's filename becomes the person's name. Up to {BULK_LIMIT} cards.
          </p>
          <input
            className={inputCls}
            placeholder="https://drive.google.com/drive/folders/…"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            disabled={importing}
          />
          <button
            onClick={importFromDrive}
            disabled={importing || !driveUrl.trim()}
            className="w-full flex items-center justify-center gap-[8px] py-[10px] rounded-[12px] text-[13px] font-semibold text-white bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {importing ? "Importing…" : "Import & generate"}
          </button>
          {importMsg && (
            <p className="m-0 text-[11px] text-[#94A3B8] leading-[1.4]">{importMsg}</p>
          )}
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Active card editor */}
        {active && (
          <div className="flex flex-col gap-[18px]">
            <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B]">
              Editing card {cards.findIndex((c) => c.id === active.id) + 1} of {cards.length}
            </div>

            <div>
              <label className={labelCls}>Name</label>
              <textarea
                className={`${inputCls} resize-none leading-[1.3]`}
                rows={2}
                value={active.name}
                onChange={(e) => updateCard(active.id, { name: e.target.value })}
                placeholder={"Certified Admin\nName"}
              />
              <p className="text-[10.5px] text-[#64748B] mt-[6px]">Tip: press Enter to split a long name onto two lines.</p>
            </div>

            <div>
              <label className={labelCls}>Directory URL</label>
              <input
                className={inputCls}
                value={active.directory}
                onChange={(e) => updateCard(active.id, { directory: e.target.value })}
                placeholder="directory.gohighlevel.com"
              />
            </div>

            <div>
              <label className={labelCls}>Certified Admin photo</label>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => { handlePhoto(active.id, e.target.files); e.target.value = ""; }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy === active.id}
                className="w-full flex items-center justify-center gap-[8px] py-[11px] rounded-[12px] text-[13px] font-medium text-white bg-white/[0.05] border border-dashed border-white/[0.2] hover:border-white/[0.4] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {busy === active.id ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {busy === active.id ? "Processing…" : active.photo ? "Replace photo" : "Upload photo"}
              </button>
              <label className="flex items-center gap-[8px] mt-[10px] text-[12px] text-[#94A3B8] cursor-pointer select-none">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="accent-[#2896FB]" />
                Remove background on upload
              </label>
              {active.photo && (
                <>
                  <button
                    onClick={() => removeCardBg(active.id)}
                    disabled={busy === active.id || removingAll}
                    className="w-full mt-[10px] flex items-center justify-center gap-[8px] py-[10px] rounded-[12px] text-[12.5px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {busy === active.id ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
                    Remove background
                  </button>
                  <div className="mt-[14px]">
                    <div className="flex items-center justify-between mb-[6px]">
                      <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#94A3B8]">Photo size</span>
                      <span className="text-[11px] text-[#94A3B8]">{Math.round(active.photoScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.01}
                      value={active.photoScale}
                      onChange={(e) => updateCard(active.id, { photoScale: Number(e.target.value) })}
                      className="w-full accent-[#2896FB] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-[8px] mt-[10px]">
                    <p className="text-[10.5px] text-[#64748B] m-0">Drag the photo inside the circle to reposition it.</p>
                    <button
                      onClick={() => updateCard(active.id, { photoX: 50, photoY: 50, photoScale: 1 })}
                      className="shrink-0 text-[11px] font-medium text-[#7CC8FF] hover:text-white transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>

            <label className="flex items-center justify-between gap-[8px] text-[13px] text-white cursor-pointer select-none">
              <span>Show Certified Admin badge</span>
              <input type="checkbox" checked={active.showBadge} onChange={(e) => updateCard(active.id, { showBadge: e.target.checked })} className="accent-[#2896FB] w-[16px] h-[16px]" />
            </label>
          </div>
        )}
      </div>

      {/* RIGHT — card stack */}
      <div className="flex-1 overflow-y-auto p-[20px] md:p-[30px]">
        <div className="max-w-[560px] mx-auto flex flex-col gap-[22px]">
          {cards.map((card, i) => {
            const isActive = card.id === activeId;
            return (
              <div key={card.id} className="flex flex-col gap-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[12px] font-semibold text-[#94A3B8]">#{i + 1}</span>
                    {isActive && <span className="text-[10px] font-bold uppercase tracking-[0.5px] px-[8px] py-[3px] rounded-full bg-[#2896FB]/20 text-[#7CC8FF]">Editing</span>}
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <button onClick={() => duplicateCard(card.id)} title="Duplicate" className="w-[30px] h-[30px] flex items-center justify-center rounded-[9px] text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"><Copy size={15} /></button>
                    <button onClick={() => exportCard(card)} title="Download PNG" disabled={busy === card.id || zipping} className="w-[30px] h-[30px] flex items-center justify-center rounded-[9px] text-[#94A3B8] hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer">{busy === card.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}</button>
                    <button onClick={() => removeCard(card.id)} title="Remove" className="w-[30px] h-[30px] flex items-center justify-center rounded-[9px] text-[#94A3B8] hover:text-[#FF6B6B] hover:bg-white/10 transition-colors cursor-pointer"><Trash2 size={15} /></button>
                  </div>
                </div>
                <button
                  onClick={() => setActiveId(card.id)}
                  className={`relative block w-full rounded-[18px] overflow-hidden transition-all cursor-pointer ${isActive ? "ring-2 ring-[#2896FB] ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/[0.08] hover:ring-white/[0.2]"}`}
                >
                  <CertifiedAdminCard
                    card={card}
                    interactive={isActive}
                    onMovePhoto={(x, y) => updateCard(card.id, { photoX: x, photoY: y })}
                  />
                  {busy === card.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-white" /></div>
                  )}
                </button>
              </div>
            );
          })}

          <button
            onClick={addCard}
            className="w-full flex items-center justify-center gap-[8px] py-[14px] rounded-[16px] text-[13.5px] font-semibold text-[#7CC8FF] border border-dashed border-[#2896FB]/40 hover:bg-[#2896FB]/10 transition-colors cursor-pointer"
          >
            <Plus size={17} /> Add another
          </button>
        </div>
      </div>

      {/* Hidden full-size export nodes */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
        {cards.map((card) => (
          <div key={card.id} ref={(el) => { exportRefs.current[card.id] = el; }} style={{ width: CARD_SIZE, height: CARD_SIZE }}>
            <CertifiedAdminCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
