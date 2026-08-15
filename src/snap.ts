export type MagnetLock = { target: number; pointer: number };

export function nearestSnap(value: number, candidates: number[], range = 10) {
  let nearest: number | null = null;
  let distance = range + 1;
  for (const candidate of candidates) {
    const nextDistance = Math.abs(value - candidate);
    if (nextDistance <= range && nextDistance < distance) {
      nearest = candidate;
      distance = nextDistance;
    }
  }
  return nearest;
}

export function magnetizeAxis(
  rawPosition: number,
  pointerPosition: number,
  candidates: number[],
  lock: MagnetLock | null,
  snapRange = 10,
  releaseDistance = 20,
) {
  if (lock && Math.abs(pointerPosition - lock.pointer) <= releaseDistance) {
    return { position: lock.target, lock };
  }
  const target = nearestSnap(rawPosition, candidates, snapRange);
  if (target === null) return { position: rawPosition, lock: null };
  const nextLock = { target, pointer: pointerPosition };
  return { position: target, lock: nextLock };
}
