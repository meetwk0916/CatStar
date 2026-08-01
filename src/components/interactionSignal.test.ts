import { describe, expect, it, vi } from "vitest";
import { deliverInteractionSignal } from "./interactionSignal";

describe("interaction signal delivery", () => {
  it("retains an unaccepted delta and advances only after delivery", () => {
    const reject = vi.fn(() => false);
    const accept = vi.fn(() => true);

    expect(deliverInteractionSignal(2, 5, reject)).toBe(2);
    expect(reject).toHaveBeenCalledWith(3);
    expect(deliverInteractionSignal(2, 5, accept)).toBe(5);
    expect(accept).toHaveBeenCalledWith(3);
  });
});
