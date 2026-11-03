import type { Owner, Side, Unit } from '../logic/types';

const CAPTURE_DURATION = 300;
const PULSE_DURATION = 300;
const PULSE_GAP = 80;
const FADE_DURATION = 400;
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
  // Victory: the player's basins pulse one after the other. Progress from 0 to 1, absent before a pulse starts.
  pulses: readonly { basin: number; progress: number }[];
  // Defeat: the last basins and units of the player fade out.
  fading?: { basins: readonly number[]; units: readonly Unit[]; progress: number };
}

export interface Effects {
  advance(elapsed: number): void;
  capture(basin: number, from: Owner, to: Side): void;
  // An input finishes the effects in progress.
  finish(): void;
  won(basins: readonly number[]): void;
  lost(basins: readonly number[], units: readonly Unit[]): void;
  // Whether the victory or defeat animation is still running.
  ending(): boolean;
  frame(): FrameEffects;
}

export function createEffects(reducedMotion: boolean): Effects {
  let clock = 0;
  let captures: { basin: number; from: Owner; to: Side; start: number }[] = [];
  let end: { kind: 'won' | 'lost'; start: number; duration: number; basins: readonly number[]; units: readonly Unit[] } | undefined;

  function endProgress(start: number, duration: number): number {
    return Math.min(1, (clock - start) / duration);
  }

  function pulses(start: number, basins: readonly number[]): { basin: number; progress: number }[] {
    return basins.flatMap((basin, order) => {
      const pulseStart = start + order * PULSE_GAP;
      return clock < pulseStart ? [] : [{ basin, progress: endProgress(pulseStart, PULSE_DURATION) }];
    });
  }

  return {
    advance(elapsed) {
      clock += elapsed;
      captures = captures.filter((capture) => clock - capture.start < CAPTURE_DURATION);
      if (end && clock - end.start >= end.duration) {
        end = undefined;
      }
    },
    capture(basin, from, to) {
      if (!reducedMotion) {
        captures = [...captures.filter((capture) => capture.basin !== basin), { basin, from, to, start: clock }];
      }
    },
    finish() {
      captures = [];
      end = undefined;
    },
    won(basins) {
      if (!reducedMotion && basins.length > 0) {
        end = { kind: 'won', start: clock, duration: PULSE_GAP * (basins.length - 1) + PULSE_DURATION, basins, units: [] };
      }
    },
    lost(basins, units) {
      if (!reducedMotion) {
        end = { kind: 'lost', start: clock, duration: FADE_DURATION, basins, units };
      }
    },
    ending() {
      return end !== undefined;
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
        pulses: end?.kind === 'won' ? pulses(end.start, end.basins) : [],
        fading: end?.kind === 'lost' ? { basins: end.basins, units: end.units, progress: endProgress(end.start, end.duration) } : undefined,
      };
    },
  };
}
