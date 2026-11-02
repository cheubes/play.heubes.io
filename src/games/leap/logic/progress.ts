import type { Translate } from '../../shell/i18n';
import type { GameStorage, LevelEntry, LevelResult, LevelStatus } from '../../shell/types';
import type { LeapSave, LevelRecord } from './types';

const TICKS_PER_TENTH = 6;

export interface RunResult {
  ticks: number;
  cogs: number;
  falls: number;
}

export function formatTime(ticks: number): string {
  const tenths = Math.floor(ticks / TICKS_PER_TENTH);
  const seconds = Math.floor(tenths / 10);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${tenths % 10}`;
}

function parseRecord(value: unknown): LevelRecord | undefined {
  if (typeof value !== 'object' || value === null || !('bestTicks' in value) || !('allCogs' in value)) {
    return undefined;
  }
  const { bestTicks, allCogs } = value;
  if (typeof bestTicks !== 'number' || !Number.isInteger(bestTicks) || bestTicks <= 0 || typeof allCogs !== 'boolean') {
    return undefined;
  }
  return { bestTicks, allCogs };
}

export function parseSave(value: unknown): LeapSave {
  if (typeof value !== 'object' || value === null || !('levels' in value) || typeof value.levels !== 'object' || value.levels === null) {
    return { levels: {} };
  }
  const levels: Record<string, LevelRecord> = {};
  for (const [id, entry] of Object.entries(value.levels)) {
    const record = parseRecord(entry);
    if (record) {
      levels[id] = record;
    }
  }
  return { levels };
}

export function recordResult(save: LeapSave, levelId: string, result: RunResult): LeapSave {
  const previous = save.levels[levelId];
  const record: LevelRecord = {
    bestTicks: previous === undefined ? result.ticks : Math.min(previous.bestTicks, result.ticks),
    allCogs: (previous?.allCogs ?? false) || result.cogs === 2,
  };
  return { levels: { ...save.levels, [levelId]: record } };
}

export function getLevelStatuses(levels: readonly { id: string }[], save: LeapSave): LevelStatus[] {
  return levels.map((level, index) => {
    const record = save.levels[level.id];
    if (record !== undefined) {
      return record.allCogs ? 'perfect' : 'completed';
    }
    const previous = levels[index - 1];
    return previous === undefined || save.levels[previous.id] !== undefined ? 'available' : 'locked';
  });
}

export function getLevelEntries(levels: readonly { id: string }[], save: LeapSave): LevelEntry[] {
  const statuses = getLevelStatuses(levels, save);
  return levels.map((level, index) => ({ id: level.id, label: String(index + 1), status: statuses[index] ?? 'locked' }));
}

// Returns the best time of the level, in steps, this run included.
export function saveResult(storage: GameStorage, levelId: string, result: RunResult): number {
  const save = recordResult(parseSave(storage.read()), levelId, result);
  storage.write(save);
  return save.levels[levelId]?.bestTicks ?? result.ticks;
}

export function getLevelResult(t: Translate, result: RunResult, bestTicks: number): LevelResult {
  const isPerfect = result.cogs === 2;
  const time = formatTime(result.ticks);
  return {
    status: isPerfect ? 'perfect' : 'completed',
    stats: [
      { label: t('stats.time'), value: time },
      { label: t('stats.cogs'), value: `${result.cogs}/2` },
      { label: t('stats.falls'), value: String(result.falls) },
      { label: t('stats.best'), value: formatTime(bestTicks) },
    ],
    message: isPerfect ? t('result.perfect') : t('result.finished', { time }),
  };
}
