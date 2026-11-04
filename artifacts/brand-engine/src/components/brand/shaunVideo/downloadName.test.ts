import { test } from "node:test";
import assert from "node:assert/strict";
import { videoDownloadName } from "./downloadName";
test("download uses video title and local thumbnail-style date", () => {
  const date = new Date(2026, 10, 4);
  assert.equal(videoDownloadName("Checkout Upgrades for AI Studio Payments!.mp4", date), "Checkout_Upgrades_for_AI_Studio_Payments_11-4-26.mp4");
  assert.equal(videoDownloadName("../../.mov", date), "Shaun_Video_11-4-26.mp4");
});
