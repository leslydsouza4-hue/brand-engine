import { test } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { setImmediate as nextTick } from "node:timers/promises";
import { pipeStorageResponse } from "../lib/shaun-storage-stream";

test("early browser cancellation waits for the storage response pipeline", async () => {
  const source = new PassThrough(), response = new PassThrough();
  pipeStorageResponse(source, response);
  response.destroy();
  await nextTick();
  assert.equal(source.destroyed, false);
  source.emit("response", {});
  assert.equal(source.destroyed, false, "SDK must be able to wire its pipeline synchronously");
  await nextTick();
  assert.equal(source.destroyed, true);
});
test("normal storage streaming finishes the response", async () => {
  const source = new PassThrough(), response = new PassThrough();
  let body = "";
  response.on("data", chunk => { body += chunk; });
  pipeStorageResponse(source, response);
  source.emit("response", {});
  source.end("video");
  await nextTick();
  assert.equal(body, "video");
});
