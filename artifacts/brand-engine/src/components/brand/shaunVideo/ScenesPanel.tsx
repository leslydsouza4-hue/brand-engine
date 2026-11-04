import { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { fmtTime, MAX_SCENES, round3, type Scene, type SplitLayout } from "./edits";
import { SplitPanels } from "./SplitPanels";
import { Segmented, TimeInput, ghostBtn } from "./ui";

interface Props {
  scenes: Scene[];
  base: SplitLayout;
  time: number;
  duration: number;
  activeIndex: number | null;
  onChange: (scenes: Scene[]) => void;
  onSeek: (t: number) => void;
}

/** Source-time layout scenes: speaker-only fills the full 9:16 frame, split stacks screen over speaker. */
export function ScenesPanel({ scenes, base, time, duration, activeIndex, onChange, onSeek }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const set = (i: number, s: Partial<Scene>) => onChange(scenes.map((x, j) => j === i ? { ...x, ...s } : x));
  const add = () => {
    const start = round3(time), end = round3(Math.min(duration, time + 5));
    if (end - start < 0.1) return;
    const next = [...scenes, { start, end, mode: "split" as const, split: JSON.parse(JSON.stringify(base)) as SplitLayout }].sort((a, b) => a.start - b.start);
    onChange(next);
    setOpen(next.findIndex(s => s.start === start));
  };
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center gap-[6px] text-[10px] font-semibold text-[#CBD5E1]"><Layers className="w-[11px] h-[11px] text-[#2896FB]" />Scenes<span className="font-normal text-[#475569]">source time, outside scenes use the base layout</span></div>
      {scenes.length === 0 && <div className="text-[10px] text-[#475569] leading-[1.45]">One layout for the whole video. Add a scene to switch to speaker-only for a stretch.</div>}
      {scenes.map((sc, i) => (
        <div key={i} className={`rounded-[10px] border p-[8px] flex flex-col gap-[6px] ${i === activeIndex ? "border-[rgba(40,150,251,0.4)] bg-[rgba(40,150,251,0.05)]" : "border-[rgba(255,255,255,0.06)]"}`}>
          <div className="flex items-center gap-[6px]">
            <button type="button" onClick={() => onSeek(sc.start)} className="text-[11px] font-semibold text-[#E2E8F0] hover:text-[#00B2A9]">Scene {i + 1}</button>
            <span className="text-[10px] text-[#64748B] tabular-nums">{fmtTime(sc.start)}-{fmtTime(sc.end)}</span>
            <button type="button" onClick={() => setOpen(o => o === i ? null : i)} className="ml-auto text-[10px] text-[#00B2A9]">{open === i ? "Close" : "Edit"}</button>
            <button type="button" aria-label={`Remove scene ${i + 1}`} onClick={() => { onChange(scenes.filter((_, j) => j !== i)); setOpen(null); }} className="text-[#64748B] hover:text-[#F87171]"><Trash2 className="w-[11px] h-[11px]" /></button>
          </div>
          <Segmented value={sc.mode} onChange={mode => set(i, { mode })} options={[{ value: "split", label: "Split" }, { value: "speaker", label: "Speaker only" }]} />
          {open === i && <>
            <div className="flex gap-[6px]">
              <TimeInput label="From (s)" value={sc.start} max={duration} onChange={v => set(i, { start: v })} />
              <TimeInput label="Until (s)" value={sc.end} max={duration} onChange={v => set(i, { end: v })} />
            </div>
            <div className="flex gap-[6px]">
              <button type="button" className={`${ghostBtn} flex-1`} onClick={() => set(i, { start: round3(time) })}>From playhead</button>
              <button type="button" className={`${ghostBtn} flex-1`} onClick={() => set(i, { end: round3(time) })}>Until playhead</button>
            </div>
            <SplitPanels split={sc.split} onChange={split => set(i, { split })} />
          </>}
        </div>
      ))}
      <div className="flex gap-[6px]">
        <button type="button" data-testid="button-add-scene" disabled={scenes.length >= MAX_SCENES} onClick={add} className={`${ghostBtn} flex-1`}><Plus className="w-[11px] h-[11px]" />Scene at playhead</button>
        {scenes.length > 0 && <button type="button" data-testid="button-disable-scenes" onClick={() => { if (window.confirm("Use the base layout for the whole video? All scenes will be removed.")) onChange([]); }} className={`${ghostBtn} flex-1`}>Turn off scenes</button>}
      </div>
    </div>
  );
}
