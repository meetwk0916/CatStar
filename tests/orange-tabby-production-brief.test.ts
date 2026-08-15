import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CAT_DIR = join(ROOT, "public/assets/scenes/window-room/cat");
const CONTRACT_PATH = join(
  ROOT,
  "artifacts/art/production-briefs/orange-tabby-v1/production-contract.json",
);

type ActionContract = {
  file: string;
  frames: number;
  width: number;
  height: number;
};

function pngDimensions(image: Buffer) {
  expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
}

describe("orange-tabby production handoff", () => {
  it("stays synchronized with the runtime motion master contract", async () => {
    const contract = JSON.parse(await readFile(CONTRACT_PATH, "utf8")) as {
      preset: string;
      runtimePreset: string;
      frameWidth: number;
      frameHeight: number;
      anchor: string;
      alphaGeometry: string;
      actions: Record<string, ActionContract>;
    };
    const animationSpec = JSON.parse(
      await readFile(join(CAT_DIR, "cat.animations.json"), "utf8"),
    ) as {
      frameWidth: number;
      frameHeight: number;
      anchor: string;
      actions: Record<string, { file: string; frames: number }>;
    };

    expect(contract.preset).toBe("orange-tabby");
    expect(contract.runtimePreset).toBe("ORANGE_TABBY");
    expect(contract.alphaGeometry).toBe("exact-gray-white-master-match");
    expect(contract.frameWidth).toBe(animationSpec.frameWidth);
    expect(contract.frameHeight).toBe(animationSpec.frameHeight);
    expect(contract.anchor).toBe(animationSpec.anchor);
    expect(Object.keys(contract.actions).sort()).toEqual(
      Object.keys(animationSpec.actions).sort(),
    );

    for (const [action, expected] of Object.entries(animationSpec.actions)) {
      const delivery = contract.actions[action];
      expect(delivery.file, action).toBe(expected.file);
      expect(delivery.frames, action).toBe(expected.frames);
      expect(delivery.width, action).toBe(expected.frames * contract.frameWidth);
      expect(delivery.height, action).toBe(contract.frameHeight);

      const master = await readFile(
        join(CAT_DIR, "gray-white-tabby", expected.file),
      );
      expect(pngDimensions(master), action).toEqual({
        width: delivery.width,
        height: delivery.height,
      });
    }
  });
});
