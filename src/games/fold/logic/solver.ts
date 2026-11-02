import { canFold, createState, isSolved } from './fold';
import { applyFold } from './sheet';
import type { Fold, Level, Sheet } from './types';

// The par of a level is at most 6: deeper searches would only explore unsolvable levels.
export const MAX_DEPTH = 6;

export type SolverResult = { status: 'solved'; solution: Fold[] } | { status: 'unsolvable' };

interface Node {
  sheet: Sheet;
  folds: Fold[];
}

export interface SequenceCounts {
  total: number;
  solving: number;
}

function possibleFolds(sheet: Sheet): Fold[] {
  const folds: Fold[] = [];
  for (const moving of ['before', 'after'] as const) {
    for (let line = 1; line < sheet.cols; line++) {
      folds.push({ axis: 'vertical', line, moving });
    }
    for (let line = 1; line < sheet.rows; line++) {
      folds.push({ axis: 'horizontal', line, moving });
    }
  }
  return folds;
}

function serialize(sheet: Sheet): string {
  return `${sheet.rows}x${sheet.cols}:${sheet.stacks.map((stack) => stack.join(',')).join('|')}`;
}

function solved(level: Level, sheet: Sheet): boolean {
  return isSolved(level, { sheet, moves: 0, history: [] });
}

// Folds that keep the sheet at least as large as the goal: a dimension of the sheet can only decrease.
function nextSheets(level: Level, sheet: Sheet): { fold: Fold; sheet: Sheet }[] {
  const goalRows = level.goal.length;
  const goalCols = level.goal[0]?.length ?? 0;
  return possibleFolds(sheet)
    .filter((fold) => canFold(level, sheet, fold) === 'ok')
    .map((fold) => ({ fold, sheet: applyFold(sheet, fold) }))
    .filter((next) => next.sheet.rows >= goalRows && next.sheet.cols >= goalCols);
}

// Breadth-first search: the first solved sheet is found at the minimal number of folds.
export function solve(level: Level): SolverResult {
  const start = createState(level).sheet;
  const seen = new Set([serialize(start)]);
  let layer: Node[] = [{ sheet: start, folds: [] }];
  for (let depth = 0; depth <= MAX_DEPTH && layer.length > 0; depth++) {
    const next: Node[] = [];
    for (const node of layer) {
      if (solved(level, node.sheet)) {
        return { status: 'solved', solution: node.folds };
      }
      if (depth === MAX_DEPTH) {
        continue;
      }
      for (const { fold, sheet } of nextSheets(level, node.sheet)) {
        const key = serialize(sheet);
        if (!seen.has(key)) {
          seen.add(key);
          next.push({ sheet, folds: [...node.folds, fold] });
        }
      }
    }
    layer = next;
  }
  return { status: 'unsolvable' };
}

// Counts the sequences of at most maxDepth folds that end with a sheet of the goal's size, and those
// among them that solve the level. Each fold reduces the area of the sheet, so a sheet is only
// reached at one depth, and sequences can be counted depth by depth.
export function countSequences(level: Level, maxDepth: number): SequenceCounts {
  const goalRows = level.goal.length;
  const goalCols = level.goal[0]?.length ?? 0;
  const counts = { total: 0, solving: 0 };
  const start = createState(level).sheet;
  let layer = new Map([[serialize(start), { sheet: start, paths: 1 }]]);
  for (let depth = 1; depth <= maxDepth && layer.size > 0; depth++) {
    const next = new Map<string, { sheet: Sheet; paths: number }>();
    for (const { sheet, paths } of layer.values()) {
      for (const { sheet: folded } of nextSheets(level, sheet)) {
        const key = serialize(folded);
        const entry = next.get(key);
        if (entry === undefined) {
          next.set(key, { sheet: folded, paths });
        } else {
          entry.paths += paths;
        }
      }
    }
    for (const { sheet, paths } of next.values()) {
      if (sheet.rows === goalRows && sheet.cols === goalCols) {
        counts.total += paths;
        if (solved(level, sheet)) {
          counts.solving += paths;
        }
      }
    }
    layer = next;
  }
  return counts;
}
