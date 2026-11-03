import { describe, expect, it } from 'vitest';
import { createGameTranslator } from '../../shell/i18n';
import type { GameStorage } from '../../shell/types';
import { formatTime, getLevelEntries, getLevelResult, parseSave, recordResult, saveResult, type RunResult } from './progress';
import type { DeltaSave } from './types';

const LEVELS = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

const t = createGameTranslator(
  {
    stats: { time: 'Time', lost: 'Lost', best: 'Best', 'most-held': 'Most held' },
    result: {
      perfect: "Flawless! You didn't lose a single basin.",
      won: 'Won in {time}. Can you win without losing a basin?',
      failed: 'The rival took your last basin.',
    },
  },
  'en',
);

function win(ticks: number, basinsLost: number): RunResult {
  return { outcome: 'won', ticks, basinsLost, mostHeld: 5, basinCount: 7 };
}

function loss(ticks: number): RunResult {
  return { outcome: 'lost', ticks, basinsLost: 3, mostHeld: 4, basinCount: 7 };
}

function statuses(save: DeltaSave) {
  return getLevelEntries(LEVELS, save).map((entry) => entry.status);
}

function createMemoryStorage(initial?: unknown): GameStorage & { writes: number } {
  let data = initial;
  return {
    writes: 0,
    read: <T>() => data as T | undefined,
    write(next) {
      data = next;
      this.writes++;
    },
  };
}

describe('level statuses', () => {
  it('AC-10: without a save, level 1 is available and the next ones are locked', () => {
    expect(statuses(parseSave(undefined))).toEqual(['available', 'locked', 'locked']);
  });

  it('AC-10: winning level n makes level n + 1 available', () => {
    const save = recordResult(parseSave(undefined), 'first', win(1200, 2));
    expect(statuses(save)).toEqual(['completed', 'available', 'locked']);
  });

  it('AC-10: a defeat changes nothing', () => {
    const save = recordResult(parseSave(undefined), 'first', win(1200, 2));
    expect(recordResult(save, 'second', loss(900))).toBe(save);
    expect(recordResult(save, 'first', loss(900))).toBe(save);

    const storage = createMemoryStorage(save);
    saveResult(storage, 'second', loss(900));
    expect(storage.writes).toBe(0);
    expect(statuses(parseSave(storage.read()))).toEqual(['completed', 'available', 'locked']);
  });

  it('AC-10: a level won once without losing a basin is perfect, even after a later win with losses', () => {
    let save = recordResult(parseSave(undefined), 'first', win(1500, 0));
    save = recordResult(save, 'first', win(900, 4));
    expect(statuses(save)[0]).toBe('perfect');
  });
});

describe('record', () => {
  it('AC-10: the record is the shortest winning time, with or without losses', () => {
    const storage = createMemoryStorage();
    expect(saveResult(storage, 'first', win(1500, 0))).toBe(1500);
    expect(saveResult(storage, 'first', win(1100, 3))).toBe(1100);
    expect(saveResult(storage, 'first', win(1300, 0))).toBe(1100);
    expect(saveResult(storage, 'first', loss(400))).toBe(1100);
    expect(parseSave(storage.read()).levels.first).toEqual({ bestTicks: 1100, flawless: true });
  });

  it('has no record for a level never won', () => {
    expect(saveResult(createMemoryStorage(), 'first', loss(400))).toBeUndefined();
  });
});

describe('parseSave', () => {
  it('drops invalid entries and keeps valid ones', () => {
    const save = parseSave({
      levels: { first: { bestTicks: 600, flawless: false }, second: { bestTicks: 1.5, flawless: true }, third: 'won' },
    });
    expect(save).toEqual({ levels: { first: { bestTicks: 600, flawless: false } } });
  });

  it('returns an empty save for data of another shape', () => {
    expect(parseSave({ best: { first: 3 } })).toEqual({ levels: {} });
    expect(parseSave(null)).toEqual({ levels: {} });
  });

  it('ignores entries of levels that no longer exist', () => {
    expect(statuses(parseSave({ levels: { removed: { bestTicks: 600, flawless: true } } }))).toEqual(['available', 'locked', 'locked']);
  });
});

describe('level result', () => {
  it('formats the time as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:00');
    expect(formatTime(625)).toBe('1:02');
  });

  it('shows time, losses and record after a win, perfect without losses', () => {
    expect(getLevelResult(t, win(1250, 0), 1250)).toEqual({
      status: 'perfect',
      stats: [
        { label: 'Time', value: '2:05' },
        { label: 'Lost', value: '0' },
        { label: 'Best', value: '2:05' },
      ],
      message: "Flawless! You didn't lose a single basin.",
    });
    const result = getLevelResult(t, win(1300, 2), 1250);
    expect(result.status).toBe('completed');
    expect(result.stats.map((stat) => stat.value)).toEqual(['2:10', '2', '2:05']);
    expect(result.message).toBe('Won in 2:10. Can you win without losing a basin?');
  });

  it('shows time and most basins held after a defeat', () => {
    expect(getLevelResult(t, loss(830), undefined)).toEqual({
      status: 'failed',
      stats: [
        { label: 'Time', value: '1:23' },
        { label: 'Most held', value: '4/7' },
      ],
      message: 'The rival took your last basin.',
    });
  });
});
