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
