import { parsePassport } from "../domain/passport";
import type { ICatPassport } from "../types";

const STORAGE_KEY = "catstar.passport.v1";

export function loadPassport(): ICatPassport | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parsePassport(JSON.parse(raw));
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
