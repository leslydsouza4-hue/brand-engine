import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Mail, Download, Loader2, Upload, X, Image as ImageIcon, Plus, Sparkles, Trash2, Package, Copy, Scissors, FileDown, Link2 } from "lucide-react";
import JSZip from "jszip";
import { useExport } from "./useExport";
import { HIGHLY_POSES, BUNDLE_ASSETS } from "./highlyData";

const BASE = import.meta.env.BASE_URL;
const BG_URL = `${BASE}assets/email-templates/BG_BLUE.jpg`;
const LOGO_URL = `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`;

type ImageSource = "highly" | "bundle" | "upload" | "none";

interface EmailItem {
  id: string;
  headline: string;
  subhead: string;
  cta: string;
  imageSource: ImageSource;
  selectedHighlyId: string;
  selectedBundleId: string;
  uploadedImage: string | null;
  imgOffset: { x: number; y: number };
  imgScale: number;
  bundleOffset: { x: number; y: number };
  bundleScale: number;
}

const newEmail = (): EmailItem => ({
  id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  headline: "",
  subhead: "",
  cta: "",
  imageSource: "highly",
  selectedHighlyId: HIGHLY_POSES[0]!.id,
  selectedBundleId: BUNDLE_ASSETS[0]!.id,
  uploadedImage: null,
  imgOffset: { x: 0, y: 0 },
  imgScale: 1,
  bundleOffset: { x: 0, y: 0 },
  bundleScale: 1,
});

interface ParsedSection {
  headline: string;
  subhead: string;
  cta: string;
}

function splitHeadlineSubhead(text: string): { headline: string; subhead: string } {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return { headline: "", subhead: "" };

  // Sentence segmentation on . ? ! (keeping punctuation)
  const matches = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  const sentences = matches ? matches.map(s => s.trim()).filter(Boolean) : [clean];

  // ---- Multi-sentence path ----
  if (sentences.length >= 2) {
    // 1) If exactly one sentence is a question/exclamation, it's the hook → headline
    const punchyIdxs = sentences
      .map((s, i) => ({ i, s }))
      .filter(x => /[?!]$/.test(x.s));
    if (punchyIdxs.length === 1) {
      const idx = punchyIdxs[0]!.i;
      const headline = sentences[idx]!;
      const rest = sentences.filter((_, i) => i !== idx).join(" ").trim();
      return { headline, subhead: rest };
    }

    // 2) Headline is normally the FIRST sentence — unless it's clearly too long
    //    AND the second is much shorter (then second is more headline-like).
    const first = sentences[0]!;
    const rest = sentences.slice(1).join(" ").trim();
    if (first.length > 90 && sentences[1] && sentences[1].length < first.length * 0.6) {
      const second = sentences[1]!;
      const others = [first, ...sentences.slice(2)].join(" ").trim();
      return { headline: second, subhead: others };
    }
    return { headline: first, subhead: rest };
  }

  // ---- Single-sentence path: try to split smartly ----
  // Look for natural break points (em-dash, colon, semicolon, " — ", " - ")
  const breakRe = /\s*[—–]\s*|\s+[-–—]\s+|\s*:\s+|\s*;\s+/;
  const breakMatch = clean.match(breakRe);
  if (breakMatch && typeof breakMatch.index === "number") {
    const idx = breakMatch.index;
    const left = clean.slice(0, idx).trim();
    const right = clean.slice(idx + breakMatch[0]!.length).trim();
    if (left && right && left.length <= 90) {
      return { headline: left, subhead: right };
    }
  }

  // If still long, split at the comma closest to the middle so neither side is empty
  if (clean.length > 80) {
    const commas: number[] = [];
    for (let i = 0; i < clean.length; i++) if (clean[i] === ",") commas.push(i);
    if (commas.length > 0) {
      const mid = clean.length / 2;
      let best = commas[0]!;
      for (const c of commas) if (Math.abs(c - mid) < Math.abs(best - mid)) best = c;
      const left = clean.slice(0, best).trim();
      const right = clean.slice(best + 1).trim();
      if (left && right) return { headline: left, subhead: right };
    }
  }

  return { headline: clean, subhead: "" };
}

