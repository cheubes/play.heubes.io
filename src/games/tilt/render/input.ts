import type { Direction } from '../logic/types';

export type TiltInput = { type: 'tilt'; direction: Direction } | { type: 'undo' };

const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const UNDO_KEYS = new Set(['z', 'Z', 'Backspace']);
const SWIPE_THRESHOLD = 30;

function swipeDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

export function bindInput(container: HTMLElement, signal: AbortSignal, onInput: (input: TiltInput) => void): void {
  container.addEventListener(
    'keydown',
    (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const direction = ARROW_DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        onInput({ type: 'tilt', direction });
      } else if (UNDO_KEYS.has(event.key)) {
        event.preventDefault();
        onInput({ type: 'undo' });
      }
    },
    { signal },
  );

  let swipeStart: { pointerId: number; x: number; y: number } | undefined;

  container.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      container.setPointerCapture(event.pointerId);
      swipeStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    },
    { signal },
  );

  container.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerId !== swipeStart?.pointerId) {
        return;
      }
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = undefined;
      if (Math.hypot(dx, dy) > SWIPE_THRESHOLD) {
        onInput({ type: 'tilt', direction: swipeDirection(dx, dy) });
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerId === swipeStart?.pointerId) {
        swipeStart = undefined;
      }
    },
    { signal },
  );
}
