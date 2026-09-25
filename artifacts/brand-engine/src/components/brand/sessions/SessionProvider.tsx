import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { SessionStore, SessionStateContext } from "./sessionStore";
import { cloneSessionState, persistSessionAssets, preserveDraftImages, resolveSessionAssets, uploadSessionAsset } from "./sessionAssets";
import { duplicateSavedSession, SessionApiError, sessionRequest, teamPath } from "./sessionClient";
import type { Session, SessionMembers, SessionSummary, SessionTeam, SessionUser, SessionVersion } from "./sessionClient";
import { consumeAnonymousDraft, discardAnonymousDraft, preserveAnonymousDraft } from "./anonymousDraft";

export interface SaveSessionOptions { name?: string; copy?: boolean; thumbnail?: () => Promise<Blob | null> }
export interface SessionsApi {
  teams: SessionTeam[]; user: SessionUser | null; activeTeamId: string | null;
  workspaceType: string; supported: boolean; dirty: boolean; saving: boolean; loading: boolean;
  error: string | null; conflict: boolean; thumbnailWarning: string | null; epoch: number;
  currentSession: Session | null; sessions: SessionSummary[];
  refreshTeams(): Promise<void>; createTeam(name: string): Promise<SessionTeam>;
  selectTeam(id: string | null): Promise<void>; list(archived?: boolean): Promise<SessionSummary[]>;
  save(options?: SaveSessionOptions): Promise<Session>;
  saveCopy(name: string, thumbnail?: SaveSessionOptions["thumbnail"]): Promise<Session>;
  duplicate(id: string, name?: string): Promise<Session>;
  open(id: string): Promise<void>; history(id?: string): Promise<SessionVersion[]>;
  restoreVersion(revision: number): Promise<void>;
  rename(id: string, revision: number, name: string): Promise<Session>;
  archive(id: string, revision: number, archived?: boolean): Promise<Session>;
  deleteSession(id: string, revision: number): Promise<void>;
  confirmNavigation(): boolean; navigateWorkspace(mode: string): boolean; clearError(): void;
  prepareSignIn(): Promise<void>;
  members(): Promise<SessionMembers>; invite(email: string): Promise<void>;
  revokeInvite(id: string): Promise<void>; removeMember(userId: string): Promise<void>;
}
export interface SessionProviderProps {
  children: ReactNode; userId: string | null; authLoading?: boolean;
  /** Preserve anonymous drafts when the user intentionally signs in. Private user-to-user drafts are never preserved. */
  preserveAnonymousDraftOnSignIn?: boolean;
  workspaceType: string; supportedWorkspaces: readonly string[];
  onWorkspaceChange(workspace: string): void;
}
const SessionsContext = createContext<SessionsApi | null>(null);
export function useSessions(): SessionsApi {
  const context = useContext(SessionsContext);
  if (!context) throw new Error("useSessions requires SessionProvider");
  return context;
}

