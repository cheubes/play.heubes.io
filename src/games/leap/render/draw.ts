import { isDoorClosed, tileAt } from '../logic/collision';
import { CELL_SIZE, ROOM_SIZE, RUNNER_HEIGHT, RUNNER_WIDTH } from '../logic/types';
import type { Facing, Mover, Room } from '../logic/types';

const PALETTE_PROPERTIES = {
  bg: '--leap-bg',
  backdrop: '--leap-backdrop',
  wall: '--leap-wall',
  wallEdge: '--leap-wall-edge',
  spike: '--leap-spike',
  platform: '--leap-platform',
  spring: '--leap-spring',
  mechanism: '--leap-mechanism',
  runner: '--leap-runner',
  cog: '--leap-cog',
  exit: '--leap-exit',
} as const;

export type Palette = Record<keyof typeof PALETTE_PROPERTIES, string>;

export interface SceneFrame {
  runner: { x: number; y: number; facing: Facing; scale: number; visible: boolean };
  movers: { x: number; y: number; length: number }[];
  doorsSwapped: boolean;
  // Progress of the last swap of the doors, from 0 to 1 once they are settled.
  doorProgress: number;
  cogVisible: boolean;
}

const HALF = CELL_SIZE / 2;
const ROOM_EXTENT = CELL_SIZE * ROOM_SIZE;
const BLADE_HEIGHT = CELL_SIZE / 6;
const OUTLINE = 10;

export function readPalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const entries = Object.entries(PALETTE_PROPERTIES).map(([name, property]) => [name, style.getPropertyValue(property).trim()]);
  return Object.fromEntries(entries) as Palette;
}

function cellsOf(room: Room): { row: number; col: number; x: number; y: number }[] {
  return room.tiles.flatMap((line, row) =>
    line.map((_tile, col) => ({ row, col, x: col * CELL_SIZE, y: row * CELL_SIZE })),
  );
}

export function drawGear(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, teeth: number): void {
  const toothDepth = radius * 0.18;
  context.beginPath();
  for (let index = 0; index < teeth * 2; index++) {
    const angle = (index * Math.PI) / teeth;
    const nextAngle = ((index + 1) * Math.PI) / teeth;
    const outer = index % 2 === 0 ? radius : radius - toothDepth;
    context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    context.lineTo(cx + Math.cos(nextAngle) * outer, cy + Math.sin(nextAngle) * outer);
  }
  context.closePath();
  context.moveTo(cx + radius * 0.35, cy);
  context.arc(cx, cy, radius * 0.35, 0, Math.PI * 2, true);
  context.fill('evenodd');
}

function drawBlade(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number, width: number): void {
  context.fillStyle = palette.platform;
  context.fillRect(x, y, width, BLADE_HEIGHT);
  context.fillStyle = palette.bg;
  for (let notch = x + CELL_SIZE / 4; notch < x + width; notch += CELL_SIZE / 2) {
    context.fillRect(notch - 6, y + BLADE_HEIGHT - 16, 12, 16);
  }
}

function drawSpikes(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number, pointingUp: boolean): void {
  const base = pointingUp ? y + CELL_SIZE : y;
  const tip = y + HALF;
  const width = (CELL_SIZE - 72) / 3;
  context.beginPath();
  for (let index = 0; index < 3; index++) {
    const left = x + 36 + index * width;
    context.moveTo(left, base);
    context.lineTo(left + width / 2, tip);
    context.lineTo(left + width, base);
  }
  context.closePath();
  context.fillStyle = palette.spike;
  context.strokeStyle = palette.bg;
  context.lineWidth = OUTLINE;
  context.lineJoin = 'round';
  context.stroke();
  context.fill();
}

