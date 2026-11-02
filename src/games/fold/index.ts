import { getLevelEntries, getLevelResult, getMoveStats, parseSave, saveResult } from '../shell/progress';
import type { GameDefinition } from '../shell/types';
import { LEVELS } from './levels/levels';
import { canFold, createState, fold, isSolved, restart, undo } from './logic/fold';
import { parseLevel } from './logic/level-parser';
import { visibleFace } from './logic/sheet';
import type { Fold, FoldState, Level } from './logic/types';
import { animateBlockedPins, animateFold, animateUnfold, animateVictory, finishAnimations, resetVictory } from './render/animations';
import {
  blockingPins,
  clearPreview,
  createBoardView,
  fitBoard,
  markBlockingPins,
  placeSheet,
  showFoldLine,
  showGhost,
  type BoardView,
} from './render/board';
import { bindInput, centerCursor, cursorFold, moveCursor, type Cursor, type FoldInput } from './render/input';
import { createSounds } from './render/sounds';

interface Victory {
  final: FoldState;
  best: number;
}

const foldGame: GameDefinition = {
  getLevels(storage) {
    return getLevelEntries(LEVELS, parseSave(storage.read()));
  },

  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, locale, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const pluralRules = new Intl.PluralRules(locale);
    const sounds = createSounds(context.audio);
    let level: Level | undefined;
    let state: FoldState | undefined;
    let view: BoardView | undefined;
    // The folds behind the current state, for the undo animation.
    let folds: Fold[] = [];
    let cursor: Cursor | undefined;
    let cursorVisible = false;
    let paused = false;
    let reducedMotion = false;
    // Rebuilds the sheet at the end of the running animation.
    let pending: (() => void) | undefined;
    let victory: Victory | undefined;

    function showStats(current: Level, next: FoldState): void {
      hud.setStats(getMoveStats(t, next.moves, current.par));
    }

    function showCursor(currentView: BoardView, current: FoldState): void {
      clearPreview(currentView);
      if (cursorVisible && cursor) {
        showFoldLine(currentView, current.sheet, cursor.axis, cursor.line);
      }
    }

    function render(current: Level, currentView: BoardView, next: FoldState): void {
      placeSheet(currentView, current, next.sheet);
      showCursor(currentView, next);
    }

    // An input finishes the running animations, then is handled on the sheet they leave.
    function settle(): void {
      finishAnimations(container);
      const done = pending;
      pending = undefined;
      done?.();
    }

    function afterAnimation(animation: Animation | undefined, done: () => void): void {
      if (!animation) {
        done();
        return;
      }
      pending = done;
      void animation.finished.then(() => {
        if (pending === done) {
          pending = undefined;
          done();
        }
      });
    }

    function recenterCursor(next: FoldState): void {
      if (cursor) {
        cursor = centerCursor(next.sheet, cursor.axis) ?? cursor;
      }
    }

    function reset(current: Level, currentView: BoardView, next: FoldState): void {
      pending = undefined;
      victory = undefined;
      folds = [];
      reducedMotion = context.reducedMotion();
      state = next;
      cursor = centerCursor(next.sheet, 'vertical');
      resetVictory(currentView);
      render(current, currentView, next);
      showStats(current, next);
      hud.setActionEnabled('undo', false);
    }

    function load(next: Level): void {
      level = next;
      view = createBoardView(next, t('goal'));
      paused = false;
      container.replaceChildren(view.element);
      fitBoard(container, view, next);
      reset(next, view, createState(next));
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
    }

    function announceMove(current: Level, next: FoldState): void {
      const { rows, cols } = next.sheet;
      let message = t('announce.move', { moves: next.moves, width: cols, height: rows });
      if (rows === current.goal.length && cols === current.goal[0]?.length) {
        const face = visibleFace(current, next.sheet);
        const matching = face.flat().filter((cell, index) => cell === current.goal.flat()[index]).length;
        const form = pluralRules.select(matching) === 'one' ? 'one' : 'other';
        message += ` ${t(`announce.match.${form}`, { matching, total: rows * cols })}`;
      }
      context.announce(message);
    }

    function completeLevel(current: Level, { final, best }: Victory): void {
      context.complete(getLevelResult(t, final.moves, current.par, best));
    }

    // Saved as soon as the level is solved, so that leaving during the victory animation keeps the progress.
    function win(current: Level, final: FoldState): Victory {
      hud.setActionEnabled('undo', false);
      victory = { final, best: saveResult(context.storage, current.id, final.moves) };
      return victory;
    }

    // Starts once the winning flap has landed, on the rebuilt sheet.
    function celebrate(current: Level, currentView: BoardView, won: Victory): void {
      sounds.victory();
      const animation = animateVictory(currentView, reducedMotion);
      if (!animation) {
        completeLevel(current, won);
        return;
      }
      void animation.then(() => {
        // Restarting finishes the victory too: the level must not complete after that.
        if (state === won.final) {
          completeLevel(current, won);
        }
      });
    }

    function foldAlong(current: Level, currentView: BoardView, move: Fold): void {
      if (!state) {
        return;
      }
      const check = canFold(current, state.sheet, move);
      if (check === 'pinned') {
        sounds.blocked();
        animateBlockedPins(blockingPins(currentView, state.sheet, move), reducedMotion);
        context.announce(t('announce.pinned'));
        return;
      }
      if (check !== 'ok') {
        return;
      }
      const before = state;
      const next = fold(current, before, move);
      state = next;
      folds = [...folds, move];
      recenterCursor(next);
      clearPreview(currentView);
      showStats(current, next);
      announceMove(current, next);
      const won = isSolved(current, next) ? win(current, next) : undefined;
      if (won) {
        cursorVisible = false;
      } else {
        hud.setActionEnabled('undo', true);
      }
      sounds.fold();
      // The flap lands when its animation ends, even when an input finishes it early.
      afterAnimation(animateFold(currentView, current, before.sheet, next.sheet, move, reducedMotion), () => {
        sounds.land();
        render(current, currentView, next);
        if (won) {
          celebrate(current, currentView, won);
        }
      });
    }

    function undoFold(current: Level, currentView: BoardView): void {
      const lastFold = folds.at(-1);
      if (!state || !lastFold) {
        return;
      }
      const after = state;
      const previous = undo(after);
      state = previous;
      folds = folds.slice(0, -1);
      recenterCursor(previous);
      // The flap turns back from where it had landed on the sheet before that fold.
      placeSheet(currentView, current, previous.sheet);
      showStats(current, previous);
      hud.setActionEnabled('undo', previous.history.length > 0);
      sounds.unfold();
      context.announce(t('announce.undo', { moves: previous.moves }));
      afterAnimation(animateUnfold(currentView, current, previous.sheet, after.sheet, lastFold, reducedMotion), () =>
        render(current, currentView, previous),
      );
    }

    function preview(current: Level, currentView: BoardView, move: Fold | undefined): void {
      clearPreview(currentView);
      if (!state || !move) {
        return;
      }
      showFoldLine(currentView, state.sheet, move.axis, move.line);
      const check = canFold(current, state.sheet, move);
      if (check === 'ok') {
        showGhost(currentView, current, state.sheet, move);
      } else if (check === 'pinned') {
        markBlockingPins(blockingPins(currentView, state.sheet, move));
      }
    }

    // The arrow that reveals the cursor only shows it: the player sees the line before acting on it.
    // Once solved, an input only finishes the victory animation, which opens the end panel.
    function handleInput(input: FoldInput): void {
      if (paused || !level || !view || !state) {
        return;
      }
      if (victory) {
        settle();
        // Settling may have just started the victory, once the winning flap landed.
        finishAnimations(container);
        return;
      }
      switch (input.type) {
        case 'drag':
          preview(level, view, input.fold);
          return;
        case 'release':
          clearPreview(view);
          if (input.fold) {
            foldAlong(level, view, input.fold);
          }
          return;
        case 'cancel':
          clearPreview(view);
          return;
      }
      settle();
      switch (input.type) {
        case 'move-cursor':
          if (cursorVisible) {
            cursor = moveCursor(state.sheet, cursor, input.arrow);
          }
          cursorVisible = true;
          showCursor(view, state);
          break;
        case 'fold-cursor': {
          const move = cursorVisible ? cursorFold(cursor, input.arrow) : undefined;
          cursorVisible = true;
          if (move) {
            foldAlong(level, view, move);
          } else {
            showCursor(view, state);
          }
          break;
        }
        case 'undo':
          undoFold(level, view);
          break;
      }
    }

    const input = bindInput(container, signal, {
      onInput: handleInput,
      onPointerDown() {
        if (!paused && view) {
          settle();
          if (victory) {
            finishAnimations(container);
            return;
          }
          cursorVisible = false;
          clearPreview(view);
        }
      },
      geometry() {
        return !paused && !victory && view && state ? { rect: view.sheet.getBoundingClientRect(), cellSize: view.cellSize, sheet: state.sheet } : undefined;
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
        input.cancelGesture();
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
          // The pending fold is dropped, not landed: the sheet is rebuilt, and its landing sound must not play.
          finishAnimations(container);
          input.cancelGesture();
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
          settle();
          fitBoard(container, view, level);
        }
      },
      destroy() {
        container.replaceChildren();
      },
    };
  },
};

export default foldGame;
