import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import manifest from "../../../public/levelup26/assets.json";

type CategoryId = "logos" | "backgrounds" | "photos" | "3d-icons";
type Asset = (typeof manifest.assets)[number];

const BASE = import.meta.env.BASE_URL;
const categories: { id: CategoryId; title: string; description: string; color: string; kinds: string[] }[] = [
  { id: "logos", title: "Logos", description: "LevelUp 2026 wordmarks and lockups", color: "#69DDF4", kinds: ["logo"] },
  { id: "backgrounds", title: "Backgrounds", description: "Extracted, lettering-free design backgrounds", color: "#FFD335", kinds: ["background"] },
  { id: "photos", title: "Photos", description: "Sourced portraits and headshots from the Figma file", color: "#7BE6B4", kinds: ["speakerPortrait", "headshot", "unidentifiedPortrait"] },
  { id: "3d-icons", title: "3D Icons", description: "Source collection not yet available", color: "#AC9EF6", kinds: [] },
];

function assetUrl(asset: Asset) {
  return `${BASE}${asset.url.replace(/^\//, "")}`;
}

export function LevelUpBrandDirectoryWorkspace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [type, setType] = useState("all");
  const [expanded, setExpanded] = useState<Set<CategoryId>>(new Set(["logos"]));
  const query = search.trim().toLowerCase();

  const visible = categories
    .filter(group => category === "all" || category === group.id)
    .map(group => ({
      ...group,
      items: manifest.assets.filter(asset =>
        group.kinds.includes(asset.kind) &&
        (type === "all" || asset.url.toLowerCase().endsWith(`.${type}`)) &&
        (!query || `${asset.name} ${asset.kind} ${group.title} ${asset.sourceNodeId}`.toLowerCase().includes(query))
      ),
    }))
    .filter(group => group.id === "3d-icons"
      ? (category === "3d-icons" || (!query || group.title.toLowerCase().includes(query)) && type === "all")
      : !!group.items.length);

  const toggle = (id: CategoryId) => setExpanded(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-[16px] md:px-[40px] py-[24px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-[28px]">
            <div className="text-[11px] uppercase tracking-[.18em] text-[#69DDF4] mb-[6px]">LevelUp 26 / Assets</div>
            <h1 className="text-[22px] font-bold text-white mb-[4px]">Brand Directory</h1>
            <p data-testid="text-levelup-directory-summary" className="text-[13px] text-[#94A3B8]">
              {manifest.assets.length} sourced LevelUp 2026 assets from Figma. Browse, preview and download originals. Collection is partial.
            </p>
          </div>

          <div className="mb-[24px] flex flex-col sm:flex-row gap-[10px]">
            <label className="relative flex-1">
              <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#64748B]" />
              <input data-testid="input-levelup-directory-search" aria-label="Search LevelUp assets" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search assets..." className="w-full py-[11px] pl-[40px] pr-[16px] bg-white/[0.03] border border-white/[0.08] rounded-[12px] text-white text-[13px] outline-none focus:border-[#69DDF4] placeholder:text-[#64748B]" />
            </label>
            <select data-testid="select-levelup-directory-category" aria-label="Asset category" value={category} onChange={event => {
              const next = event.target.value as CategoryId | "all";
              setCategory(next);
              if (next !== "all") setExpanded(previous => new Set([...previous, next]));
            }} className="bg-[#0b2943] border border-white/[0.08] rounded-[12px] px-[14px] py-[11px] text-[13px] text-white outline-none focus:border-[#69DDF4]">
              <option value="all">All categories</option>
              {categories.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}
            </select>
            <select data-testid="select-levelup-directory-type" aria-label="File type" value={type} onChange={event => setType(event.target.value)} className="bg-[#0b2943] border border-white/[0.08] rounded-[12px] px-[14px] py-[11px] text-[13px] text-white outline-none focus:border-[#69DDF4]">
              <option value="all">All file types</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </div>

          <div data-testid="status-levelup-directory-coverage" className="mb-[20px] p-[16px] rounded-[14px] border border-[#69DDF4]/20 bg-[#69DDF4]/[0.04] text-[12px] text-[#AFC3D5] leading-relaxed">
            <span className="font-semibold text-white">Source coverage:</span> Logo exports, one background gradient, and selected portraits are available. The full 26 Photos library, Backgrounds page and 3D Icons collection could not be accessed from the provided source. The 2026 artwork font files were not supplied; no exact Monument font is included here.
          </div>

          <div className="flex flex-col gap-[8px]">
            {visible.map(group => {
              const isExpanded = !!query || expanded.has(group.id);
              return (
                <div key={group.id} className="bg-white/[0.015] border border-white/[0.06] rounded-[14px] overflow-hidden">
                  <button data-testid={`button-levelup-category-${group.id}`} aria-expanded={isExpanded} onClick={() => toggle(group.id)} className="w-full flex items-center gap-[12px] py-[14px] px-[18px] text-left cursor-pointer hover:bg-white/[0.03] transition-colors">
                    <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: group.color, boxShadow: `0 0 10px ${group.color}40` }} />
                    <span className="flex-1"><span className="block text-[13px] font-semibold text-white">{group.title}</span><span className="block text-[11px] text-[#94A3B8]">{group.description}</span></span>
                    <span className="text-[11px] text-[#94A3B8] mr-[8px]">{group.items.length ? `${group.items.length} assets` : "Unavailable"}</span>
                    {isExpanded ? <ChevronDown size={16} className="text-[#94A3B8]" /> : <ChevronRight size={16} className="text-[#94A3B8]" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-[18px] pb-[16px]">
                          {group.id === "3d-icons" ? (
                            <p data-testid="status-levelup-icons-unavailable" className="text-[12px] text-[#94A3B8] py-[12px]">No verified 3D icons are available. The original 3D Icons source page or files are needed before assets can be added.</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
                              {group.items.map(asset => {
                                const url = assetUrl(asset);
                                const filename = asset.url.split("/").pop() || asset.name;
                                return (
                                  <div data-testid={`card-levelup-asset-${asset.id}`} key={asset.id} className="group rounded-[10px] border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-[#69DDF4]/40 transition-colors">
                                    <div className={`flex items-center justify-center p-[12px] ${group.id === "backgrounds" ? "aspect-video" : "aspect-square"}`} style={{ background: group.id === "logos" ? "linear-gradient(135deg,#122a41 50%,#e5f1f6 50%)" : "transparent" }}>
                                      <img src={url} alt={asset.name} loading="lazy" className={`max-w-full max-h-full object-contain ${group.id === "backgrounds" ? "w-full h-full object-cover rounded-[4px]" : ""}`} />
                                    </div>
                                    <div className="p-[9px] bg-black/20">
                                      <div className="text-[11px] text-white font-medium leading-snug min-h-[2.8em]">{asset.name}</div>
                                      <div className="flex items-center justify-between gap-[6px] mt-[5px]">
                                        <span className="text-[10px] text-[#94A3B8]">Figma node {asset.sourceNodeId} · {filename.split(".").pop()?.toUpperCase()}</span>
                                        <a data-testid={`link-download-levelup-${asset.id}`} href={url} download={filename} title={`Download ${asset.name}`} aria-label={`Download ${asset.name}`} className="p-[5px] rounded text-[#69DDF4] hover:bg-white/10 shrink-0"><Download size={15} /></a>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          {!visible.length && <div data-testid="status-levelup-directory-empty" className="text-center py-[60px] text-[13px] text-[#94A3B8]">No sourced assets match these filters. Try another category, file type or search.</div>}
        </div>
      </div>
    </div>
  );
}