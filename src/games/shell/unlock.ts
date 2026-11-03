import type { LevelEntry, LevelStatus } from './types';

// Levels unlock one after the other: a level with a record unlocks the next one.
export function getUnlockEntries<R>(
  levels: readonly { id: string }[],
  records: Readonly<Record<string, R>>,
  isPerfect: (record: R) => boolean,
): LevelEntry[] {
  return levels.map((level, index) => {
    const record = records[level.id];
    const previous = levels[index - 1];
    let status: LevelStatus;
    if (record !== undefined) {
      status = isPerfect(record) ? 'perfect' : 'completed';
    } else {
      status = previous === undefined || records[previous.id] !== undefined ? 'available' : 'locked';
    }
    return { id: level.id, label: String(index + 1), status };
  });
}
