#!/usr/bin/env node

import { chromium } from "playwright";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

const [
  baseUrl,
  storageState,
  outputDirectory,
  coatPreset,
  expectedRuntimeCoatPreset,
  action,
  route,
  durationRaw,
  viewportRaw,
  channel = "",
] = process.argv.slice(2);

if (
  !baseUrl ||
  !storageState ||
  !outputDirectory ||
  !coatPreset ||
  !expectedRuntimeCoatPreset ||
  !action ||
  !route ||
  !durationRaw ||
  !viewportRaw
) {
  throw new Error(
    "Usage: capture_cat_motion_review.mjs BASE_URL STORAGE_STATE OUTPUT_DIRECTORY COAT EXPECTED_RUNTIME_COAT ACTION ROUTE DURATION_MS VIEWPORT [CHANNEL]",
  );
}

const [width, height] = viewportRaw.split("x").map(Number);
if (!Number.isInteger(width) || !Number.isInteger(height)) {
  throw new Error(`Invalid viewport: ${viewportRaw}`);
}

const durationMs = Number(durationRaw);
if (!Number.isFinite(durationMs) || durationMs <= 0) {
  throw new Error(`Invalid duration: ${durationRaw}`);
}

const videoDirectory = path.join(outputDirectory, "videos", coatPreset, viewportRaw);
const posterDirectory = path.join(outputDirectory, "posters", coatPreset, viewportRaw);
const rawVideoDirectory = path.join(outputDirectory, ".raw-videos");
await mkdir(videoDirectory, { recursive: true });
await mkdir(posterDirectory, { recursive: true });
await mkdir(rawVideoDirectory, { recursive: true });

const browser = await chromium.launch(channel ? { channel } : {});
const context = await browser.newContext({
  storageState,
  viewport: { width, height },
  recordVideo: { dir: rawVideoDirectory },
});
const page = await context.newPage();
const video = page.video();
const startedAt = new Date().toISOString();

try {
  await page.goto(new URL(route, baseUrl).toString());
  const canvas = page.locator("canvas");
  await canvas.waitFor({ state: "visible" });
  await page.waitForTimeout(400);

  const actualRuntimeCoatPreset = await page
    .locator("[data-catstar-coat-preset]")
    .getAttribute("data-catstar-coat-preset");
  if (actualRuntimeCoatPreset !== expectedRuntimeCoatPreset) {
    throw new Error(
      `Runtime coat mismatch for ${coatPreset}: expected ${expectedRuntimeCoatPreset}, got ${actualRuntimeCoatPreset}`,
    );
  }

  if (action === "interact") {
    const canvasSize = await canvas.evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
    }));
    await canvas.click({
      position: {
        x: (300 / 640) * canvasSize.width,
        y: (225 / 360) * canvasSize.height,
      },
    });
  }

  const posterPath = path.join(posterDirectory, `${action}-entry.png`);
  const endPosterPath = path.join(posterDirectory, `${action}-exit.png`);
  await page.screenshot({ path: posterPath });
  const motionStartedAt = Date.now();
  await page.waitForFunction(
    () => document.documentElement.dataset.catstarMotionState === "complete",
    null,
    { timeout: durationMs },
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: endPosterPath });
  const actualDurationMs = Date.now() - motionStartedAt;

  await context.close();
  const rawVideoPath = await video?.path();
  if (!rawVideoPath) {
    throw new Error("Playwright did not produce a motion video");
  }

  const videoPath = path.join(videoDirectory, `${action}.webm`);
  await rename(rawVideoPath, videoPath);
  process.stdout.write(
    JSON.stringify({
      coatPreset,
      runtimeCoatPreset: actualRuntimeCoatPreset,
      action,
      viewport: viewportRaw,
      route,
      durationMs: actualDurationMs,
      captureTimeoutMs: durationMs,
      motionState: "complete",
      startedAt,
      video: path.relative(outputDirectory, videoPath),
      entryPoster: path.relative(outputDirectory, posterPath),
      exitPoster: path.relative(outputDirectory, endPosterPath),
    }) + "\n",
  );
} finally {
  await browser.close();
}
