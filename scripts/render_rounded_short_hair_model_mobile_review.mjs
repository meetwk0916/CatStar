import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

export const MODEL_SOURCE = resolve(
  root,
  'artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png',
);
export const DESKTOP_ROOM_SOURCE = resolve(
  root,
  'artifacts/art/runtime-review/2026-08-09/default-walk-4s.png',
);
export const MOBILE_ROOM_SOURCE = resolve(
  root,
  'artifacts/art/runtime-review/2026-08-09/mobile-sit-2s.png',
);
export const RUNTIME_CELL_SOURCE = resolve(
  root,
  'public/assets/scenes/window-room/cat/gray-white-tabby/sit.png',
);
export const OUTPUT = resolve(
  root,
  'artifacts/art/review/rounded-short-haired-model-sheet-v1/mobile-review-375w.png',
);

const width = 375;
const height = 812;
const padding = 20;
const contentWidth = width - padding * 2;

async function resizeReviewAsset(source, options) {
  let image = sharp(source);
  if (options.extract) {
    image = image.extract(options.extract);
  }
  return image
    .resize({
      width: contentWidth,
      height: options.height,
      fit: 'contain',
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
}

function label(text, y) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${padding}" y="${y}" fill="#e8ddd1" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.1">${text}</text>
    </svg>
  `);
}

export async function renderReview(output = OUTPUT) {
  await mkdir(dirname(output), { recursive: true });

  const modelSheet = await resizeReviewAsset(MODEL_SOURCE, { height: 200 });
  const runtimeCellStrip = await resizeReviewAsset(RUNTIME_CELL_SOURCE, { height: 80 });
  const desktopRoom = await resizeReviewAsset(DESKTOP_ROOM_SOURCE, {
    extract: { left: 64, top: 248, width: 680, height: 386 },
    height: 155,
  });
  const mobileRoom = await resizeReviewAsset(MOBILE_ROOM_SOURCE, {
    extract: { left: 20, top: 232, width: 350, height: 200 },
    height: 180,
  });

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#101216',
    },
  })
    .composite([
      { input: label('ROUNDED SHORT-HAIRED — MOBILE REVIEW (375W)', 20) },
      { input: label('APPROVED PRODUCTION MODEL AUTHORITY', 37) },
      { input: modelSheet, left: padding, top: 48 },
      { input: label('RUNTIME CELL CONTRACT — 96X96 FRAMES', 264) },
      { input: runtimeCellStrip, left: padding, top: 278 },
      { input: label('DESKTOP ROOM RUNTIME REVIEW', 374) },
      { input: desktopRoom, left: padding, top: 391 },
      { input: label('390X844 MOBILE ROOM RUNTIME REVIEW', 575) },
      { input: mobileRoom, left: padding, top: 592 },
      { input: label('RIGHTS STATUS: INTERNAL PROTOTYPE GATE', 804) },
    ])
    .png()
    .toFile(output);

  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await renderReview());
}
