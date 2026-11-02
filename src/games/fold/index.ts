import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { createState, restart } from './logic/fold';
import { parseLevel } from './logic/level-parser';
import type { FoldState, Level } from './logic/types';
import { createBoardView, fitBoard, placeSheet, type BoardView } from './render/board';

const fold: GameDefinition = {
  create(context) {
    const { container, t, hud } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    let level: Level | undefined;
    let state: FoldState | undefined;
    let view: BoardView | undefined;

    function load(next: Level): void {
      level = next;
      state = createState(next);
      view = createBoardView(next, t('goal'));
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      placeSheet(view, next, state.sheet);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
    }

    return {
      start(levelId) {
        const next = levels.find((candidate) => candidate.id === levelId) ?? levels[0];
        if (next) {
          load(next);
        }
      },
      pause() {},
      resume() {},
      restart() {
        if (level && view) {
          state = restart(level);
          placeSheet(view, level, state.sheet);
        }
      },
      resize() {
        if (level && view) {
          fitBoard(container, view, level);
        }
      },
      destroy() {
        container.replaceChildren();
      },
    };
  },
};

export default fold;
