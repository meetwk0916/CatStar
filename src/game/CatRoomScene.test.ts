import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({
  Scene: class Scene {},
  Math: {
    Between: vi.fn(() => 900),
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    Linear: (from: number, to: number, progress: number) => from + (to - from) * progress,
    Easing: {
      Sine: {
        In: (value: number) => 1 - Math.cos((Math.PI / 2) * value),
        InOut: (value: number) => 0.5 - 0.5 * Math.cos(Math.PI * value),
        Out: (value: number) => value,
      },
    },
    RND: { frac: vi.fn(() => 0) },
  },
}));

import { CatRoomScene } from "./CatRoomScene";
import * as Phaser from "phaser";

interface SceneInternals {
  cat: {
    anims: { currentAnim?: { key: string } };
    body: { setAllowGravity: ReturnType<typeof vi.fn>; velocity: { x: number; y: number } };
    play: ReturnType<typeof vi.fn>;
    x: number;
    y: number;
    setDepth: ReturnType<typeof vi.fn>;
    setFlipX: ReturnType<typeof vi.fn>;
    setScale: ReturnType<typeof vi.fn>;
    setPosition: ReturnType<typeof vi.fn>;
    setX: ReturnType<typeof vi.fn>;
    setY: ReturnType<typeof vi.fn>;
    setVelocity: ReturnType<typeof vi.fn>;
    setVelocityX: ReturnType<typeof vi.fn>;
    setVelocityY: ReturnType<typeof vi.fn>;
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
  foodBowlReturn?: {
    waypoints: Array<{ x: number; y: number }>;
    waypointIndex: number;
    destination: { x: number; y: number };
    arrivalStartedAt?: number;
    arrivalContactStartedAt?: number;
  };
  foodBowlRoute?: {
    arrivalStartedAt?: number;
    arrivalContactStartedAt?: number;
  };
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
  const cat: SceneInternals["cat"] = {
    anims: {},
    body: { setAllowGravity: vi.fn(), velocity: { x: 0, y: 0 } },
    play: vi.fn(),
    x,
    y: 225,
    setDepth: vi.fn(),
    setFlipX: vi.fn(),
    setScale: vi.fn(),
    setPosition: vi.fn((nextX: number, nextY: number) => {
      cat.x = nextX;
      cat.y = nextY;
    }),
    setX: vi.fn((nextX: number) => {
      cat.x = nextX;
    }),
    setY: vi.fn((nextY: number) => {
      cat.y = nextY;
    }),
    setVelocity: vi.fn((nextX: number, nextY: number) => {
      cat.body.velocity.x = nextX;
      cat.body.velocity.y = nextY;
    }),
    setVelocityX: vi.fn((nextX: number) => {
      cat.body.velocity.x = nextX;
    }),
    setVelocityY: vi.fn((nextY: number) => {
      cat.body.velocity.y = nextY;
    }),
  };
  return cat;
}

function advanceMockPhysics(cat: SceneInternals["cat"], elapsedMs: number) {
  cat.x += cat.body.velocity.x * (elapsedMs / 1000);
  cat.y += cat.body.velocity.y * (elapsedMs / 1000);
}

afterEach(() => {
  vi.mocked(Phaser.Math.RND.frac).mockReturnValue(0);
});

describe("CatRoomScene interactions", () => {
  it("uses the complete production frame range for every action loop", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as {
      cache: { json: { get: ReturnType<typeof vi.fn> } };
      anims: {
        generateFrameNumbers: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
      };
    };
    const actions = {
      eat: { file: "eat.png", frames: 6, frameRate: 5, repeat: -1 },
      groom: { file: "groom.png", frames: 8, frameRate: 6, repeat: -1 },
      stretch: { file: "stretch.png", frames: 6, frameRate: 5, repeat: -1 },
    };
    internals.cache = {
      json: {
        get: vi.fn(() => ({ actions })),
      },
    };
    internals.anims = {
      generateFrameNumbers: vi.fn((key: string, range: { start: number; end: number }) =>
        Array.from({ length: range.end - range.start + 1 }, (_, offset) => ({
          key,
          frame: range.start + offset,
        })),
      ),
      create: vi.fn(),
    };

    (scene as unknown as { createCatAnimations: () => void }).createCatAnimations();

    for (const [action, config] of Object.entries(actions)) {
      expect(internals.anims.generateFrameNumbers).toHaveBeenCalledWith(`cat-${action}`, {
        start: 0,
        end: config.frames - 1,
      });
      expect(internals.anims.create).toHaveBeenCalledWith({
        key: `cat-${action}-anim`,
        frames: expect.arrayContaining([
          { key: `cat-${action}`, frame: 0 },
          { key: `cat-${action}`, frame: config.frames - 1 },
        ]),
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
    }
  });

  it("takes a smooth floor-to-bowl route before starting the eating action", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.playCatAction = vi.fn();

    let previousTime = 1000;
    const routeYs: number[] = [];
    for (let time = 1000; time <= 22_000; time += 100) {
      advanceMockPhysics(internals.cat, time - previousTime);
      scene.update(time);
      routeYs.push(internals.cat.y);
      previousTime = time;
      if (internals.routine === "eatFoodBowl") {
        break;
      }
    }

    const routePositions = internals.cat.setPosition.mock.calls as Array<[number, number]>;
    expect(routeYs.some((y) => y > 225 && y < 259)).toBe(true);
    expect(routePositions.at(-1)?.[1]).toBe(259);
    expect(internals.routine).toBe("eatFoodBowl");
    expect(internals.currentZone).toBe("food-bowl");
    expect(internals.playCatAction).toHaveBeenCalledWith("walk");
    expect(internals.playCatAction).toHaveBeenCalledWith("idle", true);
    expect(internals.playCatAction).toHaveBeenCalledWith("eat", true);
  });

  it("curves through authored floor-to-bowl waypoints before the final arrival", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    scene.update(1000);

    expect(internals.cat.setVelocityY).toHaveBeenLastCalledWith(expect.any(Number));
    expect(Math.abs(internals.cat.setVelocityY.mock.calls.at(-1)?.[0] ?? 0)).toBeGreaterThan(0);
  });

  it("keeps walking velocity through the bowl route's intermediate turns", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    let previousTime = 1000;
    for (let time = 1000; time <= 10_000; time += 16) {
      advanceMockPhysics(internals.cat, time - previousTime);
      scene.update(time);
      previousTime = time;
      if (internals.routine === "eatFoodBowl") {
        break;
      }
    }

    expect(
      internals.cat.setVelocityX.mock.calls.some(([velocity]) => Math.abs(velocity as number) > 0),
    ).toBe(true);
  });

