import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { round3, type CaptionTiming, type TimedText } from "./edits";
import { TimeInput, inputCls, ghostBtn } from "./ui";

interface Props { units: TimedText[]; timing: CaptionTiming; time: number; onChange: (u: TimedText[]) => void; onSeek: (t: number) => void }

/** Edit caption text and timing. Word mode: clickable word chips. Segment mode: segment rows. */
export function CaptionEditor({ units, timing, time, onChange, onSeek }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const update = (i: number, patch: Partial<TimedText>) => onChange(units.map((u, j) => j === i ? { ...u, ...patch } : u));
  const remove = (i: number) => { onChange(units.filter((_, j) => j !== i)); setSelected(null); };
  const insertAfter = (i: number) => {
    const prev = units[i];
    const s = prev ? prev.end : round3(time);
    const next = [...units];
    next.splice(i + 1, 0, { text: timing === "word" ? "word" : "New caption", start: s, end: round3(s + (timing === "word" ? 0.3 : 2)) });
    onChange(next);
    setSelected(i + 1);
  };

  if (!units.length) {
    return (
      <div className="p-[12px] rounded-[10px] border border-dashed border-[rgba(255,255,255,0.08)] text-[11px] text-[#64748B] leading-[1.5]">
        No captions yet.
        <button type="button" className={`${ghostBtn} mt-[8px]`} onClick={() => insertAfter(-1)}><Plus className="w-[11px] h-[11px]" />Add caption at playhead</button>
      </div>
    );
  }

  const sel = selected !== null ? units[selected] : null;
  return (
    <div>
      {timing === "word" ? (
        <div className="max-h-[180px] overflow-y-auto flex flex-wrap gap-[3px] p-[8px] rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
          {units.map((w, i) => {
            const live = time >= w.start && time < w.end;
            return (
              <button key={i} type="button" onClick={() => { setSelected(i); onSeek(w.start); }}
                className={`px-[4px] py-[1px] rounded-[4px] text-[12px] border-none cursor-pointer transition-colors ${i === selected ? "bg-[#1AA3F0] text-white" : live ? "bg-[rgba(26,163,240,0.25)] text-white" : "bg-transparent text-[#CBD5E1] hover:bg-[rgba(255,255,255,0.06)]"}`}>
                {w.text || "\u2009"}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto flex flex-col gap-[4px]">
          {units.map((s, i) => (
            <button key={i} type="button" onClick={() => { setSelected(i); onSeek(s.start); }}
              className={`text-left p-[8px] rounded-[8px] border cursor-pointer text-[11px] leading-[1.4] ${i === selected ? "border-[rgba(26,163,240,0.5)] bg-[rgba(26,163,240,0.08)] text-white" : "border-[rgba(255,255,255,0.05)] bg-transparent text-[#94A3B8]"}`}>
              <span className="tabular-nums text-[#64748B] mr-[6px]">{s.start.toFixed(1)}s</span>{s.text}
            </button>
          ))}
        </div>
      )}
      {sel && selected !== null && (
        <div className="mt-[8px] p-[10px] rounded-[10px] bg-[rgba(0,178,169,0.04)] border border-[rgba(0,178,169,0.12)] flex flex-col gap-[8px]">
          {timing === "word"
            ? <input className={inputCls} value={sel.text} onChange={e => update(selected, { text: e.target.value })} aria-label="Word text" />
            : <textarea className={`${inputCls} resize-none`} rows={2} value={sel.text} onChange={e => update(selected, { text: e.target.value })} aria-label="Caption text" />}
          <div className="flex gap-[8px]">
            <TimeInput label="Start (s)" value={sel.start} onChange={v => update(selected, { start: v })} />
            <TimeInput label="End (s)" value={sel.end} onChange={v => update(selected, { end: v })} />
          </div>
          <div className="flex gap-[6px]">
            <button type="button" className={`${ghostBtn} flex-1`} onClick={() => update(selected, { start: round3(time) })}>Start at playhead</button>
            <button type="button" className={`${ghostBtn} flex-1`} onClick={() => update(selected, { end: round3(time) })}>End at playhead</button>
          </div>
          <div className="flex gap-[6px]">
            <button type="button" className={`${ghostBtn} flex-1`} onClick={() => insertAfter(selected)}><Plus className="w-[11px] h-[11px]" />Insert after</button>
            <button type="button" className={`${ghostBtn} flex-1 hover:!text-[#F87171]`} onClick={() => remove(selected)}><Trash2 className="w-[11px] h-[11px]" />Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
