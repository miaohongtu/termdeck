import type { Frame } from "./types.ts";
import { magnetizeAxis, type MagnetLock } from "./snap.ts";

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function resizeFrame(frame: Frame, edge: ResizeEdge, deltaX: number, deltaY: number, minWidth = 320, minHeight = 190): Frame {
  let { x, y, width, height } = frame;
  if (edge.includes("e")) width = Math.max(minWidth, frame.width + deltaX);
  if (edge.includes("s")) height = Math.max(minHeight, frame.height + deltaY);
  if (edge.includes("w")) {
    const nextX = Math.max(0, Math.min(frame.x + deltaX, frame.x + frame.width - minWidth));
    width = frame.width + frame.x - nextX;
    x = nextX;
  }
  if (edge.includes("n")) {
    const nextY = Math.max(0, Math.min(frame.y + deltaY, frame.y + frame.height - minHeight));
    height = frame.height + frame.y - nextY;
    y = nextY;
  }
  return { x, y, width, height };
}

export function resizeFrameWithMagnet(
  origin: Frame,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
  pointerX: number,
  pointerY: number,
  xCandidates: number[],
  yCandidates: number[],
  xLock: MagnetLock | null,
  yLock: MagnetLock | null,
  minWidth = 320,
  minHeight = 190,
) {
  const frame = resizeFrame(origin, edge, deltaX, deltaY, minWidth, minHeight);
  let nextXLock = xLock;
  let nextYLock = yLock;
  if (edge.includes("e")) {
    const result = magnetizeAxis(frame.x + frame.width, pointerX, xCandidates, xLock);
    nextXLock = result.lock;
    if (result.position - frame.x >= minWidth) frame.width = result.position - frame.x;
  } else if (edge.includes("w")) {
    const right = frame.x + frame.width;
    const result = magnetizeAxis(frame.x, pointerX, xCandidates, xLock);
    nextXLock = result.lock;
    if (right - result.position >= minWidth) { frame.x = result.position; frame.width = right - result.position; }
  }
  if (edge.includes("s")) {
    const result = magnetizeAxis(frame.y + frame.height, pointerY, yCandidates, yLock);
    nextYLock = result.lock;
    if (result.position - frame.y >= minHeight) frame.height = result.position - frame.y;
  } else if (edge.includes("n")) {
    const bottom = frame.y + frame.height;
    const result = magnetizeAxis(frame.y, pointerY, yCandidates, yLock);
    nextYLock = result.lock;
    if (bottom - result.position >= minHeight) { frame.y = result.position; frame.height = bottom - result.position; }
  }
  return { frame, xLock: nextXLock, yLock: nextYLock };
}
