import { describe, expect, it } from "vitest";
import { createCompanionRouteExecutor } from "./companionRoute";

describe("companion route executor", () => {
  const createExecutor = () => createCompanionRouteExecutor("AFFECTIONATE");

  it("executes the named floor-to-food-bowl route without exposing route details", () => {
    const executor = createExecutor();

    expect(
      executor.start("floor-to-food-bowl", {
        pose: { x: 320, y: 225, facingLeft: false },
        startedAt: 1_000,
      }),
    ).toBe("started");

    expect(executor.advance(1_000)).toEqual({
      phase: "cruise",
      pose: { x: 320, y: 225, facingLeft: false },
    });
    expect(executor.advance(3_460)).toEqual({
      phase: "arrived",
      pose: { x: 471, y: 259, facingLeft: false },
    });
  });

  it("preserves the authored arrival and stable-contact handoff", () => {
    const executor = createExecutor();
    executor.start("floor-to-food-bowl", {
      pose: { x: 320, y: 225, facingLeft: false },
      startedAt: 1_000,
    });

    const arrival = executor.advance(3_208);
    expect(arrival?.phase).toBe("arrival");
    expect(arrival?.pose.x).toBeCloseTo(460.455_844, 6);
    expect(arrival?.pose.y).toBeCloseTo(249.041_631, 6);

    expect(executor.advance(3_309)).toEqual({
      phase: "contact",
      pose: { x: 471, y: 259, facingLeft: false },
    });
    expect(executor.advance(3_458)).toEqual({
      phase: "contact",
      pose: { x: 471, y: 259, facingLeft: false },
    });
    expect(executor.advance(3_459)?.phase).toBe("arrived");
  });

  it("cancels before the first movement frame and never resumes the route", () => {
    const executor = createExecutor();
    executor.start("floor-to-food-bowl", {
      pose: { x: 320, y: 225, facingLeft: false },
      startedAt: 1_000,
    });

    expect(executor.cancel(1_000, { x: 320, y: 225, facingLeft: false })).toEqual({
      phase: "cancelling",
      pose: { x: 320, y: 225, facingLeft: false },
    });
    expect(executor.advance(1_200)).toEqual({
      phase: "cancelled",
      pose: { x: 320, y: 225, facingLeft: false },
    });
    expect(executor.advance(1_201)).toBeNull();
  });

  it("rejects a new route until cancellation has finished", () => {
    const executor = createExecutor();
    const start = (startedAt: number) =>
      executor.start("floor-to-food-bowl", {
        pose: { x: 320, y: 225, facingLeft: false },
        startedAt,
      });

    expect(start(1_000)).toBe("started");
    executor.cancel(1_100, { x: 320, y: 225, facingLeft: false });
    expect(start(1_100)).toBe("rejected-active");
    executor.advance(1_300);
    expect(start(1_301)).toBe("started");
  });

  it("settles from the rendered pose when touch interrupts arrival", () => {
    const executor = createExecutor();
    executor.start("floor-to-food-bowl", {
      pose: { x: 320, y: 225, facingLeft: false },
      startedAt: 1_000,
    });

    expect(executor.cancel(2_000, { x: 410, y: 250, facingLeft: false })).toEqual({
      phase: "cancelling",
      pose: { x: 410, y: 250, facingLeft: false },
    });
    const settling = executor.advance(2_100);
    expect(settling?.phase).toBe("cancelling");
    expect(settling?.pose.y).toBeGreaterThan(225);
    expect(settling?.pose.y).toBeLessThan(250);
    expect(executor.advance(2_200)).toEqual({
      phase: "cancelled",
      pose: { x: 410, y: 225, facingLeft: false },
    });
  });

  it("keeps the approach heading when starting to the right of the food bowl", () => {
    const executor = createExecutor();
    executor.start("floor-to-food-bowl", {
      pose: { x: 540, y: 225, facingLeft: false },
      startedAt: 1_000,
    });

    expect(executor.advance(1_000)?.pose.facingLeft).toBe(true);
    expect(executor.advance(2_251)).toEqual({
      phase: "arrived",
      pose: { x: 471, y: 259, facingLeft: true },
    });
  });

  it("skips an authored waypoint that the cat has already passed", () => {
    const executor = createExecutor();
    executor.start("floor-to-food-bowl", {
      pose: { x: 458, y: 225, facingLeft: false },
      startedAt: 1_000,
    });

    expect(executor.advance(1_000)).toEqual({
      phase: "arrival",
      pose: { x: 458, y: 225, facingLeft: false },
    });
    expect(executor.advance(1_100)?.pose.x).toBeGreaterThanOrEqual(458);
  });
});
