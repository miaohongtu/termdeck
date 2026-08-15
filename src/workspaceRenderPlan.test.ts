import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceRenderPlan } from "./workspaceRenderPlan.ts";
import type { Workspace } from "./types";

const spaces: Workspace[] = [
  { id: "one", name: "工作区 1", terminals: [{ id: "shell-1", title: "Shell 1", cwd: "/tmp", restoreCommand: "" }] },
  { id: "two", name: "工作区 2", terminals: [{ id: "shell-2", title: "Shell 2", cwd: "/tmp", restoreCommand: "" }] },
];

test("switching workspaces preserves the mounted terminal set", () => {
  const before = createWorkspaceRenderPlan(spaces, "one");
  const after = createWorkspaceRenderPlan(spaces, "two");

  assert.deepEqual(before.flatMap(layer => layer.terminals.map(item => item.id)), ["shell-1", "shell-2"]);
  assert.deepEqual(after.flatMap(layer => layer.terminals.map(item => item.id)), ["shell-1", "shell-2"]);
  assert.deepEqual(before.map(layer => layer.active), [true, false]);
  assert.deepEqual(after.map(layer => layer.active), [false, true]);
});
