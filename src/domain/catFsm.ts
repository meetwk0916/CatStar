import type { CatTemperament } from "../types";

const TEMPERAMENT_MOVEMENT_SPEEDS: Record<CatTemperament, number> = {
  CURIOUS: 64,
  QUIET: 56,
  AFFECTIONATE: 60,
  LIVELY: 74,
};

export function getCompanionMovementSpeed(temperament: CatTemperament): number {
  return TEMPERAMENT_MOVEMENT_SPEEDS[temperament];
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
  | "plant-touch"
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
  recordPlantTouch(sessionElapsedMs: number): void;
  recordIntentCompleted(kind: CompanionIntentKind): void;
}

export type TouchDisposition = "brief-acknowledge" | "acknowledge" | "remain-asleep" | "wake";

export interface TouchOutcome {
  disposition: TouchDisposition;
  durationMs: number;
}

interface PlannerOptions {
  temperament: CatTemperament;
  random?: () => number;
}

type IntentWeights = Record<CompanionIntentKind, number>;

const AWAKE_ENTRY_MS = 30_000;
const RECENT_INTENT_LIMIT = 2;
const PLANT_TOUCH_COOLDOWN_MS = 90_000;
const PLANT_TOUCH_OTHER_INTENTS = 5;
const TOUCH_ACKNOWLEDGEMENT_MS: Record<CatTemperament, number> = {
  QUIET: 1_500,
  CURIOUS: 1_300,
  AFFECTIONATE: 1_700,
  LIVELY: 1_000,
};
const FULL_TOUCH_ACKNOWLEDGEMENT_CHANCE: Record<CatTemperament, number> = {
  QUIET: 0.35,
  CURIOUS: 0.6,
  AFFECTIONATE: 0.85,
  LIVELY: 0.45,
};
const BRIEF_TOUCH_ACKNOWLEDGEMENT_MS = 700;
const SLEEP_WAKE_CHANCE: Record<CatTemperament, number> = {
  QUIET: 0.08,
  CURIOUS: 0.16,
  AFFECTIONATE: 0.12,
  LIVELY: 0.24,
};
const WHISPER_CHANCE: Record<CatTemperament, number> = {
  QUIET: 0.22,
  CURIOUS: 0.3,
  AFFECTIONATE: 0.45,
  LIVELY: 0.28,
};

const INTENT_ORDER: CompanionIntentKind[] = [
  "window-watch",
  "cat-bed-rest",
  "blanket-rest",
  "eat",
  "plant-inspect",
  "plant-touch",
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
  "plant-touch": [3_000, 3_000],
  "floor-sit": [3_800, 6_400],
  "floor-groom": [8_000, 12_000],
  "floor-sleep": [7_000, 11_000],
  "floor-stretch": [2_600, 3_400],
  "approach-user": [1_400, 2_200],
};

const TEMPERAMENT_INTENT_WEIGHTS: Record<CatTemperament, IntentWeights> = {
  QUIET: {
    "window-watch": 22,
    "cat-bed-rest": 18,
    "blanket-rest": 14,
    eat: 5,
    "plant-inspect": 7,
    "plant-touch": 1,
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
    "plant-touch": 4,
    "floor-sit": 12,
    "floor-groom": 10,
    "floor-sleep": 6,
    "floor-stretch": 7,
    "approach-user": 6,
  },
  LIVELY: {
    "window-watch": 22,
    "cat-bed-rest": 17,
    "blanket-rest": 17,
    eat: 7,
    "plant-inspect": 10,
    "plant-touch": 2,
    "floor-sit": 6,
    "floor-groom": 4,
    "floor-sleep": 3,
    "floor-stretch": 7,
    "approach-user": 7,
  },
  AFFECTIONATE: {
    "window-watch": 14,
    "cat-bed-rest": 12,
    "blanket-rest": 15,
    eat: 7,
    "plant-inspect": 7,
    "plant-touch": 1,
    "floor-sit": 14,
    "floor-groom": 8,
    "floor-sleep": 5,
    "floor-stretch": 6,
    "approach-user": 20,
  },
};

const INTENT_ZONE: Partial<Record<CompanionIntentKind, CompanionZone>> = {
  "window-watch": "window-bench",
  "cat-bed-rest": "cat-bed",
  "blanket-rest": "blanket",
  eat: "food-bowl",
  "plant-inspect": "plant",
  "plant-touch": "plant",
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
  let lastPlantTouchAt: number | null = null;
  let otherIntentsSincePlantTouch = 0;

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

      const plantTouchCoolingDown =
        lastPlantTouchAt !== null &&
        (context.sessionElapsedMs - lastPlantTouchAt < PLANT_TOUCH_COOLDOWN_MS ||
          otherIntentsSincePlantTouch < PLANT_TOUCH_OTHER_INTENTS);
      if (context.sessionElapsedMs < AWAKE_ENTRY_MS || plantTouchCoolingDown) {
        weights["plant-touch"] = 0;
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
    recordPlantTouch(sessionElapsedMs) {
      lastPlantTouchAt = sessionElapsedMs;
      otherIntentsSincePlantTouch = 0;
    },
    recordIntentCompleted(kind) {
      if (lastPlantTouchAt === null || kind === "plant-touch") {
        return;
      }
      otherIntentsSincePlantTouch = Math.min(
        otherIntentsSincePlantTouch + 1,
        PLANT_TOUCH_OTHER_INTENTS,
      );
    },
  };
}

export function chooseTouchOutcome(
  temperament: CatTemperament,
  sleeping: boolean,
  random: () => number = Math.random,
): TouchOutcome {
  if (!sleeping) {
    const playsFullAcknowledgement =
      clampRandom(random()) < FULL_TOUCH_ACKNOWLEDGEMENT_CHANCE[temperament];
    return {
      disposition: playsFullAcknowledgement ? "acknowledge" : "brief-acknowledge",
      durationMs: playsFullAcknowledgement
        ? TOUCH_ACKNOWLEDGEMENT_MS[temperament]
        : BRIEF_TOUCH_ACKNOWLEDGEMENT_MS,
    };
  }

  const wakes = clampRandom(random()) < SLEEP_WAKE_CHANCE[temperament];
  return {
    disposition: wakes ? "wake" : "remain-asleep",
    durationMs: wakes ? 1_400 : 900,
  };
}

export function chooseCompanionWhisper(
  temperament: CatTemperament,
  random: () => number = Math.random,
): string | null {
  if (clampRandom(random()) >= WHISPER_CHANCE[temperament]) {
    return null;
  }

  const whispers = ["我在呢。", "轻轻摸摸也收到啦。", "嗯，我知道你来啦。"];
  return whispers[Math.floor(clampRandom(random()) * whispers.length)];
}
