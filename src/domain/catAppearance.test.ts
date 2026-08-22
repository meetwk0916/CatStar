import { describe, expect, it } from "vitest";
import { getCatRuntimeAppearance } from "./catAppearance";

describe("cat runtime appearance authority", () => {
  it("keeps orange as a persisted coat choice while marking its current pixels internal-only", () => {
    expect(getCatRuntimeAppearance("ORANGE_TABBY")).toEqual({
      assetDirectory: "orange-tabby",
      authority: "BIG_GINGER_INTERNAL_PREVIEW_V2",
      isInternalPreview: true,
    });
  });

  it("keeps the ordinary coat choices on the rounded short-haired authority", () => {
    expect(getCatRuntimeAppearance("GRAY_WHITE_TABBY").authority).toBe(
      "ROUNDED_SHORT_HAIR_MASTER",
    );
    for (const preset of ["SOLID_BLACK", "SOLID_WHITE", "CALICO", "TUXEDO"] as const) {
      expect(getCatRuntimeAppearance(preset)).toMatchObject({
        authority: "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE",
        isInternalPreview: false,
      });
    }
  });
});
