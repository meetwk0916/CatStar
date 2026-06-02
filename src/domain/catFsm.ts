import type { CatFsmState, CatPersonality } from "../types";

type WeightedState = Exclude<CatFsmState, "INTERACTING">;
type Weights = Record<WeightedState, number>;

const DEFAULT_WEIGHTS: Weights = {
  IDLE: 30,
  WALKING: 30,
  JUMPING: 10,
  EATING: 10,
  SLEEPING: 20,
};

const PERSONALITY_WEIGHTS: Record<CatPersonality, Weights> = {
  ALOOFS: {
    SLEEPING: 50,
    IDLE: 30,
    WALKING: 10,
    JUMPING: 5,
    EATING: 5,
  },
  GLUTTON: {
    EATING: 40,
    WALKING: 20,
    IDLE: 20,
    SLEEPING: 10,
    JUMPING: 10,
  },
  ENERGY: {
    WALKING: 40,
    JUMPING: 35,
    IDLE: 10,
    SLEEPING: 10,
    EATING: 5,
  },
  CLINGY: {
    IDLE: 35,
    WALKING: 25,
    JUMPING: 20,
    EATING: 10,
    SLEEPING: 10,
  },
};

export function getStateWeights(personality: CatPersonality): Weights {
  return PERSONALITY_WEIGHTS[personality] ?? DEFAULT_WEIGHTS;
}

export function chooseNextState(personality: CatPersonality, random = Math.random()): WeightedState {
  const weights = getStateWeights(personality);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let cursor = random * total;

  for (const [state, weight] of Object.entries(weights) as Array<[WeightedState, number]>) {
    cursor -= weight;
    if (cursor <= 0) {
      return state;
    }
  }

  return "IDLE";
}

export function getCompanionReaction(state: CatFsmState): string {
  const reactions: Record<CatFsmState, string[]> = {
    IDLE: ["我在呢。", "今天的星星很安静。"],
    WALKING: ["我在云朵草坪上走走。", "这里的路软软的。"],
    JUMPING: ["刚刚跳得好高。", "你看见那颗星了吗？"],
    EATING: ["这里也有好吃的。", "我会好好吃饭的。"],
    SLEEPING: ["我睡得很暖。", "梦里也有小小的家。"],
    INTERACTING: ["我听见你啦。", "轻轻摸摸也收到啦。"],
  };

  const options = reactions[state];
  return options[Math.floor(Math.random() * options.length)];
}
