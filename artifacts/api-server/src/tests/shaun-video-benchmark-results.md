# Shaun video cold-path measurement

## Export follow-up — 2026-11-20

These are local render-only measurements, not production download promises.
Synthetic 3840×2160 H.264 footage, standard 1080×1920 output, 30fps export,
three speaker/split scenes, and a timed privacy region:

- 48-second 30fps input with a cut and caption: previous graph 16.65s /
  peak child RSS 605.0 MiB; frame-before-concat graph 16.60s / 585.9 MiB.
  There is **no meaningful speed improvement** on this pair.
- 12-second 60fps input: same updated scene graph without early frame-rate
  normalization 7.665s; with early normalization 6.643s (about 13% faster).
  This isolates the early-fps change, not all historical export fixes.

Each measurement is one sample and includes local probe/process startup,
not cloud source retrieval, upload, status polling, or browser transfer.
The high-frame-rate regression checks trim/cut timing, scene transitions,
captions, audio presence, dimensions and output duration.
Do not infer that historical 20-minute waits were all slow encoding:
interrupted jobs and older published revisions require separate evidence.

## Original cold-path measurement

Measured 2026-11-04 (Asia/Calcutta) against the supplied public Descript share.
The current source is **76.300771 seconds, 3840×2160, with audio**, not exactly
the approximately 73 seconds in the original task description. Both fresh
downloads had SHA-256
`74ccfc6264cf6a7f0b74177888e8841c2aa619948dc87a5533fab97646ad2c67`.

## Method and limits

Run `pnpm --filter @workspace/api-server exec tsx src/tests/shaun-video-benchmark.ts <public-share-url>`.
The harness invokes production import, probe, preview, layout, render, cache,
and private App Storage helpers. Each path starts with a fresh Descript
download and fresh derivative objects; the optimized local cache starts empty
and is seeded from that import. Baseline reconstructs the previous sequential
pipeline: upload original, re-download for preview, download preview for
layout, re-download original for render. Optimized preview and layout run
concurrently using local original links.

These are **backend pipeline end-to-end timings**, including real transfers,
vision inference and durable writes. They **exclude HTTP request/queue,
job-status persistence, client polling, and browser playback/decode latency**.
This is one paired development-environment run, not a latency guarantee or
statistical benchmark. Network/provider variability affects results, especially
the initial import difference, where the pipeline remains substantially the
same. The signed-in editing UI was not browser-tested.

## Results (seconds)

| Stage | Previous sequential path | Updated path |
|---|---:|---:|
| First import, including original upload and metadata persistence | 4.344 | 3.411 |
| Preview preparation | 12.816 | 11.055 |
| Preview ready from start of import | 17.169 | 14.466 |
| Layout analysis and persistence | 7.180 | 6.856 |
| Import + preview + layout complete | 24.350 | 14.466 |
| Full-source horizontal render and upload | 25.991 | 24.301 |
| Cached repeat import | 0.311 | 0.318 |
| Cached repeat preview lookup | 0.066 | 0.078 |
| Cached repeat layout lookup | 0.281 | 0.284 |
| Cached repeat render lookup and server-side copy | 0.435 | 0.422 |
| Original re-downloads after initial import | 2 | 0 |

Layout succeeded on both paths. It identified the same bottom-left webcam
region (within 0.001 normalized coordinate variation). This is not a test of
continuous scene tracking. Render used the same full-length horizontal fit
recipe with no captions, cuts, or blurs to isolate source-transfer/encode time;
the existing render tests separately cover edits and both output formats.

The combined cold preparation path improved by about **41%** in this run.
The main structural improvement is removing the serial layout dependency and
redundant original transfers—not making downloads or encoding instantaneous.
Repeat requests were already fast and show no meaningful improvement.

The harness removes all temporary private storage objects and media after
completion. Raw timings go into ignored `generated-artifacts/`.

## Verification

- Video suite: 15 passed, one optional speech-model test skipped.
- Cache tests cover seed reuse, concurrent consumers, TTL/size eviction,
  active-job survival during eviction, failed/oversized transfers, namespace
  separation, permissions, and process recreation.
- Both workflows start; unauthenticated video API request returns 401.
- Type checking reports existing unrelated errors in brand-brain,
  claude-design, BizDevWorkspace, GrowthFlywheelWorkspace,
  MasterClassWorkspace, and SuperPromo2Workspace; no changed video file errors.
