import type { CatFsmState, CatPersonality, CatTemperament } from "../types";

export type CatRoutine =
  | "approachWindowBench"
  | "perchWindowBench"
  | "approachCatBed"
  | "restCatBed"
  | "approachFoodBowl"
  | "eatFoodBowl"
  | "approachPlant"
  | "inspectPlant"
  | "approachBlanket"
  | "restBlanket"
  | "floorPause";

export type ActivityRoutine = Extract<
  CatRoutine,
  | "approachWindowBench"
  | "approachCatBed"
  | "approachFoodBowl"
  | "approachPlant"
  | "approachBlanket"
>;

export type RoutineHoldKind = "floorPause" | "windowBench" | "catBed" | "foodBowl" | "plant" | "blanket";

interface HoldRange {
  min: number;
  max: number;
}

interface CompanionRoutineProfile {
  speed: number;
  activities: readonly ActivityRoutine[];
  holds: Record<RoutineHoldKind, HoldRange>;
}

const PROFILES: Record<CatPersonality, CompanionRoutineProfile> = {
  CLINGY: {
    speed: 60,
    activities: ["approachWindowBench", "approachBlanket", "approachWindowBench", "approachCatBed", "approachPlant", "approachFoodBowl"],
    holds: { floorPause: { min: 900, max: 1500 }, windowBench: { min: 6500, max: 9000 }, catBed: { min: 3800, max: 5600 }, foodBowl: { min: 3600, max: 5000 }, plant: { min: 2200, max: 3400 }, blanket: { min: 4200, max: 6000 } },
  },
  ALOOFS: {
    speed: 56,
    activities: ["approachCatBed", "approachWindowBench", "approachBlanket", "approachCatBed", "approachPlant", "approachFoodBowl"],
    holds: { floorPause: { min: 1200, max: 1900 }, windowBench: { min: 6200, max: 8400 }, catBed: { min: 6200, max: 8400 }, foodBowl: { min: 3200, max: 4500 }, plant: { min: 1800, max: 2800 }, blanket: { min: 5600, max: 7600 } },
  },
  GLUTTON: {
    speed: 66,
    activities: ["approachFoodBowl", "approachWindowBench", "approachFoodBowl", "approachCatBed", "approachPlant", "approachBlanket"],
    holds: { floorPause: { min: 700, max: 1200 }, windowBench: { min: 4800, max: 6600 }, catBed: { min: 3400, max: 5000 }, foodBowl: { min: 6200, max: 8200 }, plant: { min: 1800, max: 2800 }, blanket: { min: 3400, max: 5000 } },
  },
  ENERGY: {
    speed: 74,
    activities: ["approachWindowBench", "approachPlant", "approachBlanket", "approachWindowBench", "approachFoodBowl", "approachCatBed"],
    holds: { floorPause: { min: 500, max: 900 }, windowBench: { min: 3200, max: 4800 }, catBed: { min: 2400, max: 3600 }, foodBowl: { min: 2800, max: 4000 }, plant: { min: 3000, max: 4400 }, blanket: { min: 2600, max: 3800 } },
  },
};

const TEMPERAMENT_MOVEMENT_SPEEDS: Record<CatTemperament, number> = {
  CURIOUS: 64,
  QUIET: 56,
  AFFECTIONATE: 60,
  LIVELY: 74,
};

export function getActivityRoutine(personality: CatPersonality, activityIndex: number) {
  const activities = PROFILES[personality].activities;
  const normalizedIndex = Math.max(0, Math.floor(activityIndex));
  return { routine: activities[normalizedIndex % activities.length], nextActivityIndex: normalizedIndex + 1 };
}

export function getNextActivityIndexAfter(personality: CatPersonality, routine: ActivityRoutine): number {
  const index = PROFILES[personality].activities.indexOf(routine);
  return index < 0 ? 0 : index + 1;
}

export function getRoutineHoldDuration(personality: CatPersonality, kind: RoutineHoldKind, random = Math.random()): number {
  const range = PROFILES[personality].holds[kind];
  const boundedRandom = Math.min(0.999_999, Math.max(0, random));
  return Math.floor(range.min + (range.max - range.min + 1) * boundedRandom);
}

