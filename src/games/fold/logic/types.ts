export type Ink = 'vermilion' | 'indigo' | 'ochre' | 'green';

export type SheetCell = 'paper' | Ink | 'cut';

export type Cell = 'paper' | Ink | 'empty';

export interface Fold {
  axis: 'vertical' | 'horizontal';
  // The line k separates the columns (or rows) k - 1 and k.
  line: number;
  moving: 'before' | 'after';
}

export type FoldCheck = 'ok' | 'pinned' | 'invalid';

export interface Level {
  id: string;
  par: number;
  sheet: SheetCell[][];
  // Layer indexes (row * cols + col in the starting sheet).
  pins: ReadonlySet<number>;
  goal: Cell[][];
}

export interface LevelSource {
  id: string;
  par: number;
  sheet: string[];
  goal: string[];
  pins?: [number, number][];
}

export interface Sheet {
  rows: number;
  cols: number;
  // Index row * cols + col -> layers, from bottom to top.
  stacks: readonly (readonly number[])[];
}

export interface FoldState {
  sheet: Sheet;
  moves: number;
  history: Sheet[];
}

export interface FoldSave {
  best: Record<string, number>;
}
