import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { narrowestWindows, solveRoom } from './solver';
import type { LevelSource, RoomSource } from './types';

// Difficulty criteria of "Points tranchés à l'implémentation" (technical-specifications.md).
const SERIES_WINDOWS = [10, 8, 6, 5];
const INTRODUCTIONS = [0, 5, 10, 15];
const SERIES_MECHANICS: ((room: RoomSource) => RoomSource)[][] = [
  [],
  [(room) => without(room, '-'), (room) => without(room, 's')],
  [(room) => without(room, 'l')],
  [(room) => ({ ...room, movers: [] })],
];
const MIN_WINDOW = 4;
const INTRODUCTION_WINDOW = 15;
const MIN_EXIT_TICKS = 120;
const MAX_EXIT_TICKS = 1200;
const COG_DETOUR_TICKS = 120;

interface RoomMeasure {
  exitTicks: number;
  cogTicks: number;
  exitWindow: number;
  cogWindow: number;
}

function without(room: RoomSource, char: string): RoomSource {
  return { ...room, grid: room.grid.map((line) => line.replaceAll(char, '.')) };
}

function reachesExit(room: RoomSource): boolean {
  return solveRoom(parseLevel({ id: 'variant', rooms: [room, room] }), 0).exit !== undefined;
}

function measure(source: LevelSource, roomIndex: 0 | 1): RoomMeasure {
  const level = parseLevel(source);
  const { exit, exitWithCog } = solveRoom(level, roomIndex);
  const windows = narrowestWindows(level, roomIndex);
  return {
    exitTicks: exit?.ticks ?? Infinity,
    cogTicks: exitWithCog?.ticks ?? Infinity,
    exitWindow: windows.exit,
    cogWindow: windows.exitWithCog,
  };
}

const MEASURES = LEVELS.map((source) => [measure(source, 0), measure(source, 1)] as const);

function levelWindow(index: number): number {
  const [first, second] = MEASURES[index]!;
  return Math.min(first.exitWindow, second.exitWindow);
}

describe('difficulty', () => {
  it('there are four series of five levels', () => {
    expect(LEVELS).toHaveLength(20);
  });

  describe.each(LEVELS.map((source, index) => ({ source, index, number: index + 1 })))(
    'level $number ($source.id)',
    ({ source, index }) => {
      const series = Math.floor(index / 5);

      it(`the narrowest exit window is at least ${SERIES_WINDOWS[series]} steps, and not wider than the previous level of the series`, () => {
        expect(levelWindow(index)).toBeGreaterThanOrEqual(SERIES_WINDOWS[series]!);
        if (index % 5 > 0) {
          expect(levelWindow(index)).toBeLessThanOrEqual(levelWindow(index - 1));
        }
      });

      it.each([0, 1] as const)('room index %i: every window is at least 4 steps wide', (roomIndex) => {
        const { exitWindow, cogWindow } = MEASURES[index]![roomIndex];
        expect(exitWindow).toBeGreaterThanOrEqual(MIN_WINDOW);
        expect(cogWindow).toBeGreaterThanOrEqual(MIN_WINDOW);
      });

      it.each([0, 1] as const)('room index %i: a jump is needed, unless a spring is enough', (roomIndex) => {
        const { exitWindow } = MEASURES[index]![roomIndex];
        if (exitWindow === Infinity) {
          expect(source.rooms[roomIndex].grid.join('')).toContain('s');
        }
      });

      it.each([0, 1] as const)('room index %i: the fastest exit takes 2 to 20 seconds', (roomIndex) => {
        const { exitTicks } = MEASURES[index]![roomIndex];
        expect(exitTicks).toBeLessThanOrEqual(MAX_EXIT_TICKS);
        if (!(roomIndex === 0 && INTRODUCTIONS.includes(index))) {
          expect(exitTicks).toBeGreaterThanOrEqual(MIN_EXIT_TICKS);
        }
      });

      it.each([0, 1] as const)('room index %i: the cog asks for a detour or a riskier jump', (roomIndex) => {
        const { exitTicks, cogTicks, exitWindow, cogWindow } = MEASURES[index]![roomIndex];
        expect(cogTicks - exitTicks >= COG_DETOUR_TICKS || cogWindow < exitWindow).toBe(true);
      });

      if (series > 0) {
        it.each([0, 1] as const)('room index %i: the exit needs a mechanic of the series', (roomIndex) => {
          const room = source.rooms[roomIndex];
          expect(SERIES_MECHANICS[series]!.some((remove) => !reachesExit(remove(room)))).toBe(true);
        });
      }

      if (INTRODUCTIONS.includes(index)) {
        it(`the first room introduces its mechanic with an exit window of at least ${INTRODUCTION_WINDOW} steps`, () => {
          expect(MEASURES[index]![0].exitWindow).toBeGreaterThanOrEqual(INTRODUCTION_WINDOW);
        });
      }
    },
  );
});
