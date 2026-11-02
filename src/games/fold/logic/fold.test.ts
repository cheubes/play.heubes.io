import { describe, expect, it } from 'vitest';
import { canFold, createState, fold, isSolved, restart, undo } from './fold';
import { parseLevel } from './level-parser';
import type { Fold } from './types';

const FIRST_CREASE = parseLevel({
  id: 'first-crease',
  par: 1,
  sheet: ['..vv', '..vv', '....'],
  goal: ['vv', 'vv', '..'],
});

// Layers of the pinned sheet:
// 0 1 2
// 3 4 5
// 6 7 8
const PINNED = parseLevel({ id: 'pinned', par: 1, sheet: ['...', '...', '...'], goal: ['.'], pins: [[0, 0]] });

describe('canFold and fold', () => {
  it.each<[string, Fold]>([
    ['a moving part that holds a pinned stack', { axis: 'vertical', line: 1, moving: 'before' }],
    ['a horizontal moving part that holds a pinned stack', { axis: 'horizontal', line: 2, moving: 'before' }],
  ])('AC-04: a fold with %s is pinned and changes neither the state nor the counter', (_name, move) => {
    const state = createState(PINNED);
    expect(canFold(PINNED, state.sheet, move)).toBe('pinned');
    expect(fold(PINNED, state, move)).toBe(state);
  });

  it.each<[string, Fold]>([
    ['line 0', { axis: 'vertical', line: 0, moving: 'after' }],
    ['the outer right edge', { axis: 'vertical', line: 3, moving: 'before' }],
    ['the outer bottom edge', { axis: 'horizontal', line: 3, moving: 'before' }],
    ['a line between grid lines', { axis: 'horizontal', line: 1.5, moving: 'after' }],
  ])('AC-04: a fold on %s is invalid and changes neither the state nor the counter', (_name, move) => {
    const state = createState(PINNED);
    expect(canFold(PINNED, state.sheet, move)).toBe('invalid');
    expect(fold(PINNED, state, move)).toBe(state);
  });

  it('AC-04: a flap laid on a pinned stack no longer moves', () => {
    const state = fold(PINNED, createState(PINNED), { axis: 'vertical', line: 1, moving: 'after' });
    expect(state.sheet.stacks[1]).toEqual([0, 1]);
    const holdingFlap: Fold = { axis: 'vertical', line: 1, moving: 'after' };
    expect(canFold(PINNED, state.sheet, holdingFlap)).toBe('pinned');
    expect(fold(PINNED, state, holdingFlap)).toBe(state);
    expect(canFold(PINNED, state.sheet, { axis: 'vertical', line: 1, moving: 'before' })).toBe('ok');
  });

  it('AC-05: a possible fold increments the move counter by 1', () => {
    const once = fold(FIRST_CREASE, createState(FIRST_CREASE), { axis: 'horizontal', line: 1, moving: 'before' });
    expect(once.moves).toBe(1);
    const twice = fold(FIRST_CREASE, once, { axis: 'vertical', line: 2, moving: 'after' });
    expect(twice.moves).toBe(2);
  });
});

describe('isSolved', () => {
  it('AC-06: a level is not solved while its visible face does not have the size of the goal', () => {
    expect(isSolved(FIRST_CREASE, createState(FIRST_CREASE))).toBe(false);
  });

  it('AC-06: a level is not solved when its visible face has the size of the goal but a different content', () => {
    const state = fold(FIRST_CREASE, createState(FIRST_CREASE), { axis: 'vertical', line: 2, moving: 'before' });
    expect(state.sheet.cols).toBe(2);
    expect(state.sheet.rows).toBe(3);
    expect(isSolved(FIRST_CREASE, state)).toBe(false);
  });

  it('AC-06: a level is solved when its visible face has the size and the content of the goal', () => {
    const state = fold(FIRST_CREASE, createState(FIRST_CREASE), { axis: 'vertical', line: 2, moving: 'after' });
    expect(isSolved(FIRST_CREASE, state)).toBe(true);
  });

  it('AC-06: an empty position only matches an empty position of the goal', () => {
    const sheet = ['v._', '...', '...'];
    const withEmpty = parseLevel({ id: 'test', par: 1, sheet, goal: ['v._', '...', '...'] });
    const withPaper = parseLevel({ id: 'test', par: 1, sheet, goal: ['v..', '...', '...'] });
    expect(isSolved(withEmpty, createState(withEmpty))).toBe(true);
    expect(isSolved(withPaper, createState(withPaper))).toBe(false);
  });
});

describe('undo and restart', () => {
  it('AC-07: undo restores exactly the previous state and decrements the counter', () => {
    const first = fold(FIRST_CREASE, createState(FIRST_CREASE), { axis: 'horizontal', line: 1, moving: 'before' });
    const second = fold(FIRST_CREASE, first, { axis: 'vertical', line: 2, moving: 'after' });
    expect(undo(second)).toEqual(first);
    expect(undo(undo(second))).toEqual(createState(FIRST_CREASE));
  });

  it('AC-07: undo in the initial state has no effect', () => {
    const state = createState(FIRST_CREASE);
    expect(undo(state)).toBe(state);
  });

  it('AC-07: restart restores the unfolded sheet with a counter at zero', () => {
    const state = restart(FIRST_CREASE);
    expect(state).toEqual(createState(FIRST_CREASE));
    expect(state.sheet.stacks).toEqual([[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11]]);
    expect(state.moves).toBe(0);
    expect(state.history).toEqual([]);
  });
});
