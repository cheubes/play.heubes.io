import { describe, expect, it } from 'vitest';
import { parseLevel } from './level-parser';
import { createState, hold, isChannelOpen, setRoute, step } from './simulation';
import type { BasinSize, BasinState, DeltaState, Level, LevelSource, Owner, Tide, Unit } from './types';

type BasinSource = LevelSource['basins'][number];
type Order = (state: DeltaState) => DeltaState;

function basin(id: string, at: [number, number], owner: Owner, units: number, size: BasinSize = 'small'): BasinSource {
  return { id, at, size, owner, units };
}

function createLevel(basins: BasinSource[], channels: [string, string, Tide?][] = []): Level {
  return parseLevel({
    id: 'test',
    seed: 7,
    rival: { reaction: 10, margin: 0 },
    basins,
    channels: channels.map(([a, b, tide]) => (tide === undefined ? { between: [a, b] } : { between: [a, b], tide })),
  });
}

function run(level: Level, steps: number, start: DeltaState = createState(level), orders: Record<number, Order> = {}): DeltaState[] {
  const states = [start];
  for (let index = 1; index <= steps; index++) {
    const order = orders[index - 1] ?? ((state: DeltaState) => state);
    states.push(step(level, order(at(states, index - 1))));
  }
  return states;
}

function at(states: DeltaState[], index: number): DeltaState {
  const state = states[index];
  if (state === undefined) {
    throw new Error(`No state at step ${index}`);
  }
  return state;
}

function basinAt(state: DeltaState, index: number): BasinState {
  const basinState = state.basins[index];
  if (basinState === undefined) {
    throw new Error(`No basin ${index}`);
  }
  return basinState;
}

function withBasin(state: DeltaState, index: number, patch: Partial<BasinState>): DeltaState {
  return { ...state, basins: state.basins.map((current, other) => (other === index ? { ...current, ...patch } : current)) };
}

function withTransit(state: DeltaState, transit: Unit[]): DeltaState {
  return { ...state, transit };
}

// home - ford - den, channels of length 5 (25 steps).
const LINE = createLevel(
  [basin('home', [2, 5], 'player', 10), basin('ford', [7, 5], 'neutral', 4), basin('den', [12, 5], 'rival', 6)],
  [
    ['home', 'ford'],
    ['ford', 'den'],
  ],
);

// home - den, one channel of length 5 (25 steps).
const DUEL = createLevel([basin('home', [2, 5], 'player', 1), basin('den', [7, 5], 'rival', 1)], [['home', 'den']]);

describe('production', () => {
  const SIZES = createLevel([
    basin('player-small', [1, 1], 'player', 0, 'small'),
    basin('player-medium', [4, 1], 'player', 0, 'medium'),
    basin('player-large', [7, 1], 'player', 0, 'large'),
    basin('rival-small', [1, 5], 'rival', 0, 'small'),
    basin('rival-medium', [4, 5], 'rival', 0, 'medium'),
    basin('rival-large', [7, 5], 'rival', 0, 'large'),
    basin('neutral', [10, 5], 'neutral', 3, 'large'),
  ]);

  it('AC-01: a player or rival basin produces one unit per interval of its size', () => {
    const states = run(SIZES, 140);
    for (let tick = 0; tick <= 140; tick++) {
      const units = at(states, tick).basins.map((current) => current.units);
      const small = Math.floor(tick / 20);
      const medium = Math.floor(tick / 14);
      const large = Math.floor(tick / 10);
      expect(units.slice(0, 6)).toEqual([small, medium, large, small, medium, large]);
    }
  });

  it('AC-01: a neutral basin produces nothing', () => {
    const states = run(SIZES, 140);
    expect(basinAt(at(states, 140), 6).units).toBe(3);
  });

  it('AC-01: a basin stops producing at its capacity, and above it', () => {
    const start = withBasin(withBasin(createState(SIZES), 0, { units: 19 }), 3, { units: 25 });
    const states = run(SIZES, 60, start);
    expect(basinAt(at(states, 19), 0).units).toBe(19);
    expect(basinAt(at(states, 20), 0).units).toBe(20);
    expect(basinAt(at(states, 60), 0).units).toBe(20);
    expect(basinAt(at(states, 60), 3).units).toBe(25);
  });
});

