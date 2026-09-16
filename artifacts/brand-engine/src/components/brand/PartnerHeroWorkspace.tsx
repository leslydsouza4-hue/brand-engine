import { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  Loader2,
  Download,
  Info,
  Move,
  Maximize2
} from "lucide-react";
import { addExport, createThumbnail } from "./exportStore";
import { PhotoroomLink } from "./PhotoroomLink";

const BASE = import.meta.env.BASE_URL;

// Template resolution
const W = 2340;
const H = 1617;

// Mask bounds inside the blue card area
const MASK = {
  x: 90,
  y: 548,
  w: 890,
  h: 627,
  r: 50
};

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PartnerHeroWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jobRef = useRef(0);
  
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const currentPhotoUrl = useRef<string | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  
  const [baseScale, setBaseScale] = useState(1);
  const [relativeScale, setRelativeScale] = useState(1);
  const [posX, setPosX] = useState(MASK.x);
  const [posY, setPosY] = useState(MASK.y);

  useEffect(() => {
    return () => {
      jobRef.current += 1;
      if (currentPhotoUrl.current && currentPhotoUrl.current.startsWith("blob:")) {
        URL.revokeObjectURL(currentPhotoUrl.current);
      }
      currentPhotoUrl.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadImage(`${BASE}assets/partner-hero-base.png`)
      .then(img => { if (active) setBaseImg(img); })
      .catch(() => { if (active) setStatusMsg("Failed to load base template."); });
    return () => { active = false; };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(baseImg, 0, 0, W, H);

    if (photoImg) {
      ctx.save();
      drawRoundedRect(ctx, MASK.x, MASK.y, MASK.w, MASK.h, MASK.r);
      ctx.clip();
      
      const drawScale = baseScale * relativeScale;
      const dw = photoImg.width * drawScale;
      const dh = photoImg.height * drawScale;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(photoImg, posX, posY, dw, dh);
      
      ctx.restore();
    }
  }, [baseImg, photoImg, baseScale, relativeScale, posX, posY]);

  useEffect(() => {
    render();
  }, [render]);

  const fitPhoto = (img: HTMLImageElement) => {
    const scaleX = MASK.w / img.width;
    const scaleY = MASK.h / img.height;
    const containScale = Math.min(scaleX, scaleY);
    setBaseScale(containScale);
    setRelativeScale(1);
    setPosX(MASK.x + (MASK.w - img.width * containScale) / 2);
    setPosY(MASK.y + (MASK.h - img.height * containScale) / 2);
  };

  const cleanupCurrentUrl = () => {
    if (currentPhotoUrl.current && currentPhotoUrl.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentPhotoUrl.current);
    }
    currentPhotoUrl.current = null;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setStatusMsg("Please upload a PNG, JPG, or WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatusMsg("File is too large. Max 20MB.");
      return;
    }

    const job = ++jobRef.current;
    setStatusMsg(null);
    const blobUrl = URL.createObjectURL(file);
    
    try {
      const img = await loadImage(blobUrl);
      if (job !== jobRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      cleanupCurrentUrl();
      currentPhotoUrl.current = blobUrl;
      setPhotoUrl(blobUrl);
      setPhotoImg(img);
      fitPhoto(img);
    } catch {
      if (job === jobRef.current) setStatusMsg("Couldn't read that image.");
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleRemoveBackground = async () => {
    if (!photoUrl) return;
    const job = ++jobRef.current;
    setProcessing(true);
    setStatusMsg(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(photoUrl, {
        model: "isnet_fp16",
        output: { format: "image/png" },
      });
      if (job !== jobRef.current) return;
      
      const newBlobUrl = URL.createObjectURL(blob);
      let newImg;
      try {
        newImg = await loadImage(newBlobUrl);
      } catch {
        URL.revokeObjectURL(newBlobUrl);
        throw new Error("Decode failed");
      }
      
      if (job !== jobRef.current) {
        URL.revokeObjectURL(newBlobUrl);
        return;
      }
      
      cleanupCurrentUrl();
      currentPhotoUrl.current = newBlobUrl;
      setPhotoUrl(newBlobUrl);
      setPhotoImg(newImg);
    } catch (err) {
      console.error(err);
      if (job === jobRef.current) setStatusMsg("Background removal failed. Try PhotoRoom instead.");
    } finally {
      if (job === jobRef.current) setProcessing(false);
    }
  };

  const exportPNG = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg || !photoImg) return;
    setExporting(true);
    setStatusMsg(null);
    try {
      render();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "partner-hero.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      try {
        const thumb = await createThumbnail(url);
        addExport({
          name: "partner-hero.png",
          source: "Partner Hero",
          format: "png",
          thumbnail: thumb,
          dimensions: `${W}x${H}`
        });
      } catch (e) {
        console.error("History export failed", e);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to download image.");
    } finally {
      setExporting(false);
    }
  };

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photoImg || processing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const displayScale = rect.width / W;
    const nativeX = (e.clientX - rect.left) / displayScale;
    const nativeY = (e.clientY - rect.top) / displayScale;

    if (
      nativeX < MASK.x || nativeX > MASK.x + MASK.w ||
      nativeY < MASK.y || nativeY > MASK.y + MASK.h
    ) {
      return;
    }

    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const displayScale = rect.width / W;

    const dx = (e.clientX - lastMouse.current.x) / displayScale;
    const dy = (e.clientY - lastMouse.current.y) / displayScale;

    setPosX(p => p + dx);
    setPosY(p => p + dy);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    const target = e.target as Element;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!photoImg || processing) return;
    if (e.deltaY !== 0) {
      setRelativeScale(s => Math.min(4, Math.max(0.25, s * (1 - e.deltaY * 0.001))));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-[28px] min-h-full p-[20px] xl:p-[28px]">
      {/* Left Control Panel */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-[24px]">
        <div>
          <h2 className="text-[18px] font-bold text-white leading-tight mb-[10px]">Partner Hero Builder</h2>
          <p className="text-[12px] text-[#94A3B8] leading-[1.6]">
            Composite a partner photo into the transparent hero card.
          </p>
        </div>

        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing || !baseImg}
          className="w-full flex flex-col items-center gap-[8px] py-[22px] px-[16px] rounded-[14px] border border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="w-[22px] h-[22px] text-[#94A3B8]" />
          <span className="text-[12px] font-semibold text-[#E2E8F0]">
            {photoUrl ? "Replace Partner Photo" : "Upload Partner Photo"}
          </span>
          <span className="text-[10px] text-[#64748B]">PNG, JPG, or WebP</span>
        </button>

        {statusMsg && (
          <div className="flex items-start gap-[8px] text-[11px] text-[#FCD34D] bg-[rgba(252,211,77,0.08)] border border-[rgba(252,211,77,0.18)] rounded-[10px] p-[10px]">
            <Info className="w-[13px] h-[13px] shrink-0 mt-[1px]" />
            <span>{statusMsg}</span>
          </div>
        )}

            {/* Background Removal */}
            <div className="flex flex-col gap-[12px] bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-[16px]">
              <button
                onClick={handleRemoveBackground}
                disabled={processing || !photoUrl}
                className="w-full py-[12px] rounded-[10px] bg-[rgba(40,150,251,0.1)] border border-[rgba(40,150,251,0.3)] text-[#2896FB] text-[12px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:bg-[rgba(40,150,251,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : <Loader2 className="w-[13px] h-[13px]" style={{ transform: "rotate(45deg)" }} />}
                {processing ? "Removing Background..." : "Remove Background"}
              </button>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                {photoUrl ? "Remove the photo background to create a transparent partner cutout." : "Upload a partner photo to enable automatic background removal."}
              </p>
              <PhotoroomLink />
            </div>

        {photoUrl && (
          <>
            {/* Transform Controls */}
            <div className="flex flex-col gap-[12px] bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-[14px]">
              <div className="flex items-center gap-[6px] mb-[2px]">
                <Maximize2 className="w-[13px] h-[13px] text-[#94A3B8]" />
                <label htmlFor="scale-slider" className="text-[11px] font-semibold text-[#CBD5E1]">Scale</label>
              </div>
              <input
                id="scale-slider"
                aria-label="Scale"
                type="range"
                min={0.25}
                max={4}
                step={0.01}
                value={relativeScale}
                onChange={(e) => setRelativeScale(Number(e.target.value))}
                className="w-full accent-white"
              />

              <div className="flex items-center gap-[6px] mt-[4px] mb-[2px]">
                <Move className="w-[13px] h-[13px] text-[#94A3B8]" />
                <span className="text-[11px] font-semibold text-[#CBD5E1]">Position</span>
              </div>
              <div className="flex flex-col gap-[16px]">
                <div className="flex-1">
                  <label htmlFor="pos-x" className="text-[11px] text-[#94A3B8] mb-[8px] flex justify-between">X Position <span>{Math.round(posX)}</span></label>
                  <input
                    id="pos-x"
                    type="range"
                    min={Math.min(posX, MASK.x - (photoImg?.width ?? 0) * baseScale * relativeScale)}
                    max={Math.max(posX, MASK.x + MASK.w)}
                    step={1}
                    value={Math.round(posX)}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="pos-y" className="text-[11px] text-[#94A3B8] mb-[8px] flex justify-between">Y Position <span>{Math.round(posY)}</span></label>
                  <input
                    id="pos-y"
                    type="range"
                    min={Math.min(posY, MASK.y - (photoImg?.height ?? 0) * baseScale * relativeScale)}
                    max={Math.max(posY, MASK.y + MASK.h)}
                    step={1}
                    value={Math.round(posY)}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#64748B] leading-[1.4] mt-[4px]">
                Tip: You can also drag the photo directly on the canvas to move it, or scroll to zoom.
              </p>
            </div>

            {/* Export */}
            <div className="mt-auto">
              <button
                onClick={exportPNG}
                disabled={exporting || processing || !photoImg}
                className="w-full py-[11px] rounded-[12px] bg-gradient-to-r from-[#00B2A9] to-[#2896FB] text-white text-[12px] font-bold flex items-center justify-center gap-[7px] cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(40,150,251,0.35)] disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
                Download Transparent PNG
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex-1 min-w-0 flex items-center justify-center rounded-[18px] border border-white/[0.06] bg-[#030b17] overflow-hidden relative checkerboard-bg">
        <style>{`
          .checkerboard-bg {
            background-image: 
              linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
              linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%), 
              linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          }
        `}</style>
        
        {!baseImg ? (
          <div className="flex items-center gap-[8px] text-[#64748B] text-[12px] font-medium">
            <Loader2 className="w-[14px] h-[14px] animate-spin" />
            Loading base template...
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-[24px]">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="w-full h-auto block object-contain cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
