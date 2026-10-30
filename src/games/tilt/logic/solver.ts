import { isSolved, tilt } from './tilt';
import type { Block, Direction, Level, TiltState } from './types';

const MAX_EXPLORED_POSITIONS = 500_000;

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export type SolverResult =
  | { status: 'solved'; solution: Direction[] }
  | { status: 'unsolvable'; explored: number }
  | { status: 'too-complex'; explored: number };

type Parents = Map<string, { parent: string; direction: Direction } | null>;

// Blocks of the same color (or two neutral blocks) are interchangeable: the key only records
// which cells each group occupies, not which block sits where.
function positionKey(level: Level, blocks: Block[]): string {
  const groups = new Map<string, number[]>();
  for (const block of blocks) {
    const group = block.kind === 'colored' ? block.color : 'neutral';
    const cells = groups.get(group) ?? [];
    cells.push(block.position.row * level.cols + block.position.col);
    groups.set(group, cells);
  }
  return [...groups.keys()]
    .sort()
    .map((group) => `${group}:${groups.get(group)!.sort((first, second) => first - second).join(',')}`)
    .join('|');
}

function tracePath(parents: Parents, key: string): Direction[] {
  const path: Direction[] = [];
  let link = parents.get(key);
  while (link) {
    path.push(link.direction);
    link = parents.get(link.parent);
  }
  return path.reverse();
}

export function solve(level: Level): SolverResult {
  const initial: TiltState = { blocks: level.blocks, moves: 0, history: [] };
  if (isSolved(level, initial)) {
    return { status: 'solved', solution: [] };
  }

  const initialKey = positionKey(level, initial.blocks);
  const parents: Parents = new Map([[initialKey, null]]);
  let frontier = [{ key: initialKey, blocks: initial.blocks }];

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const { key, blocks } of frontier) {
      for (const direction of DIRECTIONS) {
        const { state } = tilt(level, { blocks, moves: 0, history: [] }, direction);
        if (state.blocks === blocks) {
          continue;
        }
        const childKey = positionKey(level, state.blocks);
        if (parents.has(childKey)) {
          continue;
        }
        parents.set(childKey, { parent: key, direction });
        if (isSolved(level, state)) {
          return { status: 'solved', solution: tracePath(parents, childKey) };
        }
        if (parents.size > MAX_EXPLORED_POSITIONS) {
          return { status: 'too-complex', explored: parents.size };
        }
        next.push({ key: childKey, blocks: state.blocks });
      }
    }
    frontier = next;
  }
  return { status: 'unsolvable', explored: parents.size };
}