describe('emission and travel', () => {
  it('AC-02: a basin with an output emits one unit per emission interval', () => {
    const states = run(LINE, 24, setRoute(LINE, createState(LINE), 'home', 'ford'));
    for (let tick = 0; tick <= 24; tick++) {
      const state = at(states, tick);
      expect(state.transit).toHaveLength(Math.floor(tick / 5));
      expect(basinAt(state, 0).units).toBe(10 - Math.floor(tick / 5) + Math.floor(tick / 20));
    }
    expect(at(states, 5).transit).toEqual([{ side: 'player', channel: 0, towards: 'b', progress: 1 }]);
  });

  it('AC-02: a basin without an output emits nothing', () => {
    const states = run(LINE, 30);
    expect(states.every((state) => state.transit.length === 0)).toBe(true);
    expect(basinAt(at(states, 30), 0).units).toBe(11);
  });

  it('AC-02: a basin without units emits nothing until it produces one', () => {
    const start = setRoute(LINE, withBasin(createState(LINE), 0, { units: 0 }), 'home', 'ford');
    const states = run(LINE, 20, start);
    expect(at(states, 19).transit).toHaveLength(0);
    expect(at(states, 20).transit).toHaveLength(1);
    expect(basinAt(at(states, 20), 0).units).toBe(0);
  });

  it('AC-02: a unit takes as many steps as its channel duration, its emission step included', () => {
    const start = setRoute(LINE, withBasin(createState(LINE), 0, { units: 1 }), 'home', 'ford');
    const states = run(LINE, 29, start);
    expect(at(states, 28).transit).toEqual([
      { side: 'player', channel: 0, towards: 'b', progress: 24 },
      { side: 'player', channel: 0, towards: 'b', progress: 9 },
    ]);
    expect(basinAt(at(states, 28), 1).units).toBe(4);
    expect(at(states, 29).transit).toEqual([{ side: 'player', channel: 0, towards: 'b', progress: 10 }]);
    expect(basinAt(at(states, 29), 1).units).toBe(3);
  });

  it('AC-02: a channel duration is its length divided by the unit speed, rounded up', () => {
    const level = createLevel(
      [basin('a', [2, 2], 'player', 0), basin('b', [5, 2], 'rival', 0), basin('c', [5, 6], 'neutral', 0), basin('d', [6, 7], 'neutral', 0)],
      [
        ['a', 'b'],
        ['a', 'c'],
        ['c', 'd'],
      ],
    );
    expect(level.channels.map((channel) => channel.duration)).toEqual([15, 25, 8]);
  });
});

describe('crossings', () => {
  it('AC-03: two units of opposite sides heading towards each other cancel out on the step they cross', () => {
    const start = withBasin(setRoute(DUEL, createState(DUEL), 'home', 'den'), 1, { output: 0 });
    const states = run(DUEL, 17, start);
    expect(at(states, 16).transit.map((unit) => unit.progress)).toEqual([12, 12]);
    expect(at(states, 17).transit).toEqual([]);
    expect(at(states, 17).basins).toEqual([
      { owner: 'player', units: 0, output: 0 },
      { owner: 'rival', units: 0, output: 0 },
    ]);
  });

  it('AC-03: every crossing pair cancels out in the same step', () => {
    const start = withTransit(createState(DUEL), [
      { side: 'player', channel: 0, towards: 'b', progress: 16 },
      { side: 'rival', channel: 0, towards: 'a', progress: 15 },
      { side: 'player', channel: 0, towards: 'b', progress: 11 },
      { side: 'rival', channel: 0, towards: 'a', progress: 14 },
      { side: 'player', channel: 0, towards: 'b', progress: 2 },
    ]);
    expect(step(DUEL, start).transit).toEqual([{ side: 'player', channel: 0, towards: 'b', progress: 3 }]);
  });

  it('AC-03: a unit cancels out with an opposite unit even behind a unit of its own side', () => {
    const start = withTransit(createState(DUEL), [
      { side: 'player', channel: 0, towards: 'b', progress: 20 },
      { side: 'player', channel: 0, towards: 'a', progress: 12 },
      { side: 'rival', channel: 0, towards: 'a', progress: 10 },
    ]);
    expect(step(DUEL, start).transit).toEqual([{ side: 'player', channel: 0, towards: 'a', progress: 13 }]);
  });

  it('AC-03: units heading the same way do not affect each other, whatever their side', () => {
    const start = withTransit(createState(DUEL), [
      { side: 'player', channel: 0, towards: 'b', progress: 10 },
      { side: 'rival', channel: 0, towards: 'b', progress: 3 },
    ]);
    expect(step(DUEL, start).transit).toEqual([
      { side: 'player', channel: 0, towards: 'b', progress: 11 },
      { side: 'rival', channel: 0, towards: 'b', progress: 4 },
    ]);
  });

  it('AC-03: units of the same side heading towards each other do not cancel out', () => {
    const start = withTransit(createState(DUEL), [
      { side: 'player', channel: 0, towards: 'b', progress: 20 },
      { side: 'player', channel: 0, towards: 'a', progress: 20 },
    ]);
    expect(step(DUEL, start).transit).toHaveLength(2);
  });
});

