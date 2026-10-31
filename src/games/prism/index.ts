import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { computeBeams } from './logic/beams';
import { parseLevel } from './logic/level-parser';
import { createState, restart } from './logic/prism';
import type { Level, PrismState } from './logic/types';
import { drawBeams } from './render/beams';
import { createBoardView, fitBoard, placeElements, updateTargets, type BoardView } from './render/board';

const prism: GameDefinition = {
  create(context) {
    const { container, t, hud } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    let level: Level | undefined;
    let state: PrismState | undefined;
    let view: BoardView | undefined;

    function render(current: Level, currentView: BoardView, next: PrismState): void {
      const beams = computeBeams(current, next);
      placeElements(currentView, current, next);
      drawBeams(currentView.beams, beams);
      updateTargets(currentView, current, beams);
    }

    function load(next: Level): void {
      level = next;
      state = createState(next);
      view = createBoardView(next);
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      render(next, view, state);
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
          render(level, view, state);
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

export default prism;
