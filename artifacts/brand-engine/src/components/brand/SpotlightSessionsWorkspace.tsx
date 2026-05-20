import { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, X, Move, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { LivePreview } from "./LivePreview";
import { DownloadButton } from "./DownloadButton";
import { useExport } from "./useExport";

const BG_URL = `${import.meta.env.BASE_URL}assets/spotlight/bg.png?v=2`;

export function SpotlightSessionsWorkspace() {
  const { isExporting, handleExport } = useExport();
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headline, setHeadline] = useState("Build a System Driven Agency with HighLevel");
  const [guestName, setGuestName] = useState("NAME HERE");

  const [personRaw, setPersonRaw] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const [personX, setPersonX] = useState(75);
  const [personY, setPersonY] = useState(58);
  const [personScale, setPersonScale] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const resetPerson = () => { setPersonX(75); setPersonY(58); setPersonScale(100); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      setPersonRaw(src);
      setPersonImage(src);
      setRemovingBg(true);
      setBgError(null);
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(src, { model: "isnet_fp16", output: { format: "image/png" } });
        const url = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        setPersonImage(url);
      } catch (err: any) {
        setBgError(err?.message || "Background removal failed — using original image");
      } finally {
        setRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPerson = () => {
    setPersonRaw(null);
    setPersonImage(null);
    setBgError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    resetPerson();
  };

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!personImage || !previewRef.current) return;
    setIsDragging(true);
    dragStartRef.current = { startX: clientX, startY: clientY, origX: personX, origY: personY };
  }, [personImage, personX, personY]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = ((clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dy = ((clientY - dragStartRef.current.startY) / rect.height) * 100;
    setPersonX(Math.max(0, Math.min(100, dragStartRef.current.origX + dx)));
    setPersonY(Math.max(0, Math.min(100, dragStartRef.current.origY + dy)));
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const exportThumb = async (format: "png" | "jpeg" | "pdf") => {
    if (!previewRef.current) return;
    await handleExport(format, previewRef.current);
  };

  const fadeMask = "linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.55) 86%, transparent 100%)";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[340px] md:min-w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-[rgba(255,255,255,0.015)] overflow-y-auto">
        <div className="p-[20px] flex flex-col gap-[18px]">

          {/* Headline */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Headline</div>
            <textarea
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Build a System Driven Agency with HighLevel"
              rows={3}
              maxLength={120}
              className="w-full py-[10px] px-[12px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-[13px] text-white font-medium outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#475569] resize-none leading-[1.35]"
            />
          </div>

          {/* Name */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Guest Name</div>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value.toUpperCase())}
              placeholder="NAME HERE"
              maxLength={28}
              className="w-full py-[10px] px-[12px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-[13px] font-bold text-white outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#475569] uppercase tracking-[0.08em]"
            />
            <div className="text-[10px] text-[#475569] mt-[4px]">Shown in the dark navy pill, bottom-right.</div>
          </div>

          {/* Person */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] mb-[8px]">Guest Photo</div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <div
              onClick={() => !personImage && fileInputRef.current?.click()}
              className={`flex items-center gap-[12px] py-[12px] px-[14px] rounded-[12px] transition-all relative overflow-hidden
                ${personImage
                  ? "border border-[rgba(40,150,251,0.2)] bg-[rgba(40,150,251,0.04)] cursor-default"
                  : "border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(40,150,251,0.25)] cursor-pointer"}`}
            >
              <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 bg-[rgba(255,255,255,0.04)] overflow-hidden">
                {personImage ? (
                  <img src={personImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UploadCloud className="w-[16px] h-[16px] text-[#64748B]" />
                )}
              </div>
              <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1 min-w-0">
                {removingBg ? (
                  <span className="flex items-center gap-[6px] text-[#2896FB]">
                    <Loader2 className="w-[12px] h-[12px] animate-spin" /> Removing background…
                  </span>
                ) : personImage ? (
                  <>
                    Photo uploaded
                    <span className="block text-[10px] text-[#64748B] mt-[2px] truncate">
                      {personRaw === personImage ? "Background not removed" : "Background removed"}
                    </span>
                  </>
                ) : (
                  <>
                    Upload guest photo
                    <span className="block text-[10px] text-[#64748B] mt-[2px]">PNG/JPG · auto bg removal</span>
                  </>
                )}
              </div>
              {personImage && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearPerson(); }}
                  className="shrink-0 w-[24px] h-[24px] rounded-[6px] bg-[rgba(255,255,255,0.06)] text-[#64748B] flex items-center justify-center hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all"
                  aria-label="Remove photo"
                >
                  <X className="w-[12px] h-[12px]" />
                </button>
              )}
            </div>
            {bgError && (
              <div className="mt-[6px] text-[10px] text-[#F0B429]">{bgError}</div>
            )}
          </div>

          {/* Position & Scale */}
          {personImage && (
            <div>
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B] flex items-center gap-[5px]">
                  <Move className="w-[11px] h-[11px]" /> Position & Size
                </span>
                <button
                  onClick={resetPerson}
                  className="flex items-center gap-[4px] py-[3px] px-[8px] rounded-[6px] border border-[rgba(255,255,255,0.06)] text-[10px] font-medium text-[#64748B] cursor-pointer hover:text-[#2896FB] hover:border-[rgba(40,150,251,0.25)] transition-all"
                >
                  <RotateCcw className="w-[9px] h-[9px]" /> Reset
                </button>
              </div>
              <div className="flex items-center gap-[6px] mb-[10px] p-[8px] rounded-[10px] bg-[rgba(40,150,251,0.05)] border border-[rgba(40,150,251,0.12)]">
                <Move className="w-[12px] h-[12px] text-[#2896FB] shrink-0" />
                <span className="text-[10px] text-[#2896FB] font-medium">Drag the person in the live preview</span>
              </div>
              <div className="mb-[10px]">
                <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[4px]">
                  Horizontal <span className="font-semibold text-[#94A3B8]">{personX}%</span>
                </div>
                <input type="range" min="0" max="100" value={personX}
                  onChange={e => setPersonX(Number(e.target.value))}
                  className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none" />
              </div>
              <div className="mb-[10px]">
                <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[4px]">
                  Vertical <span className="font-semibold text-[#94A3B8]">{personY}%</span>
                </div>
                <input type="range" min="0" max="100" value={personY}
                  onChange={e => setPersonY(Number(e.target.value))}
                  className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[4px]">
                  Scale <span className="font-semibold text-[#94A3B8]">{personScale}%</span>
                </div>
                <input type="range" min="40" max="180" value={personScale}
                  onChange={e => setPersonScale(Number(e.target.value))}
                  className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none" />
              </div>
            </div>
          )}

          {/* Download */}
          <DownloadButton onExport={exportThumb} isExporting={isExporting} label="Download PNG" />
        </div>
      </div>

      {/* Preview */}
      <LivePreview>
        <div
          ref={previewRef}
          data-export-preview
          data-export-name="Spotlight Sessions"
          className="relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] w-full rounded-[14px]"
          style={{
            aspectRatio: "1920 / 1080",
            containerType: "inline-size",
            maxWidth: "min(100%, calc((100vh - 200px) * 1.778))",
            background: "#cfeaff",
          }}
        >
          {/* Background plate */}
          <img src={BG_URL} alt="" className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" draggable={false} />

          {/* Person photo with bottom fade */}
          {personImage && (
            <div
              className="absolute inset-0 select-none"
              style={{ cursor: isDragging ? "grabbing" : personImage ? "grab" : "default" }}
              onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
            >
              <div
                className="absolute"
                style={{
                  left: `${personX}%`,
                  top: `${personY}%`,
                  transform: `translate(-50%, -50%) scale(${personScale / 100})`,
                  width: "55%",
                  height: "120%",
                  WebkitMaskImage: fadeMask,
                  maskImage: fadeMask,
                }}
              >
                <img
                  src={personImage}
                  alt=""
                  className="w-full h-full object-contain object-bottom"
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* Headline (left side) */}
          <div
            className="absolute"
            style={{
              left: "5%",
              top: "30%",
              width: "48%",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              color: "#0E2E63",
              fontSize: "5.6cqw",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textShadow: "0 0.1cqw 0.2cqw rgba(255,255,255,0.4)",
              wordBreak: "break-word",
              pointerEvents: "none",
            }}
          >
            {headline || " "}
          </div>

          {/* Name pill (bottom-right) */}
          <div
            className="absolute"
            style={{
              right: "5%",
              bottom: "8%",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "#0E2240",
                color: "#FFFFFF",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: "2.6cqw",
                letterSpacing: "0.06em",
                padding: "1.2cqw 2.6cqw",
                borderRadius: "1.4cqw",
                textTransform: "uppercase",
                boxShadow: "0 0.5cqw 1.4cqw rgba(14,34,64,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              {guestName || "NAME HERE"}
            </div>
          </div>

        </div>
      </LivePreview>
    </div>
  );
}
