import { isChannelOpen } from '../logic/simulation';
import { BASIN_SIZES, MAP_HEIGHT, MAP_WIDTH } from '../logic/types';
import type { BasinSize, Channel, DeltaState, Level, Owner, Point, Side, Unit } from '../logic/types';
import { toDevice, useDeviceTransform, useMapTransform, type MapView } from './canvas';
import type { FrameEffects } from './effects';

const PALETTE_PROPERTIES = {
  water: '--delta-water',
  channel: '--delta-channel',
  player: '--delta-player',
  rival: '--delta-rival',
  neutral: '--delta-neutral',
  ink: '--delta-ink',
  text: '--color-text',
  accent: '--color-accent',
  font: '--font-display',
} as const;

export type Palette = Record<keyof typeof PALETTE_PROPERTIES, string>;

export interface Overlay {
  effects: FrameEffects;
  // Selected source basin.
  source?: number;
  // End of the drag line, in CSS pixels on the canvas.
  drag?: Point;
  cursor?: number;
}

const CHANNEL_WIDTH = 0.18;
const WAVE_AMPLITUDE = 0.06;
const WAVE_LENGTH = 0.5;
const CLOSED_DASH = [0.2, 0.15];
const CLOSED_OPACITY = 0.4;
const TIDE_FADE_STEPS = 3;
const TIDE_ARC_RADIUS = 0.3;
const TIDE_ARC_WIDTH = 0.04;
const CHEVRON_SPACING = 0.5;
const CHEVRON_HALF_WIDTH = 0.1;
const CHEVRON_DEPTH = 0.07;
const CHEVRON_WIDTH = 0.05;
const CHEVRON_CLEARANCE = 0.3;
const UNIT_RADIUS = 0.06;
const TRAIL_OPACITIES = [0.6, 0.4, 0.2];
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
const DIMMED_OPACITY = 0.5;
const SOURCE_RING_GAP = 0.03;
const SOURCE_RING_WIDTH = 0.05;
const DRAG_WIDTH = 2;
const DRAG_DASH = [6, 6];
const CURSOR_GAP = 0.08;
const CURSOR_WIDTH = 2;
const CAPTURE_WAVE_REACH = 1;
const CAPTURE_WAVE_WIDTH = 0.06;
const PULSE_SCALE = 0.2;

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

// Opacity of each channel and basin: with a selected source, all but its channels and neighbors are dimmed.
interface Emphasis {
  channel(index: number): number;
  basin(index: number): number;
}

