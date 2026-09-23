export interface SessionTeam { id: string; name: string; role: string }
export interface SessionUser { id: string; name: string }
export interface SessionSummary {
  id: string; teamId: string; name: string; workspaceType: string; schemaVersion: 1;
  revision: number; createdByName: string; updatedByName: string;
  createdAt: string; updatedAt: string; archived: boolean; thumbnailAssetId: string | null;
}
export interface Session extends SessionSummary { state: Record<string, unknown> }
export interface SessionVersion { revision: number; name: string; updatedAt: string; updatedByName: string }
export interface SessionMembers {
  members: { userId: string; name: string; role: string }[];
  invites: { id: string; email: string }[];
}
export class SessionApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); this.name = "SessionApiError"; }
}
export const teamPath = (id: string) => `/api/session-teams/${encodeURIComponent(id)}`;
export async function sessionRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method, credentials: "same-origin", cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new SessionApiError(data?.error || `Session request failed (${response.status})`, response.status, data?.code);
  if (!data) throw new SessionApiError("Server returned an invalid session response", response.status);
  return data as T;
}

/** Copies the persisted snapshot, without opening it or consulting the editor's draft. */
export async function duplicateSavedSession(team: string, id: string, name: string | undefined, assertScope: () => void): Promise<Session> {
  assertScope();
  const base = `${teamPath(team)}/sessions`;
  const { session: source } = await sessionRequest<{ session: Session }>(`${base}/${encodeURIComponent(id)}`);
  assertScope();
  if (source.teamId !== team) throw new Error("Cannot duplicate a session from another team");
  if (source.schemaVersion !== 1) throw new Error("Cannot duplicate an unsupported session schema");
  const copyName = (name ?? `${source.name} (Copy)`).trim();
  if (!copyName) throw new Error("Enter a name for the duplicated session");
  const { session } = await sessionRequest<{ session: Session }>(base, "POST", {
    name: copyName, workspaceType: source.workspaceType, schemaVersion: source.schemaVersion,
    state: source.state, thumbnailAssetId: source.thumbnailAssetId,
    // No archived/revision/identity fields: POST creates an active revision-1 session.
  });
  assertScope();
  return session;
}