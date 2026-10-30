import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { parseLevel } from './logic/level-parser';
import { createState, isOnTarget, restart, tilt as tiltBoard, undo } from './logic/tilt';
import type { Direction, Level, TiltState } from './logic/types';
import { animateBlockedTilt, animateMove, finishAnimations } from './render/animations';
import { createBoardView, fitBoard, placeBlocks, type BoardView } from './render/board';
import { bindInput, type TiltInput } from './render/input';

const tilt: GameDefinition = {
  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, locale, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const pluralRules = new Intl.PluralRules(locale);
    let level: Level | undefined;
    let state: TiltState | undefined;
    let view: BoardView | undefined;
    let paused = false;
    let reducedMotion = false;

    function load(next: Level): void {
      level = next;
      state = createState(next);
      view = createBoardView(next);
      paused = false;
      reducedMotion = context.reducedMotion();
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      placeBlocks(view, next, state.blocks);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      hud.setActionEnabled('undo', false);
    }

    function announceMove(current: Level, next: TiltState): void {
      const colored = next.blocks.filter((block) => block.kind === 'colored');
      const placed = colored.filter((block) => isOnTarget(current, block)).length;
      context.announce(
        t(`announce.move.${pluralRules.select(placed) === 'one' ? 'one' : 'other'}`, {
          moves: next.moves,
          placed,
          total: colored.length,
        }),
      );
    }

    function tiltTowards(current: Level, currentView: BoardView, direction: Direction): void {
      if (!state) {
        return;
      }
      const { state: next, motions } = tiltBoard(current, state, direction);
      if (motions.length === 0) {
        animateBlockedTilt(currentView, direction, reducedMotion);
        context.announce(t('announce.blocked'));
        return;
      }
      state = next;
      placeBlocks(currentView, current, state.blocks);
      animateMove(currentView, motions, direction, reducedMotion);
      hud.setActionEnabled('undo', true);
      announceMove(current, state);
    }

    function undoMove(current: Level, currentView: BoardView): void {
      if (!state) {
        return;
      }
      const previous = undo(state);
      if (previous === state) {
        return;
      }
      state = previous;
      placeBlocks(currentView, current, state.blocks);
      hud.setActionEnabled('undo', state.history.length > 0);
      context.announce(t('announce.undo', { moves: state.moves }));
    }

    function handleInput(input: TiltInput): void {
      if (paused || !level || !view) {
        return;
      }
      finishAnimations(container);
      if (input.type === 'tilt') {
        tiltTowards(level, view, input.direction);
      } else {
        undoMove(level, view);
      }
    }

    bindInput(container, signal, handleInput);

    return {
      start(levelId) {
        const next = levels.find((candidate) => candidate.id === levelId) ?? levels[0];
        if (next) {
          load(next);
        }
      },
      pause() {
        paused = true;
        for (const animation of container.getAnimations({ subtree: true })) {
          animation.pause();
        }
      },
      resume() {
        paused = false;
        for (const animation of container.getAnimations({ subtree: true })) {
          animation.play();
        }
      },
      restart() {
        if (level && view) {
          finishAnimations(container);
          // The pause panel's Restart button restarts without calling resume().
          paused = false;
          reducedMotion = context.reducedMotion();
          state = restart(level);
          placeBlocks(view, level, state.blocks);
          hud.setActionEnabled('undo', false);
        }
      },
      action(actionId) {
        if (actionId === 'undo') {
          handleInput({ type: 'undo' });
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
