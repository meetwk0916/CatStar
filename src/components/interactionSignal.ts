export function deliverInteractionSignal(
  lastAcceptedSignal: number,
  nextSignal: number,
  enqueue: (count: number) => boolean,
): number {
  const pendingCount = Math.max(0, nextSignal - lastAcceptedSignal);
  if (pendingCount === 0) {
    return lastAcceptedSignal;
  }
  return enqueue(pendingCount) ? nextSignal : lastAcceptedSignal;
}
