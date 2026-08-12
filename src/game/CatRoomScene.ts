import * as Phaser from "phaser";
import {
  chooseCompanionWhisper,
  chooseTouchOutcome,
  createCompanionPlanner,
  getCompanionMovementSpeed,
  type CompanionIntent,
  type CompanionIntentKind,
  type CompanionPlanner,
  type CompanionZone,
  type TouchDisposition,
} from "../domain/catFsm";
import type { CatCoatPreset, CatTemperament } from "../types";

export interface CatRoomSceneData {
  coatPreset?: CatCoatPreset;
  temperament?: CatTemperament;
  showStardust: boolean;
  onInteract: (message: string | null) => void;
  initialInteractionCount?: number;
  onReady?: (scene: CatRoomScene) => void;
}

interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CatAction =
  | "idle"
  | "sit"
  | "walk"
  | "jump"
  | "sleep"
  | "interact"
  | "eat"
  | "lie"
  | "groom"
  | "stretch";
type CatReaction = CatAction | "interact-brief" | "sleep-touch";
type CollisionConfig = Record<string, CollisionRect>;
type EnvironmentZoneKind = "floor" | "perch" | "rest" | "food" | "blocker";
type CatRoutine =
  | "approachWindowBench"
  | "perchWindowBench"
  | "approachCatBed"
  | "restCatBed"
  | "approachFoodBowl"
  | "eatFoodBowl"
  | "returnFromFoodBowl"
  | "approachPlant"
  | "inspectPlant"
  | "approachPlantTouch"
  | "observePlantTouch"
  | "touchPlant"
  | "watchPlantSway"
  | "settlePlantTouch"
  | "approachBlanket"
  | "restBlanket"
  | "floorIdle"
  | "floorWalk"
  | "floorSit"
  | "floorGroom"
  | "floorSleep"
  | "floorStretch"
  | "approachUser"
  | "approachForeground"
  | "acknowledgeUser"
  | "returnFromForeground"
  | "floorPause";

type FloorRoutine = "floorIdle" | "floorSit" | "floorGroom" | "floorSleep" | "floorStretch";

interface EnvironmentZone {
  id: string;
  kind: EnvironmentZoneKind;
  xMin: number;
  xMax: number;
}

interface CatAnimationSpec {
  frameWidth: number;
  frameHeight: number;
  actions: Record<
    CatAction,
    {
      file: string;
      frames: number;
      frameRate: number;
      repeat: number;
    }
  >;
}

interface ScriptedJump {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startedAt: number;
  duration: number;
  peakHeight: number;
  landingRoutine: CatRoutine;
}

interface FoodBowlPath {
  waypoints: FoodBowlWaypoint[];
  waypointIndex: number;
}

interface FoodBowlRoute extends FoodBowlPath {
  startedAt: number;
  destination: FoodBowlWaypoint;
  arrivalStartedAt?: number;
  arrivalVelocityX?: number;
  arrivalVelocityY?: number;
  arrivalContactStartedAt?: number;
}

interface FoodBowlWaypoint {
  x: number;
  y: number;
}

interface FoodBowlVerticalTransition {
  fromY: number;
  toY: number;
  startedAt: number;
}

const SCENE_ASSET_ROOT = "/assets/scenes/window-room";
const CAT_ACTIONS: CatAction[] = [
  "idle",
  "sit",
  "walk",
  "jump",
  "sleep",
  "interact",
  "eat",
  "lie",
  "groom",
  "stretch",
];

const COAT_ASSET_DIRECTORIES: Record<CatCoatPreset, string> = {
  ORANGE_TABBY: "orange-tabby",
  SOLID_BLACK: "solid-black",
  SOLID_WHITE: "solid-white",
  CALICO: "calico",
  TUXEDO: "tuxedo",
  GRAY_WHITE_TABBY: "gray-white-tabby",
};

const PHYSICAL_SURFACES = new Set(["floor"]);

const ENVIRONMENT_ZONES: EnvironmentZone[] = [
  { id: "floor-left", kind: "floor", xMin: 130, xMax: 230 },
  { id: "floor-center", kind: "floor", xMin: 250, xMax: 430 },
  { id: "windowBench", kind: "perch", xMin: 180, xMax: 360 },
  { id: "catBed", kind: "rest", xMin: 60, xMax: 115 },
  { id: "rightTray", kind: "food", xMin: 505, xMax: 575 },
  { id: "plant", kind: "blocker", xMin: 480, xMax: 545 },
];

const findZone = (id: string) => {
  const zone = ENVIRONMENT_ZONES.find((candidate) => candidate.id === id);
  if (!zone) {
    throw new Error(`Missing CatStar environment zone: ${id}`);
  }
  return zone;
};

