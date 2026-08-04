import { describe, expect, it } from "vitest";
import {
  chooseCompanionWhisper,
  chooseTouchOutcome,
  createCompanionPlanner,
  getCompanionMovementSpeed,
  type CompanionIntentKind,
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
      "plant-touch",
      "floor-sit",
      "floor-groom",
      "floor-sleep",
      "floor-stretch",
      "approach-user",
    ]);

    for (const temperament of TEMPERAMENTS) {
      const actual = new Set<CompanionIntentKind>();
      for (let sample = 0; sample < 2_000; sample += 1) {
        const planner = createCompanionPlanner({
          temperament,
          random: sequenceRandom([sample / 2_000, 0.5]),
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

  it("keeps plant touch unavailable during the opening window", () => {
    const selected = Array.from({ length: 200 }, (_, sample) => {
      const planner = createCompanionPlanner({
        temperament: "CURIOUS",
        random: sequenceRandom([sample / 200, 0.5]),
      });
      return planner.next({
        currentZone: "floor",
        sessionElapsedMs: 29_999,
        localHour: 18,
      }).kind;
    });

    expect(selected).not.toContain("plant-touch");
  });

  it("starts plant touch cooldown on contact and counts only completed other intentions", () => {
    const nextAfterCooldownScenario = (
      completedIntentions: number,
      uncompletedIntentions: number,
      sessionElapsedMs: number,
      finalRandom: number,
    ) => {
      const planner = createCompanionPlanner({
        temperament: "CURIOUS",
        random: sequenceRandom([
          0.81,
          0.5,
          ...Array.from(
            { length: completedIntentions + uncompletedIntentions },
            () => [0, 0.5],
          ).flat(),
          finalRandom,
          0.5,
        ]),
      });
      const nextAt = (elapsedMs: number) =>
        planner.next({
          currentZone: "floor",
          sessionElapsedMs: elapsedMs,
          localHour: 18,
        }).kind;

      expect(nextAt(30_000)).toBe("plant-touch");
      planner.recordPlantTouch(35_000);
      Array.from({ length: completedIntentions }, () => {
        const kind = nextAt(124_999);
        planner.recordIntentCompleted(kind);
      });
      Array.from({ length: uncompletedIntentions }, () => nextAt(124_999));
      return nextAt(sessionElapsedMs);
    };
    const sampleSelections = (
      completedIntentions: number,
      uncompletedIntentions: number,
      sessionElapsedMs: number,
    ) =>
      Array.from({ length: 1_000 }, (_, sample) =>
        nextAfterCooldownScenario(
          completedIntentions,
          uncompletedIntentions,
          sessionElapsedMs,
          sample / 1_000,
        ),
      );

    expect(sampleSelections(4, 1, 125_001)).not.toContain("plant-touch");
    expect(sampleSelections(5, 0, 124_999)).not.toContain("plant-touch");
    expect(sampleSelections(5, 0, 125_001)).toContain("plant-touch");
  });

  it("does not start cooldown when plant touch is selected but never reaches contact", () => {
    const selections = Array.from({ length: 1_000 }, (_, sample) => {
      const planner = createCompanionPlanner({
        temperament: "CURIOUS",
        random: sequenceRandom([0.81, 0.5, 0, 0.5, 0, 0.5, sample / 1_000, 0.5]),
      });
      const nextAt = (sessionElapsedMs: number) =>
        planner.next({ currentZone: "floor", sessionElapsedMs, localHour: 18 }).kind;

      expect(nextAt(30_000)).toBe("plant-touch");
      nextAt(31_000);
      nextAt(32_000);
      return nextAt(33_000);
    });

    expect(selections).toContain("plant-touch");
  });

  it("makes curious cats most likely to touch the plant without excluding any temperament", () => {
    const countPlantTouches = (temperament: CatTemperament) =>
      Array.from({ length: 2_000 }, (_, sample) => {
        const planner = createCompanionPlanner({
          temperament,
          random: sequenceRandom([sample / 2_000, 0.5]),
        });
        return planner.next({
          currentZone: "floor",
          sessionElapsedMs: 30_000,
          localHour: 18,
        }).kind;
      }).filter((kind) => kind === "plant-touch").length;

    const counts = Object.fromEntries(
      TEMPERAMENTS.map((temperament) => [temperament, countPlantTouches(temperament)]),
    ) as Record<CatTemperament, number>;

    expect(counts.CURIOUS).toBeGreaterThan(counts.QUIET);
    expect(counts.CURIOUS).toBeGreaterThan(counts.LIVELY);
    expect(counts.CURIOUS).toBeGreaterThan(counts.AFFECTIONATE);
    expect(Object.values(counts).every((count) => count > 0)).toBe(true);
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
  it("shows a short whisper only some of the time", () => {
    expect(chooseCompanionWhisper("AFFECTIONATE", sequenceRandom([0.9]))).toBeNull();
    expect(chooseCompanionWhisper("AFFECTIONATE", sequenceRandom([0.1, 0]))).toBe("我在呢。");
    expect(chooseCompanionWhisper("QUIET", sequenceRandom([0.3]))).toBeNull();
    expect(chooseCompanionWhisper("AFFECTIONATE", sequenceRandom([0.3, 0]))).toBe("我在呢。");
  });

  it("varies full acknowledgement frequency and pacing by temperament", () => {
    expect(chooseTouchOutcome("AFFECTIONATE", false, sequenceRandom([0.5]))).toEqual({
      disposition: "acknowledge",
      durationMs: 1_700,
    });
    expect(chooseTouchOutcome("QUIET", false, sequenceRandom([0.5]))).toEqual({
      disposition: "brief-acknowledge",
      durationMs: 700,
    });
    expect(chooseTouchOutcome("AFFECTIONATE", false, sequenceRandom([0.85]))).toEqual({
      disposition: "brief-acknowledge",
      durationMs: 700,
    });
  });

  it("varies sleep waking by temperament", () => {
    expect(chooseTouchOutcome("QUIET", true, sequenceRandom([0.079]))).toMatchObject({
      disposition: "wake",
      durationMs: 1_400,
    });
    expect(chooseTouchOutcome("QUIET", true, sequenceRandom([0.08]))).toMatchObject({
      disposition: "remain-asleep",
      durationMs: 900,
    });
    expect(chooseTouchOutcome("LIVELY", true, sequenceRandom([0.239]))).toMatchObject({
      disposition: "wake",
      durationMs: 1_400,
    });
    expect(chooseTouchOutcome("LIVELY", true, sequenceRandom([0.24]))).toMatchObject({
      disposition: "remain-asleep",
      durationMs: 900,
    });
  });
});

describe("companion policy", () => {
  it("owns temperament-specific movement pacing", () => {
    expect(getCompanionMovementSpeed("LIVELY")).toBeGreaterThan(
      getCompanionMovementSpeed("QUIET"),
    );
    expect(getCompanionMovementSpeed("AFFECTIONATE")).toBe(60);
  });
});
