import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { canFold, createState, fold } from './fold';
import { parseLevel } from './level-parser';
import { isMoving, visibleFace } from './sheet';
import { countSequences, solve } from './solver';
import type { Fold, FoldState, Level, LevelSource } from './types';

// Difficulty criteria of "Points tranchés à l'implémentation" (technical-specifications.md).
const INTRODUCTIONS = [0, 5, 10, 15];
const INTRODUCTION_MAX_PAR = 2;
const SERIES_MIN_PAR = 3;
const SERIES_MAX_ODDS = [0.5, 0.2, 0.2, 0.2];
const MIN_TOP_LAYERS = 3;
const FIRST_SERIES_MAX_INKS = 2;
const MANY_INKS_LEVELS = [7, 8, 9, 17, 18, 19];
const MANY_INKS = 3;
const COMBINED_LEVELS = [17, 18, 19];

function play(level: Level, folds: Fold[]): FoldState[] {
  const states = [createState(level)];
  for (const move of folds) {
    states.push(fold(level, states.at(-1)!, move));
  }
  return states;
}

function solution(source: LevelSource): Fold[] {
  const result = solve(parseLevel(source));
  if (result.status !== 'solved') {
    throw new Error(`Level ${source.id}: unsolvable`);
  }
  return result.solution;
}

function inkCount(source: LevelSource): number {
  return new Set(source.sheet.join('').replace(/[._]/g, '')).size;
}

function allFolds(state: FoldState): Fold[] {
  const { rows, cols } = state.sheet;
  return (['before', 'after'] as const).flatMap((moving) => [
    ...Array.from({ length: cols - 1 }, (_, index): Fold => ({ axis: 'vertical', line: index + 1, moving })),
    ...Array.from({ length: rows - 1 }, (_, index): Fold => ({ axis: 'horizontal', line: index + 1, moving })),
  ]);
}

function blocks(state: FoldState, pin: number, move: Fold): boolean {
  const { rows, cols, stacks } = state.sheet;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isMoving(move, row, col) && stacks[row * cols + col]?.includes(pin)) {
        return true;
      }
    }
  }
  return false;
}

const SERIES = LEVELS.map((source, index) => ({ source, index, number: index + 1, series: Math.floor(index / 5) }));

describe('difficulty', () => {
  it('there are four series of five levels', () => {
    expect(LEVELS).toHaveLength(20);
  });

  it('a level that introduces a mechanic has a par of at most 2', () => {
    for (const index of INTRODUCTIONS) {
      expect(LEVELS[index]!.par).toBeLessThanOrEqual(INTRODUCTION_MAX_PAR);
    }
  });

  it('the first series has a par of 1 or 2, and the other levels of the next series a par of at least 3', () => {
    for (const { source, index, series } of SERIES) {
      if (series === 0) {
        expect(source.par).toBeLessThanOrEqual(2);
      } else if (!INTRODUCTIONS.includes(index)) {
        expect(source.par).toBeGreaterThanOrEqual(SERIES_MIN_PAR);
      }
    }
  });

  it('the par does not decrease from one level to the next within a series', () => {
    for (const { source, index } of SERIES) {
      if (!INTRODUCTIONS.includes(index)) {
        expect(source.par).toBeGreaterThanOrEqual(LEVELS[index - 1]!.par);
      }
    }
  });

  it.each(SERIES.slice(1))('level $number ($source.id): few fold sequences to the goal size solve it', ({ source, series }) => {
    const { total, solving } = countSequences(parseLevel(source), source.par);
    expect(solving / total).toBeLessThanOrEqual(SERIES_MAX_ODDS[series]!);
  });

  it.each(SERIES.filter(({ series }) => series > 0))(
    'level $number ($source.id): the solution lays at least three layers on a position',
    ({ source }) => {
      const final = play(parseLevel(source), solution(source)).at(-1)!;
      expect(Math.max(...final.sheet.stacks.map((stack) => stack.length))).toBeGreaterThanOrEqual(MIN_TOP_LAYERS);
    },
  );

  it.each(SERIES.filter(({ series }) => series === 2))(
    'level $number ($source.id): a cut-out shows a layer below it in the solution',
    ({ source }) => {
      const level = parseLevel(source);
      const filled = parseLevel({ ...source, sheet: source.sheet.map((line) => line.replaceAll('_', '.')) });
      const face = visibleFace(filled, play(filled, solution(source)).at(-1)!.sheet);
      expect(face).toHaveLength(level.goal.length);
      expect(face[0]).toHaveLength(level.goal[0]!.length);
      const revealed = face.some((line, row) =>
        line.some((cell, col) => level.goal[row]![col] !== 'empty' && cell !== level.goal[row]![col]),
      );
      expect(revealed).toBe(true);
    },
  );

  it.each(SERIES.filter(({ series }) => series === 3))(
    'level $number ($source.id): without its pins, the level is solved in fewer folds',
    ({ source }) => {
      expect(solution({ ...source, pins: [] }).length).toBeLessThan(source.par);
    },
  );

  it.each(SERIES.filter(({ series }) => series === 3))(
    'level $number ($source.id): each pin blocks a fold in a state of the solution',
    ({ source }) => {
      const level = parseLevel(source);
      const states = play(level, solution(source));
      for (const pin of level.pins) {
        const blocking = states.some((state) =>
          allFolds(state).some((move) => canFold(level, state.sheet, move) === 'pinned' && blocks(state, pin, move)),
        );
        expect(blocking).toBe(true);
      }
    },
  );

  it('levels 18 to 20 combine cut-outs and pins', () => {
    for (const index of COMBINED_LEVELS) {
      expect(LEVELS[index]!.sheet.join('')).toContain('_');
      expect(LEVELS[index]!.pins?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('the first series uses at most two inks, levels 8 to 10 and 18 to 20 at least three', () => {
    for (const { source } of SERIES.filter(({ series }) => series === 0)) {
      expect(inkCount(source)).toBeLessThanOrEqual(FIRST_SERIES_MAX_INKS);
    }
    for (const index of MANY_INKS_LEVELS) {
      expect(inkCount(LEVELS[index]!)).toBeGreaterThanOrEqual(MANY_INKS);
    }
  });
});
