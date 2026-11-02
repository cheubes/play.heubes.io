import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { createState, isSolved } from './fold';
import { parseLevel } from './level-parser';
import { MAX_DEPTH, solve } from './solver';

const ALPHABET = /^[.viog_]+$/;

function edges(grid: string[]): string[] {
  return [grid[0] ?? '', grid.at(-1) ?? '', grid.map((line) => line[0]).join(''), grid.map((line) => line.at(-1)).join('')];
}

function paperCells(sheet: string[]): string[] {
  return sheet.flatMap((line, row) => [...line].flatMap((char, col) => (char === '_' ? [] : [`${row},${col}`])));
}

function connectedCells(sheet: string[], start: string): Set<string> {
  const paper = new Set(paperCells(sheet));
  const connected = new Set([start]);
  const queue = [start];
  for (let cell = queue.pop(); cell !== undefined; cell = queue.pop()) {
    const [row, col] = cell.split(',').map(Number) as [number, number];
    for (const neighbor of [`${row - 1},${col}`, `${row + 1},${col}`, `${row},${col - 1}`, `${row},${col + 1}`]) {
      if (paper.has(neighbor) && !connected.has(neighbor)) {
        connected.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return connected;
}

describe('levels', () => {
  it('AC-09: level ids are unique and in kebab-case', () => {
    const ids = LEVELS.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  describe.each(LEVELS.map((source, index) => ({ source, number: index + 1 })))(
    'level $number ($source.id)',
    ({ source }) => {
      it('AC-09: the sheet has 3 to 6 lines of 3 to 6 characters of the encoding alphabet', () => {
        expect(source.sheet.length).toBeGreaterThanOrEqual(3);
        expect(source.sheet.length).toBeLessThanOrEqual(6);
        const cols = source.sheet[0]?.length ?? 0;
        expect(cols).toBeGreaterThanOrEqual(3);
        expect(cols).toBeLessThanOrEqual(6);
        for (const line of source.sheet) {
          expect(line).toHaveLength(cols);
          expect(line).toMatch(ALPHABET);
        }
      });

      it('AC-09: the paper squares of the sheet are connected', () => {
        const paper = paperCells(source.sheet);
        expect(connectedCells(source.sheet, paper[0] ?? '').size).toBe(paper.length);
      });

      it('AC-09: the first and last lines and columns of the sheet each hold a paper square', () => {
        for (const edge of edges(source.sheet)) {
          expect(edge).toMatch(/[^_]/);
        }
      });

      it('AC-09: there are at most three pins, each on a paper square', () => {
        const pins = source.pins ?? [];
        expect(pins.length).toBeLessThanOrEqual(3);
        for (const [row, col] of pins) {
          expect(source.sheet[row]?.[col]).toMatch(/^[.viog]$/);
        }
      });

      it('AC-09: the goal has lines of the same length, of the encoding alphabet, and fits in the sheet', () => {
        const cols = source.goal[0]?.length ?? 0;
        for (const line of source.goal) {
          expect(line).toHaveLength(cols);
          expect(line).toMatch(ALPHABET);
        }
        expect(source.goal.length).toBeLessThanOrEqual(source.sheet.length);
        expect(cols).toBeLessThanOrEqual(source.sheet[0]?.length ?? 0);
      });

      it('AC-09: the first and last lines and columns of the goal each hold a non-empty position', () => {
        for (const edge of edges(source.goal)) {
          expect(edge).toMatch(/[^_]/);
        }
      });

      it('AC-09: the initial state is not solved', () => {
        const level = parseLevel(source);
        expect(isSolved(level, createState(level))).toBe(false);
      });

      it('AC-09: the solver finds a solution, whose number of folds is par, at most 6', () => {
        expect(source.par).toBeLessThanOrEqual(MAX_DEPTH);
        expect(solve(parseLevel(source))).toMatchObject({ status: 'solved', solution: { length: source.par } });
      });
    },
  );
});
