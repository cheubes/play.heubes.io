import { decide } from './strategy';
import { BASIN_SIZES, EMISSION_INTERVAL } from './types';
import type { BasinState, Channel, DeltaState, Level, Side, Unit } from './types';

function playerBasins(basins: readonly BasinState[]): number {
  return basins.filter((basin) => basin.owner === 'player').length;
}

export function createState(level: Level): DeltaState {
  const basins = level.basins.map(({ owner, units }) => ({ owner, units, output: null }));
  return {
    tick: 0,
    basins,
    transit: [],
    rng: level.seed,
    basinsLost: 0,
    mostHeld: playerBasins(basins),
    outcome: 'playing',
  };
}

export function isChannelOpen(channel: Channel, tick: number): boolean {
  if (channel.tide === null) {
    return true;
  }
  const { open, closed, phase } = channel.tide;
  return (tick + phase) % (open + closed) < open;
}

function withOutput(state: DeltaState, index: number, output: number | null): DeltaState {
  return {
    ...state,
    basins: state.basins.map((basin, current) => (current === index ? { ...basin, output } : basin)),
  };
}

export function setRoute(level: Level, state: DeltaState, from: string, to: string): DeltaState {
  const source = level.basins.findIndex((basin) => basin.id === from);
  const target = level.basins.findIndex((basin) => basin.id === to);
  if (state.basins[source]?.owner !== 'player') {
    return state;
  }
  const link = level.basins[source]?.links.find((candidate) => candidate.basin === target);
  if (link === undefined) {
    return state;
  }
  return withOutput(state, source, link.channel);
}

export function hold(level: Level, state: DeltaState, basin: string): DeltaState {
  const index = level.basins.findIndex((candidate) => candidate.id === basin);
  if (state.basins[index]?.owner !== 'player') {
    return state;
  }
  return withOutput(state, index, null);
}

function removeCrossings(level: Level, transit: Unit[]): Unit[] {
  const removed = new Set<Unit>();
  const leading = (channel: number, towards: Unit['towards'], side: Side): Unit | undefined =>
    transit.find(
      (unit) => unit.channel === channel && unit.towards === towards && unit.side === side && !removed.has(unit),
    );
  for (const [index, channel] of level.channels.entries()) {
    for (const [sideTowardsB, sideTowardsA] of [
      ['player', 'rival'],
      ['rival', 'player'],
    ] as const) {
      for (;;) {
        const towardsB = leading(index, 'b', sideTowardsB);
        const towardsA = leading(index, 'a', sideTowardsA);
        if (
          towardsB === undefined ||
          towardsA === undefined ||
          towardsB.progress + towardsA.progress < channel.duration
        ) {
          break;
        }
        removed.add(towardsB);
        removed.add(towardsA);
      }
    }
  }
  return transit.filter((unit) => !removed.has(unit));
}

export function step(level: Level, state: DeltaState): DeltaState {
  if (state.outcome !== 'playing') {
    return state;
  }
  const tick = state.tick + 1;
  const decided = tick % level.rival.reaction === 0 ? decide(level, state, 'rival', level.rival) : state;

  const basins = decided.basins.map((basin, index) => {
    const { productionInterval, capacity } = BASIN_SIZES[level.basins[index]!.size];
    if (basin.owner !== 'neutral' && tick % productionInterval === 0 && basin.units < capacity) {
      return { ...basin, units: basin.units + 1 };
    }
    return { ...basin };
  });

  const emitted: Unit[] = [];
  if (tick % EMISSION_INTERVAL === 0) {
    for (const [index, basin] of basins.entries()) {
      if (basin.output === null || basin.owner === 'neutral' || basin.units === 0) {
        continue;
      }
      const channel = level.channels[basin.output]!;
      if (!isChannelOpen(channel, tick)) {
        continue;
      }
      basin.units -= 1;
      emitted.push({ side: basin.owner, channel: basin.output, towards: channel.a === index ? 'b' : 'a', progress: 0 });
    }
  }

  const moved = [...state.transit, ...emitted].map((unit) => ({ ...unit, progress: unit.progress + 1 }));
  const crossed = removeCrossings(level, moved);

  let { basinsLost } = state;
  const transit: Unit[] = [];
  for (const unit of crossed) {
    const channel = level.channels[unit.channel]!;
    if (unit.progress < channel.duration) {
      transit.push(unit);
      continue;
    }
    const target = basins[unit.towards === 'b' ? channel.b : channel.a]!;
    if (target.owner === unit.side) {
      target.units += 1;
    } else if (target.units > 0) {
      target.units -= 1;
    } else {
      if (target.owner === 'player') {
        basinsLost += 1;
      }
      target.owner = unit.side;
      target.units = 1;
      target.output = null;
    }
  }

  const held = playerBasins(basins);
  const alive = (side: Side): boolean =>
    basins.some((basin) => basin.owner === side) || transit.some((unit) => unit.side === side);
  const outcome = !alive('player') ? 'lost' : !alive('rival') ? 'won' : 'playing';

  return { ...decided, tick, basins, transit, basinsLost, mostHeld: Math.max(state.mostHeld, held), outcome };
}
