import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { parseLevel } from './logic/level-parser';
import { createState, restart } from './logic/tilt';
import type { Level, TiltState } from './logic/types';
import { createBoardView, fitBoard, placeBlocks, type BoardView } from './render/board';

const tilt: GameDefinition = {
  create(context) {
    const { container, t, hud } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    let level: Level | undefined;
    let state: TiltState | undefined;
    let view: BoardView | undefined;

    function load(next: Level): void {
      level = next;
      state = createState(next);
      view = createBoardView(next);
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      placeBlocks(view, next, state.blocks);
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
          placeBlocks(view, level, state.blocks);
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

export default tilt;
