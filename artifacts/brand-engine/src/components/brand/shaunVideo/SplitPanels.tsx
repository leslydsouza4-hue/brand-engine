import { useState } from "react";
import { clamp, round3, type Rect, type SplitLayout } from "./edits";
import { inputCls } from "./ui";

const FIELDS: { k: keyof Rect; label: string }[] = [{ k: "x", label: "X" }, { k: "y", label: "Y" }, { k: "width", label: "W" }, { k: "height", label: "H" }];

function RectRow({ title, hint, color, rect, onChange, id }: { title: string; hint: string; color: string; rect: Rect; onChange: (r: Rect) => void; id: string }) {
  const set = (k: keyof Rect, pct: number) => {
    const v = clamp(pct / 100, 0, 1);
    const next = { ...rect, [k]: v };
    if (k === "x") next.width = Math.min(next.width, 1 - v);
    if (k === "y") next.height = Math.min(next.height, 1 - v);
    if (k === "width") next.width = Math.max(0.02, Math.min(v, 1 - next.x));
    if (k === "height") next.height = Math.max(0.02, Math.min(v, 1 - next.y));
    onChange({ x: round3(next.x), y: round3(next.y), width: round3(next.width), height: round3(next.height) });
  };
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[6px] text-[10px] font-semibold text-[#CBD5E1]">
        <span className="w-[8px] h-[8px] rounded-[2px]" style={{ background: color }} />{title}
        <span className="font-normal text-[#475569]">{hint}</span>
      </div>
      <div className="grid grid-cols-4 gap-[4px]">
        {FIELDS.map(f => (
          <label key={f.k} className="flex flex-col gap-[2px]">
            <span className="text-[9px] text-[#64748B]">{f.label} %</span>
            <input
              key={rect[f.k]} data-testid={`input-${id}-${f.k}`}
              type="number" step="0.5" min={0} max={100} defaultValue={round3(rect[f.k] * 100)}
              onBlur={e => { const n = Number(e.target.value); if (Number.isFinite(n) && Math.abs(n / 100 - rect[f.k]) > 1e-4) set(f.k, n); else e.target.value = String(round3(rect[f.k] * 100)); }}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className={`${inputCls} py-[5px] px-[6px] text-[11px] tabular-nums`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** Compact numeric editor for split source bounds, as percentages of the original frame. */
export function SplitPanels({ split, onChange }: { split: SplitLayout; onChange: (s: SplitLayout) => void }) {
  const [advanced, setAdvanced] = useState(false);
  const scaleControl = (panel: "screen" | "speaker") => {
    const key = panel === "screen" ? "screenScale" : "speakerScale";
    const value = Math.round((split[key] ?? 1) * 100);
    const title = panel === "screen" ? "Screen" : "Speaker";
    return <label className="block text-[11px] text-[#94A3B8]">
      <span className="flex justify-between items-center">{title} scale · {value}%
        <button type="button" className="text-[#00B2A9] text-[10px]" onClick={() => onChange({ ...split, [key]: 1 })}>Reset</button>
      </span>
      <input type="range" aria-label={`${title} scale`} min="50" max="200" step="1" value={value}
        onChange={e => onChange({ ...split, [key]: Number(e.target.value) / 100 })}
        className="w-full accent-[#00B2A9] mt-[5px]" />
    </label>;
  };
  const posReset = (panel: "screen" | "speaker") => {
    const key = panel === "screen" ? "screenPan" : "speakerPan";
    const p = split[key];
    const moved = !!p && (Math.abs(p.x) > 0.001 || Math.abs(p.y) > 0.001);
    return <button type="button" data-testid={`button-reset-${panel}-position`} disabled={!moved}
      onClick={() => onChange({ ...split, [key]: { x: 0, y: 0 } })}
      className="text-[10px] text-[#00B2A9] disabled:text-[#475569] disabled:cursor-default">Reset position</button>;
  };
  return (
    <div className="flex flex-col gap-[10px] p-[10px] rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <p className="text-[10px] text-[#94A3B8] leading-[1.45] m-0">Drag the screen or speaker in the preview to move it. Use the sliders to zoom.</p>
      {scaleControl("screen")}
      <div className="flex justify-end -mt-[6px]">{posReset("screen")}</div>
      {scaleControl("speaker")}
      <div className="flex justify-end -mt-[6px]">{posReset("speaker")}</div>
      <button type="button" data-testid="button-advanced-bounds" onClick={() => setAdvanced(a => !a)} className="self-start text-[10px] text-[#64748B] hover:text-[#94A3B8]">{advanced ? "Hide advanced crop bounds" : "Advanced crop bounds"}</button>
      {advanced && <>
        <RectRow id="screen" title="Screen" hint="area of original" color="#2896FB" rect={split.screen} onChange={screen => onChange({ ...split, screen })} />
        <RectRow id="speaker" title="Speaker" hint="area of original" color="#00B2A9" rect={split.speaker} onChange={speaker => onChange({ ...split, speaker })} />
      </>}
    </div>
  );
}
