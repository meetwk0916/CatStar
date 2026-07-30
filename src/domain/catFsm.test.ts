import { describe, expect, it } from "vitest";
import {
  chooseCompanionWhisper,
  chooseTouchOutcome,
  chooseTouchResponse,
  createCompanionPlanner,
  getCompanionMovementSpeed,
  getCompanionReaction,
  type CompanionIntentKind,
  type TouchResponseKind,
} from "./catFsm";
import type { CatTemperament } from "../types";

const TEMPERAMENTS: CatTemperament[] = ["QUIET", "CURIOUS", "LIVELY", "AFFECTIONATE"];

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

describe("companion planner", () => {
  it("keeps every companion intention reachable for every temperament", () => {
    const expected = new Set<CompanionIntentKind>([
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
    ]);

    for (const temperament of TEMPERAMENTS) {
      const actual = new Set<CompanionIntentKind>();
      for (let sample = 0; sample < 200; sample += 1) {
        const planner = createCompanionPlanner({
          temperament,
          random: sequenceRandom([sample / 200, 0.5]),
        });
        actual.add(
          planner.next({
            currentZone: "plant",
            sessionElapsedMs: 60_000,
            localHour: 18,
          }).kind,
        );
      }
      expect(actual).toEqual(expected);
    }
  });

  it("avoids repeating either of the two most recent intentions", () => {
    const planner = createCompanionPlanner({
      temperament: "AFFECTIONATE",
      random: sequenceRandom([0, 0.4, 0.8, 0.2]),
    });
    const selected: CompanionIntentKind[] = [];

    for (let index = 0; index < 24; index += 1) {
      selected.push(
        planner.next({
          currentZone: "floor",
          sessionElapsedMs: 60_000,
          localHour: 18,
        }).kind,
      );
    }

    selected.forEach((kind, index) => {
      expect(kind).not.toBe(selected[index - 1]);
      expect(kind).not.toBe(selected[index - 2]);
    });
  });

  it("keeps deep sleep unavailable during the opening wakeful window", () => {
    const planner = createCompanionPlanner({
      temperament: "QUIET",
      random: sequenceRandom([0.75, 0.9, 0.7, 0.2]),
    });

    const selected = Array.from({ length: 30 }, () =>
      planner.next({
        currentZone: "floor",
        sessionElapsedMs: 10_000,
        localHour: 1,
      }),
    );

    expect(selected.every((intent) => intent.kind !== "floor-sleep")).toBe(true);
  });

  it("keeps dwell timing inside the domain-owned range", () => {
    const planner = createCompanionPlanner({
      temperament: "LIVELY",
      random: sequenceRandom([0, 0, 0.99, 0.99]),
    });

    const intents = Array.from({ length: 12 }, () =>
      planner.next({
        currentZone: "floor",
        sessionElapsedMs: 90_000,
        localHour: 14,
      }),
    );

    expect(intents.every((intent) => intent.dwellMs >= 1_400 && intent.dwellMs <= 11_000)).toBe(true);
  });

  it("makes lively jump destinations more likely while keeping selection probabilistic", () => {
    const jumpIntents = new Set<CompanionIntentKind>([
      "window-watch",
      "cat-bed-rest",
      "blanket-rest",
    ]);
    const countJumpSelections = (temperament: CatTemperament) =>
      Array.from({ length: 1_000 }, (_, sample) => {
        const planner = createCompanionPlanner({
          temperament,
          random: sequenceRandom([sample / 1_000, 0.5]),
        });
        return planner.next({
          currentZone: "food-bowl",
          sessionElapsedMs: 60_000,
          localHour: 18,
        }).kind;
      }).filter((kind) => jumpIntents.has(kind)).length;

    const lively = countJumpSelections("LIVELY");
    expect(lively).toBeGreaterThan(countJumpSelections("QUIET"));
    expect(lively).toBeGreaterThan(countJumpSelections("AFFECTIONATE"));
    expect(lively).toBeLessThan(1_000);
  });
});

describe("touch responses", () => {
  it("keeps every response available to every temperament", () => {
    const expected = new Set<TouchResponseKind>([
      "slow-blink",
      "curious-sniff",
      "gentle-nuzzle",
      "tail-lift",
    ]);

    for (const temperament of TEMPERAMENTS) {
      const actual = new Set<TouchResponseKind>();
      for (let sample = 0; sample < 100; sample += 1) {
        actual.add(chooseTouchResponse(temperament, () => sample / 100));
      }
      expect(actual).toEqual(expected);
    }
  });

  it("shows a short whisper only some of the time", () => {
    expect(chooseCompanionWhisper(sequenceRandom([0.9]))).toBeNull();
    expect(chooseCompanionWhisper(sequenceRandom([0.1, 0]))).toBe("我在呢。");
  });

  it("keeps sleep-aware touch outcomes in the domain", () => {
    expect(chooseTouchOutcome("QUIET", true, sequenceRandom([0, 0.14]))).toMatchObject({
      disposition: "wake",
      durationMs: 1_400,
    });
    expect(chooseTouchOutcome("QUIET", true, sequenceRandom([0, 0.15]))).toMatchObject({
      disposition: "remain-asleep",
      durationMs: 900,
    });
    expect(chooseTouchOutcome("QUIET", false, sequenceRandom([0]))).toMatchObject({
      disposition: "acknowledge",
      durationMs: 1_400,
    });
  });
});

describe("companion policy", () => {
  it("preserves deterministic companion copy selection", () => {
    expect(getCompanionReaction("INTERACTING", 0)).toBe("我听见你啦。");
    expect(getCompanionReaction("INTERACTING", 0.99)).toBe("轻轻摸摸也收到啦。");
  });

  it("owns temperament-specific movement pacing", () => {
    expect(getCompanionMovementSpeed("LIVELY")).toBeGreaterThan(
      getCompanionMovementSpeed("QUIET"),
    );
    expect(getCompanionMovementSpeed("AFFECTIONATE")).toBe(60);
  });
});
