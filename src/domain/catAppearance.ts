import type { CatCoatPreset } from "../types";

export type CatAppearanceAuthority =
  | "ROUNDED_SHORT_HAIR_MASTER"
  | "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE"
  | "BIG_GINGER_INTERNAL_PREVIEW_V2";

export interface CatRuntimeAppearance {
  assetDirectory: string;
  authority: CatAppearanceAuthority;
  isInternalPreview: boolean;
}

const CAT_RUNTIME_APPEARANCES: Record<CatCoatPreset, CatRuntimeAppearance> = {
  GRAY_WHITE_TABBY: {
    assetDirectory: "gray-white-tabby",
    authority: "ROUNDED_SHORT_HAIR_MASTER",
    isInternalPreview: false,
  },
  ORANGE_TABBY: {
    assetDirectory: "orange-tabby",
    authority: "BIG_GINGER_INTERNAL_PREVIEW_V2",
    isInternalPreview: true,
  },
  SOLID_BLACK: {
    assetDirectory: "solid-black",
    authority: "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE",
    isInternalPreview: false,
  },
  SOLID_WHITE: {
    assetDirectory: "solid-white",
    authority: "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE",
    isInternalPreview: false,
  },
  CALICO: {
    assetDirectory: "calico",
    authority: "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE",
    isInternalPreview: false,
  },
  TUXEDO: {
    assetDirectory: "tuxedo",
    authority: "ROUNDED_SHORT_HAIR_COAT_DERIVATIVE",
    isInternalPreview: false,
  },
};

export function getCatRuntimeAppearance(coatPreset: CatCoatPreset): CatRuntimeAppearance {
  return CAT_RUNTIME_APPEARANCES[coatPreset];
}
