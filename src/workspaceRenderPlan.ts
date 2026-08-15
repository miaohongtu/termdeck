import type { Workspace } from "./types";

export type WorkspaceRenderLayer = {
  id: string;
  active: boolean;
  terminals: Workspace["terminals"];
};

export function createWorkspaceRenderPlan(spaces: Workspace[], activeId: string): WorkspaceRenderLayer[] {
  return spaces.map(space => ({
    id: space.id,
    active: space.id === activeId,
    terminals: space.terminals,
  }));
}
