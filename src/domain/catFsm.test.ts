import { describe, expect, it } from "vitest";
import {
  getActivityRoutine,
  getCompanionReaction,
  getMovementSpeed,
  getNextActivityIndexAfter,
  getRoutineHoldDuration,
} from "./catFsm";

describe("companion routine policy", () => {
  it("gives each personality a meaningful first habit", () => {
    expect(getActivityRoutine("GLUTTON", 0).routine).toBe("approachFoodBowl");
    expect(getActivityRoutine("ALOOFS", 0).routine).toBe("approachCatBed");
    expect(getActivityRoutine("CLINGY", 0).routine).toBe("approachWindowBench");
    expect(getActivityRoutine("ENERGY", 1).routine).toBe("approachPlant");
  });

  it("cycles deterministically without leaking sequence storage into Phaser", () => {
    const first = getActivityRoutine("CLINGY", 0);
    const second = getActivityRoutine("CLINGY", first.nextActivityIndex);
    const wrapped = getActivityRoutine("CLINGY", 6);

    expect(second.routine).toBe("approachBlanket");
    expect(wrapped.routine).toBe(first.routine);
    expect(getNextActivityIndexAfter("GLUTTON", "approachFoodBowl")).toBe(1);
  });

  it("expresses personality in hold time as well as movement speed", () => {
    expect(getRoutineHoldDuration("GLUTTON", "foodBowl", 0)).toBe(6200);
    expect(getRoutineHoldDuration("GLUTTON", "foodBowl", 1)).toBe(8200);
    expect(getRoutineHoldDuration("ALOOFS", "catBed", 0)).toBeGreaterThan(
      getRoutineHoldDuration("ENERGY", "catBed", 0),
    );
    expect(getMovementSpeed("ENERGY")).toBeGreaterThan(getMovementSpeed("ALOOFS"));
  });

  it("selects companion reactions deterministically when requested", () => {
    expect(getCompanionReaction("INTERACTING", 0)).toBe("我听见你啦。");
    expect(getCompanionReaction("INTERACTING", 0.99)).toBe("轻轻摸摸也收到啦。");
  });
});
