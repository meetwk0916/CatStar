export type CatPalette = "ORANGE" | "BLACK" | "WHITE" | "CALICO" | "TUXEDO";
export type CatPersonality = "GLUTTON" | "ALOOFS" | "CLINGY" | "ENERGY";

export interface ICatPassport {
  id: string;
  catName: string;
  ownerName: string;
  colorPalette: CatPalette;
  personality: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
  createdAt: number;
  readLetters: number[];
  isFarewellCompleted: boolean;
}

export type CatFsmState =
  | "IDLE"
  | "WALKING"
  | "JUMPING"
  | "EATING"
  | "SLEEPING"
  | "INTERACTING";

export interface ILetter {
  id: number;
  deliveryIndex: number;
  title: string;
  templateContent: string;
}

export type LetterViewState = "readable" | "final-waiting";
