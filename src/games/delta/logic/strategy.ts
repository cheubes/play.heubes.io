import { nextRandom } from './random';
import type { DeltaState, Level, Link, Side, StrategyParams } from './types';

export const REFERENCE_STRATEGY: StrategyParams = { reaction: 5, margin: 0 };

interface Choice<T> {
  choice: T | undefined;
  rng: number;
}

function pickLowest<T>(candidates: readonly T[], score: (candidate: T) => number, rng: number): Choice<T> {
  const lowest = Math.min(...candidates.map(score));
  const tied = candidates.filter((candidate) => score(candidate) === lowest);
  if (tied.length <= 1) {
    return { choice: tied[0], rng };
  }
  const draw = nextRandom(rng);
  return { choice: tied[Math.floor(draw.value * tied.length)], rng: draw.rng };
}

function distancesToOthers(level: Level, state: DeltaState, side: Side): number[] {
  const distances = state.basins.map((basin) => (basin.owner === side ? Infinity : 0));
  let frontier = distances.flatMap((distance, index) => (distance === 0 ? [index] : []));
  for (let distance = 1; frontier.length > 0; distance++) {
    const next: number[] = [];
    for (const index of frontier) {
      for (const link of level.basins[index]!.links) {
        if (distances[link.basin] === Infinity) {
          distances[link.basin] = distance;
          next.push(link.basin);
        }
      }
    }
    frontier = next;
  }
  return distances;
}

export function decide(level: Level, state: DeltaState, side: Side, params: StrategyParams): DeltaState {
  const units = (index: number): number => state.basins[index]!.units;
  const isOwn = (index: number): boolean => state.basins[index]!.owner === side;
  const target = (index: number, channel: number): number => {
    const { a, b } = level.channels[channel]!;
    return a === index ? b : a;
  };

  const incoming = state.basins.map(() => 0);
  for (const unit of state.transit) {
    if (unit.side !== side) {
      const channel = level.channels[unit.channel]!;
      incoming[unit.towards === 'b' ? channel.b : channel.a]! += 1;
    }
  }
  const threatened = state.basins.map(
    (basin, index) => basin.owner === side && incoming[index]! > 0 && incoming[index]! >= basin.units,
  );

  const outputs = state.basins.map((basin, index) => (threatened[index] ? null : basin.output));
  let { rng } = state;

  const reinforcing = new Set<number>();
  for (const [index, isThreatened] of threatened.entries()) {
    if (!isThreatened) {
      continue;
    }
    const candidates = level.basins[index]!.links.filter(
      (link) => isOwn(link.basin) && !threatened[link.basin] && !reinforcing.has(link.basin),
    );
    const reinforcement = pickLowest(candidates, (link) => -units(link.basin), rng);
    rng = reinforcement.rng;
    if (reinforcement.choice !== undefined) {
      reinforcing.add(reinforcement.choice.basin);
      outputs[reinforcement.choice.basin] = reinforcement.choice.channel;
    }
  }

  const distances = distancesToOthers(level, state, side);
  for (const [index, basin] of state.basins.entries()) {
    if (basin.owner !== side || threatened[index] || reinforcing.has(index)) {
      continue;
    }

    if (basin.output !== null) {
      const pursued = target(index, basin.output);
      const towards = level.channels[basin.output]!.a === index ? 'b' : 'a';
      const inTransit = state.transit.filter(
        (unit) => unit.side === side && unit.channel === basin.output && unit.towards === towards,
      ).length;
      if (!isOwn(pursued) && basin.units + inTransit > units(pursued)) {
        continue;
      }
    }

    const links = level.basins[index]!.links;
    const attackable = links.filter((link) => !isOwn(link.basin) && units(link.basin) + params.margin < basin.units);
    let route: Choice<Link>;
    if (attackable.length > 0) {
      route = pickLowest(attackable, (link) => units(link.basin), rng);
    } else if (links.every((link) => isOwn(link.basin))) {
      const reachable = links.filter((link) => distances[link.basin] !== Infinity);
      route = pickLowest(reachable, (link) => distances[link.basin]!, rng);
    } else {
      route = { choice: undefined, rng };
    }
    rng = route.rng;
    outputs[index] = route.choice?.channel ?? null;
  }

  return {
    ...state,
    basins: state.basins.map((basin, index) => {
      const output = outputs[index] ?? null;
      return output === basin.output ? basin : { ...basin, output };
    }),
    rng,
  };
}
