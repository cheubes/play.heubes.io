import type { Owner, Side } from '../logic/types';

const CAPTURE_DURATION = 300;
// Map units per second.
const CHEVRON_SPEED = 0.25;

export interface CaptureEffect {
  basin: number;
  from: Owner;
  to: Side;
  // From 0 to 1.
  progress: number;
}

// What the decorative effects change in a frame. In reduced motion, there is none of them.
export interface FrameEffects {
  trails: boolean;
  tideFade: boolean;
  // Distance the chevrons have flowed, in map units.
  chevronShift: number;
  captures: readonly CaptureEffect[];
}

export interface Effects {
  advance(elapsed: number): void;
  capture(basin: number, from: Owner, to: Side): void;
  // An input finishes the effects in progress.
  finish(): void;
  frame(): FrameEffects;
}

export function createEffects(reducedMotion: boolean): Effects {
  let clock = 0;
  let captures: { basin: number; from: Owner; to: Side; start: number }[] = [];

  return {
    advance(elapsed) {
      clock += elapsed;
      captures = captures.filter((capture) => clock - capture.start < CAPTURE_DURATION);
    },
    capture(basin, from, to) {
      if (!reducedMotion) {
        captures = [...captures.filter((capture) => capture.basin !== basin), { basin, from, to, start: clock }];
      }
    },
    finish() {
      captures = [];
    },
    frame() {
      return {
        trails: !reducedMotion,
        tideFade: !reducedMotion,
        chevronShift: reducedMotion ? 0 : (clock / 1000) * CHEVRON_SPEED,
        captures: captures.map(({ basin, from, to, start }) => ({
          basin,
          from,
          to,
          progress: Math.min(1, (clock - start) / CAPTURE_DURATION),
        })),
      };
    },
  };
}
