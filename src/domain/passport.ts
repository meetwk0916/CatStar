import type { CatPalette, CatPersonality, ICatPassport } from "../types";
import { hasReadAllOtherLetters, isLetterRead, LETTERS, FINAL_LETTER_ID } from "./letters";

export interface PassportInput {
  catName: string;
  ownerName: string;
  colorPalette: CatPalette;
  personality: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
}

const PALETTES = new Set<CatPalette>(["GRAY_WHITE", "ORANGE", "BLACK", "WHITE", "CALICO", "TUXEDO"]);
const PERSONALITIES = new Set<CatPersonality>(["GLUTTON", "ALOOFS", "CLINGY", "ENERGY"]);
const LETTER_IDS = new Set(LETTERS.map((letter) => letter.id));

export function createPassport(input: PassportInput, now = Date.now()): ICatPassport {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    catName: requireText(input.catName, "catName"),
    ownerName: requireText(input.ownerName, "ownerName"),
    colorPalette: input.colorPalette,
    personality: input.personality,
    favoriteSnack: requireText(input.favoriteSnack, "favoriteSnack"),
    passedDate: normalizePassedDate(input.passedDate),
    createdAt: now,
    readLetters: [],
    isFarewellCompleted: false,
  };
}

export function parsePassport(value: unknown): ICatPassport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ICatPassport>;
  if (candidate.schemaVersion !== undefined && candidate.schemaVersion !== 1) {
    return null;
  }
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim() === "" ||
    typeof candidate.catName !== "string" ||
    candidate.catName.trim() === "" ||
    typeof candidate.ownerName !== "string" ||
    candidate.ownerName.trim() === "" ||
    typeof candidate.favoriteSnack !== "string" ||
    candidate.favoriteSnack.trim() === "" ||
    typeof candidate.createdAt !== "number" ||
    !Number.isFinite(candidate.createdAt) ||
    candidate.createdAt <= 0
  ) {
    return null;
  }

  if (!Array.isArray(candidate.readLetters)) {
    return null;
  }

  const readLetters = [...new Set(candidate.readLetters.filter((id): id is number => Number.isInteger(id) && LETTER_IDS.has(id)))].sort(
    (a, b) => a - b,
  );
  const passport: ICatPassport = {
    schemaVersion: 1,
    id: candidate.id.trim(),
    catName: candidate.catName.trim(),
    ownerName: candidate.ownerName.trim(),
    colorPalette: PALETTES.has(candidate.colorPalette as CatPalette)
      ? (candidate.colorPalette as CatPalette)
      : "GRAY_WHITE",
    personality: PERSONALITIES.has(candidate.personality as CatPersonality)
      ? (candidate.personality as CatPersonality)
      : "CLINGY",
    favoriteSnack: candidate.favoriteSnack.trim(),
    passedDate: normalizePassedDate(candidate.passedDate),
    createdAt: candidate.createdAt,
    readLetters,
    isFarewellCompleted: false,
  };

  passport.isFarewellCompleted =
    candidate.isFarewellCompleted === true &&
    isLetterRead(passport, FINAL_LETTER_ID) &&
    hasReadAllOtherLetters(passport);
  return passport;
}

export function markLetterRead(passport: ICatPassport, letterId: number): ICatPassport {
  if (!LETTER_IDS.has(letterId) || passport.readLetters.includes(letterId)) {
    return passport;
  }

  return {
    ...passport,
    readLetters: [...passport.readLetters, letterId].sort((a, b) => a - b),
  };
}

export function completeFarewell(passport: ICatPassport): ICatPassport {
  if (!isLetterRead(passport, FINAL_LETTER_ID) || !hasReadAllOtherLetters(passport)) {
    return passport;
  }

  return {
    ...passport,
    isFarewellCompleted: true,
  };
}

function normalizePassedDate(value: unknown): string {
  if (typeof value !== "string" || value === "") {
    return "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "";
  }
  return value;
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized === "") {
    throw new Error(`${field} must not be empty`);
  }
  return normalized;
}
