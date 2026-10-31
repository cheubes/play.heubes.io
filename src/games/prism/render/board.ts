import type { BeamResult, BoardElement, ColorName, Direction, Level, Position, PrismState } from '../logic/types';

export interface BoardView {
  element: SVGSVGElement;
  beams: SVGGElement;
  cursor: SVGRectElement;
  bodies: Map<string, SVGGElement>;
  targets: Map<string, { element: SVGGElement; sectors: SVGGElement }>;
}

type Mirror = Extract<BoardElement, { type: 'mirror' }>;
type Prism = Extract<BoardElement, { type: 'prism' }>;

type SectorState = 'empty' | 'expected' | 'received' | 'extra';

export const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_CELL_SIZE = 72;

export const COLOR_NAMES: Record<number, ColorName> = {
  1: 'red',
  2: 'green',
  3: 'yellow',
  4: 'blue',
  5: 'magenta',
  6: 'cyan',
  7: 'white',
};

// Fixed positions, so that a sector reads by its place as well as by its color.
const SECTORS = [
  { primary: 1, angle: -90 },
  { primary: 2, angle: 30 },
  { primary: 4, angle: 150 },
] as const;

const NOTCH_ANGLES: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };

const DEFS = `
  <pattern id="prism-hatch" patternUnits="userSpaceOnUse" width="0.06" height="0.06" patternTransform="rotate(45)">
    <rect class="prism-hatch-stripe" width="0.03" height="0.06" />
  </pattern>
  <linearGradient id="prism-mirror-sheen" x1="0" y1="0" x2="0" y2="1">
    <stop class="prism-sheen-edge" offset="0" />
    <stop class="prism-sheen-light" offset="0.35" />
    <stop class="prism-sheen-edge" offset="0.65" />
    <stop class="prism-sheen-shade" offset="1" />
  </linearGradient>
`;

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [round(cx + radius * Math.cos(radians)), round(cy + radius * Math.sin(radians))];
}

// Each sector is pushed out along its bisector, which opens an even gap between neighbours.
function sectorPath(cx: number, cy: number, radius: number, angle: number): string {
  const gap = radius * 0.12;
  const [apexX, apexY] = polar(cx, cy, gap, angle);
  const outer = radius - gap;
  const [startX, startY] = polar(apexX, apexY, outer, angle - 60);
  const [endX, endY] = polar(apexX, apexY, outer, angle + 60);
  return `M ${apexX} ${apexY} L ${startX} ${startY} A ${round(outer)} ${round(outer)} 0 0 1 ${endX} ${endY} Z`;
}

function crossPath(cx: number, cy: number, radius: number, angle: number): string {
  const [x, y] = polar(cx, cy, radius * 0.58, angle);
  const size = round(radius * 0.2);
  return `M ${round(x - size)} ${round(y - size)} l ${2 * size} ${2 * size} M ${round(x - size)} ${round(y + size)} l ${2 * size} ${-2 * size}`;
}

function fillSectors(group: SVGGElement, cx: number, cy: number, radius: number, states: SectorState[]): void {
  group.replaceChildren();
  SECTORS.forEach(({ primary, angle }, index) => {
    const state = states[index] ?? 'empty';
    if (state === 'empty') {
      return;
    }
    const d = sectorPath(cx, cy, radius, angle);
    group.append(createSvgElement('path', { d, class: `prism-sector is-${state} is-${COLOR_NAMES[primary]}` }));
    if (state === 'extra') {
      const cross = crossPath(cx, cy, radius, angle);
      group.append(
        createSvgElement('path', { d, class: 'prism-sector-hatch' }),
        createSvgElement('path', { d: cross, class: 'prism-sector-cross-outline' }),
        createSvgElement('path', { d: cross, class: 'prism-sector-cross' }),
      );
    }
  });
}

function createSectors(cx: number, cy: number, radius: number, color: number): SVGGElement {
  const group = createSvgElement('g', { class: 'prism-sectors' });
  fillSectors(
    group,
    cx,
    cy,
    radius,
    SECTORS.map(({ primary }) => (color & primary ? 'received' : 'empty')),
  );
  return group;
}

function createRivets(points: [number, number][]): SVGCircleElement[] {
  return points.map(([cx, cy]) => createSvgElement('circle', { cx, cy, r: 0.05, class: 'prism-rivet' }));
}

