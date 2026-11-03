import { useRef } from "react";
import { fmtTime, keptRanges, outputDuration, type VideoEdits } from "./edits";

interface Props { duration: number; time: number; edits: VideoEdits; selectedBlur: number | null; onSeek: (t: number) => void; onSelectBlur: (i: number) => void }

/** Source-time strip: kept footage, trimmed tails, cuts, blur intervals, playhead. */
export function Timeline({ duration, time, edits, selectedBlur, onSeek, onSelectBlur }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = (t: number) => `${(Math.max(0, Math.min(duration, t)) / (duration || 1)) * 100}%`;
  const w = (a: number, b: number) => `${(Math.max(0, b - a) / (duration || 1)) * 100}%`;
  const seek = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) onSeek(Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration)));
  };
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
        <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)] pointer-events-none" style={{ left: pct(time) }} />
      </div>
      <div className="flex gap-[12px] mt-[6px] text-[9px] font-medium text-[#64748B]">
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[8px] rounded-[2px] bg-[rgba(0,178,169,0.5)]" />Kept</span>
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[8px] rounded-[2px] bg-[rgba(248,113,113,0.5)]" />Cut</span>
        <span className="flex items-center gap-[4px]"><i className="w-[8px] h-[4px] rounded-full bg-[rgba(148,163,184,0.7)]" />Blur</span>
        <span className="ml-auto tabular-nums">{fmtTime(duration)}</span>
      </div>
    </div>
  );
}
