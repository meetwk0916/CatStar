import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearPassport, loadPassport, savePassport } from "./passportStorage";

const values = new Map<string, string>();
const localStorage = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  removeItem: vi.fn((key: string) => values.delete(key)),
};

const validPassport = {
  schemaVersion: 1 as const,
  id: "passport-1",
  catName: "小星",
  ownerName: "家人",
  colorPalette: "GRAY_WHITE" as const,
  personality: "CLINGY" as const,
  favoriteSnack: "小鱼干",
  passedDate: "",
  createdAt: 1_700_000_000_000,
  readLetters: [],
  isFarewellCompleted: false,
};

describe("passport storage adapter", () => {
  beforeEach(() => {
    values.clear();
    vi.clearAllMocks();
    vi.stubGlobal("window", { localStorage });
  });

  it("returns null for malformed JSON or an invalid record", () => {
    values.set("catstar.passport.v1", "{");
    expect(loadPassport()).toBeNull();

    values.set("catstar.passport.v1", JSON.stringify({ id: "partial" }));
    expect(loadPassport()).toBeNull();
  });

  it("normalizes a legacy record while loading", () => {
    const { schemaVersion: _, ...legacy } = validPassport;
    values.set("catstar.passport.v1", JSON.stringify(legacy));

    expect(loadPassport()).toEqual(validPassport);
  });

  it("saves and clears through the single storage key", () => {
    savePassport(validPassport);
    expect(JSON.parse(values.get("catstar.passport.v1") ?? "")).toEqual(validPassport);

    clearPassport();
    expect(values.has("catstar.passport.v1")).toBe(false);
  });
});
