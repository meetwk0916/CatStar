import { describe, expect, it } from 'vitest';
import { sampleScriptedJump } from './scriptedJump';

const JUMP = {
  fromX: 100,
  fromY: 225,
  toX: 340,
  toY: 158,
  startedAt: 1_000,
  duration: 880,
  peakHeight: 58,
};

describe('scripted jump motion', () => {
  it('holds grounded anticipation and landing recovery around one airborne arc', () => {
    const anticipation = sampleScriptedJump(JUMP, 1_080);
    const apex = sampleScriptedJump(JUMP, 1_440);
    const landing = sampleScriptedJump(JUMP, 1_720);
    const complete = sampleScriptedJump(JUMP, 1_880);

    expect(anticipation).toMatchObject({ x: 100, y: 225, frame: 0, phase: 'anticipation' });
    expect(apex.frame).toBe(3);
    expect(apex.phase).toBe('apex');
    expect(apex.y).toBeLessThan(158);
    expect(landing).toMatchObject({ x: 340, y: 158, frame: 5, phase: 'recovery' });
    expect(complete).toMatchObject({ x: 340, y: 158, frame: 5, complete: true });
  });
});
