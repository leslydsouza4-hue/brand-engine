import assert from "node:assert/strict";
import { test } from "node:test";
import { cloneSessionState, persistSessionAssets, resolveSessionAssets, privateAssetId } from "./sessionAssets";
import { SessionStore } from "./sessionStore";
import { duplicateSavedSession, SessionApiError, sessionRequest } from "./sessionClient";
import { consumeAnonymousDraft, preserveAnonymousDraft } from "./anonymousDraft";
import { createSessionFieldLease, initializeSessionField } from "./sessionField";

test("nested private images round-trip and cross-team URLs fail", async () => {
  const state = { photos: [{ src: { __brandAsset: "photo-1" } }], static: "/logo.png", title: "Draft" };
  const resolved = resolveSessionAssets(state, "team-1");
  assert.deepEqual(await persistSessionAssets(resolved, "team-1"), state);
  assert.throws(() => privateAssetId("/api/session-teams/other/assets/asset", "team-1"), /another team/);
});

test("JSON validation never silently drops values", () => {
  for (const value of [undefined, NaN, Infinity, new Set(["x"]), new Date(), () => 1]) {
    assert.throws(() => cloneSessionState({ value }));
  }
  const circular: Record<string, unknown> = {}; circular.self = circular;
  assert.throws(() => cloneSessionState(circular), /circular/);
  const original = { fields: [null, false, 0, ""] };
  const clone = cloneSessionState(original);
  assert.deepEqual(clone, original);
  assert.notEqual(clone.fields, original.fields);
});

test("draft isolation, in-flight snapshot baseline, and private clearing", () => {
  const store = new SessionStore();
  const draft = store.draft("spotlight");
  draft.state = { headline: "first" };
  const saveSnapshot = JSON.stringify(draft.state);
  draft.state = { headline: "typed during save" };
  draft.baseline = saveSnapshot;
  assert.equal(store.dirty("spotlight"), true);
  assert.equal(store.dirty("flywheel"), false);
  const generation = store.generation, epoch = store.epoch;
  store.clear();
  assert.equal(store.generation, generation + 1);
  assert.equal(store.epoch, epoch + 1);
  assert.deepEqual(store.draft("spotlight").state, {});
});

test("direct uploads send bytes only to signed storage URL and complete before state returns", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; body: unknown; credentials: unknown }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    const address = String(url);
    requests.push({ url: address, body: options?.body, credentials: options?.credentials });
    if (address.startsWith("data:")) return new Response(new Blob(["png"], { type: "image/png" }));
    if (address === "/api/session-teams/t/assets") return Response.json({ assetId: "a", uploadURL: "https://storage.example/signed" });
    if (address === "https://storage.example/signed") return new Response(null, { status: 200 });
    if (address.endsWith("/complete")) return Response.json({ assetId: "a" });
    throw new Error(`Unexpected URL ${address}`);
  }) as typeof fetch;
  try {
    assert.deepEqual(await persistSessionAssets({ images: ["data:image/png;base64,eA==", "data:image/png;base64,eA=="] }, "t"), { images: [{ __brandAsset: "a" }, { __brandAsset: "a" }] });
    assert.equal(requests.filter(item => item.url.endsWith("/complete")).length, 1);
    const put = requests.find(item => item.url.startsWith("https://storage"));
    assert.ok(put?.body instanceof Blob);
    assert.equal(put.credentials, "omit");
    for (const request of requests.filter(item => item.url.startsWith("/api"))) assert.equal(request.body instanceof Blob, false);
  } finally { globalThis.fetch = originalFetch; }
});

test("409 errors retain status for conflict recovery; API uses cookies only", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: unknown, options?: RequestInit) => {
    assert.equal(options?.credentials, "same-origin");
    assert.equal(new Headers(options?.headers).has("authorization"), false);
    return Response.json({ error: "Revision conflict", code: "STALE_REVISION" }, { status: 409 });
  }) as typeof fetch;
  try {
    await assert.rejects(sessionRequest("/api/session-teams/t/sessions/s", "PUT", { revision: 1 }), (error: unknown) => error instanceof SessionApiError && error.status === 409);
  } finally { globalThis.fetch = originalFetch; }
});

test("explicit anonymous sign-in snapshot restores once without private sessions", async () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  } });
  const original = new SessionStore();
  original.draft("spotlight").state = { headline: "Keep my edits" };
  await preserveAnonymousDraft(original, "spotlight");
  const restored = new SessionStore();
  assert.equal(consumeAnonymousDraft(restored, ["spotlight"]), "spotlight");
  assert.deepEqual(restored.draft("spotlight").state, { headline: "Keep my edits" });
  assert.equal(restored.dirty("spotlight"), true);
  assert.equal(consumeAnonymousDraft(new SessionStore(), ["spotlight"]), null);
});