function drawWall(context: CanvasRenderingContext2D, palette: Palette, room: Room, row: number, col: number): void {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  context.fillStyle = palette.wall;
  context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  if (row > 0 && tileAt(room, { row: row - 1, col }) !== 'wall') {
    context.fillStyle = palette.wallEdge;
    context.fillRect(x, y, CELL_SIZE, 24);
  }
  context.fillStyle = palette.bg;
  context.globalAlpha = 0.3;
  for (const rivetX of [x + 40, x + CELL_SIZE - 40]) {
    context.beginPath();
    context.arc(rivetX, y + CELL_SIZE - 40, 12, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawSpring(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number): void {
  const cx = x + HALF;
  const bottom = y + CELL_SIZE;
  context.strokeStyle = palette.bg;
  context.lineWidth = 36;
  context.beginPath();
  context.ellipse(cx, bottom - 70, 60, 50, 0, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = palette.spring;
  context.lineWidth = 16;
  for (let coil = 0; coil < 3; coil++) {
    context.beginPath();
    context.ellipse(cx, bottom - 30 - coil * 28, 56, 16, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = palette.bg;
  context.fillRect(cx - 90, bottom - 126, 180, 30);
  context.fillStyle = palette.spring;
  context.fillRect(cx - 80, bottom - 120, 160, 18);
}

function drawExit(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number): void {
  const left = x + 40;
  const right = x + CELL_SIZE - 40;
  const bottom = y + CELL_SIZE;
  const archTop = y + 40 + (right - left) / 2;
  context.beginPath();
  context.moveTo(left, bottom);
  context.lineTo(left, archTop);
  context.arc(x + HALF, archTop, (right - left) / 2, Math.PI, 0);
  context.lineTo(right, bottom);
  context.fillStyle = palette.exit;
  context.globalAlpha = 0.25;
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = palette.exit;
  context.lineWidth = 24;
  context.stroke();
}

function drawEntry(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number): void {
  const bottom = y + CELL_SIZE;
  context.fillStyle = palette.wallEdge;
  context.beginPath();
  context.moveTo(x + 40, bottom);
  context.lineTo(x + 60, bottom - 28);
  context.lineTo(x + CELL_SIZE - 60, bottom - 28);
  context.lineTo(x + CELL_SIZE - 40, bottom);
  context.fill();
}

function drawMoverRail(context: CanvasRenderingContext2D, palette: Palette, mover: Mover): void {
  const width = mover.length * CELL_SIZE;
  const fromX = mover.from.col * CELL_SIZE;
  const toX = mover.to.col * CELL_SIZE;
  const fromY = mover.from.row * CELL_SIZE;
  const toY = mover.to.row * CELL_SIZE;
  context.strokeStyle = palette.platform;
  context.globalAlpha = 0.35;
  context.lineWidth = 14;
  context.setLineDash([24, 24]);
  context.beginPath();
  if (fromY === toY) {
    context.moveTo(Math.min(fromX, toX), fromY + BLADE_HEIGHT / 2);
    context.lineTo(Math.max(fromX, toX) + width, fromY + BLADE_HEIGHT / 2);
  } else {
    context.moveTo(fromX + width / 2, Math.min(fromY, toY));
    context.lineTo(fromX + width / 2, Math.max(fromY, toY) + BLADE_HEIGHT);
  }
  context.stroke();
  context.setLineDash([]);
  context.globalAlpha = 1;
}

export function drawBackdropGear(context: CanvasRenderingContext2D, palette: Palette, radius: number, teeth: number): void {
  context.clearRect(0, 0, radius * 2, radius * 2);
  context.fillStyle = palette.backdrop;
  drawGear(context, radius, radius, radius, teeth);
}

// The background and its cogs lie under the decor, which only draws the room's fixed tiles.
export function drawDecor(context: CanvasRenderingContext2D, room: Room, palette: Palette): void {
  context.clearRect(0, 0, ROOM_EXTENT, ROOM_EXTENT);
  for (const mover of room.movers) {
    drawMoverRail(context, palette, mover);
  }
  for (const { row, col, x, y } of cellsOf(room)) {
    switch (tileAt(room, { row, col })) {
      case 'wall':
        drawWall(context, palette, room, row, col);
        break;
      case 'spikes-up':
        drawSpikes(context, palette, x, y, true);
        break;
      case 'spikes-down':
        drawSpikes(context, palette, x, y, false);
        break;
      case 'platform':
        drawBlade(context, palette, x, y, CELL_SIZE);
        break;
      case 'spring':
        drawSpring(context, palette, x, y);
        break;
      case 'exit':
        drawExit(context, palette, x, y);
        break;
      case 'entry':
        drawEntry(context, palette, x, y);
        break;
    }
  }
}

// closure: 1 for a closed door, 0 for an open one; in between, the bars slide down from the top.
function drawDoor(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number, closure: number): void {
  context.strokeStyle = palette.mechanism;
  context.fillStyle = palette.mechanism;
  if (closure < 1) {
    context.lineWidth = 12;
    context.setLineDash([24, 20]);
    context.strokeRect(x + 18, y + 18, CELL_SIZE - 36, CELL_SIZE - 36);
    context.setLineDash([]);
  }
  if (closure > 0) {
    const barHeight = (CELL_SIZE - 24) * closure;
    context.fillRect(x + 12, y + 12, CELL_SIZE - 24, 20);
    context.fillRect(x + 12, y + 12 + barHeight - 20, CELL_SIZE - 24, 20);
    for (let bar = 0; bar < 4; bar++) {
      context.fillRect(x + 30 + bar * 50, y + 12, 24, barHeight);
    }
  }
}

function drawLever(context: CanvasRenderingContext2D, palette: Palette, x: number, y: number, swapped: boolean, progress: number): void {
  const cx = x + HALF;
  const pivotY = y + CELL_SIZE - 50;
  const angle = (swapped ? 1 : -1) * (Math.PI / 6) * (2 * progress - 1);
  const tipX = cx + Math.sin(angle) * 130;
  const tipY = pivotY - Math.cos(angle) * 130;
  context.strokeStyle = palette.mechanism;
  context.lineWidth = 22;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(cx, pivotY);
  context.lineTo(tipX, tipY);
  context.stroke();
  context.lineCap = 'butt';
  context.fillStyle = palette.mechanism;
  context.beginPath();
  context.arc(tipX, tipY, 26, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = palette.wall;
  context.beginPath();
  context.arc(cx, y + CELL_SIZE, 70, Math.PI, 0);
  context.fill();
}

function drawRunner(context: CanvasRenderingContext2D, palette: Palette, frame: SceneFrame['runner']): void {
  const { x, y, facing, scale, visible } = frame;
  if (!visible) {
    return;
  }
  context.save();
  context.translate(0, (y + RUNNER_HEIGHT) * (1 - scale));
  context.scale(1, scale);
  const cx = x + RUNNER_WIDTH / 2;
  const cy = y + 92;
  const ahead = facing === 'right' ? 1 : -1;
  const keyStemX = cx - ahead * 101;
  context.fillStyle = palette.wall;
  context.fillRect(keyStemX - 17, cy - 8, 34, 16);
  context.fillRect(keyStemX - ahead * 17 - 12, cy - 34, 24, 68);
  context.fillStyle = palette.runner;
  context.fillRect(x + 48, y + 160, 24, RUNNER_HEIGHT - 160);
  context.fillRect(x + RUNNER_WIDTH - 72, y + 160, 24, RUNNER_HEIGHT - 160);
  context.beginPath();
  context.arc(cx, cy, 84, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = palette.cog;
  context.beginPath();
  context.arc(cx + ahead * 42, cy - 14, 18, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawScene(context: CanvasRenderingContext2D, room: Room, frame: SceneFrame, palette: Palette): void {
  context.clearRect(0, 0, ROOM_EXTENT, ROOM_EXTENT);
  for (const { row, col, x, y } of cellsOf(room)) {
    const tile = tileAt(room, { row, col });
    if (tile === 'door-closed-at-start' || tile === 'door-open-at-start') {
      const closed = isDoorClosed(tile, frame.doorsSwapped);
      drawDoor(context, palette, x, y, closed ? frame.doorProgress : 1 - frame.doorProgress);
    } else if (tile === 'lever') {
      drawLever(context, palette, x, y, frame.doorsSwapped, frame.doorProgress);
    } else if (tile === 'cog' && frame.cogVisible) {
      context.fillStyle = palette.cog;
      drawGear(context, x + HALF, y + HALF - 16, 84, 8);
    }
  }
  for (const mover of frame.movers) {
    drawBlade(context, palette, mover.x, mover.y, mover.length * CELL_SIZE);
  }
  drawRunner(context, palette, frame.runner);
}
