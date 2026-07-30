import { describe, expect, it, vi } from "vitest";
import { flushPendingInteractions } from "./pendingInteractions";

describe("pending scene interactions", () => {
  it("replays every interaction queued before scene readiness", () => {
    const interact = vi.fn();

    const pending = flushPendingInteractions(3, false, interact);
    expect(pending).toBe(3);
    expect(interact).not.toHaveBeenCalled();

    expect(flushPendingInteractions(pending, true, interact)).toBe(0);
    expect(interact).toHaveBeenCalledTimes(3);
  });
});
