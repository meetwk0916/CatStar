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

  it("does not deliver a calendar-day letter before 8 AM", () => {
    const createdAt = new Date(2026, 5, 5, 21, 10, 0, 0).getTime();
    const beforeThirdDelivery = new Date(2026, 5, 7, 7, 59, 59, 0).getTime();

    expect(getCurrentDeliveryIndex(createdAt, beforeThirdDelivery)).toBe(1);
  });
});

describe.sequential("delivery time across daylight-saving changes", () => {
  const runtimeProcess = (globalThis as unknown as {
    process: { env: Record<string, string | undefined> };
  }).process;

  it("keeps spring-forward deliveries at local 8 AM", () => {
    const previousTimezone = runtimeProcess.env.TZ;
    runtimeProcess.env.TZ = "America/New_York";

    try {
      const createdAt = new Date(2026, 2, 7, 21, 0, 0, 0).getTime();
      const firstDelivery = new Date(getDeliveryTimeAtIndex(createdAt, 1));
      const secondDelivery = new Date(getDeliveryTimeAtIndex(createdAt, 2));

      expect([firstDelivery.getDate(), firstDelivery.getHours()]).toEqual([8, 8]);
      expect([secondDelivery.getDate(), secondDelivery.getHours()]).toEqual([9, 8]);
      expect(getCurrentDeliveryIndex(createdAt, secondDelivery.getTime())).toBe(2);
    } finally {
      if (previousTimezone === undefined) {
        delete runtimeProcess.env.TZ;
      } else {
        runtimeProcess.env.TZ = previousTimezone;
      }
    }
  });

  it("keeps fall-back deliveries at local 8 AM", () => {
    const previousTimezone = runtimeProcess.env.TZ;
    runtimeProcess.env.TZ = "America/New_York";

    try {
      const createdAt = new Date(2026, 9, 31, 21, 0, 0, 0).getTime();
      const firstDelivery = new Date(getDeliveryTimeAtIndex(createdAt, 1));
      const secondDelivery = new Date(getDeliveryTimeAtIndex(createdAt, 2));

      expect([firstDelivery.getDate(), firstDelivery.getHours()]).toEqual([1, 8]);
      expect([secondDelivery.getDate(), secondDelivery.getHours()]).toEqual([2, 8]);
      expect(getCurrentDeliveryIndex(createdAt, secondDelivery.getTime())).toBe(2);
    } finally {
      if (previousTimezone === undefined) {
        delete runtimeProcess.env.TZ;
      } else {
        runtimeProcess.env.TZ = previousTimezone;
      }
    }
  });
});
