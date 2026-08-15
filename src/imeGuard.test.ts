import assert from "node:assert/strict";
import test from "node:test";
import { armImeGuard, filterComposingInput, filterTerminalInput } from "./imeGuard.ts";

test("does not leak pinyin pre-edit text into the shell", () => {
  assert.equal(filterComposingInput(true, "c d"), "");
  assert.equal(filterComposingInput(false, "cd"), "cd");
});

test("keeps the IME commit and suppresses the immediately retyped command", () => {
  let guard = armImeGuard("cd", 1000);
  let result = filterTerminalInput(guard, "cd", 1010);
  assert.equal(result.send, "cd");
  guard = result.guard;
  result = filterTerminalInput(guard, "c", 1100);
  assert.equal(result.send, "");
  guard = result.guard;
  result = filterTerminalInput(guard, "d", 1120);
  assert.equal(result.send, "");
  assert.equal(result.guard, null);
});

test("does not arm for Chinese text or whitespace", () => {
  assert.equal(armImeGuard("吃的", 1000), null);
  assert.equal(armImeGuard("cd foo", 1000), null);
});

test("flushes a partial mismatch instead of losing user input", () => {
  let guard = armImeGuard("cd", 1000);
  guard = filterTerminalInput(guard, "cd", 1010).guard;
  guard = filterTerminalInput(guard, "c", 1100).guard;
  const result = filterTerminalInput(guard, "a", 1120);
  assert.equal(result.send, "ca");
  assert.equal(result.guard, null);
});

test("does not suppress input outside the short correction window", () => {
  let guard = armImeGuard("cd", 1000);
  guard = filterTerminalInput(guard, "cd", 1010).guard;
  const result = filterTerminalInput(guard, "cd", 2300);
  assert.equal(result.send, "cd");
  assert.equal(result.guard, null);
});
