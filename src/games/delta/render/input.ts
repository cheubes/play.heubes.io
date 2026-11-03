import type { SelectionDirection } from '../../shell/selection';
import type { Point } from '../logic/types';

// Points are in CSS pixels from the top left corner of the canvas.
export type DeltaInput =
  | { type: 'press'; point: Point }
  | { type: 'drag'; point: Point }
  | { type: 'release'; point: Point; dragged: boolean }
  | { type: 'arrow'; direction: SelectionDirection }
  | { type: 'activate' }
  | { type: 'back' };

const ARROW_DIRECTIONS: Record<string, SelectionDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const ACTIVATE_KEYS = new Set([' ', 'Enter']);
const DRAG_THRESHOLD = 10;

export function bindInput(container: HTMLElement, canvas: HTMLCanvasElement, signal: AbortSignal, onInput: (input: DeltaInput) => void): void {
  container.addEventListener(
    'keydown',
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const direction = ARROW_DIRECTIONS[event.key];
      // Holding an arrow moves the cursor on; holding another key does not repeat it.
      if (direction) {
        event.preventDefault();
        onInput({ type: 'arrow', direction });
      } else if (event.repeat) {
        return;
      } else if (ACTIVATE_KEYS.has(event.key)) {
        event.preventDefault();
        onInput({ type: 'activate' });
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        onInput({ type: 'back' });
      }
    },
    { signal },
  );

  let press: { pointerId: number; start: Point; dragged: boolean } | undefined;

  function pointOf(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  container.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      const point = pointOf(event);
      press = { pointerId: event.pointerId, start: point, dragged: false };
      container.setPointerCapture(event.pointerId);
      onInput({ type: 'press', point });
    },
    { signal },
  );

  container.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerId !== press?.pointerId) {
        return;
      }
      const point = pointOf(event);
      press.dragged ||= Math.hypot(point.x - press.start.x, point.y - press.start.y) > DRAG_THRESHOLD;
      if (press.dragged) {
        onInput({ type: 'drag', point });
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerId !== press?.pointerId) {
        return;
      }
      const { dragged } = press;
      press = undefined;
      onInput({ type: 'release', point: pointOf(event), dragged });
    },
    { signal },
  );

  // A cancelled pointer (a system gesture, for instance) gives up the order in progress.
  container.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerId === press?.pointerId) {
        press = undefined;
        onInput({ type: 'release', point: { x: -Infinity, y: -Infinity }, dragged: true });
      }
    },
    { signal },
  );
}
