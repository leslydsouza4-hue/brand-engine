import { useState, useMemo, useCallback } from "react";
import { Loader2, Search, Trash2, Plus, X, RefreshCw, Sparkles, Folder, Tag as TagIcon, Image as ImageIcon } from "lucide-react";
import { useLibrary, upsertImages, removeImage, updateImage, setLibraryFolder, clearLibrary, searchLibrary, extractPeopleCount, type LibraryImage } from "./levelUpStore";
import { BRAND_THEMES } from "./brandModeStore";

const theme = BRAND_THEMES.levelup26;

interface DriveFileResp {
  driveFileId: string;
  name: string;
  thumbUrl: string;
  fullUrl: string;
}

export function LevelUpImageLibraryWorkspace() {
  const lib = useLibrary();
  const [folderInput, setFolderInput] = useState(lib.folderUrl ?? "");
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestProgress, setIngestProgress] = useState<{ done: number; total: number } | null>(null);
  const [search, setSearch] = useState("");
  // Track the open image by id, then derive the live record from the store
  // every render so manual edits (tag add/remove, scene/mood/people changes)
  // immediately reflect in the modal inputs.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? lib.images.find((i) => i.id === selectedId) ?? null : null;
  const [tagDraft, setTagDraft] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return lib.images;
    return searchLibrary(lib.images, search, 200);
  }, [lib.images, search]);

  const ingest = useCallback(async () => {
    setIngestError(null);
    setIngesting(true);
    setIngestProgress(null);
    try {
      const r = await fetch("/api/levelup/drive/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderUrl: folderInput }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to list folder");
      const files: DriveFileResp[] = j.files || [];
      if (!files.length) throw new Error("No images found in that folder. Make sure the folder is public ('anyone with the link').");
      setLibraryFolder(folderInput, j.folderId);

      const existing = new Map(lib.images.map((i) => [i.driveFileId, i]));
      const newImgs: LibraryImage[] = files.map((f) => {
        const prev = existing.get(f.driveFileId);
        return (
          prev || {
            id: `${f.driveFileId}-${Date.now()}`,
            driveFileId: f.driveFileId,
            name: f.name,
            thumbUrl: f.thumbUrl,
            fullUrl: f.fullUrl,
            tags: [],
            peopleCount: null,
            scene: null,
            mood: null,
            dominantColors: [],
            description: "",
            taggedAt: null,
            createdAt: Date.now(),
          }
        );
      });
      upsertImages(newImgs);

      // Auto-tag in batches of 4 to avoid hammering Gemini.
      const toTag = newImgs.filter((i) => !i.taggedAt);
      setIngestProgress({ done: 0, total: toTag.length });
      const BATCH = 3;
      for (let i = 0; i < toTag.length; i += BATCH) {
        const slice = toTag.slice(i, i + BATCH);
        await Promise.all(
          slice.map(async (img) => {
            try {
              const tr = await fetch("/api/levelup/vision/tag", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: img.thumbUrl }),
              });
              if (!tr.ok) return;
              const data = await tr.json();
              updateImage(img.id, {
                description: data.description ?? "",
                peopleCount: data.peopleCount ?? null,
                scene: data.scene ?? null,
                mood: data.mood ?? null,
                tags: Array.isArray(data.tags) ? data.tags : [],
                dominantColors: Array.isArray(data.dominantColors) ? data.dominantColors : [],
                taggedAt: Date.now(),
              });
            } catch {
              /* swallow per-image; user can re-tag manually */
            }
          })
        );
        setIngestProgress({ done: Math.min(i + BATCH, toTag.length), total: toTag.length });
      }
    } catch (e) {
      setIngestError((e as Error).message);
    } finally {
      setIngesting(false);
    }
  }, [folderInput, lib.images]);

  const retagOne = useCallback(async (img: LibraryImage) => {
    updateImage(img.id, { taggedAt: null });
    try {
      const tr = await fetch("/api/levelup/vision/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: img.thumbUrl }),
      });
      const data = await tr.json();
      if (tr.ok) {
        updateImage(img.id, {
          description: data.description ?? "",
          peopleCount: data.peopleCount ?? null,
          scene: data.scene ?? null,
          mood: data.mood ?? null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          dominantColors: Array.isArray(data.dominantColors) ? data.dominantColors : [],
          taggedAt: Date.now(),
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const peopleHint = extractPeopleCount(search);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-[28px] pt-[20px] pb-[14px]">
        <div className="flex items-center gap-[12px] mb-[6px]">
          <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
            <Folder className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <div className="text-[18px] font-bold text-white tracking-[-0.3px]">Image Library</div>
            <div className="text-[12px] text-[#94A3B8]">Public Google Drive folder · auto-tagged for smart search</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-[10px] mt-[14px]">
          <input
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/...  (must be public)"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-[10px] px-[14px] py-[10px] text-[13px] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[var(--lu-accent)]"
            style={{ ['--lu-accent' as never]: theme.accent }}
          />
          <button
            onClick={ingest}
            disabled={ingesting || !folderInput.trim()}
            className="px-[18px] py-[10px] rounded-[10px] text-[13px] font-bold flex items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: theme.cta, color: "#10031F" }}
          >
            {ingesting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <RefreshCw className="w-[14px] h-[14px]" />}
            {ingesting ? "Ingesting…" : lib.images.length ? "Re-Ingest" : "Ingest Folder"}
          </button>
          {lib.images.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear the entire library?")) clearLibrary(); }}
              className="px-[14px] py-[10px] rounded-[10px] text-[13px] text-[#94A3B8] hover:text-white border border-white/10 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        {ingestError && <div className="mt-[10px] text-[12px] text-red-400">{ingestError}</div>}
        {ingestProgress && (
          <div className="mt-[10px] text-[12px] text-[#94A3B8] flex items-center gap-[8px]">
            <Sparkles className="w-[12px] h-[12px]" style={{ color: theme.accent }} />
            Auto-tagging {ingestProgress.done} / {ingestProgress.total}…
          </div>
        )}
      </div>

      {lib.images.length > 0 && (
        <div className="px-[28px] pb-[12px] border-b border-white/[0.05]">
          <div className="relative">
            <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#64748B]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Smart search — try "4 guys taking a selfie", "outdoor crowd at sunset", "speaker on stage"'
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[12px] pl-[40px] pr-[14px] py-[12px] text-[13px] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[var(--lu-accent)]"
              style={{ ['--lu-accent' as never]: theme.accent }}
            />
          </div>
          <div className="flex items-center gap-[10px] text-[11px] text-[#64748B] mt-[8px]">
            <span>{filtered.length} of {lib.images.length} images</span>
            {peopleHint != null && (
              <span className="px-[8px] py-[2px] rounded-full" style={{ background: `${theme.accent}22`, color: theme.accent }}>
                Looking for ~{peopleHint} people
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-[28px] py-[18px]">
        {lib.images.length === 0 && !ingesting && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-[420px]">
              <ImageIcon className="w-[48px] h-[48px] mx-auto mb-[14px] text-[#64748B]" />
              <div className="text-[16px] font-semibold text-white mb-[6px]">No images yet</div>
              <div className="text-[13px] text-[#94A3B8]">Paste a public Google Drive folder link above to import every image inside. Each image is auto-tagged so you can search for them in plain English.</div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[12px]">
          {filtered.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedId(img.id)}
              className="group relative aspect-square rounded-[12px] overflow-hidden bg-black border border-white/[0.06] hover:border-white/[0.18] transition-all cursor-pointer text-left"
            >
              <img src={img.thumbUrl} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-[6px] left-[8px] right-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                {img.peopleCount != null && (
                  <span className="inline-block text-[9px] font-bold px-[6px] py-[2px] rounded-full mr-[4px]" style={{ background: theme.cta, color: "#10031F" }}>
                    {img.peopleCount}p
                  </span>
                )}
                {img.scene && (
                  <span className="inline-block text-[9px] font-semibold px-[6px] py-[2px] rounded-full" style={{ background: `${theme.accent}30`, color: theme.accent }}>
                    {img.scene}
                  </span>
                )}
              </div>
              {!img.taggedAt && (
                <div className="absolute top-[6px] right-[6px] w-[14px] h-[14px] rounded-full bg-yellow-400 animate-pulse" title="Tagging…" />
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-[20px]" onClick={() => setSelectedId(null)}>
          <div className="bg-[#10031F] border border-white/[0.08] rounded-[18px] max-w-[820px] w-full max-h-[88vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="md:w-[55%] bg-black flex items-center justify-center">
              <img src={selected.fullUrl} alt={selected.name} className="max-w-full max-h-[88vh] object-contain" />
            </div>
            <div className="md:w-[45%] flex flex-col overflow-hidden">
              <div className="px-[20px] py-[14px] border-b border-white/[0.05] flex items-center justify-between">
                <div className="text-[13px] font-semibold text-white truncate">{selected.name}</div>
                <button onClick={() => setSelectedId(null)} className="text-[#94A3B8] hover:text-white cursor-pointer">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-[20px] py-[14px] space-y-[14px]">
                <div className="text-[12px] text-[#CBD5E1] italic">{selected.description || "(no description yet)"}</div>
                <div className="grid grid-cols-2 gap-[10px] text-[11px]">
                  <Field label="People" value={String(selected.peopleCount ?? "—")} onChange={(v) => updateImage(selected.id, { peopleCount: v === "" ? null : Number(v) || null })} />
                  <Field label="Scene" value={selected.scene ?? ""} onChange={(v) => updateImage(selected.id, { scene: v || null })} />
                  <Field label="Mood" value={selected.mood ?? ""} onChange={(v) => updateImage(selected.id, { mood: v || null })} />
                  <Field label="Colors (comma)" value={selected.dominantColors.join(", ")} onChange={(v) => updateImage(selected.id, { dominantColors: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[6px] flex items-center gap-[6px]"><TagIcon className="w-[10px] h-[10px]" /> Tags</div>
                  <div className="flex flex-wrap gap-[5px] mb-[6px]">
                    {selected.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-[5px] text-[11px] px-[8px] py-[3px] rounded-full" style={{ background: `${theme.primary}25`, color: "#fff" }}>
                        {t}
                        <button onClick={() => updateImage(selected.id, { tags: selected.tags.filter((x) => x !== t) })} className="opacity-60 hover:opacity-100 cursor-pointer">
                          <X className="w-[10px] h-[10px]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-[6px]">
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagDraft.trim()) {
                          updateImage(selected.id, { tags: [...new Set([...selected.tags, tagDraft.trim().toLowerCase()])] });
                          setTagDraft("");
                        }
                      }}
                      placeholder="Add tag…"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[10px] py-[6px] text-[12px] text-white"
                    />
                    <button
                      onClick={() => { if (tagDraft.trim()) { updateImage(selected.id, { tags: [...new Set([...selected.tags, tagDraft.trim().toLowerCase()])] }); setTagDraft(""); } }}
                      className="px-[10px] rounded-[8px] text-[12px] cursor-pointer"
                      style={{ background: theme.accent, color: "#10031F" }}
                    >
                      <Plus className="w-[12px] h-[12px]" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-[20px] py-[12px] border-t border-white/[0.05] flex gap-[8px]">
                <button onClick={() => retagOne(selected)} className="flex-1 px-[12px] py-[8px] rounded-[8px] text-[12px] font-semibold border border-white/[0.1] text-white hover:bg-white/[0.05] cursor-pointer flex items-center justify-center gap-[6px]">
                  <Sparkles className="w-[12px] h-[12px]" /> Re-tag with AI
                </button>
                <button onClick={() => { removeImage(selected.id); setSelectedId(null); }} className="px-[12px] py-[8px] rounded-[8px] text-[12px] font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/10 cursor-pointer">
                  <Trash2 className="w-[12px] h-[12px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#94A3B8] mb-[4px]">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[8px] py-[5px] text-[12px] text-white"
      />
    </label>
  );
}
