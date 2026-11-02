import type { GameDefinition, HudStat, LevelResult } from '../shell/types';
import { LEVELS } from './levels/levels';
import { moverPosition } from './logic/collision';
import { createState } from './logic/leap';
import { parseLevel } from './logic/level-parser';
import { CELL_SIZE, GRAVITY, JUMP_SPEED, ROOM_SIZE, RUNNER_HEIGHT, RUNNER_WIDTH, SPRING_SPEED } from './logic/types';
import { formatTime, getLevelEntries, getLevelResult, parseSave, saveResult } from './logic/progress';
import type { LeapState, Level, Room } from './logic/types';
import { BACKDROP_GEARS, createRoomLayers, fitRoomLayers, gearRadius } from './render/canvas';
import { drawBackdropGear, drawDecor, drawScene, readPalette, type Palette, type SceneFrame } from './render/draw';
import { createEffects, slideRooms, spinGears, type Effects } from './render/effects';
import { bindInput, defaultInputSource, type InputSource } from './render/input';
import { startLoop, type GameLoop } from './render/loop';
import { createSounds } from './render/sounds';

const INDICATOR_INSET = 4;

function collectedCogs(state: LeapState): number {
  return state.cogs + (state.roomCog ? 1 : 0);
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function findTile(room: Room, tile: 'entry' | 'cog' | 'exit'): { row: number; col: number } | undefined {
  for (const [row, line] of room.tiles.entries()) {
    const col = line.indexOf(tile);
    if (col !== -1) {
      return { row, col };
    }
  }
  return undefined;
}

// A fall or a new room moves the runner without travelling: those steps are not interpolated.
// At the end of the level, the runner walks into the exit arch while fading out.
function sceneFrame(level: Level, previous: LeapState, current: LeapState, alpha: number, effects: Effects): SceneFrame {
  const continuous = previous.room === current.room && previous.falls === current.falls;
  const from = continuous ? previous : current;
  let x = lerp(from.runner.x, current.runner.x, alpha);
  let y = lerp(from.runner.y, current.runner.y, alpha);
  const exitProgress = effects.exitProgress() ?? 0;
  const exit = findTile(level.rooms[current.room], 'exit');
  if (exitProgress > 0 && exit) {
    x = lerp(x, exit.col * CELL_SIZE + (CELL_SIZE - RUNNER_WIDTH) / 2, exitProgress);
    y = lerp(y, (exit.row + 1) * CELL_SIZE - RUNNER_HEIGHT, exitProgress);
  }
  return {
    runner: {
      x,
      y,
      facing: current.runner.facing,
      scale: effects.runnerScale() * (1 - 0.4 * exitProgress),
      opacity: 1 - exitProgress,
      visible: !effects.falling(),
    },
    movers: level.rooms[current.room].movers.map((mover) => {
      const start = moverPosition(mover, from.roomTick);
      const end = moverPosition(mover, current.roomTick);
      return { x: lerp(start.x, end.x, alpha), y: lerp(start.y, end.y, alpha), length: mover.length };
    }),
    doorsSwapped: current.doorsSwapped,
    doorProgress: effects.doorProgress(),
    cogVisible: !current.roomCog,
  };
}

const leap: GameDefinition = {
  getLevels(storage) {
    return getLevelEntries(LEVELS, parseSave(storage.read()));
  },

  create(context) {
    const { container, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const layers = createRoomLayers();
    const sounds = createSounds(context.audio);
    let level: Level | undefined;
    let loop: GameLoop | undefined;
    let palette: Palette | undefined;
    let effects = createEffects(false);
    let slides: Animation[] = [];
    let decorRoom: number | undefined;
    let lastFrame: { previous: LeapState; current: LeapState; alpha: number } | undefined;
    let shownStats = '';
    let inputSource: InputSource = defaultInputSource();
    let paused = false;
    let completed = false;
    // Result of the completed level, until the exit animation hands it to the host.
    let pendingResult: LevelResult | undefined;
    let reducedMotion = false;
    let indicatorPlacement = '';

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

    function showIndicator(state: LeapState): void {
      if (!level) {
        return;
      }
      const room = level.rooms[state.room];
      const entry = findTile(room, 'entry');
      const visible = !state.runner.launched && !completed && !effects.falling() && slides.length === 0;
      layers.indicator.hidden = !visible || !entry;
      if (!visible || !entry) {
        return;
      }
      const text = t(`indicator.${inputSource}`);
      const content = room.facing === 'right' ? `${text} →` : `← ${text}`;
      const roomSize = layers.element.clientWidth;
      const placement = `${content}|${roomSize}|${entry.row},${entry.col}`;
      if (placement === indicatorPlacement) {
        return;
      }
      indicatorPlacement = placement;
      layers.indicator.textContent = content;
      // Centered under the entry, but kept inside the room when the entry is near a side.
      const cellSize = roomSize / ROOM_SIZE;
      const halfWidth = layers.indicator.offsetWidth / 2 + INDICATOR_INSET;
      const center = Math.min(Math.max((entry.col + 0.5) * cellSize, halfWidth), roomSize - halfWidth);
      layers.indicator.style.left = `${center}px`;
      layers.indicator.style.top = `${(entry.row + 1) * cellSize}px`;
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
      const frame = sceneFrame(level, previous, current, alpha, effects);
      drawScene(layers.scene, room, frame, palette);
      effects.draw(layers.scene, palette, frame.runner);
      showIndicator(current);
    }

    function fit(): void {
      fitRoomLayers(container, layers);
      decorRoom = undefined;
      if (palette) {
        const current = palette;
        layers.gears.forEach((gear, index) => {
          drawBackdropGear(gear, current, gearRadius(index), BACKDROP_GEARS[index]?.teeth ?? 0);
        });
      }
      if (lastFrame) {
        draw(lastFrame.previous, lastFrame.current, lastFrame.alpha);
      }
    }

    function finishEffects(): void {
      effects.finish();
      for (const slide of slides) {
        slide.finish();
      }
      slides = [];
    }

    function announceRoom(state: LeapState): void {
      context.announce(t('announce.room', { number: state.room + 1 }));
    }

    function react(previous: LeapState, current: LeapState): void {
      if (!level) {
        return;
      }
      if (current.room !== previous.room) {
        finishEffects();
        slides = reducedMotion
          ? []
          : slideRooms(layers, previous.runner.facing, getComputedStyle(container).getPropertyValue('--ease-in-out').trim());
        for (const slide of slides) {
          void slide.finished.then(
            () => (slides = slides.filter((candidate) => candidate !== slide)),
            () => undefined,
          );
        }
        sounds.exitRoom();
        announceRoom(current);
        return;
      }
      if (current.falls > previous.falls) {
        effects.fall(previous.runner.x, previous.runner.y);
        sounds.fall();
        context.announce(t('announce.fall'));
        return;
      }
      const { runner } = current;
      if (runner.vy === GRAVITY - JUMP_SPEED) {
        effects.jump();
        sounds.jump();
      } else if (runner.vy === -SPRING_SPEED) {
        effects.jump();
        sounds.spring();
      } else if (runner.grounded && !previous.runner.grounded) {
        effects.land(runner.x + RUNNER_WIDTH / 2, runner.y + RUNNER_HEIGHT);
        sounds.land();
      }
      if (runner.facing !== previous.runner.facing) {
        effects.turn(previous.runner.facing === 'right' ? runner.x + RUNNER_WIDTH : runner.x, runner.y + RUNNER_HEIGHT / 2, runner.facing);
        sounds.turn();
      }
      if (runner.onLever && !previous.runner.onLever) {
        sounds.lever();
      }
      if (current.doorsSwapped !== previous.doorsSwapped) {
        effects.swapDoors();
      }
      if (current.roomCog && !previous.roomCog) {
        const cog = findTile(level.rooms[current.room], 'cog');
        if (cog) {
          effects.collectCog((cog.col + 0.5) * CELL_SIZE, (cog.row + 0.5) * CELL_SIZE);
        }
        sounds.cog();
        context.announce(t('announce.cog'));
      }
    }

    function handOver(): void {
      if (pendingResult) {
        const result = pendingResult;
        pendingResult = undefined;
        loop?.stop();
        context.complete(result);
      }
    }

    // Saved as soon as the level is complete, so that leaving during the exit animation keeps the progress.
    function completeLevel(current: Level, state: LeapState): void {
      completed = true;
      finishEffects();
      sounds.exitLevel();
      const run = { ticks: state.runTicks, cogs: state.cogs, falls: state.falls };
      const bestTicks = saveResult(context.storage, current.id, run);
      pendingResult = getLevelResult(t, run, bestTicks);
      if (reducedMotion) {
        handOver();
      } else {
        effects.exitLevel();
      }
    }

    function begin(next: Level): void {
      loop?.stop();
      finishEffects();
      level = next;
      paused = false;
      completed = false;
      pendingResult = undefined;
      shownStats = '';
      lastFrame = undefined;
      palette = readPalette(container);
      reducedMotion = context.reducedMotion();
      effects = createEffects(reducedMotion);
      spinGears(layers, reducedMotion);
      const state = createState(next);
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      showStats(state);
      fit();
      draw(state, state, 0);
      announceRoom(state);
      loop = startLoop(next, state, {
        onStep(previous, current) {
          react(previous, current);
          showStats(current);
        },
        onFrame(previous, current, alpha, elapsed) {
          effects.advance(elapsed);
          draw(previous, current, alpha);
          if (effects.exitProgress() === 1) {
            handOver();
          }
        },
        onComplete(state) {
          completeLevel(next, state);
        },
      });
    }

    // An input finishes the effects in progress (a fall, a room change), then reaches the next step.
    // Once the level is complete, it only finishes the exit animation.
    bindInput(container, signal, (source) => {
      if (paused) {
        return;
      }
      if (completed) {
        handOver();
        return;
      }
      inputSource = source;
      finishEffects();
      loop?.press();
      if (lastFrame) {
        draw(lastFrame.previous, lastFrame.current, lastFrame.alpha);
      }
    });

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
        for (const animation of container.getAnimations({ subtree: true })) {
          animation.pause();
        }
      },
      resume() {
        paused = false;
        loop?.resume();
        for (const animation of container.getAnimations({ subtree: true })) {
          animation.play();
        }
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
