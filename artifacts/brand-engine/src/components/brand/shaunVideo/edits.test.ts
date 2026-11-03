import assert from "node:assert/strict";
import { test } from "node:test";
import { captionAt, defaultEdits, groupCaptionLines, keptRanges, nextPlayableTime, outputDuration, validateEdits } from "./edits";

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
  assert.equal(validateEdits(e, 10).length, 2);
  assert.equal(validateEdits(defaultEdits(10), 10).length, 0);
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
