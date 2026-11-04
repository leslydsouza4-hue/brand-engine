import { test } from "node:test";
import assert from "node:assert/strict";
import { finiteProgress, ffmpegProgress, jobHeartbeatExpired } from "../lib/shaun-job-progress";

test("FFmpeg startup N/A cannot poison subsequent progress", () => {
  let value = 0;
  for (const line of ["out_time_us=N/A", "out_time_us=", "out_time_us=1000000", "out_time_us=NaN", "out_time_us=5000000"]) {
    const next = ffmpegProgress(line, 10);
    if (next !== undefined) value = finiteProgress(value, next / 100);
    assert.ok(Number.isFinite(value));
    assert.notEqual(JSON.stringify({ progress: value }), '{"progress":null}');
  }
  assert.equal(value, 0.5);
  assert.equal(finiteProgress(Number.NaN, 0.6), 0.6);
  assert.equal(finiteProgress(0.6, Number.NaN), 0.6);
  assert.equal(finiteProgress(0.6, 0.2), 0.6);
});

test("interrupted jobs are detected after six missed heartbeats", () => {
  const now = Date.parse("2026-11-04T03:00:00Z");
  assert.equal(jobHeartbeatExpired("2026-11-04T02:56:49Z", now), true);
  assert.equal(jobHeartbeatExpired("2026-11-04T02:59:30Z", now), false);
  assert.equal(jobHeartbeatExpired("invalid", now), true);
});
