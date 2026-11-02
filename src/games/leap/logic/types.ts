export const CELL_SIZE = 240;
export const ROOM_SIZE = 12;
export const RUN_SPEED = 24;
export const GRAVITY = 4;
export const JUMP_SPEED = 66;
export const SPRING_SPEED = 93;
export const MAX_FALL_SPEED = 60;
export const COYOTE_TICKS = 6;
export const BUFFER_TICKS = 6;
export const RUNNER_WIDTH = 180;
export const RUNNER_HEIGHT = 216;
export const SPIKE_INSET = 36;

export type Facing = 'left' | 'right';

export type Tile =
  | 'empty'
  | 'wall'
  | 'spikes-up'
  | 'spikes-down'
  | 'platform'
  | 'spring'
  | 'lever'
  | 'door-closed-at-start'
  | 'door-open-at-start'
  | 'entry'
  | 'exit'
  | 'cog';

export interface Position {
  row: number;
  col: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Mover {
  from: Position;
  to: Position;
  length: number;
  period: number;
}

export interface Room {
  tiles: Tile[][];
  facing: Facing;
  entry: Position;
  movers: Mover[];
}

export interface Level {
  id: string;
  rooms: [Room, Room];
}

export interface MoverSource {
  from: [col: number, row: number];
  to: [col: number, row: number];
  length: number;
  period: number;
}

export interface RoomSource {
  grid: string[];
  facing: Facing;
  movers?: MoverSource[];
}

export interface LevelSource {
  id: string;
  rooms: [RoomSource, RoomSource];
}

export interface Runner {
  x: number;
  y: number;
  vy: number;
  facing: Facing;
  launched: boolean;
  grounded: boolean;
  coyote: number;
  buffer: number;
  onLever: boolean;
}

export interface LeapState {
  room: 0 | 1;
  roomTick: number;
  runner: Runner;
  doorsSwapped: boolean;
  pendingSwap: boolean;
  roomCog: boolean;
  cogs: number;
  falls: number;
  runTicks: number;
  outcome: 'playing' | 'complete';
}

export interface LevelRecord {
  bestTicks: number;
  allCogs: boolean;
}

export interface LeapSave {
  levels: Record<string, LevelRecord>;
}
