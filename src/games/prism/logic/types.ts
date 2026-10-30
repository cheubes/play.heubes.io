export type ColorName = 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan' | 'white';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  row: number;
  col: number;
}

export type MirrorOrientation = 'slash' | 'backslash';

export type PrismSpin = 'left' | 'right';

export type BoardElement =
  | { id: string; type: 'wall'; position: Position }
  | { id: string; type: 'source'; position: Position; color: number; direction: Direction }
  | { id: string; type: 'target'; position: Position; color: number }
  | { id: string; type: 'mirror'; position: Position; orientation: MirrorOrientation; fixed: boolean }
  | { id: string; type: 'prism'; position: Position; spin: PrismSpin; fixed: boolean }
  | { id: string; type: 'filter'; position: Position; color: number };

export interface Level {
  id: string;
  rows: number;
  cols: number;
  elements: BoardElement[];
  par: number;
}

type Cell = [row: number, col: number];

export type ElementSource =
  | { type: 'wall'; at: Cell }
  | { type: 'source'; at: Cell; color: ColorName; direction: Direction }
  | { type: 'target'; at: Cell; color: ColorName }
  | { type: 'mirror'; at: Cell; orientation: MirrorOrientation; fixed?: boolean }
  | { type: 'prism'; at: Cell; spin: PrismSpin; fixed?: boolean }
  | { type: 'filter'; at: Cell; color: ColorName };

export interface LevelSource {
  id: string;
  par: number;
  rows: number;
  cols: number;
  elements: ElementSource[];
}

export interface PrismState {
  toggled: ReadonlySet<string>;
  moves: number;
  history: ReadonlySet<string>[];
}

export interface BeamStep {
  from: Position;
  direction: Direction;
  color: number;
  end: 'cell' | 'blocked';
}

export interface BeamResult {
  steps: BeamStep[];
  received: Record<string, number>;
  lit: Record<string, boolean>;
}

export interface PrismSave {
  best: Record<string, number>;
}