export function getMovementSpeed(personality: CatPersonality): number {
  return PROFILES[personality].speed;
}

export function getCompanionMovementSpeed(temperament: CatTemperament): number {
  return TEMPERAMENT_MOVEMENT_SPEEDS[temperament];
}

export function getCompanionReaction(state: CatFsmState, random = Math.random()): string {
  const reactions: Record<CatFsmState, string[]> = {
    IDLE: ["我在呢。", "今天的星星很安静。"],
    WALKING: ["我在云朵草坪上走走。", "这里的路软软的。"],
    JUMPING: ["刚刚跳得好高。", "你看见那颗星了吗？"],
    EATING: ["这里也有好吃的。", "我会好好吃饭的。"],
    SLEEPING: ["我睡得很暖。", "梦里也有小小的家。"],
    INTERACTING: ["我听见你啦。", "轻轻摸摸也收到啦。"],
  };
  const options = reactions[state];
  const index = Math.min(options.length - 1, Math.max(0, Math.floor(random * options.length)));
  return options[index];
}

// Deep domain module: callers provide scene context and receive engine-independent intent.

export type CompanionZone =
  | "floor"
  | "window-bench"
  | "cat-bed"
  | "blanket"
  | "food-bowl"
  | "plant";

export type CompanionIntentKind =
  | "window-watch"
  | "cat-bed-rest"
  | "blanket-rest"
  | "eat"
  | "plant-inspect"
  | "floor-sit"
  | "floor-groom"
  | "floor-sleep"
  | "floor-stretch"
  | "approach-user";

export interface CompanionIntent {
  kind: CompanionIntentKind;
  dwellMs: number;
}

export interface CompanionPlannerContext {
  currentZone: CompanionZone;
  sessionElapsedMs: number;
  localHour: number;
}

export interface CompanionPlanner {
  next(context: CompanionPlannerContext): CompanionIntent;
}

export type TouchResponseKind = "slow-blink" | "curious-sniff" | "gentle-nuzzle" | "tail-lift";

interface PlannerOptions {
  temperament: CatTemperament;
  random?: () => number;
}

type IntentWeights = Record<CompanionIntentKind, number>;
type TouchWeights = Record<TouchResponseKind, number>;

const AWAKE_ENTRY_MS = 30_000;
const RECENT_INTENT_LIMIT = 2;

const INTENT_ORDER: CompanionIntentKind[] = [
  "window-watch",
  "cat-bed-rest",
  "blanket-rest",
  "eat",
  "plant-inspect",
  "floor-sit",
  "floor-groom",
  "floor-sleep",
  "floor-stretch",
  "approach-user",
];

const DWELL_RANGES: Record<CompanionIntentKind, readonly [number, number]> = {
  "window-watch": [5_200, 7_600],
  "cat-bed-rest": [4_500, 7_200],
  "blanket-rest": [4_200, 6_800],
  eat: [4_200, 6_200],
  "plant-inspect": [2_200, 3_600],
  "floor-sit": [3_800, 6_400],
  "floor-groom": [4_800, 7_400],
  "floor-sleep": [7_000, 11_000],
  "floor-stretch": [1_600, 2_400],
  "approach-user": [1_400, 2_200],
};

const TEMPERAMENT_INTENT_WEIGHTS: Record<CatTemperament, IntentWeights> = {
  QUIET: {
    "window-watch": 22,
    "cat-bed-rest": 18,
    "blanket-rest": 14,
    eat: 5,
    "plant-inspect": 7,
    "floor-sit": 18,
    "floor-groom": 10,
    "floor-sleep": 8,
    "floor-stretch": 5,
    "approach-user": 2,
  },
  CURIOUS: {
    "window-watch": 15,
    "cat-bed-rest": 12,
    "blanket-rest": 10,
    eat: 10,
    "plant-inspect": 22,
    "floor-sit": 12,
    "floor-groom": 10,
    "floor-sleep": 6,
    "floor-stretch": 7,
    "approach-user": 6,
  },
  LIVELY: {
    "window-watch": 16,
    "cat-bed-rest": 6,
    "blanket-rest": 7,
    eat: 7,
    "plant-inspect": 17,
    "floor-sit": 9,
    "floor-groom": 7,
    "floor-sleep": 3,
    "floor-stretch": 14,
    "approach-user": 14,
  },
  AFFECTIONATE: {
    "window-watch": 14,
    "cat-bed-rest": 12,
    "blanket-rest": 15,
    eat: 7,
    "plant-inspect": 7,
    "floor-sit": 14,
    "floor-groom": 8,
    "floor-sleep": 5,
    "floor-stretch": 6,
    "approach-user": 20,
  },
};