export function SessionProvider(props: SessionProviderProps) {
  const [store] = useState(() => new SessionStore());
  useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  const [teams, setTeams] = useState<SessionTeam[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTeamId, setActiveTeam] = useState<string | null>(null);
  const teamRef = useRef<string | null>(null);
  const identity = useRef(props.userId);
  const latestIdentity = useRef(props.userId);
  latestIdentity.current = props.userId;
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [thumbnailWarning, setThumbnailWarning] = useState<string | null>(null);
  const mounted = useRef(true);
  const resumedSignInDraft = useRef(false);
  const operation = useRef(0);
  const listOperation = useRef(0);
  const archivedFilter = useRef(false);
  const supported = props.supportedWorkspaces.includes(props.workspaceType);
  const draft = store.draft(props.workspaceType);
  const dirty = supported && store.dirty(props.workspaceType);
  const currentSession = draft.current;
  const alive = (generation: number) => mounted.current && generation === store.generation && latestIdentity.current === identity.current;
  function clearError() { setError(null); setConflict(false); }
  async function attempt<T>(fn: () => Promise<T>): Promise<T> {
    const generation = store.generation;
    try { return await fn(); } catch (cause) {
      if (alive(generation)) {
        setError(cause instanceof Error ? cause.message : "Session operation failed");
        setConflict(cause instanceof SessionApiError && cause.status === 409);
      }
      throw cause;
    }
  }
  function requireTeam() {
    if (!props.userId || !teamRef.current) throw new Error("Sign in to use the shared saved sessions library");
    return teamRef.current;
  }
  function confirmNavigation() {
    return !store.dirty(props.workspaceType) || window.confirm("You have unsaved changes. Continue without saving?");
  }
  function confirmAllDrafts() {
    return ![...store.drafts.keys()].some(key => store.dirty(key)) || window.confirm("Switching teams discards unsaved drafts. Continue?");
  }
  function navigateWorkspace(mode: string) {
    if (mode === props.workspaceType) return true;
    if (!confirmNavigation()) return false;
    props.onWorkspaceChange(mode);
    return true;
  }
  function updateSummary(session: Session) {
    setSessions(items => [...(session.archived === archivedFilter.current ? [session] : []), ...items.filter(item => item.id !== session.id)]);
  }
  async function refreshTeams() {
    if (!props.userId || props.authLoading) return;
    return attempt(async () => {
      const generation = store.generation;
      const result = await sessionRequest<{ teams: SessionTeam[]; user: SessionUser }>("/api/session-teams");
      if (!alive(generation)) return;
      setTeams(result.teams); setUser(result.user);
      if (teamRef.current && !result.teams.some(team => team.id === teamRef.current)) {
        store.clear(); setSessions([]); teamRef.current = null; setActiveTeam(null);
      }
      if (!teamRef.current && result.teams.length) {
        teamRef.current = result.teams[0].id; setActiveTeam(result.teams[0].id);
      }
    });
  }
  async function selectTeam(id: string | null) {
    if (id === teamRef.current) return;
    if (id && !teams.some(team => team.id === id)) throw new Error("Team is not available");
    if (!confirmAllDrafts()) return;
    store.clear(); operation.current++; saveLock.current = false;
    setSaving(false); setLoading(false); clearError(); setThumbnailWarning(null);
    setSessions([]); teamRef.current = id; setActiveTeam(id);
  }
  async function list(archived = false) {
    return attempt(async () => {
      archivedFilter.current = archived;
      const team = requireTeam(), generation = store.generation, request = ++listOperation.current;
      const result = await sessionRequest<{ sessions: SessionSummary[] }>(`${teamPath(team)}/sessions?archived=${archived}`);
      if (!alive(generation) || teamRef.current !== team) throw new Error("Team changed while loading sessions");
      if (request === listOperation.current) setSessions(result.sessions);
      return result.sessions;
    });
  }
  function load(session: Session, current: Session = session, historical = false) {
    if (session.schemaVersion !== 1 || !props.supportedWorkspaces.includes(session.workspaceType)) throw new Error("This session uses an unsupported workspace or schema version");
    const state = resolveSessionAssets(session.state, session.teamId);
    store.drafts.set(session.workspaceType, { state, baseline: historical ? JSON.stringify(resolveSessionAssets(current.state, current.teamId)) : JSON.stringify(state), current, loaded: true, registered: new Set() });
    store.epoch++; store.emit();
    props.onWorkspaceChange(session.workspaceType);
  }
  async function open(id: string) {
    if (!confirmNavigation()) return;
    return attempt(async () => {
      const team = requireTeam(), generation = store.generation, request = ++operation.current;
      const before = JSON.stringify(store.draft(props.workspaceType).state);
      setLoading(true); clearError();
      try {
        const { session } = await sessionRequest<{ session: Session }>(`${teamPath(team)}/sessions/${encodeURIComponent(id)}`);
        if (!alive(generation) || request !== operation.current) return;
        if (before !== JSON.stringify(store.draft(props.workspaceType).state) && !window.confirm("You edited while opening this session. Discard those edits?")) return;
        if (session.workspaceType !== props.workspaceType && store.dirty(session.workspaceType) && !window.confirm("Opening this session replaces unsaved edits in its workspace. Continue?")) return;
        load(session);
      } finally { if (alive(generation) && request === operation.current) setLoading(false); }
    });
  }
  async function save(options: SaveSessionOptions = {}): Promise<Session> {
    return attempt(async () => {
      if (saveLock.current) throw new Error("A save is already in progress");
      const team = requireTeam(), generation = store.generation, workspace = props.workspaceType;
      const source = store.draft(workspace);
      if (!supported || !source.registered.size || !Object.keys(source.state).length) throw new Error("This workspace has no registered editable state to save");
      const previous = source.current;
      const name = (options.name ?? previous?.name ?? "").trim();
      if (!name) throw new Error("Enter a session name");
      const snapshot = cloneSessionState(source.state);
      const request = operation.current;
      saveLock.current = true; setSaving(true); clearError(); setThumbnailWarning(null);
      try {
        const state = await persistSessionAssets(snapshot, team);
        let thumbnailAssetId = previous?.thumbnailAssetId ?? null;
        if (options.thumbnail) {
          try {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const blob = await Promise.race([
              options.thumbnail(),
              new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Thumbnail capture timed out")), 15000); }),
            ]).finally(() => { if (timer) clearTimeout(timer); });
            if (blob) thumbnailAssetId = await uploadSessionAsset(team, blob, "session-thumbnail.png");
          } catch (cause) {
            if (alive(generation)) setThumbnailWarning(`Session saved without a new thumbnail: ${cause instanceof Error ? cause.message : "capture failed"}`);
          }
        }
        if (!alive(generation)) throw new Error("Session identity or team changed during save; please save again");
        const update = previous && !options.copy;
        const { session } = await sessionRequest<{ session: Session }>(
          `${teamPath(team)}/sessions${update ? `/${encodeURIComponent(previous.id)}` : ""}`, update ? "PUT" : "POST",
          { name, workspaceType: workspace, schemaVersion: 1, state, thumbnailAssetId, ...(update ? { revision: previous.revision } : {}) },
        );
        if (!alive(generation)) throw new Error("Team changed after save; return to the original team to find this session");
        if (alive(generation)) {
          updateSummary(session);
          // Never overwrite a subsequently opened/restored draft; typing after the snapshot stays dirty.
          if (store.drafts.get(workspace) === source && request === operation.current) {
            source.current = session;
            source.baseline = JSON.stringify(snapshot);
            store.emit();
          }
        }
        return session;
      } finally {
        if (alive(generation)) { saveLock.current = false; setSaving(false); }
      }
    });
  }
  async function duplicate(id: string, name?: string) {
    return attempt(async () => {
      const team = requireTeam(), generation = store.generation;
      clearError();
      const session = await duplicateSavedSession(team, id, name, () => {
        if (!alive(generation) || teamRef.current !== team) throw new Error("Identity or team changed during duplication");
      });
      updateSummary(session);
      return session;
    });
  }
  async function history(id = currentSession?.id) {
    return attempt(async () => {
      if (!id) throw new Error("Open a session first");
      const generation = store.generation;
      const result = await sessionRequest<{ versions: SessionVersion[] }>(`${teamPath(requireTeam())}/sessions/${encodeURIComponent(id)}/versions`);
      if (!alive(generation)) throw new Error("Team changed while loading history");
      return result.versions;
    });
  }
  async function restoreVersion(revision: number) {
    if (!confirmNavigation()) return;
    return attempt(async () => {
      const team = requireTeam(), id = currentSession?.id, generation = store.generation, request = ++operation.current;
      if (!id) throw new Error("Open a session first");
      const before = JSON.stringify(draft.state);
      setLoading(true);
      try {
        const base = `${teamPath(team)}/sessions/${encodeURIComponent(id)}`;
        const [latest, historical] = await Promise.all([
          sessionRequest<{ session: Session }>(base),
          sessionRequest<{ session: Session }>(`${base}/versions/${revision}`),
        ]);
        if (!alive(generation) || request !== operation.current) return;
        if (before !== JSON.stringify(draft.state) && !window.confirm("Discard edits made while loading this version?")) return;
        load(historical.session, latest.session, true);
      } finally { if (alive(generation) && request === operation.current) setLoading(false); }
    });
  }
  async function patch(id: string, revision: number, changes: { name?: string; archived?: boolean }) {
    return attempt(async () => {
      if (saveLock.current) throw new Error("Wait for the current save to finish");
      const generation = store.generation;
      const { session } = await sessionRequest<{ session: Session }>(`${teamPath(requireTeam())}/sessions/${encodeURIComponent(id)}`, "PATCH", { revision, ...changes });
      if (!alive(generation)) throw new Error("Team changed while updating session");
      if (alive(generation)) {
        updateSummary(session);
        // Metadata operations must not bless a newer remote state as our baseline:
        // an older open draft still needs a conflict on its next save.
        for (const entry of store.drafts.values()) if (entry.current?.id === id && entry.current.revision === revision) {
          entry.current = { ...entry.current, name: session.name, archived: session.archived, archivedAt: session.archivedAt, revision: session.revision, updatedAt: session.updatedAt, updatedByName: session.updatedByName };
        }
        store.emit();
      }
      return session;
    });
  }
  async function deleteSession(id: string, revision: number) {
    return attempt(async () => {
      if (saveLock.current) throw new Error("Wait for the current save to finish");
      const generation = store.generation;
      const team = requireTeam();
      const replaceImages = await preserveDraftImages([...store.drafts.values()].filter(entry => entry.current?.id === id).map(entry => entry.state));
      if (!alive(generation)) throw new Error("Identity changed before deleting session");
      await sessionRequest(`${teamPath(team)}/sessions/${encodeURIComponent(id)}`, "DELETE", { revision });
      if (!alive(generation)) throw new Error("Identity changed while deleting session");
      operation.current++;
      listOperation.current++;
      setSessions(items => items.filter(item => item.id !== id));
      // Keep every editor field intact, but detach from the deleted cloud record.
      // Its next explicit save creates a new session instead of reviving the old ID.
      for (const entry of store.drafts.values()) {
        const wasDirty = JSON.stringify(entry.state) !== entry.baseline;
        entry.state = replaceImages(entry.state);
        if (!wasDirty) entry.baseline = JSON.stringify(entry.state);
        if (entry.current?.id === id) {
          entry.current = null;
          entry.baseline = "";
        }
      }
      clearError();
      store.emit();
    });
  }
  async function createTeam(name: string) {
    return attempt(async () => {
      const generation = store.generation;
      const { team } = await sessionRequest<{ team: SessionTeam }>("/api/session-teams", "POST", { name });
      if (!alive(generation)) throw new Error("Identity changed while creating team");
      if (alive(generation)) {
        setTeams(items => [...items.filter(item => item.id !== team.id), team]);
        if (!teamRef.current) { teamRef.current = team.id; setActiveTeam(team.id); }
      }
      return team;
    });
  }
  async function teamAction(path: string, method = "GET", body?: unknown) {
    return attempt(async () => {
      const generation = store.generation;
      const result = await sessionRequest<SessionMembers>(`${teamPath(requireTeam())}/${path}`, method, body);
      if (!alive(generation)) throw new Error("Team changed during request");
      return result;
    });
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; store.generation++; }; }, [store]);
  useEffect(() => {
    if (props.authLoading) return;
    if (identity.current !== props.userId) {
      const preserve = identity.current === null && props.userId !== null && props.preserveAnonymousDraftOnSignIn !== false;
      identity.current = props.userId;
      if (preserve) { store.generation++; } else {
        store.clear();
        try { discardAnonymousDraft(); } catch { /* Storage may be unavailable; in-memory private state is still cleared. */ }
      }
      teamRef.current = null; setActiveTeam(null); setTeams([]); setUser(null); setSessions([]);
      operation.current++; saveLock.current = false; setSaving(false); setLoading(false); clearError(); setThumbnailWarning(null);
    }
    if (!resumedSignInDraft.current) {
      resumedSignInDraft.current = true;
      try {
        const workspace = consumeAnonymousDraft(store, props.supportedWorkspaces);
        if (workspace) props.onWorkspaceChange(workspace);
      } catch (cause) { setError(`Could not restore the anonymous sign-in draft: ${cause instanceof Error ? cause.message : "storage unavailable"}`); }
    }
    if (props.userId) void refreshTeams().catch(() => {});
  }, [props.userId, props.authLoading]);
  useEffect(() => {
    if (activeTeamId) void list().catch(() => {});
    const refresh = () => { if (teamRef.current) void list(archivedFilter.current).catch(() => {}); };
    window.addEventListener("focus", refresh);
    const poll = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(poll); };
  }, [activeTeamId]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if ([...store.drafts.keys()].some(key => store.dirty(key))) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [store]);
  const value: SessionsApi = {
    teams, user, activeTeamId, workspaceType: props.workspaceType, supported, dirty, saving, loading,
    error, conflict, thumbnailWarning, epoch: store.epoch, currentSession, sessions,
    refreshTeams, createTeam, selectTeam, list, save,
    saveCopy: (name, thumbnail) => save({ name, thumbnail, copy: true }), duplicate,
    open, history, restoreVersion, deleteSession,
    rename: (id, revision, name) => patch(id, revision, { name }),
    archive: (id, revision, archived = true) => patch(id, revision, { archived }),
    confirmNavigation, navigateWorkspace, clearError,
    prepareSignIn: () => attempt(async () => {
      if (props.userId) throw new Error("Only anonymous drafts can be preserved for sign-in");
      await preserveAnonymousDraft(store, props.workspaceType);
    }),
    members: () => teamAction("members"),
    invite: async email => { await teamAction("invites", "POST", { email }); },
    revokeInvite: async id => { await teamAction(`invites/${encodeURIComponent(id)}`, "DELETE"); },
    removeMember: async id => { await teamAction(`members/${encodeURIComponent(id)}`, "DELETE"); },
  };
  // Do not expose a prior signed-in user's fields for even one render while effects clear them.
  if (!props.authLoading && identity.current !== props.userId && identity.current !== null) return null;
  return <SessionsContext.Provider value={value}>
    <SessionStateContext.Provider key={store.epoch} value={{ store, workspace: props.workspaceType, enabled: supported }}>
      {props.children}
    </SessionStateContext.Provider>
  </SessionsContext.Provider>;
}