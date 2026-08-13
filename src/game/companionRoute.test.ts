import { describe, expect, it } from "vitest";
import {
  createCompanionRouteExecutor,
  type CompanionRouteFrame,
  type CompanionRoutePose,
} from "./companionRoute";

const initialPose = (x = 320, y = 225): CompanionRoutePose => ({
  x,
  y,
  scale: 1,
  depth: 5,
  facingLeft: false,
  velocityX: 0,
  velocityY: 0,
});

function applyFrame(pose: CompanionRoutePose, frame: CompanionRouteFrame, elapsedMs: number) {
  pose.x += pose.velocityX * (elapsedMs / 1_000);
  pose.y += pose.velocityY * (elapsedMs / 1_000);
  pose.velocityX = frame.velocityX;
  pose.velocityY = frame.velocityY;
  pose.facingLeft = frame.facingLeft;
  if (frame.y !== undefined) pose.y = frame.y;
  if (frame.scale !== undefined) pose.scale = frame.scale;
  if (frame.depth !== undefined) pose.depth = frame.depth;
}

function runUntil(
  executor: ReturnType<typeof createCompanionRouteExecutor>,
  pose: CompanionRoutePose,
  phase: CompanionRouteFrame["phase"],
) {
  let previousTime = 1_000;
  for (let time = 1_000; time <= 22_000; time += 16) {
    const frame = executor.advance(time, pose);
    if (!frame) continue;
    applyFrame(pose, frame, time - previousTime);
    previousTime = time;
    if (frame.phase === phase) return { frame, time };
  }
  throw new Error(`Route never reached ${phase}`);
}

describe("companion route executor", () => {
  it("executes the named floor-to-food-bowl route behind a renderer-neutral interface", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose();
    expect(executor.start("floor-to-food-bowl", { pose })).toBe("started");

    const result = runUntil(executor, pose, "arrived");

    expect(result.frame.route).toBe("floor-to-food-bowl");
    expect(Math.hypot(pose.x - 471, pose.y - 259)).toBeLessThanOrEqual(4);
  });

  it("curves through authored waypoints and decelerates before stable contact", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose();
    executor.start("floor-to-food-bowl", { pose });

    const first = executor.advance(1_000, pose);
    expect(first?.phase).toBe("cruise");
    expect(Math.abs(first?.velocityY ?? 0)).toBeGreaterThan(0);
    if (first) applyFrame(pose, first, 0);

    const arrival = runUntil(executor, pose, "arrival");
    const arrivalSpeed = Math.hypot(arrival.frame.velocityX, arrival.frame.velocityY);
    const later = executor.advance(arrival.time + 100, pose);
    expect(later?.phase).toBe("arrival");
    expect(Math.hypot(later?.velocityX ?? 0, later?.velocityY ?? 0)).toBeLessThan(arrivalSpeed);

    const contact = runUntil(executor, pose, "contact");
    expect(executor.advance(contact.time + 149, pose)?.phase).toBe("contact");
    expect(executor.advance(contact.time + 150, pose)?.phase).toBe("arrived");
  });

  it("cancels from the rendered pose and never resumes", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose(410, 250);
    executor.start("floor-to-food-bowl", { pose });

    expect(executor.cancel(1_000, pose)?.phase).toBe("cancelling");
    const halfway = executor.advance(1_100, pose);
    expect(halfway?.y).toBeGreaterThan(225);
    expect(halfway?.y).toBeLessThan(250);
    const settled = executor.advance(1_200, pose);
    expect(settled).toMatchObject({ phase: "cancelled", y: 225 });
    expect(executor.advance(1_201, pose)).toBeNull();
  });

  it("rejects overlap until cancellation settles", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose();
    expect(executor.start("floor-to-food-bowl", { pose })).toBe("started");
    expect(executor.start("floor-to-food-bowl", { pose })).toBe("rejected-active");
    executor.cancel(1_000, pose);
    expect(executor.start("floor-to-food-bowl", { pose })).toBe("rejected-active");
    executor.advance(1_200, pose);
    expect(executor.start("floor-to-food-bowl", { pose })).toBe("started");
  });

  it("keeps the approach heading when starting right of the bowl", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose(540);
    executor.start("floor-to-food-bowl", { pose });
    expect(runUntil(executor, pose, "arrived").frame.facingLeft).toBe(true);
  });

  it("skips outbound waypoints that the cat has already passed", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose(458);
    executor.start("floor-to-food-bowl", { pose });
    const first = executor.advance(1_000, pose);
    expect(first?.velocityX).toBeGreaterThanOrEqual(0);
  });

  it("owns the bowl-to-floor return geometry and completion", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose(471, 259);
    executor.start("food-bowl-to-floor", { pose });
    const first = executor.advance(1_000, pose);
    expect(first?.velocityX).toBeLessThan(0);
    expect(runUntil(executor, pose, "arrived").frame.route).toBe("food-bowl-to-floor");
    expect(Math.abs(pose.y - 225)).toBeLessThanOrEqual(4);
  });

  it.each([
    ["floor-to-plant-inspect", 458],
    ["floor-to-plant-touch", 462],
  ] as const)("owns the %s approach geometry and stable arrival", (route, destinationX) => {
    const executor = createCompanionRouteExecutor("CURIOUS");
    const pose = initialPose(300);
    executor.start(route, { pose });

    const first = executor.advance(1_000, pose);
    expect(first).toMatchObject({ route, phase: "cruise" });
    expect(Math.abs(first?.velocityY ?? 0)).toBeGreaterThan(0);

    const result = runUntil(executor, pose, "arrived");
    expect(result.frame.route).toBe(route);
    expect(Math.hypot(pose.x - destinationX, pose.y - 225)).toBeLessThanOrEqual(4);
  });

  it("cancels a plant route at the current rendered pose without resuming it", () => {
    const executor = createCompanionRouteExecutor("CURIOUS");
    const pose = initialPose(420, 229);
    executor.start("floor-to-plant-touch", { pose });

    expect(executor.cancel(1_000, pose)).toMatchObject({
      route: "floor-to-plant-touch",
      phase: "cancelling",
    });
    expect(executor.advance(1_200, pose)).toMatchObject({ phase: "cancelled", y: 225 });
    expect(executor.advance(1_201, pose)).toBeNull();
  });

  it("owns the foreground approach, perspective transition, and stable contact", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = initialPose(320);
    executor.start("floor-to-foreground", { pose });

    const transition = runUntil(executor, pose, "transition");
    expect(transition.frame).toMatchObject({
      route: "floor-to-foreground",
      velocityX: 0,
      velocityY: 0,
    });

    const arrived = runUntil(executor, pose, "arrived");
    expect(arrived.frame.route).toBe("floor-to-foreground");
    expect(pose.y).toBe(270);
    expect(pose.scale).toBe(1.18);
    expect(pose.depth).toBe(7);
  });

  it("returns from the foreground and cancels back to the room pose", () => {
    const executor = createCompanionRouteExecutor("AFFECTIONATE");
    const pose = { ...initialPose(412, 270), scale: 1.18, depth: 7 };
    executor.start("foreground-to-floor", { pose });
    runUntil(executor, pose, "transition");

    const cancelled = executor.cancel(1_200, pose);
    expect(cancelled).toMatchObject({ route: "foreground-to-floor", phase: "cancelling" });
    const settled = executor.advance(1_400, pose);
    expect(settled).toMatchObject({ phase: "cancelled", y: 225, scale: 1, depth: 5 });
    expect(executor.advance(1_401, pose)).toBeNull();
  });
});
