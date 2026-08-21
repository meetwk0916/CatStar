import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MASTER_EVIDENCE = join(
  ROOT,
  "artifacts/art/runtime-motion-review/2026-08-15-motion-master-v1",
);
const ACTION_SOURCES = {
  idle: "product-cat-quiet-motion-v1",
  sit: "product-cat-quality-slice-v12",
  walk: "product-cat-quality-slice-v12",
  jump: "product-cat-jump-v6",
  eat: "product-cat-daily-life-v1",
  lie: "product-cat-quiet-motion-v1",
  sleep: "product-cat-quiet-motion-v1",
  groom: "product-cat-daily-life-v1",
  stretch: "product-cat-daily-life-v1",
  interact: "product-cat-quality-slice-v12",
} as const;

describe("gray-white ten-action sources and historical motion evidence", () => {
  it("wires every action to a production-identity candidate", async () => {
    const builder = await readFile(
      join(ROOT, "scripts/build_cat_coat_presets.py"),
      "utf8",
    );

    for (const [action, source] of Object.entries(ACTION_SOURCES)) {
      expect(builder, action).toContain(source);
      expect(
        await readFile(
          join(
            ROOT,
            "public/assets/scenes/window-room/cat/gray-white-tabby",
            `${action}.png`,
          ),
        ),
        action,
      ).toEqual(
        await readFile(
          join(
            ROOT,
            "artifacts/art/candidates/active",
            source,
            "sprite-sheets-96",
            `${action}.png`,
          ),
        ),
      );
    }
  });

  it("retains the approved 2026-08-15 matrix as historical evidence", async () => {
    const manifest = JSON.parse(
      await readFile(join(MASTER_EVIDENCE, "manifest.json"), "utf8"),
    ) as {
      presets?: string[];
      actions?: string[];
      viewports?: string[];
      sourceFingerprint?: string;
      entries?: Array<{
        coatPreset?: string;
        action?: string;
        viewport?: string;
        motionState?: string;
        humanReview?: { status?: string; reviewer?: string };
        video?: string;
        entryPoster?: string;
        exitPoster?: string;
        evidenceSha256?: { video?: string; entryPoster?: string; exitPoster?: string };
      }>;
    };

    expect(manifest.presets).toEqual(["gray-white-tabby"]);
    expect(manifest.actions).toEqual(Object.keys(ACTION_SOURCES));
    expect(manifest.viewports).toEqual(["1280x720", "390x844"]);
    expect(manifest.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await readFile(join(ROOT, "docs/art/rights-and-provenance.md"), "utf8"),
    ).toContain("It is not current release acceptance.");
    expect(manifest.entries).toHaveLength(20);

    const matrix = new Set(
      manifest.entries?.map(
        (entry) => `${entry.action}/${entry.viewport}`,
      ),
    );
    expect(matrix).toEqual(
      new Set(
        Object.keys(ACTION_SOURCES).flatMap((action) => [
          `${action}/1280x720`,
          `${action}/390x844`,
        ]),
      ),
    );
    expect(
      manifest.entries?.every(
        (entry) =>
          entry.coatPreset === "gray-white-tabby" &&
          entry.motionState === "complete" &&
          entry.humanReview?.status === "pass" &&
          entry.humanReview.reviewer === "meetwk0916",
      ),
    ).toBe(true);

    for (const entry of manifest.entries ?? []) {
      expect(Object.keys(entry.evidenceSha256 ?? {}).sort()).toEqual([
        "entryPoster",
        "exitPoster",
        "video",
      ]);
      for (const field of ["video", "entryPoster", "exitPoster"] as const) {
        const relativePath = entry[field];
        expect(relativePath, `${entry.action}/${entry.viewport}/${field}`).toBeTruthy();
        const digest = createHash("sha256")
          .update(await readFile(join(MASTER_EVIDENCE, relativePath!)))
          .digest("hex");
        expect(entry.evidenceSha256?.[field]).toBe(digest);
      }
    }
  });
});
