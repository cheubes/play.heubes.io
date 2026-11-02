import { describe, expect, it } from 'vitest';
import { moverPosition } from './collision';
import { createState, step } from './leap';
import { parseLevel } from './level-parser';
import { GRAVITY, JUMP_SPEED, MAX_FALL_SPEED, SPRING_SPEED } from './types';
import type { Facing, LeapState, Level, MoverSource, RoomSource } from './types';

const WALLS = '############';
const OPEN = '#..........#';
const START_X = 270;
const FLOOR_Y = 2424;

function room(rows: Record<number, string>, facing: Facing = 'right', movers: MoverSource[] = []): RoomSource {
  const grid = Array.from({ length: 12 }, (_, row) => rows[row] ?? (row === 0 || row === 11 ? WALLS : OPEN));
  if (grid.some((line) => line.length !== 12)) {
    throw new Error('Test rooms are 12 by 12');
  }
  return { grid, facing, movers };
}

function createLevel(first: RoomSource, second: RoomSource = first): Level {
  return parseLevel({ id: 'test', rooms: [first, second] });
}

function run(level: Level, steps: number, presses: number[] = [], start: LeapState = createState(level)): LeapState[] {
  const states = [start];
  for (let index = 1; index <= steps; index++) {
    states.push(step(level, at(states, index - 1), presses.includes(index)));
  }
  return states;
}

function at(states: LeapState[], index: number): LeapState {
  const state = states[index];
  if (state === undefined) {
    throw new Error(`No state at step ${index}`);
  }
  return state;
}

function firstIndex(states: LeapState[], predicate: (state: LeapState, index: number) => boolean): number {
  const index = states.findIndex(predicate);
  if (index === -1) {
    throw new Error('No matching state');
  }
  return index;
}

const CORRIDOR = createLevel(room({ 10: '#E.........#' }));
const LEDGE = createLevel(room({ 10: '#E.........#', 11: '####.......#' }));
const DROP = createLevel(room({ 1: '#E.........#', 2: '###........#' }));
const WALL = createLevel(
  room({ 5: '#.....#....#', 6: '#.....#....#', 7: '#.....#....#', 8: '#.....#....#', 9: '#.....#....#', 10: '#E....#....#' }),
);
const WALK_ONTO_SPRING = createLevel(room({ 10: '#E...s.....#' }));
const HORIZONTAL_MOVER = createLevel(
  room({ 5: '#..E.......#' }, 'left', [{ from: [2, 6], to: [6, 6], length: 2, period: 120 }]),
);
const VERTICAL_MOVER = createLevel(
  room({ 5: '#..E.......#' }, 'right', [{ from: [3, 6], to: [3, 2], length: 3, period: 120 }]),
);
const FLOOR_SPIKES = createLevel(room({ 10: '#E...^.....#' }));
const LEVER_COG_SPIKES = createLevel(room({ 1: '#.....D....#', 10: '#E.l.c.^...#' }));
const TWO_ROOMS = createLevel(room({ 10: '#E.c..X....#' }), room({ 10: '#....X.c.E.#' }, 'left'));

describe('running', () => {
  it('AC-01: before the first press, the runner does not move', () => {
    const states = run(CORRIDOR, 30);
    expect(at(states, 30)).toBe(at(states, 0));
  });

  it('AC-01: the first press launches the runner without moving or jumping', () => {
    const launched = at(run(CORRIDOR, 1, [1]), 1);
    expect(launched.runner).toEqual({ ...createState(CORRIDOR).runner, launched: true });
  });

  it('AC-01: once launched, the runner runs at a constant speed', () => {
    const states = run(CORRIDOR, 21, [1]);
    for (let index = 2; index <= 21; index++) {
      expect(at(states, index).runner.x - at(states, index - 1).runner.x).toBe(24);
      expect(at(states, index).runner.y).toBe(FLOOR_Y);
    }
  });

  it('AC-01: the runner turns around against a wall on the ground, without losing speed', () => {
    const states = run(WALL, 50, [1]);
    const turn = firstIndex(states, (state) => state.runner.facing === 'left');
    expect(at(states, turn).runner).toMatchObject({ x: 6 * 240 - 180, grounded: true });
    expect(at(states, turn + 1).runner.x).toBe(6 * 240 - 180 - 24);
    expect(at(states, turn + 2).runner.x).toBe(6 * 240 - 180 - 48);
  });

  it('AC-01: the runner turns around against a wall in the air, without losing speed', () => {
    const states = run(WALL, 50, [1, 31]);
    const turn = firstIndex(states, (state) => state.runner.facing === 'left');
    expect(at(states, turn).runner).toMatchObject({ x: 6 * 240 - 180, grounded: false });
    expect(at(states, turn).runner.vy).toBe(at(states, turn - 1).runner.vy + GRAVITY);
    expect(at(states, turn + 1).runner.x).toBe(6 * 240 - 180 - 24);
  });
});

