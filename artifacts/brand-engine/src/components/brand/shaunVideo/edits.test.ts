import assert from "node:assert/strict";
import { test } from "node:test";
import { captionAt, defaultEdits, fitCrop, validRect, groupCaptionLines, keptRanges, nextPlayableTime, outputDuration, validateEdits, speakerFramingPan, speakerFramingZoom } from "./edits";

test("automatic headroom matches the renderer and keeps manual positioning", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 }, head = { x: 0.3, y: 0.04, width: 0.4, height: 0.45 };
  const pan = speakerFramingPan(crop, head, 800, 800, 1080, 1920, 1.19, undefined, "rectangle");
  const h = 1920*1.19;
  assert.ok((1920-h)/2 + head.y*h + pan.y*1920 > 0);
  const manual = { x: 0.1, y: -0.02 };
  assert.deepEqual(speakerFramingPan(crop, head, 800, 800, 1080, 1920, 1.19, manual, "rectangle"), manual);
});

test("circular speaker positioning keeps the camera border outside the preview", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const zoom = Math.sqrt(1 + (720 / 1280) ** 2) * 1.04;
  for (const requested of [undefined, { x: 0.4, y: -0.3 }]) {
    const pan = speakerFramingPan(crop, undefined, 800, 800, 720, 1280, zoom, requested, "circle");
    const radius = 1280 * zoom / 2;
    assert.ok(((360 + Math.abs(pan.x * 720)) / radius) ** 2 +
      ((640 + Math.abs(pan.y * 1280)) / radius) ** 2 <= 0.98 ** 2 + 1e-9);
  }
});

test("circular speaker drags move in both directions without losing border protection", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const base = Math.sqrt(1 + (720 / 1280) ** 2) * 1.04;
  for (const requested of [{x:0.2,y:0.15}, {x:-0.25,y:-0.2}]) {
    const zoom = speakerFramingZoom(crop, 800, 800, 720, 1280, base, requested, "circle");
    assert.ok(zoom > base);
    assert.deepEqual(speakerFramingPan(crop, undefined, 800, 800, 720, 1280, zoom, requested, "circle"), requested);
    const radius = 1280*zoom/2;
    assert.ok(((360 + Math.abs(requested.x*720))/radius)**2 +
      ((640 + Math.abs(requested.y*1280))/radius)**2 < 0.98**2);
  }
});

test("kept ranges remove trim and merged cuts", () => {
  const e = { ...defaultEdits(20), trimStart: 1, trimEnd: 18, cuts: [{ start: 5, end: 7 }, { start: 6, end: 8 }, { start: 17, end: 30 }] };
  assert.deepEqual(keptRanges(e), [{ start: 1, end: 5 }, { start: 8, end: 17 }]);
  assert.equal(outputDuration(e), 13);
  assert.equal(nextPlayableTime(e, 0), 1);
  assert.equal(nextPlayableTime(e, 6), 8);
  assert.equal(nextPlayableTime(e, 17.5), null);
});

test("caption lines break on punctuation, gaps and length", () => {
  const w = (text: string, start: number) => ({ text, start, end: start + 0.3 });
  const lines = groupCaptionLines([w("this", 0), w("out,", 0.3), w("preview", 0.6), w("it.", 0.9), w("edit", 1.2), w("later", 3)]);
  assert.deepEqual(lines.map(l => l.map(x => x.text).join(" ")), ["this out, preview it.", "edit", "later"]);
  const c = captionAt(lines.flat(), 0.4, "word", defaultEdits(10));
  assert.equal(c?.activeIndex, 1);
});

test("validation flags inverted ranges and out-of-frame blurs", () => {
  const e = { ...defaultEdits(10), blurs: [{ start: 2, end: 1, x: 0.8, y: 0, width: 0.4, height: 0.2 }] };
  assert.equal(validateEdits(e, 10).length, 3);
  assert.equal(validateEdits(defaultEdits(10), 10).length, 1);
  assert.equal(validateEdits({ ...defaultEdits(10), format: "horizontal" }, 10).length, 0);
});