describe('arrivals', () => {
  const arriving = (unit: Omit<Unit, 'progress'>): Unit => ({ ...unit, progress: 24 });

  it('AC-04: a unit arriving at a basin of its side adds one unit, even beyond the capacity', () => {
    const start = withTransit(withBasin(createState(DUEL), 0, { units: 20 }), [
      arriving({ side: 'player', channel: 0, towards: 'a' }),
    ]);
    expect(basinAt(step(DUEL, start), 0)).toEqual({ owner: 'player', units: 21, output: null });
  });

  it('AC-04: a unit arriving at a basin of the other side removes one unit', () => {
    const start = withTransit(withBasin(createState(DUEL), 1, { units: 3 }), [
      arriving({ side: 'player', channel: 0, towards: 'b' }),
    ]);
    expect(basinAt(step(DUEL, start), 1)).toEqual({ owner: 'rival', units: 2, output: null });
  });

  it('AC-04: a unit arriving at a neutral basin removes one unit', () => {
    const start = withTransit(createState(LINE), [arriving({ side: 'rival', channel: 1, towards: 'a' })]);
    expect(basinAt(step(LINE, start), 1)).toEqual({ owner: 'neutral', units: 3, output: null });
  });

  it('AC-04: a unit arriving at an empty basin of the other side takes it, with one unit and no output', () => {
    const start = withTransit(withBasin(createState(DUEL), 1, { units: 0, output: 0 }), [
      arriving({ side: 'player', channel: 0, towards: 'b' }),
    ]);
    expect(basinAt(step(DUEL, start), 1)).toEqual({ owner: 'player', units: 1, output: null });
  });

  it('AC-04: a unit arriving at an empty neutral basin takes it', () => {
    const start = withTransit(withBasin(createState(LINE), 1, { units: 0 }), [
      arriving({ side: 'player', channel: 0, towards: 'b' }),
    ]);
    expect(basinAt(step(LINE, start), 1)).toEqual({ owner: 'player', units: 1, output: null });
  });
});