function createPivot(): SVGCircleElement {
  return createSvgElement('circle', { cx: 0.5, cy: 0.5, r: 0.36, class: 'prism-pivot' });
}

function createSource(group: SVGGElement, color: number, direction: Direction): void {
  const notch = createSvgElement('rect', { x: 0.84, y: 0.36, width: 0.08, height: 0.28, rx: 0.03, class: 'prism-notch' });
  notch.setAttribute('transform', `rotate(${NOTCH_ANGLES[direction]} 0.5 0.5)`);
  group.classList.add(`is-${COLOR_NAMES[color]}`);
  group.append(
    createSvgElement('rect', { x: 0.12, y: 0.12, width: 0.76, height: 0.76, rx: 0.16, class: 'prism-housing' }),
    notch,
    createSvgElement('circle', { cx: 0.5, cy: 0.5, r: 0.24, class: 'prism-sector-base' }),
    createSectors(0.5, 0.5, 0.22, color),
  );
}

function createTarget(group: SVGGElement): SVGGElement {
  const sectors = createSvgElement('g', { class: 'prism-sectors' });
  const check = 'M 0.42 0.5 L 0.48 0.56 L 0.59 0.44';
  group.append(
    createSvgElement('circle', { cx: 0.5, cy: 0.5, r: 0.44, class: 'prism-target-glow' }),
    createSvgElement('circle', { cx: 0.5, cy: 0.5, r: 0.42, class: 'prism-target-disk' }),
    createSvgElement('circle', { cx: 0.5, cy: 0.5, r: 0.44, class: 'prism-target-ring' }),
    sectors,
    createSvgElement('path', { d: check, class: 'prism-target-check-outline' }),
    createSvgElement('path', { d: check, class: 'prism-target-check' }),
  );
  return sectors;
}

function createMirrorBody(fixed: boolean): SVGGElement {
  const body = createSvgElement('g', { class: 'prism-body' });
  body.append(
    createSvgElement('rect', {
      x: 0.08,
      y: 0.45,
      width: 0.84,
      height: 0.1,
      rx: 0.03,
      transform: 'rotate(-45 0.5 0.5)',
      class: 'prism-mirror-bar',
    }),
  );
  if (fixed) {
    body.append(...createRivets([[0.27, 0.73], [0.73, 0.27]]));
  }
  return body;
}

function createPrismBody(fixed: boolean): SVGGElement {
  const body = createSvgElement('g', { class: 'prism-body' });
  body.append(createSvgElement('polygon', { points: '0.5,0.14 0.86,0.8 0.14,0.8', class: 'prism-glass' }));
  // Drawn for a beam travelling right: red leaves upwards, on the left of the beam.
  for (const [color, angle] of [['red', -30], ['green', 0], ['blue', 30]] as const) {
    const [x, y] = polar(0.36, 0.56, 0.24, angle);
    body.append(createSvgElement('line', { x1: 0.36, y1: 0.56, x2: x, y2: y, class: `prism-fan is-${color}` }));
  }
  body.append(createSvgElement('circle', { cx: 0.36, cy: 0.56, r: 0.035, class: 'prism-fan-origin' }));
  if (fixed) {
    body.append(...createRivets([[0.27, 0.73], [0.73, 0.73]]));
  }
  return body;
}

function createFilter(group: SVGGElement, color: number): void {
  group.classList.add(`is-${COLOR_NAMES[color]}`);
  group.append(
    createSvgElement('rect', { x: 0.14, y: 0.14, width: 0.72, height: 0.72, rx: 0.06, class: 'prism-filter-glass' }),
    createSvgElement('circle', { cx: 0.68, cy: 0.32, r: 0.13, class: 'prism-sector-base' }),
    createSectors(0.68, 0.32, 0.12, color),
  );
}

function createElement(view: BoardView, element: BoardElement): SVGGElement {
  const { row, col } = element.position;
  const group = createSvgElement('g', { class: `prism-element is-${element.type}`, transform: `translate(${col} ${row})` });
  switch (element.type) {
    case 'wall':
      group.append(createSvgElement('rect', { width: 1, height: 1, class: 'prism-wall' }));
      break;
    case 'source':
      createSource(group, element.color, element.direction);
      break;
    case 'target':
      view.targets.set(element.id, { element: group, sectors: createTarget(group) });
      break;
    case 'mirror':
    case 'prism': {
      const body = element.type === 'mirror' ? createMirrorBody(element.fixed) : createPrismBody(element.fixed);
      if (!element.fixed) {
        group.append(createPivot());
      }
      group.classList.toggle('is-fixed', element.fixed);
      group.append(body);
      view.bodies.set(element.id, body);
      break;
    }
    case 'filter':
      createFilter(group, element.color);
      break;
  }
  return group;
}

