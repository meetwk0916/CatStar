#!/usr/bin/env node

import { chromium } from "playwright";

const [baseUrl, storageState, outputDirectory, channel, viewportSize, shotJson] = process.argv.slice(2);

if (!baseUrl || !storageState || !outputDirectory || !viewportSize) {
  throw new Error("Usage: capture_cat_runtime_review.mjs BASE_URL STORAGE_STATE OUTPUT_DIRECTORY CHANNEL WIDTH,HEIGHT [SHOT_JSON]");
}

const [width, height] = viewportSize.split(",").map(Number);
const shot = shotJson ? JSON.parse(shotJson) : null;
const browser = await chromium.launch(channel ? { channel } : {});
const canvasBounds = {};

async function captureScene(route, run) {
  const context = await browser.newContext({ storageState, viewport: { width, height } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`);
    const canvas = page.locator("canvas");
    await canvas.waitFor({ state: "visible" });
    await run(page, canvas, async (filename) => {
      canvasBounds[filename] = await canvas.boundingBox();
      if (!canvasBounds[filename]) throw new Error(`Canvas not visible for ${filename}`);
      await page.screenshot({ path: `${outputDirectory}/${filename}` });
    });
  } finally {
    await context.close();
  }
}

try {
  if (shot) {
    await captureScene(shot.route, async (page, _canvas, save) => {
      await page.waitForTimeout(shot.waitMs);
      await save(shot.filename);
    });
  } else {
    for (const side of ["left", "right"]) {
      await captureScene("/?catstarRoutine=floorSit&catstarFullTouch=1", async (page, canvas, save) => {
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
          await save(`interaction-${side}-${String(frame).padStart(2, "0")}.png`);
        }
      });
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(canvasBounds));
