import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, pool, sessionTeams, sessionMembers, savedSessions, sessionVersions } from "@workspace/db";
import { assetSchema, assertReadyAssets, assertSessionMutationOrigin, collectAssetIds, patchSchema, saveSchema, SessionError } from "../lib/session-validation";
import { validateImageBytes } from "../lib/session-assets";
import { recordVersion, requireTeam, reviseSession } from "../routes/saved-sessions";

after(async () => { await pool.end(); });

test("cookie mutation CSRF requires a valid exact same-origin header for every write method", () => {
  const request = (method: string, origin: string | undefined, extra: Record<string, string> = {}) => ({
    method, protocol: "http",
    get: (name: string) => ({ host: "internal:8080", "x-forwarded-host": "app.example", "x-forwarded-proto": "https", origin, ...extra } as Record<string, string | undefined>)[name],
  });
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.doesNotThrow(() => assertSessionMutationOrigin(request(method, "https://app.example")));
    for (const origin of [undefined, "", "null", "not a URL", "https://evil.example", "http://app.example", "https://app.example:8443", "https://app.example/path", "https://app.example?x=1", "https://user:pass@app.example", "https://app.example, https://evil.example"]) {
      assert.throws(() => assertSessionMutationOrigin(request(method, origin)),
        (e: unknown) => e instanceof SessionError && e.status === 403 && e.code === "CSRF_ORIGIN_DENIED");
    }
    assert.throws(() => assertSessionMutationOrigin(request(method, "https://app.example", { "sec-fetch-site": "cross-site" })));
  }
  assert.doesNotThrow(() => assertSessionMutationOrigin(request("GET", undefined)));
  assert.doesNotThrow(() => assertSessionMutationOrigin(request("POST", "http://localhost", {
    "x-forwarded-host": "", "x-forwarded-proto": "", host: "localhost:80",
  })));
});

test("nested image tags are collected; inline and transient assets are rejected", () => {
  const id = randomUUID();
  assert.deepEqual(collectAssetIds({ images: [{ nested: { __brandAsset: id } }, { __brandAsset: id }], static: "/logo.svg" }), [id]);
  for (const value of ["data:image/png;base64,AAA", "blob:https://example.com/abc", `/api/session-teams/${randomUUID()}/assets/${id}`])
    assert.throws(() => collectAssetIds({ nested: [value] }), SessionError);
  assert.throws(() => collectAssetIds({ __brandAsset: id, extra: true }));
  assert.throws(() => collectAssetIds({ __brandAsset: "not-an-id" }));
  assert.throws(() => collectAssetIds({ invalid: Infinity }));
});

test("asset references must all be ready and owned by the requested team", () => {
  const id = randomUUID(), team = randomUUID();
  assert.doesNotThrow(() => assertReadyAssets([id], [{ id, teamId: team, ready: true }], team));
  for (const assets of [[], [{ id, teamId: "other-team", ready: true }], [{ id, teamId: team, ready: false }]])
    assert.throws(() => assertReadyAssets([id], assets, team), /missing, incomplete, or belongs/);
});

test("request validation rejects excessive files, MIME spoof declarations and author fields", () => {
  assert.equal(assetSchema.safeParse({ name: "photo", contentType: "image/png", size: 26214401 }).success, false);
  assert.equal(assetSchema.safeParse({ name: "photo", contentType: "text/html", size: 10 }).success, false);
  assert.equal(saveSchema.safeParse({ name: "a", workspaceType: "spotlight", schemaVersion: 1, state: {}, updatedByName: "Forged author" }).success, false);
  assert.equal(patchSchema.safeParse({ revision: 1 }).success, false);
});

