import { useState, useEffect, useRef } from "react";
import { 
  Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, FileImage, MoreVertical, Copy, 
  Archive, Edit2, FolderOpen, SearchX, Trash2, Grid2X2, LayoutList, Loader2
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessions } from "../SessionProvider";
import type { SessionSummary } from "../sessionClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import "./SharedSessionsLibrary.css";

const workspaceLabel = (value: string) => ({
  "bizdev-templates": "Business Development",
  "did-you-know": "Did You Know",
  "summer-sun-drunk": "Summer · Sun Drunk",
  "summer-electric": "Summer · Electric",
  "summer-feral": "Summer · Feral",
}[value] ?? value.replace(/[-_]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()));

function SessionPreview({ session }: { session: SessionSummary }) {
  const [failed, setFailed] = useState(false);
  const src = session.thumbnailAssetId
    ? `/api/session-teams/${encodeURIComponent(session.teamId)}/assets/${encodeURIComponent(session.thumbnailAssetId)}`
    : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className="saved-library-preview">
      {src && !failed ? (
        <img data-testid={`img-session-${session.id}`} src={src} alt={`Preview of ${session.name}`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="saved-library-placeholder">
          <span className="saved-library-placeholder-icon"><FileImage aria-hidden="true" size={28} /></span>
          <strong>{workspaceLabel(session.workspaceType)}</strong>
          <span>{failed ? "Preview unavailable" : "No preview saved"}</span>
        </div>
      )}
    </div>
  );
}

interface SharedSessionsLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWorkspaceType?: string;
  embedded?: boolean;
}

