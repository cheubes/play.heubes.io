import { describe, expect, it } from 'vitest';
import { parseLevel } from './level-parser';
import { applyFold, createSheet, visibleFace } from './sheet';
import type { Sheet } from './types';

// Layers of a blank 3 × 4 sheet:
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
const BLANK = parseLevel({ id: 'test', par: 1, sheet: ['....', '....', '....'], goal: ['.'] });

function rowsOf(sheet: Sheet): (readonly number[])[][] {
  return Array.from({ length: sheet.rows }, (_, row) => sheet.stacks.slice(row * sheet.cols, (row + 1) * sheet.cols));
}

describe('applyFold', () => {
  it('AC-01: a vertical fold lays each moving stack, reversed, on its symmetric stack and leaves the fixed stacks in place', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'vertical', line: 1, moving: 'before' });
    expect(rowsOf(sheet)).toEqual([
      [[1, 0], [2], [3]],
      [[5, 4], [6], [7]],
      [[9, 8], [10], [11]],
    ]);
  });

  it('AC-01: a vertical fold can move the part after the line', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'vertical', line: 3, moving: 'after' });
    expect(rowsOf(sheet)).toEqual([
      [[0], [1], [2, 3]],
      [[4], [5], [6, 7]],
      [[8], [9], [10, 11]],
    ]);
  });

  it('AC-01: a horizontal fold can move the part before the line', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'horizontal', line: 1, moving: 'before' });
    expect(rowsOf(sheet)).toEqual([
      [
        [4, 0],
        [5, 1],
        [6, 2],
        [7, 3],
      ],
      [[8], [9], [10], [11]],
    ]);
  });

  it('AC-01: a horizontal fold can move the part after the line', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'horizontal', line: 2, moving: 'after' });
    expect(rowsOf(sheet)).toEqual([
      [[0], [1], [2], [3]],
      [
        [4, 8],
        [5, 9],
        [6, 10],
        [7, 11],
      ],
    ]);
  });

  it('AC-01: a moving stack of several layers lands in the reverse order of its layers', () => {
    const once = applyFold(createSheet(BLANK), { axis: 'vertical', line: 1, moving: 'before' });
    const twice = applyFold(once, { axis: 'vertical', line: 1, moving: 'before' });
    expect(rowsOf(twice)).toEqual([
      [[2, 0, 1], [3]],
      [[6, 4, 5], [7]],
      [[10, 8, 9], [11]],
    ]);
  });

  it('AC-02: after a fold, the sheet is reduced to the smallest rectangle that holds its non-empty stacks', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'vertical', line: 1, moving: 'before' });
    expect(sheet.rows).toBe(3);
    expect(sheet.cols).toBe(3);
    expect(sheet.stacks.every((stack) => stack.length > 0)).toBe(true);
  });

  it('AC-02: a moving part larger than the fixed part overflows beyond its edge', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'vertical', line: 1, moving: 'after' });
    expect(rowsOf(sheet)).toEqual([
      [[3], [2], [0, 1]],
      [[7], [6], [4, 5]],
      [[11], [10], [8, 9]],
    ]);
  });

  it('AC-02: an overflowing horizontal fold extends the sheet beyond the fixed part', () => {
    const sheet = applyFold(createSheet(BLANK), { axis: 'horizontal', line: 1, moving: 'after' });
    expect(rowsOf(sheet)).toEqual([
      [[8], [9], [10], [11]],
      [
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ],
    ]);
  });
});

describe('visibleFace', () => {
  const LEVEL = parseLevel({ id: 'test', par: 1, sheet: ['v_o.', 'g...'], goal: ['.'] });

  it('AC-03: a position shows the content of its top layer, and a position without a layer is empty', () => {
    expect(visibleFace(LEVEL, createSheet(LEVEL))).toEqual([
      ['vermilion', 'empty', 'ochre', 'paper'],
      ['green', 'paper', 'paper', 'paper'],
    ]);
  });

  it('AC-03: the top layer of a stack hides the layers below it', () => {
    const sheet = applyFold(createSheet(LEVEL), { axis: 'vertical', line: 2, moving: 'before' });
    expect(visibleFace(LEVEL, sheet)[1]).toEqual(['paper', 'green']);
  });

  it('AC-03: a cut-out in a flap shows the layer below it', () => {
    const sheet = applyFold(createSheet(LEVEL), { axis: 'vertical', line: 2, moving: 'before' });
    expect(visibleFace(LEVEL, sheet)[0]).toEqual(['ochre', 'vermilion']);
  });
});
