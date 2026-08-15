import assert from "node:assert/strict";
import test from "node:test";
import { isRelativeFrame, toPercentStyle, toPixelFrame, toRelativeFrame } from "./layout.ts";

const desktop = { width: 1440, height: 900 };

test("converts pixel layout to relative values and back", () => {
  const relative = toRelativeFrame({ x: 144, y: 90, width: 720, height: 450 }, desktop);
  assert.deepEqual(relative, { x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
  assert.deepEqual(toPixelFrame(relative, desktop), { x: 144, y: 90, width: 720, height: 450 });
});

test("relative layout scales to a different display", () => {
  const relative = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };
  assert.deepEqual(toPixelFrame(relative, { width: 1920, height: 1080 }), { x: 192, y: 108, width: 960, height: 540 });
});

test("recognises legacy pixel frames for migration", () => {
  assert.equal(isRelativeFrame({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 }), true);
  assert.equal(isRelativeFrame({ x: 24, y: 24, width: 620, height: 390 }), false);
});

test("renders a relative frame as native CSS percentages", () => {
  assert.deepEqual(toPercentStyle({ x: 0.1, y: 0.2, width: 0.5, height: 0.4 }), {
    left: "10%", top: "20%", width: "50%", height: "40%",
  });
});
