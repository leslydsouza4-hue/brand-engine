import assert from "node:assert/strict";
import { test } from "node:test";
import { FIGMA_LAYOUTS, hydrateLevelUpEdits, levelUpArtworkAsset, levelUpCutout, levelUpRestore } from "./levelUpFigmaLayouts";
import { cloneSessionState, persistSessionAssets, resolveSessionAssets } from "./sessions/sessionAssets";
import { SessionStore } from "./sessions/sessionStore";

test("LevelUp cutout, restore, and selected artwork survive session validation and asset round-trip", async () => {
  const initial = {
    ...FIGMA_LAYOUTS[0].defaults,
    photo: "/levelup26/alex-schlinsky.png",
    groupPhotos: ["/levelup26/alex-schlinsky.png", "/levelup26/paige-battcher.png"],
  };
  const canonical = (url: string) => url.replace(/^\/brand-engine\/levelup26\//, "/levelup26/");
  // A pre-fix draft carried an explicitly undefined groupOriginals property.
  const legacy = { ...initial, groupOriginals: undefined, logoUrl: undefined };
  assert.throws(() => cloneSessionState({ legacy }), /JSON values only/);
  const hydrated = hydrateLevelUpEdits(legacy, canonical);
  assert.equal(Object.hasOwn(hydrated, "groupOriginals"), false);
  const transparent = "data:image/png;base64,AQID";
  const sparseGroup = levelUpCutout({ ...hydrated, groupPhotos: [] }, 4, transparent, "/levelup26/alex-schlinsky.png");
  assert.deepEqual(sparseGroup.groupPhotos, ["", "", "", "", transparent]);
  cloneSessionState({ sparseGroup });
  let edits = levelUpCutout(hydrated, -1, transparent, initial.photo);
  assert.equal(edits.photoOriginal, initial.photo);
  edits = levelUpArtworkAsset(edits, "background", "lu26-gradient-dark", "/levelup26/gradient-dark.png");
  edits = levelUpArtworkAsset(edits, "logo", "lu26-logo-light", "/levelup26/logo-light.png");
  edits = { ...edits, photoX: 7, photoY: -3, name: "Alex Schlinsky" };
  let group = levelUpCutout(edits, 1, transparent, initial.groupPhotos[1]);
  assert.equal(group.groupOriginals?.[1], initial.groupPhotos[1]);
  group = levelUpRestore(group, 1);
  assert.equal(group.groupPhotos[1], initial.groupPhotos[1]);

  const store = new SessionStore();
  store.draft("lu26-speakers").state = {
    "lu26.speaker.layout": "speaker-portrait",
    "lu26.speaker.edits": { "speaker-portrait": group },
  };
  const snapshot = cloneSessionState(store.draft("lu26-speakers").state);
  const originalFetch = globalThis.fetch;
  let uploads = 0;
  globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    const address = String(url);
    if (address.startsWith("data:")) return originalFetch(url, options);
    if (address === "/api/session-teams/t/assets") return Response.json({ assetId: `image-${++uploads}`, uploadURL: `https://storage.example/${uploads}` });
    if (address.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (address.endsWith("/complete")) return Response.json({ ok: true });
    throw new Error(`Unexpected request ${address}`);
  }) as typeof fetch;
  try {
    const persisted = await persistSessionAssets(snapshot, "t");
    const saved = (persisted["lu26.speaker.edits"] as Record<string, typeof group>)["speaker-portrait"];
    assert.deepEqual(saved.photo, { __brandAsset: "image-1" });
    assert.equal(saved.photoOriginal, initial.photo);
    assert.deepEqual(saved.groupPhotos[1], initial.groupPhotos[1]);
    assert.equal(saved.backgroundAssetId, "lu26-gradient-dark");
    assert.equal(saved.backgroundUrl, "/levelup26/gradient-dark.png");
    assert.equal(saved.logoAssetId, "lu26-logo-light");
    assert.equal(saved.logoUrl, "/levelup26/logo-light.png");
    assert.equal(saved.photoX, 7);
    assert.equal(saved.photoY, -3);
    assert.equal(persisted["lu26.speaker.layout"], "speaker-portrait");
    const reopened = resolveSessionAssets(persisted, "t");
    const restored = (reopened["lu26.speaker.edits"] as Record<string, typeof group>)["speaker-portrait"];
    assert.equal(restored.photo, "/api/session-teams/t/assets/image-1");
    assert.equal(levelUpRestore(restored, -1).photo, initial.photo);
    assert.equal(restored.logoAssetId, "lu26-logo-light");
    assert.equal(restored.backgroundAssetId, "lu26-gradient-dark");
    assert.equal(uploads, 1);
  } finally { globalThis.fetch = originalFetch; }
});