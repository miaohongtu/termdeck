import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { TerminalSpec } from "./types";
import { shouldFollowOutput } from "./terminalBehavior";

export default function TerminalView({ spec }: { spec: TerminalSpec }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'SFMono-Regular', Menlo, monospace",
      fontSize: 13,
      scrollback: 10_000,
      scrollOnUserInput: true,
      smoothScrollDuration: 80,
      theme: {
        background: "#ffffff",
        foreground: "#202124",
        cursor: "#6d5bd0",
        selectionBackground: "#dcd6fa",
        black: "#202124",
        red: "#d93025",
        green: "#188038",
        yellow: "#b06000",
        blue: "#1967d2",
        magenta: "#8430a8",
        cyan: "#007b83",
        white: "#f1f3f4",
        brightBlack: "#5f6368",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host.current!);
    fit.fit();
    const disposeData = window.termdeck.onData((id, data) => {
      if (id !== spec.id) return;
      const buffer = term.buffer.active;
      const follow = shouldFollowOutput(buffer.viewportY, buffer.baseY);
      term.write(data, () => { if (follow) term.scrollToBottom(); });
    });
    term.onData(data => window.termdeck.input(spec.id, data));
    const resize = () => {
      fit.fit();
      window.termdeck.resize(spec.id, term.cols, term.rows);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host.current!);
    window.termdeck.start(spec).then(resize);
    return () => {
      observer.disconnect();
      disposeData();
      window.termdeck.stop(spec.id);
      term.dispose();
    };
  }, [spec.id]);
  return <div className="terminal-host" ref={host} />;
}
