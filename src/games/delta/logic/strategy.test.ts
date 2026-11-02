import { describe, expect, it } from 'vitest';
import { parseLevel } from './level-parser';
import { nextRandom } from './random';
import { createState, step } from './simulation';
import { decide } from './strategy';
import type { BasinState, DeltaState, Level, LevelSource, Owner, Side, Unit } from './types';

type BasinSource = LevelSource['basins'][number];

const PARAMS = { reaction: 10, margin: 0 };

function basin(id: string, at: [number, number], owner: Owner, units: number): BasinSource {
  return { id, at, size: 'small', owner, units };
}

function createLevel(basins: BasinSource[], channels: [string, string][], rival = PARAMS): Level {
  return parseLevel({ id: 'test', seed: 7, rival, basins, channels: channels.map((between) => ({ between })) });
}

function withBasin(state: DeltaState, index: number, patch: Partial<BasinState>): DeltaState {
  return { ...state, basins: state.basins.map((current, other) => (other === index ? { ...current, ...patch } : current)) };
}

function inTransit(side: Side, channel: number, towards: Unit['towards'], count: number): Unit[] {
  return Array.from({ length: count }, () => ({ side, channel, towards, progress: 1 }));
}

function outputs(state: DeltaState): (number | null)[] {
  return state.basins.map((current) => current.output);
}

