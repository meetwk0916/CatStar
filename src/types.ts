export type CatCoatPreset =
  | "ORANGE_TABBY"
  | "SOLID_BLACK"
  | "SOLID_WHITE"
  | "CALICO"
  | "TUXEDO"
  | "GRAY_WHITE_TABBY";

export type CatTemperament = "QUIET" | "CURIOUS" | "AFFECTIONATE" | "LIVELY";
export type CatPalette = "GRAY_WHITE" | "ORANGE" | "BLACK" | "WHITE" | "CALICO" | "TUXEDO";
export type CatPersonality = "GLUTTON" | "ALOOFS" | "CLINGY" | "ENERGY";

export interface ICatPassport {
  schemaVersion?: 1;
  id: string;
  catName: string;
  ownerName: string;
  coatPreset?: CatCoatPreset;
  temperament?: CatTemperament;
  colorPalette?: CatPalette;
  personality?: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
  createdAt: number;
  readLetters: number[];
  isFarewellCompleted: boolean;
}

export interface ILetter {
  id: number;
  deliveryIndex: number;
  title: string;
  templateContent: string;
}

export type LetterViewState = "readable" | "final-waiting";
