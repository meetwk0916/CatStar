import type { CatCoatPreset, CatTemperament, ICatPassport } from "../types";

const STORAGE_KEY = "catstar.passport.v1";

export interface PassportInput {
  catName: string;
  ownerName: string;
  coatPreset: CatCoatPreset;
  temperament: CatTemperament;
  favoriteSnack: string;
  passedDate: string;
}

export function createPassport(input: PassportInput, now = Date.now()): ICatPassport {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    catName: input.catName.trim(),
    ownerName: input.ownerName.trim(),
    coatPreset: input.coatPreset,
    temperament: input.temperament,
    favoriteSnack: input.favoriteSnack.trim(),
    passedDate: input.passedDate,
    createdAt: now,
    readLetters: [],
    isFarewellCompleted: false,
  };
}

export function loadPassport(): ICatPassport | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = normalizePassport(JSON.parse(raw));
    if (!parsed) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePassport(passport: ICatPassport): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
}

export function clearPassport(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function markLetterRead(passport: ICatPassport, letterId: number): ICatPassport {
  if (passport.readLetters.includes(letterId)) {
    return passport;
  }

  return {
    ...passport,
    readLetters: [...passport.readLetters, letterId].sort((a, b) => a - b),
  };
}

export function completeFarewell(passport: ICatPassport): ICatPassport {
  return {
    ...passport,
    isFarewellCompleted: true,
  };
}

function isPassport(value: unknown): value is ICatPassport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const passport = value as ICatPassport;
  return (
    (passport.schemaVersion === undefined || passport.schemaVersion === 1) &&
    typeof passport.id === "string" &&
    typeof passport.catName === "string" &&
    typeof passport.ownerName === "string" &&
    isCoatPreset(passport.coatPreset) &&
    isTemperament(passport.temperament) &&
    typeof passport.favoriteSnack === "string" &&
    typeof passport.passedDate === "string" &&
    typeof passport.createdAt === "number" &&
    Array.isArray(passport.readLetters) &&
    passport.readLetters.every((letterId) => Number.isInteger(letterId)) &&
    typeof passport.isFarewellCompleted === "boolean"
  );
}

const LEGACY_COAT_PRESETS: Record<string, CatCoatPreset> = {
  ORANGE: "ORANGE_TABBY",
  BLACK: "SOLID_BLACK",
  WHITE: "SOLID_WHITE",
  CALICO: "CALICO",
  TUXEDO: "TUXEDO",
};

const LEGACY_TEMPERAMENTS: Record<string, CatTemperament> = {
  ALOOFS: "QUIET",
  GLUTTON: "CURIOUS",
  CLINGY: "AFFECTIONATE",
  ENERGY: "LIVELY",
};

const COAT_PRESETS = new Set<CatCoatPreset>([
  "ORANGE_TABBY",
  "SOLID_BLACK",
  "SOLID_WHITE",
  "CALICO",
  "TUXEDO",
  "GRAY_WHITE_TABBY",
]);

const TEMPERAMENTS = new Set<CatTemperament>(["QUIET", "CURIOUS", "AFFECTIONATE", "LIVELY"]);

function isCoatPreset(value: unknown): value is CatCoatPreset {
  return typeof value === "string" && COAT_PRESETS.has(value as CatCoatPreset);
}

function isTemperament(value: unknown): value is CatTemperament {
  return typeof value === "string" && TEMPERAMENTS.has(value as CatTemperament);
}

function normalizePassport(value: unknown): ICatPassport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const legacy = value as ICatPassport & {
    colorPalette?: string;
    personality?: string;
  };
  const coatPreset = isCoatPreset(legacy.coatPreset)
    ? legacy.coatPreset
    : LEGACY_COAT_PRESETS[legacy.colorPalette ?? ""];
  const temperament = isTemperament(legacy.temperament)
    ? legacy.temperament
    : LEGACY_TEMPERAMENTS[legacy.personality ?? ""];
  const normalized = {
    ...legacy,
    schemaVersion: 1 as const,
    coatPreset,
    temperament,
  };

  if (!isPassport(normalized)) {
    return null;
  }

  const { colorPalette: _colorPalette, personality: _personality, ...passport } = normalized;
  return passport;
}
