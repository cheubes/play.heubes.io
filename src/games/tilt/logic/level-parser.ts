import type { Block, Cell, Color, Level, LevelSource } from './types';

const TERRAIN: Record<string, Cell> = {
  '#': { type: 'wall' },
  '.': { type: 'floor' },
  '+': { type: 'sticky' },
  a: { type: 'target', color: 'amber' },
  b: { type: 'target', color: 'azure' },
  c: { type: 'target', color: 'rose' },
  d: { type: 'target', color: 'mint' },
};

const PIECE_COLORS: Record<string, Color> = {
  A: 'amber',
  B: 'azure',
  C: 'rose',
  D: 'mint',
};

export function parseLevel(source: LevelSource): Level {
  const cells = source.terrain.map((line, row) =>
    [...line].map((char, col) => {
      const cell = TERRAIN[char];
      if (cell === undefined) {
        throw new Error(`Level ${source.id}: unknown terrain character "${char}" at ${row},${col}`);
      }
      return { ...cell };
    }),
  );

  const blocks: Block[] = [];
  source.pieces.forEach((line, row) => {
    [...line].forEach((char, col) => {
      if (char === '.') {
        return;
      }
      const id = `b-${row}-${col}`;
      const position = { row, col };
      const color = PIECE_COLORS[char];
      if (color !== undefined) {
        blocks.push({ id, kind: 'colored', color, position });
      } else if (char === 'X') {
        blocks.push({ id, kind: 'neutral', position });
      } else {
        throw new Error(`Level ${source.id}: unknown piece character "${char}" at ${row},${col}`);
      }
    });
  });

  return {
    id: source.id,
    rows: cells.length,
    cols: cells[0]?.length ?? 0,
    cells,
    blocks,
    par: source.par,
  };
}
