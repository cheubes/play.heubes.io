import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { parseLevel } from './logic/level-parser';
import { getLevelStatuses, parseSave, recordResult } from './logic/progress';
import { createState, isOnTarget, isSolved, restart, tilt as tiltBoard, undo } from './logic/tilt';
import type { Direction, Level, TiltState } from './logic/types';
import { animateBlockedTilt, animateMove, animateVictory, finishAnimations } from './render/animations';
import { createBoardView, fitBoard, placeBlocks, type BoardView } from './render/board';
import { bindInput, type TiltInput } from './render/input';

const tilt: GameDefinition = {
  getLevels(storage) {
    const statuses = getLevelStatuses(LEVELS, parseSave(storage.read()));
    return LEVELS.map((level, index) => ({ id: level.id, label: String(index + 1), status: statuses[index] ?? 'locked' }));
  },

  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, locale, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const pluralRules = new Intl.PluralRules(locale);
    let level: Level | undefined;
    let state: TiltState | undefined;
    let view: BoardView | undefined;
    let paused = false;
    let solved = false;
    let reducedMotion = false;

    function showStats(current: Level, next: TiltState): void {
      hud.setStats([
        { id: 'moves', label: t('stats.moves'), value: String(next.moves) },
        { id: 'par', label: t('stats.par'), value: String(current.par) },
      ]);
    }

    function load(next: Level): void {
      level = next;
      state = createState(next);
      view = createBoardView(next);
      paused = false;
      solved = false;
      reducedMotion = context.reducedMotion();
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      placeBlocks(view, next, state.blocks);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      showStats(next, state);
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

    function completeLevel(current: Level, final: TiltState, best: number): void {
      const isPerfect = final.moves === current.par;
      context.complete({
        status: isPerfect ? 'perfect' : 'completed',
        stats: [
          { label: t('stats.moves'), value: String(final.moves) },
          { label: t('stats.par'), value: String(current.par) },
          { label: t('stats.best'), value: String(best) },
        ],
        message: isPerfect ? t('result.perfect') : t('result.solved', { moves: final.moves, par: current.par }),
      });
    }

    // Saved as soon as the level is solved, so that leaving during the victory animation keeps the progress.
    function win(current: Level, currentView: BoardView, final: TiltState): void {
      solved = true;
      hud.setActionEnabled('undo', false);
      const save = recordResult(parseSave(context.storage.read()), current.id, final.moves);
      context.storage.write(save);
      const best = save.best[current.id] ?? final.moves;
      if (reducedMotion) {
        completeLevel(current, final, best);
        return;
      }
      const coloredIds = final.blocks
        .filter((block) => block.kind === 'colored')
        .sort((first, second) => first.position.row - second.position.row || first.position.col - second.position.col)
        .map((block) => block.id);
      void animateVictory(currentView, coloredIds).then(() => {
        // Restarting finishes the pulses too: the level must not complete after that.
        if (state === final) {
          completeLevel(current, final, best);
        }
      });
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
      showStats(current, state);
      hud.setActionEnabled('undo', true);
      announceMove(current, state);
      if (isSolved(current, state)) {
        win(current, currentView, state);
      }
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
      showStats(current, state);
      hud.setActionEnabled('undo', state.history.length > 0);
      context.announce(t('announce.undo', { moves: state.moves }));
    }

    // Once solved, an input only finishes the victory animation, which opens the end panel.
    function handleInput(input: TiltInput): void {
      if (paused || !level || !view) {
        return;
      }
      finishAnimations(container);
      if (solved) {
        return;
      }
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
          solved = false;
          reducedMotion = context.reducedMotion();
          state = restart(level);
          placeBlocks(view, level, state.blocks);
          showStats(level, state);
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
