import type { LevelStatus } from '../../shell/types';
import type { TiltSave } from './types';

interface LevelSummary {
  id: string;
  par: number;
}

export function parseSave(value: unknown): TiltSave {
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

export function recordResult(save: TiltSave, levelId: string, moves: number): TiltSave {
  const previous = save.best[levelId];
  const best = previous === undefined ? moves : Math.min(previous, moves);
  return { best: { ...save.best, [levelId]: best } };
}

export function getLevelStatuses(levels: readonly LevelSummary[], save: TiltSave): LevelStatus[] {
  return levels.map((level, index) => {
    const best = save.best[level.id];
    if (best !== undefined) {
      return best === level.par ? 'perfect' : 'completed';
    }
    const previous = levels[index - 1];
    return previous === undefined || save.best[previous.id] !== undefined ? 'available' : 'locked';
  });
}
