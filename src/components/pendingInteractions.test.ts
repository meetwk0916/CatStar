import { afterEach, describe, expect, it, vi } from "vitest";
import { PendingInteractionQueue } from "./pendingInteractions";

afterEach(() => {
  vi.useRealTimers();
});

describe("pending scene interactions", () => {
  it("replays every interaction queued before scene readiness", () => {
    vi.useFakeTimers();
    const queue = new PendingInteractionQueue();
    const interact = vi.fn(() => 1_400);

    queue.enqueue(3);
    queue.flush(false, interact);
    expect(queue.size).toBe(3);
    expect(interact).not.toHaveBeenCalled();

    queue.flush(true, interact);
    expect(interact).toHaveBeenCalledTimes(1);
    expect(queue.size).toBe(2);

    vi.advanceTimersByTime(1_399);
    expect(interact).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(interact).toHaveBeenCalledTimes(2);
    expect(queue.size).toBe(1);

    vi.advanceTimersByTime(1_400);
    expect(interact).toHaveBeenCalledTimes(3);
    expect(queue.size).toBe(0);
    queue.pause();
  });
});
