import type { GameDefinition, HudStat } from '../shell/types';
import { LEVELS } from './levels/levels';
import { moverPosition } from './logic/collision';
import { createState } from './logic/leap';
import { parseLevel } from './logic/level-parser';
import type { LeapState, Level } from './logic/types';
import { createRoomLayers, fitRoomLayers } from './render/canvas';
import { drawDecor, drawScene, readPalette, type Palette, type SceneFrame } from './render/draw';
import { startLoop, type GameLoop } from './render/loop';

const JUMP_KEYS = [' ', 'Enter', 'ArrowUp'];
const TICKS_PER_TENTH = 6;

function formatTime(ticks: number): string {
  const tenths = Math.floor(ticks / TICKS_PER_TENTH);
  const seconds = Math.floor(tenths / 10);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${tenths % 10}`;
}

function collectedCogs(state: LeapState): number {
  return state.cogs + (state.roomCog ? 1 : 0);
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

// A fall or a new room moves the runner without travelling: those steps are not interpolated.
function sceneFrame(level: Level, previous: LeapState, current: LeapState, alpha: number): SceneFrame {
  const continuous = previous.room === current.room && previous.falls === current.falls;
  const from = continuous ? previous : current;
  return {
    runner: {
      x: lerp(from.runner.x, current.runner.x, alpha),
      y: lerp(from.runner.y, current.runner.y, alpha),
      facing: current.runner.facing,
    },
    movers: level.rooms[current.room].movers.map((mover) => {
      const start = moverPosition(mover, from.roomTick);
      const end = moverPosition(mover, current.roomTick);
      return { x: lerp(start.x, end.x, alpha), y: lerp(start.y, end.y, alpha), length: mover.length };
    }),
    doorsSwapped: current.doorsSwapped,
    cogVisible: !current.roomCog,
  };
}

const leap: GameDefinition = {
  create(context) {
    const { container, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const layers = createRoomLayers();
    let level: Level | undefined;
    let loop: GameLoop | undefined;
    let palette: Palette | undefined;
    let decorRoom: number | undefined;
    let lastFrame: { previous: LeapState; current: LeapState; alpha: number } | undefined;
    let shownStats = '';
    let paused = false;
    let completed = false;

    container.replaceChildren(layers.element);

    function showStats(state: LeapState): void {
      const stats: HudStat[] = [
        { id: 'cogs', label: t('stats.cogs'), value: `${collectedCogs(state)}/2` },
        { id: 'time', label: t('stats.time'), value: formatTime(state.runTicks) },
      ];
      const key = stats.map((stat) => stat.value).join('|');
      if (key !== shownStats) {
        shownStats = key;
        hud.setStats(stats);
      }
    }

    function draw(previous: LeapState, current: LeapState, alpha: number): void {
      if (!level || !palette) {
        return;
      }
      lastFrame = { previous, current, alpha };
      const room = level.rooms[current.room];
      if (decorRoom !== current.room) {
        drawDecor(layers.decor, room, palette);
        decorRoom = current.room;
      }
      drawScene(layers.scene, room, sceneFrame(level, previous, current, alpha), palette);
    }

    function fit(): void {
      fitRoomLayers(container, layers);
      decorRoom = undefined;
      if (lastFrame) {
        draw(lastFrame.previous, lastFrame.current, lastFrame.alpha);
      }
    }

    function begin(next: Level): void {
      loop?.stop();
      level = next;
      paused = false;
      completed = false;
      shownStats = '';
      lastFrame = undefined;
      palette = readPalette(container);
      const state = createState(next);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      showStats(state);
      fit();
      draw(state, state, 0);
      loop = startLoop(next, state, {
        onStep: (_previous, current) => showStats(current),
        onFrame: draw,
        onComplete(state) {
          completed = true;
          context.complete({
            status: state.cogs === 2 ? 'perfect' : 'completed',
            stats: [
              { label: t('stats.time'), value: formatTime(state.runTicks) },
              { label: t('stats.cogs'), value: `${state.cogs}/2` },
            ],
          });
        },
      });
    }

    // Provisional controls, until render/input.ts (step 4 of BUILD-PLAN.md).
    function press(): void {
      if (!paused && !completed) {
        loop?.press();
      }
    }
    container.addEventListener('pointerdown', press, { signal });
    container.addEventListener(
      'keydown',
      (event) => {
        if (!event.repeat && JUMP_KEYS.includes(event.key)) {
          event.preventDefault();
          press();
        }
      },
      { signal },
    );

    return {
      start(levelId) {
        const next = levels.find((candidate) => candidate.id === levelId) ?? levels[0];
        if (next) {
          begin(next);
        }
      },
      pause() {
        paused = true;
        loop?.pause();
      },
      resume() {
        paused = false;
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

export default leap;
