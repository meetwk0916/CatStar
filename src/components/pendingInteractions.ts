export function flushPendingInteractions(
  pendingCount: number,
  ready: boolean,
  interact: () => void,
): number {
  if (!ready) {
    return pendingCount;
  }

  for (let index = 0; index < pendingCount; index += 1) {
    interact();
  }
  return 0;
}
