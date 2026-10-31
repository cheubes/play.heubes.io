import { describe, expect, it } from 'vitest';
import { computeBeams } from './beams';
import { parseLevel } from './level-parser';
import { createState } from './prism';
import type { BeamResult, Direction, ElementSource, MirrorOrientation, Position } from './types';

const STEPS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

const OPPOSITES: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function beamsOf(elements: ElementSource[]): BeamResult {
  const level = parseLevel({ id: 'test', par: 1, rows: 5, cols: 5, elements });
  return computeBeams(level, createState(level));
}

describe('computeBeams', () => {
  it('AC-01: a beam crosses empty cells in a straight line and stops at the board edge', () => {
    const { steps } = beamsOf([{ type: 'source', at: [2, 0], color: 'red', direction: 'right' }]);
    expect(steps).toEqual([
      { from: { row: 2, col: 0 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 1 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 2 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 3 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 4 }, direction: 'right', color: 1, end: 'blocked' },
    ]);
  });

  it('AC-01: a beam stops on a wall', () => {
    const { steps } = beamsOf([
      { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
      { type: 'wall', at: [2, 3] },
    ]);
    expect(steps).toEqual([
      { from: { row: 2, col: 0 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 1 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 2 }, direction: 'right', color: 1, end: 'blocked' },
    ]);
  });

  it('AC-01: a beam stops on another source', () => {
    const { steps } = beamsOf([
      { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
      { type: 'source', at: [2, 3], color: 'blue', direction: 'up' },
    ]);
    expect(steps.filter((step) => step.color === 1)).toEqual([
      { from: { row: 2, col: 0 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 1 }, direction: 'right', color: 1, end: 'cell' },
      { from: { row: 2, col: 2 }, direction: 'right', color: 1, end: 'blocked' },
    ]);
  });

  const reflections: [Direction, MirrorOrientation, Direction][] = [
    ['right', 'slash', 'up'],
    ['left', 'slash', 'down'],
    ['up', 'slash', 'right'],
    ['down', 'slash', 'left'],
    ['right', 'backslash', 'down'],
    ['left', 'backslash', 'up'],
    ['up', 'backslash', 'left'],
    ['down', 'backslash', 'right'],
  ];

  it.each(reflections)('AC-02: a beam going %s is reflected by a %s mirror towards %s', (arrival, orientation, expected) => {
    const center = { row: 2, col: 2 };
    const at = (direction: Direction, distance: number): [number, number] => [
      center.row + STEPS[direction].row * distance,
      center.col + STEPS[direction].col * distance,
    ];
    const exits = (['up', 'down', 'left', 'right'] as const).filter((direction) => direction !== OPPOSITES[arrival]);
    const { received } = beamsOf([
      { type: 'source', at: at(OPPOSITES[arrival], 2), color: 'red', direction: arrival },
      { type: 'mirror', at: [center.row, center.col], orientation },
      ...exits.map((direction): ElementSource => ({ type: 'target', at: at(direction, 2), color: 'red' })),
    ]);
    for (const direction of exits) {
      const [row, col] = at(direction, 2);
      expect(received[`e-${row}-${col}`]).toBe(direction === expected ? 1 : 0);
    }
  });

  describe('AC-03: prisms', () => {
    const targets: ElementSource[] = [
      { type: 'target', at: [0, 2], color: 'white' },
      { type: 'target', at: [2, 4], color: 'white' },
      { type: 'target', at: [4, 2], color: 'white' },
    ];

    it('splits a white beam into red, green and blue, red on the left with a left spin', () => {
      const { received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'white', direction: 'right' },
        { type: 'prism', at: [2, 2], spin: 'left' },
        ...targets,
      ]);
      expect(received).toEqual({ 'e-0-2': 1, 'e-2-4': 2, 'e-4-2': 4 });
    });

    it('splits a white beam with red on the right with a right spin', () => {
      const { received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'white', direction: 'right' },
        { type: 'prism', at: [2, 2], spin: 'right' },
        ...targets,
      ]);
      expect(received).toEqual({ 'e-0-2': 4, 'e-2-4': 2, 'e-4-2': 1 });
    });

    it('turns red to the left of the beam direction, whatever that direction', () => {
      const { received } = beamsOf([
        { type: 'source', at: [4, 2], color: 'white', direction: 'up' },
        { type: 'prism', at: [2, 2], spin: 'left' },
        { type: 'target', at: [2, 0], color: 'white' },
        { type: 'target', at: [0, 2], color: 'white' },
        { type: 'target', at: [2, 4], color: 'white' },
      ]);
      expect(received).toEqual({ 'e-2-0': 1, 'e-0-2': 2, 'e-2-4': 4 });
    });

    it('lets a green beam through without deviation', () => {
      const { received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'green', direction: 'right' },
        { type: 'prism', at: [2, 2], spin: 'left' },
        ...targets,
      ]);
      expect(received).toEqual({ 'e-0-2': 0, 'e-2-4': 2, 'e-4-2': 0 });
    });

    it('deviates a red beam to the red side', () => {
      const { received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
        { type: 'prism', at: [2, 2], spin: 'right' },
        ...targets,
      ]);
      expect(received).toEqual({ 'e-0-2': 0, 'e-2-4': 0, 'e-4-2': 1 });
    });
  });

  describe('AC-04: filters', () => {
    it('lets through the intersection of the beam color and its own', () => {
      const { received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'magenta', direction: 'right' },
        { type: 'filter', at: [2, 2], color: 'yellow' },
        { type: 'target', at: [2, 4], color: 'red' },
      ]);
      expect(received['e-2-4']).toBe(1);
    });

    it('stops the beam when the intersection is empty', () => {
      const { steps, received } = beamsOf([
        { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
        { type: 'filter', at: [2, 2], color: 'cyan' },
        { type: 'target', at: [2, 4], color: 'red' },
      ]);
      expect(received['e-2-4']).toBe(0);
      expect(steps.map((step) => step.from)).toEqual([
        { row: 2, col: 0 },
        { row: 2, col: 1 },
      ]);
    });
  });

  describe('AC-05: targets', () => {
    it('receive the union of the beams reaching them, and are lit by their exact color', () => {
      const { received, lit } = beamsOf([
        { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
        { type: 'source', at: [0, 2], color: 'green', direction: 'down' },
        { type: 'target', at: [2, 2], color: 'yellow' },
      ]);
      expect(received['e-2-2']).toBe(3);
      expect(lit['e-2-2']).toBe(true);
    });

    it('are not lit when a primary is missing', () => {
      const { received, lit } = beamsOf([
        { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
        { type: 'target', at: [2, 2], color: 'yellow' },
      ]);
      expect(received['e-2-2']).toBe(1);
      expect(lit['e-2-2']).toBe(false);
    });

    it('are not lit when a primary is in excess', () => {
      const { received, lit } = beamsOf([
        { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
        { type: 'source', at: [4, 2], color: 'blue', direction: 'up' },
        { type: 'target', at: [2, 2], color: 'red' },
      ]);
      expect(received['e-2-2']).toBe(5);
      expect(lit['e-2-2']).toBe(false);
    });

    it('are not lit without any beam', () => {
      const { received, lit } = beamsOf([
        { type: 'source', at: [0, 0], color: 'red', direction: 'right' },
        { type: 'target', at: [2, 2], color: 'red' },
      ]);
      expect(received['e-2-2']).toBe(0);
      expect(lit['e-2-2']).toBe(false);
    });
  });

  it('AC-06: two crossing beams go on unchanged', () => {
    const { received, lit } = beamsOf([
      { type: 'source', at: [2, 0], color: 'red', direction: 'right' },
      { type: 'source', at: [0, 2], color: 'blue', direction: 'down' },
      { type: 'target', at: [2, 4], color: 'red' },
      { type: 'target', at: [4, 2], color: 'blue' },
    ]);
    expect(received).toEqual({ 'e-2-4': 1, 'e-4-2': 4 });
    expect(lit).toEqual({ 'e-2-4': true, 'e-4-2': true });
  });

  it('AC-07: the beam computation ends when the path comes back to its source', () => {
    const { steps } = beamsOf([
      { type: 'source', at: [1, 2], color: 'white', direction: 'right' },
      { type: 'mirror', at: [1, 1], orientation: 'slash' },
      { type: 'mirror', at: [1, 3], orientation: 'backslash' },
      { type: 'mirror', at: [3, 3], orientation: 'slash' },
      { type: 'mirror', at: [3, 1], orientation: 'backslash' },
    ]);
    expect(steps).toHaveLength(8);
    expect(steps.at(-1)).toEqual({ from: { row: 1, col: 1 }, direction: 'right', color: 7, end: 'blocked' });
  });
});
