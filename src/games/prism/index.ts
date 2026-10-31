import { getLevelStatuses, parseSave, recordResult } from '../shell/progress';
import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { computeBeams } from './logic/beams';
import { parseLevel } from './logic/level-parser';
import { createState, isSolved, restart, toggle, undo } from './logic/prism';
import type { BeamResult, Level, Position, PrismState } from './logic/types';
import { animateBeamFlow, animateTarget, animateToggle, animateVictory, finishAnimations } from './render/animations';
import { drawBeams } from './render/beams';
import { createBoardView, fitBoard, placeCursor, placeElements, updateTargets, type BoardView } from './render/board';
import { bindInput, firstSelection, nextSelection, type PrismInput } from './render/input';
import { createSounds } from './render/sounds';

interface Victory {
  final: PrismState;
  best: number;
}

const prism: GameDefinition = {
  getLevels(storage) {
    const statuses = getLevelStatuses(LEVELS, parseSave(storage.read()));
    return LEVELS.map((level, index) => ({ id: level.id, label: String(index + 1), status: statuses[index] ?? 'locked' }));
  },

  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, locale, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const pluralRules = new Intl.PluralRules(locale);
    const sounds = createSounds(context.audio);
    let level: Level | undefined;
    let state: PrismState | undefined;
    let view: BoardView | undefined;
    let lit: Record<string, boolean> = {};
    let received: Record<string, number> = {};
    // Beams of the last move, drawn once its toggle animation ends.
    let pendingBeams: BeamResult | undefined;
    let selected: Position | undefined;
    let cursorVisible = false;
    let paused = false;
    let victory: Victory | undefined;
    let reducedMotion = false;

    function showStats(current: Level, next: PrismState): void {
      hud.setStats([
        { id: 'moves', label: t('stats.moves'), value: String(next.moves) },
        { id: 'par', label: t('stats.par'), value: String(current.par) },
      ]);
    }

    function showBeams(current: Level, currentView: BoardView, beams: BeamResult, animateTargets: boolean): void {
      drawBeams(currentView.beams, beams);
      updateTargets(currentView, current, beams);
      if (animateTargets) {
        for (const element of current.elements) {
          if (element.type !== 'target') {
            continue;
          }
          const isLit = beams.lit[element.id] ?? false;
          if (isLit !== (lit[element.id] ?? false)) {
            animateTarget(currentView, element.id, isLit, reducedMotion);
            if (isLit) {
              sounds.targetLit(element.color);
            } else {
              sounds.targetUnlit();
            }
          } else {
            const before = received[element.id] ?? 0;
            const after = beams.received[element.id] ?? 0;
            sounds.sectorsReceived(after & ~before & element.color);
            sounds.sectorsLost(before & ~after & element.color);
          }
        }
      }
      if (!reducedMotion) {
        animateBeamFlow(currentView);
      }
      lit = beams.lit;
      received = beams.received;
    }

    function flushBeams(): void {
      if (pendingBeams && level && view) {
        const beams = pendingBeams;
        pendingBeams = undefined;
        showBeams(level, view, beams, true);
        if (victory) {
          celebrate(level, view, victory);
        }
      }
    }

    function reset(current: Level, currentView: BoardView, next: PrismState): void {
      pendingBeams = undefined;
      victory = undefined;
      lit = {};
      received = {};
      reducedMotion = context.reducedMotion();
      state = next;
      currentView.beams.classList.remove('is-solved');
      placeElements(currentView, current, next);
      showBeams(current, currentView, computeBeams(current, next), false);
      showStats(current, next);
      hud.setActionEnabled('undo', false);
    }

    function load(next: Level): void {
      level = next;
      view = createBoardView(next);
      paused = false;
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      reset(next, view, createState(next));
      selected = firstSelection(next);
      placeCursor(view, selected, cursorVisible);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
    }

    function announceMove(moves: number, beams: BeamResult): void {
      const states = Object.values(beams.lit);
      const litCount = states.filter((isLit) => isLit).length;
      context.announce(
        t(`announce.move.${pluralRules.select(litCount) === 'one' ? 'one' : 'other'}`, {
          moves,
          lit: litCount,
          total: states.length,
        }),
      );
    }

    function completeLevel(current: Level, { final, best }: Victory): void {
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
    function win(current: Level, final: PrismState): void {
      hud.setActionEnabled('undo', false);
      const save = recordResult(parseSave(context.storage.read()), current.id, final.moves);
      context.storage.write(save);
      victory = { final, best: save.best[current.id] ?? final.moves };
    }

    // Starts once the beams of the winning move are drawn, since the halos it intensifies are redrawn with them.
    function celebrate(current: Level, currentView: BoardView, won: Victory): void {
      const targets = current.elements
        .filter((element) => element.type === 'target')
        .sort((first, second) => first.position.row - second.position.row || first.position.col - second.position.col);
      sounds.victory();
      const animation = animateVictory(currentView, targets, reducedMotion);
      if (!animation) {
        completeLevel(current, won);
        return;
      }
      void animation.then(() => {
        // Restarting finishes the pulses too: the level must not complete after that.
        if (state === won.final) {
          completeLevel(current, won);
        }
      });
    }

    function toggleAt(current: Level, currentView: BoardView, position: Position): void {
      if (!state) {
        return;
      }
      const before = state;
      const next = toggle(current, before, position);
      if (next === before) {
        return;
      }
      const element = current.elements.find(
        (candidate) => candidate.position.row === position.row && candidate.position.col === position.col,
      );
      state = next;
      sounds.toggle();
      placeElements(currentView, current, next);
      showStats(current, next);
      const beams = computeBeams(current, next);
      announceMove(next.moves, beams);
      if (isSolved(current, next)) {
        win(current, next);
      } else {
        hud.setActionEnabled('undo', true);
      }
      pendingBeams = beams;
      const animation = element && animateToggle(currentView, element, before, reducedMotion);
      if (animation) {
        // An input during the animation draws these beams first: they must not be drawn again over a later move.
        void animation.finished.then(() => {
          if (pendingBeams === beams) {
            flushBeams();
          }
        });
      } else {
        flushBeams();
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
      sounds.undo();
      placeElements(currentView, current, previous);
      showBeams(current, currentView, computeBeams(current, previous), true);
      showStats(current, previous);
      hud.setActionEnabled('undo', previous.history.length > 0);
      context.announce(t('announce.undo', { moves: previous.moves }));
    }

    function showCursor(currentView: BoardView): void {
      cursorVisible = true;
      placeCursor(currentView, selected, true);
    }

    // The key that reveals the cursor only shows the selection: the player sees it before acting on it.
    // Once solved, an input only finishes the victory animation, which opens the end panel.
    function handleInput(input: PrismInput): void {
      if (paused || !level || !view) {
        return;
      }
      finishAnimations(container);
      flushBeams();
      if (victory) {
        // Flushing the beams of the winning move may have just started the victory.
        finishAnimations(container);
        return;
      }
      switch (input.type) {
        case 'tap': {
          const { row, col } = input.position;
          const element = level.elements.find((candidate) => candidate.position.row === row && candidate.position.col === col);
          if ((element?.type === 'mirror' || element?.type === 'prism') && !element.fixed) {
            selected = input.position;
            placeCursor(view, selected, cursorVisible);
          }
          toggleAt(level, view, input.position);
          break;
        }
        case 'select':
          if (cursorVisible && selected) {
            selected = nextSelection(level, selected, input.direction);
          }
          showCursor(view);
          break;
        case 'activate':
          if (cursorVisible && selected) {
            toggleAt(level, view, selected);
          }
          showCursor(view);
          break;
        case 'undo':
          undoMove(level, view);
          break;
      }
    }

    bindInput(container, signal, {
      onInput: handleInput,
      onPointerDown() {
        if (!paused && view) {
          cursorVisible = false;
          placeCursor(view, selected, false);
        }
      },
    });

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
          reset(level, view, restart(level));
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

export default prism;
