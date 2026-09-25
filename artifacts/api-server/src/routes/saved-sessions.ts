import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { and, eq, inArray, desc, sql } from "drizzle-orm";
import { db, sessionTeams, sessionMembers, sessionInvites, savedSessions, sessionVersions, sessionAssets } from "@workspace/db";
import { z } from "zod";
import { assetSchema, assertReadyAssets, assertSessionMutationOrigin, collectAssetIds, idSchema, nameSchema, patchSchema, saveSchema, SessionError, updateSchema } from "../lib/session-validation";
import { completePrivateImage, sessionStorage } from "../lib/session-assets";

const router: IRouter = Router();
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Actor = { id: string; name: string; emails: string[] };

async function actor(req: Request): Promise<Actor> {
  const id = getAuth(req).userId;
  if (!id) throw new SessionError(401, "Sign in to access saved sessions");
  const user = await clerkClient.users.getUser(id);
  const emails = user.emailAddresses.filter(e => e.verification?.status === "verified").map(e => e.emailAddress.toLowerCase());
  return { id, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || emails[0] || "Team member", emails };
}

function endpoint(fn: (req: Request, res: Response, user: Actor) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      // Cookie-authenticated mutations must originate from this app.
      assertSessionMutationOrigin(req);
      res.set("Cache-Control", "private, no-store");
      await fn(req, res, await actor(req));
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      if (error instanceof z.ZodError) { res.status(400).json({ error: error.issues.map(i => i.message).join("; "), code: "VALIDATION_ERROR" }); return; }
      if (error instanceof SessionError) { res.status(error.status).json({ error: error.message, code: error.code }); return; }
      req.log.error({ err: error }, "Saved session request failed");
      res.status(500).json({ error: "Saved session operation failed. Please retry." });
    }
  };
}

export async function requireTeam(tx: Tx, teamId: string, userId: string, admin = false) {
  // Team lock serializes membership changes with all authorized writes.
  await tx.select().from(sessionTeams).where(eq(sessionTeams.id, teamId)).for("update");
  const [member] = await tx.select().from(sessionMembers).where(and(eq(sessionMembers.teamId, teamId), eq(sessionMembers.userId, userId)));
  if (!member || (admin && member.role !== "admin")) throw new SessionError(403, admin ? "Team admin required" : "Team membership required");
  return member;
}
function teamId(req: Request) { return idSchema.parse(req.params.teamId); }
async function session(tx: Tx, _team: string, id: string) {
  const [row] = await tx.select().from(savedSessions).where(eq(savedSessions.id, id));
  if (!row) throw new SessionError(404, "Session not found");
  return row;
}
export const SHARED_LIBRARY_ID = "00000000-0000-4000-8000-000000000001";
export const ARCHIVE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export function archiveTimestamp(current: { archived: boolean; archivedAt: Date | null; updatedAt: Date }, archived: boolean | undefined, now = new Date()) {
  if (archived === false) return null;
  if (current.archived) return current.archivedAt ?? current.updatedAt;
  return archived === true ? now : null;
}
function assetIds(row: { state: unknown; thumbnailAssetId?: string | null }) {
  return [...collectAssetIds(row.state ?? {}), ...(row.thumbnailAssetId ? [row.thumbnailAssetId] : [])];
}
/** Delete snapshots and revoke only assets no surviving session/version references. */
export async function deleteLibrarySessions(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  const removed = await tx.select().from(savedSessions).where(inArray(savedSessions.id, ids));
  const versions = await tx.select().from(sessionVersions).where(inArray(sessionVersions.sessionId, ids));
  const candidates = new Set(removed.flatMap(assetIds));
  for (const { snapshot } of versions) for (const id of assetIds(snapshot as { state: unknown; thumbnailAssetId?: string })) candidates.add(id);
  await tx.delete(savedSessions).where(inArray(savedSessions.id, ids)); // versions cascade
  if (!candidates.size) return;
  const remaining = await tx.select().from(savedSessions);
  for (const row of remaining) for (const id of assetIds(row)) candidates.delete(id);
  const history = await tx.select().from(sessionVersions);
  for (const { snapshot } of history) for (const id of assetIds(snapshot as { state: unknown; thumbnailAssetId?: string })) candidates.delete(id);
  if (candidates.size) await tx.delete(sessionAssets).where(inArray(sessionAssets.id, [...candidates]));
}
/** All library operations share this lock, including expiry, writes and asset reads.
 * Request-driven cleanup works on autoscale; no always-running timer is required.
 * Historical archived rows use their last update as the initial archive timestamp.
 */