describe('tides', () => {
  // A channel of length 14 (70 steps), open 20 steps out of 40.
  const TIDAL = createLevel(
    [basin('home', [1, 5], 'player', 20), basin('den', [15, 5], 'rival', 10)],
    [['home', 'den', { open: 20, closed: 20, phase: 0 }]],
  );

  it('AC-05: a tidal channel opens and closes following its cycle', () => {
    const channel = createLevel(
      [basin('a', [2, 5], 'player', 0), basin('b', [7, 5], 'rival', 0)],
      [['a', 'b', { open: 20, closed: 30, phase: 10 }]],
    ).channels[0]!;
    const open = [0, 9, 40, 59, 90].map((tick) => isChannelOpen(channel, tick));
    const closed = [10, 39, 60, 89].map((tick) => isChannelOpen(channel, tick));
    expect(open.every(Boolean)).toBe(true);
    expect(closed.some(Boolean)).toBe(false);
  });

  it('AC-05: a closed channel lets no new unit in', () => {
    const states = run(TIDAL, 70, setRoute(TIDAL, createState(TIDAL), 'home', 'den'));
    expect(at(states, 15).transit).toHaveLength(3);
    expect(at(states, 39).transit).toHaveLength(3);
    expect(at(states, 40).transit).toHaveLength(4);
    expect(at(states, 55).transit).toHaveLength(7);
    expect(at(states, 70).transit).toHaveLength(7);
    expect(basinAt(at(states, 39), 0).units).toBe(18);
  });

  it('AC-05: units already in a channel finish their way when it closes', () => {
    const states = run(TIDAL, 74, setRoute(TIDAL, createState(TIDAL), 'home', 'den'));
    expect(isChannelOpen(TIDAL.channels[0]!, 74)).toBe(false);
    expect(at(states, 73).transit).toHaveLength(7);
    expect(at(states, 74).transit).toHaveLength(6);
    expect(basinAt(at(states, 74), 1).units).toBe(basinAt(at(states, 73), 1).units - 1);
  });
});

describe('orders', () => {
  // ford and hill are both neighbors of home; den is a neighbor of ford only.
  const FORK = createLevel(
    [
      basin('home', [2, 5], 'player', 10),
      basin('ford', [7, 5], 'neutral', 4),
      basin('hill', [2, 1], 'neutral', 4),
      basin('den', [12, 5], 'rival', 6),
    ],
    [
      ['home', 'ford'],
      ['home', 'hill'],
      ['ford', 'den'],
    ],
  );

  it('AC-06: setting, changing and removing the output of a player basin changes the state', () => {
    const start = createState(FORK);
    const towardsFord = setRoute(FORK, start, 'home', 'ford');
    const towardsHill = setRoute(FORK, towardsFord, 'home', 'hill');
    const held = hold(FORK, towardsHill, 'home');
    expect(towardsFord.basins.map((current) => current.output)).toEqual([0, null, null, null]);
    expect(towardsHill.basins.map((current) => current.output)).toEqual([1, null, null, null]);
    expect(held.basins.map((current) => current.output)).toEqual([null, null, null, null]);
    expect(held).not.toBe(towardsHill);
  });

  it('AC-06: an order on a basin that is not the player\'s changes nothing', () => {
    const start = withBasin(createState(FORK), 3, { output: 2 });
    expect(setRoute(FORK, start, 'den', 'ford')).toBe(start);
    expect(setRoute(FORK, start, 'ford', 'home')).toBe(start);
    expect(setRoute(FORK, start, 'nowhere', 'home')).toBe(start);
    expect(hold(FORK, start, 'den')).toBe(start);
    expect(hold(FORK, start, 'ford')).toBe(start);
    expect(hold(FORK, start, 'nowhere')).toBe(start);
  });

  it('AC-06: an order towards a basin that is not a neighbor changes nothing', () => {
    const start = createState(FORK);
    expect(setRoute(FORK, start, 'home', 'den')).toBe(start);
    expect(setRoute(FORK, start, 'home', 'home')).toBe(start);
    expect(setRoute(FORK, start, 'home', 'nowhere')).toBe(start);
  });
});

