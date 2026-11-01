import { describe, expect, it } from 'vitest';
import { getLevelStatuses, parseSave, recordResult } from '../../shell/progress';

const LEVELS = [
  { id: 'first', par: 2 },
  { id: 'second', par: 3 },
  { id: 'third', par: 4 },
];

describe('getLevelStatuses', () => {
  it('AC-10: without a save, level 1 is available and the next ones are locked', () => {
    expect(getLevelStatuses(LEVELS, parseSave(undefined))).toEqual(['available', 'locked', 'locked']);
  });

  it('AC-10: completing level n makes level n + 1 available', () => {
    const save = recordResult(parseSave(undefined), 'first', 5);
    expect(getLevelStatuses(LEVELS, save)).toEqual(['completed', 'available', 'locked']);
  });

  it('AC-10: a level whose best result equals its par is perfect', () => {
    const save = recordResult(recordResult(parseSave(undefined), 'first', 2), 'second', 4);
    expect(getLevelStatuses(LEVELS, save)).toEqual(['perfect', 'completed', 'available']);
  });
});

describe('recordResult', () => {
  it('AC-11: the best result of a level is the smallest number of moves it was solved in', () => {
    let save = parseSave(undefined);
    save = recordResult(save, 'first', 5);
    save = recordResult(save, 'first', 3);
    save = recordResult(save, 'first', 4);
    expect(save.best.first).toBe(3);
  });
});
