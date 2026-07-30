import { describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({
  Scene: class Scene {},
  Math: { Between: vi.fn(() => 900), RND: { frac: vi.fn(() => 0) } },
}));

import { CatRoomScene } from "./CatRoomScene";

interface SceneInternals {
  cat: {
    angle: number;
    body: { setAllowGravity: ReturnType<typeof vi.fn> };
    x: number;
    setY: ReturnType<typeof vi.fn>;
    setVelocity: ReturnType<typeof vi.fn>;
  };
  scriptedJump?: object;
  routine: string;
  routineHoldUntil: number;
  manualInteractUntil: number;
  manualInteractAction: string;
  currentZone: string;
  temperament: "AFFECTIONATE";
  time: { now: number };
  tweens: { add: ReturnType<typeof vi.fn>; killTweensOf: ReturnType<typeof vi.fn> };
  playCatAction: ReturnType<typeof vi.fn>;
  onInteract: ReturnType<typeof vi.fn>;
}

describe("CatRoomScene interactions", () => {
  it("cancels a scripted jump before responding in place", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = {
      angle: 0,
      body: { setAllowGravity: vi.fn() },
      x: 347,
      setY: vi.fn(),
      setVelocity: vi.fn(),
    };
    internals.scriptedJump = {};
    internals.routine = "perchWindowBench";
    internals.routineHoldUntil = 0;
    internals.manualInteractUntil = 0;
    internals.currentZone = "window-bench";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.scriptedJump).toBeUndefined();
    expect(internals.cat.x).toBe(347);
    expect(internals.cat.body.setAllowGravity).toHaveBeenCalledWith(false);
    expect(internals.cat.setY).toHaveBeenCalledWith(225);
    expect(internals.currentZone).toBe("floor");
    expect(internals.routine).toBe("floorPause");
    expect(internals.routineHoldUntil).toBeGreaterThan(1000);
    expect(internals.manualInteractUntil).toBe(2400);
    expect(internals.cat.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(internals.playCatAction).toHaveBeenCalledWith("interact", true);
    expect(internals.onInteract).toHaveBeenCalledWith("我在呢。");
  });

  it("moves a waking sleep response into the floor pause routine", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = {
      angle: 0,
      body: { setAllowGravity: vi.fn() },
      x: 320,
      setY: vi.fn(),
      setVelocity: vi.fn(),
    };
    internals.routine = "floorSleep";
    internals.routineHoldUntil = 10_000;
    internals.manualInteractUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.routine).toBe("floorPause");
    expect(internals.routineHoldUntil).toBe(1900);
    expect(internals.manualInteractAction).toBe("stretch");
    expect(internals.manualInteractUntil).toBe(2400);
  });
});
