import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  Loader2,
  RotateCcw,
  Scissors,
  FileText,
  Download,
  Trash2,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  computeCutContour,
  nodesToSvgPath,
  nodesToPdfBezier,
  insertNodeNear,
  type Pt,
} from "./highlyCutout";
import { addExport, createThumbnail } from "./exportStore";

const RED = "#ED1C24";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hasTransparency(img: HTMLImageElement): boolean {
  const c = document.createElement("canvas");
  const s = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * s));
  c.height = Math.max(1, Math.round(img.naturalHeight * s));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 240) return true;
  }
  return false;
}

export function HighlyCutoutWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const jobRef = useRef(0);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [nodes, setNodes] = useState<Pt[]>([]);

  const [border, setBorder] = useState(30); // 0..100
  const [detail, setDetail] = useState(6); // 1..10
  const [lineWidth, setLineWidth] = useState(8); // image px
  const [showNodes, setShowNodes] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const offsetPx = 4 + (border / 100) * 40;
  const epsilon = 5 - ((detail - 1) / 9) * 4.2; // detail 1 -> 5, 10 -> 0.8

  const regenerate = useCallback(
    (img: HTMLImageElement, b: number, d: number) => {
      // Generation token: only the most recent trace is allowed to commit state,
      // so rapid slider drags / upload-replace can't let a stale result win.
      const job = ++jobRef.current;
      setProcessing(true);
      // Defer so the UI can show the spinner before the heavy sync work.
      // (setTimeout rather than rAF — rAF is throttled in background/proxied iframes.)
      window.setTimeout(() => {
        if (job !== jobRef.current) return; // superseded by a newer trace
        try {
          const off = 4 + (b / 100) * 40;
          const eps = 5 - ((d - 1) / 9) * 4.2;
          const res = computeCutContour(img, { offset: off, detail: eps });
          if (job !== jobRef.current) return;
          setImgW(res.imgW);
          setImgH(res.imgH);
          setNodes(res.nodes);
          if (res.nodes.length < 3) {
            setStatusMsg("Couldn't trace an outline — try a clearer cutout of Highly.");
          } else {
            setStatusMsg(null);
          }
        } catch {
          setStatusMsg("Something went wrong tracing the outline.");
        } finally {
          if (job === jobRef.current) setProcessing(false);
        }
      }, 30);
    },
    []
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      try {
        let img = await loadImage(raw);
        let finalSrc = raw;
        // Highly usually arrives as a transparent PNG. If not, isolate it first.
        if (!hasTransparency(img)) {
          setRemovingBg(true);
          try {
            const { removeBackground } = await import("@imgly/background-removal");
            const blob = await removeBackground(raw, {
              model: "isnet_fp16",
              output: { format: "image/png" },
            });
            finalSrc = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = reject;
              r.readAsDataURL(blob);
            });
            img = await loadImage(finalSrc);
          } catch {
            setStatusMsg("Couldn't auto-isolate the background — using the image as-is.");
          } finally {
            setRemovingBg(false);
          }
        }
        imgElRef.current = img;
        setImgSrc(finalSrc);
        regenerate(img, border, detail);
      } catch {
        setStatusMsg("Couldn't read that image.");
        setRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Re-trace when border / detail change (debounced).
  useEffect(() => {
    if (!imgElRef.current) return;
    const id = window.setTimeout(() => regenerate(imgElRef.current!, border, detail), 220);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [border, detail]);

  const clientToSvg = useCallback((cx: number, cy: number): Pt => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  }, []);

  const onNodePointerDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDraggingIndex(i);
  };

  const onSvgPointerMove = (e: React.PointerEvent) => {
    if (draggingIndex === null) return;
    const p = clientToSvg(e.clientX, e.clientY);
    setNodes((prev) => {
      const next = prev.slice();
      next[draggingIndex] = p;
      return next;
    });
  };

  const onSvgPointerUp = () => setDraggingIndex(null);

  const onNodeDoubleClick = (i: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((prev) => (prev.length > 3 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const onPathClick = (e: React.MouseEvent) => {
    const p = clientToSvg(e.clientX, e.clientY);
    setNodes((prev) => insertNodeNear(prev, p));
  };

  const reset = () => {
    if (imgElRef.current) regenerate(imgElRef.current, border, detail);
  };

  const exportName = "highly-cutout";

  const exportPDF = async () => {
    if (!imgSrc || nodes.length < 3) return;
    setExporting(true);
    try {
      const orientation = imgW >= imgH ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "px", format: [imgW, imgH] });
      pdf.addImage(imgSrc, "PNG", 0, 0, imgW, imgH, undefined, "FAST");
      const { start, segments } = nodesToPdfBezier(nodes);
      pdf.setDrawColor(237, 28, 36);
      pdf.setLineWidth(lineWidth);
      pdf.setLineJoin("round");
      pdf.setLineCap("round");
      pdf.lines(segments, start.x, start.y, [1, 1], "S", true);
      pdf.save(`${exportName}.pdf`);
      createThumbnail(imgSrc).then((thumb) =>
        addExport({
          name: `${exportName}.pdf`,
          source: "Highly Cutout",
          format: "pdf",
          thumbnail: thumb,
          dimensions: `${imgW}x${imgH}`,
        })
      );
    } finally {
      setExporting(false);
    }
  };

  const exportPNG = async () => {
    if (!imgElRef.current || nodes.length < 3) return;
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = imgW;
      canvas.height = imgH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, imgW, imgH);
      ctx.drawImage(imgElRef.current, 0, 0, imgW, imgH);
      const path = new Path2D(nodesToSvgPath(nodes));
      ctx.strokeStyle = RED;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      createThumbnail(url).then((thumb) =>
        addExport({
          name: `${exportName}.png`,
          source: "Highly Cutout",
          format: "png",
          thumbnail: thumb,
          dimensions: `${imgW}x${imgH}`,
        })
      );
    } finally {
      setExporting(false);
    }
  };

  const svgPath = nodes.length >= 3 ? nodesToSvgPath(nodes) : "";
  const nodeR = Math.max(4, Math.min(imgW, imgH) / 90);
  const busy = processing || removingBg;

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] h-full">
      {/* Controls */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-[16px]">
        <div>
          <div className="flex items-center gap-[10px] mb-[6px]">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(237,28,36,0.12)] border border-[rgba(237,28,36,0.25)] flex items-center justify-center">
              <Scissors className="w-[17px] h-[17px] text-[#ED1C24]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white leading-tight">Highly Cutout</h2>
              <p className="text-[11px] text-[#94A3B8]">Auto die-cut line for print</p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={removingBg}
          className="w-full flex flex-col items-center gap-[8px] py-[22px] px-[16px] rounded-[14px] border border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {removingBg ? (
            <Loader2 className="w-[22px] h-[22px] text-[#2896FB] animate-spin" />
          ) : (
            <UploadCloud className="w-[22px] h-[22px] text-[#94A3B8]" />
          )}
          <span className="text-[12px] font-semibold text-[#E2E8F0]">
            {removingBg ? "Isolating Highly…" : imgSrc ? "Replace image" : "Upload Highly"}
          </span>
          <span className="text-[10px] text-[#64748B]">PNG with transparency works best</span>
        </button>

        {statusMsg && (
          <div className="flex items-start gap-[8px] text-[11px] text-[#FCD34D] bg-[rgba(252,211,77,0.08)] border border-[rgba(252,211,77,0.18)] rounded-[10px] p-[10px]">
            <Info className="w-[13px] h-[13px] shrink-0 mt-[1px]" />
            <span>{statusMsg}</span>
          </div>
        )}

        {imgSrc && (
          <>
            {/* Border distance */}
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <label className="text-[11px] font-semibold text-[#CBD5E1]">Border distance</label>
                <span className="text-[10px] text-[#64748B] tabular-nums">{Math.round(offsetPx)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={border}
                onChange={(e) => setBorder(Number(e.target.value))}
                className="w-full accent-[#ED1C24]"
              />
              <p className="text-[10px] text-[#64748B] mt-[3px]">How far the red line sits from Highly.</p>
            </div>

            {/* Detail */}
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <label className="text-[11px] font-semibold text-[#CBD5E1]">Detail</label>
                <span className="text-[10px] text-[#64748B] tabular-nums">{detail}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={detail}
                onChange={(e) => setDetail(Number(e.target.value))}
                className="w-full accent-[#2896FB]"
              />
              <p className="text-[10px] text-[#64748B] mt-[3px]">More detail follows the shape tighter.</p>
            </div>

            {/* Line thickness */}
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <label className="text-[11px] font-semibold text-[#CBD5E1]">Line thickness</label>
                <span className="text-[10px] text-[#64748B] tabular-nums">{lineWidth}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={24}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full accent-[#ED1C24]"
              />
            </div>

            <div className="flex gap-[8px]">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-[6px] py-[9px] rounded-[10px] bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-[#CBD5E1] hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <RotateCcw className="w-[12px] h-[12px]" /> Re-trace
              </button>
              <button
                onClick={() => setShowNodes((s) => !s)}
                className="flex-1 flex items-center justify-center gap-[6px] py-[9px] rounded-[10px] bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-[#CBD5E1] hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                {showNodes ? <EyeOff className="w-[12px] h-[12px]" /> : <Eye className="w-[12px] h-[12px]" />}
                {showNodes ? "Hide nodes" : "Show nodes"}
              </button>
            </div>

            <div className="text-[10px] text-[#64748B] leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-[10px]">
              <span className="text-[#94A3B8] font-semibold">Adjust nodes:</span> drag any dot to reshape
              the line · click the line to add a node · double-click a node to remove it.
            </div>

            {/* Export */}
            <div className="flex flex-col gap-[8px] mt-[2px]">
              <button
                onClick={exportPDF}
                disabled={exporting || busy || nodes.length < 3}
                className="w-full py-[11px] rounded-[10px] bg-gradient-to-r from-[#C81620] to-[#ED1C24] text-white text-[12px] font-bold flex items-center justify-center gap-[7px] cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(237,28,36,0.35)] disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : <FileText className="w-[13px] h-[13px]" />}
                Download PDF (Hi-Res)
              </button>
              <button
                onClick={exportPNG}
                disabled={exporting || busy || nodes.length < 3}
                className="w-full py-[9px] rounded-[10px] bg-white/[0.05] border border-white/10 text-[#CBD5E1] text-[11px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-all hover:bg-white/[0.08] disabled:opacity-50"
              >
                <Download className="w-[12px] h-[12px]" /> Download PNG
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 min-w-0 flex items-center justify-center rounded-[18px] border border-white/[0.06] bg-[repeating-conic-gradient(#0c1424_0%_25%,#0a111e_0%_50%)] bg-[length:28px_28px] p-[24px] relative overflow-auto">
        {!imgSrc ? (
          <div className="text-center text-[#475569]">
            <Scissors className="w-[40px] h-[40px] mx-auto mb-[12px] opacity-40" />
            <p className="text-[13px] font-medium text-[#64748B]">Upload Highly to generate a cut line</p>
            <p className="text-[11px] mt-[4px]">The red outline is drawn automatically — then fine-tune it.</p>
          </div>
        ) : (
          <div
            className="relative bg-white rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-full"
            style={{ width: "min(640px, 100%)", aspectRatio: imgW && imgH ? `${imgW} / ${imgH}` : undefined }}
          >
            <img
              src={imgSrc}
              alt="Highly"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            {imgW > 0 && imgH > 0 && (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${imgW} ${imgH}`}
                className="absolute inset-0 w-full h-full"
                style={{ overflow: "visible", touchAction: "none" }}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
                onPointerLeave={onSvgPointerUp}
              >
                {svgPath && (
                  <>
                    {/* Wide invisible hit area to add nodes on click */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(lineWidth * 2.5, 16)}
                      style={{ cursor: "copy" }}
                      onClick={onPathClick}
                    />
                    {/* Soft white halo for contrast over artwork */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={lineWidth + Math.max(2, lineWidth * 0.5)}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={0.85}
                      pointerEvents="none"
                    />
                    {/* The red cut line */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke={RED}
                      strokeWidth={lineWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                    {/* Draggable nodes */}
                    {showNodes &&
                      nodes.map((n, i) => (
                        <circle
                          key={i}
                          cx={n.x}
                          cy={n.y}
                          r={nodeR}
                          fill="#ffffff"
                          stroke={RED}
                          strokeWidth={Math.max(1.5, nodeR / 3)}
                          style={{ cursor: draggingIndex === i ? "grabbing" : "grab" }}
                          onPointerDown={onNodePointerDown(i)}
                          onDoubleClick={onNodeDoubleClick(i)}
                        />
                      ))}
                  </>
                )}
              </svg>
            )}

            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-[12px]">
                <div className="flex items-center gap-[8px] px-[14px] py-[8px] rounded-full bg-[#0a111e] text-white text-[12px] font-semibold">
                  <Loader2 className="w-[14px] h-[14px] animate-spin" />
                  {removingBg ? "Isolating Highly…" : "Tracing outline…"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
