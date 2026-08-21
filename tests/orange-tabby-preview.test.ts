import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CAT_DIR = join(ROOT, "public/assets/scenes/window-room/cat");
const ACTIONS = [
  "idle",
  "sit",
  "walk",
  "jump",
  "eat",
  "lie",
  "sleep",
  "groom",
  "stretch",
  "interact",
] as const;

async function rgba(path: string) {
  return sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

describe("internal big-ginger orange-tabby preview", () => {
  it("uses the dedicated big-ginger silhouette across all ten actions", async () => {
    const shapeActions = new Set(ACTIONS);
    for (const action of ACTIONS) {
      const source = await rgba(join(CAT_DIR, "gray-white-tabby", `${action}.png`));
      const preview = await rgba(join(CAT_DIR, "orange-tabby", `${action}.png`));

      expect(preview.info, action).toMatchObject(source.info);
      let alphaMatches = true;
      for (let index = 3; index < source.data.length; index += source.info.channels) {
        if (preview.data[index] !== source.data[index]) {
          alphaMatches = false;
          break;
        }
      }
      expect(alphaMatches, action).toBe(!shapeActions.has(action));

      if (shapeActions.has(action)) {
        const candidate = await readFile(
          join(
            ROOT,
            "artifacts/art/candidates/active/product-cat-orange-tabby-preview-v2",
            "sprite-sheets-96",
            `${action}.png`,
          ),
        );
        const runtime = await readFile(join(CAT_DIR, "orange-tabby", `${action}.png`));
        expect(runtime, action).toEqual(candidate);
      }
    }
  });

  it("reads as predominantly warm orange without white bibs, socks, or paws", async () => {
    let actionsWithCreamMuzzle = 0;
    for (const action of ACTIONS) {
      const { data, info } = await rgba(
        join(CAT_DIR, "orange-tabby", `${action}.png`),
      );
      let visible = 0;
      let warmOrange = 0;
      let neutralWhite = 0;
      let creamMuzzle = 0;

      for (let index = 0; index < data.length; index += info.channels) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];
        if (alpha <= 24) continue;
        visible += 1;
        if (red > green * 1.12 && green > blue * 1.15) warmOrange += 1;
        const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
        if (luminance > 214 && Math.max(red, green, blue) - Math.min(red, green, blue) < 38) {
          neutralWhite += 1;
        }
        if (
          red >= 200 &&
          green >= 150 &&
          blue >= 85 &&
          red - green >= 20 &&
          red - green <= 70 &&
          green - blue >= 35 &&
          green - blue <= 90
        ) {
          creamMuzzle += 1;
        }
      }

      expect(warmOrange / visible, `${action} warm-orange coverage`).toBeGreaterThanOrEqual(
        0.85,
      );
      expect(neutralWhite, `${action} neutral-white pixels`).toBe(0);
      if (creamMuzzle > 0) actionsWithCreamMuzzle += 1;
    }
    expect(actionsWithCreamMuzzle).toBeGreaterThanOrEqual(6);
  });

  it("keeps the approved direction image bound to its recorded fingerprint", async () => {
    const contract = JSON.parse(
      await readFile(
        join(ROOT, "artifacts/art/production-briefs/orange-tabby-v1/production-contract.json"),
        "utf8",
      ),
    ) as { appearance?: { minimumOrangeBodyCoverage?: number } };
    const brief = await readFile(
      join(ROOT, "artifacts/art/production-briefs/orange-tabby-v1/README.md"),
      "utf8",
    );

    expect(contract.appearance?.minimumOrangeBodyCoverage).toBe(0.85);
    expect(brief).toContain(
      "aba920526ece578f2ca8f19b16ace035c03f0b6b2cf5ab6eb6f500dae2ca511e",
    );
    expect(brief).toContain("editable production authority");
  });
});