export async function requireLibrary(tx: Tx) {
  await tx.insert(sessionTeams).values({ id: SHARED_LIBRARY_ID, name: "Shared library" }).onConflictDoNothing();
  await tx.select().from(sessionTeams).where(eq(sessionTeams.id, SHARED_LIBRARY_ID)).for("update");
  const expired = await tx.select({ id: savedSessions.id }).from(savedSessions).where(and(
    eq(savedSessions.archived, true),
    sql`coalesce(${savedSessions.archivedAt}, ${savedSessions.updatedAt}) <= clock_timestamp() - interval '30 days'`,
  ));
  await deleteLibrarySessions(tx, expired.map(row => row.id));
}
async function validateAssets(tx: Tx, _team: string, state: unknown, thumbnail?: string | null) {
  const ids = collectAssetIds(state);
  if (thumbnail) ids.push(thumbnail);
  const assets = ids.length ? await tx.select().from(sessionAssets).where(inArray(sessionAssets.id, ids)) : [];
  assertReadyAssets(ids, assets);
}
export async function recordVersion(tx: Tx, row: typeof savedSessions.$inferSelect) {
  await tx.insert(sessionVersions).values({ sessionId: row.id, revision: row.revision, snapshot: JSON.parse(JSON.stringify(row)) });
}

