import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({
  Scene: class Scene {},
  Math: {
    Between: vi.fn(() => 900),
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    Linear: (from: number, to: number, progress: number) => from + (to - from) * progress,
    Easing: { Sine: { InOut: (value: number) => value } },
    RND: { frac: vi.fn(() => 0) },
  },
}));

import { CatRoomScene } from "./CatRoomScene";
import * as Phaser from "phaser";

interface SceneInternals {
  cat: {
    anims: { currentAnim?: { key: string } };
    body: { setAllowGravity: ReturnType<typeof vi.fn> };
    play: ReturnType<typeof vi.fn>;
    x: number;
    setDepth: ReturnType<typeof vi.fn>;
    setFlipX: ReturnType<typeof vi.fn>;
    setScale: ReturnType<typeof vi.fn>;
    setX: ReturnType<typeof vi.fn>;
    setY: ReturnType<typeof vi.fn>;
    setVelocity: ReturnType<typeof vi.fn>;
    setVelocityX: ReturnType<typeof vi.fn>;
  };
  scriptedJump?: object;
  routine: string;
  routineHoldUntil: number;
  manualInteractUntil: number;
  manualInteractAction: string;
  pendingInteractionCount: number;
  acceptsInteractions: boolean;
  foregroundTransitionStartedAt: number;
  currentZone: string;
  activeIntent?: { kind: string; dwellMs: number };
  planner: {
    recordPlantTouch: ReturnType<typeof vi.fn>;
    recordIntentCompleted: ReturnType<typeof vi.fn>;
  };
  plantLeaf?: { angle: number; setAngle: ReturnType<typeof vi.fn> };
  plantTouchStartedAt: number;
  plantTouchCooldownStarted: boolean;
  sessionStartedAt: number;
  temperament: "AFFECTIONATE";
  time: { now: number };
  tweens: { killTweensOf: ReturnType<typeof vi.fn> };
  playCatAction: ReturnType<typeof vi.fn>;
  onInteract: ReturnType<typeof vi.fn>;
  updatePurposefulRoutine: (time: number) => void;
  moveTowardTarget: ReturnType<typeof vi.fn>;
}

function createCat(x = 320): SceneInternals["cat"] {
  return {
    anims: {},
    body: { setAllowGravity: vi.fn() },
    play: vi.fn(),
    x,
    setDepth: vi.fn(),
    setFlipX: vi.fn(),
    setScale: vi.fn(),
    setX: vi.fn(),
    setY: vi.fn(),
    setVelocity: vi.fn(),
    setVelocityX: vi.fn(),
  };
}

afterEach(() => {
  vi.mocked(Phaser.Math.RND.frac).mockReturnValue(0);
});

