import type { Translate } from './i18n';
import type { GameStorage, HudStat, LevelEntry, LevelResult, LevelStatus } from './types';

export interface ProgressSave {
  best: Record<string, number>;
}

interface LevelSummary {
  id: string;
  par: number;
}

export function parseSave(value: unknown): ProgressSave {
  if (typeof value !== 'object' || value === null || !('best' in value) || typeof value.best !== 'object' || value.best === null) {
    return { best: {} };
  }
  const best: Record<string, number> = {};
  for (const [id, moves] of Object.entries(value.best)) {
    if (typeof moves === 'number' && Number.isInteger(moves) && moves > 0) {
      best[id] = moves;
    }
  }
  return { best };
}

export function recordResult(save: ProgressSave, levelId: string, moves: number): ProgressSave {
  const previous = save.best[levelId];
  const best = previous === undefined ? moves : Math.min(previous, moves);
  return { best: { ...save.best, [levelId]: best } };
}

export function getLevelStatuses(levels: readonly LevelSummary[], save: ProgressSave): LevelStatus[] {
  return levels.map((level, index) => {
    const best = save.best[level.id];
    if (best !== undefined) {
      return best === level.par ? 'perfect' : 'completed';
    }
    const previous = levels[index - 1];
    return previous === undefined || save.best[previous.id] !== undefined ? 'available' : 'locked';
  });
}

export function getLevelEntries(levels: readonly LevelSummary[], save: ProgressSave): LevelEntry[] {
  const statuses = getLevelStatuses(levels, save);
  return levels.map((level, index) => ({ id: level.id, label: String(index + 1), status: statuses[index] ?? 'locked' }));
}

// Returns the best result of the level, this one included.
export function saveResult(storage: GameStorage, levelId: string, moves: number): number {
  const save = recordResult(parseSave(storage.read()), levelId, moves);
  storage.write(save);
  return save.best[levelId] ?? moves;
}

// The texts come from the game's dictionary, under the stats.* and result.* keys.
export function getMoveStats(t: Translate, moves: number, par: number): HudStat[] {
  return [
    { id: 'moves', label: t('stats.moves'), value: String(moves) },
    { id: 'par', label: t('stats.par'), value: String(par) },
  ];
}

export function getLevelResult(t: Translate, moves: number, par: number, best: number): LevelResult {
  const isPerfect = moves === par;
  return {
    status: isPerfect ? 'perfect' : 'completed',
    stats: [
      { label: t('stats.moves'), value: String(moves) },
      { label: t('stats.par'), value: String(par) },
      { label: t('stats.best'), value: String(best) },
    ],
    message: isPerfect ? t('result.perfect') : t('result.solved', { moves, par }),
  };
}
