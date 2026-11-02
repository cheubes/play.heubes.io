import { describe, expect, it } from 'vitest';
import { createGameTranslator } from '../../shell/i18n';
import type { GameStorage } from '../../shell/types';
import { formatTime, getLevelEntries, getLevelResult, getLevelStatuses, parseSave, recordResult, saveResult } from './progress';

const LEVELS = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

const t = createGameTranslator(
  {
    stats: { time: 'Time', cogs: 'Cogs', falls: 'Falls', best: 'Best' },
    result: { perfect: 'Perfect!', finished: 'Finished in {time}.' },
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

describe('level statuses', () => {
  it('AC-11: without a save, level 1 is available and the next ones are locked', () => {
    expect(getLevelStatuses(LEVELS, parseSave(undefined))).toEqual(['available', 'locked', 'locked']);
  });

  it('AC-11: completing level n makes level n + 1 available', () => {
    const save = recordResult(parseSave(undefined), 'first', { ticks: 600, cogs: 1, falls: 0 });
    expect(getLevelStatuses(LEVELS, save)).toEqual(['completed', 'available', 'locked']);
  });

  it('AC-11: a level completed once with both cogs is perfect, even after a later run without them', () => {
    let save = recordResult(parseSave(undefined), 'first', { ticks: 900, cogs: 2, falls: 3 });
    save = recordResult(save, 'first', { ticks: 500, cogs: 0, falls: 0 });
    expect(getLevelStatuses(LEVELS, save)[0]).toBe('perfect');
  });

  it('numbers the levels from 1 in the level selector', () => {
    expect(getLevelEntries(LEVELS, parseSave(undefined)).map((entry) => entry.label)).toEqual(['1', '2', '3']);
  });
});

describe('record', () => {
  it('AC-11: the record is the shortest time, with or without the cogs', () => {
    const storage = createMemoryStorage();
    expect(saveResult(storage, 'first', { ticks: 900, cogs: 2, falls: 0 })).toBe(900);
    expect(saveResult(storage, 'first', { ticks: 700, cogs: 0, falls: 4 })).toBe(700);
    expect(saveResult(storage, 'first', { ticks: 800, cogs: 2, falls: 0 })).toBe(700);
    expect(parseSave(storage.read()).levels.first).toEqual({ bestTicks: 700, allCogs: true });
  });
});

describe('parseSave', () => {
  it('drops invalid entries and keeps valid ones', () => {
    const save = parseSave({
      levels: { first: { bestTicks: 600, allCogs: false }, second: { bestTicks: -1, allCogs: true }, third: 'done' },
    });
    expect(save).toEqual({ levels: { first: { bestTicks: 600, allCogs: false } } });
  });

  it('returns an empty save for data of another shape', () => {
    expect(parseSave({ best: { first: 3 } })).toEqual({ levels: {} });
    expect(parseSave(null)).toEqual({ levels: {} });
  });

  it('ignores entries of levels that no longer exist', () => {
    const save = parseSave({ levels: { removed: { bestTicks: 600, allCogs: true } } });
    expect(getLevelStatuses(LEVELS, save)).toEqual(['available', 'locked', 'locked']);
  });
});

describe('level result', () => {
  it('formats the time as m:ss.d', () => {
    expect(formatTime(0)).toBe('0:00.0');
    expect(formatTime(3725)).toBe('1:02.0');
    expect(formatTime(65)).toBe('0:01.0');
  });

  it('shows the time, the cogs, the falls and the best time, and the perfect message with both cogs', () => {
    expect(getLevelResult(t, { ticks: 750, cogs: 2, falls: 1 }, 600)).toEqual({
      status: 'perfect',
      stats: [
        { label: 'Time', value: '0:12.5' },
        { label: 'Cogs', value: '2/2' },
        { label: 'Falls', value: '1' },
        { label: 'Best', value: '0:10.0' },
      ],
      message: 'Perfect!',
    });
  });

  it('invites to find both cogs without them', () => {
    expect(getLevelResult(t, { ticks: 750, cogs: 1, falls: 0 }, 750)).toMatchObject({
      status: 'completed',
      message: 'Finished in 0:12.5.',
    });
  });
});
