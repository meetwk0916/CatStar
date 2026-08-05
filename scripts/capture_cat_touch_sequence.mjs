#!/usr/bin/env node

import { chromium } from "playwright";

const [baseUrl, storageState, outputDirectory, channel = ""] = process.argv.slice(2);

if (!baseUrl || !storageState || !outputDirectory) {
  throw new Error("Usage: capture_cat_touch_sequence.mjs BASE_URL STORAGE_STATE OUTPUT_DIRECTORY [CHANNEL]");
}

const browser = await chromium.launch(channel ? { channel } : {});

try {
  for (const side of ["left", "right"]) {
    const context = await browser.newContext({
      storageState,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/?catstarRoutine=floorSit&catstarFullTouch=1`);
    const canvas = page.locator("canvas");
    await canvas.waitFor({ state: "visible" });
    await page.waitForTimeout(400);

    const canvasSize = await canvas.evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
    }));
    const worldX = side === "left" ? 300 : 340;
    await canvas.click({
      position: {
        x: (worldX / 640) * canvasSize.width,
        y: (225 / 360) * canvasSize.height,
      },
    });

    for (let frame = 1; frame <= 4; frame += 1) {
      await page.waitForTimeout(frame === 1 ? 60 : 180);
      await page.screenshot({
        path: `${outputDirectory}/interaction-${side}-${String(frame).padStart(2, "0")}.png`,
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
