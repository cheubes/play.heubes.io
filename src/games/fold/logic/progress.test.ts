import { describe, expect, it } from 'vitest';
import { getLevelStatuses, parseSave, recordResult } from '../../shell/progress';

const LEVELS = [
  { id: 'first-crease', par: 1 },
  { id: 'second', par: 2 },
  { id: 'third', par: 3 },
];

describe('progress', () => {
  it('AC-08: without a save, level 1 is available and the next ones are locked', () => {
    expect(getLevelStatuses(LEVELS, parseSave(undefined))).toEqual(['available', 'locked', 'locked']);
  });

  it('AC-08: completing level n makes level n + 1 available', () => {
    const save = recordResult(parseSave(undefined), 'first-crease', 2);
    expect(getLevelStatuses(LEVELS, save)).toEqual(['completed', 'available', 'locked']);
  });

  it('AC-08: a level whose best result equals its par is perfect', () => {
    const save = recordResult(recordResult(parseSave(undefined), 'first-crease', 1), 'second', 3);
    expect(getLevelStatuses(LEVELS, save)).toEqual(['perfect', 'completed', 'available']);
  });

  it('AC-08: the best result of a level is the smallest number of moves it was solved in', () => {
    let save = parseSave(undefined);
    save = recordResult(save, 'first-crease', 5);
    save = recordResult(save, 'first-crease', 3);
    save = recordResult(save, 'first-crease', 4);
    expect(save.best['first-crease']).toBe(3);
  });
});
