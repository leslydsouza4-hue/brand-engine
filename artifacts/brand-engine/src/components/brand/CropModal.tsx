import { useState, useRef, useCallback, useEffect } from "react";
import { Crop, X, Check, RotateCcw } from "lucide-react";

interface CropModalProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function CropModal({ imageSrc, onCrop, onCancel }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [dragging, setDragging] = useState<null | "move" | "nw" | "ne" | "sw" | "se">(null);
  const dragStart = useRef({ mx: 0, my: 0, crop: { x: 0, y: 0, w: 0, h: 0 } });

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { px: 0, py: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, type: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    const { px, py } = getRelativePos(e.clientX, e.clientY);
    dragStart.current = { mx: px, my: py, crop: { ...crop } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [crop, getRelativePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const { px, py } = getRelativePos(e.clientX, e.clientY);
    const dx = px - dragStart.current.mx;
    const dy = py - dragStart.current.my;
    const s = dragStart.current.crop;

    if (dragging === "move") {
      const nx = Math.max(0, Math.min(100 - s.w, s.x + dx));
      const ny = Math.max(0, Math.min(100 - s.h, s.y + dy));
      setCrop({ ...s, x: nx, y: ny });
    } else {
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
      const MIN = 10;

      if (dragging === "nw" || dragging === "sw") {
        const newX = Math.max(0, Math.min(s.x + s.w - MIN, s.x + dx));
        nw = s.w + (s.x - newX);
        nx = newX;
      }
      if (dragging === "ne" || dragging === "se") {
        nw = Math.max(MIN, Math.min(100 - s.x, s.w + dx));
      }
      if (dragging === "nw" || dragging === "ne") {
        const newY = Math.max(0, Math.min(s.y + s.h - MIN, s.y + dy));
        nh = s.h + (s.y - newY);
        ny = newY;
      }
      if (dragging === "sw" || dragging === "se") {
        nh = Math.max(MIN, Math.min(100 - s.y, s.h + dy));
      }
      setCrop({ x: nx, y: ny, w: nw, h: nh });
    }
  }, [dragging, getRelativePos]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const resetCrop = () => setCrop({ x: 10, y: 10, w: 80, h: 80 });

  const applyCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const cx = Math.round((crop.x / 100) * img.naturalWidth);
    const cy = Math.round((crop.y / 100) * img.naturalHeight);
    const cw = Math.round((crop.w / 100) * img.naturalWidth);
    const ch = Math.round((crop.h / 100) * img.naturalHeight);
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    onCrop(canvas.toDataURL("image/jpeg", 0.92));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") applyCrop();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [crop]);

  const handleStyle = "w-[14px] h-[14px] bg-white rounded-full border-2 border-[#2896FB] absolute z-[20] shadow-[0_0_6px_rgba(0,0,0,0.4)]";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] backdrop-blur-sm p-[24px]">
      <div className="flex flex-col max-w-[900px] w-full max-h-[90vh] bg-[#0D1320] rounded-[20px] border border-[rgba(255,255,255,0.08)] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-[10px]">
            <Crop className="w-[16px] h-[16px] text-[#2896FB]" />
            <span className="text-[14px] font-semibold text-white">Crop UI Screenshot</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={resetCrop}
              className="h-[32px] px-[12px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] text-[11px] font-medium flex items-center gap-[6px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-all"
            >
              <RotateCcw className="w-[12px] h-[12px]" />
              Reset
            </button>
            <button
              onClick={onCancel}
              className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#64748B] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D] transition-all"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-[24px] flex items-center justify-center">
          <div
            ref={containerRef}
            className="relative select-none max-w-full max-h-[60vh]"
            style={{ touchAction: "none" }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              crossOrigin="anonymous"
              className="block max-w-full max-h-[60vh] rounded-[8px]"
              draggable={false}
            />

            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(to right,
                rgba(0,0,0,0.6) ${crop.x}%,
                transparent ${crop.x}%,
                transparent ${crop.x + crop.w}%,
                rgba(0,0,0,0.6) ${crop.x + crop.w}%)`,
            }} />
            <div className="absolute pointer-events-none" style={{
              left: `${crop.x}%`, top: 0, width: `${crop.w}%`, height: `${crop.y}%`,
              background: "rgba(0,0,0,0.6)",
            }} />
            <div className="absolute pointer-events-none" style={{
              left: `${crop.x}%`, top: `${crop.y + crop.h}%`, width: `${crop.w}%`, bottom: 0,
              background: "rgba(0,0,0,0.6)",
            }} />

            <div
              className="absolute border-2 border-[#2896FB] rounded-[4px] cursor-move z-[10]"
              style={{
                left: `${crop.x}%`, top: `${crop.y}%`,
                width: `${crop.w}%`, height: `${crop.h}%`,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)",
              }}
              onPointerDown={e => handlePointerDown(e, "move")}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="absolute w-full h-[1px] bg-[rgba(255,255,255,0.15)] top-[33%]" />
              <div className="absolute w-full h-[1px] bg-[rgba(255,255,255,0.15)] top-[66%]" />
              <div className="absolute h-full w-[1px] bg-[rgba(255,255,255,0.15)] left-[33%]" />
              <div className="absolute h-full w-[1px] bg-[rgba(255,255,255,0.15)] left-[66%]" />
            </div>

            <div className={handleStyle} style={{ left: `${crop.x}%`, top: `${crop.y}%`, transform: "translate(-50%,-50%)", cursor: "nw-resize" }}
              onPointerDown={e => handlePointerDown(e, "nw")} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className={handleStyle} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y}%`, transform: "translate(-50%,-50%)", cursor: "ne-resize" }}
              onPointerDown={e => handlePointerDown(e, "ne")} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className={handleStyle} style={{ left: `${crop.x}%`, top: `${crop.y + crop.h}%`, transform: "translate(-50%,-50%)", cursor: "sw-resize" }}
              onPointerDown={e => handlePointerDown(e, "sw")} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className={handleStyle} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y + crop.h}%`, transform: "translate(-50%,-50%)", cursor: "se-resize" }}
              onPointerDown={e => handlePointerDown(e, "se")} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
          </div>
        </div>

        <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-[11px] text-[#64748B]">Drag corners to select the UI area</span>
          <div className="flex gap-[8px]">
            <button
              onClick={onCancel}
              className="h-[36px] px-[16px] rounded-[10px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] text-[12px] font-medium cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-all"
            >
              Skip
            </button>
            <button
              onClick={applyCrop}
              className="h-[36px] px-[20px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] border-none text-white text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer hover:shadow-[0_4px_16px_rgba(40,150,251,0.3)] transition-all"
            >
              <Check className="w-[14px] h-[14px]" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
