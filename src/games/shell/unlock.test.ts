import { describe, expect, it } from 'vitest';
import { getUnlockEntries } from './unlock';

const LEVELS = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

function statuses(records: Record<string, { perfect: boolean }>) {
  return getUnlockEntries(LEVELS, records, (record) => record.perfect).map((entry) => entry.status);
}

describe('getUnlockEntries', () => {
  it('makes level 1 available and locks the next ones without any record', () => {
    expect(statuses({})).toEqual(['available', 'locked', 'locked']);
  });

  it('makes the level after a recorded one available', () => {
    expect(statuses({ first: { perfect: false } })).toEqual(['completed', 'available', 'locked']);
  });

  it('marks a recorded level perfect according to the rule of the game', () => {
    expect(statuses({ first: { perfect: true }, second: { perfect: false } })).toEqual(['perfect', 'completed', 'available']);
  });

  it('keeps a recorded level after a missing one, and unlocks the next one', () => {
    expect(statuses({ second: { perfect: false } })).toEqual(['available', 'completed', 'available']);
  });

  it('ignores records of levels that no longer exist', () => {
    expect(statuses({ removed: { perfect: true } })).toEqual(['available', 'locked', 'locked']);
  });

  it('numbers the levels from 1', () => {
    expect(getUnlockEntries(LEVELS, {}, () => false).map((entry) => entry.label)).toEqual(['1', '2', '3']);
  });
});
