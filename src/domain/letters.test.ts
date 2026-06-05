import { describe, expect, it } from "vitest";
import type { ICatPassport, ILetter } from "../types";
import {
  canOpenLetter,
  countUnreadDeliveredLetters,
  getDeliveredLetters,
  getMailboxLetters,
  hasReadAllOtherLetters,
  renderLetterContent,
} from "./letters";
import { getDeliveryTimeAtIndex } from "./time";

const createdAt = new Date(2026, 5, 5, 21, 10, 0, 0).getTime();

function makePassport(readLetters: number[] = []): ICatPassport {
  return {
    id: "test-passport",
    catName: "小橘",
    ownerName: "家人",
    colorPalette: "ORANGE",
    personality: "CLINGY",
    favoriteSnack: "鸡胸肉",
    passedDate: "2026-06-01",
    createdAt,
    readLetters,
    isFarewellCompleted: false,
  };
}

const letters: ILetter[] = [
  { id: 1, deliveryIndex: 0, title: "第一封", templateContent: "{catName} 给 {ownerName} 的 {favoriteSnack}" },
  { id: 2, deliveryIndex: 1, title: "第二封", templateContent: "第二封" },
  { id: 99, deliveryIndex: 2, title: "最终信", templateContent: "最终信" },
];

describe("letters domain", () => {
  it("delivers only letters at or before the current delivery index", () => {
    const passport = makePassport();
    const secondDelivery = getDeliveryTimeAtIndex(createdAt, 1) + 60_000;

    expect(getDeliveredLetters(passport, createdAt + 60_000, letters).map((letter) => letter.id)).toEqual([1]);
    expect(getDeliveredLetters(passport, secondDelivery, letters).map((letter) => letter.id)).toEqual([1, 2]);
  });

  it("counts unread delivered readable letters only", () => {
    const passport = makePassport([1]);
    const finalDelivery = getDeliveryTimeAtIndex(createdAt, 2) + 60_000;

    expect(countUnreadDeliveredLetters(passport, finalDelivery, letters)).toBe(1);
    expect(getMailboxLetters(passport, finalDelivery, letters).find((item) => item.letter.id === 99)?.state).toBe(
      "final-waiting",
    );
  });

  it("keeps final letter waiting until all other letters are read", () => {
    const passport = makePassport([1]);
    const finalLetter = letters.find((letter) => letter.id === 99);

    expect(finalLetter).toBeDefined();
    expect(hasReadAllOtherLetters(passport, letters)).toBe(false);
    expect(canOpenLetter(passport, finalLetter as ILetter, letters)).toBe(false);
  });

  it("opens final letter after every non-final delivered script has been read", () => {
    const passport = makePassport([1, 2]);
    const finalLetter = letters.find((letter) => letter.id === 99);

    expect(finalLetter).toBeDefined();
    expect(hasReadAllOtherLetters(passport, letters)).toBe(true);
    expect(canOpenLetter(passport, finalLetter as ILetter, letters)).toBe(true);
  });

  it("renders passport placeholders without collecting concrete memories", () => {
    const rendered = renderLetterContent(letters[0], makePassport());

    expect(rendered).toBe("小橘 给 家人 的 鸡胸肉");
  });
});