describe('rival strategy', () => {
  // home - den - camp - ford, and den - lair: camp attacks ford unless den needs it.
  const THREAT = createLevel(
    [
      basin('home', [2, 5], 'player', 0),
      basin('den', [7, 5], 'rival', 2),
      basin('camp', [12, 5], 'rival', 9),
      basin('lair', [7, 1], 'rival', 5),
      basin('ford', [12, 1], 'neutral', 1),
    ],
    [
      ['home', 'den'],
      ['den', 'camp'],
      ['den', 'lair'],
      ['camp', 'ford'],
    ],
  );

  it('AC-08: a basin with at least as many opposing units heading to it as its own is put in reserve', () => {
    const start = { ...withBasin(createState(THREAT), 1, { output: 0 }), transit: inTransit('player', 0, 'b', 2) };
    expect(outputs(decide(THREAT, start, 'rival', PARAMS))[1]).toBeNull();
  });

  it('AC-08: a basin with fewer opposing units heading to it than its own, or none, is not threatened', () => {
    const fewer = { ...withBasin(createState(THREAT), 1, { units: 3 }), transit: inTransit('player', 0, 'b', 2) };
    const emptyAndSafe = withBasin(createState(THREAT), 1, { units: 0 });
    expect(outputs(decide(THREAT, fewer, 'rival', PARAMS))[2]).toBe(3);
    expect(outputs(decide(THREAT, emptyAndSafe, 'rival', PARAMS))[2]).toBe(3);
  });

  it('AC-08: each threatened basin is reinforced by its strongest safe neighbor not already reinforcing', () => {
    const level = createLevel(
      [
        basin('home', [1, 1], 'player', 0),
        basin('first', [5, 1], 'rival', 1),
        basin('second', [5, 5], 'rival', 1),
        basin('big', [9, 3], 'rival', 9),
        basin('mid', [9, 7], 'rival', 4),
        basin('base', [1, 5], 'player', 0),
      ],
      [
        ['home', 'first'],
        ['base', 'second'],
        ['first', 'big'],
        ['second', 'big'],
        ['second', 'mid'],
      ],
    );
    const start = { ...createState(level), transit: [...inTransit('player', 0, 'b', 1), ...inTransit('player', 1, 'b', 1)] };
    expect(outputs(decide(level, start, 'rival', PARAMS))).toEqual([null, null, null, 2, 4, null]);
  });

  // weak and ford are both neighbors of den; weak is the easier target.
  const PURSUIT = createLevel(
    [basin('weak', [2, 5], 'neutral', 1), basin('den', [7, 5], 'rival', 5), basin('ford', [12, 5], 'neutral', 8)],
    [
      ['weak', 'den'],
      ['den', 'ford'],
    ],
  );

  it('AC-08: a basin keeps its target while its units and those on their way outnumber the target garrison', () => {
    const start = { ...withBasin(createState(PURSUIT), 1, { output: 1 }), transit: inTransit('rival', 1, 'b', 4) };
    expect(outputs(decide(PURSUIT, start, 'rival', PARAMS))[1]).toBe(1);
  });

  it('AC-08: a basin gives up its target once they no longer outnumber the target garrison', () => {
    const start = { ...withBasin(createState(PURSUIT), 1, { output: 1 }), transit: inTransit('rival', 1, 'b', 3) };
    expect(outputs(decide(PURSUIT, start, 'rival', PARAMS))[1]).toBe(0);
  });

  it('AC-08: a basin attacks the smallest garrison among the neighbors it outnumbers by more than the margin', () => {
    const level = createLevel(
      [
        basin('north', [7, 1], 'neutral', 3),
        basin('west', [2, 5], 'player', 2),
        basin('den', [7, 5], 'rival', 6),
        basin('east', [12, 5], 'neutral', 1),
        basin('south', [7, 9], 'rival', 0),
      ],
      [
        ['north', 'den'],
        ['west', 'den'],
        ['den', 'east'],
        ['den', 'south'],
      ],
    );
    const attack = (margin: number): number | null | undefined =>
      outputs(decide(level, createState(level), 'rival', { ...PARAMS, margin }))[2];
    expect(attack(0)).toBe(2);
    expect(attack(4)).toBe(2);
    expect(attack(5)).toBeNull();
  });

  it('AC-08: a basin surrounded by its own side relays towards the neighbor closest to another side', () => {
    // hall is closer to keep on the map, gate is closer to home in channels.
    const level = createLevel(
      [
        basin('home', [1, 5], 'player', 20),
        basin('gate', [4, 5], 'rival', 3),
        basin('keep', [10, 5], 'rival', 4),
        basin('hall', [12, 5], 'rival', 2),
      ],
      [
        ['home', 'gate'],
        ['gate', 'keep'],
        ['keep', 'hall'],
      ],
    );
    expect(outputs(decide(level, createState(level), 'rival', PARAMS))).toEqual([null, null, 1, 2]);
  });

  it('AC-08: a basin with nothing to pursue, attack or relay is put in reserve', () => {
    const level = createLevel([basin('home', [2, 5], 'player', 10), basin('den', [7, 5], 'rival', 3)], [['home', 'den']]);
    const start = withBasin(createState(level), 1, { output: 0 });
    expect(outputs(decide(level, start, 'rival', PARAMS))[1]).toBeNull();
  });

  it('AC-08: ties are broken by the generator, which only draws on a tie', () => {
    const level = createLevel(
      [basin('west', [2, 5], 'neutral', 2), basin('den', [7, 5], 'rival', 9), basin('east', [12, 5], 'neutral', 2)],
      [
        ['west', 'den'],
        ['den', 'east'],
      ],
    );
    const picks = new Set<number | null | undefined>();
    for (let rng = 1; rng <= 20; rng++) {
      const draw = nextRandom(rng);
      const decided = decide(level, { ...createState(level), rng }, 'rival', PARAMS);
      expect(decided.basins[1]?.output).toBe(Math.floor(draw.value * 2));
      expect(decided.rng).toBe(draw.rng);
      picks.add(decided.basins[1]?.output);
    }
    expect(picks).toEqual(new Set([0, 1]));

    const untied = withBasin(createState(level), 2, { units: 3 });
    expect(decide(level, untied, 'rival', PARAMS).rng).toBe(untied.rng);
  });

  it('AC-08: the rival decides on every multiple of its reaction, and only for its own basins', () => {
    const level = createLevel(
      [basin('home', [2, 5], 'player', 9), basin('ford', [7, 5], 'neutral', 1), basin('den', [12, 5], 'rival', 6)],
      [
        ['home', 'ford'],
        ['ford', 'den'],
      ],
      { reaction: 7, margin: 0 },
    );
    let state = createState(level);
    for (let tick = 1; tick <= 6; tick++) {
      state = step(level, state);
    }
    expect(outputs(state)).toEqual([null, null, null]);
    state = step(level, state);
    expect(outputs(state)).toEqual([null, null, 1]);
  });
});
