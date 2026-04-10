import { useState, useEffect, useCallback } from "react";
import { Download, Trash2, Clock, Image, Package, Search, X } from "lucide-react";
import { getExports, deleteExport, clearExports, type ExportRecord } from "./exportStore";

export function MyExportsWorkspace() {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const loadExports = useCallback(() => {
    setExports(getExports());
  }, []);

  useEffect(() => {
    loadExports();
    const handler = () => loadExports();
    window.addEventListener("exports-updated", handler);
    return () => window.removeEventListener("exports-updated", handler);
  }, [loadExports]);

  const handleDelete = (id: string) => {
    deleteExport(id);
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all export history? This cannot be undone.")) {
      clearExports();
    }
  };

  const handleRedownload = (record: ExportRecord) => {
    const a = document.createElement("a");
    a.href = record.thumbnail;
    a.download = record.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sources = Array.from(new Set(exports.map((e) => e.source)));

  const filtered = exports.filter((e) => {
    if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
    if (filter && !e.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  return (
    <div className="flex-1 overflow-y-auto p-[24px] md:p-[32px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-[24px]">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-[4px]">My Exports</h2>
            <p className="text-[12px] text-[#64748B]">{exports.length} export{exports.length !== 1 ? "s" : ""} saved</p>
          </div>
          {exports.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-[6px] px-[12px] py-[7px] rounded-[8px] bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.15)] text-[#FF6B6B] text-[11px] font-medium cursor-pointer hover:bg-[rgba(255,77,77,0.15)] transition-all"
            >
              <Trash2 className="w-[12px] h-[12px]" />
              Clear All
            </button>
          )}
        </div>

        {exports.length > 0 && (
          <div className="flex items-center gap-[10px] mb-[20px] flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#475569] pointer-events-none" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search exports..."
                className="w-full py-[8px] pl-[30px] pr-[10px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[10px] font-['Poppins'] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] placeholder:text-[#475569] transition-all"
              />
              {filter && (
                <button onClick={() => setFilter("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 bg-transparent border-none text-[#64748B] cursor-pointer p-0">
                  <X className="w-[12px] h-[12px]" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-[4px]">
              <button
                onClick={() => setSourceFilter("all")}
                className={`px-[10px] py-[6px] rounded-[8px] text-[10px] font-semibold border-none cursor-pointer transition-all ${sourceFilter === "all" ? "bg-[rgba(0,178,169,0.15)] text-[#00B2A9]" : "bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#94A3B8]"}`}
              >
                All
              </button>
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`px-[10px] py-[6px] rounded-[8px] text-[10px] font-semibold border-none cursor-pointer transition-all ${sourceFilter === s ? "bg-[rgba(0,178,169,0.15)] text-[#00B2A9]" : "bg-[rgba(255,255,255,0.04)] text-[#64748B] hover:text-[#94A3B8]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[80px] text-center">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-[16px]">
              <Package className="w-[24px] h-[24px] text-[#475569]" />
            </div>
            <p className="text-[14px] font-medium text-[#64748B] mb-[4px]">
              {exports.length === 0 ? "No exports yet" : "No matching exports"}
            </p>
            <p className="text-[11px] text-[#475569] max-w-[280px]">
              {exports.length === 0
                ? "When you download designs from any workspace, they'll appear here automatically."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[12px]">
            {filtered.map((record) => (
              <div
                key={record.id}
                className="group rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden hover:border-[rgba(0,178,169,0.2)] transition-all"
              >
                <div className="relative aspect-square bg-[rgba(0,0,0,0.2)] overflow-hidden">
                  <img
                    src={record.thumbnail}
                    alt={record.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-[6px]">
                    <button
                      onClick={() => handleRedownload(record)}
                      className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.15)] border-none text-white cursor-pointer flex items-center justify-center hover:bg-[rgba(0,178,169,0.3)] transition-all"
                      title="Download"
                    >
                      <Download className="w-[14px] h-[14px]" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.15)] border-none text-white cursor-pointer flex items-center justify-center hover:bg-[rgba(255,77,77,0.3)] transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                  <div className="absolute top-[6px] right-[6px] px-[6px] py-[2px] rounded-[4px] bg-black/60 text-[8px] font-semibold text-white uppercase">
                    {record.format}
                  </div>
                </div>
                <div className="p-[8px]">
                  <div className="text-[10px] font-semibold text-[#E2E8F0] truncate" title={record.name}>
                    {record.name}
                  </div>
                  <div className="flex items-center justify-between mt-[4px]">
                    <span className="text-[8px] text-[#64748B] flex items-center gap-[3px]">
                      <Image className="w-[8px] h-[8px]" />
                      {record.source}
                    </span>
                    <span className="text-[8px] text-[#475569] flex items-center gap-[3px]">
                      <Clock className="w-[8px] h-[8px]" />
                      {formatTime(record.timestamp)}
                    </span>
                  </div>
                  {record.dimensions && (
                    <div className="text-[8px] text-[#475569] mt-[2px]">{record.dimensions}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