describe("CatRoomScene interactions", () => {
  it("cancels a scripted jump before responding in place", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(347);
    internals.scriptedJump = {};
    internals.routine = "perchWindowBench";
    internals.routineHoldUntil = 0;
    internals.manualInteractUntil = 0;
    internals.currentZone = "window-bench";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    const durationMs = scene.interact();

    expect(internals.scriptedJump).toBeUndefined();
    expect(internals.cat.x).toBe(347);
    expect(internals.cat.body.setAllowGravity).toHaveBeenCalledWith(false);
    expect(internals.cat.setY).toHaveBeenCalledWith(225);
    expect(internals.currentZone).toBe("floor");
    expect(internals.routine).toBe("floorPause");
    expect(internals.routineHoldUntil).toBeGreaterThan(1000);
    expect(internals.manualInteractUntil).toBe(2700);
    expect(internals.cat.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(internals.playCatAction).toHaveBeenCalledWith("interact", true);
    expect(internals.onInteract).toHaveBeenCalledWith("我在呢。");
    expect(internals.onInteract).toHaveBeenCalledTimes(1);
    expect(durationMs).toBe(1_700);
  });

  it("moves a waking sleep response into the floor pause routine", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat();
    internals.routine = "floorSleep";
    internals.routineHoldUntil = 10_000;
    internals.manualInteractUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.routine).toBe("floorPause");
    expect(internals.routineHoldUntil).toBe(1900);
    expect(internals.manualInteractAction).toBe("stretch");
    expect(internals.manualInteractUntil).toBe(2400);
  });

  it("uses the brief existing-frame response when a full acknowledgement is not selected", () => {
    vi.mocked(Phaser.Math.RND.frac).mockReturnValue(0.9);
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat();
    internals.routine = "floorPause";
    internals.routineHoldUntil = 0;
    internals.manualInteractUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    expect(scene.interact()).toBe(700);
    expect(internals.manualInteractAction).toBe("interact-brief");
    expect(internals.cat.play).toHaveBeenCalledWith("cat-interact-brief-anim", false);
    expect(internals.manualInteractUntil).toBe(1700);
  });

  it("faces the touch before playing an in-place acknowledgement", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "floorPause";
    internals.routineHoldUntil = 0;
    internals.manualInteractUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact(250);
    expect(internals.cat.setFlipX).toHaveBeenLastCalledWith(true);

    scene.interact(390);
    expect(internals.cat.setFlipX).toHaveBeenLastCalledWith(false);
  });

  it("plays the dedicated sleep twitch without waking", () => {
    vi.mocked(Phaser.Math.RND.frac).mockReturnValue(0.5);
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat();
    internals.routine = "floorSleep";
    internals.routineHoldUntil = 10_000;
    internals.manualInteractUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.routine).toBe("floorSleep");
    expect(internals.manualInteractAction).toBe("sleep-touch");
    expect(internals.cat.play).toHaveBeenCalledWith("cat-sleep-touch-anim", false);
    expect(internals.manualInteractUntil).toBe(1900);
  });

  it("owns queued interaction timing inside the scene", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat();
    internals.routine = "floorPause";
    internals.routineHoldUntil = 0;
    internals.manualInteractUntil = 0;
    internals.pendingInteractionCount = 0;
    internals.acceptsInteractions = false;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    expect(scene.enqueueInteractions(2)).toBe(false);
    expect(internals.pendingInteractionCount).toBe(0);

    internals.acceptsInteractions = true;
    expect(scene.enqueueInteractions(2)).toBe(true);
    scene.update(1000);
    expect(internals.pendingInteractionCount).toBe(1);

    scene.update(2000);
    expect(internals.pendingInteractionCount).toBe(1);

    internals.time.now = 2700;
    scene.update(2700);
    expect(internals.pendingInteractionCount).toBe(0);
    expect(internals.manualInteractUntil).toBe(4400);
  });

  it("approaches the foreground and returns to floor scale and depth", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(412);
    internals.routine = "approachUser";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    internals.updatePurposefulRoutine(1000);
    expect(internals.routine).toBe("approachForeground");

    internals.updatePurposefulRoutine(1760);
    expect(internals.cat.setY).toHaveBeenLastCalledWith(270);
    expect(internals.cat.setScale).toHaveBeenLastCalledWith(1.18);
    expect(internals.cat.setDepth).toHaveBeenLastCalledWith(7);
    expect(internals.routine).toBe("acknowledgeUser");

    internals.updatePurposefulRoutine(internals.routineHoldUntil);
    expect(internals.routine).toBe("returnFromForeground");
    internals.updatePurposefulRoutine(internals.routineHoldUntil + 760);
    expect(internals.cat.setY).toHaveBeenLastCalledWith(225);
    expect(internals.cat.setScale).toHaveBeenLastCalledWith(1);
    expect(internals.cat.setDepth).toHaveBeenLastCalledWith(5);
    expect(internals.routine).toBe("floorPause");
  });

  it("runs plant touch through observation, contact, leaf response, and recovery", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(458);
    internals.routine = "approachPlantTouch";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.activeIntent = { kind: "plant-touch", dwellMs: 3_400 };
    internals.planner = {
      recordPlantTouch: vi.fn(),
      recordIntentCompleted: vi.fn(),
    };
    internals.plantTouchStartedAt = 0;
    internals.plantTouchCooldownStarted = false;
    internals.sessionStartedAt = 100;
    internals.plantLeaf = { angle: 0, setAngle: vi.fn() };
    internals.moveTowardTarget = vi.fn(() => true);
    internals.playCatAction = vi.fn();

    internals.updatePurposefulRoutine(1_000);
    expect(internals.routine).toBe("observePlantTouch");
    expect(internals.plantTouchStartedAt).toBe(1_000);
    expect(internals.routineHoldUntil).toBe(4_400);
    expect(internals.currentZone).toBe("plant");
    expect(internals.planner.recordPlantTouch).not.toHaveBeenCalled();
    expect(internals.playCatAction).toHaveBeenLastCalledWith("idle", true);

    internals.updatePurposefulRoutine(1_700);
    expect(internals.routine).toBe("observePlantTouch");
    expect(internals.playCatAction).not.toHaveBeenCalledWith("interact", true);
    expect(internals.plantLeaf.setAngle).toHaveBeenLastCalledWith(0);

    internals.updatePurposefulRoutine(1_800);
    expect(internals.routine).toBe("touchPlant");
    expect(internals.planner.recordPlantTouch).toHaveBeenCalledWith(1_700);
    expect(internals.playCatAction).toHaveBeenLastCalledWith("interact", true);

    internals.updatePurposefulRoutine(2_200);
    expect(internals.routine).toBe("watchPlantSway");
    expect(internals.playCatAction).toHaveBeenLastCalledWith("idle", true);

    internals.updatePurposefulRoutine(2_300);
    expect(internals.plantLeaf.setAngle.mock.calls.at(-1)?.[0]).not.toBe(0);

    internals.updatePurposefulRoutine(3_400);
    expect(internals.routine).toBe("settlePlantTouch");
    expect(internals.plantLeaf.setAngle).toHaveBeenLastCalledWith(0);

    internals.updatePurposefulRoutine(4_400);
    expect(internals.routine).toBe("floorPause");
    expect(internals.planner.recordIntentCompleted).toHaveBeenCalledWith("plant-touch");
  });

  it("cancels plant touch, restores the leaf, and responds immediately to touch", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(458);
    internals.routine = "observePlantTouch";
    internals.routineHoldUntil = 4_000;
    internals.manualInteractUntil = 0;
    internals.currentZone = "plant";
    internals.activeIntent = { kind: "plant-touch", dwellMs: 3_000 };
    internals.planner = {
      recordPlantTouch: vi.fn(),
      recordIntentCompleted: vi.fn(),
    };
    internals.plantTouchStartedAt = 1_000;
    internals.plantTouchCooldownStarted = false;
    internals.sessionStartedAt = 0;
    internals.plantLeaf = { angle: 7, setAngle: vi.fn() };
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 2_000 };
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.plantLeaf.setAngle).toHaveBeenCalledWith(0);
    expect(internals.routine).toBe("floorPause");
    expect(internals.currentZone).toBe("floor");
    expect(internals.activeIntent).toBeUndefined();
    expect(internals.planner.recordPlantTouch).toHaveBeenCalledWith(2_000);
    expect(internals.planner.recordIntentCompleted).not.toHaveBeenCalled();
    expect(internals.playCatAction).toHaveBeenCalledWith("interact", true);
  });
});
