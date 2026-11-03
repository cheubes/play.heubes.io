import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { createState, step } from './simulation';
import { decide, REFERENCE_STRATEGY } from './strategy';
import type { DeltaState, Level, LevelSource, StrategyParams, Unit } from './types';

// Difficulty criteria of "Points tranchés à l'implémentation" (technical-specifications.md).
const SERIES = [
  { reaction: [40, 50], margin: 6, tolerance: 40, basins: [3, 6] },
  { reaction: [25, 35], margin: 4, tolerance: 20, basins: [5, 9] },
  { reaction: [20, 25], margin: 3, tolerance: 20, basins: [6, 10] },
  { reaction: [10, 15], margin: 2, tolerance: 10, basins: [10, 14] },
] as const;
const INTRODUCTIONS = [0, 5, 10, 15];
const TOLERANCES = [5, 10, 20, 40, 80];
const DISTRACTED_REACTION = 80;
const MAX_TICKS = 3000;
const INTRODUCTION_TICKS = 900;
const MIN_TICKS = 200;
const MAX_REFERENCE_TICKS = 1800;
const SIZE_SLOWDOWN = 1.5;
const TIDE_EFFECT = 0.2;
const MIN_CROSSED_SHARE = 0.2;

interface Game {
  end: DeltaState;
  rivalEmitted: number;
  rivalCrossed: number;
}

function sameUnit(first: Unit, second: Unit): boolean {
  return first.side === second.side && first.channel === second.channel && first.towards === second.towards;
}

// A rival unit missing after a step, short of its arrival, was cancelled by a crossing. Units
// cancelled on the step they are emitted, or on the step they arrive, are not counted.
function play(level: Level, player: StrategyParams | null): Game {
  let state = createState(level);
  let rivalEmitted = 0;
  let rivalCrossed = 0;
  while (state.outcome === 'playing' && state.tick < MAX_TICKS) {
    if (player !== null && state.tick % player.reaction === 0) {
      state = decide(level, state, 'player', player);
    }
    const next = step(level, state);
    for (const unit of state.transit) {
      const moved = { ...unit, progress: unit.progress + 1 };
      const arrives = moved.progress >= level.channels[unit.channel]!.duration;
      if (unit.side === 'rival' && !arrives && !next.transit.some((other) => sameUnit(other, moved) && other.progress === moved.progress)) {
        rivalCrossed += 1;
      }
    }
    rivalEmitted += next.transit.filter((unit) => unit.side === 'rival' && unit.progress === 1).length;
    state = next;
  }
  return { end: state, rivalEmitted, rivalCrossed };
}

function wins(level: Level, player: StrategyParams): boolean {
  return play(level, player).end.outcome === 'won';
}

function tolerance(level: Level): number {
  let tolerated = 0;
  for (const reaction of TOLERANCES) {
    if (!wins(level, { ...REFERENCE_STRATEGY, reaction })) {
      break;
    }
    tolerated = reaction;
  }
  return tolerated;
}

function rivalReachable(level: Level): boolean {
  const reached = new Set(level.basins.flatMap((basin, index) => (basin.owner === 'player' ? [index] : [])));
  const frontier = [...reached];
  for (let index = frontier.pop(); index !== undefined; index = frontier.pop()) {
    for (const link of level.basins[index]!.links) {
      if (!reached.has(link.basin)) {
        reached.add(link.basin);
        frontier.push(link.basin);
      }
    }
  }
  return level.basins.some((basin, index) => basin.owner === 'rival' && reached.has(index));
}

function startingUnits(source: LevelSource, owner: 'player' | 'rival'): number {
  return source.basins.filter((basin) => basin.owner === owner).reduce((total, basin) => total + basin.units, 0);
}

function tidalChannels(source: LevelSource): number {
  return source.channels.filter((channel) => channel.tide !== undefined).length;
}

function sizes(source: LevelSource): number {
  return new Set(source.basins.map((basin) => basin.size)).size;
}

const MEASURES = LEVELS.map((source) => {
  const level = parseLevel(source);
  const reference = play(level, REFERENCE_STRATEGY);
  return {
    source,
    level,
    reference,
    ticks: reference.end.outcome === 'won' ? reference.end.tick : Infinity,
    tolerance: tolerance(level),
    idle: play(level, null).end,
  };
});

function failing(predicate: (measure: (typeof MEASURES)[number], index: number) => boolean): string[] {
  return MEASURES.flatMap((measure, index) => (predicate(measure, index) ? [] : [`${index + 1} ${measure.source.id}`]));
}

const series = (index: number) => SERIES[Math.floor(index / 5)]!;
const inSeries = (index: number, first: number, last: number) => index + 1 >= first && index + 1 <= last;

