import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { MAX_SOLVER_TICKS, solveRoom } from './solver';
import type { RoomSource } from './types';

const TILES = '.#^v-slDdEXc';

function count(room: RoomSource, char: string): number {
  return room.grid.join('').split(char).length - 1;
}

describe('levels', () => {
  it('AC-12: level ids are unique and in kebab-case', () => {
    const ids = LEVELS.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('AC-12: each level has exactly two rooms', () => {
    for (const source of LEVELS) {
      expect(source.rooms).toHaveLength(2);
    }
  });

  describe.each(
    LEVELS.flatMap((source, index) =>
      source.rooms.map((room, roomIndex) => ({ source, room, roomIndex: roomIndex as 0 | 1, number: index + 1 })),
    ),
  )('level $number ($source.id), room index $roomIndex', ({ source, room, roomIndex }) => {
    it('AC-12: the grid has 12 rows of 12 characters from the tile alphabet', () => {
      expect(room.grid).toHaveLength(12);
      for (const line of room.grid) {
        expect(line).toHaveLength(12);
        expect([...line].every((char) => TILES.includes(char))).toBe(true);
      }
    });

    it('AC-12: there is exactly one entry, one exit and one cog', () => {
      expect(count(room, 'E')).toBe(1);
      expect(count(room, 'X')).toBe(1);
      expect(count(room, 'c')).toBe(1);
    });

    it('AC-12: the cell under the entry is a wall or a door closed at start', () => {
      const row = room.grid.findIndex((line) => line.includes('E'));
      const col = room.grid[row]?.indexOf('E') ?? -1;
      expect(['#', 'D']).toContain(room.grid[row + 1]?.[col]);
    });

    it('AC-12: a room has levers if and only if it has doors', () => {
      expect(count(room, 'l') > 0).toBe(count(room, 'D') + count(room, 'd') > 0);
    });

    it('AC-12: moving platforms go back and forth in line, on empty cells of the grid', () => {
      for (const mover of room.movers ?? []) {
        const [fromCol, fromRow] = mover.from;
        const [toCol, toRow] = mover.to;
        expect(fromCol === toCol || fromRow === toRow).toBe(true);
        expect(mover.length).toBeGreaterThanOrEqual(1);
        expect(mover.length).toBeLessThanOrEqual(3);
        expect(mover.period).toBeGreaterThanOrEqual(60);
        for (let row = Math.min(fromRow, toRow); row <= Math.max(fromRow, toRow); row++) {
          for (let col = Math.min(fromCol, toCol); col <= Math.max(fromCol, toCol) + mover.length - 1; col++) {
            expect(room.grid[row]?.[col]).toBe('.');
          }
        }
      }
    });

    it(`AC-12: the solver reaches the exit, and the exit with the cog, within ${MAX_SOLVER_TICKS} steps`, () => {
      const result = solveRoom(parseLevel(source), roomIndex);
      expect(result.exit).toBeDefined();
      expect(result.exitWithCog).toBeDefined();
    });
  });
});
