import { fitCellSize } from '../../shell/dom';
import { visibleFace } from '../logic/sheet';
import type { Cell, Level, Sheet } from '../logic/types';

export interface BoardView {
  element: HTMLElement;
  goal: HTMLElement;
  sheet: HTMLElement;
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

function createCell(cell: Cell, row: number, col: number, rows: number, cols: number): HTMLElement {
  const element = document.createElement('div');
  element.classList.add('fold-cell', `is-${cell}`, ...cornerClasses(row, col, rows, cols));
  return element;
}

function createGrid(className: string, face: Cell[][]): HTMLElement {
  const rows = face.length;
  const cols = face[0]?.length ?? 0;
  const grid = document.createElement('div');
  grid.className = `fold-grid ${className}`;
  grid.style.setProperty('--rows', String(rows));
  grid.style.setProperty('--cols', String(cols));
  grid.append(...face.flatMap((line, row) => line.map((cell, col) => createCell(cell, row, col, rows, cols))));
  return grid;
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
  goal.append(label, createGrid('fold-goal-grid', level.goal));

  const stage = document.createElement('div');
  stage.className = 'fold-stage';
  const sheet = document.createElement('div');
  stage.append(sheet);

  element.append(goal, stage);
  return { element, goal, sheet };
}

export function placeSheet(view: BoardView, level: Level, sheet: Sheet): void {
  const grid = createGrid('fold-sheet', visibleFace(level, sheet));
  grid.childNodes.forEach((node, index) => {
    const layers = sheet.stacks[index] ?? [];
    const cell = node as HTMLElement;
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
}
