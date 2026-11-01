import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { solve } from './solver';
import { createState, isSolved } from './tilt';

const COLOR_CHARACTERS = ['a', 'b', 'c', 'd'];

function count(lines: string[], character: string): number {
  return lines.join('').split(character).length - 1;
}

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
      it('AC-12: terrain and pieces have the same dimensions, between 5 and 8, with rows of equal length', () => {
        const rows = source.terrain.length;
        const cols = source.terrain[0]?.length ?? 0;
        expect(rows).toBeGreaterThanOrEqual(5);
        expect(rows).toBeLessThanOrEqual(8);
        expect(cols).toBeGreaterThanOrEqual(5);
        expect(cols).toBeLessThanOrEqual(8);
        expect(source.pieces).toHaveLength(rows);
        for (const line of [...source.terrain, ...source.pieces]) {
          expect(line).toHaveLength(cols);
        }
      });

      it('AC-12: only legend characters are used', () => {
        for (const line of source.terrain) {
          expect(line).toMatch(/^[#.+abcd]+$/);
        }
        for (const line of source.pieces) {
          expect(line).toMatch(/^[.ABCDX]+$/);
        }
      });

      it('AC-12: no block stands on a wall', () => {
        source.pieces.forEach((line, row) => {
          [...line].forEach((piece, col) => {
            if (piece !== '.') {
              expect(source.terrain[row]?.[col]).not.toBe('#');
            }
          });
        });
      });

      it('AC-12: there is at least one colored block, and as many targets as blocks of each color', () => {
        expect(COLOR_CHARACTERS.some((target) => count(source.pieces, target.toUpperCase()) > 0)).toBe(true);
        for (const target of COLOR_CHARACTERS) {
          expect(count(source.terrain, target)).toBe(count(source.pieces, target.toUpperCase()));
        }
      });

      it('AC-12: the initial position is not solved', () => {
        const level = parseLevel(source);
        expect(isSolved(level, createState(level))).toBe(false);
      });

      it('AC-12: the solver finds a solution in exactly par moves', () => {
        expect(solve(parseLevel(source))).toMatchObject({ status: 'solved', solution: { length: source.par } });
      });
    },
  );
});
