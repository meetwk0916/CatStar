import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const JUMP_DIR = join(
  ROOT,
  'artifacts/art/candidates/active/product-cat-jump-v6',
);

describe('production jump motion', () => {
  it('ships six distinct phases bound to the production identity authority', async () => {
    const metadata = JSON.parse(
      await readFile(join(JUMP_DIR, 'metadata.json'), 'utf8'),
    ) as {
      identityAuthority?: string;
      sourceSha256?: string;
      framesMetadata?: unknown[];
    };
    const readme = await readFile(join(JUMP_DIR, 'README.md'), 'utf8');
    const sheetPath = join(JUMP_DIR, 'sprite-sheets-96/jump.png');
    const sheet = sharp(sheetPath);
    const sheetMetadata = await sheet.metadata();
    const frameHashes = await Promise.all(
      Array.from({ length: 6 }, async (_, frame) =>
        createHash('sha256')
          .update(
            await sharp(sheetPath)
              .extract({ left: frame * 96, top: 0, width: 96, height: 96 })
              .raw()
              .toBuffer(),
          )
          .digest('hex'),
      ),
    );

    expect(metadata.identityAuthority).toContain('product-cat-model-sheet-v1');
    expect(metadata.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.framesMetadata).toHaveLength(6);
    expect(readme).toContain('internal prototype');
    expect(sheetMetadata).toMatchObject({ width: 576, height: 96 });
    expect(new Set(frameHashes)).toHaveLength(6);
  });

  it('wires the six-phase master into the runtime coat build', async () => {
    const candidate = await readFile(join(JUMP_DIR, 'sprite-sheets-96/jump.png'));
    const runtime = await readFile(
      join(
        ROOT,
        'public/assets/scenes/window-room/cat/gray-white-tabby/jump.png',
      ),
    );
    const coatBuilder = await readFile(
      join(ROOT, 'scripts/build_cat_coat_presets.py'),
      'utf8',
    );

    expect(runtime.equals(candidate)).toBe(true);
    expect(coatBuilder).toContain('product-cat-jump-v6/sprite-sheets-96/jump.png');
  });

  it('preserves a stable body mass across all six jump phases', async () => {
    const sheetPath = join(JUMP_DIR, 'sprite-sheets-96/jump.png');
    const areas = await Promise.all(
      Array.from({ length: 6 }, async (_, frame) => {
        const { data, info } = await sharp(sheetPath)
          .extract({ left: frame * 96, top: 0, width: 96, height: 96 })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let area = 0;
        for (let index = 3; index < data.length; index += info.channels) {
          if (data[index] > 24) area += 1;
        }
        return area;
      }),
    );

    expect((Math.max(...areas) - Math.min(...areas)) / Math.max(...areas)).toBeLessThanOrEqual(
      0.28,
    );
  });

  it('records approved desktop and mobile evidence for the complete jump route', async () => {
    const manifest = JSON.parse(
      await readFile(
        join(
          ROOT,
          'artifacts/art/runtime-motion-review/2026-08-15-jump-v3/manifest.json',
        ),
        'utf8',
      ),
    ) as {
      presets?: string[];
      actions?: string[];
      viewports?: string[];
      entries?: Array<{
        motionState?: string;
        humanReview?: { status?: string; reviewer?: string };
      }>;
    };

    expect(manifest.presets).toEqual(['gray-white-tabby']);
    expect(manifest.actions).toEqual(['jump']);
    expect(manifest.viewports).toEqual(['1280x720', '390x844']);
    expect(manifest.entries).toHaveLength(2);
    expect(
      manifest.entries?.every(
        (entry) =>
          entry.motionState === 'complete' &&
          entry.humanReview?.status === 'pass' &&
          entry.humanReview.reviewer === 'meetwk0916',
      ),
    ).toBe(true);
  });
});
