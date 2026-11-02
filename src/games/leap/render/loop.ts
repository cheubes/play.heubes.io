import { step } from '../logic/leap';
import type { LeapState, Level } from '../logic/types';

const STEP_DURATION = 1000 / 60;
const MAX_STEPS_PER_FRAME = 4;

export interface LoopCallbacks {
  onStep(previous: LeapState, current: LeapState): void;
  // alpha: share of the next step already elapsed, to interpolate between the two states.
  onFrame(previous: LeapState, current: LeapState, alpha: number): void;
  onComplete(state: LeapState): void;
}

export interface GameLoop {
  press(): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export function startLoop(level: Level, initial: LeapState, callbacks: LoopCallbacks): GameLoop {
  let previous = initial;
  let current = initial;
  let pressed = false;
  let accumulated = 0;
  let lastTime: number | undefined;
  let frame: number | undefined;
  let running = true;

  function tick(time: number): void {
    frame = undefined;
    accumulated += lastTime === undefined ? 0 : time - lastTime;
    lastTime = time;
    let steps = 0;
    while (accumulated >= STEP_DURATION && steps < MAX_STEPS_PER_FRAME) {
      accumulated -= STEP_DURATION;
      steps++;
      previous = current;
      current = step(level, current, pressed);
      pressed = false;
      callbacks.onStep(previous, current);
      if (current.outcome === 'complete') {
        running = false;
        callbacks.onFrame(previous, current, 1);
        callbacks.onComplete(current);
        return;
      }
    }
    // Beyond four steps per frame, the delay is dropped rather than caught up.
    accumulated %= STEP_DURATION;
    callbacks.onFrame(previous, current, accumulated / STEP_DURATION);
    frame = requestAnimationFrame(tick);
  }

  function schedule(): void {
    if (running && frame === undefined) {
      frame = requestAnimationFrame(tick);
    }
  }

  function cancel(): void {
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  }

  schedule();

  return {
    press() {
      pressed = true;
    },
    pause() {
      cancel();
      pressed = false;
      accumulated = 0;
      lastTime = undefined;
    },
    resume() {
      schedule();
    },
    stop() {
      running = false;
      cancel();
    },
  };
}
