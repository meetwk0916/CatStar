import { describe, expect, it } from "vitest";
import {
  formatNextDeliveryHint,
  getCurrentDeliveryIndex,
  getDeliveryTimeAtIndex,
  getNextMorningDeliveryAt,
} from "./time";

describe("delivery time", () => {
  it("schedules the second letter at 8 AM on the next local calendar day", () => {
    const createdAt = new Date(2026, 5, 5, 21, 10, 0, 0).getTime();
    const nextMorning = new Date(getNextMorningDeliveryAt(createdAt));

    expect(nextMorning.getFullYear()).toBe(2026);
    expect(nextMorning.getMonth()).toBe(5);
    expect(nextMorning.getDate()).toBe(6);
    expect(nextMorning.getHours()).toBe(8);
    expect(nextMorning.getMinutes()).toBe(0);
  });

  it("keeps only the first letter available before the next morning", () => {
    const createdAt = new Date(2026, 5, 5, 7, 30, 0, 0).getTime();
    const beforeNextMorning = new Date(2026, 5, 6, 7, 59, 0, 0).getTime();

    expect(getCurrentDeliveryIndex(createdAt, beforeNextMorning)).toBe(0);
  });

  it("increments delivery index once per day after the first next-morning delivery", () => {
    const createdAt = new Date(2026, 5, 5, 21, 10, 0, 0).getTime();
    const thirdDelivery = getDeliveryTimeAtIndex(createdAt, 2);

    expect(new Date(thirdDelivery).getDate()).toBe(7);
    expect(new Date(thirdDelivery).getHours()).toBe(8);
    expect(getCurrentDeliveryIndex(createdAt, thirdDelivery + 60_000)).toBe(2);
  });

  it("uses a first-night hint before the second letter is delivered", () => {
    const createdAt = new Date(2026, 5, 5, 21, 10, 0, 0).getTime();
    const hint = formatNextDeliveryHint(createdAt, createdAt + 60_000);

    expect(hint).toContain("明早 8 点");
  });
});
