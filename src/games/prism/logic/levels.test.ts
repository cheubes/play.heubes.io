import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { createState, isSolved } from './prism';
import { solve } from './solver';

const COLORS = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'white'];
const DIRECTIONS = ['up', 'down', 'left', 'right'];

describe('levels', () => {
  it('AC-12: level ids are unique and in kebab-case', () => {
    const ids = LEVELS.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  describe.each(LEVELS.map((source, index) => ({ source, number: index + 1 })))(
    'level $number ($source.id)',
    ({ source }) => {
      it('AC-12: the board is between 5 and 8 cells on each side', () => {
        expect(source.rows).toBeGreaterThanOrEqual(5);
        expect(source.rows).toBeLessThanOrEqual(8);
        expect(source.cols).toBeGreaterThanOrEqual(5);
        expect(source.cols).toBeLessThanOrEqual(8);
      });

      it('AC-12: every element is on the board, with at most one element per cell', () => {
        const cells = source.elements.map(({ at: [row, col] }) => {
          expect(row).toBeGreaterThanOrEqual(0);
          expect(row).toBeLessThan(source.rows);
          expect(col).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThan(source.cols);
          return `${row},${col}`;
        });
        expect(new Set(cells).size).toBe(cells.length);
      });

      it('AC-12: there is at least one source and one target, and at most 14 toggleable elements', () => {
        const types = source.elements.map((element) => element.type);
        expect(types).toContain('source');
        expect(types).toContain('target');
        const toggleables = source.elements.filter(
          (element) => (element.type === 'mirror' || element.type === 'prism') && !element.fixed,
        );
        expect(toggleables.length).toBeLessThanOrEqual(14);
      });

      it('AC-12: colors and directions are valid', () => {
        for (const element of source.elements) {
          if ('color' in element) {
            expect(COLORS).toContain(element.color);
          }
          if ('direction' in element) {
            expect(DIRECTIONS).toContain(element.direction);
          }
        }
      });

      it('AC-12: the initial state is not solved', () => {
        const level = parseLevel(source);
        expect(isSolved(level, createState(level))).toBe(false);
      });

      it('AC-12: the solver finds a solution, whose minimal number of toggles is par', () => {
        expect(solve(parseLevel(source))).toMatchObject({ status: 'solved', solution: { length: source.par } });
      });
    },
  );
});
