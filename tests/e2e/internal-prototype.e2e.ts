import { expect, test, type Locator, type Page } from "playwright/test";

async function screenshotPlantRegion(page: Page, canvas: Locator) {
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Cat room canvas is not visible");
  }

  const scaleX = box.width / 640;
  const scaleY = box.height / 360;
  return page.screenshot({
    clip: {
      x: box.x + 486 * scaleX,
      y: box.y + 132 * scaleY,
      width: 62 * scaleX,
      height: 48 * scaleY,
    },
  });
}

async function registerPassport(page: Page) {
  await page.getByLabel("小猫叫什么名字？", { exact: true }).fill("小灰");
  await page.getByLabel("你希望小猫怎么称呼你？", { exact: true }).fill("家人");
  await page.getByLabel("它最喜欢的零食", { exact: true }).fill("小鱼干");
  await page.getByRole("button", { name: "登记喵星护照", exact: true }).click();
  await expect(page.getByRole("heading", { name: "星光窗边", exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("primary actions remain legible and implemented memorial traits expose selection state", async ({ page }) => {
  const submit = page.getByRole("button", { name: "登记喵星护照", exact: true });
  const colors = await submit.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });

  expect(colors.color).not.toBe(colors.backgroundColor);
  const coatPresets = page.getByRole("group", { name: "毛色预设" });
  await expect(coatPresets.getByRole("button")).toHaveCount(6);
  await expect(coatPresets.getByRole("button", { name: "灰白虎斑" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /亲近温柔/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /安静慢热/ })).toHaveAttribute("aria-pressed", "false");

  await coatPresets.getByRole("button", { name: "橘色虎斑" }).click();
  await page.getByRole("button", { name: /安静慢热/ }).click();
  await expect(coatPresets.getByRole("button", { name: "橘色虎斑" })).toHaveAttribute("aria-pressed", "true");
  await expect(coatPresets.getByText("内部形象预览", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /安静慢热/ })).toHaveAttribute("aria-pressed", "true");
});

test("persisted orange-tabby passports retain a visible non-release disclosure", async ({ page }) => {
  await page.getByLabel("小猫叫什么名字？", { exact: true }).fill("小橘");
  await page.getByLabel("你希望小猫怎么称呼你？", { exact: true }).fill("家人");
  await page.getByLabel("它最喜欢的零食", { exact: true }).fill("小鱼干");
  await page.getByRole("button", { name: "橘色虎斑" }).click();
  await page.getByRole("button", { name: "登记喵星护照", exact: true }).click();

  const disclosure = page.getByText("当前为内部形象预览，并非 Issue #23 正式发布美术", {
    exact: true,
  });
  await expect(disclosure).toBeVisible();
  await page.reload();
  await expect(disclosure).toBeVisible();
});

for (const width of [320, 375, 414, 768]) {
  test(`main experience does not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await registerPassport(page);
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();

    const viewport = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));

    expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.viewportWidth);
  });
}

test("mailbox uses one focus-managed modal dialog", async ({ page }) => {
  await registerPassport(page);
  await page.getByRole("button", { name: /时光信箱/ }).click();

  const dialog = page.getByRole("dialog", { name: "时光信箱", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
    .toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("cat interaction has a keyboard-accessible control and visible response", async ({ page }) => {
  await registerPassport(page);
  const interact = page.getByRole("button", { name: "轻轻摸摸小灰", exact: true });
  const canvas = page.locator("canvas");
  await expect(interact).toBeVisible();
  await expect.poll(() => canvas.count()).toBeGreaterThan(0);
  const maxCanvasCountDuringStartup = await page.evaluate(async () => {
    let maxCanvasCount = 0;
    const deadline = performance.now() + 250;
    while (performance.now() < deadline) {
      maxCanvasCount = Math.max(maxCanvasCount, document.querySelectorAll("canvas").length);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return maxCanvasCount;
  });
  expect(maxCanvasCountDuringStartup).toBe(1);
  const before = await canvas.screenshot();
  await interact.click();
  await page.waitForTimeout(250);
  expect(await canvas.count()).toBe(1);
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
});

test("plant touch moves the room locally and yields immediately to companion touch", async ({ page }) => {
  await registerPassport(page);
  const canvas = page.locator("canvas");
  const interact = page.getByRole("button", { name: "轻轻摸摸小灰", exact: true });

  await page.goto("/?catstarRoutine=floorSit");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(100);
  const restingPlant = await screenshotPlantRegion(page, canvas);

  await page.goto("/?catstarRoutine=touchPlant");
  await expect(canvas).toBeVisible();
  let swayingPlant = restingPlant;
  await expect
    .poll(
      async () => {
        swayingPlant = await screenshotPlantRegion(page, canvas);
        return swayingPlant.equals(restingPlant);
      },
      { timeout: 2_000, intervals: [50] },
    )
    .toBe(false);
  const swayingCanvas = await canvas.screenshot();

  await interact.click();
  await page.waitForTimeout(100);
  const resetPlant = await screenshotPlantRegion(page, canvas);
  const acknowledgedCanvas = await canvas.screenshot();
  expect(acknowledgedCanvas.equals(swayingCanvas)).toBe(false);
  expect(resetPlant.equals(restingPlant)).toBe(true);

  await page.waitForTimeout(2_200);
  const settledPlant = await screenshotPlantRegion(page, canvas);
  expect(settledPlant.equals(restingPlant)).toBe(true);
});

test("passport and read progress survive a reload", async ({ page }) => {
  await registerPassport(page);
  await page.getByRole("button", { name: /时光信箱/ }).click();
  await page.getByRole("button", { name: /我在窗边安顿好了/ }).click();
  await expect(page.getByRole("dialog", { name: "我在窗边安顿好了" })).toBeVisible();
  await page.getByRole("button", { name: "回到信箱", exact: true }).click();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await page.reload();

  await expect(page.getByRole("heading", { name: "小灰", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /时光信箱/ }).click();
  await expect(page.getByRole("button", { name: /我在窗边安顿好了.*已经读过/ })).toBeVisible();
});

test("final letter stays gated, then farewell seals only the mailbox", async ({ page }) => {
  await registerPassport(page);
  await page.getByRole("button", { name: "最终信投递日", exact: true }).click();
  await expect(page.getByText("小灰 正在窗边陪你，已经抵达的信都可以慢慢读。", { exact: true })).toBeVisible();
  await expect(page.getByText(/等下一封信抵达/)).toHaveCount(0);
  await page.getByRole("button", { name: /时光信箱/ }).click();

  const waitingFinal = page.getByRole("button", { name: /远方的星光/ });
  await expect(waitingFinal).toBeDisabled();

  for (const title of [
    "我在窗边安顿好了",
    "窗边有喜欢的味道",
    "今天的星光很轻",
    "今天在房间里走走",
    "想念不用放整齐",
    "睡醒以后还在这里",
    "谢谢你记得我",
  ]) {
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await expect(page.getByRole("dialog", { name: title, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "回到信箱", exact: true }).click();
  }

  await page.getByRole("button", { name: /最后一封信：窗边还亮着/ }).click();
  await expect(page.getByText(/这不是我消失，也不是要你把想念放下/)).toBeVisible();
  await page.getByRole("button", { name: "谢谢你陪我走到这里", exact: true }).click();
  await expect(page.getByText("信箱已经封存，星河陪伴仍在继续。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(page.getByRole("button", { name: /信箱封存/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /信箱封存/ })).toBeVisible();
  await page.getByRole("button", { name: /信箱封存/ }).click();
  await expect(page.getByRole("button", { name: /最后一封信：窗边还亮着/ })).toContainText("已经读过");
});

test("reset can be cancelled and confirmed without leaving stale local state", async ({ page }) => {
  await registerPassport(page);
  await page.getByRole("button", { name: "重新登记", exact: true }).click();
  await page.getByRole("button", { name: "先不重新登记", exact: true }).click();
  await expect(page.getByRole("heading", { name: "小灰", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "重新登记", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "重新登记", exact: true });
  await dialog.getByRole("button", { name: "重新登记", exact: true }).click();
  await expect(page.getByRole("button", { name: "登记喵星护照", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "登记喵星护照", exact: true })).toBeVisible();
});
