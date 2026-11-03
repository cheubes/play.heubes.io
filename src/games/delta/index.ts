import { nextSelection } from '../shell/selection';
import type { GameDefinition, HudStat } from '../shell/types';
import { LEVELS } from './levels/levels';
import { parseLevel } from './logic/level-parser';
import { createState, hold, setRoute } from './logic/simulation';
import { BASIN_SIZES, TICK_MS } from './logic/types';
import type { DeltaState, Level, Point } from './logic/types';
import { createMapView, fitMapView, toScreen } from './render/canvas';
import { drawMap, readPalette, type Palette } from './render/draw';
import { createEffects, type Effects } from './render/effects';
import { bindInput, type DeltaInput } from './render/input';
import { startLoop, type GameLoop } from './render/loop';

const MIN_TOUCH_RADIUS = 22;

function formatTime(ticks: number): string {
  const seconds = Math.floor((ticks * TICK_MS) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function playerBasins(state: DeltaState): number {
  return state.basins.filter((basin) => basin.owner === 'player').length;
}

const delta: GameDefinition = {
  create(context) {
    const { container, t, hud, signal } = context;
    const levels: Level[] = LEVELS.map(parseLevel);
    const view = createMapView();
    let level: Level | undefined;
    let loop: GameLoop | undefined;
    let palette: Palette | undefined;
    let effects: Effects = createEffects(false);
    let shown: { state: DeltaState; alpha: number } | undefined;
    let shownStats = '';
    let paused = false;
    let source: number | undefined;
    let drag: Point | undefined;
    let cursor = 0;
    let cursorVisible = false;
    // The source selected before the current press, and the basin pressed.
    let press: { basin: number | undefined; previousSource: number | undefined } | undefined;

    container.replaceChildren(view.context.canvas);

    function showStats(state: DeltaState): void {
      const stats: HudStat[] = [
        { id: 'time', label: t('stats.time'), value: formatTime(state.tick) },
        { id: 'basins', label: t('stats.basins'), value: `${playerBasins(state)}/${state.basins.length}` },
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
        drawMap(view, level, state, alpha, palette, {
          effects: effects.frame(),
          source,
          drag,
          cursor: cursorVisible ? cursor : undefined,
        });
      }
    }

    function redraw(): void {
      if (shown) {
        draw(shown.state, shown.alpha);
      }
    }

    function fit(): void {
      fitMapView(container, view);
      redraw();
    }

    function screenPosition(index: number): Point {
      return toScreen(view, level!.basins[index]!.at);
    }

    function basinAt(point: Point): number | undefined {
      if (!level) {
        return undefined;
      }
      let found: number | undefined;
      let nearest = Infinity;
      for (const [index, basin] of level.basins.entries()) {
        const center = screenPosition(index);
        const distance = Math.hypot(point.x - center.x, point.y - center.y);
        if (distance <= Math.max(BASIN_SIZES[basin.size].radius * view.scale, MIN_TOUCH_RADIUS) && distance < nearest) {
          found = index;
          nearest = distance;
        }
      }
      return found;
    }

    function isPlayers(index: number | undefined): index is number {
      return index !== undefined && loop?.state().basins[index]?.owner === 'player';
    }

    function neighbors(index: number): number[] {
      return level!.basins[index]!.links.map((link) => link.basin);
    }

    function isNeighbor(from: number | undefined, to: number | undefined): boolean {
      return from !== undefined && to !== undefined && neighbors(from).includes(to);
    }

    function deselect(): void {
      source = undefined;
      drag = undefined;
    }

    function order(next: DeltaState, announcement: string): void {
      if (loop && next !== loop.state()) {
        loop.apply(next);
        context.announce(t(announcement));
      }
      deselect();
    }

    function routeTo(from: number, to: number): void {
      if (level && loop) {
        order(setRoute(level, loop.state(), level.basins[from]!.id, level.basins[to]!.id), 'announce.route');
      }
    }

    function holdBasin(index: number): void {
      if (level && loop) {
        order(hold(level, loop.state(), level.basins[index]!.id), 'announce.hold');
      }
    }

    function onKey(input: DeltaInput): void {
      if (!cursorVisible) {
        cursorVisible = true;
        return;
      }
      if (input.type === 'arrow') {
        const candidates = source === undefined ? level!.basins.map((_basin, index) => index) : neighbors(source);
        cursor = nextSelection(candidates, cursor, input.direction, screenPosition);
      } else if (input.type === 'back') {
        deselect();
      } else if (source === undefined) {
        if (isPlayers(cursor)) {
          source = cursor;
        }
      } else if (cursor === source) {
        holdBasin(source);
      } else if (isNeighbor(source, cursor)) {
        routeTo(source, cursor);
      }
    }

    function onPointer(input: DeltaInput): void {
      cursorVisible = false;
      if (input.type === 'press') {
        const basin = basinAt(input.point);
        press = { basin, previousSource: source };
        // A press on a neighbor of the source may be a tap that gives the order: it does not select yet.
        if (isPlayers(basin) && !(source !== undefined && basin !== source && isNeighbor(source, basin))) {
          source = basin;
        }
      } else if (input.type === 'drag') {
        if (isPlayers(press?.basin)) {
          source = press.basin;
          drag = input.point;
        }
      } else if (input.type === 'release' && press) {
        const { basin, previousSource } = press;
        press = undefined;
        if (input.dragged) {
          const target = basinAt(input.point);
          if (drag && source !== undefined && isNeighbor(source, target)) {
            routeTo(source, target!);
          } else {
            deselect();
          }
        } else if (basin !== undefined && basin === previousSource) {
          holdBasin(basin);
        } else if (isNeighbor(previousSource, basin)) {
          routeTo(previousSource!, basin!);
        } else if (!isPlayers(basin)) {
          deselect();
        }
      }
    }

    function onInput(input: DeltaInput): void {
      if (paused || !loop || loop.state().outcome !== 'playing') {
        return;
      }
      effects.finish();
      if (input.type === 'press' || input.type === 'drag' || input.type === 'release') {
        onPointer(input);
      } else {
        onKey(input);
      }
      redraw();
    }

    function react(previous: DeltaState, current: DeltaState): void {
      const total = current.basins.length;
      const held = playerBasins(current);
      for (const [index, basin] of current.basins.entries()) {
        const before = previous.basins[index]!.owner;
        if (basin.owner === before || basin.owner === 'neutral') {
          continue;
        }
        effects.capture(index, before, basin.owner);
        if (basin.owner === 'player') {
          context.announce(t('announce.taken', { held, total }));
        } else if (before === 'player') {
          context.announce(t('announce.lost', { held, total }));
        }
      }
      if (source !== undefined && current.basins[source]?.owner !== 'player') {
        deselect();
      }
    }

    function begin(next: Level): void {
      loop?.stop();
      level = next;
      paused = false;
      shown = undefined;
      shownStats = '';
      press = undefined;
      deselect();
      palette = readPalette(container);
      effects = createEffects(context.reducedMotion());
      const state = createState(next);
      cursor = Math.max(0, state.basins.findIndex((basin) => basin.owner === 'player'));
      hud.setLevelLabel(t('level', { number: levels.indexOf(next) + 1 }));
      showStats(state);
      fitMapView(container, view);
      draw(state, 0);
      loop = startLoop(next, state, {
        onStep(previous, current) {
          react(previous, current);
          showStats(current);
        },
        onFrame(current, alpha, elapsed) {
          effects.advance(elapsed);
          draw(current, alpha);
        },
        onEnd() {
          deselect();
        },
      });
    }

    bindInput(container, view.context.canvas, signal, onInput);

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

export default delta;
