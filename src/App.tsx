import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import TerminalView from "./TerminalView";
import type { Frame, TerminalSpec, Workspace } from "./types";
import { magnetizeAxis, type MagnetLock } from "./snap";
import { resizeFrameWithMagnet, type ResizeEdge } from "./resizeFrame";
import { isRelativeFrame, toPercentStyle, toPixelFrame, toRelativeFrame, type Viewport } from "./layout";

const defaultFrame = (index: number): Frame => ({
  x: 0.018 + (index % 3) * 0.026,
  y: 0.028 + (index % 3) * 0.04,
  width: 0.46,
  height: 0.44,
});

function TerminalTile({ spec, index, viewport, otherFrames, onFrame, onRemove, onFocus, zIndex }: {
  spec: TerminalSpec; index: number; zIndex: number;
  viewport: Viewport; otherFrames: Frame[]; onFrame: (frame: Frame) => void; onRemove: () => void; onFocus: () => void;
}) {
  const [snapped, setSnapped] = useState({ x: false, y: false });
  const relativeFrame = spec.frame ?? defaultFrame(index);
  const frame = toPixelFrame(relativeFrame, viewport);

  const beginDrag = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus();
    const origin = { x: event.clientX, y: event.clientY, frame };
    const xCandidates = [0, window.innerWidth - frame.width];
    const yCandidates = [0, window.innerHeight - frame.height];
    for (const other of otherFrames) {
      xCandidates.push(other.x, other.x + other.width - frame.width, other.x + other.width, other.x - frame.width);
      yCandidates.push(other.y, other.y + other.height - frame.height, other.y + other.height, other.y - frame.height);
    }
    let xLock: MagnetLock | null = null;
    let yLock: MagnetLock | null = null;
    const move = (next: PointerEvent) => {
      const rawX = Math.max(0, origin.frame.x + next.clientX - origin.x);
      const rawY = Math.max(0, origin.frame.y + next.clientY - origin.y);
      const xResult = magnetizeAxis(rawX, next.clientX, xCandidates, xLock);
      const yResult = magnetizeAxis(rawY, next.clientY, yCandidates, yLock);
      xLock = xResult.lock;
      yLock = yResult.lock;
      setSnapped({ x: Boolean(xLock), y: Boolean(yLock) });
      onFrame({ ...origin.frame, x: xResult.position, y: yResult.position });
    };
    const stop = () => { setSnapped({ x: false, y: false }); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const beginResize = (edge: ResizeEdge, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus();
    const origin = { x: event.clientX, y: event.clientY, frame };
    const xCandidates = [0, window.innerWidth];
    const yCandidates = [0, window.innerHeight];
    for (const other of otherFrames) {
      xCandidates.push(other.x, other.x + other.width);
      yCandidates.push(other.y, other.y + other.height);
    }
    let xLock: MagnetLock | null = null;
    let yLock: MagnetLock | null = null;
    const move = (next: PointerEvent) => {
      const result = resizeFrameWithMagnet(origin.frame, edge, next.clientX - origin.x, next.clientY - origin.y, next.clientX, next.clientY, xCandidates, yCandidates, xLock, yLock);
      xLock = result.xLock;
      yLock = result.yLock;
      setSnapped({ x: Boolean(xLock), y: Boolean(yLock) });
      onFrame(result.frame);
    };
    const stop = () => { setSnapped({ x: false, y: false }); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <article className={`terminal-tile ${snapped.x ? "snap-x" : ""} ${snapped.y ? "snap-y" : ""}`} onPointerDown={onFocus} style={{ ...toPercentStyle(relativeFrame), zIndex }}>
      <div className="drag-handle" onPointerDown={beginDrag}>
        <button className="close-terminal" onPointerDown={event => event.stopPropagation()} onClick={onRemove} aria-label="关闭终端">×</button><span>{spec.title}</span><code>{spec.cwd}</code>
      </div>
      <TerminalView spec={spec} />
      {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeEdge[]).map(edge => <i key={edge} className={`resize-handle resize-${edge}`} onPointerDown={event => beginResize(edge, event)} />)}
    </article>
  );
}

export default function App() {
  const [spaces, setSpaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState("");
  const [front, setFront] = useState<string[]>([]);
  const [home, setHome] = useState("");
  const [viewport, setViewport] = useState<Viewport>(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);
  useEffect(() => { Promise.all([window.termdeck.load(), window.termdeck.home()]).then(([data, homeDirectory]) => {
    const migrated = data.map(space => ({ ...space, terminals: space.terminals.map((terminal, index) => ({ ...terminal, frame: terminal.frame ? (isRelativeFrame(terminal.frame) ? terminal.frame : toRelativeFrame(terminal.frame, viewport)) : defaultFrame(index) })) }));
    setSpaces(migrated); setActive(migrated[0]?.id ?? ""); setHome(homeDirectory); setReady(true);
  }); }, []);
  useEffect(() => { if (ready) window.termdeck.save(spaces); }, [spaces, ready]);
  const current = spaces.find(space => space.id === active);
  const updateTerminal = (id: string, frame: Frame) => setSpaces(value => value.map(space => space.id === active ? { ...space, terminals: space.terminals.map(term => term.id === id ? { ...term, frame: toRelativeFrame(frame, viewport) } : term) } : space));
  const focus = (id: string) => setFront(value => [...value.filter(item => item !== id), id]);
  const addWorkspace = () => {
    const item: Workspace = { id: uuid(), name: `工作区 ${spaces.length + 1}`, terminals: [] };
    setSpaces(value => [...value, item]);
    setActive(item.id);
  };
  const addTerminal = () => {
    if (!current) return;
    const cwd = current.terminals[0]?.cwd ?? home;
    const terminal: TerminalSpec = { id: uuid(), title: `Shell ${current.terminals.length + 1}`, cwd, restoreCommand: "", frame: defaultFrame(current.terminals.length) };
    setSpaces(value => value.map(space => space.id === active ? { ...space, terminals: [...space.terminals, terminal] } : space));
    focus(terminal.id);
  };
  const removeTerminal = (id: string) => setSpaces(value => value.map(space => space.id === active ? { ...space, terminals: space.terminals.filter(term => term.id !== id) } : space));
  if (!ready) return <div className="loading" />;
  return (
    <main className="canvas">
      <div className="window-drag-region" />
      {current?.terminals.map((terminal, index) => <TerminalTile key={terminal.id} spec={terminal} index={index} viewport={viewport} otherFrames={current.terminals.filter(item => item.id !== terminal.id).map((item, otherIndex) => toPixelFrame(item.frame ?? defaultFrame(otherIndex), viewport))} onFrame={frame => updateTerminal(terminal.id, frame)} onRemove={() => removeTerminal(terminal.id)} onFocus={() => focus(terminal.id)} zIndex={10 + front.indexOf(terminal.id)} />)}
      {current?.terminals.length === 0 && <button className="first-terminal" onClick={addTerminal}><b>＋</b><span>新建终端</span></button>}
      <nav className="workspace-dock">
        {spaces.map(space => <button key={space.id} className={space.id === active ? "active" : ""} onClick={() => setActive(space.id)}>{space.name}</button>)}
        <i />
        <button onClick={addWorkspace} title="新建工作区">＋ 工作区</button>
        <button className="add-terminal" onClick={addTerminal}>＋ 终端</button>
      </nav>
    </main>
  );
}
