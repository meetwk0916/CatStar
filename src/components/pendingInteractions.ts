export class PendingInteractionQueue {
  private pendingCount = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  enqueue(count = 1): void {
    this.pendingCount += Math.max(0, Math.floor(count));
  }

  flush(ready: boolean, interact: () => number): void {
    if (!ready || this.timer !== undefined || this.pendingCount === 0) {
      return;
    }

    this.pendingCount -= 1;
    const durationMs = Math.max(0, interact());
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.flush(ready, interact);
    }, durationMs);
  }

  pause(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  get size(): number {
    return this.pendingCount;
  }
}
