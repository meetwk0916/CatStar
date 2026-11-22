#!/usr/bin/env node

import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const [baseUrl, storageState, outputDirectory, channel, viewportSize, shotJson] = process.argv.slice(2);

if (!baseUrl || !storageState || !outputDirectory || !viewportSize) {
  throw new Error("Usage: capture_cat_runtime_review.mjs BASE_URL STORAGE_STATE OUTPUT_DIRECTORY CHANNEL WIDTH,HEIGHT [SHOT_JSON]");
}

const [width, height] = viewportSize.split(",").map(Number);
const shot = shotJson ? JSON.parse(shotJson) : null;
const browser = await chromium.launch(channel ? { channel } : {});
const canvasBounds = {};

async function captureScene(route, run, state = storageState) {
  const context = await browser.newContext({ storageState: state, viewport: { width, height } });
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

async function capturePortrait(sequences) {
  for (const [initialRoutine, frames] of sequences) {
    let state = storageState;
    const farewell = frames.some(([name]) => name === "stardust");
    if (farewell) {
      state = JSON.parse(await readFile(storageState, "utf8"));
      const letters = JSON.parse(await readFile(new URL("../src/data/letters.json", import.meta.url)));
      const setting = state.origins[0].localStorage.find(({ name }) => name === "catstar.passport.v1");
      setting.value = JSON.stringify({
        ...JSON.parse(setting.value),
        isFarewellCompleted: true,
        readLetters: letters.map(({ id }) => id),
      });
    }
    await captureScene(
      `/?catstarRoutine=${initialRoutine}&catstarPortraitReview=1&catstarFullTouch=1`,
      async (page, canvas, save) => {
        for (const [name, routine, action] of frames) {
          const observed = await page.waitForFunction(({ name, routine, action }) => {
            const raw = document.documentElement.dataset.catstarPortraitFrame;
            if (!raw) return false;
            const frame = JSON.parse(raw);
            const requiresSway = name === "plant-sway" || name === "interrupt-plant";
            const requiredFrame = action === "eat" ? 2 : action === "jump" || action === "stretch" ? 3 : null;
            return frame.routine === routine && frame.action === `cat-${action}` &&
              (requiredFrame === null || frame.frame === requiredFrame) &&
              (!requiresSway || Math.abs(frame.leafAngle) > 3) && frame;
          }, { name, routine, action }, { timeout: 20_000 }).then((handle) => handle.jsonValue());

          const interrupt = name.startsWith("interrupt-");
          if (name === "touch-whisper" || interrupt) {
            const box = await canvas.boundingBox();
            await page.mouse.click(box.x + observed.x, box.y + observed.y);
            const whisper = page.locator(".cat-reaction");
            await whisper.waitFor({ state: "visible", timeout: 2_000 });
            const bubble = await whisper.boundingBox();
            if (bubble.x < 0 || bubble.x + bubble.width > width || bubble.y < 0 || bubble.y + bubble.height > height) {
              throw new Error("The portrait touch whisper extends beyond the viewport");
            }
            if (interrupt) {
              await page.waitForFunction(() => {
                const frame = JSON.parse(document.documentElement.dataset.catstarPortraitFrame);
                return frame.routine === "floorPause" && frame.onFloor && frame.leafAngle === 0;
              }, null, { timeout: 2_000 });
            }
          } else if (farewell) {
            if (!observed.stardust) throw new Error("The farewell passport did not enable stardust");
            await page.waitForTimeout(900); // Let multiple stardust particles enter the scene.
          }
          await save(`mobile-${name}.png`);
        }
      },
      state,
    );
  }
}

try {
  if (shot?.portraitSequences) {
    await capturePortrait(shot.portraitSequences);
  } else if (shot) {
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
