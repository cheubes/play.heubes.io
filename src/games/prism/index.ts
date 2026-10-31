import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { computeBeams } from './logic/beams';
import { parseLevel } from './logic/level-parser';
import { createState, restart, toggle, undo } from './logic/prism';
import type { BeamResult, Level, Position, PrismState } from './logic/types';
import { animateBeamFlow, animateTarget, animateToggle, finishAnimations } from './render/animations';
import { drawBeams } from './render/beams';
import { createBoardView, fitBoard, placeCursor, placeElements, updateTargets, type BoardView } from './render/board';
import { bindInput, firstSelection, nextSelection, type PrismInput } from './render/input';

const prism: GameDefinition = {
  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, locale, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const pluralRules = new Intl.PluralRules(locale);
    let level: Level | undefined;
    let state: PrismState | undefined;
    let view: BoardView | undefined;
    let lit: Record<string, boolean> = {};
    // Beams of the last move, drawn once its toggle animation ends.
    let pendingBeams: BeamResult | undefined;
    let selected: Position | undefined;
    let cursorVisible = false;
    let paused = false;
    let reducedMotion = false;

    function showBeams(current: Level, currentView: BoardView, beams: BeamResult, animateTargets: boolean): void {
      drawBeams(currentView.beams, beams);
      updateTargets(currentView, current, beams);
      if (animateTargets) {
        for (const [targetId, isLit] of Object.entries(beams.lit)) {
          if (isLit !== (lit[targetId] ?? false)) {
            animateTarget(currentView, targetId, isLit, reducedMotion);
          }
        }
      }
      if (!reducedMotion) {
        animateBeamFlow(currentView);
      }
      lit = beams.lit;
    }

    function flushBeams(): void {
      if (pendingBeams && level && view) {
        const beams = pendingBeams;
        pendingBeams = undefined;
        showBeams(level, view, beams, true);
      }
    }

    function reset(current: Level, currentView: BoardView, next: PrismState): void {
      pendingBeams = undefined;
      lit = {};
      reducedMotion = context.reducedMotion();
      state = next;
      placeElements(currentView, current, next);
      showBeams(current, currentView, computeBeams(current, next), false);
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
      placeElements(currentView, current, next);
      const beams = computeBeams(current, next);
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
      hud.setActionEnabled('undo', true);
      announceMove(next.moves, beams);
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
      placeElements(currentView, current, previous);
      showBeams(current, currentView, computeBeams(current, previous), true);
      hud.setActionEnabled('undo', previous.history.length > 0);
      context.announce(t('announce.undo', { moves: previous.moves }));
    }

    function showCursor(currentView: BoardView): void {
      cursorVisible = true;
      placeCursor(currentView, selected, true);
    }

    // The key that reveals the cursor only shows the selection: the player sees it before acting on it.
    function handleInput(input: PrismInput): void {
      if (paused || !level || !view) {
        return;
      }
      finishAnimations(container);
      flushBeams();
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
