/**
 * Real cold-path benchmark (not a unit test). Runs production pipeline helpers,
 * App Storage transfers and vision inference, without browser/polling overhead.
 * Usage: pnpm --filter @workspace/api-server exec tsx src/tests/shaun-video-benchmark.ts <public Descript share URL>
 * Writes timings only; removes its private storage objects and local media.
 */
import { randomUUID, createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { importDescript, validateDescriptShareUrl } from "../lib/shaun-video-import";
import { createPreview, probeVideo, renderVideo, type VideoEdits } from "../lib/shaun-video-render";
import { detectVideoLayout } from "../lib/shaun-video-layout";
import { VideoSourceCache } from "../lib/shaun-video-cache";
import { privateFile, saveRecord, readRecord } from "../lib/shaun-video-store";

const url = validateDescriptShareUrl(process.argv[2] || "");
const outputDir = resolve("../../generated-artifacts/shaun-video-benchmark");
await mkdir(outputDir, { recursive: true });
const root = await mkdtemp(join(outputDir, "run-"));
const owner = "benchmark";
const prefix = `benchmarks/${randomUUID()}`;
const objects = new Set<string>();
const metrics: Record<string, unknown> = {
  measured: "Production pipeline helpers including real transfers, probe, encode, vision and persistence; excludes HTTP queue/poll/browser overhead.",
};
async function measure<T>(name: string, work: () => Promise<T>) {
  const start = performance.now();
  try { return await work(); }
  finally {
    const ms = Math.round(performance.now() - start);
    metrics[name] = ms;
    console.log(`${name}: ${(ms / 1000).toFixed(3)}s`);
  }
}
const file = (name: string) => {
  const key = `${prefix}/${name}`;
  objects.add(key);
  return privateFile(owner, key);
};
async function upload(name: string, path: string, contentType: string) {
  const target = file(name);
  await target.bucket.upload(path, { destination: target.name, resumable: false,
    metadata: { contentType, cacheControl: "private, no-store" } });
}
async function record(name: string, value: unknown) {
  const key = `${prefix}/${name}`;
  objects.add(key);
  await saveRecord(owner, key, value);
}
try {
  for (const mode of ["baseline", "optimized"] as const) {
    const dir = join(root, mode);
    await mkdir(dir);
    const source = join(dir, "source.mp4");
    const cache = new VideoSourceCache(join(dir, "cache"));
    const sourceKey = `${mode}/source`;
    const start = performance.now();
    const probe = await measure(`${mode}.firstImport`, async () => {
      await measure(`${mode}.descriptDownload`, () => importDescript(url, source));
      const probe = await probeVideo(source);
      if (probe.width < 3800 || probe.duration < 70 || probe.duration > 80)
        throw new Error(`Not the expected roughly 73-second 4K source: ${JSON.stringify(probe)}`);
      metrics[`${mode}.source`] = { ...probe, sha256: createHash("sha256").update(await readFile(source)).digest("hex") };
      await measure(`${mode}.originalUpload`, () => upload(sourceKey, source, "video/mp4"));
      await record(`${mode}/video.json`, { probe });
      await record(`${mode}/import.json`, { sourceKey, at: Date.now() });
      if (mode === "optimized") await cache.seed(sourceKey, source);
      return probe;
    });
    await rm(source);
    let sourceTransfers = 0;
    const load = async (destination: string) => {
      sourceTransfers++;
      const target = file(sourceKey);
      await target.getMetadata();
      await target.download({ destination });
    };
    const local = async (destination: string) => {
      if (mode === "optimized") await cache.materialize(sourceKey, destination, load);
      else await load(destination);
    };
    const preview = () => measure(`${mode}.preview`, async () => {
      const input = join(dir, "preview-source.mp4"), output = join(dir, "preview.webm");
      await local(input);
      await createPreview(input, output);
      await upload(`${mode}/preview`, output, "video/webm");
      metrics[`${mode}.previewReadyFromStart`] = Math.round(performance.now() - start);
    });
    const layout = () => measure(`${mode}.layout`, async () => {
      const input = join(dir, "layout-source");
      if (mode === "baseline") await file(`${mode}/preview`).download({ destination: input });
      else await local(input);
      // A correct manual-crop refusal is a valid timed outcome, not a fabricated result.
      const result = await detectVideoLayout(input, dir, probe.duration)
        .then(value => ({ ok: true as const, ...value }), error => ({ ok: false as const, message: error.message }));
      metrics[`${mode}.layoutOutcome`] = result;
      if (result.ok) await record(`${mode}/layout.json`, result);
      return result;
    });
    let detected;
    if (mode === "optimized") [, detected] = await Promise.all([preview(), layout()]);
    else { await preview(); detected = await layout(); }
    metrics[`${mode}.importPreviewLayoutTotal`] = Math.round(performance.now() - start);
    // Use the same deterministic edit recipe in both runs. Horizontal does not
    // depend on vision accepting this source, avoiding unrelated crop differences.
    const edits: VideoEdits = { trimStart: 0, trimEnd: probe.duration, cuts: [], blurs: [],
      words: [], format: "horizontal", framing: "fit" };
    await measure(`${mode}.render`, async () => {
      const input = join(dir, "render-source.mp4"), output = join(dir, "render.mp4");
      await local(input);
      await renderVideo(input, output, edits);
      await upload(`${mode}/render`, output, "video/mp4");
      await record(`${mode}/render.json`, { output: `${mode}/render` });
    });
    await measure(`${mode}.repeatImport`, async () => {
      await readRecord(owner, `${prefix}/${mode}/import.json`);
      await readRecord(owner, `${prefix}/${mode}/video.json`);
    });
    await measure(`${mode}.repeatPreview`, () => file(`${mode}/preview`).exists());
    if (detected.ok) await measure(`${mode}.repeatLayout`, async () => {
      await file(`${mode}/layout.json`).exists();
      await readRecord(owner, `${prefix}/${mode}/layout.json`);
    });
    await measure(`${mode}.repeatRender`, async () => {
      await readRecord(owner, `${prefix}/${mode}/render.json`);
      await file(`${mode}/render`).exists();
      await file(`${mode}/render`).copy(file(`${mode}/repeat-render`));
    });
    metrics[`${mode}.originalRedownloads`] = sourceTransfers;
  }
} finally {
  await writeFile(join(outputDir, "timings.json"), JSON.stringify(metrics, null, 2));
  await Promise.all([...objects].map(key => privateFile(owner, key).delete({ ignoreNotFound: true })));
  await rm(root, { recursive: true, force: true });
}
