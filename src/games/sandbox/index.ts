// Throwaway test game: remove in BUILD-PLAN.md step 11.
// Press Space or tap the play area N times to complete level N; exercises the whole game contract.
import type { GameDefinition } from '../shell/types';
import {
  LEVELS,
  canUndo,
  createState,
  getLevelStatuses,
  getOutcome,
  isComplete,
  parseSave,
  press,
  recordOutcome,
  undo,
  type SandboxLevel,
  type SandboxState,
} from './logic/sandbox';

const sandbox: GameDefinition = {
  getLevels(storage) {
    const statuses = getLevelStatuses(parseSave(storage.read()));
    return LEVELS.map((level, index) => ({ id: level.id, label: String(index + 1), status: statuses[index] ?? 'locked' }));
  },

  actions: [{ id: 'undo', icon: 'undo-2', labelKey: 'actions.undo', shortcut: 'z' }],

  create(context) {
    const { container, t, hud, signal } = context;
    let level: SandboxLevel = LEVELS[0] ?? { id: 'level-1', target: 1 };
    let state: SandboxState = createState(level.target);
    let paused = false;
    let finished = false;
    let reducedMotion = false;

    const board = document.createElement('div');
    board.className = 'sandbox-board';
    const counter = document.createElement('p');
    counter.className = 'sandbox-counter';
    const dots = document.createElement('div');
    dots.className = 'sandbox-dots';
    const hint = document.createElement('p');
    hint.className = 'sandbox-hint';
    hint.textContent = t('hint');
    board.append(counter, dots, hint);
    container.append(board);

    function render(): void {
      counter.textContent = `${state.presses} / ${state.target}`;
      dots.replaceChildren(
        ...Array.from({ length: state.target }, (_, index) => {
          const dot = document.createElement('span');
          dot.className = index < state.presses ? 'sandbox-dot is-filled' : 'sandbox-dot';
          return dot;
        }),
      );
      hud.setStats([{ id: 'presses', label: t('stats.presses'), value: `${state.presses}/${state.target}` }]);
      hud.setActionEnabled('undo', canUndo(state));
    }

    function update(next: SandboxState): void {
      if (next === state) {
        return;
      }
      state = next;
      render();
      context.announce(t('announce.progress', { count: state.presses, target: state.target }));
      if (!reducedMotion) {
        counter.animate([{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
      }
      if (isComplete(state)) {
        finish();
      }
    }

    function finish(): void {
      finished = true;
      const outcome = getOutcome(state);
      context.storage.write(recordOutcome(parseSave(context.storage.read()), level.id, outcome));
      context.complete({
        status: outcome,
        stats: [
          { label: t('stats.presses'), value: String(state.presses) },
          { label: t('stats.undos'), value: String(state.undos) },
        ],
        message: outcome === 'perfect' ? t('result.perfect') : undefined,
      });
    }

    function acceptsInput(): boolean {
      return !paused && !finished;
    }

    container.addEventListener(
      'keydown',
      (event) => {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !acceptsInput()) {
          return;
        }
        if (event.key === ' ') {
          event.preventDefault();
          update(press(state));
        } else if (event.key.toLowerCase() === 'z') {
          event.preventDefault();
          update(undo(state));
        }
      },
      { signal },
    );

    container.addEventListener(
      'pointerdown',
      (event) => {
        if (event.isPrimary && event.button === 0 && acceptsInput()) {
          update(press(state));
        }
      },
      { signal },
    );

    return {
      start(levelId) {
        level = LEVELS.find((candidate) => candidate.id === levelId) ?? level;
        state = createState(level.target);
        paused = false;
        finished = false;
        reducedMotion = context.reducedMotion();
        hud.setLevelLabel(t('level', { number: LEVELS.indexOf(level) + 1 }));
        render();
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
        this.start(level.id);
      },
      action(actionId) {
        if (actionId === 'undo' && acceptsInput()) {
          update(undo(state));
        }
      },
      destroy() {
        container.replaceChildren();
      },
    };
  },
};

export default sandbox;