export function SharedSessionsLibrary({ open, onOpenChange, embedded = false }: SharedSessionsLibraryProps) {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  const [listing, setListing] = useState(false);
  const [openCompleted, setOpenCompleted] = useState(false);
  const openingEpoch = useRef(0);
  const { sessions, currentSession, activeTeamId, open: openSession, archive, rename, list, prepareSignIn, duplicate, deleteSession, error, epoch, loading, saving } = useSessions();
  const { toast } = useToast();
  const [openingSessionId, setOpeningSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (open && isSignedIn && activeTeamId) {
      setListing(true);
      list(activeTab === "archived").catch(() => {}).finally(() => {
        if (!cancelled) setListing(false);
      });
    } else {
      setListing(false);
    }
    return () => { cancelled = true; };
  }, [open, activeTab, isSignedIn, activeTeamId]);

  useEffect(() => {
    if (openCompleted) {
      // A cancelled draft confirmation resolves without loading a session.
      // Only dismiss the library when the provider actually applied the snapshot.
      if (!embedded && epoch !== openingEpoch.current && currentSession?.id === openingSessionId) onOpenChange(false);
      setOpeningSessionId(null);
      setOpenCompleted(false);
    }
  }, [currentSession, openingSessionId, onOpenChange, openCompleted, epoch, embedded]);

  const handleSignIn = async () => {
    try {
      await prepareSignIn();
      setLocation("/sign-in");
    } catch (e: any) {
      toast({
        title: "Cannot preserve draft",
        description: e.message || "Failed to save draft locally. Ensure you have enough storage.",
        variant: "destructive",
      });
    }
  };

  const workspaceTypes = Array.from(new Set([...sessions.map(s => s.workspaceType), ...(typeFilter === "all" ? [] : [typeFilter])]))
    .sort((a, b) => workspaceLabel(a).localeCompare(workspaceLabel(b)));
  const hasFilters = !!searchQuery.trim() || typeFilter !== "all";
  const resetFilters = () => { setSearchQuery(""); setTypeFilter("all"); };
  const filteredSessions = sessions.filter(s => {
    if (activeTab === "active" && s.archived) return false;
    if (activeTab === "archived" && !s.archived) return false;
    if (typeFilter !== "all" && s.workspaceType !== typeFilter) return false;
    if (searchQuery.trim() && !s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleOpen = async (id: string) => {
    openingEpoch.current = epoch;
    setOpeningSessionId(id);
    try {
      await openSession(id);
    } catch (e: any) {
      toast({ title: "Failed to open", description: e.message, variant: "destructive" });
    } finally {
      setOpenCompleted(true);
    }
  };

  const handleDuplicate = async (session: SessionSummary) => {
    try {
      const copy = await duplicate(session.id);
      setActiveTab("active");
      toast({ title: "Session duplicated", description: `${copy.name} is available in Active sessions. Your current edits are unchanged.` });
    } catch (e: any) {
      toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" });
    }
  };

  const handleArchiveToggle = async (session: SessionSummary) => {
    if (!session.archived && !window.confirm(`Archive "${session.name}" for everyone? It will be permanently deleted after 30 days in the archive. You can unarchive it before then.`)) return;
    try {
      await archive(session.id, session.revision, !session.archived);
      await list(activeTab === "archived");
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
  };
  const handleDelete = async (session: SessionSummary) => {
    if (!window.confirm(`Permanently delete "${session.name}" and its version history for everyone? This cannot be undone. Any open editor draft on this device will remain unsaved.`)) return;
    try {
      await deleteSession(session.id, session.revision);
      toast({ title: "Session permanently deleted", description: "Removed from the shared library for everyone." });
    } catch (e: any) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  const handleRename = async (session: SessionSummary) => {
    const newName = prompt("New name:", session.name)?.trim();
    if (newName && newName !== session.name) {
      try {
        await rename(session.id, session.revision, newName);
        await list(activeTab === "archived");
      } catch (e: any) {
        toast({ title: "Failed to rename", description: e.message, variant: "destructive" });
      }
    }
  };

  const content = (
    <>
        <div className="saved-library-header">
          <div>
            {embedded ? (
              <>
                <h1 className="saved-library-title">Saved Sessions</h1>
                <p className="saved-library-description">Shared with everyone who signs in. Pick up where you left off.</p>
              </>
            ) : (
              <>
                <DialogTitle className="saved-library-title">Saved Sessions</DialogTitle>
                <DialogDescription className="saved-library-description">Shared with everyone who signs in. Pick up where you left off.</DialogDescription>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {!isSignedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Sign in to view the shared library</h3>
              <p className="text-zinc-400 max-w-sm mb-6">
                Every signed-in account can open, edit, archive, and delete saved sessions.
              </p>
              <Button data-testid="button-sessions-sign-in" onClick={handleSignIn} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="saved-library-controls">
                <p className="text-xs leading-relaxed text-slate-400">Everyone signed in can open, edit, archive, and delete sessions. No invitations needed.</p>
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                <div className="saved-library-toolbar">
                  <div className="relative min-w-0 flex-1 saved-library-search">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      data-testid="input-session-search"
                      aria-label="Search saved session names"
                      placeholder="Search session names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-10"
                    />
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[190px] shrink-0">
                    <TabsList aria-label="Session status" className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                      <TabsTrigger data-testid="tab-sessions-active" value="active">Active</TabsTrigger>
                      <TabsTrigger data-testid="tab-sessions-archived" value="archived">Archived</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="saved-library-view" role="group" aria-label="Library layout">
                    <button data-testid="button-sessions-grid" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={17} /></button>
                    <button data-testid="button-sessions-list" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutList size={18} /></button>
                  </div>
                </div>

                <div className="saved-library-filterrow">
                  <span data-testid="text-session-count" role="status" className="text-xs text-slate-400">
                    {listing ? "Loading sessions…" : `${filteredSessions.length} ${filteredSessions.length === 1 ? "session" : "sessions"} shown`}
                  </span>
                  <div className="saved-library-filters">
                    <select data-testid="select-session-workspace" aria-label="Filter by workspace" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                      <option value="all">All workspaces</option>
                      {workspaceTypes.map(type => <option key={type} value={type}>{workspaceLabel(type)}</option>)}
                    </select>
                    <select data-testid="select-session-sort" aria-label="Sort sessions" value={sort} onChange={e => setSort(e.target.value)}>
                      <option value="recent">Recently updated</option>
                      <option value="name">Name A–Z</option>
                    </select>
                    {hasFilters && <button data-testid="button-session-clear-filters" className="saved-library-clear" onClick={resetFilters}>Clear filters</button>}
                  </div>
                </div>
              </div>

              <div className="saved-library-results" aria-busy={listing}>
                {listing ? (
                  <div role="status" className="saved-library-empty"><Loader2 className="animate-spin text-teal-300 mx-auto mb-3" />Loading saved sessions…</div>
                ) : filteredSessions.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <SearchX className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 data-testid="text-sessions-empty" className="text-lg font-medium text-white mb-2">{hasFilters ? "No sessions match this view" : activeTab === "archived" ? "Nothing in the archive" : "Your next project starts here"}</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                      {hasFilters ? "Try another name or workspace to find your session." : activeTab === "archived" ? "Archived sessions appear here for 30 days. Unarchive a session to keep it." : "Save a session from a builder to make it available in the shared library."}
                    </p>
                    {hasFilters ? <Button data-testid="button-empty-clear-filters" className="mt-4" variant="outline" onClick={resetFilters}>Clear filters</Button> : activeTab === "active" && <Button data-testid="button-sessions-return-builder" className="mt-4" variant="outline" onClick={() => onOpenChange(false)}>Back to builder</Button>}
                  </div>
                ) : (
                  <div className={`saved-library-${view}`}>
                    {filteredSessions.map(session => (
                      <article data-testid={`card-session-${session.id}`} key={session.id} className="saved-library-card">
                        <SessionPreview session={session} />
                        
                        <div className="saved-library-card-main">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 title={session.name} className="saved-library-card-name">{session.name}</h3>
                              <span className="saved-library-workspace">{workspaceLabel(session.workspaceType)}</span>
                              {currentSession?.id === session.id && <span data-testid={`status-current-session-${session.id}`} className="saved-library-current">Current session</span>}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button data-testid={`button-session-actions-${session.id}`} aria-label={`Manage ${session.name}`} disabled={!!openingSessionId || saving || loading} variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10 text-zinc-300">
                                <DropdownMenuItem data-testid={`menu-session-open-${session.id}`} onClick={() => handleOpen(session.id)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <FolderOpen className="w-4 h-4 mr-2" /> Open Session
                                </DropdownMenuItem>
                                <DropdownMenuItem data-testid={`menu-session-rename-${session.id}`} onClick={() => handleRename(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <Edit2 className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem data-testid={`menu-session-duplicate-${session.id}`} onClick={() => handleDuplicate(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                {session.archived ? (
                                  <DropdownMenuItem data-testid={`menu-session-unarchive-${session.id}`} onClick={() => handleArchiveToggle(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                    <Archive className="w-4 h-4 mr-2" /> Unarchive
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem data-testid={`menu-session-archive-${session.id}`} onClick={() => handleArchiveToggle(session)} className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer">
                                    <Archive className="w-4 h-4 mr-2" /> Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem data-testid={`menu-session-delete-${session.id}`} onClick={() => handleDelete(session)} className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="saved-library-meta">
                            {session.archived && <div data-testid={`text-session-expiry-${session.id}`} className="text-amber-300">{session.archivedAt ? `Deletes ${new Date(new Date(session.archivedAt).getTime() + 30 * 86400000).toLocaleDateString()}` : "Deleted 30 days after archiving"}</div>}
                            <div>Authored by <strong>{session.createdByName || "Unknown"}</strong></div>
                            <div>Last edited by <strong>{session.updatedByName || "Unknown"}</strong></div>
                            <time dateTime={session.updatedAt} title={new Date(session.updatedAt).toLocaleString()}>Updated {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</time>
                          </div>
                          <Button data-testid={`button-session-open-${session.id}`} aria-label={`Open ${session.name}`} disabled={!!openingSessionId || loading || saving} onClick={() => handleOpen(session.id)} className="saved-library-open">
                            {openingSessionId === session.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-2" />}
                            {openingSessionId === session.id ? "Opening…" : "Open session"}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <footer className="saved-library-footer">Active sessions never expire. Archived sessions are permanently deleted after 30 days. Unarchive to keep them.</footer>
            </>
          )}
        </div>
    </>
  );

  if (embedded) {
    return (
      <section data-testid="workspace-saved-sessions" aria-label="Saved Sessions" className="saved-sessions-workspace">
        <div className="saved-library saved-library-embedded">{content}</div>
      </section>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="saved-library saved-library-dialog max-w-4xl w-[calc(100%_-_32px)] max-h-[80dvh] p-0 gap-0 border-white/10 flex flex-col overflow-hidden text-white">
        {content}
      </DialogContent>
    </Dialog>
  );
}
