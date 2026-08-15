export type ImeGuard = {
  text: string;
  phase: "awaitCommit" | "suppressDuplicate";
  offset: number;
  expiresAt: number;
};

const WINDOW_MS = 1200;

export function filterComposingInput(isComposing: boolean, data: string) {
  return isComposing ? "" : data;
}

export function armImeGuard(text: string, now: number): ImeGuard | null {
  if (!/^[A-Za-z][A-Za-z0-9._/-]{0,31}$/.test(text)) return null;
  return { text, phase: "awaitCommit", offset: 0, expiresAt: now + WINDOW_MS };
}

export function filterTerminalInput(guard: ImeGuard | null, data: string, now: number) {
  if (!guard) return { send: data, guard: null };
  const buffered = guard.phase === "suppressDuplicate" ? guard.text.slice(0, guard.offset) : "";
  if (now > guard.expiresAt) return { send: buffered + data, guard: null };
  if (guard.phase === "awaitCommit") {
    if (data !== guard.text) return { send: data, guard: null };
    return { send: data, guard: { ...guard, phase: "suppressDuplicate" as const, expiresAt: now + WINDOW_MS } };
  }
  const remaining = guard.text.slice(guard.offset);
  if (remaining.startsWith(data)) {
    const offset = guard.offset + data.length;
    return offset === guard.text.length ? { send: "", guard: null } : { send: "", guard: { ...guard, offset } };
  }
  if (data.startsWith(remaining)) return { send: data.slice(remaining.length), guard: null };
  return { send: buffered + data, guard: null };
}

export function flushImeGuard(guard: ImeGuard | null) {
  return guard?.phase === "suppressDuplicate" ? guard.text.slice(0, guard.offset) : "";
}