const ARRIVAL_DISTANCE = 14;
const CAT_DISPLAY_SIZE = 96;
const CAT_BASE_SCALE = CAT_DISPLAY_SIZE / 96;
const FLOOR_STAND_Y = 225;
const FOREGROUND_STAND_Y = 270;
const FOREGROUND_SCALE = 1.18;
const FOREGROUND_TRANSITION_MS = 760;
const WINDOW_BENCH_STAND_Y = 140;
const WINDOW_BENCH_ZONE = findZone("windowBench");
const FLOOR_CENTER_ZONE = findZone("floor-center");
const FLOOR_LEFT_ZONE = findZone("floor-left");
const CAT_BED_ZONE = findZone("catBed");
const FOOD_ZONE = findZone("rightTray");
const PLANT_ZONE = findZone("plant");
const WINDOW_BENCH_SURFACE = {
  xMin: WINDOW_BENCH_ZONE.xMin + 26,
  xMax: WINDOW_BENCH_ZONE.xMax - 22,
  y: WINDOW_BENCH_STAND_Y,
};
const WINDOW_BENCH_TAKEOFF_X = WINDOW_BENCH_ZONE.xMax - 28;
const CAT_BED_SURFACE = {
  x: CAT_BED_ZONE.xMin + 38,
  y: 202,
};
const CAT_BED_ENTRY_X = CAT_BED_ZONE.xMax + 16;
const CAT_BED_EXIT_X = CAT_BED_ENTRY_X + 20;
const FOOD_BOWL_X = FOOD_ZONE.xMin - 34;
const FOOD_BOWL_STAND_Y = FLOOR_STAND_Y + 34;
const FOOD_BOWL_ROUTE_DECELERATION_MS = 200;
const FOOD_BOWL_ROUTE_CONTACT_MS = 150;
const FOOD_BOWL_WAYPOINT_TOLERANCE = 4;
const FOOD_BOWL_ROUTE_OUTER_OFFSET_X = 72;
const FOOD_BOWL_ROUTE_INNER_OFFSET_X = 24;
const FOOD_BOWL_ROUTE_OUTER_Y = FLOOR_STAND_Y + 5;
const FOOD_BOWL_ROUTE_INNER_Y = FOOD_BOWL_STAND_Y - 12;
const FOOD_BOWL_RETURN_OFFSET_X = 80;
const PLANT_INSPECT_X = PLANT_ZONE.xMin - 22;
const PLANT_TOUCH_X = PLANT_ZONE.xMin - 18;
const PLANT_LEAF_PIVOT_X = 534;
const PLANT_LEAF_PIVOT_Y = 158;
const PLANT_TOUCH_OBSERVE_MS = 800;
const PLANT_TOUCH_CONTACT_MS = 400;
const PLANT_LEAF_SWAY_MS = 1_200;
const PLANT_TOUCH_DURATION_MS = 3_000;
const PLANT_LEAF_SWAY_DEGREES = 8;
const BLANKET_STAND_Y = 158;
const BLANKET_REST_X = 578;
const BLANKET_TAKEOFF_X = 482;
const BLANKET_RETURN_X = FLOOR_CENTER_ZONE.xMax - 20;
const FLOOR_RETURN_X = FLOOR_CENTER_ZONE.xMin + 72;
const FLOOR_PAUSE_X = FLOOR_LEFT_ZONE.xMax - 15;
const USER_APPROACH_X = FLOOR_CENTER_ZONE.xMax - 18;
const DEBUG_REVIEW_DWELL_MS = 2_400;
const FLOOR_ROUTINE_ACTIONS: Record<FloorRoutine, CatAction> = {
  floorIdle: "idle",
  floorSit: "sit",
  floorGroom: "groom",
  floorSleep: "sleep",
  floorStretch: "stretch",
};
const isFloorRoutine = (routine: CatRoutine): routine is FloorRoutine => routine in FLOOR_ROUTINE_ACTIONS;
const DEBUG_ROUTINES = new Set<CatRoutine>([
  "approachWindowBench",
  "approachCatBed",
  "approachBlanket",
  "approachFoodBowl",
  "approachPlant",
  "approachPlantTouch",
  "observePlantTouch",
  "touchPlant",
  "watchPlantSway",
  "settlePlantTouch",
  ...(Object.keys(FLOOR_ROUTINE_ACTIONS) as FloorRoutine[]),
  "floorWalk",
  "approachUser",
]);

const INTENT_ROUTINES: Record<CompanionIntentKind, CatRoutine> = {
  "window-watch": "approachWindowBench",
  "cat-bed-rest": "approachCatBed",
  "blanket-rest": "approachBlanket",
  eat: "approachFoodBowl",
  "plant-inspect": "approachPlant",
  "plant-touch": "approachPlantTouch",
  "floor-sit": "floorSit",
  "floor-groom": "floorGroom",
  "floor-sleep": "floorSleep",
  "floor-stretch": "floorStretch",
  "approach-user": "approachUser",
};

const TOUCH_ACTIONS: Record<TouchDisposition, CatReaction> = {
  "brief-acknowledge": "interact-brief",
  acknowledge: "interact",
  "remain-asleep": "sleep-touch",
  wake: "stretch",
};

export class CatRoomScene extends Phaser.Scene {
  private cat?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private plantLeaf?: Phaser.GameObjects.Image;
  private routine: CatRoutine = "approachWindowBench";
  private routineHoldUntil = 0;
  private scriptedJump?: ScriptedJump;
  private foodBowlRoute?: FoodBowlRoute;
  private foodBowlCancellation?: FoodBowlVerticalTransition;
  private foodBowlReturn?: FoodBowlRoute;
  private foodBowlFacingLeft = false;
  private windowBenchTargetX = (WINDOW_BENCH_SURFACE.xMin + WINDOW_BENCH_SURFACE.xMax) / 2;
  private windowBenchDecisionAt = 0;
  private windowBenchStillUntil = 0;
  private walkPaceSeed = 0;
  private manualInteractUntil = 0;
  private pendingInteractionCount = 0;
  private foregroundTransitionStartedAt = 0;
  private manualInteractAction: CatReaction = "interact";
  private sessionStartedAt = 0;
  private plantTouchStartedAt = 0;
  private plantTouchCooldownStarted = false;
  private showStardust = false;
  private coatPreset: CatCoatPreset = "GRAY_WHITE_TABBY";
  private temperament: CatTemperament = "AFFECTIONATE";
  private currentZone: CompanionZone = "floor";
  private activeIntent?: CompanionIntent;
  private planner: CompanionPlanner = createCompanionPlanner({ temperament: "AFFECTIONATE" });
  private debugRoutine?: CatRoutine;
  private debugMotionReview = false;
  private debugFloorWalkDirection = 1;
  private debugForceFullTouch = false;
  private onInteract: (message: string | null) => void = () => {};
  private onReady: (scene: CatRoomScene) => void = () => {};
  private acceptsInteractions = false;

  constructor() {
    super("cat-room");
  }

  init(data: CatRoomSceneData) {
    this.coatPreset = data.coatPreset ?? "GRAY_WHITE_TABBY";
    this.temperament = data.temperament ?? "AFFECTIONATE";
    this.showStardust = data.showStardust;
    this.walkPaceSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.planner = createCompanionPlanner({
      temperament: this.temperament,
      random: () => Phaser.Math.RND.frac(),
    });
    this.onInteract = data.onInteract;
    this.onReady = data.onReady ?? (() => {});
    this.acceptsInteractions = false;
    this.pendingInteractionCount = Math.max(0, Math.floor(data.initialInteractionCount ?? 0));

    if (import.meta.env.DEV) {
      const searchParams = new URLSearchParams(window.location.search);
      this.debugMotionReview = searchParams.get("catstarMotionReview") === "1";
      if (this.debugMotionReview) {
        document.documentElement.dataset.catstarMotionState = "running";
      }
      const debugRoutine = searchParams.get("catstarRoutine") as CatRoutine | null;
      if (debugRoutine && DEBUG_ROUTINES.has(debugRoutine)) {
        this.debugRoutine = debugRoutine;
      }
      this.debugForceFullTouch = searchParams.get("catstarFullTouch") === "1";
    }
  }

