import { describe, expect, it } from 'vitest';
import { parseLevel } from './level-parser';
import { createState, isSolved, restart, toggle, undo } from './prism';
import type { ElementSource, Level } from './types';

function createLevel(elements: ElementSource[]): Level {
  return parseLevel({ id: 'test', par: 1, rows: 5, cols: 5, elements });
}

const LEVEL = createLevel([
  { type: 'source', at: [0, 0], color: 'red', direction: 'right' },
  { type: 'mirror', at: [0, 3], orientation: 'slash' },
  { type: 'target', at: [4, 3], color: 'red' },
  { type: 'source', at: [2, 0], color: 'green', direction: 'right' },
  { type: 'target', at: [2, 4], color: 'green' },
  { type: 'prism', at: [4, 0], spin: 'left' },
  { type: 'mirror', at: [4, 1], orientation: 'slash', fixed: true },
  { type: 'prism', at: [4, 2], spin: 'right', fixed: true },
]);

describe('toggle', () => {
  it('AC-08: toggling a mirror changes its state and increments the move counter', () => {
    const once = toggle(LEVEL, createState(LEVEL), { row: 0, col: 3 });
    expect(once.toggled).toEqual(new Set(['e-0-3']));
    expect(once.moves).toBe(1);
    const twice = toggle(LEVEL, once, { row: 0, col: 3 });
    expect(twice.toggled).toEqual(new Set());
    expect(twice.moves).toBe(2);
  });

  it('AC-08: toggling a prism changes its state and increments the move counter', () => {
    const state = toggle(LEVEL, createState(LEVEL), { row: 4, col: 0 });
    expect(state.toggled).toEqual(new Set(['e-4-0']));
    expect(state.moves).toBe(1);
  });

  it.each([
    ['a fixed mirror', 4, 1],
    ['a fixed prism', 4, 2],
    ['a target', 4, 3],
    ['a source', 0, 0],
    ['an empty cell', 1, 1],
  ])('AC-08: touching %s changes neither the state nor the counter', (_name, row, col) => {
    const state = createState(LEVEL);
    expect(toggle(LEVEL, state, { row, col })).toBe(state);
  });
});

describe('isSolved', () => {
  it('AC-09: a level is not solved while one of its targets is not lit', () => {
    expect(isSolved(LEVEL, createState(LEVEL))).toBe(false);
  });

  it('AC-09: a level is solved when all its targets are lit', () => {
    expect(isSolved(LEVEL, toggle(LEVEL, createState(LEVEL), { row: 0, col: 3 }))).toBe(true);
  });
});

describe('undo and restart', () => {
  it('AC-10: undo restores exactly the previous state and decrements the counter', () => {
    const first = toggle(LEVEL, createState(LEVEL), { row: 0, col: 3 });
    const second = toggle(LEVEL, first, { row: 4, col: 0 });
    expect(undo(second)).toEqual(first);
    expect(undo(undo(second))).toEqual(createState(LEVEL));
  });

  it('AC-10: undo in the initial state has no effect', () => {
    const state = createState(LEVEL);
    expect(undo(state)).toBe(state);
  });

  it('AC-10: restart restores the initial state with a counter at zero', () => {
    const state = restart(LEVEL);
    expect(state.toggled).toEqual(new Set());
    expect(state.moves).toBe(0);
    expect(state.history).toEqual([]);
  });
});
