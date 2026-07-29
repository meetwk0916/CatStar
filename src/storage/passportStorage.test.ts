import { afterEach, describe, expect, it, vi } from "vitest";
import { clearPassport, loadPassport, savePassport } from "./passportStorage";

function stubStoredPassport(value: unknown) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn(() => JSON.stringify(value)),
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("passport storage migration", () => {
  it("loads the current coat preset and temperament fields", () => {
    stubStoredPassport({
      id: "current",
      catName: "小灰",
      ownerName: "家人",
      coatPreset: "GRAY_WHITE_TABBY",
      temperament: "AFFECTIONATE",
      favoriteSnack: "小鱼干",
      passedDate: "2026-06-01",
      createdAt: 1,
      readLetters: [],
      isFarewellCompleted: false,
    });

    expect(loadPassport()).toMatchObject({
      coatPreset: "GRAY_WHITE_TABBY",
      temperament: "AFFECTIONATE",
    });
  });

  it("migrates legacy color and personality without keeping old fields", () => {
    stubStoredPassport({
      id: "legacy",
      catName: "小橘",
      ownerName: "家人",
      colorPalette: "ORANGE",
      personality: "CLINGY",
      favoriteSnack: "冻干",
      passedDate: "2025-12-01",
      createdAt: 1,
      readLetters: [1],
      isFarewellCompleted: false,
    });

    expect(loadPassport()).toEqual({
      schemaVersion: 1,
      id: "legacy",
      catName: "小橘",
      ownerName: "家人",
      coatPreset: "ORANGE_TABBY",
      temperament: "AFFECTIONATE",
      favoriteSnack: "冻干",
      passedDate: "2025-12-01",
      createdAt: 1,
      readLetters: [1],
      isFarewellCompleted: false,
    });
  });

  it("rejects malformed reading progress", () => {
    stubStoredPassport({
      id: "broken",
      catName: "小灰",
      ownerName: "家人",
      coatPreset: "GRAY_WHITE_TABBY",
      temperament: "AFFECTIONATE",
      favoriteSnack: "小鱼干",
      passedDate: "",
      createdAt: 1,
      readLetters: {},
      isFarewellCompleted: false,
    });

    expect(loadPassport()).toBeNull();
  });

  it("saves and clears through the single storage key", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    const passport = {
      schemaVersion: 1 as const,
      id: "current",
      catName: "小灰",
      ownerName: "家人",
      coatPreset: "GRAY_WHITE_TABBY" as const,
      temperament: "AFFECTIONATE" as const,
      favoriteSnack: "小鱼干",
      passedDate: "",
      createdAt: 1,
      readLetters: [],
      isFarewellCompleted: false,
    };

    savePassport(passport);
    expect(JSON.parse(values.get("catstar.passport.v1") ?? "")).toEqual(passport);
    clearPassport();
    expect(values.has("catstar.passport.v1")).toBe(false);
  });
});
