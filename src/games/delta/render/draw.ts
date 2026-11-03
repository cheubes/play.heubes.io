import { isChannelOpen } from '../logic/simulation';
import { BASIN_SIZES, MAP_HEIGHT, MAP_WIDTH } from '../logic/types';
import type { BasinSize, Channel, DeltaState, Level, Owner, Point, Side } from '../logic/types';
import { toDevice, useDeviceTransform, useMapTransform, type MapView } from './canvas';

const PALETTE_PROPERTIES = {
  water: '--delta-water',
  channel: '--delta-channel',
  player: '--delta-player',
  rival: '--delta-rival',
  neutral: '--delta-neutral',
  ink: '--delta-ink',
  font: '--font-display',
} as const;

export type Palette = Record<keyof typeof PALETTE_PROPERTIES, string>;

const CHANNEL_WIDTH = 0.18;
const WAVE_AMPLITUDE = 0.06;
const WAVE_LENGTH = 0.5;
const CLOSED_DASH = [0.2, 0.15];
const CLOSED_OPACITY = 0.4;
const TIDE_ARC_RADIUS = 0.3;
const TIDE_ARC_WIDTH = 0.04;
const CHEVRON_SPACING = 0.5;
const CHEVRON_HALF_WIDTH = 0.1;
const CHEVRON_DEPTH = 0.07;
const CHEVRON_WIDTH = 0.05;
const CHEVRON_CLEARANCE = 0.3;
const UNIT_RADIUS = 0.06;
const HALO_SCALE = 1.8;
const HALO_OPACITY = 0.25;
const RINGS: Record<BasinSize, number> = { small: 1, medium: 2, large: 3 };
const RING_GAP = 0.08;
const RING_SPACING = 0.07;
const RING_WIDTH = 0.025;
const RING_OPACITY = 0.7;
const NEUTRAL_WIDTH = 0.06;
const NEUTRAL_DASH = [0.12, 0.08];
const DIGIT_SCALE = 0.95;
const LONG_NUMBER_SCALE = 0.75;

export function readPalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const entries = Object.entries(PALETTE_PROPERTIES).map(([name, property]) => [name, style.getPropertyValue(property).trim()]);
  return Object.fromEntries(entries) as Palette;
}

function sideColor(palette: Palette, owner: Owner): string {
  return owner === 'neutral' ? palette.neutral : palette[owner];
}

function ends(level: Level, channel: Channel): [Point, Point] {
  return [level.basins[channel.a]!.at, level.basins[channel.b]!.at];
}

function along(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return { x: from.x + ((to.x - from.x) * distance) / length, y: from.y + ((to.y - from.y) * distance) / length };
}

function traceChannel(context: CanvasRenderingContext2D, from: Point, to: Point, tidal: boolean): void {
  context.beginPath();
  context.moveTo(from.x, from.y);
  if (tidal) {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const normal = { x: -(to.y - from.y) / length, y: (to.x - from.x) / length };
    const samples = Math.ceil(length / 0.05);
    for (let sample = 1; sample <= samples; sample++) {
      const distance = (length * sample) / samples;
      const point = along(from, to, distance);
      const offset = WAVE_AMPLITUDE * Math.sin((2 * Math.PI * distance) / WAVE_LENGTH);
      context.lineTo(point.x + normal.x * offset, point.y + normal.y * offset);
    }
  } else {
    context.lineTo(to.x, to.y);
  }
  context.stroke();
}

function drawChannels(view: MapView, level: Level, time: number, palette: Palette): void {
  const { context } = view;
  context.strokeStyle = palette.channel;
  context.lineWidth = CHANNEL_WIDTH;
  context.lineCap = 'round';
  for (const channel of level.channels) {
    const open = isChannelOpen(channel, Math.floor(time));
    context.globalAlpha = open ? 1 : CLOSED_OPACITY;
    context.setLineDash(open ? [] : CLOSED_DASH);
    traceChannel(context, ...ends(level, channel), channel.tide !== null);
  }
  context.globalAlpha = 1;
  context.setLineDash([]);
}

// Share of the current tide phase, open or closed, still to come.
function tideRemaining(channel: Channel, time: number): number {
  const { open, closed, phase } = channel.tide!;
  const position = (time + phase) % (open + closed);
  return position < open ? (open - position) / open : (open + closed - position) / closed;
}

