import { describe, expect, it } from 'vitest';
import { nextSelection, type SelectionPoint } from './selection';

const identity = (point: SelectionPoint) => point;

describe('nextSelection', () => {
  const center = { x: 0, y: 0 };
  const above = { x: 0, y: -1 };
  const below = { x: 0, y: 1 };
  const left = { x: -1, y: 0 };
  const right = { x: 1, y: 0 };
  const candidates = [center, above, below, left, right];

  it('follows each arrow on screen, with y growing downwards', () => {
    expect(nextSelection(candidates, center, 'up', identity)).toBe(above);
    expect(nextSelection(candidates, center, 'down', identity)).toBe(below);
    expect(nextSelection(candidates, center, 'left', identity)).toBe(left);
    expect(nextSelection(candidates, center, 'right', identity)).toBe(right);
  });

  it('only considers candidates strictly in the direction', () => {
    const sideways = { x: 3, y: 0 };
    expect(nextSelection([center, { x: 0, y: 5 }, { x: 0, y: 0 }], center, 'right', identity)).toBe(center);
    expect(nextSelection([center, sideways], center, 'up', identity)).toBe(center);
  });

  it('weighs the perpendicular offset twice the distance along the axis', () => {
    // Scores: 1 + 2 × 2 = 5 against 4 + 0 = 4.
    const near = { x: 1, y: 2 };
    const inLine = { x: 4, y: 0 };
    expect(nextSelection([center, near, inLine], center, 'right', identity)).toBe(inLine);
    // Scores: 1 + 2 × 1 = 3 against 4 + 0 = 4.
    const closer = { x: 1, y: 1 };
    expect(nextSelection([center, closer, inLine], center, 'right', identity)).toBe(closer);
  });

  it('keeps the current selection when there is no candidate in the direction', () => {
    expect(nextSelection([center, left], center, 'right', identity)).toBe(center);
    expect(nextSelection([], center, 'down', identity)).toBe(center);
  });

  it('reads the positions through the function given by the game', () => {
    const cells = [
      { col: 2, row: 2 },
      { col: 2, row: 0 },
      { col: 4, row: 2 },
    ];
    const toPoint = (cell: { col: number; row: number }) => ({ x: cell.col, y: cell.row });
    expect(nextSelection(cells, cells[0]!, 'up', toPoint)).toBe(cells[1]);
    expect(nextSelection(cells, cells[0]!, 'right', toPoint)).toBe(cells[2]);
  });
});
