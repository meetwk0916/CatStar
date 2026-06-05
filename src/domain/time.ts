const DAY_MS = 86_400_000;
const DELIVERY_HOUR = 8;

export function getNow(): number {
  return Date.now();
}

export function getNextMorningDeliveryAt(createdAt: number): number {
  const created = new Date(createdAt);
  const nextMorning = new Date(created);
  nextMorning.setDate(created.getDate() + 1);
  nextMorning.setHours(DELIVERY_HOUR, 0, 0, 0);
  return nextMorning.getTime();
}

export function getDeliveryTimeAtIndex(createdAt: number, deliveryIndex: number): number {
  if (deliveryIndex <= 0) {
    return createdAt;
  }

  return getNextMorningDeliveryAt(createdAt) + (deliveryIndex - 1) * DAY_MS;
}

export function getCurrentDeliveryIndex(createdAt: number, now = getNow()): number {
  const nextMorningDeliveryAt = getNextMorningDeliveryAt(createdAt);
  if (now < nextMorningDeliveryAt) {
    return 0;
  }

  return 1 + Math.floor((now - nextMorningDeliveryAt) / DAY_MS);
}

export function formatNextDeliveryHint(createdAt: number, now = getNow()): string {
  const nextMorningDeliveryAt = getNextMorningDeliveryAt(createdAt);
  if (now < nextMorningDeliveryAt) {
    return "下一封还在来喵星的路上，明早 8 点会轻轻落进信箱。";
  }

  return "下一封还在来喵星的路上，会在下一个清晨 8 点抵达。";
}