test("split crops preserve screen and fill speaker with strict normalized bounds", () => {
  assert.equal(validRect({ x: 0, y: 0, width: 1, height: 1 }), true);
  assert.equal(validRect({ x: 0.9, y: 0, width: 0.2, height: 1 }), false);
  assert.equal(validRect({ x: 0, y: 0, width: 0.015, height: 1 }), false);
  const screen = fitCrop(1920, 1080, 1080, 960, "contain");
  assert.equal(screen.sw, 1920);
  assert.equal(screen.dw, 1080);
  assert.ok(screen.dh < 960);
  const speaker = fitCrop(500, 500, 1080, 960, "cover");
  assert.equal(speaker.dw, 1080);
  assert.equal(speaker.dh, 960);
  assert.ok(speaker.sh < 500);
});

test("blur drag maps client pixels to normalized source rect in any direction", async () => {
  const { normalizedPoint, boxFromDrag } = await import("./edits");
  const rect = { left: 100, top: 50, width: 400, height: 200 };
  const a = normalizedPoint(500, 250, rect), b = normalizedPoint(300, 150, rect);
  assert.deepEqual(a, { x: 1, y: 1 });
  assert.deepEqual(boxFromDrag(a, b), { x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
  assert.deepEqual(normalizedPoint(0, 0, rect), { x: 0, y: 0 });
  assert.equal(boxFromDrag({ x: 0.2, y: 0.2 }, { x: 0.205, y: 0.6 }), null);
  assert.deepEqual(boxFromDrag({ x: 0.1, y: 0.1 }, { x: 0.12, y: 0.12 }), { x: 0.1, y: 0.1, width: 0.02, height: 0.02 });
});

test("layoutAt picks scene, falls back to base split in gaps; crop mapping round-trips", async () => {
  const { layoutAt, cropToSource, renderEdits } = await import("./edits");
  const r = { x: 0, y: 0, width: 1, height: 0.5 };
  const base = { screen: r, speaker: { x: 0, y: 0.5, width: 1, height: 0.5 } };
  const e = { ...defaultEdits(20), split: base, scenes: [{ start: 2, end: 5, mode: "speaker" as const, split: base }] };
  assert.equal(layoutAt(e, 3)?.mode, "speaker");
  assert.equal(layoutAt(e, 6)?.sceneIndex, null);
  assert.deepEqual(cropToSource({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, { x: 0, y: 0.5, width: 1, height: 0.5 }), { x: 0.5, y: 0.75, width: 0.5, height: 0.25 });
  assert.equal(renderEdits(e, null).scenes?.length, 1);
});

import { panelPlacement, panLimits } from "./edits";

test("screen contain keeps all content and letterboxes, pan locked on letterboxed axis", () => {
  const p = panelPlacement(1920, 1080, 1080, 960, "contain");
  assert.equal(p.dw, 1080); assert.equal(Math.round(p.dh), 608); assert.equal(p.dx, 0);
  const q = panelPlacement(1920, 1080, 1080, 960, "contain", 1, { x: 0.5, y: 0.5 });
  assert.equal(q.offsetX, 0);
  assert.ok(Math.abs(q.offsetY - (960 - 607.5) / 2) < 1e-9);
  assert.ok(q.dy + q.dh <= 960 + 1e-9);
});

test("zoom out of cover recovers full source pixels", () => {
  const p = panelPlacement(1000, 500, 500, 500, "cover", 0.5);
  assert.equal(p.dw, 500); assert.equal(p.dh, 250); assert.equal(p.dx, 0); assert.equal(p.dy, 125);
});

test("larger image pan clamps so panel stays covered", () => {
  const p = panelPlacement(1000, 1000, 500, 500, "cover", 2, { x: 1, y: -1 });
  assert.equal(p.dw, 1000); assert.equal(p.offsetX, 250); assert.equal(p.offsetY, -250);
  assert.equal(p.dx, 0); assert.equal(p.dy + p.dh, 500);
  assert.deepEqual(panLimits(1000, 1000, 500, 500, "cover", 2), { x: 0.5, y: 0.5 });
  assert.deepEqual(panLimits(1000, 1000, 500, 500, "cover", 1), { x: 0, y: 0 });
});

import { renderEdits } from "./edits";
test("export quality: new uploads fast, old sessions standard, renderEdits preserves", () => {
  assert.equal(defaultEdits(10).exportQuality, "fast");
  assert.equal(renderEdits(defaultEdits(10), null).exportQuality, "fast");
  const old = { ...defaultEdits(10) }; delete old.exportQuality;
  assert.equal(renderEdits(old, null).exportQuality, "standard");
  assert.equal(renderEdits({ ...defaultEdits(10), exportQuality: "standard" }, null).exportQuality, "standard");
});