  preload() {
    this.load.image("window-room-background", `${SCENE_ASSET_ROOT}/background.png`);
    this.load.image("window-room-foreground-cat-bed", `${SCENE_ASSET_ROOT}/foreground-cat-bed.png`);
    this.load.image("window-room-foreground-blanket", `${SCENE_ASSET_ROOT}/foreground-blanket.png`);
    this.load.image("window-room-plant-leaf", `${SCENE_ASSET_ROOT}/plant-leaf.png`);
    this.load.json("window-room-collision", `${SCENE_ASSET_ROOT}/collision.json`);
    this.load.json("cat-animation-spec", `${SCENE_ASSET_ROOT}/cat/cat.animations.json`);
    const coatDirectory = COAT_ASSET_DIRECTORIES[this.coatPreset];
    CAT_ACTIONS.forEach((action) => {
      this.load.spritesheet(`cat-${action}`, `${SCENE_ASSET_ROOT}/cat/${coatDirectory}/${action}.png`, {
        frameWidth: 96,
        frameHeight: 96,
      });
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, 640, 360);
    this.createPhysicsTexture();
    this.createParticleTexture();
    this.add.image(320, 180, "window-room-background").setDisplaySize(640, 360).setDepth(0);
    this.createPlantLeaf();
    this.createCatAnimations();
    this.createSceneObjects();
    this.createCat();
    this.createForegroundObjects();
    const cat = this.cat;
    if (!cat) {
      throw new Error("Cat sprite was not created");
    }
    this.sessionStartedAt = this.time.now;
    if (this.debugRoutine) {
      this.routine = this.debugRoutine;
      if (this.debugRoutine === "touchPlant") {
        this.cat?.setPosition(PLANT_TOUCH_X, FLOOR_STAND_Y);
        this.cat?.setFlipX(false);
        this.currentZone = "plant";
        this.plantTouchStartedAt = this.time.now - PLANT_TOUCH_OBSERVE_MS;
        this.routineHoldUntil =
          this.time.now + PLANT_TOUCH_DURATION_MS - PLANT_TOUCH_OBSERVE_MS;
        this.playCatAction("interact", true);
      } else if (this.debugRoutine === "floorWalk") {
        this.cat?.setPosition(FLOOR_LEFT_ZONE.xMin + 24, FLOOR_STAND_Y);
        this.cat?.setFlipX(false);
        this.currentZone = "floor";
        this.debugFloorWalkDirection = 1;
        this.routineHoldUntil = this.time.now + this.debugHoldDuration(20_000);
      } else {
        this.routineHoldUntil = isFloorRoutine(this.debugRoutine)
          ? this.time.now + this.debugHoldDuration(20_000)
          : 0;
      }
    } else {
      this.startReturnEncounter(this.time.now);
    }
    this.acceptsInteractions = true;
    this.onReady(this);
  }

  update(time: number) {
    if (!this.cat) {
      return;
    }

    this.publishDebugMotionState();
    this.updateFoodBowlCancellation(time);

    if (time < this.manualInteractUntil) {
      this.cat.setVelocity(0, 0);
      this.playCatReaction(this.manualInteractAction);
      return;
    }

    if (this.pendingInteractionCount > 0) {
      this.pendingInteractionCount -= 1;
      this.interact();
      return;
    }

    if (this.scriptedJump) {
      this.updateScriptedJump(time);
      return;
    }

    this.updatePurposefulRoutine(time);
  }

  private createSceneObjects() {
    const collision = this.cache.json.get("window-room-collision") as CollisionConfig;
    const colliders = Object.entries(collision)
      .filter(([name]) => PHYSICAL_SURFACES.has(name))
      .map(([name, rect]) =>
        this.physics.add
          .staticImage(rect.x, rect.y, "physics-pixel")
          .setName(name)
          .setSize(rect.width, rect.height)
          .setVisible(false)
          .refreshBody(),
      );

    this.registry.set("catstar-colliders", colliders);
  }

  private createCat() {
    this.cat = this.physics.add.sprite(320, FLOOR_STAND_Y, "cat-idle");
    this.cat.setDisplaySize(CAT_DISPLAY_SIZE, CAT_DISPLAY_SIZE);
    this.cat.setCollideWorldBounds(true);
    this.cat.setGravityY(0);
    this.cat.body.setAllowGravity(false);
    this.cat.setBounce(0);
    this.cat.setDepth(5);
    this.cat.setInteractive({ useHandCursor: true });
    this.cat.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.interact(pointer.worldX));

    this.cat.setSize(48, 76);
    this.cat.setOffset(24, 18);
    this.playCatAction("idle");

    const colliders = this.registry.get("catstar-colliders") as Phaser.Physics.Arcade.Image[] | undefined;
    colliders?.forEach((collider) => {
      if (this.cat) {
        this.physics.add.collider(this.cat, collider);
      }
    });

    if (this.showStardust) {
      this.addStardust();
    }
  }

  interact(touchWorldX?: number): number {
    if (!this.cat) {
      return 0;
    }

    if (touchWorldX !== undefined && Number.isFinite(touchWorldX)) {
      this.cat.setFlipX(touchWorldX < this.cat.x);
    }

    if (this.scriptedJump) {
      this.tweens.killTweensOf(this.cat);
      this.scriptedJump = undefined;
      this.cat.body.setAllowGravity(false);
      this.cat.setVelocity(0, 0);
      this.cat.setY(FLOOR_STAND_Y);
      this.currentZone = "floor";
      this.routine = "floorPause";
      this.routineHoldUntil = this.time.now + 900;
      this.activeIntent = undefined;
    }

    if (
      this.routine === "approachFoodBowl" ||
      this.routine === "returnFromFoodBowl" ||
      this.foodBowlRoute ||
      this.foodBowlReturn
    ) {
      this.cancelFoodBowlRoute(this.time.now);
    }

    if (
      this.routine === "approachPlantTouch" ||
      this.routine === "observePlantTouch" ||
      this.routine === "touchPlant" ||
      this.routine === "watchPlantSway" ||
      this.routine === "settlePlantTouch"
    ) {
      this.cancelPlantTouch(this.time.now);
    }

    const sleeping = this.routine === "floorSleep";
    const outcome = chooseTouchOutcome(
      this.temperament,
      sleeping,
      () => (this.debugForceFullTouch ? 0 : Phaser.Math.RND.frac()),
    );

    this.cat.setVelocity(0, 0);
    if (outcome.disposition === "wake") {
      this.startFloorPause(this.time.now);
    }

    this.manualInteractAction = TOUCH_ACTIONS[outcome.disposition];
    this.manualInteractUntil = this.time.now + outcome.durationMs;
    this.playCatReaction(this.manualInteractAction, true);
    this.onInteract(chooseCompanionWhisper(this.temperament, () => Phaser.Math.RND.frac()));
    return outcome.durationMs;
  }

  enqueueInteractions(count = 1): boolean {
    if (!this.acceptsInteractions) {
      return false;
    }
    this.pendingInteractionCount += Math.max(0, Math.floor(count));
    return true;
  }

  private updatePurposefulRoutine(time: number) {
    if (!this.cat) {
      return;
    }

    if (this.routine === "approachWindowBench") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      if (this.moveTowardTarget(WINDOW_BENCH_TAKEOFF_X)) {
        this.windowBenchTargetX = this.chooseWindowBenchTargetX();
        this.startScriptedJump(time, {
          toX: this.windowBenchTargetX,
          toY: WINDOW_BENCH_STAND_Y,
          duration: 880,
          peakHeight: 58,
          landingRoutine: "perchWindowBench",
        });
      }
      return;
    }

