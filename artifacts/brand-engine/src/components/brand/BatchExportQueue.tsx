import { useState } from "react";
import { X, Download, Loader2, Plus, Trash2, Package } from "lucide-react";
import JSZip from "jszip";
import type { QueuedThumbnail } from "./useExport";
import { addExport, createThumbnail } from "./exportStore";

interface BatchExportQueueProps {
  queue: QueuedThumbnail[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  isCapturing: boolean;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const b64 = atob(parts[1]);
  const arr = new Uint8Array(b64.length);
  for (let i = 0; i < b64.length; i++) arr[i] = b64.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function BatchExportQueue({ queue, onAdd, onRemove, onClear, isCapturing }: BatchExportQueueProps) {
  const [isZipping, setIsZipping] = useState(false);

  const handleExportAll = async () => {
    if (queue.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const nameCount: Record<string, number> = {};

      for (const item of queue) {
        let baseName = item.name || "thumbnail";
        if (nameCount[baseName] !== undefined) {
          nameCount[baseName]++;
          baseName = `${baseName}_${nameCount[baseName]}`;
        } else {
          nameCount[baseName] = 0;
        }
        const blob = dataUrlToBlob(item.dataUrl);
        zip.file(`${baseName}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      const d = new Date();
      const datePart = `${d.getMonth() + 1}-${d.getDate()}-${String(d.getFullYear()).slice(-2)}`;
      a.download = `Brand_Thumbnails_${datePart}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      for (const item of queue) {
        const thumb = await createThumbnail(item.dataUrl, 120);
        addExport({
          name: `${item.name}.png`,
          source: "Batch Export",
          format: "png",
          thumbnail: thumb,
          dimensions: "1920px",
        });
      }
    } catch (err) {
      console.error("Batch export failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="flex gap-[8px] mt-[8px]">
        <button
          onClick={onAdd}
          disabled={isCapturing}
          className="flex-1 py-[10px] rounded-[10px] border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] text-[#64748B] text-[10px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:border-[rgba(40,150,251,0.3)] hover:text-[#2896FB] hover:bg-[rgba(40,150,251,0.04)] disabled:opacity-50"
        >
          {isCapturing ? (
            <Loader2 className="w-[11px] h-[11px] animate-spin" />
          ) : (
            <Plus className="w-[11px] h-[11px]" />
          )}
          {isCapturing ? "Capturing..." : "Add to Batch Queue"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-[8px]">
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] flex items-center gap-[5px]">
          <Package className="w-[10px] h-[10px] text-[#2896FB]" />
          Batch Queue
          <span className="ml-[4px] bg-[#2896FB] text-white text-[8px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center">
            {queue.length}
          </span>
        </span>
        <button
          onClick={onClear}
          className="text-[9px] text-[#475569] hover:text-[#EF4444] transition-colors cursor-pointer bg-transparent border-none flex items-center gap-[3px]"
        >
          <Trash2 className="w-[9px] h-[9px]" />
          Clear
        </button>
      </div>

      <div className="flex gap-[6px] overflow-x-auto pb-[6px] hide-scrollbar">
        {queue.map((item, i) => (
          <div
            key={item.id}
            className="relative shrink-0 w-[72px] h-[42px] rounded-[8px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] group"
          >
            <img src={item.thumbnail} alt={`Queue ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute bottom-[2px] left-[4px] text-[7px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
              #{i + 1}
            </span>
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-[2px] right-[2px] w-[14px] h-[14px] rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#EF4444] hover:border-[#EF4444]"
            >
              <X className="w-[8px] h-[8px] text-white" />
            </button>
          </div>
        ))}

        <button
          onClick={onAdd}
          disabled={isCapturing}
          className="shrink-0 w-[42px] h-[42px] rounded-[8px] border border-dashed border-[rgba(255,255,255,0.1)] bg-transparent flex items-center justify-center cursor-pointer transition-all hover:border-[rgba(40,150,251,0.3)] hover:bg-[rgba(40,150,251,0.04)] disabled:opacity-50"
        >
          {isCapturing ? (
            <Loader2 className="w-[12px] h-[12px] text-[#64748B] animate-spin" />
          ) : (
            <Plus className="w-[14px] h-[14px] text-[#64748B]" />
          )}
        </button>
      </div>

      <button
        onClick={handleExportAll}
        disabled={isZipping}
        className="w-full mt-[8px] py-[9px] rounded-[10px] bg-gradient-to-r from-[#16A34A] to-[#22C55E] border-none text-white text-[10px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(34,197,94,0.3)] disabled:opacity-50"
      >
        {isZipping ? (
          <Loader2 className="w-[11px] h-[11px] animate-spin" />
        ) : (
          <Download className="w-[11px] h-[11px]" />
        )}
        {isZipping ? "Zipping..." : `Export All ${queue.length} as ZIP`}
      </button>
    </div>
  );
}
