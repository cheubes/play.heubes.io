export const TICK_MS = 100;
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 10;
export const UNIT_SPEED = 0.2;
export const EMISSION_INTERVAL = 5;

export type BasinSize = 'small' | 'medium' | 'large';

export interface BasinSizeSpec {
  productionInterval: number;
  capacity: number;
  radius: number;
}

export const BASIN_SIZES: Record<BasinSize, BasinSizeSpec> = {
  small: { productionInterval: 20, capacity: 20, radius: 0.45 },
  medium: { productionInterval: 14, capacity: 35, radius: 0.6 },
  large: { productionInterval: 10, capacity: 50, radius: 0.75 },
};

export type Side = 'player' | 'rival';

export type Owner = Side | 'neutral';

export interface Point {
  x: number;
  y: number;
}

export interface Tide {
  open: number;
  closed: number;
  phase: number;
}

export interface StrategyParams {
  reaction: number;
  margin: number;
}

export interface Link {
  channel: number;
  basin: number;
}

export interface Basin {
  id: string;
  at: Point;
  size: BasinSize;
  owner: Owner;
  units: number;
  links: readonly Link[];
}

export interface Channel {
  a: number;
  b: number;
  length: number;
  duration: number;
  tide: Tide | null;
}

export interface Level {
  id: string;
  seed: number;
  rival: StrategyParams;
  basins: readonly Basin[];
  channels: readonly Channel[];
}

export interface LevelSource {
  id: string;
  seed: number;
  rival: StrategyParams;
  basins: {
    id: string;
    at: [x: number, y: number];
    size: BasinSize;
    owner: Owner;
    units: number;
  }[];
  channels: {
    between: [string, string];
    tide?: Tide;
  }[];
}

export interface BasinState {
  owner: Owner;
  units: number;
  output: number | null;
}

export interface Unit {
  side: Side;
  channel: number;
  towards: 'a' | 'b';
  progress: number;
}

export interface DeltaState {
  tick: number;
  basins: readonly BasinState[];
  transit: readonly Unit[];
  rng: number;
  basinsLost: number;
  mostHeld: number;
  outcome: 'playing' | 'won' | 'lost';
}

export interface LevelRecord {
  bestTicks: number;
  flawless: boolean;
}

export interface DeltaSave {
  levels: Record<string, LevelRecord>;
}
