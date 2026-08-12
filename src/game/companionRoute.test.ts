import { describe, expect, it } from "vitest";
import {
  createCompanionRouteExecutor,
  type CompanionRouteFrame,
  type CompanionRoutePose,
} from "./companionRoute";

const initialPose = (x = 320, y = 225): CompanionRoutePose => ({
  x,
  y,
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
});