  it("uses the same gradual walking pace before the bowl arrival deceleration", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    scene.update(1000);
    advanceMockPhysics(internals.cat, 500);
    scene.update(1500);
    advanceMockPhysics(internals.cat, 100);
    scene.update(1600);
    advanceMockPhysics(internals.cat, 100);
    scene.update(1700);

    const speeds = internals.cat.setVelocityX.mock.calls.map(([speed]) => speed as number);
    const firstCruiseSpeed = speeds.at(-2) ?? 0;
    const secondCruiseSpeed = speeds.at(-1) ?? 0;
    expect(firstCruiseSpeed).toBeGreaterThan(0);
    expect(secondCruiseSpeed).toBeGreaterThan(0);
    expect(secondCruiseSpeed).toBeGreaterThan(firstCruiseSpeed);
  });

  it("blends into the bowl walk before settling into cruise pace", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    scene.update(1000);
    advanceMockPhysics(internals.cat, 300);
    scene.update(1300);
    advanceMockPhysics(internals.cat, 100);
    scene.update(1400);

    const speeds = internals.cat.setVelocityX.mock.calls.map(([speed]) => speed as number);
    const entrySpeed = speeds.at(-2) ?? 0;
    const nextSpeed = speeds.at(-1) ?? 0;
    expect(entrySpeed).toBeGreaterThan(0);
    expect(entrySpeed).toBeLessThan(nextSpeed * 0.8);
  });

  it("drives the bowl cruise with walking velocity instead of repositioning the sprite", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    scene.update(1000);
    advanceMockPhysics(internals.cat, 300);
    scene.update(1300);

    expect(internals.cat.setPosition).not.toHaveBeenCalled();
    expect(internals.cat.setVelocityX).toHaveBeenLastCalledWith(expect.any(Number));
    expect(internals.cat.setVelocityX.mock.calls.at(-1)?.[0]).toBeGreaterThan(0);
  });

  it("decelerates the moving bowl arrival over 200ms before stable contact", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    let previousTime = 1000;
    let arrivalStartedAt: number | undefined;
    for (let time = 1000; time <= 22_000; time += 16) {
      advanceMockPhysics(internals.cat, time - previousTime);
      scene.update(time);
      previousTime = time;
      arrivalStartedAt = internals.foodBowlRoute?.arrivalStartedAt;
      if (arrivalStartedAt !== undefined) {
        break;
      }
    }

    expect(arrivalStartedAt).toBeDefined();
    const arrivalSpeed = Math.hypot(internals.cat.body.velocity.x, internals.cat.body.velocity.y);
    expect(arrivalSpeed).toBeGreaterThan(0);
    const positionCallsBeforeDeceleration = internals.cat.setPosition.mock.calls.length;

    advanceMockPhysics(internals.cat, 100);
    scene.update((arrivalStartedAt ?? 0) + 100);

    const slowedSpeed = Math.hypot(internals.cat.body.velocity.x, internals.cat.body.velocity.y);
    expect(slowedSpeed).toBeGreaterThan(0);
    expect(slowedSpeed).toBeLessThan(arrivalSpeed);
    expect(internals.cat.setPosition).toHaveBeenCalledTimes(positionCallsBeforeDeceleration);
    expect(internals.routine).toBe("approachFoodBowl");
  });

  it("walks away from the bowl while returning to the floor baseline", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(471);
    internals.cat.y = 259;
    internals.routine = "eatFoodBowl";
    internals.routineHoldUntil = 1000;
    internals.currentZone = "food-bowl";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.playCatAction = vi.fn();

    scene.update(1000);

    expect(internals.routine).toBe("returnFromFoodBowl");
    expect(internals.foodBowlReturn?.waypoints).toHaveLength(2);
    expect(internals.foodBowlReturn?.destination).not.toEqual(
      internals.foodBowlReturn?.waypoints.at(-1),
    );
    expect(internals.cat.setVelocityX).toHaveBeenLastCalledWith(expect.any(Number));

    advanceMockPhysics(internals.cat, 100);
    scene.update(1100);
    expect(internals.cat.y).toBeGreaterThan(225);
    expect(internals.cat.y).toBeLessThan(259);
    expect(internals.cat.x).toBeLessThan(471);
    expect(internals.routine).toBe("returnFromFoodBowl");

    let previousTime = 1100;
    let arrivalStartedAt: number | undefined;
    for (let time = 1200; time <= 22_000; time += 100) {
      advanceMockPhysics(internals.cat, time - previousTime);
      scene.update(time);
      previousTime = time;
      arrivalStartedAt = internals.foodBowlReturn?.arrivalStartedAt;
      if (arrivalStartedAt !== undefined) {
        break;
      }
    }

    expect(arrivalStartedAt).toBeDefined();
    scene.update((arrivalStartedAt ?? 0) + 200);
    expect(internals.routine).toBe("returnFromFoodBowl");
    scene.update((arrivalStartedAt ?? 0) + 350);
    expect(internals.routine).toBe("returnFromFoodBowl");
    expect(internals.playCatAction).toHaveBeenCalledWith("idle", true);
    const arrivalContactStartedAt = internals.foodBowlReturn?.arrivalContactStartedAt;
    expect(arrivalContactStartedAt).toBeDefined();
    scene.update((arrivalContactStartedAt ?? 0) + 149);
    expect(internals.routine).toBe("returnFromFoodBowl");
    scene.update((arrivalContactStartedAt ?? 0) + 151);

    expect(internals.cat.y).toBe(225);
    expect(internals.routine).toBe("floorPause");
  });

  it("cancels the bowl route on touch without resuming it", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.activeIntent = { kind: "eat", dwellMs: 5_000 };
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.update(1000);
    scene.interact();

    expect(internals.routine).toBe("floorPause");
    expect(internals.currentZone).toBe("floor");
    expect(internals.activeIntent).toBeUndefined();
    expect(internals.cat.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(internals.cat.setY).not.toHaveBeenCalledWith(259);

    scene.update(1100);
    expect(internals.routine).toBe("floorPause");
    expect(internals.playCatAction).not.toHaveBeenCalledWith("eat", true);
  });

  it("cancels a bowl route before its first movement tick", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.activeIntent = { kind: "eat", dwellMs: 5_000 };
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.interact();

    expect(internals.routine).toBe("floorPause");
    expect(internals.activeIntent).toBeUndefined();
    scene.update(1100);
    expect(internals.routine).toBe("floorPause");
    expect(internals.playCatAction).not.toHaveBeenCalledWith("walk");
  });

  it("eases an interrupted bowl arrival back to the floor baseline", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(320);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.activeIntent = { kind: "eat", dwellMs: 5_000 };
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.tweens = { killTweensOf: vi.fn() };
    internals.playCatAction = vi.fn();
    internals.onInteract = vi.fn();

    scene.update(1000);
    internals.cat.y = 250;
    internals.time.now = 1100;
    scene.interact();
    internals.time.now = 1200;
    scene.update(1200);

    const yCalls = internals.cat.setY.mock.calls.map(([y]) => y as number);
    expect(yCalls.some((y) => y > 225 && y < 250)).toBe(true);
    scene.update(1300);
    const settledYCalls = internals.cat.setY.mock.calls.map(([y]) => y as number);
    expect(settledYCalls.at(-1)).toBe(225);
  });

  it("keeps its approach heading while slowing into the bowl from the right", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(540);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.playCatAction = vi.fn();

    let previousTime = 1000;
    for (let time = 1000; time <= 22_000; time += 100) {
      advanceMockPhysics(internals.cat, time - previousTime);
      scene.update(time);
      previousTime = time;
      if (internals.routine === "eatFoodBowl") {
        break;
      }
    }

    expect(internals.routine).toBe("eatFoodBowl");
    expect(internals.cat.setFlipX).toHaveBeenLastCalledWith(true);
  });

  it("skips the left bowl waypoint when already past it", () => {
    const scene = Object.create(CatRoomScene.prototype) as CatRoomScene;
    const internals = scene as unknown as SceneInternals;
    internals.cat = createCat(458);
    internals.routine = "approachFoodBowl";
    internals.routineHoldUntil = 0;
    internals.currentZone = "floor";
    internals.temperament = "AFFECTIONATE";
    internals.time = { now: 1000 };
    internals.manualInteractUntil = 0;
    internals.playCatAction = vi.fn();

    scene.update(1000);
    scene.update(1100);

    const positions = internals.cat.setPosition.mock.calls as Array<[number, number]>;
    expect(positions.every(([x]) => x >= 458)).toBe(true);
  });

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