const TEMPERAMENT_TOUCH_WEIGHTS: Record<CatTemperament, TouchWeights> = {
  QUIET: {
    "slow-blink": 44,
    "curious-sniff": 28,
    "gentle-nuzzle": 10,
    "tail-lift": 18,
  },
  CURIOUS: {
    "slow-blink": 24,
    "curious-sniff": 38,
    "gentle-nuzzle": 20,
    "tail-lift": 18,
  },
  LIVELY: {
    "slow-blink": 18,
    "curious-sniff": 28,
    "gentle-nuzzle": 18,
    "tail-lift": 36,
  },
  AFFECTIONATE: {
    "slow-blink": 24,
    "curious-sniff": 16,
    "gentle-nuzzle": 42,
    "tail-lift": 18,
  },
};

const INTENT_ZONE: Partial<Record<CompanionIntentKind, CompanionZone>> = {
  "window-watch": "window-bench",
  "cat-bed-rest": "cat-bed",
  "blanket-rest": "blanket",
  eat: "food-bowl",
  "plant-inspect": "plant",
  "floor-sit": "floor",
  "floor-groom": "floor",
  "floor-sleep": "floor",
  "floor-stretch": "floor",
  "approach-user": "floor",
};

function clampRandom(value: number): number {
  return Math.min(Math.max(value, 0), 0.999_999);
}

function chooseWeighted<T extends string>(
  order: readonly T[],
  weights: Record<T, number>,
  random: () => number,
): T {
  const total = order.reduce((sum, item) => sum + Math.max(weights[item], 0), 0);
  if (total <= 0) {
    return order[0];
  }

  let cursor = clampRandom(random()) * total;
  for (const item of order) {
    cursor -= Math.max(weights[item], 0);
    if (cursor < 0) {
      return item;
    }
  }

  return order[order.length - 1];
}

function chooseDwellMs(kind: CompanionIntentKind, random: () => number): number {
  const [min, max] = DWELL_RANGES[kind];
  return Math.round(min + clampRandom(random()) * (max - min));
}

export function createCompanionPlanner({
  temperament,
  random = Math.random,
}: PlannerOptions): CompanionPlanner {
  const recent: CompanionIntentKind[] = [];

  return {
    next(context) {
      const weights = { ...TEMPERAMENT_INTENT_WEIGHTS[temperament] };

      for (const kind of recent) {
        weights[kind] = 0;
      }

      if (context.sessionElapsedMs < AWAKE_ENTRY_MS) {
        weights["floor-sleep"] = 0;
      } else if (context.localHour >= 22 || context.localHour < 6) {
        weights["floor-sleep"] *= 1.25;
      }

      for (const kind of INTENT_ORDER) {
        if (INTENT_ZONE[kind] === context.currentZone) {
          weights[kind] *= 0.35;
        }
      }

      const kind = chooseWeighted(INTENT_ORDER, weights, random);
      recent.unshift(kind);
      recent.splice(RECENT_INTENT_LIMIT);

      return {
        kind,
        dwellMs: chooseDwellMs(kind, random),
      };
    },
  };
}

export function chooseTouchResponse(
  temperament: CatTemperament,
  random: () => number = Math.random,
): TouchResponseKind {
  const order: TouchResponseKind[] = ["slow-blink", "curious-sniff", "gentle-nuzzle", "tail-lift"];
  return chooseWeighted(order, TEMPERAMENT_TOUCH_WEIGHTS[temperament], random);
}

export function chooseCompanionWhisper(random: () => number = Math.random): string | null {
  if (clampRandom(random()) >= 0.35) {
    return null;
  }

  const whispers = ["我在呢。", "轻轻摸摸也收到啦。", "嗯，我知道你来啦。"];
  return whispers[Math.floor(clampRandom(random()) * whispers.length)];
}
