export type Color = 'amber' | 'azure' | 'rose' | 'mint';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  row: number;
  col: number;
}

export type Cell = { type: 'floor' | 'wall' | 'sticky' } | { type: 'target'; color: Color };

export type Block =
  | { id: string; kind: 'colored'; color: Color; position: Position }
  | { id: string; kind: 'neutral'; position: Position };

export interface Level {
  id: string;
  rows: number;
  cols: number;
  cells: Cell[][];
  blocks: Block[];
  par: number;
}

export interface LevelSource {
  id: string;
  par: number;
  terrain: string[];
  pieces: string[];
}

export interface TiltState {
  blocks: Block[];
  moves: number;
  history: Block[][];
}

export interface Motion {
  blockId: string;
  from: Position;
  to: Position;
  stoppedBy: 'wall' | 'block' | 'sticky';
}

export interface TiltSave {
  best: Record<string, number>;
}
