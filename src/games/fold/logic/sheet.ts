import type { Cell, Fold, Level, Sheet } from './types';

interface PlacedStack {
  row: number;
  col: number;
  layers: number[];
}

type Placement = Map<string, PlacedStack>;

function place(placement: Placement, row: number, col: number, layers: readonly number[]): void {
  if (layers.length === 0) {
    return;
  }
  const key = `${row},${col}`;
  const existing = placement.get(key);
  if (existing === undefined) {
    placement.set(key, { row, col, layers: [...layers] });
  } else {
    existing.layers.push(...layers);
  }
}

function normalize(placement: Placement): Sheet {
  const placed = [...placement.values()];
  if (placed.length === 0) {
    return { rows: 0, cols: 0, stacks: [] };
  }
  const top = Math.min(...placed.map((stack) => stack.row));
  const left = Math.min(...placed.map((stack) => stack.col));
  const rows = Math.max(...placed.map((stack) => stack.row)) - top + 1;
  const cols = Math.max(...placed.map((stack) => stack.col)) - left + 1;
  const stacks: (readonly number[])[] = Array.from({ length: rows * cols }, () => []);
  for (const stack of placed) {
    stacks[(stack.row - top) * cols + stack.col - left] = stack.layers;
  }
  return { rows, cols, stacks };
}

export function createSheet(level: Level): Sheet {
  const placement: Placement = new Map();
  const cols = level.sheet[0]?.length ?? 0;
  for (const [row, line] of level.sheet.entries()) {
    for (const [col, cell] of line.entries()) {
      if (cell !== 'cut') {
        place(placement, row, col, [row * cols + col]);
      }
    }
  }
  return normalize(placement);
}

export function isMoving(fold: Fold, row: number, col: number): boolean {
  const position = fold.axis === 'vertical' ? col : row;
  return fold.moving === 'before' ? position < fold.line : position >= fold.line;
}

export function applyFold(sheet: Sheet, fold: Fold): Sheet {
  const placement: Placement = new Map();
  const moving: PlacedStack[] = [];
  for (let row = 0; row < sheet.rows; row++) {
    for (let col = 0; col < sheet.cols; col++) {
      const layers = sheet.stacks[row * sheet.cols + col] ?? [];
      if (isMoving(fold, row, col)) {
        moving.push({ row, col, layers: [...layers].reverse() });
      } else {
        place(placement, row, col, layers);
      }
    }
  }
  for (const stack of moving) {
    if (fold.axis === 'vertical') {
      place(placement, stack.row, 2 * fold.line - 1 - stack.col, stack.layers);
    } else {
      place(placement, 2 * fold.line - 1 - stack.row, stack.col, stack.layers);
    }
  }
  return normalize(placement);
}

function layerContent(level: Level, layer: number): Cell {
  const cols = level.sheet[0]?.length ?? 0;
  const content = level.sheet[Math.floor(layer / cols)]?.[layer % cols];
  if (content === undefined || content === 'cut') {
    throw new Error(`Level ${level.id}: layer ${layer} is not paper`);
  }
  return content;
}

export function visibleFace(level: Level, sheet: Sheet): Cell[][] {
  return Array.from({ length: sheet.rows }, (_, row) =>
    Array.from({ length: sheet.cols }, (_, col) => {
      const top = sheet.stacks[row * sheet.cols + col]?.at(-1);
      return top === undefined ? 'empty' : layerContent(level, top);
    }),
  );
}
