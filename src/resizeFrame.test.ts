import assert from "node:assert/strict";
import test from "node:test";
import { resizeFrame, resizeFrameWithMagnet } from "./resizeFrame.ts";

const frame = { x: 100, y: 80, width: 600, height: 400 };

test("resizes from every straight edge while preserving the opposite edge", () => {
  assert.deepEqual(resizeFrame(frame, "e", 50, 0), { x: 100, y: 80, width: 650, height: 400 });
  assert.deepEqual(resizeFrame(frame, "w", 50, 0), { x: 150, y: 80, width: 550, height: 400 });
  assert.deepEqual(resizeFrame(frame, "s", 0, 30), { x: 100, y: 80, width: 600, height: 430 });
  assert.deepEqual(resizeFrame(frame, "n", 0, 30), { x: 100, y: 110, width: 600, height: 370 });
});

test("corner handles resize both axes", () => {
  assert.deepEqual(resizeFrame(frame, "nw", 20, 25), { x: 120, y: 105, width: 580, height: 375 });
  assert.deepEqual(resizeFrame(frame, "se", 20, 25), { x: 100, y: 80, width: 620, height: 425 });
});

test("minimum size keeps the opposite edge fixed", () => {
  assert.deepEqual(resizeFrame(frame, "w", 500, 0), { x: 380, y: 80, width: 320, height: 400 });
  assert.deepEqual(resizeFrame(frame, "n", 0, 500), { x: 100, y: 290, width: 600, height: 190 });
});

test("a resizing edge snaps and resists detaching", () => {
  const snapped = resizeFrameWithMagnet(frame, "e", 47, 0, 400, 0, [750], [], null, null);
  assert.equal(snapped.frame.width, 650);
  assert.deepEqual(snapped.xLock, { target: 750, pointer: 400 });
  const resisted = resizeFrameWithMagnet(frame, "e", 64, 0, 418, 0, [750], [], snapped.xLock, null);
  assert.equal(resisted.frame.width, 650);
  const released = resizeFrameWithMagnet(frame, "e", 75, 0, 424, 0, [750], [], snapped.xLock, null);
  assert.equal(released.frame.width, 675);
  assert.equal(released.xLock, null);
});

test("top-left corner can snap both moving edges", () => {
  const result = resizeFrameWithMagnet(frame, "nw", -97, -77, 20, 30, [0], [0], null, null);
  assert.deepEqual(result.frame, { x: 0, y: 0, width: 700, height: 480 });
  assert.equal(result.xLock?.target, 0);
  assert.equal(result.yLock?.target, 0);
});
