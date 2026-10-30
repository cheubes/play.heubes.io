import type { Block, Cell, Color, Level } from '../logic/types';

export interface BoardView {
  element: HTMLElement;
  blocks: Map<string, HTMLElement>;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_CELL_SIZE = 72;

const SYMBOLS: Record<Color, string> = {
  amber: '<circle cx="12" cy="12" r="10" />',
  azure: '<polygon points="12,2 22.5,20.5 1.5,20.5" />',
  rose: '<rect x="3" y="3" width="18" height="18" />',
  mint: '<polygon points="12,1 23,12 12,23 1,12" />',
};

function createSymbol(color: Color): SVGSVGElement {
  const symbol = document.createElementNS(SVG_NS, 'svg');
  symbol.setAttribute('viewBox', '0 0 24 24');
  symbol.setAttribute('class', 'tilt-symbol');
  symbol.innerHTML = SYMBOLS[color];
  return symbol;
}

function createCell(cell: Cell): HTMLElement {
  const element = document.createElement('div');
  element.className = `tilt-cell is-${cell.type}`;
  if (cell.type === 'target') {
    element.classList.add(`is-${cell.color}`);
    element.append(createSymbol(cell.color));
  }
  return element;
}

function createBlock(block: Block): HTMLElement {
  const element = document.createElement('div');
  if (block.kind === 'colored') {
    element.className = `tilt-block is-${block.color}`;
    element.append(createSymbol(block.color));
  } else {
    element.className = 'tilt-block is-neutral';
  }
  return element;
}

export function createBoardView(level: Level): BoardView {
  const element = document.createElement('div');
  element.className = 'tilt-board';
  element.setAttribute('aria-hidden', 'true');
  element.style.setProperty('--rows', String(level.rows));
  element.style.setProperty('--cols', String(level.cols));

  const terrain = document.createElement('div');
  terrain.className = 'tilt-terrain';
  terrain.append(...level.cells.flat().map(createCell));
  element.append(terrain);

  const blocks = new Map<string, HTMLElement>();
  for (const block of level.blocks) {
    const blockElement = createBlock(block);
    blocks.set(block.id, blockElement);
    element.append(blockElement);
  }
  return { element, blocks };
}

export function placeBlocks(view: BoardView, level: Level, blocks: readonly Block[]): void {
  for (const block of blocks) {
    const element = view.blocks.get(block.id);
    if (!element) {
      continue;
    }
    const { row, col } = block.position;
    const cell = level.cells[row]?.[col];
    const isOnTarget = block.kind === 'colored' && cell?.type === 'target' && cell.color === block.color;
    element.style.transform = `translate(calc(${col} * var(--cell)), calc(${row} * var(--cell)))`;
    element.classList.toggle('is-on-target', isOnTarget);
  }
}

export function fitBoard(container: HTMLElement, view: BoardView, level: Level): void {
  const margin = parseFloat(getComputedStyle(container).getPropertyValue('--space-4'));
  const cellSize = Math.min(
    MAX_CELL_SIZE,
    Math.floor((container.clientWidth - 2 * margin) / level.cols),
    Math.floor((container.clientHeight - 2 * margin) / level.rows),
  );
  view.element.style.setProperty('--cell', `${Math.max(cellSize, 0)}px`);
}