describe('difficulty', () => {
  it('there are four series of five levels', () => {
    expect(LEVELS).toHaveLength(20);
  });

  it('the rival reacts within the range of its series, never slower than on the previous level', () => {
    expect(
      failing(({ source }, index) => {
        const [fastest, slowest] = series(index).reaction;
        const previous = LEVELS[index - 1]?.rival.reaction ?? Infinity;
        return source.rival.reaction >= fastest && source.rival.reaction <= slowest && source.rival.reaction <= previous;
      }),
    ).toEqual([]);
  });

  it('the rival margin is the one of its series', () => {
    expect(failing(({ source }, index) => source.rival.margin === series(index).margin)).toEqual([]);
  });

  it('the number of basins is within the range of its series, with 14 on the last level', () => {
    expect(
      failing(({ source }, index) => {
        const [fewest, most] = series(index).basins;
        const count = source.basins.length;
        return count >= fewest && count <= most && (index !== 19 || count === 14);
      }),
    ).toEqual([]);
  });

  it('the reference strategy wins the first level of a series in less than 90 seconds, the others in 20 seconds to 3 minutes', () => {
    expect(
      failing(({ ticks }, index) =>
        INTRODUCTIONS.includes(index) ? ticks < INTRODUCTION_TICKS : ticks >= MIN_TICKS && ticks <= MAX_REFERENCE_TICKS,
      ),
    ).toEqual([]);
  });

  it('a slower reference strategy still wins, down to the tolerance of its series, which does not grow within a series', () => {
    expect(
      failing(({ tolerance: tolerated }, index) => {
        const previous = index % 5 === 0 ? Infinity : MEASURES[index - 1]!.tolerance;
        return tolerated >= series(index).tolerance && tolerated <= previous;
      }),
    ).toEqual([]);
  });

  it('from series 2, a distracted reference strategy does not win', () => {
    expect(
      failing(({ level }, index) => index < 5 || !wins(level, { ...REFERENCE_STRATEGY, reaction: DISTRACTED_REACTION })),
    ).toEqual([]);
  });

  it('every level has a neutral basin, and a player who gives no order loses in 5 minutes', () => {
    expect(
      failing(({ source, idle }) => source.basins.some((basin) => basin.owner === 'neutral') && idle.outcome === 'lost'),
    ).toEqual([]);
  });

  it('from level 6, the rival starts with at least as many units as the player', () => {
    expect(failing(({ source }, index) => index < 5 || startingUnits(source, 'rival') >= startingUnits(source, 'player'))).toEqual(
      [],
    );
  });

  it('on levels 3 to 5, a player basin starts with player neighbors only', () => {
    expect(
      failing(
        ({ level }, index) =>
          !inSeries(index, 3, 5) ||
          level.basins.some(
            (basin) => basin.owner === 'player' && basin.links.every((link) => level.basins[link.basin]!.owner === 'player'),
          ),
      ),
    ).toEqual([]);
  });

  it('in series 2 and 4, a level has basins of at least two sizes', () => {
    expect(failing(({ source }, index) => !(inSeries(index, 6, 10) || inSeries(index, 16, 20)) || sizes(source) >= 2)).toEqual([]);
  });

  it('on level 6, the reference strategy loses, or wins 1.5 times slower, with medium basins only', () => {
    const { source, ticks } = MEASURES[5]!;
    const level = parseLevel({ ...source, basins: source.basins.map((basin) => ({ ...basin, size: 'medium' })) });
    const { end } = play(level, REFERENCE_STRATEGY);
    expect(end.outcome !== 'won' || end.tick >= ticks * SIZE_SLOWDOWN).toBe(true);
  });

  it('on levels 6 to 10, crossings cancel at least 20% of the units the rival emits against the reference strategy', () => {
    expect(
      failing(
        ({ reference }, index) =>
          !inSeries(index, 6, 10) || reference.rivalCrossed >= MIN_CROSSED_SHARE * reference.rivalEmitted,
      ),
    ).toEqual([]);
  });

  it('on level 11, the player cannot reach the rival without tidal channels', () => {
    const { source } = MEASURES[10]!;
    const level = parseLevel({ ...source, channels: source.channels.filter((channel) => channel.tide === undefined) });
    expect(rivalReachable(level)).toBe(false);
  });

  it('on levels 12 to 15, there are two tidal channels or more, and opening them for good changes the outcome or the time by 20%', () => {
    expect(
      failing(({ source, ticks }, index) => {
        if (!inSeries(index, 12, 15)) {
          return true;
        }
        const level = parseLevel({ ...source, channels: source.channels.map(({ between }) => ({ between })) });
        const { end } = play(level, REFERENCE_STRATEGY);
        const changed = end.outcome !== 'won' || Math.abs(end.tick - ticks) >= TIDE_EFFECT * ticks;
        return tidalChannels(source) >= 2 && changed;
      }),
    ).toEqual([]);
  });

  it('in series 4, a level has a tidal channel', () => {
    expect(failing(({ source }, index) => !inSeries(index, 16, 20) || tidalChannels(source) >= 1)).toEqual([]);
  });
});
