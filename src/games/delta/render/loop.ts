import { step } from '../logic/simulation';
import { TICK_MS } from '../logic/types';
import type { DeltaState, Level } from '../logic/types';

const MAX_STEPS_PER_FRAME = 5;
const START_DELAY = 3000;

export interface LoopCallbacks {
  onStep(previous: DeltaState, current: DeltaState): void;
  // alpha: share of the next step already elapsed, to interpolate the units.
  // elapsed: milliseconds since the previous frame, 0 after a pause.
  onFrame(current: DeltaState, alpha: number, elapsed: number): void;
  onEnd(state: DeltaState): void;
}

export interface GameLoop {
  state(): DeltaState;
  // An order, applied between two steps: it starts the time at once.
  apply(next: DeltaState): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export function startLoop(level: Level, initial: DeltaState, callbacks: LoopCallbacks): GameLoop {
  let current = initial;
  let waited = 0;
  let accumulated = 0;
  let lastTime: number | undefined;
  let frame: number | undefined;
  let running = true;

  function advance(elapsed: number): void {
    if (waited < START_DELAY) {
      waited += elapsed;
      return;
    }
    accumulated += elapsed;
    let steps = 0;
    while (accumulated >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
      accumulated -= TICK_MS;
      steps++;
      const previous = current;
      current = step(level, previous);
      callbacks.onStep(previous, current);
      if (current.outcome !== 'playing') {
        accumulated = 0;
        callbacks.onEnd(current);
        return;
      }
    }
    // Beyond five steps per frame, the delay is dropped rather than caught up.
    accumulated %= TICK_MS;
  }

  function tick(time: number): void {
    frame = undefined;
    const elapsed = lastTime === undefined ? 0 : time - lastTime;
    lastTime = time;
    if (current.outcome === 'playing') {
      advance(elapsed);
    }
    callbacks.onFrame(current, accumulated / TICK_MS, elapsed);
    if (running) {
      frame = requestAnimationFrame(tick);
    }
  }

  function cancel(): void {
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  }

  frame = requestAnimationFrame(tick);

  return {
    state() {
      return current;
    },
    apply(next) {
      current = next;
      waited = START_DELAY;
    },
    pause() {
      cancel();
      accumulated = 0;
      lastTime = undefined;
    },
    resume() {
      if (running && frame === undefined) {
        frame = requestAnimationFrame(tick);
      }
    },
    stop() {
      running = false;
      cancel();
    },
  };
}