describe('jumping', () => {
  it('AC-02: a press on the ground jumps 512 units high and lands back after 33 steps', () => {
    const states = run(CORRIDOR, 40, [1, 2]);
    expect(at(states, 2).runner).toMatchObject({ vy: -JUMP_SPEED + GRAVITY, grounded: false });
    expect(Math.min(...states.map((state) => state.runner.y))).toBe(FLOOR_Y - 512);
    const landing = firstIndex(states, (state, index) => index > 2 && state.runner.grounded);
    expect(landing - 2 + 1).toBe(33);
    expect(at(states, landing).runner.y).toBe(FLOOR_Y);
  });

  it('AC-02: a press shortly after leaving the ground still jumps', () => {
    const left = firstIndex(run(LEDGE, 40, [1]), (state) => state.runner.launched && !state.runner.grounded);
    expect(at(run(LEDGE, left + 5, [1, left + 5]), left + 5).runner.vy).toBe(-JUMP_SPEED + GRAVITY);
    expect(at(run(LEDGE, left + 6, [1, left + 6]), left + 6).runner.vy).toBeGreaterThan(0);
  });

  it('AC-02: a press shortly before landing is buffered and jumps on landing', () => {
    const landing = firstIndex(run(CORRIDOR, 40, [1, 2]), (state, index) => index > 2 && state.runner.grounded);
    const buffered = run(CORRIDOR, landing + 1, [1, 2, landing - 4]);
    expect(at(buffered, landing).runner.grounded).toBe(true);
    expect(at(buffered, landing + 1).runner.vy).toBe(-JUMP_SPEED + GRAVITY);
    const tooEarly = run(CORRIDOR, landing + 1, [1, 2, landing - 5]);
    expect(at(tooEarly, landing + 1).runner).toMatchObject({ vy: 0, grounded: true });
  });

  it('AC-02: any other press in the air is ignored', () => {
    const motion = (states: LeapState[]) =>
      states.map(({ runner }) => ({ x: runner.x, y: runner.y, vy: runner.vy, grounded: runner.grounded }));
    expect(motion(run(CORRIDOR, 50, [1, 2, 12]))).toEqual(motion(run(CORRIDOR, 50, [1, 2])));
  });
});

describe('gravity', () => {
  it('AC-03: gravity accelerates the fall up to the maximum fall speed', () => {
    const states = run(DROP, 80, [1]);
    const left = firstIndex(states, (state) => state.runner.launched && !state.runner.grounded);
    const landing = firstIndex(states, (state, index) => index > left && state.runner.grounded);
    for (let index = left; index < landing; index++) {
      expect(at(states, index).runner.vy).toBe(Math.min(GRAVITY * (index - left + 1), MAX_FALL_SPEED));
    }
    expect(at(states, landing - 1).runner.vy).toBe(MAX_FALL_SPEED);
  });

  it('AC-03: a falling runner lands on the floor', () => {
    const states = run(DROP, 80, [1]);
    const left = firstIndex(states, (state) => state.runner.launched && !state.runner.grounded);
    const landing = firstIndex(states, (state, index) => index > left && state.runner.grounded);
    expect(at(states, landing).runner).toMatchObject({ y: FLOOR_Y, vy: 0, grounded: true });
  });

  it('AC-03: a ceiling stops the ascent', () => {
    const level = createLevel(room({ 9: WALLS, 10: '#E.........#' }));
    const states = run(level, 20, [1, 2]);
    expect(at(states, 2).runner).toMatchObject({ y: 10 * 240, vy: 0, grounded: false });
    expect(at(states, 20).runner).toMatchObject({ y: FLOOR_Y, grounded: true });
  });
});