export function createBoardView(level: Level): BoardView {
  const element = createSvgElement('svg', { viewBox: `0 0 ${level.cols} ${level.rows}`, class: 'prism-board', 'aria-hidden': 'true' });
  const defs = createSvgElement('defs');
  defs.innerHTML = DEFS;

  const grid = createSvgElement('g', { class: 'prism-grid' });
  for (let row = 1; row < level.rows; row += 1) {
    for (let col = 1; col < level.cols; col += 1) {
      grid.append(createSvgElement('circle', { cx: col, cy: row, r: 0.035, class: 'prism-grid-dot' }));
    }
  }

  const beams = createSvgElement('g', { class: 'prism-beams' });
  const elements = createSvgElement('g', { class: 'prism-elements' });
  const cursor = createSvgElement('rect', { width: 0.94, height: 0.94, rx: 0.16, class: 'prism-cursor is-hidden' });
  const hits = createSvgElement('g', { class: 'prism-hits' });
  for (let row = 0; row < level.rows; row += 1) {
    for (let col = 0; col < level.cols; col += 1) {
      hits.append(createSvgElement('rect', { x: col, y: row, width: 1, height: 1, 'data-row': row, 'data-col': col, class: 'prism-hit' }));
    }
  }
  element.append(defs, grid, beams, elements, cursor, hits);

  const view: BoardView = { element, beams, cursor, bodies: new Map(), targets: new Map() };
  elements.append(...level.elements.map((boardElement) => createElement(view, boardElement)));
  return view;
}

export function isSlash(mirror: Mirror, state: PrismState): boolean {
  return (mirror.orientation === 'slash') !== state.toggled.has(mirror.id);
}

export function isSpinLeft(prism: Prism, state: PrismState): boolean {
  return (prism.spin === 'left') !== state.toggled.has(prism.id);
}

export function placeElements(view: BoardView, level: Level, state: PrismState): void {
  for (const element of level.elements) {
    const body = view.bodies.get(element.id);
    if (!body || (element.type !== 'mirror' && element.type !== 'prism')) {
      continue;
    }
    if (element.type === 'mirror') {
      body.setAttribute('transform', isSlash(element, state) ? '' : 'rotate(90 0.5 0.5)');
    } else {
      body.setAttribute('transform', isSpinLeft(element, state) ? '' : 'matrix(-1 0 0 1 1 0)');
    }
  }
}

export function placeCursor(view: BoardView, position: Position | undefined, visible: boolean): void {
  view.cursor.classList.toggle('is-hidden', !visible || position === undefined);
  if (position) {
    view.cursor.setAttribute('x', String(position.col + 0.03));
    view.cursor.setAttribute('y', String(position.row + 0.03));
  }
}

export function updateTargets(view: BoardView, level: Level, beams: BeamResult): void {
  for (const element of level.elements) {
    const target = view.targets.get(element.id);
    if (!target || element.type !== 'target') {
      continue;
    }
    const received = beams.received[element.id] ?? 0;
    target.element.classList.toggle('is-lit', beams.lit[element.id] ?? false);
    fillSectors(
      target.sectors,
      0.5,
      0.5,
      0.32,
      SECTORS.map(({ primary }) => {
        const isExpected = (element.color & primary) !== 0;
        const isReceived = (received & primary) !== 0;
        if (isExpected) {
          return isReceived ? 'received' : 'expected';
        }
        return isReceived ? 'extra' : 'empty';
      }),
    );
  }
}

export function fitBoard(container: HTMLElement, view: BoardView, level: Level): void {
  const margin = parseFloat(getComputedStyle(container).getPropertyValue('--space-4'));
  const cellSize = Math.max(
    0,
    Math.min(
      MAX_CELL_SIZE,
      Math.floor((container.clientWidth - 2 * margin) / level.cols),
      Math.floor((container.clientHeight - 2 * margin) / level.rows),
    ),
  );
  view.element.setAttribute('width', String(level.cols * cellSize));
  view.element.setAttribute('height', String(level.rows * cellSize));
}
