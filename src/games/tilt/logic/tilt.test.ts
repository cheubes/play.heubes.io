import { describe, expect, it } from 'vitest';
import { parseLevel } from './level-parser';
import { createState, isSolved, restart, tilt, undo } from './tilt';
import type { Level, Position, TiltState } from './types';

function createLevel(terrain: string[], pieces: string[]): Level {
  return parseLevel({ id: 'test', par: 1, terrain, pieces });
}

function positionOf(state: TiltState, blockId: string): Position | undefined {
  return state.blocks.find((block) => block.id === blockId)?.position;
}

describe('tilt', () => {
  it('AC-01: a lone block stops on the last cell before the board edge', () => {
    const level = createLevel(['.....'], ['A....']);
    const { state, motions } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-0')).toEqual({ row: 0, col: 4 });
    expect(motions).toEqual([{ blockId: 'b-0-0', from: { row: 0, col: 0 }, to: { row: 0, col: 4 }, stoppedBy: 'wall' }]);
  });

  it('AC-01: a lone block stops on the last cell before a wall', () => {
    const level = createLevel(['...#.'], ['A....']);
    const { state, motions } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-0')).toEqual({ row: 0, col: 2 });
    expect(motions[0]?.stoppedBy).toBe('wall');
  });

  it('AC-02: two blocks on the same row end side by side against the obstacle, in the same order', () => {
    const level = createLevel(['......'], ['A.B...']);
    const { state, motions } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-2')).toEqual({ row: 0, col: 5 });
    expect(positionOf(state, 'b-0-0')).toEqual({ row: 0, col: 4 });
    expect(motions.find((motion) => motion.blockId === 'b-0-0')?.stoppedBy).toBe('block');
  });

  it('AC-02: two blocks in the same column end side by side when tilting up', () => {
    const level = createLevel(['.', '#', '.', '.', 'a', '.'], ['.', '.', '.', 'A', '.', 'X']);
    const { state } = tilt(level, createState(level), 'up');
    expect(positionOf(state, 'b-3-0')).toEqual({ row: 2, col: 0 });
    expect(positionOf(state, 'b-5-0')).toEqual({ row: 3, col: 0 });
  });

  it('AC-03: a block stops on a sticky tile on its path', () => {
    const level = createLevel(['..+..'], ['A....']);
    const { state, motions } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-0')).toEqual({ row: 0, col: 2 });
    expect(motions[0]?.stoppedBy).toBe('sticky');
  });

  it('AC-04: a block resting on a sticky tile leaves it and slides normally', () => {
    const level = createLevel(['..+..'], ['..A..']);
    const { state, motions } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-2')).toEqual({ row: 0, col: 4 });
    expect(motions[0]?.stoppedBy).toBe('wall');
  });

  it('AC-05: a block crosses a target of its own color without stopping', () => {
    const level = createLevel(['..a..'], ['A....']);
    const { state } = tilt(level, createState(level), 'right');
    expect(positionOf(state, 'b-0-0')).toEqual({ row: 0, col: 4 });
  });

  it('AC-06: a tilt that moves no block leaves the state, the move counter and the history unchanged', () => {
    const level = createLevel(['#....', '.....'], ['.....', 'A...X']);
    const played = tilt(level, createState(level), 'right').state;
    expect(played.moves).toBe(1);

    for (const direction of ['right', 'down'] as const) {
      const result = tilt(level, played, direction);
      expect(result.state).toBe(played);
      expect(result.state.moves).toBe(1);
      expect(result.state.history).toHaveLength(1);
      expect(result.motions).toEqual([]);
    }
  });
});

describe('isSolved', () => {
  const level = createLevel(['a...b'], ['.....']);

  function stateWith(pieces: string): TiltState {
    return createState(createLevel(['a...b'], [pieces]));
  }

  it('AC-07: the level is solved when every colored block is on a target of its color, wherever the neutral blocks are', () => {
    expect(isSolved(level, stateWith('A.X.B'))).toBe(true);
    expect(isSolved(level, stateWith('AX..B'))).toBe(true);
  });

  it('AC-07: the level is not solved when a colored block is off target or on a target of another color', () => {
    expect(isSolved(level, stateWith('A..B.'))).toBe(false);
    expect(isSolved(level, stateWith('B...A'))).toBe(false);
  });

  it('AC-07: a neutral block on a target does not count as a colored block on it', () => {
    expect(isSolved(level, stateWith('X.A.B'))).toBe(false);
  });
});

describe('undo', () => {
  const level = createLevel(['.....', '.....'], ['A....', '.....']);

  it('AC-08: undo restores exactly the previous position and decrements the move counter', () => {
    const first = tilt(level, createState(level), 'right').state;
    const second = tilt(level, first, 'down').state;

    const undone = undo(second);
    expect(undone.blocks).toEqual(first.blocks);
    expect(undone.moves).toBe(1);
    expect(undone.history).toEqual(first.history);

    const initial = undo(undone);
    expect(initial).toEqual(createState(level));
  });

  it('AC-08: undo in the initial position has no effect', () => {
    const state = createState(level);
    expect(undo(state)).toBe(state);
  });
});

describe('restart', () => {
  it('AC-09: restart restores the initial position, a zero move counter and an empty history', () => {
    const level = createLevel(['.....', '.....'], ['A....', '.....']);
    const first = tilt(level, createState(level), 'right').state;
    const second = tilt(level, first, 'down').state;

    const restarted = restart(level);
    expect(second.moves).toBe(2);
    expect(restarted.blocks).toEqual(level.blocks);
    expect(restarted.moves).toBe(0);
    expect(restarted.history).toEqual([]);
  });
});
