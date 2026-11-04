import { test } from "node:test";
import assert from "node:assert/strict";
import { readDownloadBody } from "./downloadBody";

test("download reports real bytes and refuses incomplete files", async () => {
  const points: number[] = [];
  const stream = new ReadableStream<Uint8Array>({ start(c) {
    c.enqueue(new Uint8Array([1, 2])); c.enqueue(new Uint8Array([3, 4])); c.close();
  } });
  const blob = await readDownloadBody(new Response(stream, { headers: { "content-length": "4" } }),
    { onProgress: n => points.push(n) });
  assert.equal(blob.size, 4);
  assert.equal(blob.type, "video/mp4");
  assert.deepEqual(points, [2, 4]);
  await assert.rejects(readDownloadBody(new Response(new Uint8Array([1]), { headers: { "content-length": "10" } })), /incomplete/);
});

test("stalled downloads time out and cancel their stream", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  await assert.rejects(readDownloadBody(new Response(stream), { idleMs: 10 }), /stopped responding/);
  assert.equal(cancelled, true);
});

test("downloads honor cancellation and byte limits", async () => {
  const ac = new AbortController();
  const pending = readDownloadBody(new Response(new ReadableStream()), { signal: ac.signal });
  ac.abort();
  await assert.rejects(pending, { name: "AbortError" });
  await assert.rejects(readDownloadBody(new Response(new Uint8Array([1, 2])), { maxBytes: 1 }), /exceeds/);
});
