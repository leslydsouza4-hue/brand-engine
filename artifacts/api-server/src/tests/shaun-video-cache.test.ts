import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VideoSourceCache } from "../lib/shaun-video-cache";

async function fixture(work: (cache: VideoSourceCache, dir: string) => Promise<void>, ttl = 60_000) {
  const dir = await mkdtemp(join(tmpdir(), "video-cache-test-"));
  try { await work(new VideoSourceCache(join(dir, "cache"), 8, 16, ttl), dir); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test("seeded original serves concurrent jobs without downloads; eviction preserves active input", () => fixture(async (cache, dir) => {
  const source = join(dir, "source");
  await writeFile(source, "original");
  await cache.seed("bucket/immutable-source-1", source);
  await rm(source);
  let downloads = 0;
  const load = async () => { downloads++; throw new Error("Must reuse original"); };
  assert.deepEqual(await Promise.all([
    cache.materialize("bucket/immutable-source-1", join(dir, "preview"), load),
    cache.materialize("bucket/immutable-source-1", join(dir, "layout"), load),
  ]), [true, true]);
  assert.equal(downloads, 0);
  assert.equal((await stat(join(dir, "preview"))).ino, (await stat(join(dir, "layout"))).ino);
  for (const key of ["second", "third"]) {
    await cache.materialize(key, join(dir, key), path => writeFile(path, "12345678"));
  }
  assert.equal((await readdir(join(dir, "cache"))).length, 2);
  assert.equal(await readFile(join(dir, "preview"), "utf8"), "original");
}));

test("cold concurrent consumers download once and fresh immutable IDs cannot hit old bytes", () => fixture(async (cache, dir) => {
  let downloads = 0;
  const load = async (path: string) => { downloads++; await writeFile(path, "data"); };
  assert.deepEqual(await Promise.all([
    cache.materialize("source-1", join(dir, "a"), load),
    cache.materialize("source-1", join(dir, "b"), load),
  ]), [false, true]);
  await cache.materialize("source-2", join(dir, "c"), load);
  assert.equal(downloads, 2);
}));

test("failed and oversized loads leave no partial cache hit and the queue recovers", () => fixture(async (cache, dir) => {
  await assert.rejects(cache.materialize("source", join(dir, "a"), async path => {
    await writeFile(path, "partial"); throw new Error("transfer failed");
  }), /transfer failed/);
  await assert.rejects(cache.materialize("source", join(dir, "b"), path => writeFile(path, "oversized")), /limit/);
  assert.deepEqual(await readdir(join(dir, "cache")), []);
  assert.equal(await cache.materialize("source", join(dir, "c"), path => writeFile(path, "ok")), false);
}));

test("idle cleanup expires files and removes interrupted transfer leftovers", () => fixture(async (cache, dir) => {
  await cache.materialize("source", join(dir, "a"), path => writeFile(path, "data"));
  const root = join(dir, "cache");
  for (const name of await readdir(root)) await utimes(join(root, name), new Date(0), new Date(0));
  await writeFile(join(root, "interrupted.part"), "data");
  await cache.sweep();
  assert.deepEqual(await readdir(root), []);
  assert.equal(await readFile(join(dir, "a"), "utf8"), "data");
}));

test("cache survives process recreation without leaking bytes across storage namespaces", () => fixture(async (cache, dir) => {
  await cache.materialize("bucket-a/source", join(dir, "a"), path => writeFile(path, "private"));
  const restarted = new VideoSourceCache(join(dir, "cache"), 8, 16);
  assert.equal(await restarted.materialize("bucket-a/source", join(dir, "b"), async () => { throw new Error("unexpected transfer"); }), true);
  assert.equal(await restarted.materialize("bucket-b/source", join(dir, "c"), path => writeFile(path, "other")), false);
  assert.equal((await stat(join(dir, "cache"))).mode & 0o777, 0o700);
  assert.equal((await stat(join(dir, "b"))).mode & 0o777, 0o600);
}));
