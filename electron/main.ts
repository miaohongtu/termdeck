import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import * as pty from "node-pty";

type TerminalSpec = { id: string; title: string; cwd: string; restoreCommand: string; frame?: { x: number; y: number; width: number; height: number } };
type Workspace = { id: string; name: string; terminals: TerminalSpec[] };
const sessions = new Map<string, pty.IPty>();
let win: BrowserWindow | null = null;
const stateFile = () => path.join(app.getPath("userData"), "workspaces.json");
const defaults = (): Workspace[] => [{ id: "default", name: "开发现场", terminals: [{ id: "welcome", title: "Shell", cwd: os.homedir(), restoreCommand: "" }] }];

function readState(): Workspace[] {
  try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return defaults(); }
}
function saveState(value: Workspace[]) {
  fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
  fs.writeFileSync(stateFile(), JSON.stringify(value, null, 2));
}
function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 900, minHeight: 600, titleBarStyle: "hiddenInset", backgroundColor: "#f6f7f9", webPreferences: { preload: path.join(__dirname, "preload.js") } });
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on("before-quit", () => sessions.forEach(session => session.kill()));

ipcMain.handle("state:load", () => readState());
ipcMain.handle("state:save", (_event, value: Workspace[]) => saveState(value));
ipcMain.handle("system:home", () => os.homedir());
ipcMain.handle("terminal:start", (_event, spec: TerminalSpec) => {
  sessions.get(spec.id)?.kill();
  const cwd = fs.existsSync(spec.cwd) ? spec.cwd : os.homedir();
  const shell = process.env.SHELL || "/bin/zsh";
  const session = pty.spawn(shell, ["-l"], { name: "xterm-256color", cols: 100, rows: 30, cwd, env: process.env as Record<string, string> });
  sessions.set(spec.id, session);
  session.onData(data => win?.webContents.send("terminal:data", spec.id, data));
  if (spec.restoreCommand.trim()) session.write(`${spec.restoreCommand}\r`);
  return true;
});
ipcMain.on("terminal:input", (_event, id: string, data: string) => sessions.get(id)?.write(data));
ipcMain.on("terminal:resize", (_event, id: string, cols: number, rows: number) => sessions.get(id)?.resize(cols, rows));
ipcMain.on("terminal:stop", (_event, id: string) => { sessions.get(id)?.kill(); sessions.delete(id); });
