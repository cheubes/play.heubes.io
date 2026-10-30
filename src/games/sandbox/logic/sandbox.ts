import type { LevelStatus } from '../../shell/types';

export interface SandboxLevel {
  id: string;
  target: number;
}

export interface SandboxState {
  target: number;
  presses: number;
  undos: number;
}

export type LevelOutcome = 'completed' | 'perfect';

export interface SandboxSave {
  outcomes: Record<string, LevelOutcome>;
}

export const LEVELS: readonly SandboxLevel[] = [
  { id: 'level-1', target: 1 },
  { id: 'level-2', target: 2 },
  { id: 'level-3', target: 3 },
];

export function createState(target: number): SandboxState {
  return { target, presses: 0, undos: 0 };
}

export function isComplete(state: SandboxState): boolean {
  return state.presses >= state.target;
}

export function canUndo(state: SandboxState): boolean {
  return state.presses > 0 && !isComplete(state);
}

export function press(state: SandboxState): SandboxState {
  return isComplete(state) ? state : { ...state, presses: state.presses + 1 };
}

export function undo(state: SandboxState): SandboxState {
  return canUndo(state) ? { ...state, presses: state.presses - 1, undos: state.undos + 1 } : state;
}

export function getOutcome(state: SandboxState): LevelOutcome {
  return state.undos === 0 ? 'perfect' : 'completed';
}

export function parseSave(value: unknown): SandboxSave {
  if (typeof value !== 'object' || value === null || !('outcomes' in value) || typeof value.outcomes !== 'object' || value.outcomes === null) {
    return { outcomes: {} };
  }
  const outcomes: Record<string, LevelOutcome> = {};
  for (const [id, outcome] of Object.entries(value.outcomes)) {
    if (outcome === 'completed' || outcome === 'perfect') {
      outcomes[id] = outcome;
    }
  }
  return { outcomes };
}

export function recordOutcome(save: SandboxSave, levelId: string, outcome: LevelOutcome): SandboxSave {
  const best = save.outcomes[levelId] === 'perfect' ? 'perfect' : outcome;
  return { outcomes: { ...save.outcomes, [levelId]: best } };
}

export function getLevelStatuses(save: SandboxSave): LevelStatus[] {
  return LEVELS.map((level, index) => {
    const outcome = save.outcomes[level.id];
    if (outcome) {
      return outcome;
    }
    const previous = LEVELS[index - 1];
    return previous === undefined || save.outcomes[previous.id] ? 'available' : 'locked';
  });
}
