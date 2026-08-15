import type { Frame } from "./types.ts";

export type Viewport = { width: number; height: number };

export function isRelativeFrame(frame: Frame) {
  return frame.width <= 1 && frame.height <= 1;
}

export function toRelativeFrame(frame: Frame, viewport: Viewport): Frame {
  return {
    x: frame.x / viewport.width,
    y: frame.y / viewport.height,
    width: frame.width / viewport.width,
    height: frame.height / viewport.height,
  };
}

export function toPixelFrame(frame: Frame, viewport: Viewport): Frame {
  if (!isRelativeFrame(frame)) return frame;
  return {
    x: Math.round(frame.x * viewport.width),
    y: Math.round(frame.y * viewport.height),
    width: Math.round(frame.width * viewport.width),
    height: Math.round(frame.height * viewport.height),
  };
}

export function toPercentStyle(frame: Frame) {
  return {
    left: `${frame.x * 100}%`,
    top: `${frame.y * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  };
}
