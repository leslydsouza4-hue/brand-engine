import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createPreview, escapeAss, extractAudio, extractFrame, makeCaptions, probeVideo, renderVideo, retainedSegments, videoEditsSchema, type VideoEdits } from "../lib/shaun-video-render";

const edits: VideoEdits = {
  trimStart: 0, trimEnd: 1.2, cuts: [{ start: 0.4, end: 0.8 }],
  blurs: [{ start: 0, end: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.2 }],
  words: [{ text: "Feature", start: 0, end: 0.35 }, { text: "updates", start: 0.85, end: 1.2 }],
  format: "horizontal", framing: "fit",
};

test("browser proxy preserves duration and audio without changing the original", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-preview-test-"));
  try {
    const source = join(dir, "source.mp4"), output = join(dir, "preview.webm");
    await promisify(execFile)("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=24",
      "-f", "lavfi", "-i", "sine=frequency=440", "-t", "2", "-c:v", "libx264", "-threads", "2", "-c:a", "aac", source]);
    const original = await readFile(source);
    await createPreview(source, output);
    assert.deepEqual(await readFile(source), original);
    const proxy = await probeVideo(output, true);
    assert.equal(proxy.width, 640);
    assert.equal(proxy.height, 360);
    assert.equal(proxy.hasAudio, true);
    assert.ok(Math.abs(proxy.duration - 2) < 0.2);
    await assert.rejects(probeVideo(output), /MP4/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("source-time cuts merge, clip and remap caption timing exactly", () => {
  const segments = retainedSegments(edits, 2);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments[0], { start: 0, end: 0.4, offset: 0 });
  assert.ok(Math.abs(segments[1].offset - 0.4) < 1e-9);
  const ass = makeCaptions(edits, segments, 1920, 1080);
  assert.match(ass, /Dialogue: 0,0:00:00\.45,0:00:00\.80/);
  assert.match(ass, /Poppins/);
  assert.match(ass, /Style: Active,Poppins,[^\n]*&H00F0A31A/);
  assert.match(ass, /\\rActive/);
  const overlapping = retainedSegments({ ...edits, cuts: [{ start: 0.2, end: 0.6 }, { start: 0.4, end: 0.9 }] }, 2);
  assert.equal(overlapping.length, 2);
  assert.equal(overlapping[1].start, 0.9);
});

test("strict edit bounds and caption override injection protection", () => {
  assert.equal(escapeAss("{\\p1}evil\\Ntext"), "｛＼p1｝evil＼Ntext");
  assert.throws(() => videoEditsSchema.parse({ ...edits, injected: true }));
  assert.throws(() => videoEditsSchema.parse({ ...edits, blurs: [{ ...edits.blurs[0], x: 0.9 }] }));
  assert.throws(() => videoEditsSchema.parse({ ...edits, words: [{ text: "bad\nline", start: 0, end: 1 }] }));
  assert.throws(() => retainedSegments({ ...edits, trimEnd: 4 }, 2), /duration/);
  assert.throws(() => retainedSegments({ ...edits, cuts: [{ start: 0, end: 1.2 }] }, 2), /retain/);
  assert.throws(() => retainedSegments({ ...edits, words: [{ text: "one", start: 0, end: 1 }, { text: "two", start: 0.5, end: 1.1 }] }, 2), /chronological/);
});

test("ASS active word is a filled cyan rectangle, and SRT segments never highlight", { timeout: 30_000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-caption-pixels-"));
  try {
    const e: VideoEdits = { ...edits, cuts: [], blurs: [], words: [{ text: "INNOVATION", start: 0, end: 1 }] };
    const ass = makeCaptions(e, retainedSegments(e, 2), 1920, 1080);
    const script = join(dir, "test.ass"), png = join(dir, "caption.png");
    await writeFile(script, ass);
    const font = fileURLToPath(new URL("../../../brand-engine/src/assets/fonts/", import.meta.url));
    const { stderr } = await promisify(execFile)("ffmpeg", ["-hide_banner", "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=0.1", "-vf", `ass=filename=${script}:fontsdir=${font}`, "-frames:v", "1", "-threads", "1", png]);
    assert.match(stderr, /fontselect: \(Poppins, 700, 0\) -> [^\n]*Poppins/i);
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const isCyan = (x: number, y: number) => {
      const p = (y * info.width + x) * info.channels;
      return data[p] < 60 && data[p + 1] > 125 && data[p + 1] < 195 && data[p + 2] > 200;
    };
    let minX = info.width, minY = info.height, maxX = 0, maxY = 0, count = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (isCyan(x, y)) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
    }
    assert.ok(count > 5000, `Expected filled cyan box, found ${count} cyan pixels`);
    // Filled rectangular corners distinguish a background box from glyph outlines.
    for (const x of [minX + 4, maxX - 4]) for (const y of [minY + 4, maxY - 4])
      assert.ok(isCyan(x, y), `Missing cyan rectangle corner at ${x},${y}`);
    assert.ok(count / ((maxX - minX + 1) * (maxY - minY + 1)) > 0.6);
    const segment = makeCaptions({ ...e, captionTiming: "segment" }, retainedSegments(e, 2), 1920, 1080);
    assert.doesNotMatch(segment.split("[Events]")[1], /\\rActive/);
    const cue = makeCaptions({ ...e, words: [{ text: "A whole SRT cue", start: 0, end: 1 }] }, retainedSegments(e, 2), 1920, 1080);
    assert.doesNotMatch(cue.split("[Events]")[1], /\\rActive/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("real supplied footage burns captions/blur, cuts audio and exports both formats", { timeout: 180_000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-render-test-"));
  const original = fileURLToPath(new URL("../../../../attached_assets/Profile_%26_Business_Cards,_Created_for_You!_1793737980449.mp4", import.meta.url));
  const exec = promisify(execFile);
  try {
    const before = await stat(original);
    const source = join(dir, "short.mp4");
    await exec("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", original, "-t", "1.3", "-c:v", "libx264", "-threads", "2", "-preset", "ultrafast", "-c:a", "aac", source]);
    const info = await probeVideo(source);
    assert.equal(info.width, 1080); assert.equal(info.height, 1080); assert.equal(info.hasAudio, true);
    const points: number[] = [];
    for (const format of ["horizontal", "vertical"] as const) {
      const output = join(dir, `${format}.mp4`);
      const rendered = await renderVideo(source, output, { ...edits, format, framing: format === "vertical" ? "blur-fill" : "fit" }, value => points.push(value));
      assert.equal(rendered.width, format === "vertical" ? 1080 : 1920);
      assert.equal(rendered.height, format === "vertical" ? 1920 : 1080);
      assert.equal(rendered.hasAudio, true);
      assert.ok(Math.abs(rendered.duration - 0.8) < 0.1);
      const frame = join(dir, `${format}.png`);
      await extractFrame(output, frame, 0.1);
      assert.ok((await stat(frame)).size > 1000);
    }
    assert.equal(points.at(-1), 100);
    const audio = join(dir, "speech.wav");
    await extractAudio(source, audio);
    assert.equal((await readFile(audio)).subarray(0, 4).toString(), "RIFF");
    const silent = join(dir, "silent.mp4");
    await exec("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-an", "-c:v", "copy", silent]);
    await assert.rejects(extractAudio(silent, join(dir, "invalid.wav")), /no audio/);
    const silentRendered = await renderVideo(silent, join(dir, "silent-output.mp4"), { ...edits, trimEnd: 0.2, cuts: [], words: [], blurs: [] });
    assert.equal(silentRendered.hasAudio, false);
    await assert.rejects(extractFrame(source, join(dir, "bad.png"), 99), /duration/);
    await assert.rejects(renderVideo(source, source, edits), /original/);
    assert.equal((await stat(original)).size, before.size);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
