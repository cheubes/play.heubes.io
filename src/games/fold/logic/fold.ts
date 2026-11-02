import { applyFold, createSheet, isMoving, visibleFace } from './sheet';
import type { Fold, FoldCheck, FoldState, Level, Sheet } from './types';

export function createState(level: Level): FoldState {
  return { sheet: createSheet(level), moves: 0, history: [] };
}

export function canFold(level: Level, sheet: Sheet, fold: Fold): FoldCheck {
  const size = fold.axis === 'vertical' ? sheet.cols : sheet.rows;
  if (!Number.isInteger(fold.line) || fold.line < 1 || fold.line > size - 1) {
    return 'invalid';
  }
  for (let row = 0; row < sheet.rows; row++) {
    for (let col = 0; col < sheet.cols; col++) {
      const layers = sheet.stacks[row * sheet.cols + col] ?? [];
      if (isMoving(fold, row, col) && layers.some((layer) => level.pins.has(layer))) {
        return 'pinned';
      }
    }
  }
  return 'ok';
}

export function fold(level: Level, state: FoldState, fold: Fold): FoldState {
  if (canFold(level, state.sheet, fold) !== 'ok') {
    return state;
  }
  return { sheet: applyFold(state.sheet, fold), moves: state.moves + 1, history: [...state.history, state.sheet] };
}

export function undo(state: FoldState): FoldState {
  const previous = state.history.at(-1);
  if (previous === undefined) {
    return state;
  }
  return { sheet: previous, moves: state.moves - 1, history: state.history.slice(0, -1) };
}

export function restart(level: Level): FoldState {
  return createState(level);
}

export function isSolved(level: Level, state: FoldState): boolean {
  const face = visibleFace(level, state.sheet);
  return (
    face.length === level.goal.length &&
    face.every(
      (line, row) => line.length === level.goal[row]?.length && line.every((cell, col) => cell === level.goal[row]?.[col]),
    )
  );
}
