import assert from "node:assert/strict";
import test from "node:test";
import { shouldFollowOutput } from "./terminalBehavior.ts";

test("output follows only while the user is already at the bottom", () => {
  assert.equal(shouldFollowOutput(100, 100), true);
  assert.equal(shouldFollowOutput(40, 100), false);
});