router.get("/session-teams", endpoint(async (_req, res, user) => {
  await db.transaction(requireLibrary);
  const teams = [{ id: SHARED_LIBRARY_ID, name: "Shared library", role: "member" }];
  res.json({ teams, user: { id: user.id, name: user.name } });
}));
router.post("/session-teams", endpoint(async (req, res, user) => {
  const { name } = z.object({ name: nameSchema }).strict().parse(req.body);
  const id = randomUUID();
  await db.transaction(async tx => {
    await tx.insert(sessionTeams).values({ id, name });
    await tx.insert(sessionMembers).values({ teamId: id, userId: user.id, name: user.name, role: "admin" });
  });
  res.status(201).json({ team: { id, name, role: "admin" } });
}));
router.get("/session-teams/:teamId/members", endpoint(async (req, res, user) => {
  const team = teamId(req);
  res.json(await db.transaction(async tx => {
    await requireTeam(tx, team, user.id);
    const members = await tx.select({ userId: sessionMembers.userId, name: sessionMembers.name, role: sessionMembers.role }).from(sessionMembers).where(eq(sessionMembers.teamId, team));
    const invites = await tx.select({ id: sessionInvites.id, email: sessionInvites.email }).from(sessionInvites).where(eq(sessionInvites.teamId, team));
    return { members, invites };
  }));
}));
router.post("/session-teams/:teamId/invites", endpoint(async (req, res, user) => {
  const team = teamId(req);
  const { email } = z.object({ email: z.string().trim().email().max(320).transform(v => v.toLowerCase()) }).strict().parse(req.body);
  await db.transaction(async tx => {
    await requireTeam(tx, team, user.id, true);
    await tx.insert(sessionInvites).values({ id: randomUUID(), teamId: team, email }).onConflictDoNothing();
  });
  res.json({ ok: true });
}));
router.delete("/session-teams/:teamId/invites/:inviteId", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.inviteId);
  await db.transaction(async tx => {
    await requireTeam(tx, team, user.id, true);
    const rows = await tx.delete(sessionInvites).where(and(eq(sessionInvites.teamId, team), eq(sessionInvites.id, id))).returning();
    if (!rows.length) throw new SessionError(404, "Invite not found");
  });
  res.json({ ok: true });
}));
router.delete("/session-teams/:teamId/members/:userId", endpoint(async (req, res, user) => {
  const team = teamId(req), id = z.string().min(1).max(200).parse(req.params.userId);
  await db.transaction(async tx => {
    await requireTeam(tx, team, user.id, true);
    if (id === user.id) throw new SessionError(400, "Cannot remove yourself");
    const members = await tx.select().from(sessionMembers).where(eq(sessionMembers.teamId, team));
    const target = members.find(m => m.userId === id);
    if (!target) throw new SessionError(404, "Member not found");
    if (target.role === "admin" && members.filter(m => m.role === "admin").length <= 1) throw new SessionError(400, "Cannot remove the last admin");
    await tx.delete(sessionMembers).where(and(eq(sessionMembers.teamId, team), eq(sessionMembers.userId, id)));
  });
  res.json({ ok: true });
}));
router.get("/session-teams/:teamId/sessions", endpoint(async (req, res, user) => {
  const team = teamId(req), archived = z.enum(["true", "false"]).default("false").parse(req.query.archived) === "true";
  const sessions = await db.transaction(async tx => {
    await requireLibrary(tx);
    const rows = await tx.select().from(savedSessions).where(eq(savedSessions.archived, archived)).orderBy(desc(savedSessions.updatedAt));
    return rows.map(({ state: _state, ...summary }) => summary);
  });
  res.json({ sessions });
}));
router.post("/session-teams/:teamId/sessions", endpoint(async (req, res, user) => {
  const team = teamId(req), body = saveSchema.parse(req.body);
  const result = await db.transaction(async tx => {
    await requireLibrary(tx);
    await validateAssets(tx, team, body.state, body.thumbnailAssetId);
    const [row] = await tx.insert(savedSessions).values({ ...body, id: randomUUID(), teamId: SHARED_LIBRARY_ID, revision: 1, createdByName: user.name, updatedByName: user.name }).returning();
    await recordVersion(tx, row);
    return row;
  });
  res.status(201).json({ session: result });
}));
router.get("/session-teams/:teamId/sessions/:id", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.id);
  res.json({ session: await db.transaction(async tx => { await requireLibrary(tx); return session(tx, team, id); }) });
}));