function parseDocText(raw: string): ParsedSection[] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Match "Image Header" (case-insensitive, optional number) followed by a colon,
  // then capture everything until the next label-like marker or a blank line.
  // Labels we treat as terminators: anything looking like "Word(s):" at line start
  // (e.g. "Subject:", "Body:", "CTA:", "Image Header 2:").
  const re = /image\s*header\s*\d*\s*:\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z][\w \-/]{0,40}:\s|$)/gi;

  const sections: ParsedSection[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const captured = (m[1] || "").trim();
    if (!captured) continue;
    const { headline, subhead } = splitHeadlineSubhead(captured);
    if (headline || subhead) {
      sections.push({ headline, subhead, cta: "" });
    }
  }

  return sections;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0]!.match(/:(.*?);/)?.[1] || "image/png";
  const b64 = atob(parts[1]!);
  const arr = new Uint8Array(b64.length);
  for (let i = 0; i < b64.length; i++) arr[i] = b64.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface EmailPreviewProps {
  email: EmailItem;
  index: number;
  isActive: boolean;
  isExporting: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<EmailItem>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onDownload: () => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

function EmailPreview({ email, index, isActive, isExporting, onSelect, onPatch, onDuplicate, onRemove, onDownload, registerRef }: EmailPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; rect: DOMRect } | null>(null);
  const bundleDragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; rect: DOMRect } | null>(null);
  const [headlineFontPx, setHeadlineFontPx] = useState(34);

  const selectedHighly = HIGHLY_POSES.find(h => h.id === email.selectedHighlyId);
  const selectedBundle = BUNDLE_ASSETS.find(b => b.id === email.selectedBundleId);
  const bundleOffset = email.bundleOffset ?? { x: 0, y: 0 };
  const bundleScale = email.bundleScale ?? 1;
  // In bundle mode, the bundle is the static base and uploadedImage (a person) is the
  // draggable overlay on top of it. In other modes, displayedImage is the single layer.
  const displayedImage =
    email.imageSource === "upload" ? email.uploadedImage :
    email.imageSource === "highly" ? selectedHighly?.image :
    email.imageSource === "bundle" ? email.uploadedImage :
    null;
  const bundleBase = email.imageSource === "bundle" ? selectedBundle?.image : null;
  const showPlaceholder = email.imageSource !== "none" && !displayedImage && !bundleBase;

  // Register ref for parent
  useLayoutEffect(() => {
    registerRef(email.id, previewRef.current);
    return () => registerRef(email.id, null);
  }, [email.id, registerRef]);

  // Dynamic headline + subhead combined sizing
  useEffect(() => {
    const el = headlineRef.current;
    const sub = subheadRef.current;
    if (!el) return;
    if (!email.headline && !email.subhead) { setHeadlineFontPx(34); return; }

    const cta = ctaRef.current;
    const containerWidth = el.parentElement?.clientWidth || 600;
    const previewH = previewRef.current?.clientHeight || 540;
    // Text block sits at 28% top → ~70% of preview height available
    const availableHeight = Math.max(140, previewH * 0.70);
    const gap = 14;
    const ctaGap = 18;

    // Headline is the hero — keep it bold and readable.
    // Floor at 22px so it never gets tiny; ceiling allows bold growth when text is short.
    const HEADLINE_MIN = 22;
    const HEADLINE_MAX = 88;
    let lo = HEADLINE_MIN, hi = HEADLINE_MAX, best = HEADLINE_MIN;
    const measure = (size: number) => {
      el.style.fontSize = `${size}px`;
      const headlineH = email.headline ? el.scrollHeight : 0;
      const headlineW = email.headline ? el.scrollWidth : 0;
      let subH = 0, subW = 0;
      if (sub && email.subhead) {
        // Subhead scales with headline (~half its size), generous range
        const subSize = Math.max(14, Math.min(42, Math.round(size * 0.55)));
        sub.style.fontSize = `${subSize}px`;
        subH = sub.scrollHeight;
        subW = sub.scrollWidth;
      }
      let ctaH = 0, ctaW = 0;
      if (cta && email.cta) {
        const ctaFont = Math.max(12, Math.min(26, Math.round(size * 0.42)));
        const ctaPadY = Math.max(6, Math.round(ctaFont * 0.7));
        const ctaPadX = Math.max(14, Math.round(ctaFont * 1.7));
        cta.style.fontSize = `${ctaFont}px`;
        cta.style.padding = `${ctaPadY}px ${ctaPadX}px`;
        ctaH = cta.scrollHeight;
        ctaW = cta.scrollWidth;
      }
      const totalH = headlineH
        + (subH > 0 && headlineH > 0 ? gap : 0) + subH
        + (ctaH > 0 && (headlineH > 0 || subH > 0) ? ctaGap : 0) + ctaH;
      const maxW = Math.max(headlineW, subW, ctaW);
      return { w: maxW, h: totalH };
    };
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const { w, h } = measure(mid);
      if (w <= containerWidth && h <= availableHeight) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // Force-apply at min so subhead/CTA inline styles match the rendered headline
    measure(best);
    setHeadlineFontPx(best);
  }, [email.headline, email.subhead, email.cta, email.imageSource]);

  const handleImgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: email.imgOffset.x,
      baseY: email.imgOffset.y,
      rect: previewRef.current.getBoundingClientRect(),
    };
  };

  const handleImgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / d.rect.height) * 100;
    onPatch({ imgOffset: { x: d.baseX + dxPct, y: d.baseY + dyPct } });
  };

  const handleImgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      dragRef.current = null;
    }
  };

  const handleBundlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    bundleDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: bundleOffset.x,
      baseY: bundleOffset.y,
      rect: previewRef.current.getBoundingClientRect(),
    };
  };

  const handleBundlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = bundleDragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / d.rect.height) * 100;
    onPatch({ bundleOffset: { x: d.baseX + dxPct, y: d.baseY + dyPct } });
  };

  const handleBundlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (bundleDragRef.current) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      bundleDragRef.current = null;
    }
  };

  const exportName = `Email ${index + 1}${email.headline ? " - " + email.headline.slice(0, 28).replace(/[^a-zA-Z0-9 ]/g, "") : ""}`;

  return (
    <div className="relative">
      {/* Card chrome */}
      <div
        onClick={onSelect}
        className={`relative rounded-[16px] transition-all cursor-pointer ${
          isActive
            ? "ring-2 ring-[#2896FB] shadow-[0_0_0_4px_rgba(40,150,251,0.12),0_20px_60px_rgba(0,0,0,0.4)]"
            : "ring-1 ring-[rgba(255,255,255,0.06)] hover:ring-[rgba(40,150,251,0.3)] shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
        }`}
      >
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-[14px] py-[10px] bg-[rgba(255,255,255,0.02)] rounded-t-[16px] border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-[8px]">
            <div className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[11px] font-bold ${
              isActive ? "bg-[#2896FB] text-white" : "bg-[rgba(255,255,255,0.06)] text-[#94A3B8]"
            }`}>
              {index + 1}
            </div>
            <div className="text-[12px] font-bold text-white">Email {index + 1}</div>
            {isActive && (
              <span className="text-[9px] uppercase tracking-[1.2px] font-bold text-[#7CC8FF] py-[2px] px-[6px] rounded-[4px] bg-[rgba(40,150,251,0.15)]">Editing</span>
            )}
          </div>
          <div className="flex items-center gap-[4px]" onClick={e => e.stopPropagation()}>
            <button
              onClick={onDuplicate}
              title="Duplicate"
              className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] cursor-pointer transition-all bg-transparent border-none"
            >
              <Copy className="w-[12px] h-[12px]" />
            </button>
            <button
              onClick={onDownload}
              disabled={isExporting}
              title="Download PNG"
              className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[#94A3B8] hover:text-[#7CC8FF] hover:bg-[rgba(40,150,251,0.12)] cursor-pointer transition-all bg-transparent border-none disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Download className="w-[12px] h-[12px]" />}
            </button>
            <button
              onClick={onRemove}
              title="Remove email"
              className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[#94A3B8] hover:text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.12)] cursor-pointer transition-all bg-transparent border-none"
            >
              <Trash2 className="w-[12px] h-[12px]" />
            </button>
          </div>
        </div>

        {/* Preview wrapper — visually rounded but the export target is sharp */}
        <div className="relative overflow-hidden rounded-b-[16px]">
        <div
          ref={previewRef}
          data-export-preview
          data-export-name={exportName}
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "1200 / 600" }}
        >
          <img src={BG_URL} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />

          <img
            src={LOGO_URL}
            alt="HighLevel"
            className="absolute z-[5] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            style={{ top: "6%", left: "5%", height: "8%", width: "auto" }}
            crossOrigin="anonymous"
          />

          <div
            className="absolute z-[4] flex flex-col overflow-hidden"
            style={{
              top: "28%",
              left: "5%",
              width: email.imageSource === "none" ? "90%" : "52%",
              maxHeight: "68%",
            }}
          >
            <div
              ref={headlineRef}
              className="font-['Poppins'] font-black leading-[1.05]"
              style={{
                fontSize: `${headlineFontPx}px`,
                letterSpacing: "-0.5px",
                backgroundImage: "linear-gradient(180deg, #DCEEFF 0%, #7CC8FF 55%, #2896FB 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
              }}
            >
              {email.headline || <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.25)" }}>Your headline here</span>}
            </div>
            {email.subhead && (
              <div
                ref={subheadRef}
                className="font-['Poppins'] font-semibold leading-[1.35] mt-[14px] text-white"
                style={{
                  fontSize: `${Math.max(14, Math.min(42, Math.round(headlineFontPx * 0.55)))}px`,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {email.subhead}
              </div>
            )}
            {email.cta && (
              <div
                ref={ctaRef}
                className="font-['Poppins'] font-bold inline-flex items-center self-start mt-[18px] tracking-[0.3px]"
                style={{
                  fontSize: `${Math.max(12, Math.min(26, Math.round(headlineFontPx * 0.42)))}px`,
                  padding: `${Math.max(6, Math.round(Math.max(12, Math.min(26, Math.round(headlineFontPx * 0.42))) * 0.7))}px ${Math.max(14, Math.round(Math.max(12, Math.min(26, Math.round(headlineFontPx * 0.42))) * 1.7))}px`,
                  borderRadius: "999px",
                  color: "#060B16",
                  background: "linear-gradient(135deg, #DCEEFF 0%, #7CC8FF 50%, #2896FB 100%)",
                  boxShadow: "0 8px 22px rgba(40,150,251,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {email.cta}
              </div>
            )}
          </div>

          {bundleBase && (
            <div
              className="absolute z-[3] flex items-center justify-center select-none"
              style={{
                top: "10%",
                right: "4%",
                width: "38%",
                height: "82%",
                transform: `translate(${bundleOffset.x}%, ${bundleOffset.y}%) scale(${bundleScale})`,
                transformOrigin: "center",
                cursor: "grab",
                touchAction: "none",
              }}
              onPointerDown={handleBundlePointerDown}
              onPointerMove={handleBundlePointerMove}
              onPointerUp={handleBundlePointerUp}
              onPointerCancel={handleBundlePointerUp}
            >
              <img
                src={bundleBase}
                alt=""
                draggable={false}
                crossOrigin="anonymous"
                className="max-w-full max-h-full object-contain pointer-events-none"
                style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.5))" }}
              />
            </div>
          )}

          {email.imageSource !== "none" && (
            <div
              className="absolute z-[4] flex items-center justify-center select-none"
              style={{
                top: "10%",
                right: "4%",
                width: "38%",
                height: "82%",
                transform: `translate(${email.imgOffset.x}%, ${email.imgOffset.y}%) scale(${email.imgScale})`,
                transformOrigin: "center",
                cursor: displayedImage ? "grab" : "default",
                touchAction: "none",
              }}
              onPointerDown={displayedImage ? handleImgPointerDown : undefined}
              onPointerMove={displayedImage ? handleImgPointerMove : undefined}
              onPointerUp={displayedImage ? handleImgPointerUp : undefined}
              onPointerCancel={displayedImage ? handleImgPointerUp : undefined}
            >
              {displayedImage ? (
                <>
                  {!bundleBase && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        width: "85%",
                        height: "85%",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "radial-gradient(ellipse at center, rgba(124,200,255,0.55) 0%, rgba(40,150,251,0.35) 30%, rgba(40,150,251,0.12) 55%, rgba(40,150,251,0) 75%)",
                        filter: "blur(20px)",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <img
                    src={displayedImage}
                    alt=""
                    draggable={false}
                    className="relative max-w-full max-h-full object-contain pointer-events-none"
                    style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.5))", zIndex: 1 }}
                    crossOrigin={email.imageSource === "highly" ? "anonymous" : undefined}
                  />
                </>
              ) : showPlaceholder ? (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-white/15 bg-white/[0.03]">
                  <ImageIcon className="w-[40px] h-[40px] text-white/20 mb-[8px]" />
                  <div className="text-[12px] text-white/40 font-semibold uppercase tracking-[1px]">Image area</div>
                  <div className="text-[10px] text-white/25 mt-[2px]">Pick from sidebar</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export function EmailTemplatesWorkspace() {
  const [emails, setEmails] = useState<EmailItem[]>(() => [newEmail()]);
  const [activeId, setActiveId] = useState<string>(emails[0]!.id);
  const [isZipping, setIsZipping] = useState(false);
  const [bgRemovingId, setBgRemovingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const { isExporting, handleExport, captureToQueue } = useExport();

  const activeEmail = emails.find(e => e.id === activeId) || emails[0]!;

  const handleRemoveBg = async () => {
    if (!activeEmail.uploadedImage || bgRemovingId) return;
    const targetId = activeEmail.id;
    const sourceImage = activeEmail.uploadedImage;
    setBgRemovingId(targetId);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(sourceImage);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEmails(prev => prev.map(e => e.id === targetId ? { ...e, uploadedImage: dataUrl } : e));
        setBgRemovingId(null);
      };
      reader.onerror = () => setBgRemovingId(null);
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Background removal failed:", err);
      alert("Background removal failed. Try a different image.");
      setBgRemovingId(null);
    }
  };

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) refsMap.current.set(id, el);
    else refsMap.current.delete(id);
  }, []);

  const patchActive = useCallback((patch: Partial<EmailItem>) => {
    setEmails(prev => prev.map(e => e.id === activeId ? { ...e, ...patch } : e));
  }, [activeId]);

  const handleHeadlinePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pasted = e.clipboardData.getData("text");
    const ta = e.currentTarget;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const next = ta.value.slice(0, start) + pasted + ta.value.slice(end);
    patchActive({ headline: next });
  };

  const handleSubheadPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pasted = e.clipboardData.getData("text");
    const ta = e.currentTarget;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const next = ta.value.slice(0, start) + pasted + ta.value.slice(end);
    patchActive({ subhead: next });
  };

  const patchEmail = (id: string, patch: Partial<EmailItem>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const addEmail = () => {
    const e = newEmail();
    setEmails(prev => [...prev, e]);
    setActiveId(e.id);
    setTimeout(() => {
      refsMap.current.get(e.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const [docUrl, setDocUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const importFromDoc = async () => {
    const url = docUrl.trim();
    if (!url) {
      setImportMsg({ kind: "err", text: "Paste a Google Docs link first." });
      return;
    }
    setIsImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/import-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to import doc");
      const sections = parseDocText(data.text || "");
      if (sections.length === 0) {
        setImportMsg({ kind: "err", text: "No 'Image Header' sections found in the doc." });
        return;
      }
      const newEmails: EmailItem[] = sections.map((s) => ({
        ...newEmail(),
        headline: s.headline,
        subhead: s.subhead,
        cta: s.cta,
      }));
      setEmails(newEmails);
      setActiveId(newEmails[0]!.id);
      setImportMsg({ kind: "ok", text: `Imported ${sections.length} email${sections.length !== 1 ? "s" : ""} from the doc.` });
    } catch (err: any) {
      setImportMsg({ kind: "err", text: err?.message || "Could not import the doc." });
    } finally {
      setIsImporting(false);
    }
  };

  const duplicateEmail = (id: string) => {
    const src = emails.find(e => e.id === id);
    if (!src) return;
    const dup: EmailItem = { ...src, id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
    const idx = emails.findIndex(e => e.id === id);
    setEmails(prev => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setActiveId(dup.id);
  };

  const removeEmail = (id: string) => {
    if (emails.length === 1) {
      // Reset the only email
      setEmails([newEmail()]);
      setActiveId(prev => prev);
      return;
    }
    const idx = emails.findIndex(e => e.id === id);
    const next = emails.filter(e => e.id !== id);
    setEmails(next);
    if (activeId === id) {
      const newActive = next[Math.min(idx, next.length - 1)]!;
      setActiveId(newActive.id);
    }
  };

  const downloadOne = (id: string) => {
    const el = refsMap.current.get(id);
    if (el) handleExport("png", el);
  };

  const downloadAllZip = async () => {
    if (emails.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const stamp = (() => { const d = new Date(); return `${d.getMonth()+1}-${d.getDate()}-${String(d.getFullYear()).slice(-2)}`; })();
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i]!;
        const el = refsMap.current.get(email.id);
        if (!el) continue;
        const item = await captureToQueue(el);
        if (!item) continue;
        const safe = item.name || `Email_${i + 1}`;
        zip.file(`${String(i + 1).padStart(2, "0")}_${safe}.png`, dataUrlToBlob(item.dataUrl));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Marketing_Emails_${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zip export failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      patchActive({ uploadedImage: ev.target?.result as string, imageSource: "upload", imgOffset: { x: 0, y: 0 }, imgScale: 1 });
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const setSource = (src: ImageSource) => patchActive({ imageSource: src, imgOffset: { x: 0, y: 0 }, imgScale: 1 });
  const setHighly = (id: string) => patchActive({ selectedHighlyId: id, imgOffset: { x: 0, y: 0 }, imgScale: 1 });
  const setBundle = (id: string) => patchActive({ selectedBundleId: id, bundleOffset: { x: 0, y: 0 }, bundleScale: 1 });

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">
      {/* Sidebar / Controls */}
      <div className="w-full md:w-[340px] shrink-0 overflow-y-auto sidebar-scroll border-r border-[rgba(255,255,255,0.06)] p-[24px] flex flex-col gap-[20px]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px] flex items-center gap-[6px]">
            <FileDown className="w-[12px] h-[12px]" /> Import from Google Doc
          </div>
          <div className="flex flex-col gap-[8px]">
            <div className="relative">
              <Link2 className="w-[12px] h-[12px] text-[#475569] absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !isImporting) importFromDoc(); }}
                placeholder="Paste Google Docs link..."
                className="w-full py-[9px] pl-[28px] pr-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#475569]"
              />
            </div>
            <button
              onClick={importFromDoc}
              disabled={isImporting || !docUrl.trim()}
              className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[10px] text-[12px] font-bold cursor-pointer transition-all text-white border-none disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_16px_rgba(40,150,251,0.25)]"
              style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
            >
              {isImporting ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <FileDown className="w-[12px] h-[12px]" />}
              {isImporting ? "Importing..." : "Import & Generate Emails"}
            </button>
            {importMsg && (
              <div
                className={`text-[10.5px] leading-[1.4] py-[6px] px-[8px] rounded-[8px] border ${
                  importMsg.kind === "ok"
                    ? "bg-[rgba(40,150,251,0.08)] border-[rgba(40,150,251,0.25)] text-[#7CC8FF]"
                    : "bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.25)] text-[#FCA5A5]"
                }`}
              >
                {importMsg.text}
              </div>
            )}
            <div className="text-[10px] text-[#475569] leading-[1.4]">
              Doc must be set to <span className="text-[#64748B]">"Anyone with the link can view"</span>. Each <span className="text-[#7CC8FF]">Image Header</span> section becomes one email. Replaces current batch.
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[10px]">Workflow</div>
          <div className="py-[10px] px-[12px] rounded-[10px] border bg-[rgba(40,150,251,0.12)] border-[rgba(40,150,251,0.25)]">
            <div className="text-[12px] font-bold text-[#7CC8FF]">Marketing Email</div>
            <div className="text-[10px] text-[#64748B] mt-[2px]">Editing email {emails.findIndex(e => e.id === activeId) + 1} of {emails.length}</div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Headline</div>
          <textarea
            value={activeEmail.headline}
            onChange={e => patchActive({ headline: e.target.value })}
            onPaste={handleHeadlinePaste}
            rows={2}
            placeholder="Type or paste your headline..."
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4] placeholder:text-[#475569]"
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Subheadline</div>
          <textarea
            value={activeEmail.subhead}
            onChange={e => patchActive({ subhead: e.target.value })}
            onPaste={handleSubheadPaste}
            rows={2}
            placeholder="Type or paste your subheadline..."
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] resize-none transition-colors leading-[1.4] placeholder:text-[#475569]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-[8px]">
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B]">CTA Button <span className="text-[#475569] font-normal normal-case tracking-normal">(optional)</span></div>
            {activeEmail.cta && (
              <button
                onClick={() => patchActive({ cta: "" })}
                className="text-[10px] text-[#64748B] hover:text-[#7CC8FF] cursor-pointer bg-transparent border-none p-0 transition-colors"
                title="Remove CTA"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="text"
            value={activeEmail.cta}
            onChange={e => patchActive({ cta: e.target.value })}
            placeholder="e.g. Get Started, Book a Demo"
            maxLength={28}
            className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] font-['Poppins'] transition-colors placeholder:text-[#475569]"
          />
          {!activeEmail.cta && (
            <div className="flex flex-wrap gap-[6px] mt-[8px]">
              {["Get Started", "Book a Demo", "Try It Free", "Learn More"].map(t => (
                <button
                  key={t}
                  onClick={() => patchActive({ cta: t })}
                  className="text-[10px] py-[4px] px-[10px] rounded-full bg-[rgba(40,150,251,0.08)] hover:bg-[rgba(40,150,251,0.18)] text-[#7CC8FF] border border-[rgba(40,150,251,0.2)] cursor-pointer transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Right-side Image</div>
          <div className="flex gap-[4px] mb-[10px] p-[3px] bg-[rgba(255,255,255,0.04)] rounded-[10px] border border-[rgba(255,255,255,0.06)]">
            {[
              { id: "highly" as const, label: "Highly", icon: Sparkles },
              { id: "bundle" as const, label: "Bundle", icon: Package },
              { id: "upload" as const, label: "Upload", icon: Upload },
              { id: "none" as const, label: "None", icon: X },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSource(id)}
                className={`flex-1 flex items-center justify-center gap-[4px] py-[6px] px-[6px] rounded-[7px] text-[10.5px] font-semibold cursor-pointer transition-all border-none ${
                  activeEmail.imageSource === id
                    ? "bg-[rgba(40,150,251,0.18)] text-[#7CC8FF]"
                    : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                <Icon className="w-[11px] h-[11px]" />
                {label}
              </button>
            ))}
          </div>

          {activeEmail.imageSource === "highly" && (
            <div className="grid grid-cols-3 gap-[6px] max-h-[260px] overflow-y-auto sidebar-scroll p-[2px]">
              {HIGHLY_POSES.map(pose => (
                <button
                  key={pose.id}
                  onClick={() => setHighly(pose.id)}
                  title={pose.name}
                  className={`relative aspect-square rounded-[8px] border cursor-pointer transition-all overflow-hidden ${
                    activeEmail.selectedHighlyId === pose.id
                      ? "border-[#2896FB] shadow-[0_0_0_2px_rgba(40,150,251,0.25)] bg-[rgba(40,150,251,0.08)]"
                      : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <img src={pose.image} alt={pose.name} className="w-full h-full object-contain p-[4px]" />
                </button>
              ))}
            </div>
          )}

          {activeEmail.imageSource === "bundle" && (
            <div className="flex flex-col gap-[12px]">
              <div className="grid grid-cols-3 gap-[6px] max-h-[260px] overflow-y-auto sidebar-scroll p-[2px]">
                {BUNDLE_ASSETS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBundle(b.id)}
                    title={`${b.type} · ${b.color}`}
                    className={`relative aspect-square rounded-[8px] border cursor-pointer transition-all overflow-hidden flex flex-col ${
                      activeEmail.selectedBundleId === b.id
                        ? "border-[#2896FB] shadow-[0_0_0_2px_rgba(40,150,251,0.25)] bg-[rgba(40,150,251,0.08)]"
                        : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    <img src={b.image} alt={`${b.type} ${b.color}`} className="flex-1 w-full h-full object-contain p-[3px]" />
                    <div className="text-[8px] font-bold text-[#94A3B8] py-[2px] px-[3px] text-center bg-[rgba(0,0,0,0.3)] truncate">
                      {b.type} · {b.color.split(" ")[0]}
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] pt-[12px]">
                <div className="flex items-center justify-between mb-[6px]">
                  <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#64748B]">Bundle Size & Position</div>
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[11px] font-bold text-[#7CC8FF] tabular-nums">{Math.round(activeEmail.bundleScale * 100)}%</span>
                    <button
                      onClick={() => patchActive({ bundleScale: 1, bundleOffset: { x: 0, y: 0 } })}
                      className="text-[10px] text-[#64748B] hover:text-[#7CC8FF] cursor-pointer bg-transparent border-none p-0 transition-colors"
                      title="Reset bundle size & position"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2}
                  step={0.05}
                  value={activeEmail.bundleScale}
                  onChange={(e) => patchActive({ bundleScale: parseFloat(e.target.value) })}
                  className="w-full email-scale-slider cursor-pointer"
                />
                <div className="text-[10px] text-[#475569] mt-[4px] mb-[14px]">Drag the bundle in the preview to reposition it</div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] pt-[12px]">
                <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#64748B] mb-[8px]">Person on top (optional)</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                {activeEmail.uploadedImage ? (
                  <>
                    <div className="relative rounded-[10px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                      <div
                        className="w-full h-[100px]"
                        style={{
                          backgroundImage: `url(${activeEmail.uploadedImage}), linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)`,
                          backgroundSize: "contain, 12px 12px, 12px 12px, 12px 12px, 12px 12px",
                          backgroundPosition: "center, 0 0, 0 6px, 6px -6px, -6px 0px",
                          backgroundRepeat: "no-repeat, repeat, repeat, repeat, repeat",
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-[8px] gap-[6px] pointer-events-none">
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={bgRemovingId === activeEmail.id}
                          className="pointer-events-auto py-[5px] px-[10px] rounded-[6px] text-[11px] font-semibold bg-[rgba(255,255,255,0.15)] backdrop-blur-md border border-white/20 text-white hover:bg-[rgba(255,255,255,0.25)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => patchActive({ uploadedImage: null })}
                          disabled={bgRemovingId === activeEmail.id}
                          className="pointer-events-auto w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(239,68,68,0.2)] backdrop-blur-md border border-[rgba(239,68,68,0.3)] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.3)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <X className="w-[12px] h-[12px]" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveBg}
                      disabled={bgRemovingId === activeEmail.id}
                      className="mt-[8px] w-full flex items-center justify-center gap-[8px] py-[10px] px-[12px] rounded-[10px] text-[12px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed"
                      style={{
                        background: bgRemovingId === activeEmail.id
                          ? "rgba(40,150,251,0.08)"
                          : "linear-gradient(135deg, rgba(40,150,251,0.18) 0%, rgba(124,200,255,0.15) 100%)",
                        borderColor: "rgba(40,150,251,0.35)",
                        color: "#7CC8FF",
                      }}
                    >
                      {bgRemovingId === activeEmail.id ? (
                        <>
                          <Loader2 className="w-[14px] h-[14px] animate-spin" />
                          <span>Removing background…</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-[14px] h-[14px]" />
                          <span>Remove Background</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-[6px] py-[18px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-dashed border-[rgba(255,255,255,0.12)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(40,150,251,0.3)] cursor-pointer transition-all"
                  >
                    <Upload className="w-[16px] h-[16px]" />
                    <span className="text-[11px] font-semibold">Upload person image</span>
                    <span className="text-[10px]">Layered on top of bundle</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeEmail.imageSource === "upload" && (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {activeEmail.uploadedImage ? (
                <>
                  <div className="relative rounded-[10px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                    <div
                      className="w-full h-[120px]"
                      style={{
                        backgroundImage: `url(${activeEmail.uploadedImage}), linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)`,
                        backgroundSize: "contain, 12px 12px, 12px 12px, 12px 12px, 12px 12px",
                        backgroundPosition: "center, 0 0, 0 6px, 6px -6px, -6px 0px",
                        backgroundRepeat: "no-repeat, repeat, repeat, repeat, repeat",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-[8px] gap-[6px] pointer-events-none">
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={bgRemovingId === activeEmail.id}
                        className="pointer-events-auto py-[5px] px-[10px] rounded-[6px] text-[11px] font-semibold bg-[rgba(255,255,255,0.15)] backdrop-blur-md border border-white/20 text-white hover:bg-[rgba(255,255,255,0.25)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => patchActive({ uploadedImage: null })}
                        disabled={bgRemovingId === activeEmail.id}
                        className="pointer-events-auto w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(239,68,68,0.2)] backdrop-blur-md border border-[rgba(239,68,68,0.3)] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.3)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <X className="w-[12px] h-[12px]" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveBg}
                    disabled={bgRemovingId === activeEmail.id}
                    className="mt-[8px] w-full flex items-center justify-center gap-[8px] py-[10px] px-[12px] rounded-[10px] text-[12px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed"
                    style={{
                      background: bgRemovingId === activeEmail.id
                        ? "rgba(40,150,251,0.08)"
                        : "linear-gradient(135deg, rgba(40,150,251,0.18) 0%, rgba(124,200,255,0.15) 100%)",
                      borderColor: "rgba(40,150,251,0.35)",
                      color: "#7CC8FF",
                    }}
                  >
                    {bgRemovingId === activeEmail.id ? (
                      <>
                        <Loader2 className="w-[14px] h-[14px] animate-spin" />
                        <span>Removing background…</span>
                      </>
                    ) : (
                      <>
                        <Scissors className="w-[14px] h-[14px]" />
                        <span>Remove Background</span>
                      </>
                    )}
                  </button>
                  <div className="text-[10px] text-[#475569] mt-[6px] text-center leading-[1.4]">
                    Runs in your browser • First use downloads the AI model (~25MB)
                  </div>
                </>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-[6px] py-[24px] rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-dashed border-[rgba(255,255,255,0.12)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(40,150,251,0.3)] cursor-pointer transition-all"
                >
                  <Upload className="w-[18px] h-[18px]" />
                  <span className="text-[12px] font-semibold">Upload image</span>
                  <span className="text-[10px]">PNG, JPG, screenshots</span>
                </button>
              )}
            </>
          )}

          {activeEmail.imageSource === "none" && (
            <div className="text-[11px] text-[#64748B] py-[12px] px-[14px] rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] text-center">
              No image — text only layout
            </div>
          )}

          {activeEmail.imageSource !== "none" && (
            <div className="mt-[12px]">
              <div className="flex items-center justify-between mb-[6px]">
                <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B]">Size</div>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[11px] font-bold text-[#7CC8FF] tabular-nums">{Math.round(activeEmail.imgScale * 100)}%</span>
                  <button
                    onClick={() => patchActive({ imgScale: 1, imgOffset: { x: 0, y: 0 } })}
                    className="text-[10px] text-[#64748B] hover:text-[#7CC8FF] cursor-pointer bg-transparent border-none p-0 transition-colors"
                    title="Reset size & position"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0.4}
                max={2}
                step={0.05}
                value={activeEmail.imgScale}
                onChange={(e) => patchActive({ imgScale: parseFloat(e.target.value) })}
                className="w-full email-scale-slider cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[8px] mt-auto pt-[16px] border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between text-[10px] text-[#64748B] px-[2px]">
            <span>{emails.length} email{emails.length !== 1 ? "s" : ""} in batch</span>
            <span>Drag image to reposition</span>
          </div>
          <button
            onClick={addEmail}
            className="w-full flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[12px] font-bold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#E2E8F0] hover:border-[rgba(40,150,251,0.3)] hover:text-[#7CC8FF] cursor-pointer transition-all"
          >
            <Plus className="w-[13px] h-[13px]" />
            Add another email
          </button>
          <button
            onClick={downloadAllZip}
            disabled={isZipping || isExporting}
            className="w-full flex items-center justify-center gap-[8px] py-[12px] rounded-[12px] text-[13px] font-bold cursor-pointer transition-all text-white border-none disabled:opacity-50 hover:shadow-[0_4px_20px_rgba(40,150,251,0.3)]"
            style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
          >
            {isZipping ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Package className="w-[14px] h-[14px]" />}
            {isZipping ? `Zipping ${emails.length} emails...` : `Download All (.zip)`}
          </button>
        </div>
      </div>

      {/* Preview area — scrollable list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-[32px] py-[16px] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <Mail className="w-[16px] h-[16px] text-[#2896FB]" />
            <div className="text-white text-[14px] font-bold">Email Templates</div>
            <span className="text-[#64748B] text-[11px]">— Marketing Email · {emails.length} email{emails.length !== 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={addEmail}
            className="flex items-center gap-[6px] py-[7px] px-[12px] rounded-[8px] text-[11px] font-bold bg-[rgba(40,150,251,0.12)] border border-[rgba(40,150,251,0.25)] text-[#7CC8FF] hover:bg-[rgba(40,150,251,0.2)] cursor-pointer transition-all"
          >
            <Plus className="w-[12px] h-[12px]" />
            Add Email
          </button>
        </div>
        <div className="flex-1 overflow-auto p-[32px]">
          <div className="w-full max-w-[1080px] mx-auto flex flex-col gap-[24px]">
            {emails.map((email, idx) => (
              <EmailPreview
                key={email.id}
                email={email}
                index={idx}
                isActive={email.id === activeId}
                isExporting={isExporting}
                onSelect={() => setActiveId(email.id)}
                onPatch={(patch) => patchEmail(email.id, patch)}
                onDuplicate={() => duplicateEmail(email.id)}
                onRemove={() => removeEmail(email.id)}
                onDownload={() => downloadOne(email.id)}
                registerRef={registerRef}
              />
            ))}

            <button
              onClick={addEmail}
              className="w-full flex items-center justify-center gap-[8px] py-[20px] rounded-[16px] border-2 border-dashed border-[rgba(255,255,255,0.1)] text-[#64748B] hover:text-[#7CC8FF] hover:border-[rgba(40,150,251,0.3)] hover:bg-[rgba(40,150,251,0.04)] cursor-pointer transition-all bg-transparent text-[13px] font-bold"
            >
              <Plus className="w-[16px] h-[16px]" />
              Add another email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
