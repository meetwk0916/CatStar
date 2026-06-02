import type { CatPalette, CatPersonality, ICatPassport } from "../types";

const STORAGE_KEY = "catstar.passport.v1";

export interface PassportInput {
  catName: string;
  ownerName: string;
  colorPalette: CatPalette;
  personality: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
}

export function createPassport(input: PassportInput, now = Date.now()): ICatPassport {
  return {
    id: crypto.randomUUID(),
    catName: input.catName.trim(),
    ownerName: input.ownerName.trim(),
    colorPalette: input.colorPalette,
    personality: input.personality,
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
    const parsed = JSON.parse(raw) as ICatPassport;
    if (!isPassport(parsed)) {
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
    typeof passport.id === "string" &&
    typeof passport.catName === "string" &&
    typeof passport.ownerName === "string" &&
    typeof passport.favoriteSnack === "string" &&
    typeof passport.passedDate === "string" &&
    typeof passport.createdAt === "number" &&
    Array.isArray(passport.readLetters) &&
    typeof passport.isFarewellCompleted === "boolean"
  );
}
