import { fitCellSize } from '../../shell/dom';
import { isMoving, visibleFace } from '../logic/sheet';
import type { Cell, Fold, Level, Sheet } from '../logic/types';

export interface BoardView {
  element: HTMLElement;
  goal: HTMLElement;
  sheet: HTMLElement;
  // The positions of the sheet, row * cols + col.
  cells: HTMLElement[];
  cellSize: number;
}

const MAX_CELL_SIZE = 72;
const GOAL_SCALE = 0.4;
const GAP = 0.5;
const MAX_THICKNESS = 3;

function cornerClasses(row: number, col: number, rows: number, cols: number): string[] {
  const vertical = row === 0 ? 'top' : row === rows - 1 ? 'bottom' : undefined;
  const horizontal = col === 0 ? 'left' : col === cols - 1 ? 'right' : undefined;
  return vertical && horizontal ? [`is-${vertical}-${horizontal}`] : [];
}

export function createCell(cell: Cell): HTMLElement {
  const element = document.createElement('div');
  element.classList.add('fold-cell', `is-${cell}`);
  return element;
}

// Places an element of the sheet's overlays at a position, which may lie outside the sheet.
export function placeAt(element: HTMLElement, row: number, col: number): void {
  element.style.top = `calc(${row} * var(--size))`;
  element.style.left = `calc(${col} * var(--size))`;
}

function createGrid(className: string, face: Cell[][]): { grid: HTMLElement; cells: HTMLElement[] } {
  const rows = face.length;
  const cols = face[0]?.length ?? 0;
  const grid = document.createElement('div');
  grid.className = `fold-grid ${className}`;
  grid.style.setProperty('--rows', String(rows));
  grid.style.setProperty('--cols', String(cols));
  const cells = face.flatMap((line, row) =>
    line.map((cell, col) => {
      const element = createCell(cell);
      element.classList.add(...cornerClasses(row, col, rows, cols));
      return element;
    }),
  );
  grid.append(...cells);
  return { grid, cells };
}

export function createBoardView(level: Level, goalLabel: string): BoardView {
  const element = document.createElement('div');
  element.className = 'fold-board';
  element.setAttribute('aria-hidden', 'true');
  element.style.setProperty('--sheet-rows', String(level.sheet.length));
  element.style.setProperty('--sheet-cols', String(level.sheet[0]?.length ?? 0));

  const goal = document.createElement('div');
  goal.className = 'fold-goal';
  const label = document.createElement('p');
  label.className = 'fold-goal-label';
  label.textContent = goalLabel;
  goal.append(label, createGrid('fold-goal-grid', level.goal).grid);

  const stage = document.createElement('div');
  stage.className = 'fold-stage';
  const sheet = document.createElement('div');
  stage.append(sheet);

  element.append(goal, stage);
  return { element, goal, sheet, cells: [], cellSize: 0 };
}

export function placeSheet(view: BoardView, level: Level, sheet: Sheet): void {
  const { grid, cells } = createGrid('fold-sheet', visibleFace(level, sheet));
  cells.forEach((cell, index) => {
    const layers = sheet.stacks[index] ?? [];
    if (layers.length > 1) {
      cell.dataset.thickness = String(Math.min(layers.length - 1, MAX_THICKNESS));
    }
    if (layers.some((layer) => level.pins.has(layer))) {
      const pin = document.createElement('span');
      pin.className = 'fold-pin';
      cell.append(pin);
    }
  });
  view.sheet.replaceWith(grid);
  view.sheet = grid;
  view.cells = cells;
}

// The size is set for the starting sheet and kept during the level: the sheet only shrinks.
export function fitBoard(container: HTMLElement, view: BoardView, level: Level): void {
  const rows = level.sheet.length;
  const cols = level.sheet[0]?.length ?? 0;
  const goalRows = level.goal.length;
  const goalCols = level.goal[0]?.length ?? 0;
  const isPortrait = container.clientHeight > container.clientWidth;
  const cellSize = isPortrait
    ? fitCellSize(container, cols, rows + GOAL_SCALE * goalRows + GAP, MAX_CELL_SIZE)
    : fitCellSize(container, cols + GOAL_SCALE * goalCols + GAP, rows, MAX_CELL_SIZE);
  view.element.classList.toggle('is-portrait', isPortrait);
  view.element.style.setProperty('--cell', `${cellSize}px`);
  view.cellSize = cellSize;
}

export function bottomFace(level: Level, sheet: Sheet): Cell[][] {
  return visibleFace(level, { ...sheet, stacks: sheet.stacks.map((layers) => [...layers].reverse()) });
}

export function showFoldLine(view: BoardView, sheet: Sheet, axis: Fold['axis'], line: number): void {
  const element = document.createElement('div');
  element.className = `fold-line is-${axis}`;
  if (axis === 'vertical') {
    placeAt(element, 0, line);
    element.style.height = `calc(${sheet.rows} * var(--size))`;
  } else {
    placeAt(element, line, 0);
    element.style.width = `calc(${sheet.cols} * var(--size))`;
  }
  view.sheet.append(element);
}

// The moving part, flipped, where it will land: each stack shows its bottom layer, its top once landed.
export function showGhost(view: BoardView, level: Level, sheet: Sheet, fold: Fold): void {
  const ghost = document.createElement('div');
  ghost.className = 'fold-ghost';
  const bottoms = bottomFace(level, sheet);
  for (let row = 0; row < sheet.rows; row++) {
    for (let col = 0; col < sheet.cols; col++) {
      const bottom = bottoms[row]?.[col];
      if (!isMoving(fold, row, col) || bottom === undefined || bottom === 'empty') {
        continue;
      }
      const cell = createCell(bottom);
      if (fold.axis === 'vertical') {
        placeAt(cell, row, 2 * fold.line - 1 - col);
      } else {
        placeAt(cell, 2 * fold.line - 1 - row, col);
      }
      ghost.append(cell);
    }
  }
  view.sheet.append(ghost);
}

export function blockingPins(view: BoardView, sheet: Sheet, fold: Fold): HTMLElement[] {
  return view.cells.flatMap((cell, index) => {
    const pin = cell.querySelector<HTMLElement>('.fold-pin');
    return pin && isMoving(fold, Math.floor(index / sheet.cols), index % sheet.cols) ? [pin] : [];
  });
}

export function markBlockingPins(pins: HTMLElement[]): void {
  for (const pin of pins) {
    pin.classList.add('is-blocking');
  }
}

export function clearPreview(view: BoardView): void {
  for (const overlay of view.sheet.querySelectorAll('.fold-line, .fold-ghost')) {
    overlay.remove();
  }
  for (const pin of view.sheet.querySelectorAll('.fold-pin.is-blocking')) {
    pin.classList.remove('is-blocking');
  }
}
