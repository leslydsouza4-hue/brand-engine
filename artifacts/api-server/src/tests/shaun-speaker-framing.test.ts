import { test } from "node:test";
import assert from "node:assert/strict";
import { speakerFramingPan } from "../lib/shaun-speaker-framing";

test("headroom brings clipped hair back into a full portrait camera view", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const head = { x: 0.3, y: 0.04, width: 0.4, height: 0.45 };
  const zoom = 1.19;
  const pan = speakerFramingPan(crop, head, 800, 800, 1080, 1920, zoom, undefined, "rectangle");
  const renderedHeight = 1920 * zoom;
  const hairTop = (1920-renderedHeight)/2 + head.y*renderedHeight + pan.y*1920;
  assert.ok(hairTop > 0, "all detected hair is inside the output frame");
  assert.ok(pan.y > 0, "move footage down, rather than cropping the top of the head");
  assert.ok(pan.y*1920 <= (renderedHeight-1920)/2);
});

test("legacy bounds prefer headroom, but manual drags are preserved", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  assert.ok(speakerFramingPan(crop, undefined, 800, 800, 1080, 1920, 1.19, undefined, "rectangle").y > 0);
  const manual = { x: 0.1, y: -0.02 };
  assert.deepEqual(speakerFramingPan(crop, undefined, 800, 800, 1080, 1920, 1.19, manual, "rectangle"), manual);
});

test("automatic and manual positioning never reveal a circular camera edge", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const head = { x: 0.3, y: 0.03, width: 0.4, height: 0.5 };
  for (const height of [1280, 896]) {
    const width = 720;
    const zoom = Math.sqrt(1 + (width / height) ** 2) * 1.04;
    const rendered = height * zoom;
    for (const manual of [undefined, { x: 0.4, y: 0.3 }, { x: -0.4, y: -0.3 }]) {
      const pan = speakerFramingPan(crop, head, 800, 800, width, height, zoom, manual, "circle");
      const furthest = ((width / 2 + Math.abs(pan.x * width)) / (rendered / 2)) ** 2 +
        ((height / 2 + Math.abs(pan.y * height)) / (rendered / 2)) ** 2;
      assert.ok(furthest <= 0.98 ** 2 + 1e-9, "all four corners stay inside the camera, with a border margin");
    }
  }
});
