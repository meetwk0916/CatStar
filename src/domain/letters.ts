import rawLetters from "../data/letters.json";
import type { ICatPassport, ILetter, LetterViewState } from "../types";
import { getCurrentDeliveryIndex } from "./time";

export const LETTERS = rawLetters satisfies ILetter[];
export const FINAL_LETTER_ID = 99;

export interface MailboxLetter {
  letter: ILetter;
  state: LetterViewState;
  title: string;
  subtitle: string;
  isRead: boolean;
}

export function sortLetters(letters: ILetter[]): ILetter[] {
  return [...letters].sort((a, b) => {
    if (a.deliveryIndex !== b.deliveryIndex) {
      return a.deliveryIndex - b.deliveryIndex;
    }
    return a.id - b.id;
  });
}

export function getDeliveredLetters(
  passport: ICatPassport,
  now?: number,
  letters: ILetter[] = LETTERS,
): ILetter[] {
  const currentDeliveryIndex = getCurrentDeliveryIndex(passport.createdAt, now);
  return sortLetters(letters.filter((letter) => letter.deliveryIndex <= currentDeliveryIndex));
}

export function isLetterRead(passport: ICatPassport, letterId: number): boolean {
  return passport.readLetters.includes(letterId);
}

export function hasReadAllOtherLetters(
  passport: ICatPassport,
  letters: ILetter[] = LETTERS,
): boolean {
  return letters
    .filter((letter) => letter.id !== FINAL_LETTER_ID)
    .every((letter) => isLetterRead(passport, letter.id));
}

export function canOpenLetter(passport: ICatPassport, letter: ILetter): boolean {
  if (letter.id !== FINAL_LETTER_ID) {
    return true;
  }

  return hasReadAllOtherLetters(passport);
}

export function getMailboxLetters(
  passport: ICatPassport,
  now?: number,
  letters: ILetter[] = LETTERS,
): MailboxLetter[] {
  return getDeliveredLetters(passport, now, letters).map((letter) => {
    const isFinalWaiting = letter.id === FINAL_LETTER_ID && !canOpenLetter(passport, letter);
    return {
      letter,
      state: isFinalWaiting ? "final-waiting" : "readable",
      title: isFinalWaiting ? "远方的星光" : letter.title,
      subtitle: isFinalWaiting
        ? "还有几封旧信在等你"
        : isLetterRead(passport, letter.id)
          ? "已经读过"
          : "静静躺在信箱里",
      isRead: isLetterRead(passport, letter.id),
    };
  });
}

export function countUnreadDeliveredLetters(passport: ICatPassport, now?: number): number {
  return getMailboxLetters(passport, now).filter(
    (item) => item.state === "readable" && !item.isRead,
  ).length;
}

export function renderLetterContent(letter: ILetter, passport: ICatPassport): string {
  return letter.templateContent
    .replaceAll("{catName}", passport.catName)
    .replaceAll("{ownerName}", passport.ownerName)
    .replaceAll("{favoriteSnack}", passport.favoriteSnack);
}

export function isFinalLetter(letter: ILetter): boolean {
  return letter.id === FINAL_LETTER_ID;
}
