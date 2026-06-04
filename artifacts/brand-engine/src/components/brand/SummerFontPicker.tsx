// Searchable Google Fonts picker for the Summer of AI editor.
// Each row previews its own font (lazy-loaded), and selecting one loads it for
// the live canvas. Exports embed the chosen font separately (see googleFonts.ts).

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import {
  GOOGLE_FONTS,
  fontDefFor,
  fontStackFor,
  ensureGoogleFont,
  type GoogleFontDef,
} from "./googleFonts";

const CATEGORY_LABEL: Record<GoogleFontDef["category"], string> = {
  sans: "Sans",
  serif: "Serif",
  display: "Display",
  handwriting: "Script",
  mono: "Mono",
};

function FontRow({
  def,
  active,
  onPick,
}: {
  def: GoogleFontDef;
  active: boolean;
  onPick: (family: string) => void;
}): React.ReactElement {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [shown, setShown] = useState(false);

  // Lazy-load the font only when the row scrolls into view, so opening the list
  // doesn't fire a hundred font requests at once.
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          ensureGoogleFont(def.family, def.weight);
          setShown(true);
          io.disconnect();
        }
      },
      { root: el.closest("[data-font-list]"), rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [def.family, def.weight, shown]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onPick(def.family)}
      className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-[9px] text-left transition-colors hover:bg-white/[0.07]"
      style={{ background: active ? "rgba(255,208,0,0.12)" : "transparent" }}
    >
      <span
        className="truncate text-[16px] leading-none text-white"
        style={{ fontFamily: shown ? fontStackFor(def) : "inherit", fontWeight: def.weight }}
      >
        {def.family}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[1px] text-[#7C8BA5]">
          {CATEGORY_LABEL[def.category]}
        </span>
        {active && <Check className="h-[14px] w-[14px] text-[#FFD000]" />}
      </span>
    </button>
  );
}

export function SummerFontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const current = fontDefFor(value);

  // Make sure the selected font renders on the trigger button.
  useEffect(() => {
    ensureGoogleFont(current.family, current.weight);
  }, [current.family, current.weight]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GOOGLE_FONTS;
    return GOOGLE_FONTS.filter((f) => f.family.toLowerCase().includes(q));
  }, [query]);

  const pick = (family: string) => {
    onChange(family);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-[10px] border px-3 py-[10px] transition-colors"
        style={{
          borderColor: open ? "rgba(255,208,0,0.7)" : "rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <span
          className="truncate text-[15px] text-white"
          style={{ fontFamily: fontStackFor(current), fontWeight: current.weight }}
        >
          {current.family}
        </span>
        <ChevronDown
          className="h-[16px] w-[16px] shrink-0 text-[#9AA7BD] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-[6px] overflow-hidden rounded-[12px] border border-white/12 bg-[#0B1322] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-[9px]">
            <Search className="h-[14px] w-[14px] text-[#7C8BA5]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google Fonts…"
              className="w-full bg-transparent text-[13px] text-white placeholder:text-[#5E6C82] focus:outline-none"
            />
            <span className="shrink-0 text-[10px] tabular-nums text-[#5E6C82]">{results.length}</span>
          </div>
          <div data-font-list className="max-h-[280px] overflow-y-auto p-[6px]">
            {results.length === 0 ? (
              <p className="px-3 py-4 text-center text-[12px] text-[#7C8BA5]">No fonts match “{query}”.</p>
            ) : (
              results.map((def) => (
                <FontRow key={def.family} def={def} active={def.family === value} onPick={pick} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