describe('outcome', () => {
  const arriving = (unit: Omit<Unit, 'progress'>): Unit => ({ ...unit, progress: 24 });

  it('AC-07: the player wins once the rival has no basin and no unit in transit', () => {
    const start = withTransit(withBasin(createState(DUEL), 1, { units: 0 }), [
      arriving({ side: 'player', channel: 0, towards: 'b' }),
    ]);
    const won = step(DUEL, start);
    expect(won.outcome).toBe('won');
    expect(step(DUEL, won)).toBe(won);
  });

  it('AC-07: the player does not win while a rival unit is still in transit', () => {
    const start = withTransit(withBasin(createState(DUEL), 1, { units: 0 }), [
      arriving({ side: 'player', channel: 0, towards: 'b' }),
      { side: 'rival', channel: 0, towards: 'b', progress: 0 },
    ]);
    expect(step(DUEL, start).outcome).toBe('playing');
  });

  it('AC-07: the player loses once they have no basin and no unit in transit', () => {
    const start = withTransit(withBasin(createState(DUEL), 0, { units: 0 }), [
      arriving({ side: 'rival', channel: 0, towards: 'a' }),
    ]);
    const lost = step(DUEL, start);
    expect(lost.outcome).toBe('lost');
    expect(step(DUEL, lost)).toBe(lost);
  });

  it('AC-07: the player does not lose while one of their units is still in transit', () => {
    const start = withTransit(withBasin(createState(DUEL), 0, { units: 0 }), [
      arriving({ side: 'rival', channel: 0, towards: 'a' }),
      { side: 'player', channel: 0, towards: 'a', progress: 0 },
    ]);
    expect(step(DUEL, start).outcome).toBe('playing');
  });

  it('AC-07: when both sides run out on the same step, the player loses', () => {
    const neutral = { owner: 'neutral', units: 5, output: null } as const;
    const start = withTransit({ ...createState(DUEL), basins: [neutral, neutral] }, [
      { side: 'player', channel: 0, towards: 'b', progress: 12 },
      { side: 'rival', channel: 0, towards: 'a', progress: 12 },
    ]);
    const end = step(DUEL, start);
    expect(end.transit).toEqual([]);
    expect(end.outcome).toBe('lost');
  });

  it('AC-07: only player basins taken by the rival count as lost', () => {
    const empty = withBasin(withBasin(withBasin(createState(LINE), 0, { units: 0 }), 1, { units: 0 }), 2, { units: 0 });
    const rivalTakesNeutral = step(LINE, withTransit(empty, [arriving({ side: 'rival', channel: 1, towards: 'a' })]));
    const playerTakesRival = step(LINE, withTransit(empty, [arriving({ side: 'player', channel: 1, towards: 'b' })]));
    const rivalTakesPlayer = step(LINE, withTransit(empty, [arriving({ side: 'rival', channel: 0, towards: 'a' })]));
    expect(basinAt(rivalTakesNeutral, 1).owner).toBe('rival');
    expect(rivalTakesNeutral.basinsLost).toBe(0);
    expect(basinAt(playerTakesRival, 2).owner).toBe('player');
    expect(playerTakesRival.basinsLost).toBe(0);
    expect(basinAt(rivalTakesPlayer, 0).owner).toBe('rival');
    expect(rivalTakesPlayer.basinsLost).toBe(1);
  });
});

describe('determinism', () => {
  const DELTA = createLevel(
    [
      basin('home', [2, 5], 'player', 12, 'medium'),
      basin('ford', [6, 3], 'neutral', 4),
      basin('marsh', [6, 7], 'neutral', 6),
      basin('isle', [10, 5], 'neutral', 8, 'large'),
      basin('den', [14, 5], 'rival', 12, 'medium'),
    ],
    [
      ['home', 'ford'],
      ['home', 'marsh'],
      ['ford', 'isle'],
      ['marsh', 'isle', { open: 30, closed: 20, phase: 5 }],
      ['isle', 'den'],
    ],
  );

  const ORDERS: Record<number, Order> = {
    0: (state) => setRoute(DELTA, state, 'home', 'ford'),
    60: (state) => setRoute(DELTA, state, 'home', 'marsh'),
    120: (state) => setRoute(DELTA, state, 'ford', 'isle'),
    150: (state) => setRoute(DELTA, state, 'marsh', 'isle'),
    200: (state) => hold(DELTA, state, 'home'),
    260: (state) => setRoute(DELTA, state, 'home', 'ford'),
  };

  it('AC-09: two simulations of a level with the same orders give the same state at every step', () => {
    const start = withBasin(createState(DELTA), 4, { output: 4 });
    const first = run(DELTA, 400, start, ORDERS);
    const second = run(DELTA, 400, start, ORDERS);
    expect(second).toEqual(first);
    expect(first.some((state) => state.transit.some((unit) => unit.side === 'rival'))).toBe(true);
    expect(at(first, 400).basins.filter((current) => current.owner === 'player').length).toBeGreaterThan(1);
  });
});
