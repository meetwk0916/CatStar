import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MODEL_SOURCE = join(
  ROOT,
  'artifacts/art/candidates/active/product-cat-model-sheet-v1/sources/model-sheet-chromakey.png',
);
const DAILY_LIFE_DIR = join(
  ROOT,
  'artifacts/art/candidates/active/product-cat-daily-life-v1',
);

const ACTIONS = {
  eat: 6,
  groom: 8,
  stretch: 6,
} as const;

const EAT_MIN_SPRITE_HEIGHT = 56;
const EAT_MAX_HEIGHT_SPREAD = 12;

describe('daily-life motion slice', () => {
  it('binds every action to the production model sheet lineage', async () => {
    await expect(access(MODEL_SOURCE)).resolves.toBeUndefined();

    const readme = await readFile(join(DAILY_LIFE_DIR, 'README.md'), 'utf8');
    expect(readme).toContain('product-cat-model-sheet-v1');
    expect(readme).toContain('internal prototype');

    const metadata = JSON.parse(
      await readFile(join(DAILY_LIFE_DIR, 'metadata.json'), 'utf8'),
    ) as { identityAuthority?: string; actions?: Record<string, unknown> };
    expect(metadata.identityAuthority).toContain('product-cat-model-sheet-v1');
    expect(metadata.actions).toEqual(
      expect.objectContaining({
        eat: expect.objectContaining({
          source: expect.stringContaining('sources/eat-source-chromakey.png'),
          sourceSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
          alpha: expect.stringContaining('alpha/eat-source.png'),
          alphaSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        groom: expect.anything(),
        stretch: expect.anything(),
      }),
    );
  });

  it.each(Object.entries(ACTIONS))(
    'ships a %s runtime sheet with the ten-action frame contract',
    async (action, frames) => {
      const runtimePath = join(
        ROOT,
        'public/assets/scenes/window-room/cat/gray-white-tabby',
        `${action}.png`,
      );
      const candidatePath = join(
        DAILY_LIFE_DIR,
        'sprite-sheets-96',
        `${action}.png`,
      );

      await expect(access(runtimePath)).resolves.toBeUndefined();
      await expect(access(candidatePath)).resolves.toBeUndefined();

      for (const path of [runtimePath, candidatePath]) {
        const metadata = await sharp(path).metadata();
        expect(metadata.width).toBe(96 * frames);
        expect(metadata.height).toBe(96);
      }
    },
  );

  it('keeps the eat motion at a stable standing scale', async () => {
    const metadata = JSON.parse(
      await readFile(join(DAILY_LIFE_DIR, 'metadata.json'), 'utf8'),
    ) as {
      actions?: Record<string, { framesMetadata?: Array<{ sprite_size?: [number, number] }> }>;
    };
    const eatFrames = metadata.actions?.eat?.framesMetadata ?? [];
    const heights = eatFrames.map((frame) => frame.sprite_size?.[1] ?? 0);

    expect(heights).toHaveLength(ACTIONS.eat);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(EAT_MIN_SPRITE_HEIGHT);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(
      EAT_MAX_HEIGHT_SPREAD,
    );
  });

  it('records complete desktop and mobile motion evidence for the master coat', async () => {
    const manifest = JSON.parse(
      await readFile(
        join(
          ROOT,
          'artifacts/art/runtime-motion-review/2026-08-09-daily-life-v1/manifest.json',
        ),
        'utf8',
      ),
    ) as {
      presets?: string[];
      actions?: string[];
      viewports?: string[];
      entries?: Array<{ motionState?: string }>;
    };

    expect(manifest.presets).toEqual(['gray-white-tabby']);
    expect(manifest.actions).toEqual(['eat', 'groom', 'stretch']);
    expect(manifest.viewports).toEqual(['1280x720', '390x844']);
    expect(manifest.entries).toHaveLength(6);
    expect(manifest.entries?.every((entry) => entry.motionState === 'complete')).toBe(true);
  });
});
