import type { Cell, Level, LevelSource, SheetCell } from './types';

const SHEET_CELLS: Record<string, SheetCell> = {
  '.': 'paper',
  v: 'vermilion',
  i: 'indigo',
  o: 'ochre',
  g: 'green',
  _: 'cut',
};

const GOAL_CELLS: Record<string, Cell> = {
  '.': 'paper',
  v: 'vermilion',
  i: 'indigo',
  o: 'ochre',
  g: 'green',
  _: 'empty',
};

function parseGrid<T>(levelId: string, name: string, lines: string[], cells: Record<string, T>): T[][] {
  return lines.map((line, row) =>
    [...line].map((char, col) => {
      const cell = cells[char];
      if (cell === undefined) {
        throw new Error(`Level ${levelId}, ${name}: unknown character "${char}" at ${row},${col}`);
      }
      return cell;
    }),
  );
}

export function parseLevel(source: LevelSource): Level {
  const sheet = parseGrid(source.id, 'sheet', source.sheet, SHEET_CELLS);
  const cols = sheet[0]?.length ?? 0;
  return {
    id: source.id,
    par: source.par,
    sheet,
    pins: new Set((source.pins ?? []).map(([row, col]) => row * cols + col)),
    goal: parseGrid(source.id, 'goal', source.goal, GOAL_CELLS),
  };
}
