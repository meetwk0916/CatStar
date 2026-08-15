export interface ScriptedJumpGeometry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startedAt: number;
  duration: number;
  peakHeight: number;
}

export type ScriptedJumpPhase =
  | 'anticipation'
  | 'launch'
  | 'rising'
  | 'apex'
  | 'descent'
  | 'recovery';

export interface ScriptedJumpSample {
  x: number;
  y: number;
  frame: number;
  phase: ScriptedJumpPhase;
  complete: boolean;
}

const ANTICIPATION_END = 0.12;
const LANDING_START = 0.78;
const PHASES: readonly { end: number; phase: ScriptedJumpPhase }[] = [
  { end: ANTICIPATION_END, phase: 'anticipation' },
  { end: 0.28, phase: 'launch' },
  { end: 0.44, phase: 'rising' },
  { end: 0.61, phase: 'apex' },
  { end: LANDING_START, phase: 'descent' },
  { end: 1, phase: 'recovery' },
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const interpolate = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

export function sampleScriptedJump(
  jump: ScriptedJumpGeometry,
  time: number,
): ScriptedJumpSample {
  const progress = clamp((time - jump.startedAt) / jump.duration, 0, 1);
  const flightProgress = clamp(
    (progress - ANTICIPATION_END) / (LANDING_START - ANTICIPATION_END),
    0,
    1,
  );
  const easedFlightProgress = (1 - Math.cos(flightProgress * Math.PI)) / 2;
  const arcY = Math.sin(flightProgress * Math.PI) * jump.peakHeight;
  const frame = PHASES.findIndex(({ end }) => progress < end);
  const resolvedFrame = frame === -1 ? PHASES.length - 1 : frame;

  return {
    x: interpolate(jump.fromX, jump.toX, easedFlightProgress),
    y: interpolate(jump.fromY, jump.toY, easedFlightProgress) - arcY,
    frame: resolvedFrame,
    phase: PHASES[resolvedFrame].phase,
    complete: progress >= 1,
  };
}