test("byte validation rejects MIME mismatch and active SVG; accepts actual PNG and safe SVG", async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: "#ffffff" } }).png().toBuffer();
  await validateImageBytes(png, "image/png");
  await assert.rejects(validateImageBytes(png, "image/jpeg"), /type mismatch/);
  await assert.rejects(validateImageBytes(Buffer.from("<html>not an image</html>"), "image/png"));
  await validateImageBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>'), "image/svg+xml");
  for (const body of ['<script>alert(1)</script>', '<image href="https://evil.example/a"/>', '<rect onload="alert(1)"/>', '<style>@import "https://evil.example"</style>'])
    await assert.rejects(validateImageBytes(Buffer.from(`<svg width="2" height="2">${body}</svg>`), "image/svg+xml"), /unsafe/);
});

test("database: concurrent saves have one winner and immutable complete history", async () => {
  const team = randomUUID(), id = randomUUID(), user = `test-${randomUUID()}`;
  try {
    await db.transaction(async tx => {
      await tx.insert(sessionTeams).values({ id: team, name: "Isolated concurrency test" });
      await tx.insert(sessionMembers).values({ teamId: team, userId: user, name: "Test author", role: "admin" });
      const [row] = await tx.insert(savedSessions).values({ id, teamId: team, name: "Initial", workspaceType: "test", schemaVersion: 1, revision: 1, state: { initial: true }, createdByName: "Test author", updatedByName: "Test author" }).returning();
      await recordVersion(tx, row);
    });
    const saves = await Promise.allSettled(["First", "Second"].map(name => db.transaction(tx => reviseSession(tx, team, id, 1, { name, state: { saved: name } }, "Verified author"))));
    assert.equal(saves.filter(s => s.status === "fulfilled").length, 1);
    const failure = saves.find(s => s.status === "rejected") as PromiseRejectedResult;
    assert.equal(failure.reason.status, 409);
    const versions = await db.select().from(sessionVersions).where(eq(sessionVersions.sessionId, id));
    assert.equal(versions.length, 2);
    assert.deepEqual(versions.find(v => v.revision === 1)?.snapshot.state, { initial: true });
    assert.equal(versions.find(v => v.revision === 2)?.snapshot.updatedByName, "Verified author");
    const [current] = await db.select().from(savedSessions).where(eq(savedSessions.id, id));
    assert.equal(current.revision, 2);
    assert.equal(current.name, versions.find(v => v.revision === 2)?.snapshot.name);
    await assert.rejects(db.transaction(tx => reviseSession(tx, randomUUID(), id, 2, { name: "Cross-team attack" }, user)), (e: unknown) => e instanceof SessionError && e.status === 404);
    await assert.rejects(db.transaction(tx => requireTeam(tx, team, "outsider")), (e: unknown) => e instanceof SessionError && e.status === 403);
    await db.transaction(tx => requireTeam(tx, team, user, true));
    await db.update(sessionMembers).set({ role: "member" }).where(eq(sessionMembers.teamId, team));
    await assert.rejects(db.transaction(tx => requireTeam(tx, team, user, true)), (e: unknown) => e instanceof SessionError && e.status === 403);
  } finally {
    await db.delete(sessionTeams).where(eq(sessionTeams.id, team));
  }
});

test("database: failed version write rolls back current revision and state", async () => {
  const team = randomUUID(), id = randomUUID();
  try {
    await db.insert(sessionTeams).values({ id: team, name: "Rollback test" });
    await db.insert(savedSessions).values({ id, teamId: team, name: "Initial", workspaceType: "test", schemaVersion: 1, revision: 1, state: {}, createdByName: "Test", updatedByName: "Test" });
    await db.insert(sessionVersions).values({ sessionId: id, revision: 2, snapshot: { immutable: true } });
    await assert.rejects(db.transaction(tx => reviseSession(tx, team, id, 1, { name: "Must roll back" }, "Test")));
    const [row] = await db.select().from(savedSessions).where(eq(savedSessions.id, id));
    assert.equal(row.revision, 1);
    assert.equal(row.name, "Initial");
    const [version] = await db.select().from(sessionVersions).where(eq(sessionVersions.sessionId, id));
    assert.deepEqual(version.snapshot, { immutable: true });
  } finally {
    await db.delete(sessionTeams).where(eq(sessionTeams.id, team));
  }
});