test("dynamic theme keys and workspaces initialize independently and retain prior edits", () => {
  const store = new SessionStore();
  const summer = store.draft("summer");
  let calls = 0;
  assert.equal(initializeSessionField(summer, "summer.themeA.headline", () => { calls++; return "Theme A"; }), "Theme A");
  createSessionFieldLease<string>(store, "summer", "summer.themeA.headline", summer).set("Edited A");
  assert.equal(initializeSessionField(summer, "summer.themeB.headline", () => { calls++; return "Theme B"; }), "Theme B");
  assert.equal(initializeSessionField(summer, "summer.themeA.headline", () => { calls++; return "Wrong reset"; }), "Edited A");
  assert.equal(initializeSessionField(store.draft("other"), "summer.themeA.headline", () => { calls++; return "Other workspace"; }), "Other workspace");
  assert.equal(calls, 3);
});

test("unmounted and pre-open async setters cannot mutate replacement drafts or run updaters", () => {
  const store = new SessionStore();
  const oldDraft = store.draft("summer");
  initializeSessionField(oldDraft, "image", "old");
  const unmounted = createSessionFieldLease<string>(store, "summer", "image", oldDraft);
  unmounted.active = false;
  unmounted.set(() => { throw new Error("Unmounted updater must not execute"); });
  assert.equal(oldDraft.state.image, "old");
  const preOpen = createSessionFieldLease<string>(store, "summer", "image", oldDraft);
  store.drafts.delete("summer");
  const replacement = store.draft("summer");
  initializeSessionField(replacement, "image", "saved-image");
  preOpen.set(() => { throw new Error("Old upload updater must not execute"); });
  assert.equal(replacement.state.image, "saved-image");
  assert.equal(oldDraft.state.image, "old");
  const beforeEpoch = createSessionFieldLease<string>(store, "summer", "image", replacement);
  store.epoch++;
  beforeEpoch.set("late upload");
  assert.equal(replacement.state.image, "saved-image");
  const beforeIdentity = createSessionFieldLease<string>(store, "summer", "image", replacement);
  store.generation++;
  beforeIdentity.set("previous identity upload");
  assert.equal(replacement.state.image, "saved-image");
  const current = createSessionFieldLease<string>(store, "summer", "image", replacement);
  current.set(previous => `${previous}-edited`);
  assert.equal(replacement.state.image, "saved-image-edited");
});

test("library duplication copies archived persisted state into an active session without touching editor", async () => {
  const originalFetch = globalThis.fetch;
  const store = new SessionStore();
  const draft = store.draft("summer");
  draft.state = { headline: "Unsaved typing" };
  const epoch = store.epoch;
  const source = {
    id: "original", teamId: "t", name: "Archived source", workspaceType: "spotlight", schemaVersion: 1,
    state: { headline: "Saved headline", image: { __brandAsset: "asset-1" } },
    thumbnailAssetId: "thumb-1", revision: 9, archived: true,
  };
  let calls = 0;
  globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    calls++;
    if (options?.method === "GET") {
      assert.equal(String(url), "/api/session-teams/t/sessions/original");
      return Response.json({ session: source });
    }
    assert.equal(String(url), "/api/session-teams/t/sessions");
    assert.equal(options?.method, "POST");
    const body = JSON.parse(String(options.body));
    assert.deepEqual(body, {
      name: "Archived source (Copy)", workspaceType: "spotlight", schemaVersion: 1,
      state: source.state, thumbnailAssetId: "thumb-1",
    });
    return Response.json({ session: { ...source, ...body, id: "copy", revision: 1, archived: false } });
  }) as typeof fetch;
  try {
    const copy = await duplicateSavedSession("t", "original", undefined, () => {});
    assert.equal(copy.archived, false);
    assert.equal(copy.id, "copy");
    assert.equal(calls, 2);
    assert.equal(store.epoch, epoch);
    assert.equal(store.draft("summer"), draft);
    assert.deepEqual(draft.state, { headline: "Unsaved typing" });
    assert.equal(store.dirty("summer"), true);
  } finally { globalThis.fetch = originalFetch; }
});

test("library duplication stops before POST when identity changes during fetch", async () => {
  const originalFetch = globalThis.fetch;
  let valid = true, calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    valid = false;
    return Response.json({ session: { teamId: "t", schemaVersion: 1, name: "Original" } });
  }) as typeof fetch;
  try {
    await assert.rejects(duplicateSavedSession("t", "original", "Custom copy", () => {
      if (!valid) throw new Error("Identity changed");
    }), /Identity changed/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});