describe('platforms', () => {
  it('AC-04: a platform holds a runner falling onto it from above', () => {
    const level = createLevel(room({ 4: '#E.........#', 5: '###........#', 8: '#..------..#' }));
    const states = run(level, 60, [1]);
    const left = firstIndex(states, (state) => state.runner.launched && !state.runner.grounded);
    const landing = firstIndex(states, (state, index) => index > left && state.runner.grounded);
    expect(at(states, landing).runner.y).toBe(8 * 240 - 216);
  });

  it('AC-04: a runner jumping from below goes through a platform, then lands on it', () => {
    const level = createLevel(room({ 9: '#----------#', 10: '#E.........#' }));
    const states = run(level, 60, [1, 2]);
    expect(Math.min(...states.map((state) => state.runner.y))).toBe(FLOOR_Y - 512);
    expect(at(states, 60).runner).toMatchObject({ y: 9 * 240 - 216, grounded: true });
  });

  it('AC-04: a runner goes through a platform from the side', () => {
    const level = createLevel(room({ 10: '#E..-......#' }));
    const states = run(level, 45, [1]);
    for (let index = 2; index <= 45; index++) {
      expect(at(states, index).runner).toMatchObject({ facing: 'right', y: FLOOR_Y });
      expect(at(states, index).runner.x - at(states, index - 1).runner.x).toBe(24);
    }
    expect(at(states, 45).runner.x).toBeGreaterThan(5 * 240);
  });
});

describe('springs', () => {
  it('AC-05: a runner walking onto a spring bounces 1035 units high', () => {
    const states = run(WALK_ONTO_SPRING, 70, [1]);
    const bounce = firstIndex(states, (state) => state.runner.vy === -SPRING_SPEED);
    expect(at(states, bounce).runner).toMatchObject({ y: FLOOR_Y, grounded: false });
    expect(Math.min(...states.map((state) => state.runner.y))).toBe(FLOOR_Y - 1035);
  });

  it('AC-05: a runner falling onto a spring bounces 1035 units high', () => {
    const level = createLevel(room({ 4: '#E.........#', 5: '###........#', 10: '#....sss...#' }));
    const states = run(level, 90, [1]);
    const bounce = firstIndex(states, (state) => state.runner.vy === -SPRING_SPEED);
    expect(at(states, bounce - 1).runner.vy).toBe(MAX_FALL_SPEED);
    expect(Math.min(...states.slice(bounce).map((state) => state.runner.y))).toBe(FLOOR_Y - 1035);
  });

  it('AC-05: a press during the bounce does not replace it with a jump', () => {
    const bounce = firstIndex(run(WALK_ONTO_SPRING, 70, [1]), (state) => state.runner.vy === -SPRING_SPEED);
    const states = run(WALK_ONTO_SPRING, 70, [1, bounce + 1]);
    expect(at(states, bounce + 1).runner.vy).toBe(-SPRING_SPEED + GRAVITY);
    expect(Math.min(...states.map((state) => state.runner.y))).toBe(FLOOR_Y - 1035);
  });
});

