import { computeBeams } from './beams';
import type { Level, Position, PrismState } from './types';

export function createState(_level: Level): PrismState {
  return { toggled: new Set(), moves: 0, history: [] };
}

export function toggle(level: Level, state: PrismState, position: Position): PrismState {
  const element = level.elements.find(
    (candidate) => candidate.position.row === position.row && candidate.position.col === position.col,
  );
  if (element === undefined || (element.type !== 'mirror' && element.type !== 'prism') || element.fixed) {
    return state;
  }
  const toggled = new Set(state.toggled);
  if (toggled.has(element.id)) {
    toggled.delete(element.id);
  } else {
    toggled.add(element.id);
  }
  return { toggled, moves: state.moves + 1, history: [...state.history, state.toggled] };
}

export function undo(state: PrismState): PrismState {
  const previous = state.history.at(-1);
  if (previous === undefined) {
    return state;
  }
  return { toggled: previous, moves: state.moves - 1, history: state.history.slice(0, -1) };
}

export function restart(level: Level): PrismState {
  return createState(level);
}

export function isSolved(level: Level, state: PrismState): boolean {
  return Object.values(computeBeams(level, state).lit).every((lit) => lit);
}
