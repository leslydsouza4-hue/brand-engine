import { test } from "node:test";
import assert from "node:assert/strict";
import { speakerFramingPan } from "../lib/shaun-speaker-framing";

test("headroom brings clipped hair back into a full portrait camera view", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const head = { x: 0.3, y: 0.04, width: 0.4, height: 0.45 };
  const zoom = 1.19;
  const pan = speakerFramingPan(crop, head, 800, 800, 1080, 1920, zoom);
  const renderedHeight = 1920 * zoom;
  const hairTop = (1920-renderedHeight)/2 + head.y*renderedHeight + pan.y*1920;
  assert.ok(hairTop > 0, "all detected hair is inside the output frame");
  assert.ok(pan.y > 0, "move footage down, rather than cropping the top of the head");
  assert.ok(pan.y*1920 <= (renderedHeight-1920)/2);
});

test("legacy bounds prefer headroom, but manual drags are preserved", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  assert.ok(speakerFramingPan(crop, undefined, 800, 800, 1080, 1920, 1.19).y > 0);
  const manual = { x: 0.1, y: -0.02 };
  assert.deepEqual(speakerFramingPan(crop, undefined, 800, 800, 1080, 1920, 1.19, manual), manual);
});
