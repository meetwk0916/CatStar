import type { CatFsmState, CatPersonality } from "../types";

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
    activities: [
      "approachWindowBench",
      "approachBlanket",
      "approachWindowBench",
      "approachCatBed",
      "approachPlant",
      "approachFoodBowl",
    ],
    holds: {
      floorPause: { min: 900, max: 1500 },
      windowBench: { min: 6500, max: 9000 },
      catBed: { min: 3800, max: 5600 },
      foodBowl: { min: 3600, max: 5000 },
      plant: { min: 2200, max: 3400 },
      blanket: { min: 4200, max: 6000 },
    },
  },
  ALOOFS: {
    speed: 56,
    activities: [
      "approachCatBed",
      "approachWindowBench",
      "approachBlanket",
      "approachCatBed",
      "approachPlant",
      "approachFoodBowl",
    ],
    holds: {
      floorPause: { min: 1200, max: 1900 },
      windowBench: { min: 6200, max: 8400 },
      catBed: { min: 6200, max: 8400 },
      foodBowl: { min: 3200, max: 4500 },
      plant: { min: 1800, max: 2800 },
      blanket: { min: 5600, max: 7600 },
    },
  },
  GLUTTON: {
    speed: 66,
    activities: [
      "approachFoodBowl",
      "approachWindowBench",
      "approachFoodBowl",
      "approachCatBed",
      "approachPlant",
      "approachBlanket",
    ],
    holds: {
      floorPause: { min: 700, max: 1200 },
      windowBench: { min: 4800, max: 6600 },
      catBed: { min: 3400, max: 5000 },
      foodBowl: { min: 6200, max: 8200 },
      plant: { min: 1800, max: 2800 },
      blanket: { min: 3400, max: 5000 },
    },
  },
  ENERGY: {
    speed: 74,
    activities: [
      "approachWindowBench",
      "approachPlant",
      "approachBlanket",
      "approachWindowBench",
      "approachFoodBowl",
      "approachCatBed",
    ],
    holds: {
      floorPause: { min: 500, max: 900 },
      windowBench: { min: 3200, max: 4800 },
      catBed: { min: 2400, max: 3600 },
      foodBowl: { min: 2800, max: 4000 },
      plant: { min: 3000, max: 4400 },
      blanket: { min: 2600, max: 3800 },
    },
  },
};

export function getActivityRoutine(
  personality: CatPersonality,
  activityIndex: number,
): { routine: ActivityRoutine; nextActivityIndex: number } {
  const activities = PROFILES[personality].activities;
  const normalizedIndex = Math.max(0, Math.floor(activityIndex));
  return {
    routine: activities[normalizedIndex % activities.length],
    nextActivityIndex: normalizedIndex + 1,
  };
}

export function getNextActivityIndexAfter(
  personality: CatPersonality,
  routine: ActivityRoutine,
): number {
  const index = PROFILES[personality].activities.indexOf(routine);
  return index < 0 ? 0 : index + 1;
}

export function getRoutineHoldDuration(
  personality: CatPersonality,
  kind: RoutineHoldKind,
  random = Math.random(),
): number {
  const range = PROFILES[personality].holds[kind];
  const boundedRandom = Math.min(0.999_999, Math.max(0, random));
  return Math.floor(range.min + (range.max - range.min + 1) * boundedRandom);
}

export function getMovementSpeed(personality: CatPersonality): number {
  return PROFILES[personality].speed;
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
