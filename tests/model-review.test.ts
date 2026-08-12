import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  DESKTOP_ROOM_SOURCE,
  MODEL_SOURCE,
  MOBILE_ROOM_SOURCE,
  RUNTIME_CELL_SOURCE,
  renderReview,
} from '../scripts/render_rounded_short_hair_model_mobile_review.mjs';

describe('rounded short-haired model review', () => {
  it('uses the approved production model sheet and an in-room runtime review', async () => {
    expect(MODEL_SOURCE).toContain(
      'product-cat-model-sheet-v1/sources/model-sheet-chromakey.png',
    );
    expect(DESKTOP_ROOM_SOURCE).toContain(
      'runtime-review/2026-08-09/default-walk-4s.png',
    );
    expect(MOBILE_ROOM_SOURCE).toContain(
      'runtime-review/2026-08-09/mobile-sit-2s.png',
    );
    expect(RUNTIME_CELL_SOURCE).toContain(
      'public/assets/scenes/window-room/cat/gray-white-tabby/sit.png',
    );

    await expect(access(MODEL_SOURCE)).resolves.toBeUndefined();
    await expect(access(DESKTOP_ROOM_SOURCE)).resolves.toBeUndefined();
    await expect(access(MOBILE_ROOM_SOURCE)).resolves.toBeUndefined();
    await expect(access(RUNTIME_CELL_SOURCE)).resolves.toBeUndefined();
  });

  it('renders a fixed 375 by 812 review artifact', async () => {
    const output = join(
      await mkdtemp(join(tmpdir(), 'catstar-model-review-')),
      'mobile-review-375w.png',
    );
    await renderReview(output);
    const metadata = await sharp(output).metadata();

    expect(metadata.width).toBe(375);
    expect(metadata.height).toBe(812);
  });
});
