import { isSolved } from './prism';
import type { Level } from './types';

export type SolverResult = { status: 'solved'; solution: string[] } | { status: 'unsolvable' };

function* subsets(ids: string[], size: number, start = 0): Generator<string[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let index = start; index <= ids.length - size; index++) {
    for (const rest of subsets(ids, size - 1, index + 1)) {
      yield [ids[index]!, ...rest];
    }
  }
}

// Toggling an element twice cancels out, so the minimal number of moves is the size of the
// smallest set of toggled elements that solves the level: subsets are tried by increasing size.
export function solve(level: Level): SolverResult {
  const toggleableIds = level.elements
    .filter((element) => (element.type === 'mirror' || element.type === 'prism') && !element.fixed)
    .map((element) => element.id);
  for (let size = 0; size <= toggleableIds.length; size++) {
    for (const subset of subsets(toggleableIds, size)) {
      if (isSolved(level, { toggled: new Set(subset), moves: 0, history: [] })) {
        return { status: 'solved', solution: subset };
      }
    }
  }
  return { status: 'unsolvable' };
}