describe('levers and doors', () => {
  it('AC-06: touching a lever swaps all the doors, once per contact', () => {
    const level = createLevel(room({ 1: '#.....D....#', 2: '#.....d....#', 10: '#E.l.#.....#' }));
    const states = run(level, 45, [1]);
    const swaps = states.flatMap((state, index) =>
      index > 0 && state.doorsSwapped !== at(states, index - 1).doorsSwapped ? [index] : [],
    );
    expect(swaps).toHaveLength(2);
    const [first = 0, second = 0] = swaps;
    const between = states.slice(first, second);
    expect(between.filter((state) => state.runner.onLever).length).toBeGreaterThan(1);
    expect(between.some((state) => !state.runner.onLever)).toBe(true);
  });

  it('AC-06: a closed door blocks the runner like a wall, an open door lets it through', () => {
    const level = createLevel(room({ 10: '#E.d..D....#' }));
    const states = run(level, 50, [1]);
    const turn = firstIndex(states, (state) => state.runner.facing === 'left');
    expect(at(states, turn).runner.x).toBe(6 * 240 - 180);
  });

  it('AC-06: a door that must close on the runner waits until it has left', () => {
    const level = createLevel(room({ 10: '#E.dl......#' }));
    const states = run(level, 40, [1]);
    const pending = firstIndex(states, (state) => state.pendingSwap);
    expect(at(states, pending).doorsSwapped).toBe(false);
    expect(at(states, pending).runner.x).toBeLessThan(4 * 240);
    const swap = firstIndex(states, (state) => state.doorsSwapped);
    expect(swap).toBeGreaterThan(pending);
    expect(at(states, swap - 1).pendingSwap).toBe(true);
    expect(at(states, swap)).toMatchObject({ pendingSwap: false });
    expect(at(states, swap - 1).runner.x).toBeLessThan(4 * 240);
    expect(at(states, swap).runner.x).toBeGreaterThanOrEqual(4 * 240);
  });
});

describe('moving platforms', () => {
  it('AC-07: a moving platform goes back and forth at a constant speed', () => {
    const mover = { from: { col: 2, row: 6 }, to: { col: 6, row: 6 }, length: 2, period: 120 };
    expect([0, 15, 30, 60, 90, 120, 135].map((tick) => moverPosition(mover, tick).x)).toEqual([
      480, 720, 960, 1440, 960, 480, 720,
    ]);
    expect(moverPosition(mover, 45).y).toBe(6 * 240);
  });

  it('AC-07: a horizontal moving platform carries the runner standing on it', () => {
    const states = run(HORIZONTAL_MOVER, 11, [1]);
    for (let index = 2; index <= 11; index++) {
      expect(at(states, index).runner).toMatchObject({ x: 750 - 8 * (index - 1), y: 6 * 240 - 216, grounded: true });
    }
  });

  it('AC-07: a vertical moving platform carries the runner standing on it', () => {
    const states = run(VERTICAL_MOVER, 11, [1]);
    for (let index = 2; index <= 11; index++) {
      expect(at(states, index).runner).toMatchObject({
        x: 750 + 24 * (index - 1),
        y: 6 * 240 - 216 - 16 * (index - 1),
        grounded: true,
      });
    }
  });
});

describe('falls', () => {
  it('AC-08: touching floor spikes is a fall: the runner is back on the entry, stopped', () => {
    const states = run(FLOOR_SPIKES, 50, [1]);
    const fall = firstIndex(states, (state) => state.falls === 1);
    expect(at(states, fall - 1).runner.x + 180).toBeGreaterThan(5 * 240);
    expect(at(states, fall).runner).toEqual(createState(FLOOR_SPIKES).runner);
    expect(at(states, fall).roomTick).toBe(0);
  });

  it('AC-08: each fall increases the fall counter by 1', () => {
    const first = run(FLOOR_SPIKES, 50, [1]);
    const fall = firstIndex(first, (state) => state.falls === 1);
    expect(run(FLOOR_SPIKES, 50, [1], at(first, fall)).some((state) => state.falls === 2)).toBe(true);
    expect(run(FLOOR_SPIKES, 50, [1], at(first, fall)).every((state) => state.falls <= 2)).toBe(true);
  });

  it('AC-08: touching ceiling spikes is a fall', () => {
    const level = createLevel(room({ 8: '#vvvvvvvvvv#', 10: '#E.........#' }));
    const states = run(level, 20, [1, 2]);
    const fall = firstIndex(states, (state) => state.falls === 1);
    expect(at(states, fall).runner).toEqual(createState(level).runner);
  });

  it('AC-08: leaving the room through the bottom is a fall', () => {
    const states = run(LEDGE, 80, [1]);
    const fall = firstIndex(states, (state) => state.falls === 1);
    expect(at(states, fall - 1).runner.y + 216).toBeLessThanOrEqual(12 * 240);
    expect(at(states, fall).runner).toEqual(createState(LEDGE).runner);
  });

  it('AC-08: a fall restores the room and its cog to their initial state', () => {
    const states = run(LEVER_COG_SPIKES, 60, [1]);
    const fall = firstIndex(states, (state) => state.falls === 1);
    expect(at(states, fall - 1)).toMatchObject({ doorsSwapped: true, roomCog: true });
    expect(at(states, fall)).toEqual({ ...createState(LEVER_COG_SPIKES), falls: 1, runTicks: fall - 1 });
  });

  it('AC-08: cogs of the rooms already cleared stay acquired after a fall', () => {
    const level = createLevel(room({ 10: '#E.c..X....#' }), room({ 10: '#E...^.....#' }));
    const first = run(level, 50, [1]);
    const secondRoom = at(first, firstIndex(first, (state) => state.room === 1));
    const second = run(level, 50, [1], secondRoom);
    const fall = at(second, firstIndex(second, (state) => state.falls === 1));
    expect(fall).toMatchObject({ room: 1, cogs: 1, roomCog: false });
  });
});

