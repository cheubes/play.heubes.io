import { describe, expect, it } from 'vitest';
import { createGameTranslator } from './i18n';
import { getLevelEntries, getLevelResult, getMoveStats, parseSave, recordResult, saveResult } from './progress';
import type { GameStorage } from './types';

const LEVELS = [
  { id: 'first', par: 2 },
  { id: 'second', par: 3 },
];

const t = createGameTranslator(
  {
    stats: { moves: 'Moves', par: 'Par', best: 'Best' },
    result: { perfect: 'Perfect!', solved: 'Solved in {moves}, par {par}.' },
  },
  'en',
);

function createMemoryStorage(initial?: unknown): GameStorage {
  let data = initial;
  return {
    read: <T>() => data as T | undefined,
    write: (next) => {
      data = next;
    },
  };
}

describe('getLevelEntries', () => {
  it('numbers the levels from 1 and gives each its status', () => {
    const save = recordResult(parseSave(undefined), 'first', 4);
    expect(getLevelEntries(LEVELS, save)).toEqual([
      { id: 'first', label: '1', status: 'completed' },
      { id: 'second', label: '2', status: 'available' },
    ]);
  });
});

describe('saveResult', () => {
  it('writes the result and returns the best one, this one included', () => {
    const storage = createMemoryStorage({ best: { first: 3 } });
    expect(saveResult(storage, 'first', 5)).toBe(3);
    expect(saveResult(storage, 'first', 2)).toBe(2);
    expect(parseSave(storage.read()).best.first).toBe(2);
  });
});

describe('getMoveStats', () => {
  it('shows the moves and the par of the level', () => {
    expect(getMoveStats(t, 4, 3)).toEqual([
      { id: 'moves', label: 'Moves', value: '4' },
      { id: 'par', label: 'Par', value: '3' },
    ]);
  });
});

describe('getLevelResult', () => {
  it('is perfect when the level is solved in its par', () => {
    expect(getLevelResult(t, 3, 3, 3)).toEqual({
      status: 'perfect',
      stats: [
        { label: 'Moves', value: '3' },
        { label: 'Par', value: '3' },
        { label: 'Best', value: '3' },
      ],
      message: 'Perfect!',
    });
  });

  it('invites to reach the par otherwise', () => {
    const result = getLevelResult(t, 5, 3, 4);
    expect(result.status).toBe('completed');
    expect(result.stats[2]).toEqual({ label: 'Best', value: '4' });
    expect(result.message).toBe('Solved in 5, par 3.');
  });
});
