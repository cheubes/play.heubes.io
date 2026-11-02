import { RUNNER_HEIGHT, RUNNER_WIDTH } from '../logic/types';
import type { Facing } from '../logic/types';
import { BACKDROP_GEARS, snapshotStage, type RoomLayers } from './canvas';
import { drawGear, type Palette } from './draw';

const SQUASH_DURATION = 120;
const DUST_DURATION = 250;
const FALL_DURATION = 400;
const COG_DURATION = 200;
const DOOR_DURATION = 150;
const SLIDE_DURATION = 300;
const JUMP_STRETCH = 1.15;
const LANDING_SQUASH = 0.85;
const PIECE_GRAVITY = 0.004;

interface Timed {
  elapsed: number;
  duration: number;
}

interface Squash extends Timed {
  scale: number;
}

interface Dust extends Timed {
  x: number;
  y: number;
  // Directions the particles spread to: both sides on landing, away from the wall on a turn.
  directions: number[];
}

interface Fall extends Timed {
  x: number;
  y: number;
}

interface CogFlight extends Timed {
  x: number;
  y: number;
}

export interface Effects {
  jump(): void;
  land(x: number, y: number): void;
  turn(x: number, y: number, towards: Facing): void;
  fall(x: number, y: number): void;
  collectCog(x: number, y: number): void;
  swapDoors(): void;
  advance(elapsed: number): void;
  finish(): void;
  falling(): boolean;
  runnerScale(): number;
  doorProgress(): number;
  draw(context: CanvasRenderingContext2D, palette: Palette, runner: { x: number; y: number }): void;
}

function progress(effect: Timed): number {
  return Math.min(1, effect.elapsed / effect.duration);
}

// Particles, pieces and flights are drawn on the scene, in simulation units, after the runner.
export function createEffects(reducedMotion: boolean): Effects {
  let squash: Squash | undefined;
  let dusts: Dust[] = [];
  let fall: Fall | undefined;
  let cog: CogFlight | undefined;
  let doors: Timed | undefined;

  function drawDust(context: CanvasRenderingContext2D, dust: Dust): void {
    const t = progress(dust);
    context.globalAlpha = 1 - t;
    for (const direction of dust.directions) {
      for (const [spread, rise] of [
        [70, 30],
        [130, 14],
      ] as const) {
        context.beginPath();
        context.arc(dust.x + direction * spread * t, dust.y - rise * t, 18 - 10 * t, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  function drawFall(context: CanvasRenderingContext2D, palette: Palette, current: Fall): void {
    const t = current.elapsed;
    const halfWidth = RUNNER_WIDTH / 2;
    const halfHeight = RUNNER_HEIGHT / 2;
    context.fillStyle = palette.runner;
    context.globalAlpha = Math.min(1, (current.duration - t) / 100);
    for (const [column, row] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const) {
      const side = column === 0 ? -1 : 1;
      const cx = current.x + halfWidth * (column + 0.5) + side * 0.35 * t;
      const cy = current.y + halfHeight * (row + 0.5) - 0.6 * t + (PIECE_GRAVITY * t * t) / 2;
      context.save();
      context.translate(cx, cy);
      context.rotate(side * 0.008 * t);
      context.fillRect(-halfWidth / 2, -halfHeight / 2, halfWidth, halfHeight);
      context.restore();
    }
  }

  function drawCog(context: CanvasRenderingContext2D, palette: Palette, flight: CogFlight, runner: { x: number; y: number }): void {
    const t = progress(flight);
    const targetX = runner.x + RUNNER_WIDTH / 2;
    const targetY = runner.y + RUNNER_HEIGHT / 2;
    context.fillStyle = palette.cog;
    context.strokeStyle = palette.cog;
    context.globalAlpha = 1 - t;
    context.lineWidth = 12;
    context.beginPath();
    context.arc(flight.x, flight.y, 90 + 120 * t, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    drawGear(context, flight.x + (targetX - flight.x) * t, flight.y + (targetY - flight.y) * t, 84 * (1 - 0.7 * t), 8);
  }

  return {
    jump() {
      if (!reducedMotion) {
        squash = { elapsed: 0, duration: SQUASH_DURATION, scale: JUMP_STRETCH };
      }
    },
    land(x, y) {
      if (!reducedMotion) {
        squash = { elapsed: 0, duration: SQUASH_DURATION, scale: LANDING_SQUASH };
        dusts.push({ elapsed: 0, duration: DUST_DURATION, x, y, directions: [-1, 1] });
      }
    },
    turn(x, y, towards) {
      if (!reducedMotion) {
        dusts.push({ elapsed: 0, duration: DUST_DURATION, x, y, directions: [towards === 'right' ? 1 : -1] });
      }
    },
    fall(x, y) {
      squash = undefined;
      fall = { elapsed: 0, duration: FALL_DURATION, x, y };
    },
    collectCog(x, y) {
      if (!reducedMotion) {
        cog = { elapsed: 0, duration: COG_DURATION, x, y };
      }
    },
    swapDoors() {
      if (!reducedMotion) {
        doors = { elapsed: 0, duration: DOOR_DURATION };
      }
    },
    advance(elapsed) {
      for (const effect of [squash, fall, cog, doors, ...dusts]) {
        if (effect) {
          effect.elapsed += elapsed;
        }
      }
      const running = <T extends Timed>(effect: T | undefined) => (effect && effect.elapsed < effect.duration ? effect : undefined);
      squash = running(squash);
      fall = running(fall);
      cog = running(cog);
      doors = running(doors);
      dusts = dusts.filter((dust) => dust.elapsed < dust.duration);
    },
    finish() {
      squash = undefined;
      dusts = [];
      fall = undefined;
      cog = undefined;
      doors = undefined;
    },
    falling() {
      return fall !== undefined;
    },
    runnerScale() {
      return squash ? squash.scale + (1 - squash.scale) * progress(squash) : 1;
    },
    doorProgress() {
      return doors ? progress(doors) : 1;
    },
    draw(context, palette, runner) {
      context.fillStyle = palette.wallEdge;
      for (const dust of dusts) {
        drawDust(context, dust);
      }
      context.globalAlpha = 1;
      if (fall && !reducedMotion) {
        drawFall(context, palette, fall);
      }
      context.globalAlpha = 1;
      if (cog) {
        drawCog(context, palette, cog, runner);
      }
      context.globalAlpha = 1;
    },
  };
}

export function spinGears(layers: RoomLayers, reducedMotion: boolean): void {
  layers.gears.forEach((context, index) => {
    for (const animation of context.canvas.getAnimations()) {
      animation.cancel();
    }
    const turn = BACKDROP_GEARS[index]?.turn ?? 0;
    if (!reducedMotion && turn !== 0) {
      context.canvas.animate([{ transform: 'rotate(0turn)' }, { transform: `rotate(${Math.sign(turn)}turn)` }], {
        duration: Math.abs(turn),
        iterations: Infinity,
      });
    }
  });
}

// The next room slides in from the side the runner left through, pushing a still copy of the previous one.
export function slideRooms(layers: RoomLayers, towards: Facing, easing: string): Animation[] {
  const snapshot = snapshotStage(layers);
  const shift = towards === 'right' ? -100 : 100;
  const options = { duration: SLIDE_DURATION, easing };
  const out = snapshot.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${shift}%)` }], options);
  const into = layers.stage.animate([{ transform: `translateX(${-shift}%)` }, { transform: 'translateX(0)' }], options);
  void out.finished.then(
    () => snapshot.remove(),
    () => snapshot.remove(),
  );
  return [out, into];
}
