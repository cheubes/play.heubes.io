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
const CLICK_POINTER_TYPES = new Set(['mouse', 'pen']);

function swipeDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

// The board's diagonals split the play area into four sides, so a wide board keeps wide left and right sides.
function sideDirection(board: DOMRect, x: number, y: number): Direction {
  const dx = (x - (board.left + board.width / 2)) / board.width;
  const dy = (y - (board.top + board.height / 2)) / board.height;
  return swipeDirection(dx, dy);
}

export function bindInput(
  container: HTMLElement,
  signal: AbortSignal,
  getBoardRect: () => DOMRect | undefined,
  onAim: (direction: Direction | undefined) => void,
  onInput: (input: TiltInput) => void,
): void {
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

  let swipeStart: { pointerId: number; pointerType: string; x: number; y: number } | undefined;

  // A press that stays under the swipe threshold is a click on a side, for the mouse only: a short tap is ignored.
  function pendingDirection(event: PointerEvent): Direction | undefined {
    const start = swipeStart ?? { pointerType: event.pointerType, x: event.clientX, y: event.clientY };
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > SWIPE_THRESHOLD) {
      return swipeDirection(dx, dy);
    }
    const board = getBoardRect();
    if (!CLICK_POINTER_TYPES.has(start.pointerType) || !board) {
      return undefined;
    }
    return sideDirection(board, start.x, start.y);
  }

  container.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      container.setPointerCapture(event.pointerId);
      swipeStart = { pointerId: event.pointerId, pointerType: event.pointerType, x: event.clientX, y: event.clientY };
    },
    { signal },
  );

  container.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerId !== swipeStart?.pointerId) {
        return;
      }
      const direction = pendingDirection(event);
      swipeStart = undefined;
      if (direction) {
        onInput({ type: 'tilt', direction });
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointermove',
    (event) => {
      if (!event.isPrimary || (swipeStart && event.pointerId !== swipeStart.pointerId)) {
        return;
      }
      onAim(CLICK_POINTER_TYPES.has(event.pointerType) ? pendingDirection(event) : undefined);
    },
    { signal },
  );

  container.addEventListener('pointerleave', () => onAim(undefined), { signal });

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
