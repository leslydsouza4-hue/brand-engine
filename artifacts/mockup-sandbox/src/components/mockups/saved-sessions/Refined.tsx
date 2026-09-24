import { useMemo, useState } from "react";
import {
  Archive, ChevronDown, FileStack, FolderOpen, Grid2X2, History,
  LayoutList, MoreHorizontal, Pencil, Search, SearchX, Sparkles,
  Users, Copy
} from "lucide-react";
import { SAMPLE_SESSIONS, SAMPLE_TEAM, type SampleSession } from "./_shared";
import "./Refined.css";

const artwork: Record<string, { className: string; title: string }> = {
  "sample-01": { className: "art-spring", title: "Spring / 26" },
  "sample-02": { className: "art-class", title: "THE\nMASTER\nCLASS" },
  "sample-03": { className: "art-spotlight", title: "Partner\nstories" },
  "sample-04": { className: "art-email", title: "The Q2\nedit" },
  "sample-05": { className: "art-summer", title: "SUMMER\nSTARTS HERE" },
  "sample-06": { className: "art-winter", title: "Winter\nwinners" },
};

const readableWorkspace = (value: string) => value.replaceAll("-", " ");
const updatedLabel = (iso: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

export function Refined() {
  const [sessions, setSessions] = useState<SampleSession[]>(() => SAMPLE_SESSIONS.map((session) => ({ ...session })));
  const [search, setSearch] = useState("");
  const [archiveView, setArchiveView] = useState<"active" | "archived">("active");
  const [workspace, setWorkspace] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renameFor, setRenameFor] = useState<SampleSession | null>(null);
  const [newName, setNewName] = useState("");
  const [notice, setNotice] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);

  const workspaceTypes = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.workspaceType))),
    [sessions]
  );
  const filteredSessions = sessions.filter((session) =>
    session.archived === (archiveView === "archived") &&
    (workspace === "all" || session.workspaceType === workspace) &&
    session.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const openProject = (session: SampleSession) => flash(`Opening “${session.name}” in the editor`);
  const duplicate = (session: SampleSession) => {
    const copy = { ...session, id: `${session.id}-copy-${Date.now()}`, name: `${session.name} copy`, revision: 1, archived: false };
    setSessions((current) => [...current, copy]);
    setArchiveView("active");
    setMenuFor(null);
    flash("A working copy was added to active projects");
  };
  const archive = (session: SampleSession) => {
    setSessions((current) => current.map((item) => item.id === session.id ? { ...item, archived: !item.archived } : item));
    setMenuFor(null);
    flash(session.archived ? "Project restored to active" : "Project moved to archive");
  };
  const saveRename = () => {
    if (renameFor && newName.trim()) {
      setSessions((current) => current.map((item) => item.id === renameFor.id ? { ...item, name: newName.trim() } : item));
      flash("Project renamed");
    }
    setRenameFor(null);
  };
  const beginRename = (session: SampleSession) => {
    setNewName(session.name);
    setRenameFor(session);
    setMenuFor(null);
  };
  const resetFilters = () => {
    setSearch("");
    setWorkspace("all");
    setArchiveView("active");
  };

  return (
    <main className="ss-refined">
      <section className="ss-shell" aria-label="Saved projects library">
        <div className="ss-topline" />
        <header className="ss-header">
          <div>
            <div className="ss-eyebrow">HighLevel Brand Engine / Library</div>
            <h1 className="ss-title">Saved Sessions</h1>
            <p className="ss-subtitle">Pick up any editable campaign, wherever your team left it.</p>
          </div>
          <div style={{ position: "relative" }}>
            <button className="ss-team" aria-haspopup="menu" aria-expanded={teamOpen} onClick={() => setTeamOpen((open) => !open)}>
              <span className="ss-team-mark"><Users size={13} /></span>
              <span>{SAMPLE_TEAM.name}</span><ChevronDown size={15} />
            </button>
            {teamOpen && <div className="ss-menu" role="menu" style={{ top: 48, bottom: "auto", right: 0 }}>
              <button role="menuitem" onClick={() => { setTeamOpen(false); flash("Sample projects is selected"); }}>Sample projects <span style={{ color: "#13c8b8", float: "right" }}>Selected</span></button>
            </div>}
          </div>
        </header>

        <div className="ss-toolbar">
          <label className="ss-search">
            <Search size={16} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project names" aria-label="Search saved projects" />
          </label>
          <div className="ss-tabs" role="tablist" aria-label="Project status">
            <button className="ss-tab" role="tab" aria-selected={archiveView === "active"} onClick={() => setArchiveView("active")}>Active</button>
            <button className="ss-tab" role="tab" aria-selected={archiveView === "archived"} onClick={() => setArchiveView("archived")}>Archive</button>
          </div>
          <div className="ss-view" aria-label="Project layout">
            <button className={view === "grid" ? "active" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={16} /></button>
            <button className={view === "list" ? "active" : ""} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutList size={17} /></button>
          </div>
        </div>

        <div className="ss-content">
          <div className="ss-filterrow">
            <div className="ss-filterlabel"><strong>{filteredSessions.length}</strong> project{filteredSessions.length === 1 ? "" : "s"} shown</div>
            <select className="ss-select" value={workspace} onChange={(event) => setWorkspace(event.target.value)} aria-label="Filter by workspace">
              <option value="all">All workspaces</option>
              {workspaceTypes.map((type) => <option key={type} value={type}>{readableWorkspace(type)}</option>)}
            </select>
          </div>
          {filteredSessions.length === 0 ? (
            <div className="ss-empty">
              <div className="ss-empty-icon"><SearchX size={22} /></div>
              <h2>No projects match this view</h2>
              <p>Try a different workspace, status, or project name.</p>
              <button className="ss-reset" onClick={resetFilters}>Reset library view</button>
            </div>
          ) : (
            <div className={view === "grid" ? "ss-grid" : "ss-list"}>
              {filteredSessions.map((session) => {
                const art = artwork[session.id] ?? artwork["sample-01"];
                return <article className="ss-card" key={session.id}>
                  <div className={`ss-preview ${art.className}`} aria-label={`Sample preview for ${session.name}`}>
                    <b>{art.title}</b><i aria-hidden="true" />
                  </div>
                  <div className="ss-card-main">
                    <div className="ss-card-head">
                      <div style={{ minWidth: 0 }}>
                        <h2 className="ss-card-name" title={session.name}>{session.name}</h2>
                        <div className="ss-workspace">{readableWorkspace(session.workspaceType)}</div>
                      </div>
                      <button className="ss-more" aria-label={`Project actions for ${session.name}`} aria-expanded={menuFor === session.id} onClick={() => setMenuFor(menuFor === session.id ? null : session.id)}><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="ss-meta">
                      <span>Updated <strong>{updatedLabel(session.updatedAt)}</strong></span>
                      <span className="ss-revision">REV {String(session.revision).padStart(2, "0")}</span>
                      <span>By <strong>{session.updatedByName || session.createdByName}</strong></span>
                    </div>
                    <button className="ss-open" onClick={() => openProject(session)}><FolderOpen size={14} /> Open project</button>
                    {menuFor === session.id && <div className="ss-menu" role="menu">
                      <button role="menuitem" onClick={() => openProject(session)}><FolderOpen size={13} /> Open project</button>
                      <button role="menuitem" onClick={() => beginRename(session)}><Pencil size={13} /> Rename</button>
                      <button role="menuitem" onClick={() => duplicate(session)}><Copy size={13} /> Duplicate</button>
                      <button role="menuitem" onClick={() => { setMenuFor(null); flash(`Revision ${session.revision} is the current saved version`); }}><History size={13} /> Version history</button>
                      <button className="danger" role="menuitem" onClick={() => archive(session)}><Archive size={13} /> {session.archived ? "Restore project" : "Archive project"}</button>
                    </div>}
                  </div>
                </article>;
              })}
            </div>
          )}
        </div>
      </section>
      {renameFor && <div className="ss-dialog-backdrop" role="presentation" onMouseDown={() => setRenameFor(null)}>
        <div className="ss-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="ss-eyebrow"><Sparkles size={12} style={{ verticalAlign: "middle", marginRight: 5 }} /> Project details</div>
          <h2 id="rename-title">Rename project</h2><p>Use a clear name your teammates will recognize.</p>
          <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); if (event.key === "Escape") setRenameFor(null); }} aria-label="Project name" />
          <div className="ss-dialog-actions"><button className="ss-cancel" onClick={() => setRenameFor(null)}>Cancel</button><button className="ss-save" onClick={saveRename}>Save name</button></div>
        </div>
      </div>}
      {notice && <div className="ss-toast" role="status"><FileStack size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />{notice}</div>}
    </main>
  );
}

export default Refined;