describe('cogs, exits and time', () => {
  it('AC-09: touching the cog collects it', () => {
    const states = run(TWO_ROOMS, 20, [1]);
    const collected = firstIndex(states, (state) => state.roomCog);
    expect(at(states, collected - 1).runner.x + 180).toBeLessThanOrEqual(3 * 240);
    expect(at(states, collected).runner.x + 180).toBeGreaterThan(3 * 240);
  });

  it('AC-09: touching the exit of the first room moves to the second, stopped on its entry', () => {
    const states = run(TWO_ROOMS, 50, [1]);
    const secondRoom = at(states, firstIndex(states, (state) => state.room === 1));
    expect(secondRoom).toMatchObject({ roomTick: 0, cogs: 1, roomCog: false, doorsSwapped: false, outcome: 'playing' });
    expect(secondRoom.runner).toEqual({
      x: 9 * 240 + 30,
      y: FLOOR_Y,
      vy: 0,
      facing: 'left',
      launched: false,
      grounded: true,
      coyote: 0,
      buffer: 0,
      onLever: false,
    });
  });

  it('AC-09: touching the exit of the second room completes the level', () => {
    const first = run(TWO_ROOMS, 50, [1]);
    const second = run(TWO_ROOMS, 50, [1], at(first, firstIndex(first, (state) => state.room === 1)));
    const complete = at(second, firstIndex(second, (state) => state.outcome === 'complete'));
    expect(complete).toMatchObject({ room: 1, cogs: 2, roomCog: false });
    expect(step(TWO_ROOMS, complete, true)).toBe(complete);
  });

  it('AC-09: time only counts the steps where the runner is launched', () => {
    expect(at(run(TWO_ROOMS, 20, [6]), 20).runTicks).toBe(14);
    const states = run(TWO_ROOMS, 80, [1]);
    const secondRoom = firstIndex(states, (state) => state.room === 1);
    expect(at(states, secondRoom).runTicks).toBe(secondRoom - 1);
    expect(at(states, 80).runTicks).toBe(secondRoom - 1);
  });
});

describe('determinism', () => {
  const LEVELS = { WALL, WALK_ONTO_SPRING, HORIZONTAL_MOVER, VERTICAL_MOVER, LEVER_COG_SPIKES, TWO_ROOMS };
  const PRESSES = Array.from({ length: 600 }, (_, index) => index).filter((index) => index % 17 === 1);

  function deepFreeze<T>(value: T): T {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }

  it.each(Object.entries(LEVELS))(
    'AC-10: two simulations of %s with the same presses give exactly the same state at each step',
    (_name, level) => {
      expect(run(level, 600, PRESSES)).toEqual(run(level, 600, PRESSES));
    },
  );

  it.each(Object.entries(LEVELS))('AC-10: a step never modifies the state it is given, in %s', (_name, level) => {
    const expected = run(level, 600, PRESSES);
    let state = deepFreeze(createState(level));
    for (let index = 1; index <= 600; index++) {
      state = deepFreeze(step(level, state, PRESSES.includes(index)));
      expect(state).toEqual(at(expected, index));
    }
  });
});