export async function reviseSession(tx: Tx, team: string, id: string, revision: number, changes: Partial<typeof savedSessions.$inferInsert>, author: string) {
  const current = await session(tx, team, id);
  if (current.revision !== revision) throw new SessionError(409, "Session changed. Reload before saving.", "REVISION_CONFLICT");
  const [row] = await tx.update(savedSessions).set({ ...changes, archivedAt: archiveTimestamp(current, changes.archived), revision: revision + 1, updatedByName: author, updatedAt: new Date() })
    .where(and(eq(savedSessions.id, id), eq(savedSessions.revision, revision))).returning();
  if (!row) throw new SessionError(409, "Session changed. Reload before saving.", "REVISION_CONFLICT");
  await recordVersion(tx, row);
  return row;
}
for (const method of ["put", "patch"] as const) {
  router[method]("/session-teams/:teamId/sessions/:id", endpoint(async (req, res, user) => {
    const team = teamId(req), id = idSchema.parse(req.params.id);
    const body = method === "put" ? updateSchema.parse(req.body) : patchSchema.parse(req.body);
    const { revision, ...changes } = body;
    const result = await db.transaction(async tx => {
      await requireLibrary(tx);
      if ("state" in changes) await validateAssets(tx, team, changes.state, changes.thumbnailAssetId);
      return reviseSession(tx, team, id, revision, changes, user.name);
    });
    res.json({ session: result });
  }));
}
router.delete("/session-teams/:teamId/sessions/:id", endpoint(async (req, res) => {
  const team = teamId(req), id = idSchema.parse(req.params.id);
  const { revision } = z.object({ revision: z.number().int().positive() }).strict().parse(req.body);
  await db.transaction(async tx => {
    await requireLibrary(tx);
    const current = await session(tx, team, id);
    if (current.revision !== revision) throw new SessionError(409, "Session changed. Refresh before deleting.", "REVISION_CONFLICT");
    await deleteLibrarySessions(tx, [id]);
  });
  res.json({ ok: true });
}));
router.get("/session-teams/:teamId/sessions/:id/versions", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.id);
  const versions = await db.transaction(async tx => {
    await requireLibrary(tx);
    await session(tx, team, id);
    const rows = await tx.select().from(sessionVersions).where(eq(sessionVersions.sessionId, id)).orderBy(desc(sessionVersions.revision));
    return rows.map(({ snapshot: s }) => ({ revision: s.revision, name: s.name, updatedAt: s.updatedAt, updatedByName: s.updatedByName }));
  });
  res.json({ versions });
}));
router.get("/session-teams/:teamId/sessions/:id/versions/:revision", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.id), revision = z.coerce.number().int().positive().parse(req.params.revision);
  const result = await db.transaction(async tx => {
    await requireLibrary(tx);
    await session(tx, team, id);
    const [row] = await tx.select().from(sessionVersions).where(and(eq(sessionVersions.sessionId, id), eq(sessionVersions.revision, revision)));
    if (!row) throw new SessionError(404, "Version not found");
    return row.snapshot;
  });
  res.json({ session: result });
}));
router.post("/session-teams/:teamId/assets", endpoint(async (req, res, user) => {
  const team = teamId(req), body = assetSchema.parse(req.body);
  const result = await db.transaction(async tx => {
    await requireLibrary(tx);
    const uploadURL = await sessionStorage.getObjectEntityUploadURL();
    const assetId = randomUUID();
    await tx.insert(sessionAssets).values({ ...body, id: assetId, teamId: SHARED_LIBRARY_ID, objectPath: sessionStorage.normalizeObjectEntityPath(uploadURL) });
    return { assetId, uploadURL };
  });
  res.status(201).json(result);
}));
router.post("/session-teams/:teamId/assets/:assetId/complete", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.assetId);
  await db.transaction(async tx => {
    await requireLibrary(tx);
    const [asset] = await tx.select().from(sessionAssets).where(eq(sessionAssets.id, id)).for("update");
    if (!asset) throw new SessionError(404, "Asset not found");
    if (asset.ready) return;
    const objectPath = await completePrivateImage(asset.objectPath, asset.contentType, asset.size, randomUUID());
    await tx.update(sessionAssets).set({ ready: true, objectPath }).where(eq(sessionAssets.id, id));
  });
  res.json({ assetId: id });
}));
router.get("/session-teams/:teamId/assets/:assetId", endpoint(async (req, res, user) => {
  const team = teamId(req), id = idSchema.parse(req.params.assetId);
  const asset = await db.transaction(async tx => {
    await requireLibrary(tx);
    const [row] = await tx.select().from(sessionAssets).where(and(eq(sessionAssets.id, id), eq(sessionAssets.ready, true)));
    if (!row) throw new SessionError(404, "Asset not found");
    return row;
  });
  const file = await sessionStorage.getObjectEntityFile(asset.objectPath);
  res.set({ "Content-Type": asset.contentType, "Content-Length": String(asset.size), "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox", "Content-Disposition": "inline", "Cross-Origin-Resource-Policy": "same-origin" });
  file.createReadStream().on("error", error => { req.log.error({ err: error }, "Asset stream failed"); res.destroy(); }).pipe(res);
}));

export default router;