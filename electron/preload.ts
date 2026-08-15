import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("termdeck", {
  load: () => ipcRenderer.invoke("state:load"), save: (value: unknown) => ipcRenderer.invoke("state:save", value),
  home: () => ipcRenderer.invoke("system:home"),
  start: (spec: unknown) => ipcRenderer.invoke("terminal:start", spec), input: (id: string, data: string) => ipcRenderer.send("terminal:input", id, data),
  resize: (id: string, cols: number, rows: number) => ipcRenderer.send("terminal:resize", id, cols, rows), stop: (id: string) => ipcRenderer.send("terminal:stop", id),
  onData: (callback: (id: string, data: string) => void) => { const listener = (_: unknown, id: string, data: string) => callback(id, data); ipcRenderer.on("terminal:data", listener); return () => ipcRenderer.removeListener("terminal:data", listener); }
});
