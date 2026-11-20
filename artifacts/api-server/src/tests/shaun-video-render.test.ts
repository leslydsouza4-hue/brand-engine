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

test("vertical split renders screen above speaker without changing horizontal", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-split-test-"));
  try {
    const source = join(dir, "source.mp4"), output = join(dir, "split.mp4"), frame = join(dir, "frame.png");
    await promisify(execFile)("ffmpeg", ["-v", "error", "-f", "lavfi", "-i",
      "color=c=red:s=640x360:r=24,drawbox=x=320:y=0:w=320:h=360:color=blue:t=fill",
      "-t", "1", "-c:v", "libx264", "-threads", "2", source]);
    const split = { screen: { x: 0, y: 0, width: 0.5, height: 1 }, speaker: { x: 0.5, y: 0, width: 0.5, height: 1 }, screenScale: 0.5, speakerScale: 1, speakerPan: { x: 0.25, y: 0 } };
    const config: VideoEdits = { trimStart: 0, trimEnd: 1, cuts: [], blurs: [], words: [], format: "vertical", framing: "fit", split };
    await renderVideo(source, output, config);
    await promisify(execFile)("ffmpeg", ["-v", "error", "-i", output, "-frames:v", "1", frame]);
    const pixel = async (x: number, y: number) => [...await sharp(frame).extract({ left: x, top: y, width: 1, height: 1 }).removeAlpha().raw().toBuffer()];
    const top = await pixel(540, 288), bottom = await pixel(540, 1440);
    assert.ok(top[0] > 200 && top[2] < 30, "screen is in top half");
    assert.ok(bottom[2] > 200 && bottom[0] < 30, "speaker is in bottom half");
    const edge = await pixel(100, 288);
    assert.ok(Math.max(...edge) < 50, "50% screen scale adds space");
    const lowerEdge = await pixel(540, 1000);
    assert.ok(lowerEdge[2] > 200, "speaker scaling remains independent");
    const pannedEdge = await pixel(50, 1440);
    assert.ok(pannedEdge[2]>200 && pannedEdge[0]<30, "dragging is bounded so the speaker cannot expose empty space");
    assert.equal(videoEditsSchema.safeParse({ ...config, split: { ...split, screenScale: 3 } }).success, false);
    await renderVideo(source, output, { ...config, split: { ...split, screenScale: 1 } });
    await promisify(execFile)("ffmpeg", ["-v", "error", "-y", "-i", output, "-frames:v", "1", frame]);
    for (const x of [1, 1078]) {
      const p = await pixel(x, 288);
      assert.ok(p[0] > 200 && p[2] < 30, "default screen framing fills both side edges");
    }
    await renderVideo(source, join(dir, "horizontal.mp4"), { ...config, format: "horizontal" });
    const horizontal = await probeVideo(join(dir, "horizontal.mp4"));
    assert.equal(horizontal.width, 1920);
    assert.equal(horizontal.height, 1080);
    assert.equal(videoEditsSchema.safeParse({ ...config, split: { ...split, speaker: { x: 0.9, y: 0, width: 0.5, height: 1 } } }).success, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("circular camera borders stay out of full and split exports, including manual drags", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-circle-border-"));
  try {
    const image = join(dir, "circle.png"), source = join(dir, "circle.mp4");
    await sharp(Buffer.from('<svg width="800" height="800"><rect width="800" height="800" fill="red"/><circle cx="400" cy="400" r="396" fill="blue"/></svg>')).png().toFile(image);
    await promisify(execFile)("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", image, "-t", "0.3",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", source]);
    for (const mode of ["speaker", "split"] as const) {
      const output = join(dir, `${mode}.mp4`), frame = join(dir, `${mode}.png`);
      const split = { speaker: { x: 0, y: 0, width: 1, height: 1 },
        screen: { x: 0, y: 0, width: 1, height: 1 }, speakerShape: "circle" as const,
        speakerHead: { x: 0.3, y: 0.03, width: 0.4, height: 0.5 },
        speakerPan: mode === "split" ? { x: 0.35, y: -0.2 } : undefined,
        speakerScale: 0.68 };
      await renderVideo(source, output, { trimStart: 0, trimEnd: 0.3, cuts: [], words: [],
        blurs: [], format: "vertical", framing: "fit", exportQuality: "fast", split,
        scenes: [{ start: 0, end: 0.3, mode, split }] });
      await promisify(execFile)("ffmpeg", ["-v", "error", "-y", "-i", output, "-frames:v", "1", frame]);
      const { data, info } = await sharp(frame).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const top = mode === "split" ? Math.round(info.height * 0.3 / 2) * 2 : 0;
      for (let y = top + 3; y < info.height - 3; y++) {
        for (let x = 3; x < info.width - 3; x++) {
          const p = (y * info.width + x) * info.channels;
          assert.ok(data[p + 2] > 150 && data[p] < 70,
            `${mode}: no red outer-camera pixels at ${x},${y}`);
        }
      }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("scene transitions survive cuts and render speaker-only then split", async () => {
  const dir=await mkdtemp(join(tmpdir(),"shaun-scenes-test-"));
  try {
    const source=join(dir,"source.mp4"),output=join(dir,"out.mp4");
    await promisify(execFile)("ffmpeg",["-v","error","-f","lavfi","-i","color=c=red:s=640x360:r=24,drawbox=x=320:y=0:w=320:h=360:color=blue:t=fill","-t","3","-c:v","libx264","-threads","2",source]);
    const split={screen:{x:0,y:0,width:0.5,height:1},speaker:{x:0.5,y:0,width:0.5,height:1}};
    const e:VideoEdits={trimStart:0.2,trimEnd:3,cuts:[{start:0.5,end:1.5}],blurs:[],words:[],format:"vertical",framing:"fit",split,scenes:[{start:0,end:2,mode:"speaker",split},{start:2,end:3,mode:"split",split}]};
    await renderVideo(source,output,e);
    for(const [time,red] of [[0.2,false],[1.5,true]] as const){
      const frame=join(dir,`frame-${time}.png`);
      await promisify(execFile)("ffmpeg",["-v","error","-ss",String(time),"-i",output,"-frames:v","1",frame]);
      const p=await sharp(frame).extract({left:540,top:480,width:1,height:1}).removeAlpha().raw().toBuffer();
      assert.ok(red ? p[0]>200 && p[2]<30 : p[2]>200 && p[0]<30);
    }
  } finally {await rm(dir,{recursive:true,force:true});}
});

test("source-time cuts merge, clip and remap caption timing exactly", () => {
  const segments = retainedSegments(edits, 2);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments[0], { start: 0, end: 0.4, offset: 0 });
  assert.ok(Math.abs(segments[1].offset - 0.4) < 1e-9);
  const ass = makeCaptions(edits, segments, 1920, 1080);
  assert.match(ass, /Dialogue: 0,0:00:00\.45,0:00:00\.80/);
  assert.match(ass, /Poppins/);
  assert.match(ass, /\\1c&H00F0A31A&\\p1/);
  assert.match(ass, / b /);
  const overlapping = retainedSegments({ ...edits, cuts: [{ start: 0.2, end: 0.6 }, { start: 0.4, end: 0.9 }] }, 2);
  assert.equal(overlapping.length, 2);
  assert.equal(overlapping[1].start, 0.9);
});

test("60fps input keeps source-time scenes and audio when exported at 30fps", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-high-fps-"));
  const exec = promisify(execFile);
  try {
    const source = join(dir, "source.mp4"), output = join(dir, "output.mp4");
    await exec("ffmpeg", ["-v", "error", "-f", "lavfi", "-i",
      "color=c=red:s=640x360:r=60,drawbox=x=320:y=0:w=320:h=360:color=blue:t=fill",
      "-f", "lavfi", "-i", "sine=frequency=440", "-t", "3",
      "-c:v", "libx264", "-threads", "2", "-c:a", "aac", source]);
    const split = { screen: { x: 0, y: 0, width: 0.5, height: 1 },
      speaker: { x: 0.5, y: 0, width: 0.5, height: 1 } };
    const result = await renderVideo(source, output, {
      trimStart: 0.2, trimEnd: 2.8, cuts: [{ start: 0.6, end: 1.4 }],
      blurs: [], words: [{ text: "Hello", start: 1.5, end: 1.8 }],
      format: "vertical", framing: "fit", exportQuality: "fast", split,
      scenes: [{ start: 0, end: 2, mode: "speaker", split }, { start: 2, end: 3, mode: "split", split }],
    });
    assert.equal(result.hasAudio, true);
    assert.equal(result.width, 720);
    assert.equal(result.height, 1280);
    assert.ok(Math.abs(result.duration - 1.8) < 0.1);
    for (const [at, isScreen] of [[0.2, false], [1.5, true]] as const) {
      const image = join(dir, `${at}.png`);
      await exec("ffmpeg", ["-v", "error", "-ss", String(at), "-i", output, "-frames:v", "1", image]);
      const pixel = await sharp(image).extract({ left: 360, top: 200, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
      assert.ok(isScreen ? pixel[0] > 200 && pixel[2] < 30 : pixel[2] > 200 && pixel[0] < 30);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("small timed privacy regions export without invalid chroma radii", async () => {
  const dir = await mkdtemp(join(tmpdir(), "shaun-small-blur-"));
  try {
    const source = join(dir, "source.mp4"), output = join(dir, "output.mp4");
    await promisify(execFile)("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30",
      "-t", "1", "-c:v", "libx264", "-threads", "2", source]);
    const points: number[] = [];
    await renderVideo(source, output, { trimStart: 0, trimEnd: 1, cuts: [], words: [], format: "horizontal",
      framing: "fit", exportQuality: "fast",
      blurs: [{ start: 0.2, end: 0.5, x: 0.2, y: 0.2, width: 0.02, height: 0.02 }] }, p => points.push(p));
    assert.ok(points.every(Number.isFinite));
    assert.equal(points.at(-1), 100);
    assert.equal((await probeVideo(output)).width, 1280);
  } finally { await rm(dir, { recursive: true, force: true }); }
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

test("ASS active word has a filled rounded cyan box, and SRT segments never highlight", { timeout: 30_000 }, async () => {
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
    // Curved corners must be empty while the middle of each box edge is filled.
    for (const x of [minX + 1, maxX - 1]) for (const y of [minY + 1, maxY - 1])
      assert.ok(!isCyan(x, y), `Expected rounded inset at ${x},${y}`);
    assert.ok(isCyan(Math.round((minX+maxX)/2), minY+2));
    assert.ok(isCyan(minX+2, Math.round((minY+maxY)/2)));
    assert.ok(count / ((maxX - minX + 1) * (maxY - minY + 1)) > 0.6);
    let whiteMinX = info.width, whiteMaxX = 0, whiteMinY = info.height, whiteMaxY = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const p = (y*info.width+x)*info.channels;
      if (data[p] > 235 && data[p+1] > 235 && data[p+2] > 235) {
        whiteMinX = Math.min(whiteMinX, x); whiteMaxX = Math.max(whiteMaxX, x);
        whiteMinY = Math.min(whiteMinY, y); whiteMaxY = Math.max(whiteMaxY, y);
      }
    }
    assert.ok(whiteMinX > minX && whiteMaxX < maxX, "rounded background encloses the shaped word horizontally");
    assert.ok(whiteMinY > minY && whiteMaxY < maxY, "rounded background encloses the word vertically");
    const segment = makeCaptions({ ...e, captionTiming: "segment" }, retainedSegments(e, 2), 1920, 1080);
    assert.doesNotMatch(segment.split("[Events]")[1], /\\p1/);
    const cue = makeCaptions({ ...e, words: [{ text: "A whole SRT cue", start: 0, end: 1 }] }, retainedSegments(e, 2), 1920, 1080);
    assert.doesNotMatch(cue.split("[Events]")[1], /\\p1/);
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
