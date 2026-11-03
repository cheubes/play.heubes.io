import type { GameDefinition, HudStat } from '../shell/types';
import { LEVELS } from './levels/levels';
import { parseLevel } from './logic/level-parser';
import { createState } from './logic/simulation';
import { decide, REFERENCE_STRATEGY } from './logic/strategy';
import { TICK_MS } from './logic/types';
import type { DeltaState, Level } from './logic/types';
import { createMapView, fitMapView } from './render/canvas';
import { drawMap, readPalette, type Palette } from './render/draw';
import { startLoop, type GameLoop } from './render/loop';

function formatTime(ticks: number): string {
  const seconds = Math.floor((ticks * TICK_MS) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function playReference(level: Level, state: DeltaState): DeltaState {
  return state.tick % REFERENCE_STRATEGY.reaction === 0 ? decide(level, state, 'player', REFERENCE_STRATEGY) : state;
}

const delta: GameDefinition = {
  create(context) {
    const { container, t, hud } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const view = createMapView();
    let level: Level | undefined;
    let loop: GameLoop | undefined;
    let palette: Palette | undefined;
    let shown: { state: DeltaState; alpha: number } | undefined;
    let shownStats = '';
    // Development only, removed with the controls: ?reference lets the reference strategy play for the
    // player, ?level=<n> opens level n.
    const development = import.meta.env.DEV ? new URLSearchParams(window.location.search) : undefined;

    container.replaceChildren(view.context.canvas);

    function showStats(state: DeltaState): void {
      const held = state.basins.filter((basin) => basin.owner === 'player').length;
      const stats: HudStat[] = [
        { id: 'time', label: t('stats.time'), value: formatTime(state.tick) },
        { id: 'basins', label: t('stats.basins'), value: `${held}/${state.basins.length}` },
      ];
      const key = stats.map((stat) => stat.value).join('|');
      if (key !== shownStats) {
        shownStats = key;
        hud.setStats(stats);
      }
    }

    function draw(state: DeltaState, alpha: number): void {
      if (level && palette) {
        shown = { state, alpha };
        drawMap(view, level, state, alpha, palette);
      }
    }

    function fit(): void {
      fitMapView(container, view);
      if (shown) {
        draw(shown.state, shown.alpha);
      }
    }

    function begin(next: Level): void {
      loop?.stop();
      level = next;
      shown = undefined;
      shownStats = '';
      palette = readPalette(container);
      const state = createState(next);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      showStats(state);
      fitMapView(container, view);
      draw(state, 0);
      loop = startLoop(next, state, {
        onStep(_previous, current) {
          showStats(current);
        },
        onFrame(current, alpha) {
          draw(current, alpha);
        },
        onEnd() {},
        beforeStep: development?.has('reference') ? (current) => playReference(next, current) : undefined,
      });
    }

    return {
      start(levelId) {
        const developmentLevel = levels[Number(development?.get('level')) - 1];
        const next = developmentLevel ?? levels.find((candidate) => candidate.id === levelId) ?? levels[0];
        if (next) {
          begin(next);
        }
      },
      pause() {
        loop?.pause();
      },
      resume() {
        loop?.resume();
      },
      restart() {
        if (level) {
          begin(level);
        }
      },
      resize() {
        if (level) {
          fit();
        }
      },
      destroy() {
        loop?.stop();
        container.replaceChildren();
      },
    };
  },
};

export default delta;
