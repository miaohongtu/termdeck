import assert from "node:assert/strict";
import test from "node:test";
import { magnetizeAxis, nearestSnap } from "./snap.ts";

test("snaps to the nearest edge inside the magnetic range", () => {
  assert.equal(nearestSnap(107, [0, 100, 240], 10), 100);
  assert.equal(nearestSnap(114, [0, 100, 240], 10), null);
});

test("a snapped edge stays latched until pointer movement exceeds resistance", () => {
  const snapped = magnetizeAxis(107, 300, [100], null);
  assert.deepEqual(snapped, { position: 100, lock: { target: 100, pointer: 300 } });
  assert.equal(magnetizeAxis(126, 318, [100], snapped.lock).position, 100);
  assert.deepEqual(magnetizeAxis(132, 324, [100], snapped.lock), { position: 132, lock: null });
});
