import { nextSelection as nextSharedSelection } from '../../shell/selection';
import type { Direction, Level, Position } from '../logic/types';

export type PrismInput =
  | { type: 'tap'; position: Position }
  | { type: 'select'; direction: Direction }
  | { type: 'activate' }
  | { type: 'undo' };

export interface InputHandlers {
  onInput(input: PrismInput): void;
  onPointerDown(): void;
}

const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const ACTIVATE_KEYS = new Set([' ', 'Enter']);
const UNDO_KEYS = new Set(['z', 'Z', 'Backspace']);
const TAP_TOLERANCE = 10;

function orientablePositions(level: Level): Position[] {
  return level.elements
    .filter((element) => (element.type === 'mirror' || element.type === 'prism') && !element.fixed)
    .map((element) => element.position)
    .sort((first, second) => first.row - second.row || first.col - second.col);
}

export function firstSelection(level: Level): Position | undefined {
  return orientablePositions(level)[0];
}

export function nextSelection(level: Level, from: Position, direction: Direction): Position {
  return nextSharedSelection(orientablePositions(level), from, direction, (position) => ({ x: position.col, y: position.row }));
}

export function bindInput(container: HTMLElement, signal: AbortSignal, handlers: InputHandlers): void {
  container.addEventListener(
    'keydown',
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const direction = ARROW_DIRECTIONS[event.key];
      // Holding an arrow moves the selection on; holding a toggle or undo key does not repeat the move.
      if (direction) {
        event.preventDefault();
        handlers.onInput({ type: 'select', direction });
      } else if (event.repeat) {
        return;
      } else if (ACTIVATE_KEYS.has(event.key)) {
        event.preventDefault();
        handlers.onInput({ type: 'activate' });
      } else if (UNDO_KEYS.has(event.key)) {
        event.preventDefault();
        handlers.onInput({ type: 'undo' });
      }
    },
    { signal },
  );

  let press: { pointerId: number; x: number; y: number; position: Position } | undefined;

  container.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      handlers.onPointerDown();
      const cell = event.target instanceof Element ? event.target.closest<SVGElement>('.prism-hit') : null;
      press = cell
        ? {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            position: { row: Number(cell.dataset.row), col: Number(cell.dataset.col) },
          }
        : undefined;
    },
    { signal },
  );

  container.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerId !== press?.pointerId) {
        return;
      }
      const { x, y, position } = press;
      press = undefined;
      if (Math.hypot(event.clientX - x, event.clientY - y) <= TAP_TOLERANCE) {
        handlers.onInput({ type: 'tap', position });
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerId === press?.pointerId) {
        press = undefined;
      }
    },
    { signal },
  );
}
