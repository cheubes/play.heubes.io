import type { BoardElement, ColorName, ElementSource, Level, LevelSource } from './types';

const COLOR_MASKS: Record<ColorName, number> = {
  red: 1,
  green: 2,
  blue: 4,
  yellow: 3,
  magenta: 5,
  cyan: 6,
  white: 7,
};

function colorMask(levelId: string, color: ColorName): number {
  const mask = COLOR_MASKS[color];
  if (mask === undefined) {
    throw new Error(`Level ${levelId}: unknown color "${color}"`);
  }
  return mask;
}

function parseElement(levelId: string, source: ElementSource): BoardElement {
  const [row, col] = source.at;
  const id = `e-${row}-${col}`;
  const position = { row, col };
  switch (source.type) {
    case 'wall':
      return { id, type: 'wall', position };
    case 'source':
      return { id, type: 'source', position, color: colorMask(levelId, source.color), direction: source.direction };
    case 'target':
      return { id, type: 'target', position, color: colorMask(levelId, source.color) };
    case 'mirror':
      return { id, type: 'mirror', position, orientation: source.orientation, fixed: source.fixed ?? false };
    case 'prism':
      return { id, type: 'prism', position, spin: source.spin, fixed: source.fixed ?? false };
    case 'filter':
      return { id, type: 'filter', position, color: colorMask(levelId, source.color) };
  }
}

export function parseLevel(source: LevelSource): Level {
  return {
    id: source.id,
    rows: source.rows,
    cols: source.cols,
    elements: source.elements.map((element) => parseElement(source.id, element)),
    par: source.par,
  };
}
