import { test } from "node:test";
import assert from "node:assert/strict";
import { speakerFramingPan } from "../lib/shaun-speaker-framing";

test("offscreen saved offsets recover the speaker without changing scale", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const head = { x: 0.35, y: 0.2, width: 0.3, height: 0.4 };
  for (const height of [1280,896]) {
    for (const zoom of [0.5,1,1.5]) {
      const auto = speakerFramingPan(crop,head,800,800,720,height,zoom,undefined,"rectangle");
      const recovered = speakerFramingPan(crop,head,800,800,720,height,zoom,{x:1,y:1},"rectangle");
      assert.deepEqual(recovered, auto);
      const w=height*zoom, h=height*zoom;
      const x=(720-w)/2+head.x*w+recovered.x*720;
      const y=(height-h)/2+head.y*h+recovered.y*height;
      assert.ok(x<720 && x+head.width*w>0 && y<height && y+head.height*h>0);
      const manual={x:0.1,y:0.05};
      assert.deepEqual(speakerFramingPan(crop,head,800,800,720,height,zoom,manual,"rectangle"),manual);
    }
  }
});

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

test("automatic positioning keeps the circular camera edge hidden", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  const head = { x: 0.3, y: 0.03, width: 0.4, height: 0.5 };
  for (const height of [1280, 896]) {
    const width = 720;
    const zoom = Math.sqrt(1 + (width / height) ** 2) * 1.04;
    const rendered = height * zoom;
    for (const manual of [undefined]) {
      const pan = speakerFramingPan(crop, head, 800, 800, width, height, zoom, manual, "circle");
      const furthest = ((width / 2 + Math.abs(pan.x * width)) / (rendered / 2)) ** 2 +
        ((height / 2 + Math.abs(pan.y * height)) / (rendered / 2)) ** 2;
      assert.ok(furthest <= 0.98 ** 2 + 1e-9, "all four corners stay inside the camera, with a border margin");
    }
  }
});

test("manual circular camera movement wins at every zoom, including zooming out and zero position", () => {
  const crop = { x: 0, y: 0, width: 1, height: 1 };
  for (const height of [1280, 896]) {
    for (const requested of [{ x: 0.18, y: 0.12 }, { x: -0.25, y: -0.2 }, { x: 0, y: 0 }]) {
      for (const zoom of [0.5, 1, 2]) {
      const actual = speakerFramingPan(crop, undefined, 800, 800, 720, height, zoom, requested, "circle");
      assert.deepEqual(actual, requested, "requested movement is preserved");
      }
    }
  }
});
