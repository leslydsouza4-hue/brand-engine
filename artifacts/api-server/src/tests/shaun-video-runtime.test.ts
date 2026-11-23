import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyVideoRuntime } from "../lib/shaun-video-render";

test("production video dependencies include caption and blur support", async () => {
  await verifyVideoRuntime();
});

test("missing deployment tools fail explicitly before the server starts", async () => {
  const originalPath = process.env.PATH;
  try {
    process.env.PATH = "/nonexistent-video-runtime-test";
    await assert.rejects(verifyVideoRuntime(), error => {
      const e = error as Error & { code: string; tool: string };
      return e.code === "MEDIA_TOOL_UNAVAILABLE" && e.tool === "ffprobe";
    });
  } finally { process.env.PATH = originalPath; }
});

const supportedFilters = ["ass", "scale", "boxblur", "drawbox"].map(name => ` ... ${name} V->V`).join("\n");

test("cold-start timeout retries and still verifies all required filters", async () => {
  const calls: string[] = [], retries: string[] = [];
  await verifyVideoRuntime({
    runTool: async (tool, _args, timeout) => {
      calls.push(tool);
      assert.ok(timeout > 0 && timeout <= 20_000);
      if (calls.length === 1) throw Object.assign(new Error("cold binary timeout"), {code:"MEDIA_TOOL_TIMEOUT"});
      return tool === "ffmpeg" ? supportedFilters : "ffprobe version";
    },
    onRetry: tool => { retries.push(tool); },
  });
  assert.deepEqual(calls, ["ffprobe", "ffprobe", "ffmpeg"]);
  assert.deepEqual(retries, ["ffprobe"]);
});

test("persistent timeouts stop after one retry rather than hanging startup", async () => {
  let calls = 0;
  await assert.rejects(verifyVideoRuntime({ runTool: async () => {
    calls++;
    throw Object.assign(new Error("timeout"), {code:"MEDIA_TOOL_TIMEOUT"});
  } }), /timeout/);
  assert.equal(calls, 2);
});

test("missing caption filters still fail startup without a timeout retry", async () => {
  let calls = 0;
  await assert.rejects(verifyVideoRuntime({ runTool: async () => { calls++; return ""; } }), /missing the ass filter/);
  assert.equal(calls, 2);
});
