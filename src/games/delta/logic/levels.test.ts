import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { parseLevel } from './level-parser';
import { createState, step } from './simulation';
import { decide, REFERENCE_STRATEGY } from './strategy';
import { BASIN_SIZES } from './types';
import type { DeltaState, Level, Point, StrategyParams } from './types';

const MAX_TICKS = 3000;
const MIN_DISTANCE = 2;
const CLEARANCE = 0.8;
const MIN_TIDE = 20;

function play(level: Level, player: StrategyParams | null): DeltaState {
  let state = createState(level);
  while (state.outcome === 'playing' && state.tick < MAX_TICKS) {
    if (player !== null && state.tick % player.reaction === 0) {
      state = decide(level, state, 'player', player);
    }
    state = step(level, state);
  }
  return state;
}

function cross(origin: Point, first: Point, second: Point): number {
  return (first.x - origin.x) * (second.y - origin.y) - (first.y - origin.y) * (second.x - origin.x);
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function isConnected(level: Level): boolean {
  const reached = new Set([0]);
  const frontier = [0];
  for (let index = frontier.pop(); index !== undefined; index = frontier.pop()) {
    for (const link of level.basins[index]!.links) {
      if (!reached.has(link.basin)) {
        reached.add(link.basin);
        frontier.push(link.basin);
      }
    }
  }
  return reached.size === level.basins.length;
}

describe('levels', () => {
  it('AC-11: level ids are unique and in kebab-case', () => {
    const ids = LEVELS.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  describe.each(LEVELS.map((source, index) => ({ source, number: index + 1 })))(
    'level $number ($source.id)',
    ({ source }) => {
      const level = parseLevel(source);

      it('AC-11: the seed is an integer and the rival parameters are in range', () => {
        expect(Number.isInteger(source.seed)).toBe(true);
        expect(source.rival.reaction).toBeGreaterThanOrEqual(5);
        expect(source.rival.reaction).toBeLessThanOrEqual(50);
        expect(source.rival.margin).toBeGreaterThanOrEqual(0);
        expect(source.rival.margin).toBeLessThanOrEqual(10);
      });

      it('AC-11: there are 3 to 14 basins with unique ids, inside the map and apart from each other', () => {
        expect(source.basins.length).toBeGreaterThanOrEqual(3);
        expect(source.basins.length).toBeLessThanOrEqual(14);
        expect(new Set(source.basins.map((basin) => basin.id)).size).toBe(source.basins.length);
        for (const [index, { at }] of level.basins.entries()) {
          expect(at.x).toBeGreaterThanOrEqual(1);
          expect(at.x).toBeLessThanOrEqual(15);
          expect(at.y).toBeGreaterThanOrEqual(1);
          expect(at.y).toBeLessThanOrEqual(9);
          for (const other of level.basins.slice(index + 1)) {
            expect(Math.hypot(other.at.x - at.x, other.at.y - at.y)).toBeGreaterThanOrEqual(MIN_DISTANCE);
          }
        }
      });

      it('AC-11: both sides have a basin, and starting units are between 0 and the capacity', () => {
        expect(source.basins.some((basin) => basin.owner === 'player')).toBe(true);
        expect(source.basins.some((basin) => basin.owner === 'rival')).toBe(true);
        for (const basin of source.basins) {
          expect(Number.isInteger(basin.units)).toBe(true);
          expect(basin.units).toBeGreaterThanOrEqual(0);
          expect(basin.units).toBeLessThanOrEqual(BASIN_SIZES[basin.size].capacity);
        }
      });

      it('AC-11: channels link two distinct basins, once, into a connected network', () => {
        const pairs = level.channels.map(({ a, b }) => [Math.min(a, b), Math.max(a, b)].join());
        expect(level.channels.every(({ a, b }) => a !== b)).toBe(true);
        expect(new Set(pairs).size).toBe(pairs.length);
        expect(isConnected(level)).toBe(true);
      });

      it('AC-11: channels do not cross, and pass clear of the basins they do not link', () => {
        for (const [index, channel] of level.channels.entries()) {
          const a = level.basins[channel.a]!.at;
          const b = level.basins[channel.b]!.at;
          for (const other of level.channels.slice(index + 1)) {
            expect(segmentsCross(a, b, level.basins[other.a]!.at, level.basins[other.b]!.at)).toBe(false);
          }
          for (const [basinIndex, basin] of level.basins.entries()) {
            if (basinIndex !== channel.a && basinIndex !== channel.b) {
              expect(distanceToSegment(basin.at, a, b)).toBeGreaterThanOrEqual(CLEARANCE);
            }
          }
        }
      });

      it('AC-11: tides stay open and closed at least 20 steps, with a positive phase', () => {
        for (const { tide } of level.channels) {
          if (tide !== null) {
            expect(tide.open).toBeGreaterThanOrEqual(MIN_TIDE);
            expect(tide.closed).toBeGreaterThanOrEqual(MIN_TIDE);
            expect(tide.phase).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it('AC-11: the reference strategy wins in less than 5 minutes', () => {
        const end = play(level, REFERENCE_STRATEGY);
        expect(end.outcome).toBe('won');
        expect(end.tick).toBeLessThan(MAX_TICKS);
      });

      it('AC-11: a player who gives no order does not win in 5 minutes', () => {
        expect(play(level, null).outcome).not.toBe('won');
      });
    },
  );
});
