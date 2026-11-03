import type { Translate } from '../../shell/i18n';
import type { GameStorage, LevelEntry, LevelResult } from '../../shell/types';
import { getUnlockEntries } from '../../shell/unlock';
import { TICK_MS } from './types';
import type { DeltaSave, LevelRecord } from './types';

export interface RunResult {
  outcome: 'won' | 'lost';
  ticks: number;
  basinsLost: number;
  mostHeld: number;
  basinCount: number;
}

export function formatTime(ticks: number): string {
  const seconds = Math.floor((ticks * TICK_MS) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function parseRecord(value: unknown): LevelRecord | undefined {
  if (typeof value !== 'object' || value === null || !('bestTicks' in value) || !('flawless' in value)) {
    return undefined;
  }
  const { bestTicks, flawless } = value;
  if (typeof bestTicks !== 'number' || !Number.isInteger(bestTicks) || bestTicks <= 0 || typeof flawless !== 'boolean') {
    return undefined;
  }
  return { bestTicks, flawless };
}

export function parseSave(value: unknown): DeltaSave {
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

// A defeat leaves the save as it is.
export function recordResult(save: DeltaSave, levelId: string, result: RunResult): DeltaSave {
  if (result.outcome === 'lost') {
    return save;
  }
  const previous = save.levels[levelId];
  const record: LevelRecord = {
    bestTicks: previous === undefined ? result.ticks : Math.min(previous.bestTicks, result.ticks),
    flawless: (previous?.flawless ?? false) || result.basinsLost === 0,
  };
  return { levels: { ...save.levels, [levelId]: record } };
}

export function getLevelEntries(levels: readonly { id: string }[], save: DeltaSave): LevelEntry[] {
  return getUnlockEntries(levels, save.levels, (record) => record.flawless);
}

// Returns the best winning time of the level, in steps, this run included: undefined if it was never won.
export function saveResult(storage: GameStorage, levelId: string, result: RunResult): number | undefined {
  const save = recordResult(parseSave(storage.read()), levelId, result);
  if (result.outcome === 'won') {
    storage.write(save);
  }
  return save.levels[levelId]?.bestTicks;
}

export function getLevelResult(t: Translate, result: RunResult, bestTicks: number | undefined): LevelResult {
  const time = formatTime(result.ticks);
  if (result.outcome === 'lost') {
    return {
      status: 'failed',
      stats: [
        { label: t('stats.time'), value: time },
        { label: t('stats.most-held'), value: `${result.mostHeld}/${result.basinCount}` },
      ],
      message: t('result.failed'),
    };
  }
  const isPerfect = result.basinsLost === 0;
  return {
    status: isPerfect ? 'perfect' : 'completed',
    stats: [
      { label: t('stats.time'), value: time },
      { label: t('stats.lost'), value: String(result.basinsLost) },
      { label: t('stats.best'), value: formatTime(bestTicks ?? result.ticks) },
    ],
    message: isPerfect ? t('result.perfect') : t('result.won', { time }),
  };
}
