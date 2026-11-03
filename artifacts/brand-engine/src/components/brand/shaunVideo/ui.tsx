import type { ReactNode } from "react";
import { fmtTime, round3 } from "./edits";

export const sectionLabel = "text-[11px] font-semibold uppercase tracking-[1.2px] text-[#64748B]";
export const ghostBtn = "flex items-center justify-center gap-[5px] py-[6px] px-[10px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-transparent text-[11px] font-semibold text-[#94A3B8] cursor-pointer hover:text-[#00B2A9] hover:border-[rgba(0,178,169,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#94A3B8] disabled:hover:border-[rgba(255,255,255,0.06)]";
export const primaryBtn = "flex items-center justify-center gap-[6px] w-full py-[11px] px-[14px] rounded-[12px] border-none text-[13px] font-semibold text-white cursor-pointer transition-all bg-[linear-gradient(135deg,#095DC3_0%,#2896FB_45%,#00B2A9_100%)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100";
export const inputCls = "w-full py-[8px] px-[10px] rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.4)] transition-all";

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="py-[14px] border-t border-[rgba(255,255,255,0.04)] first:border-t-0">
      <div className="flex items-center justify-between mb-[10px]"><span className={sectionLabel}>{title}</span>{right}</div>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-[6px]">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 py-[7px] px-[8px] border rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all ${value === o.value ? "bg-[rgba(0,178,169,0.12)] border-[rgba(0,178,169,0.4)] text-[#00B2A9]" : "bg-transparent border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Seconds input that commits on blur/Enter so typing never fights the value. */
export function TimeInput({ value, onChange, label, min = 0, max }: { value: number; onChange: (v: number) => void; label?: string; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-[3px] min-w-0 flex-1">
      {label && <span className="text-[10px] font-medium text-[#64748B]">{label}</span>}
      <input
        key={value}
        type="number" step="0.05" min={min} max={max} defaultValue={round3(value)}
        title={fmtTime(value)}
        onBlur={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n !== value) onChange(round3(Math.max(min, max === undefined ? n : Math.min(max, n)))); else e.target.value = String(round3(value)); }}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className={`${inputCls} py-[6px] tabular-nums`}
      />
    </label>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="mt-[8px]">
      <div className="flex justify-between text-[10px] font-medium text-[#64748B] mb-[4px]"><span>{label}</span><span className="tabular-nums">{Math.round(value * 100)}%</span></div>
      <div className="h-[4px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="h-full w-full origin-left bg-[#00B2A9] transition-transform duration-500" style={{ transform: `scaleX(${Math.max(0.02, Math.min(1, value))})` }} />
      </div>
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-[8px] p-[9px] rounded-[10px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[11px] text-[#F87171] leading-[1.45]">
      {message}
      {onRetry && <button type="button" onClick={onRetry} className="ml-[6px] underline font-semibold bg-transparent border-none text-[#FCA5A5] cursor-pointer">Retry</button>}
    </div>
  );
}
