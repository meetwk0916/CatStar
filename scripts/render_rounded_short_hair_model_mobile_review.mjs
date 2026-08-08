import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = resolve(
  root,
  'artifacts/art/candidates/active/product-cat-prototypes-v1/concept-sheet-a-v2.png',
);
const output = resolve(
  root,
  'artifacts/art/review/rounded-short-haired-model-sheet-v1/mobile-review-375w.png',
);

const width = 375;
const height = 812;
const padding = 20;
const contentWidth = width - padding * 2;

function label(text, y) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${padding}" y="${y}" fill="#e8ddd1" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.1">${text}</text>
    </svg>
  `);
}

await mkdir(dirname(output), { recursive: true });

const leftColumn = await sharp(source)
  .extract({ left: 0, top: 0, width: 512, height: 758 })
  .resize({ width: contentWidth, height: 496, fit: 'contain', kernel: sharp.kernel.nearest })
  .png()
  .toBuffer();

const roomScale = await sharp(source)
  .extract({ left: 20, top: 760, width: 475, height: 250 })
  .resize({ width: contentWidth, height: 176, fit: 'contain', kernel: sharp.kernel.nearest })
  .png()
  .toBuffer();

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
    { input: label('EXACT LEFT-COLUMN CROP; REVIEW DERIVATIVE ONLY', 37) },
    { input: leftColumn, left: padding, top: 48 },
    { input: label('IN-ROOM SCALE FROM THE SAME MODEL SHEET', 570) },
    { input: roomScale, left: padding, top: 582 },
    { input: label('SOURCE: concept-sheet-a-v2.png — NOT A RUNTIME ASSET', 784) },
  ])
  .png()
  .toFile(output);

console.log(output);