function drawTideArcs(view: MapView, level: Level, time: number, palette: Palette): void {
  const { context } = view;
  const unit = view.scale * window.devicePixelRatio;
  context.strokeStyle = palette.channel;
  context.lineWidth = TIDE_ARC_WIDTH * unit;
  context.lineCap = 'round';
  for (const channel of level.channels) {
    if (channel.tide === null) {
      continue;
    }
    const [a, b] = ends(level, channel);
    const center = toDevice(view, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const start = -Math.PI / 2;
    context.beginPath();
    context.arc(center.x, center.y, TIDE_ARC_RADIUS * unit, start, start + 2 * Math.PI * tideRemaining(channel, time));
    context.stroke();
  }
}

function drawChevrons(view: MapView, level: Level, state: DeltaState, palette: Palette): void {
  const { context } = view;
  context.lineWidth = CHEVRON_WIDTH;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const [index, basin] of state.basins.entries()) {
    if (basin.output === null || basin.owner === 'neutral') {
      continue;
    }
    const channel = level.channels[basin.output]!;
    const target = channel.a === index ? channel.b : channel.a;
    const from = level.basins[index]!.at;
    const to = level.basins[target]!.at;
    const first = BASIN_SIZES[level.basins[index]!.size].radius + CHEVRON_CLEARANCE;
    const last = channel.length - BASIN_SIZES[level.basins[target]!.size].radius - CHEVRON_CLEARANCE;
    const direction = { x: (to.x - from.x) / channel.length, y: (to.y - from.y) / channel.length };
    context.strokeStyle = palette[basin.owner];
    context.beginPath();
    for (let distance = first; distance <= last; distance += CHEVRON_SPACING) {
      const tip = along(from, to, distance + CHEVRON_DEPTH);
      const back = along(from, to, distance - CHEVRON_DEPTH);
      context.moveTo(back.x - direction.y * CHEVRON_HALF_WIDTH, back.y + direction.x * CHEVRON_HALF_WIDTH);
      context.lineTo(tip.x, tip.y);
      context.lineTo(back.x + direction.y * CHEVRON_HALF_WIDTH, back.y - direction.x * CHEVRON_HALF_WIDTH);
    }
    context.stroke();
  }
}

function traceDiamond(context: CanvasRenderingContext2D, center: Point, radius: number): void {
  context.beginPath();
  context.moveTo(center.x, center.y - radius);
  context.lineTo(center.x + radius, center.y);
  context.lineTo(center.x, center.y + radius);
  context.lineTo(center.x - radius, center.y);
  context.closePath();
}

function traceShape(context: CanvasRenderingContext2D, side: Side, center: Point, radius: number): void {
  if (side === 'rival') {
    traceDiamond(context, center, radius);
  } else {
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  }
}

function drawUnits(view: MapView, level: Level, state: DeltaState, alpha: number, palette: Palette): void {
  const { context } = view;
  for (const unit of state.transit) {
    const channel = level.channels[unit.channel]!;
    const [a, b] = ends(level, channel);
    const [from, to] = unit.towards === 'b' ? [a, b] : [b, a];
    const share = Math.min(unit.progress + alpha, channel.duration) / channel.duration;
    context.fillStyle = palette[unit.side];
    traceShape(context, unit.side, { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share }, UNIT_RADIUS);
    context.fill();
  }
}

function drawBasins(view: MapView, level: Level, state: DeltaState, palette: Palette): void {
  const { context } = view;
  for (const [index, basin] of state.basins.entries()) {
    const { at, size } = level.basins[index]!;
    const { radius } = BASIN_SIZES[size];
    const color = sideColor(palette, basin.owner);

    context.strokeStyle = color;
    context.lineWidth = RING_WIDTH;
    context.globalAlpha = RING_OPACITY;
    for (let ring = 0; ring < RINGS[size]; ring++) {
      context.beginPath();
      context.arc(at.x, at.y, radius + RING_GAP + ring * RING_SPACING, 0, 2 * Math.PI);
      context.stroke();
    }
    context.globalAlpha = 1;

    if (basin.owner === 'neutral') {
      context.fillStyle = palette.water;
      context.lineWidth = NEUTRAL_WIDTH;
      context.setLineDash(NEUTRAL_DASH);
      context.beginPath();
      context.arc(at.x, at.y, radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
      context.setLineDash([]);
      continue;
    }
    const halo = context.createRadialGradient(at.x, at.y, radius, at.x, at.y, radius * HALO_SCALE);
    halo.addColorStop(0, color);
    halo.addColorStop(1, 'transparent');
    context.globalAlpha = HALO_OPACITY;
    context.fillStyle = halo;
    context.beginPath();
    context.arc(at.x, at.y, radius * HALO_SCALE, 0, 2 * Math.PI);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = color;
    traceShape(context, basin.owner, at, radius);
    context.fill();
  }
}

function drawNumbers(view: MapView, level: Level, state: DeltaState, palette: Palette): void {
  const { context } = view;
  const unit = view.scale * window.devicePixelRatio;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const [index, basin] of state.basins.entries()) {
    const { at, size } = level.basins[index]!;
    const text = String(basin.units);
    const fontSize = BASIN_SIZES[size].radius * DIGIT_SCALE * unit * (text.length > 2 ? LONG_NUMBER_SCALE : 1);
    const center = toDevice(view, at);
    context.font = `700 ${fontSize}px ${palette.font}`;
    context.fillStyle = basin.owner === 'neutral' ? palette.neutral : palette.ink;
    context.fillText(text, center.x, center.y);
  }
}

// alpha: share of the next step already elapsed, to place the units between two steps.
export function drawMap(view: MapView, level: Level, state: DeltaState, alpha: number, palette: Palette): void {
  const time = state.tick + alpha;
  useMapTransform(view);
  view.context.fillStyle = palette.water;
  view.context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  drawChannels(view, level, time, palette);
  drawChevrons(view, level, state, palette);
  drawUnits(view, level, state, alpha, palette);
  drawBasins(view, level, state, palette);
  useDeviceTransform(view);
  drawTideArcs(view, level, time, palette);
  drawNumbers(view, level, state, palette);
}
