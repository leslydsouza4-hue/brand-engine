import { useRef } from "react";
import { fmtTime, keptRanges, outputDuration, type VideoEdits } from "./edits";

interface Props { duration: number; time: number; edits: VideoEdits; selectedBlur: number | null; onSeek: (t: number) => void; onSelectBlur: (i: number) => void; onTrim?: (start: number, end: number) => void }

/** Source-time strip: kept footage, trimmed tails, cuts, blur intervals, playhead. */
export function Timeline({ duration, time, edits, selectedBlur, onSeek, onSelectBlur, onTrim }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = (t: number) => `${(Math.max(0, Math.min(duration, t)) / (duration || 1)) * 100}%`;
  const w = (a: number, b: number) => `${(Math.max(0, b - a) / (duration || 1)) * 100}%`;
  const seek = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) onSeek(Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration)));
  };
  const at = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration)) : 0;
  };
  const MIN_KEEP = 1;
  const handle = (side: "start" | "end") => (
    <div
      role="slider" tabIndex={0} aria-label={side === "start" ? "Trim start" : "Trim end"} data-testid={`trim-${side}`}
      aria-valuemin={0} aria-valuemax={duration} aria-valuenow={side === "start" ? edits.trimStart : edits.trimEnd}
      title={side === "start" ? "Drag to trim the start" : "Drag to trim the end"}
      className="absolute top-0 bottom-0 w-[12px] -ml-[6px] z-[2] cursor-ew-resize flex items-center justify-center touch-none"
      style={{ left: pct(side === "start" ? edits.trimStart : edits.trimEnd) }}
      onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => {
        if (!e.buttons || !onTrim) return;
        const t = at(e.clientX);
        if (side === "start") onTrim(Math.min(t, edits.trimEnd - MIN_KEEP), edits.trimEnd);
        else onTrim(edits.trimStart, Math.max(t, edits.trimStart + MIN_KEEP));
      }}
      onKeyDown={e => {
        if (!onTrim || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.stopPropagation(); e.preventDefault();
        const d = e.key === "ArrowLeft" ? -0.1 : 0.1;
        if (side === "start") onTrim(Math.max(0, Math.min(edits.trimStart + d, edits.trimEnd - MIN_KEEP)), edits.trimEnd);
        else onTrim(edits.trimStart, Math.min(duration, Math.max(edits.trimEnd + d, edits.trimStart + MIN_KEEP)));
      }}
    >
      <span className="block w-[6px] h-[26px] rounded-[3px] bg-[#FFD000] shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
    </div>
  );
  return (
    <div className="w-full select-none">
      <div className="flex justify-between text-[10px] font-medium text-[#64748B] mb-[6px] tabular-nums">
        <span>{fmtTime(time)} source</span>
        <span>Output {fmtTime(outputDuration(edits))}</span>
      </div>
      <div
        ref={ref}
        className="relative h-[34px] rounded-[8px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] cursor-pointer overflow-hidden"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX); }}
        onPointerMove={e => { if (e.buttons) seek(e.clientX); }}
        role="slider" aria-label="Source timeline" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={time}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "ArrowLeft") onSeek(Math.max(0, time - 0.5)); if (e.key === "ArrowRight") onSeek(Math.min(duration, time + 0.5)); }}
      >
        {keptRanges(edits).map((r, i) => (
          <div key={i} className="absolute top-0 bottom-[12px] bg-[rgba(0,178,169,0.28)] border-x border-[rgba(0,178,169,0.6)]" style={{ left: pct(r.start), width: w(r.start, r.end) }} />
        ))}
        {edits.cuts.map((c, i) => (
          <div key={i} className="absolute top-0 bottom-[12px] bg-[repeating-linear-gradient(135deg,rgba(248,113,113,0.35)_0_4px,transparent_4px_8px)]" style={{ left: pct(c.start), width: w(c.start, c.end) }} />
        ))}
        {edits.blurs.map((b, i) => (
          <button key={i} type="button" onPointerDown={e => e.stopPropagation()} onClick={() => onSelectBlur(i)}
            className={`absolute bottom-[3px] h-[6px] rounded-full border-none cursor-pointer ${i === selectedBlur ? "bg-[#2896FB]" : "bg-[rgba(148,163,184,0.6)]"}`}
            style={{ left: pct(b.start), width: w(b.start, b.end) }} aria-label={`Blur ${i + 1}`} />
        ))}
        {edits.trimStart > 0 && <div className="absolute top-0 bottom-0 left-0 bg-[rgba(0,0,0,0.45)] pointer-events-none" style={{ width: pct(edits.trimStart) }} />}
        {edits.trimEnd < duration && <div className="absolute top-0 bottom-0 right-0 bg-[rgba(0,0,0,0.45)] pointer-events-none" style={{ width: w(edits.trimEnd, duration) }} />}
        <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)] pointer-events-none" style={{ left: pct(time) }} />
        {onTrim && duration > 0 && handle("start")}
        {onTrim && duration > 0 && handle("end")}
      </div>
      <div className="flex gap-[12px] mt-[6px] text-[9px] font-medium text-[#64748B]">
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[8px] rounded-[2px] bg-[rgba(0,178,169,0.5)]" />Kept</span>
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[8px] rounded-[2px] bg-[rgba(248,113,113,0.5)]" />Cut</span>
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[4px] rounded-full bg-[rgba(148,163,184,0.7)]" />Blur</span>
        {onTrim && <span className="flex items-center gap-[4px]"><i className="w-[3px] h-[9px] rounded-[1px] bg-[#FFD000]" />Drag to trim</span>}
        <span className="ml-auto tabular-nums">{fmtTime(duration)}</span>
      </div>
    </div>
  );
}