function emphasis(level: Level, source: number | undefined): Emphasis {
  if (source === undefined) {
    return { channel: () => 1, basin: () => 1 };
  }
  const links = level.basins[source]!.links;
  const channels = new Set(links.map((link) => link.channel));
  const basins = new Set([source, ...links.map((link) => link.basin)]);
  return {
    channel: (index) => (channels.has(index) ? 1 : DIMMED_OPACITY),
    basin: (index) => (basins.has(index) ? 1 : DIMMED_OPACITY),
  };
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

// Opacity of a channel bed: an opening or closing channel fills or empties over a few steps.
function bedOpacity(channel: Channel, time: number, fade: boolean): number {
  const open = isChannelOpen(channel, Math.floor(time));
  if (channel.tide === null || !fade) {
    return open ? 1 : CLOSED_OPACITY;
  }
  const { open: openSteps, closed, phase } = channel.tide;
  const position = (time + phase) % (openSteps + closed);
  const sinceChange = position < openSteps ? position : position - openSteps;
  if (sinceChange >= TIDE_FADE_STEPS || time - sinceChange <= 0) {
    return open ? 1 : CLOSED_OPACITY;
  }
  const share = sinceChange / TIDE_FADE_STEPS;
  return open ? CLOSED_OPACITY + (1 - CLOSED_OPACITY) * share : 1 - (1 - CLOSED_OPACITY) * share;
}

function drawChannels(view: MapView, level: Level, time: number, palette: Palette, overlay: Overlay, focus: Emphasis): void {
  const { context } = view;
  context.strokeStyle = palette.channel;
  context.lineWidth = CHANNEL_WIDTH;
  context.lineCap = 'round';
  for (const [index, channel] of level.channels.entries()) {
    const open = isChannelOpen(channel, Math.floor(time));
    context.globalAlpha = bedOpacity(channel, time, overlay.effects.tideFade) * focus.channel(index);
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

function drawTideArcs(view: MapView, level: Level, time: number, palette: Palette, focus: Emphasis): void {
  const { context } = view;
  const unit = view.scale * window.devicePixelRatio;
  context.strokeStyle = palette.channel;
  context.lineWidth = TIDE_ARC_WIDTH * unit;
  context.lineCap = 'round';
  for (const [index, channel] of level.channels.entries()) {
    if (channel.tide === null) {
      continue;
    }
    const [a, b] = ends(level, channel);
    const center = toDevice(view, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const start = -Math.PI / 2;
    context.globalAlpha = focus.channel(index);
    context.beginPath();
    context.arc(center.x, center.y, TIDE_ARC_RADIUS * unit, start, start + 2 * Math.PI * tideRemaining(channel, time));
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawChevrons(view: MapView, level: Level, state: DeltaState, palette: Palette, overlay: Overlay, focus: Emphasis): void {
  const { context } = view;
  const shift = overlay.effects.chevronShift % CHEVRON_SPACING;
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
    context.globalAlpha = focus.channel(basin.output);
    context.beginPath();
    for (let distance = first + shift; distance <= last; distance += CHEVRON_SPACING) {
      const tip = along(from, to, distance + CHEVRON_DEPTH);
      const back = along(from, to, distance - CHEVRON_DEPTH);
      context.moveTo(back.x - direction.y * CHEVRON_HALF_WIDTH, back.y + direction.x * CHEVRON_HALF_WIDTH);
      context.lineTo(tip.x, tip.y);
      context.lineTo(back.x + direction.y * CHEVRON_HALF_WIDTH, back.y - direction.x * CHEVRON_HALF_WIDTH);
    }
    context.stroke();
  }
  context.globalAlpha = 1;
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

// opacities: the unit, then its trail.
function drawUnit(context: CanvasRenderingContext2D, level: Level, unit: Unit, alpha: number, opacities: readonly number[], palette: Palette): void {
  const channel = level.channels[unit.channel]!;
  const [a, b] = ends(level, channel);
  const [from, to] = unit.towards === 'b' ? [a, b] : [b, a];
  const position = Math.min(unit.progress + alpha, channel.duration);
  context.fillStyle = palette[unit.side];
  for (const [step, opacity] of opacities.entries()) {
    const share = (position - step) / channel.duration;
    if (share < 0) {
      break;
    }
    context.globalAlpha = opacity;
    traceShape(context, unit.side, { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share }, UNIT_RADIUS);
    context.fill();
  }
}

function drawUnits(view: MapView, level: Level, state: DeltaState, alpha: number, palette: Palette, overlay: Overlay, focus: Emphasis): void {
  const { context } = view;
  const trail = overlay.effects.trails ? TRAIL_OPACITIES : [];
  for (const unit of state.transit) {
    const opacity = focus.channel(unit.channel);
    drawUnit(context, level, unit, alpha, [1, ...trail].map((trailOpacity) => opacity * trailOpacity), palette);
  }
  const { fading } = overlay.effects;
  for (const unit of fading?.units ?? []) {
    drawUnit(context, level, unit, 0, [1 - fading!.progress], palette);
  }
  context.globalAlpha = 1;
}

function drawBasinBody(context: CanvasRenderingContext2D, owner: Owner, at: Point, radius: number, palette: Palette, opacity: number): void {
  if (owner === 'neutral') {
    context.globalAlpha = opacity;
    context.fillStyle = palette.water;
    context.strokeStyle = palette.neutral;
    context.lineWidth = NEUTRAL_WIDTH;
    context.setLineDash(NEUTRAL_DASH);
    context.beginPath();
    context.arc(at.x, at.y, radius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.setLineDash([]);
    return;
  }
  const color = palette[owner];
  const halo = context.createRadialGradient(at.x, at.y, radius, at.x, at.y, radius * HALO_SCALE);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'transparent');
  context.globalAlpha = opacity * HALO_OPACITY;
  context.fillStyle = halo;
  context.beginPath();
  context.arc(at.x, at.y, radius * HALO_SCALE, 0, 2 * Math.PI);
  context.fill();
  context.globalAlpha = opacity;
  context.fillStyle = color;
  traceShape(context, owner, at, radius);
  context.fill();
}

function drawBasins(view: MapView, level: Level, state: DeltaState, palette: Palette, overlay: Overlay, focus: Emphasis): void {
  const { context } = view;
  for (const [index, basin] of state.basins.entries()) {
    const { at, size } = level.basins[index]!;
    const { radius } = BASIN_SIZES[size];
    const opacity = focus.basin(index);

    context.strokeStyle = sideColor(palette, basin.owner);
    context.lineWidth = RING_WIDTH;
    context.globalAlpha = opacity * RING_OPACITY;
    for (let ring = 0; ring < RINGS[size]; ring++) {
      context.beginPath();
      context.arc(at.x, at.y, radius + RING_GAP + ring * RING_SPACING, 0, 2 * Math.PI);
      context.stroke();
    }

    const { fading } = overlay.effects;
    const crossFade = fading?.basins.includes(index)
      ? { from: 'player' as const, progress: fading.progress }
      : overlay.effects.captures.find((candidate) => candidate.basin === index);
    const pulse = overlay.effects.pulses.find((candidate) => candidate.basin === index);
    const bodyRadius = radius * (1 + PULSE_SCALE * Math.sin(Math.PI * (pulse?.progress ?? 0)));
    if (crossFade) {
      drawBasinBody(context, crossFade.from, at, bodyRadius, palette, opacity * (1 - crossFade.progress));
    }
    drawBasinBody(context, basin.owner, at, bodyRadius, palette, opacity * (crossFade?.progress ?? 1));
  }
  context.globalAlpha = 1;

  context.lineWidth = CAPTURE_WAVE_WIDTH;
  for (const { basin, to, progress } of overlay.effects.captures) {
    const { at, size } = level.basins[basin]!;
    context.globalAlpha = 1 - progress;
    context.strokeStyle = palette[to];
    context.beginPath();
    context.arc(at.x, at.y, BASIN_SIZES[size].radius + CAPTURE_WAVE_REACH * progress, 0, 2 * Math.PI);
    context.stroke();
  }
  context.globalAlpha = 1;

  if (overlay.source !== undefined) {
    const { at, size } = level.basins[overlay.source]!;
    context.strokeStyle = palette.text;
    context.lineWidth = SOURCE_RING_WIDTH;
    context.beginPath();
    context.arc(at.x, at.y, BASIN_SIZES[size].radius + SOURCE_RING_GAP, 0, 2 * Math.PI);
    context.stroke();
  }
}

function drawNumbers(view: MapView, level: Level, state: DeltaState, palette: Palette, focus: Emphasis): void {
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
    context.globalAlpha = focus.basin(index);
    context.fillText(text, center.x, center.y);
  }
  context.globalAlpha = 1;
}

function drawDrag(view: MapView, level: Level, source: number, end: Point, palette: Palette): void {
  const { context } = view;
  const ratio = window.devicePixelRatio;
  const { at, size } = level.basins[source]!;
  const center = toDevice(view, at);
  const target = { x: end.x * ratio, y: end.y * ratio };
  const length = Math.hypot(target.x - center.x, target.y - center.y);
  const radius = BASIN_SIZES[size].radius * view.scale * ratio;
  if (length <= radius) {
    return;
  }
  // From the edge of the source, so that the line does not cross its number.
  const start = { x: center.x + ((target.x - center.x) * radius) / length, y: center.y + ((target.y - center.y) * radius) / length };
  context.strokeStyle = palette.player;
  context.lineWidth = DRAG_WIDTH * ratio;
  context.setLineDash(DRAG_DASH.map((dash) => dash * ratio));
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(target.x, target.y);
  context.stroke();
  context.setLineDash([]);
}

function drawCursor(view: MapView, level: Level, cursor: number, palette: Palette): void {
  const { context } = view;
  const { at, size } = level.basins[cursor]!;
  const unit = view.scale * window.devicePixelRatio;
  const radius = BASIN_SIZES[size].radius + RING_GAP + (RINGS[size] - 1) * RING_SPACING + CURSOR_GAP;
  const center = toDevice(view, at);
  context.strokeStyle = palette.accent;
  context.lineWidth = CURSOR_WIDTH * window.devicePixelRatio;
  context.beginPath();
  context.arc(center.x, center.y, radius * unit, 0, 2 * Math.PI);
  context.stroke();
}

// alpha: share of the next step already elapsed, to place the units between two steps.
export function drawMap(view: MapView, level: Level, state: DeltaState, alpha: number, palette: Palette, overlay: Overlay): void {
  const time = state.tick + alpha;
  const focus = emphasis(level, overlay.source);
  useMapTransform(view);
  view.context.fillStyle = palette.water;
  view.context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  drawChannels(view, level, time, palette, overlay, focus);
  drawChevrons(view, level, state, palette, overlay, focus);
  drawUnits(view, level, state, alpha, palette, overlay, focus);
  drawBasins(view, level, state, palette, overlay, focus);
  useDeviceTransform(view);
  drawTideArcs(view, level, time, palette, focus);
  drawNumbers(view, level, state, palette, focus);
  if (overlay.source !== undefined && overlay.drag) {
    drawDrag(view, level, overlay.source, overlay.drag, palette);
  }
  if (overlay.cursor !== undefined) {
    drawCursor(view, level, overlay.cursor, palette);
  }
}
