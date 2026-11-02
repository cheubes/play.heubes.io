import type { Fold, Sheet } from '../logic/types';

export type Arrow = 'up' | 'down' | 'left' | 'right';

export type FoldInput =
  | { type: 'drag'; fold: Fold | undefined }
  | { type: 'release'; fold: Fold | undefined }
  | { type: 'cancel' }
  | { type: 'move-cursor'; arrow: Arrow }
  | { type: 'fold-cursor'; arrow: Arrow }
  | { type: 'undo' };

export interface Cursor {
  axis: Fold['axis'];
  line: number;
}

export interface SheetGeometry {
  rect: DOMRect;
  cellSize: number;
  sheet: Sheet;
}

export interface InputHandlers {
  onInput(input: FoldInput): void;
  // Called before a gesture starts, so that it is measured on the sheet left by a finished animation.
  onPointerDown(): void;
  geometry(): SheetGeometry | undefined;
}

export interface FoldInputControl {
  cancelGesture(): void;
}

const ARROWS: Record<string, Arrow> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const UNDO_KEYS = new Set(['z', 'Z', 'Backspace']);
const DRAG_THRESHOLD = 10;

function lineCount(sheet: Sheet, axis: Fold['axis']): number {
  return (axis === 'vertical' ? sheet.cols : sheet.rows) - 1;
}

function clampLine(line: number, count: number): number {
  return Math.min(Math.max(line, 1), count);
}

// Undefined when the sheet has no line of that orientation.
export function centerCursor(sheet: Sheet, axis: Fold['axis']): Cursor | undefined {
  const count = lineCount(sheet, axis);
  return count > 0 ? { axis, line: Math.floor((count + 1) / 2) } : undefined;
}

export function moveCursor(sheet: Sheet, cursor: Cursor | undefined, arrow: Arrow): Cursor | undefined {
  const axis = arrow === 'left' || arrow === 'right' ? 'vertical' : 'horizontal';
  if (cursor?.axis !== axis) {
    return centerCursor(sheet, axis) ?? cursor;
  }
  const step = arrow === 'left' || arrow === 'up' ? -1 : 1;
  return { axis, line: clampLine(cursor.line + step, lineCount(sheet, axis)) };
}

// Shift + an arrow folds the part opposite the arrow over the cursor line, in the direction of the arrow.
export function cursorFold(cursor: Cursor | undefined, arrow: Arrow): Fold | undefined {
  const axis = arrow === 'left' || arrow === 'right' ? 'vertical' : 'horizontal';
  if (cursor?.axis !== axis) {
    return undefined;
  }
  return { axis, line: cursor.line, moving: arrow === 'right' || arrow === 'down' ? 'before' : 'after' };
}

// Dragging pulls the opposite edge of the sheet: the fold line lies halfway between that edge and where it lands.
export function dragFold(dx: number, dy: number, { cellSize, sheet }: SheetGeometry): Fold | undefined {
  if (Math.hypot(dx, dy) < DRAG_THRESHOLD || cellSize <= 0) {
    return undefined;
  }
  const axis = Math.abs(dx) >= Math.abs(dy) ? 'vertical' : 'horizontal';
  const delta = axis === 'vertical' ? dx : dy;
  const distance = Math.abs(delta) / cellSize;
  const count = lineCount(sheet, axis);
  if (distance < 1 || count < 1) {
    return undefined;
  }
  const offset = clampLine(Math.round(distance / 2), count);
  return delta > 0 ? { axis, line: offset, moving: 'before' } : { axis, line: count + 1 - offset, moving: 'after' };
}

function sameFold(first: Fold | undefined, second: Fold | undefined): boolean {
  return first?.axis === second?.axis && first?.line === second?.line && first?.moving === second?.moving;
}

export function bindInput(container: HTMLElement, signal: AbortSignal, handlers: InputHandlers): FoldInputControl {
  container.addEventListener(
    'keydown',
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const arrow = ARROWS[event.key];
      // Holding an arrow moves the line on; holding a fold or undo key does not repeat the move.
      if (arrow && !event.shiftKey) {
        event.preventDefault();
        handlers.onInput({ type: 'move-cursor', arrow });
      } else if (event.repeat) {
        return;
      } else if (arrow) {
        event.preventDefault();
        handlers.onInput({ type: 'fold-cursor', arrow });
      } else if (UNDO_KEYS.has(event.key)) {
        event.preventDefault();
        handlers.onInput({ type: 'undo' });
      }
    },
    { signal },
  );

  let gesture: { pointerId: number; x: number; y: number; geometry: SheetGeometry; fold: Fold | undefined } | undefined;

  function endGesture(): void {
    if (gesture && container.hasPointerCapture(gesture.pointerId)) {
      container.releasePointerCapture(gesture.pointerId);
    }
    gesture = undefined;
  }

  container.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      handlers.onPointerDown();
      const geometry = handlers.geometry();
      if (!geometry) {
        return;
      }
      // The gesture may start on the sheet or within a cell around it.
      const { rect, cellSize } = geometry;
      const isNear =
        event.clientX >= rect.left - cellSize &&
        event.clientX <= rect.right + cellSize &&
        event.clientY >= rect.top - cellSize &&
        event.clientY <= rect.bottom + cellSize;
      if (isNear) {
        gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, geometry, fold: undefined };
        container.setPointerCapture(event.pointerId);
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerId !== gesture?.pointerId) {
        return;
      }
      const fold = dragFold(event.clientX - gesture.x, event.clientY - gesture.y, gesture.geometry);
      if (!sameFold(fold, gesture.fold)) {
        gesture.fold = fold;
        handlers.onInput({ type: 'drag', fold });
      }
    },
    { signal },
  );

  container.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerId !== gesture?.pointerId) {
        return;
      }
      const fold = dragFold(event.clientX - gesture.x, event.clientY - gesture.y, gesture.geometry);
      endGesture();
      handlers.onInput({ type: 'release', fold });
    },
    { signal },
  );

  container.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerId === gesture?.pointerId) {
        endGesture();
        handlers.onInput({ type: 'cancel' });
      }
    },
    { signal },
  );

  return {
    cancelGesture() {
      if (gesture) {
        endGesture();
        handlers.onInput({ type: 'cancel' });
      }
    },
  };
}