    if (this.routine === "approachCatBed") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      if (this.moveTowardTarget(CAT_BED_ENTRY_X)) {
        this.startScriptedJump(time, {
          toX: CAT_BED_SURFACE.x,
          toY: CAT_BED_SURFACE.y,
          duration: 700,
          peakHeight: 34,
          landingRoutine: "restCatBed",
        });
      }
      return;
    }

    if (this.routine === "restCatBed") {
      this.currentZone = "cat-bed";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(CAT_BED_SURFACE.y);
      this.cat.setVelocityX(0);
      this.playCatAction("lie");

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.startScriptedJump(time, {
          toX: CAT_BED_EXIT_X,
          toY: FLOOR_STAND_Y,
          duration: 680,
          peakHeight: 30,
          landingRoutine: "floorPause",
        });
      }
      return;
    }

    if (this.routine === "approachFoodBowl") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      this.advanceFoodBowlRoute(time);
      return;
    }

    if (this.routine === "eatFoodBowl") {
      this.currentZone = "food-bowl";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FOOD_BOWL_STAND_Y);
      this.cat.setVelocityX(0);
      this.cat.setFlipX(this.foodBowlFacingLeft);
      this.playCatAction("eat");

      if (time >= this.routineHoldUntil) {
        this.foodBowlReturn = {
          waypoints: this.foodBowlReturnWaypoints(),
          waypointIndex: 0,
          startedAt: time,
          destination: this.foodBowlReturnDestination(),
        };
        this.completeActiveIntent();
        this.routine = "returnFromFoodBowl";
        this.advanceFoodBowlReturn(time);
      }
      return;
    }

    if (this.routine === "returnFromFoodBowl") {
      this.advanceFoodBowlReturn(time);
      return;
    }

    if (this.routine === "approachPlant") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      if (this.moveTowardTarget(PLANT_INSPECT_X)) {
        this.cat.setVelocityX(0);
        this.cat.setFlipX(false);
        this.routine = "inspectPlant";
        this.routineHoldUntil = time + this.activeDwellMs(2_800);
        this.currentZone = "plant";
        this.playCatAction("interact", true);
      }
      return;
    }

    if (this.routine === "approachPlantTouch") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      if (this.moveTowardTarget(PLANT_TOUCH_X)) {
        this.cat.setVelocityX(0);
        this.cat.setFlipX(false);
        this.routine = "observePlantTouch";
        this.plantTouchStartedAt = time;
        this.routineHoldUntil = time + this.activeDwellMs(PLANT_TOUCH_DURATION_MS);
        this.currentZone = "plant";
        this.resetPlantLeaf();
        this.plantTouchCooldownStarted = false;
        this.playCatAction("idle", true);
      }
      return;
    }

    if (this.routine === "observePlantTouch") {
      this.holdAtPlant();
      this.resetPlantLeaf();
      this.playCatAction("idle");

      const elapsed = Math.max(time - this.plantTouchStartedAt, 0);
      if (elapsed >= PLANT_TOUCH_OBSERVE_MS) {
        this.startPlantTouchCooldown(time);
        this.routine = "touchPlant";
        this.playCatAction("interact", true);
      }
      return;
    }

    if (this.routine === "touchPlant") {
      this.holdAtPlant();
      this.resetPlantLeaf();
      this.playCatAction("interact");

      const elapsed = Math.max(time - this.plantTouchStartedAt, 0);
      if (elapsed >= PLANT_TOUCH_OBSERVE_MS + PLANT_TOUCH_CONTACT_MS) {
        this.routine = "watchPlantSway";
        this.playCatAction("idle", true);
      }
      return;
    }

    if (this.routine === "watchPlantSway") {
      this.holdAtPlant();
      this.playCatAction("idle");

      const elapsed = Math.max(time - this.plantTouchStartedAt, 0);
      const swayProgress = Phaser.Math.Clamp(
        (elapsed - PLANT_TOUCH_OBSERVE_MS - PLANT_TOUCH_CONTACT_MS) / PLANT_LEAF_SWAY_MS,
        0,
        1,
      );
      const angle =
        Math.sin(swayProgress * Math.PI * 5) *
        PLANT_LEAF_SWAY_DEGREES *
        (1 - swayProgress);
      this.plantLeaf?.setAngle(angle);
      if (swayProgress >= 1) {
        this.routine = "settlePlantTouch";
        this.resetPlantLeaf();
      }
      return;
    }

    if (this.routine === "settlePlantTouch") {
      this.holdAtPlant();
      this.resetPlantLeaf();
      this.playCatAction("idle");

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.plantTouchStartedAt = 0;
        this.plantTouchCooldownStarted = false;
        this.startFloorPause(time);
      }
      return;
    }

    if (this.routine === "inspectPlant") {
      this.currentZone = "plant";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      this.cat.setVelocityX(0);
      this.cat.setFlipX(false);
      this.playCatAction(time > this.routineHoldUntil - 1000 ? "idle" : "interact");

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.startFloorPause(time);
      }
      return;
    }

    if (this.routine === "approachBlanket") {
      if (this.waitOnFloorUntil(time)) {
        return;
      }

      if (this.moveTowardTarget(BLANKET_TAKEOFF_X)) {
        this.startScriptedJump(time, {
          toX: BLANKET_REST_X,
          toY: BLANKET_STAND_Y,
          duration: 720,
          peakHeight: 42,
          landingRoutine: "restBlanket",
        });
      }
      return;
    }

    if (this.routine === "restBlanket") {
      this.currentZone = "blanket";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(BLANKET_STAND_Y);
      this.cat.setVelocityX(0);
      this.cat.setFlipX(true);
      this.playCatAction("lie");

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.startScriptedJump(time, {
          toX: BLANKET_RETURN_X,
          toY: FLOOR_STAND_Y,
          duration: 700,
          peakHeight: 38,
          landingRoutine: "floorPause",
        });
        return;
      }
      return;
    }

    if (this.routine === "perchWindowBench") {
      this.currentZone = "window-bench";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(WINDOW_BENCH_SURFACE.y);

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.startScriptedJump(time, {
          toX: FLOOR_RETURN_X,
          toY: FLOOR_STAND_Y,
          duration: 760,
          peakHeight: 42,
          landingRoutine: "floorPause",
        });
        return;
      }

      if (time < this.windowBenchStillUntil) {
        this.cat.setVelocityX(0);
        this.playCatAction("sit");
        return;
      }

      if (time >= this.windowBenchDecisionAt) {
        this.windowBenchTargetX = this.chooseWindowBenchTargetX();
        this.windowBenchDecisionAt = time + Phaser.Math.Between(1400, 2600);
      }

      if (this.moveOnWindowBenchSurface(this.windowBenchTargetX)) {
        this.cat.setVelocityX(0);
        this.windowBenchStillUntil = time + Phaser.Math.Between(700, 1500);
        this.windowBenchDecisionAt = this.windowBenchStillUntil + Phaser.Math.Between(500, 1200);
        this.playCatAction("sit");
      }
      return;
    }

    if (isFloorRoutine(this.routine)) {
      this.currentZone = "floor";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      this.cat.setVelocityX(0);
      this.playCatAction(FLOOR_ROUTINE_ACTIONS[this.routine]);

      if (time >= this.routineHoldUntil) {
        this.completeActiveIntent();
        this.startFloorPause(time);
      }
      return;
    }

    if (this.routine === "floorWalk") {
      this.currentZone = "floor";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      if (time >= this.routineHoldUntil) {
        this.startFloorPause(time);
        return;
      }
      const target =
        this.debugFloorWalkDirection > 0
          ? FLOOR_CENTER_ZONE.xMax - 24
          : FLOOR_LEFT_ZONE.xMin + 24;
      if (this.moveTowardTarget(target)) {
        this.debugFloorWalkDirection *= -1;
      }
      return;
    }

    if (this.routine === "approachUser") {
      this.currentZone = "floor";
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      if (this.moveTowardTarget(USER_APPROACH_X)) {
        this.cat.setVelocityX(0);
        this.cat.setFlipX(false);
        this.routine = "approachForeground";
        this.foregroundTransitionStartedAt = time;
      }
      return;
    }

    if (this.routine === "approachForeground") {
      this.updateForegroundTransition(time, false);
      return;
    }

    if (this.routine === "acknowledgeUser") {
      this.currentZone = "floor";
      this.cat.setVelocityX(0);
      this.cat.setY(FOREGROUND_STAND_Y);
      this.cat.setScale(FOREGROUND_SCALE);
      this.cat.setDepth(7);
      this.playCatAction("interact");
      if (time >= this.routineHoldUntil) {
        this.routine = "returnFromForeground";
        this.foregroundTransitionStartedAt = time;
      }
      return;
    }

    if (this.routine === "returnFromForeground") {
      this.updateForegroundTransition(time, true);
      return;
    }

    this.cat.body.setAllowGravity(false);
    this.cat.setY(FLOOR_STAND_Y);
    if (time >= this.routineHoldUntil) {
      if (this.moveTowardTarget(FLOOR_PAUSE_X)) {
        this.cat.setVelocityX(0);
        this.playCatAction("idle");
        this.scheduleNextIntent(time);
      }
      return;
    }

    this.cat.setVelocityX(0);
    this.playCatAction("idle");
  }

  private moveTowardTarget(targetX: number) {
    if (!this.cat) {
      return false;
    }

    const distance = targetX - this.cat.x;
    if (Math.abs(distance) < ARRIVAL_DISTANCE) {
      this.cat.setX(targetX);
      this.cat.setVelocityX(0);
      this.playCatAction("idle");
      return true;
    }

    this.cat.setVelocityX(this.nextCompanionWalkVelocity(distance));
    this.cat.setFlipX(distance < 0);
    this.playCatAction("walk");
    return false;
  }

  private waitOnFloorUntil(time: number) {
    if (!this.cat) {
      return true;
    }

    this.cat.body.setAllowGravity(false);
    if (time >= this.routineHoldUntil) {
      return false;
    }

    this.cat.setY(FLOOR_STAND_Y);
    this.cat.setVelocityX(0);
    this.playCatAction("idle");
    return true;
  }

  private startFoodBowlRoute(time: number) {
    if (!this.cat) {
      return;
    }

    const fromX = this.cat.x;
    const direction = FOOD_BOWL_X >= fromX ? 1 : -1;
    const approachWaypoints =
      direction > 0
        ? [
            { x: FOOD_BOWL_X - FOOD_BOWL_ROUTE_OUTER_OFFSET_X, y: FOOD_BOWL_ROUTE_OUTER_Y },
            { x: FOOD_BOWL_X - FOOD_BOWL_ROUTE_INNER_OFFSET_X, y: FOOD_BOWL_ROUTE_INNER_Y },
          ]
        : [
            { x: FOOD_BOWL_X + FOOD_BOWL_ROUTE_OUTER_OFFSET_X, y: FOOD_BOWL_ROUTE_OUTER_Y },
            { x: FOOD_BOWL_X + FOOD_BOWL_ROUTE_INNER_OFFSET_X, y: FOOD_BOWL_ROUTE_INNER_Y },
          ];
    const waypoints = approachWaypoints.filter((waypoint) =>
      direction > 0
        ? waypoint.x > fromX + FOOD_BOWL_WAYPOINT_TOLERANCE
        : waypoint.x < fromX - FOOD_BOWL_WAYPOINT_TOLERANCE,
    );

    this.foodBowlRoute = {
      waypoints,
      waypointIndex: 0,
      startedAt: time,
      destination: { x: FOOD_BOWL_X, y: FOOD_BOWL_STAND_Y },
    };
    this.foodBowlFacingLeft = direction < 0;
  }

  private foodBowlReturnWaypoints(): FoodBowlWaypoint[] {
    const direction = this.foodBowlFacingLeft ? 1 : -1;
    return [
      { x: FOOD_BOWL_X + direction * FOOD_BOWL_ROUTE_INNER_OFFSET_X, y: FOOD_BOWL_ROUTE_INNER_Y },
      { x: FOOD_BOWL_X + direction * FOOD_BOWL_ROUTE_OUTER_OFFSET_X, y: FOOD_BOWL_ROUTE_OUTER_Y },
    ];
  }

  private foodBowlReturnDestination(): FoodBowlWaypoint {
    const direction = this.foodBowlFacingLeft ? 1 : -1;
    return { x: FOOD_BOWL_X + direction * FOOD_BOWL_RETURN_OFFSET_X, y: FLOOR_STAND_Y };
  }

  private advanceFoodBowlRoute(time: number) {
    if (!this.cat) {
      return;
    }

    if (!this.foodBowlRoute) {
      this.startFoodBowlRoute(time);
    }
    const route = this.foodBowlRoute;
    if (!route) {
      return;
    }

    this.cat.body.setAllowGravity(false);

    if (!this.advanceFoodBowlTraversal(route, time, this.foodBowlFacingLeft)) {
      return;
    }

    this.foodBowlRoute = undefined;
    this.routine = "eatFoodBowl";
    this.routineHoldUntil = time + this.activeDwellMs(5_200);
    this.currentZone = "food-bowl";
    this.cat.setFlipX(this.foodBowlFacingLeft);
    this.playCatAction("eat", true);
  }

  private cancelFoodBowlRoute(time: number) {
    if (
      !this.cat ||
      (this.routine !== "approachFoodBowl" && this.routine !== "returnFromFoodBowl" && !this.foodBowlRoute && !this.foodBowlReturn)
    ) {
      return;
    }

    this.foodBowlCancellation = {
      fromY: this.cat.y,
      toY: FLOOR_STAND_Y,
      startedAt: time,
    };
    this.foodBowlRoute = undefined;
    this.foodBowlReturn = undefined;
    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.currentZone = "floor";
    this.routine = "floorPause";
    this.routineHoldUntil = time + 900;
    this.activeIntent = undefined;
  }

  private updateFoodBowlCancellation(time: number) {
    if (!this.cat || !this.foodBowlCancellation) {
      return;
    }

    const progress = Phaser.Math.Clamp(
      (time - this.foodBowlCancellation.startedAt) / FOOD_BOWL_ROUTE_DECELERATION_MS,
      0,
      1,
    );
    const easedProgress = Phaser.Math.Easing.Sine.Out(progress);
    this.cat.setY(
      Phaser.Math.Linear(
        this.foodBowlCancellation.fromY,
        this.foodBowlCancellation.toY,
        easedProgress,
      ),
    );
    if (progress >= 1) {
      this.foodBowlCancellation = undefined;
    }
  }

  private advanceFoodBowlReturn(time: number) {
    if (!this.cat || !this.foodBowlReturn) {
      return;
    }

    const route = this.foodBowlReturn;
    this.currentZone = "floor";
    this.cat.body.setAllowGravity(false);
    if (!this.advanceFoodBowlTraversal(route, time, !this.foodBowlFacingLeft)) {
      return;
    }

    this.foodBowlReturn = undefined;
    this.cat.setY(FLOOR_STAND_Y);
    this.startFloorPause(time);
    this.playCatAction("idle", true);
  }

  private advanceFoodBowlTraversal(
    route: FoodBowlRoute,
    time: number,
    facingLeft: boolean,
  ): boolean {
    if (!this.cat) {
      return false;
    }

    if (route.arrivalStartedAt === undefined) {
      const waypoint = route.waypoints[route.waypointIndex];
      const target = waypoint ?? route.destination;
      const distanceX = target.x - this.cat.x;
      const distanceY = target.y - this.cat.y;
      const distance = Math.hypot(distanceX, distanceY);
      if (distance > FOOD_BOWL_WAYPOINT_TOLERANCE) {
        const speed = this.nextCompanionWalkRouteSpeed(
          this.foodBowlPathRemainingDistance(route, route.destination),
        );
        this.cat.setVelocityX((distanceX / distance) * speed);
        this.cat.setVelocityY((distanceY / distance) * speed);
        this.cat.setFlipX(distanceX < 0);
        this.playCatAction("walk");
        return false;
      }

      if (waypoint) {
        route.waypointIndex += 1;
        return this.advanceFoodBowlTraversal(route, time, facingLeft);
      }

      route.arrivalStartedAt = time;
      route.arrivalVelocityX = this.cat.body.velocity.x;
      route.arrivalVelocityY = this.cat.body.velocity.y;
    }

    const arrivalElapsed = Math.max(time - route.arrivalStartedAt, 0);
    if (arrivalElapsed < FOOD_BOWL_ROUTE_DECELERATION_MS) {
      const progress = arrivalElapsed / FOOD_BOWL_ROUTE_DECELERATION_MS;
      const deceleration = 1 - Phaser.Math.Easing.Sine.Out(progress);
      this.cat.setVelocityX((route.arrivalVelocityX ?? 0) * deceleration);
      this.cat.setVelocityY((route.arrivalVelocityY ?? 0) * deceleration);
      this.cat.setFlipX(facingLeft);
      this.playCatAction("walk");
      return false;
    }

    this.cat.setVelocity(0, 0);
    const destinationDistance = Math.hypot(
      route.destination.x - this.cat.x,
      route.destination.y - this.cat.y,
    );
    if (destinationDistance > FOOD_BOWL_WAYPOINT_TOLERANCE) {
      route.arrivalStartedAt = undefined;
      route.arrivalVelocityX = undefined;
      route.arrivalVelocityY = undefined;
      return false;
    }

    this.cat.setFlipX(facingLeft);
    route.arrivalContactStartedAt ??= time;
    if (time - route.arrivalContactStartedAt < FOOD_BOWL_ROUTE_CONTACT_MS) {
      this.playCatAction("idle", true);
      return false;
    }

    return true;
  }

  private nextCompanionWalkVelocity(distance: number) {
    if (!this.cat) {
      return 0;
    }

    const speed = this.companionWalkTargetSpeed(Math.abs(distance));
    const targetVelocityX = distance > 0 ? speed : -speed;
    return Phaser.Math.Linear(this.cat.body.velocity.x, targetVelocityX, 0.08);
  }

  private nextCompanionWalkRouteSpeed(distance: number) {
    if (!this.cat) {
      return 0;
    }

    const currentSpeed = Math.hypot(this.cat.body.velocity.x, this.cat.body.velocity.y);
    return Phaser.Math.Linear(currentSpeed, this.companionWalkTargetSpeed(distance), 0.08);
  }

  private foodBowlPathRemainingDistance(path: FoodBowlPath, finalPoint?: FoodBowlWaypoint) {
    if (!this.cat) {
      return 0;
    }

    const points = [...path.waypoints.slice(path.waypointIndex), ...(finalPoint ? [finalPoint] : [])];
    let previousPoint = { x: this.cat.x, y: this.cat.y };
    return points.reduce((total, point) => {
      const segment = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
      previousPoint = point;
      return total + segment;
    }, 0);
  }

  private companionWalkTargetSpeed(distance: number) {
    const baseSpeed = getCompanionMovementSpeed(this.temperament);
    const distanceEase = Phaser.Math.Clamp(distance / 92, 0.22, 0.94);
    const time = this.time?.now ?? 0;
    const walkPaceSeed = this.walkPaceSeed ?? 0;
    const curiousSlowdown = 0.82 + Math.sin(time * 0.0024 + walkPaceSeed) * 0.1;
    const tinyHesitation = Math.sin(time * 0.0015 + walkPaceSeed * 0.7) > 0.96 ? 0.7 : 1;
    return baseSpeed * distanceEase * curiousSlowdown * tinyHesitation;
  }

  private startFloorPause(time: number) {
    this.currentZone = "floor";
    this.routine = "floorPause";
    this.routineHoldUntil = time + Phaser.Math.Between(700, 1200);
  }

  private holdAtPlant() {
    if (!this.cat) {
      return;
    }
    this.currentZone = "plant";
    this.cat.body.setAllowGravity(false);
    this.cat.setY(FLOOR_STAND_Y);
    this.cat.setVelocityX(0);
    this.cat.setFlipX(false);
  }

  private resetPlantLeaf() {
    this.plantLeaf?.setAngle(0);
  }

  private cancelPlantTouch(time: number) {
    if (this.routine !== "approachPlantTouch") {
      this.startPlantTouchCooldown(time);
    }
    this.resetPlantLeaf();
    this.plantTouchStartedAt = 0;
    this.plantTouchCooldownStarted = false;
    this.activeIntent = undefined;
    this.startFloorPause(time);
  }

  private startPlantTouchCooldown(time: number) {
    if (this.plantTouchCooldownStarted) {
      return;
    }
    this.planner.recordPlantTouch(this.sessionElapsedMs(time));
    this.plantTouchCooldownStarted = true;
  }

  private completeActiveIntent() {
    if (!this.activeIntent) {
      return;
    }
    this.planner.recordIntentCompleted(this.activeIntent.kind);
    this.activeIntent = undefined;
  }

  private sessionElapsedMs(time: number) {
    return Math.max(time - this.sessionStartedAt, 0);
  }

  private startReturnEncounter(time: number) {
    if (!this.cat) {
      return;
    }

    const intent = this.planner.next({
      currentZone: "floor",
      sessionElapsedMs: 0,
      localHour: new Date().getHours(),
    });
    this.activeIntent = intent;

    if (intent.kind === "window-watch") {
      this.currentZone = "window-bench";
      this.routine = "perchWindowBench";
      this.windowBenchTargetX = (WINDOW_BENCH_SURFACE.xMin + WINDOW_BENCH_SURFACE.xMax) / 2;
      this.cat.setPosition(this.windowBenchTargetX, WINDOW_BENCH_SURFACE.y);
      this.routineHoldUntil = time + intent.dwellMs;
      this.windowBenchStillUntil = time + 1_200;
      this.windowBenchDecisionAt = this.windowBenchStillUntil + 800;
      this.playCatAction("sit", true);
      return;
    }

    if (intent.kind === "cat-bed-rest") {
      this.currentZone = "cat-bed";
      this.routine = "restCatBed";
      this.cat.setPosition(CAT_BED_SURFACE.x, CAT_BED_SURFACE.y);
      this.routineHoldUntil = time + intent.dwellMs;
      this.playCatAction("lie", true);
      return;
    }

    if (intent.kind === "blanket-rest") {
      this.currentZone = "blanket";
      this.routine = "restBlanket";
      this.cat.setPosition(BLANKET_REST_X, BLANKET_STAND_Y);
      this.cat.setFlipX(true);
      this.routineHoldUntil = time + intent.dwellMs;
      this.playCatAction("lie", true);
      return;
    }

    if (intent.kind === "eat") {
      this.currentZone = "food-bowl";
      this.routine = "eatFoodBowl";
      this.cat.setPosition(FOOD_BOWL_X, FOOD_BOWL_STAND_Y);
      this.cat.setFlipX(false);
      this.routineHoldUntil = time + intent.dwellMs;
      this.playCatAction("eat", true);
      return;
    }

    if (intent.kind === "plant-inspect") {
      this.currentZone = "plant";
      this.routine = "inspectPlant";
      this.cat.setPosition(PLANT_INSPECT_X, FLOOR_STAND_Y);
      this.cat.setFlipX(false);
      this.routineHoldUntil = time + intent.dwellMs;
      this.playCatAction("interact", true);
      return;
    }

    this.cat.setPosition(FLOOR_PAUSE_X, FLOOR_STAND_Y);
    this.beginIntent(intent, time);
  }

  private scheduleNextIntent(time: number) {
    const intent = this.planner.next({
      currentZone: this.currentZone,
      sessionElapsedMs: this.sessionElapsedMs(time),
      localHour: new Date().getHours(),
    });
    this.beginIntent(intent, time);
  }

  private beginIntent(intent: CompanionIntent, time: number) {
    this.activeIntent = intent;
    this.routine = INTENT_ROUTINES[intent.kind];
    if (isFloorRoutine(this.routine)) {
      this.routineHoldUntil = time + intent.dwellMs;
    } else {
      this.routineHoldUntil = time;
    }
  }

  private activeDwellMs(fallback: number) {
    const dwell = this.activeIntent?.dwellMs ?? fallback;
    return this.debugMotionReview ? Math.min(dwell, DEBUG_REVIEW_DWELL_MS) : dwell;
  }

  private debugHoldDuration(fallback: number) {
    return this.debugMotionReview ? Math.min(fallback, DEBUG_REVIEW_DWELL_MS) : fallback;
  }

  private publishDebugMotionState() {
    if (!this.debugMotionReview) {
      return;
    }

    document.documentElement.dataset.catstarMotionRoutine = this.routine;
    document.documentElement.dataset.catstarMotionState =
      this.routine === "floorPause" ? "complete" : "running";
  }

  private updateForegroundTransition(time: number, returning: boolean) {
    if (!this.cat) {
      return;
    }

    const progress = Phaser.Math.Clamp(
      (time - this.foregroundTransitionStartedAt) / FOREGROUND_TRANSITION_MS,
      0,
      1,
    );
    const easedProgress = Phaser.Math.Easing.Sine.InOut(progress);
    const fromY = returning ? FOREGROUND_STAND_Y : FLOOR_STAND_Y;
    const toY = returning ? FLOOR_STAND_Y : FOREGROUND_STAND_Y;
    const fromScale = returning ? FOREGROUND_SCALE : CAT_BASE_SCALE;
    const toScale = returning ? CAT_BASE_SCALE : FOREGROUND_SCALE;

    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.cat.setY(Phaser.Math.Linear(fromY, toY, easedProgress));
    this.cat.setScale(Phaser.Math.Linear(fromScale, toScale, easedProgress));
    this.cat.setDepth(returning ? (progress >= 0.5 ? 5 : 7) : progress >= 0.5 ? 7 : 5);
    this.playCatAction(returning ? "walk" : "interact");

    if (progress < 1) {
      return;
    }

    if (returning) {
      this.cat.setY(FLOOR_STAND_Y);
      this.cat.setScale(CAT_BASE_SCALE);
      this.cat.setDepth(5);
      this.completeActiveIntent();
      this.startFloorPause(time);
      return;
    }

    this.routine = "acknowledgeUser";
    this.routineHoldUntil = time + this.activeDwellMs(1_800);
    this.playCatAction("interact", true);
  }

  private chooseWindowBenchTargetX() {
    const currentX = this.cat?.x ?? (WINDOW_BENCH_SURFACE.xMin + WINDOW_BENCH_SURFACE.xMax) / 2;
    let nextX = currentX;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      nextX = Phaser.Math.Between(WINDOW_BENCH_SURFACE.xMin, WINDOW_BENCH_SURFACE.xMax);
      if (Math.abs(nextX - currentX) >= 28) {
        break;
      }
    }

    return nextX;
  }

  private moveOnWindowBenchSurface(targetX: number) {
    if (!this.cat) {
      return false;
    }

    const boundedTargetX = Phaser.Math.Clamp(targetX, WINDOW_BENCH_SURFACE.xMin, WINDOW_BENCH_SURFACE.xMax);
    this.cat.x = Phaser.Math.Clamp(this.cat.x, WINDOW_BENCH_SURFACE.xMin, WINDOW_BENCH_SURFACE.xMax);
    this.cat.setY(WINDOW_BENCH_SURFACE.y);
    return this.moveTowardTarget(boundedTargetX);
  }

  private startScriptedJump(
    time: number,
    options: {
      toX: number;
      toY: number;
      duration: number;
      peakHeight: number;
      landingRoutine: CatRoutine;
    },
  ) {
    if (!this.cat) {
      return;
    }

    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.cat.setFlipX(options.toX < this.cat.x);
    this.scriptedJump = {
      fromX: this.cat.x,
      fromY: this.cat.y,
      toX: options.toX,
      toY: options.toY,
      startedAt: time,
      duration: options.duration,
      peakHeight: options.peakHeight,
      landingRoutine: options.landingRoutine,
    };
    this.playCatAction("jump", true);
  }

  private updateScriptedJump(time: number) {
    if (!this.cat || !this.scriptedJump) {
      return;
    }

    const jump = this.scriptedJump;
    const progress = Phaser.Math.Clamp((time - jump.startedAt) / jump.duration, 0, 1);
    const easedProgress = Phaser.Math.Easing.Sine.InOut(progress);
    const arcY = Math.sin(progress * Math.PI) * jump.peakHeight;
    const x = Phaser.Math.Linear(jump.fromX, jump.toX, easedProgress);
    const y = Phaser.Math.Linear(jump.fromY, jump.toY, easedProgress) - arcY;

    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.cat.setPosition(x, y);
    this.playCatAction("jump");

    if (progress >= 1) {
      this.cat.setPosition(jump.toX, jump.toY);
      this.scriptedJump = undefined;
      this.routine = jump.landingRoutine;
      if (jump.landingRoutine === "perchWindowBench") {
        this.currentZone = "window-bench";
        this.cat.body.setAllowGravity(false);
        this.cat.setY(WINDOW_BENCH_SURFACE.y);
        this.windowBenchStillUntil = time + Phaser.Math.Between(900, 1700);
        this.windowBenchDecisionAt = this.windowBenchStillUntil + Phaser.Math.Between(600, 1300);
        this.windowBenchTargetX = this.chooseWindowBenchTargetX();
        this.routineHoldUntil = time + this.activeDwellMs(6_400);
        this.playCatAction("sit", true);
        return;
      }

      if (jump.landingRoutine === "restBlanket") {
        this.currentZone = "blanket";
        this.cat.body.setAllowGravity(false);
        this.routineHoldUntil = time + this.activeDwellMs(4_800);
        this.playCatAction("lie", true);
        return;
      }

      if (jump.landingRoutine === "restCatBed") {
        this.currentZone = "cat-bed";
        this.cat.body.setAllowGravity(false);
        this.cat.setY(CAT_BED_SURFACE.y);
        this.routineHoldUntil = time + this.activeDwellMs(5_000);
        this.cat.setFlipX(false);
        this.playCatAction("lie", true);
        return;
      }

      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      this.currentZone = "floor";
      this.routineHoldUntil = time + Phaser.Math.Between(700, 1200);
      this.playCatAction("idle", true);
    }
  }

  private addStardust() {
    const particles = this.add.particles(0, 0, "star-pixel", {
      x: { min: 250, max: 390 },
      y: { min: 90, max: 210 },
      lifespan: 1600,
      speedY: { min: -8, max: 16 },
      speedX: { min: -14, max: 14 },
      quantity: 1,
      frequency: 360,
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
    });
    particles.setDepth(10);
  }

  private createForegroundObjects() {
    this.add.image(320, 180, "window-room-foreground-cat-bed").setDisplaySize(640, 360).setDepth(6);
    this.add.image(320, 180, "window-room-foreground-blanket").setDisplaySize(640, 360).setDepth(6);
  }

  private createPlantLeaf() {
    this.plantLeaf = this.add
      .image(PLANT_LEAF_PIVOT_X, PLANT_LEAF_PIVOT_Y, "window-room-plant-leaf")
      .setOrigin(43 / 47, 15 / 24)
      .setDepth(6);
  }

  private createCatAnimations() {
    const spec = this.cache.json.get("cat-animation-spec") as CatAnimationSpec;
    (Object.keys(spec.actions) as CatAction[]).forEach((action) => {
      const config = spec.actions[action];
      const frames = this.anims.generateFrameNumbers(`cat-${action}`, {
        start: 0,
        end: config.frames - 1,
      });

      this.anims.create({
        key: `cat-${action}-anim`,
        frames,
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
    });
    this.anims.create({
      key: "cat-interact-brief-anim",
      frames: [1, 0, 1, 0].map((frame) => ({ key: "cat-interact", frame })),
      frameRate: 6,
      repeat: 0,
    });
    this.anims.create({
      key: "cat-sleep-touch-anim",
      frames: [3, 2, 3, 0].map((frame) => ({ key: "cat-sleep", frame })),
      frameRate: 6,
      repeat: 0,
    });
  }

  private playCatReaction(action: CatReaction, restart = false) {
    if (action !== "interact-brief" && action !== "sleep-touch") {
      this.playCatAction(action, restart);
      return;
    }
    if (!this.cat) {
      return;
    }

    const key = action === "interact-brief" ? "cat-interact-brief-anim" : "cat-sleep-touch-anim";
    if (!restart && this.cat.anims.currentAnim?.key === key) {
      return;
    }
    this.cat.play(key, !restart);
  }

  private playCatAction(action: CatAction, restart = false) {
    if (!this.cat) {
      return;
    }

    const key = `cat-${action}-anim`;
    if (!restart && this.cat.anims.currentAnim?.key === key) {
      return;
    }

    this.cat.play(key, !restart);
  }

  private createParticleTexture() {
    const star = this.make.graphics({ x: 0, y: 0 }, false);
    star.fillStyle(0xffe88a);
    star.fillRect(0, 0, 4, 4);
    star.generateTexture("star-pixel", 4, 4);
    star.destroy();
  }

  private createPhysicsTexture() {
    const pixel = this.make.graphics({ x: 0, y: 0 }, false);
    pixel.fillStyle(0xffffff, 0);
    pixel.fillRect(0, 0, 1, 1);
    pixel.generateTexture("physics-pixel", 1, 1);
    pixel.destroy();
  }
}
