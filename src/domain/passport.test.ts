import { describe, expect, it } from "vitest";
import { FINAL_LETTER_ID, LETTERS } from "./letters";
import { completeFarewell, createPassport, markLetterRead, parsePassport } from "./passport";

const baseInput = {
  catName: " 小星 ",
  ownerName: " 家人 ",
  colorPalette: "GRAY_WHITE" as const,
  personality: "CLINGY" as const,
  favoriteSnack: " 小鱼干 ",
  passedDate: "2026-07-01",
};

function storedPassport(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    id: "passport-1",
    catName: "小星",
    ownerName: "家人",
    colorPalette: "GRAY_WHITE",
    personality: "CLINGY",
    favoriteSnack: "小鱼干",
    passedDate: "2026-07-01",
    createdAt: 1_700_000_000_000,
    readLetters: [],
    isFarewellCompleted: false,
    ...overrides,
  };
}

describe("passport domain", () => {
  it("creates a versioned passport with normalized required text", () => {
    const passport = createPassport(baseInput, 1234);

    expect(passport).toMatchObject({
      schemaVersion: 1,
      catName: "小星",
      ownerName: "家人",
      favoriteSnack: "小鱼干",
      passedDate: "2026-07-01",
      createdAt: 1234,
      readLetters: [],
      isFarewellCompleted: false,
    });
    expect(passport.id).not.toBe("");
  });

  it("rejects empty required names at the domain boundary", () => {
    expect(() => createPassport({ ...baseInput, catName: "  " })).toThrow("catName");
  });

  it("migrates a legacy record and applies safe defaults to unsupported traits", () => {
    const legacy = storedPassport({
      schemaVersion: undefined,
      colorPalette: "BLUE",
      personality: "UNKNOWN",
      passedDate: "2026-02-30",
    });

    expect(parsePassport(legacy)).toMatchObject({
      schemaVersion: 1,
      colorPalette: "GRAY_WHITE",
      personality: "CLINGY",
      passedDate: "",
    });
  });

  it("filters unknown and duplicate letter ids while loading", () => {
    const passport = parsePassport(storedPassport({ readLetters: [2, 999, 1, 2, "3"] }));

    expect(passport?.readLetters).toEqual([1, 2]);
  });

  it("does not preserve farewell completion when the final invariant is unmet", () => {
    const passport = parsePassport(
      storedPassport({ readLetters: [FINAL_LETTER_ID], isFarewellCompleted: true }),
    );

    expect(passport?.isFarewellCompleted).toBe(false);
  });

  it("ignores unknown reads and allows farewell only after every letter was read", () => {
    const passport = parsePassport(storedPassport());
    expect(passport).not.toBeNull();
    if (!passport) {
      return;
    }

    expect(markLetterRead(passport, 999)).toBe(passport);
    const finalOnly = markLetterRead(passport, FINAL_LETTER_ID);
    expect(completeFarewell(finalOnly)).toBe(finalOnly);

    const allRead = LETTERS.reduce((current, letter) => markLetterRead(current, letter.id), passport);
    expect(completeFarewell(allRead).isFarewellCompleted).toBe(true);
  });
});
