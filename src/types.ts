export type Frame = { x: number; y: number; width: number; height: number };
export type TerminalSpec = { id: string; title: string; cwd: string; restoreCommand: string; frame?: Frame };
export type Workspace = { id: string; name: string; terminals: TerminalSpec[] };
declare global { interface Window { termdeck: { load(): Promise<Workspace[]>; save(value: Workspace[]): Promise<void>; home(): Promise<string>; start(spec: TerminalSpec): Promise<void>; input(id: string, data: string): void; resize(id: string, cols: number, rows: number): void; stop(id: string): void; onData(callback: (id: string, data: string) => void): () => void } } }
