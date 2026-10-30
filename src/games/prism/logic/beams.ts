import type { BeamResult, BeamStep, BoardElement, Direction, Level, MirrorOrientation, Position, PrismSpin, PrismState } from './types';

const RED = 1;
const GREEN = 2;
const BLUE = 4;

const STEPS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

const REFLECTIONS: Record<MirrorOrientation, Record<Direction, Direction>> = {
  slash: { right: 'up', left: 'down', up: 'right', down: 'left' },
  backslash: { right: 'down', left: 'up', up: 'left', down: 'right' },
};

const LEFT_TURNS: Record<Direction, Direction> = { right: 'up', up: 'left', left: 'down', down: 'right' };
const RIGHT_TURNS: Record<Direction, Direction> = { right: 'down', down: 'left', left: 'up', up: 'right' };

interface Ray {
  position: Position;
  direction: Direction;
  color: number;
}

function positionKey(position: Position): string {
  return `${position.row},${position.col}`;
}

function mirrorOrientation(element: Extract<BoardElement, { type: 'mirror' }>, state: PrismState): MirrorOrientation {
  if (!state.toggled.has(element.id)) {
    return element.orientation;
  }
  return element.orientation === 'slash' ? 'backslash' : 'slash';
}

function prismSpin(element: Extract<BoardElement, { type: 'prism' }>, state: PrismState): PrismSpin {
  if (!state.toggled.has(element.id)) {
    return element.spin;
  }
  return element.spin === 'left' ? 'right' : 'left';
}

function splitDirection(primary: number, direction: Direction, spin: PrismSpin): Direction {
  if (primary === GREEN) {
    return direction;
  }
  const turnsLeft = (primary === RED) === (spin === 'left');
  return turnsLeft ? LEFT_TURNS[direction] : RIGHT_TURNS[direction];
}

export function computeBeams(level: Level, state: PrismState): BeamResult {
  const elementsByPosition = new Map(level.elements.map((element) => [positionKey(element.position), element]));
  const steps: BeamStep[] = [];
  const received: Record<string, number> = {};
  const pending: Ray[] = [];
  const processed = new Set<string>();

  for (const element of level.elements) {
    if (element.type === 'target') {
      received[element.id] = 0;
    } else if (element.type === 'source') {
      pending.push({ position: element.position, direction: element.direction, color: element.color });
    }
  }

  for (let ray = pending.shift(); ray !== undefined; ray = pending.shift()) {
    const { position, direction, color } = ray;
    const rayKey = `${positionKey(position)},${direction},${color}`;
    if (processed.has(rayKey)) {
      continue;
    }
    processed.add(rayKey);

    const step = STEPS[direction];
    const next = { row: position.row + step.row, col: position.col + step.col };
    const element = elementsByPosition.get(positionKey(next));
    const outside = next.row < 0 || next.row >= level.rows || next.col < 0 || next.col >= level.cols;
    if (outside || element?.type === 'wall' || element?.type === 'source') {
      steps.push({ from: position, direction, color, end: 'blocked' });
      continue;
    }
    steps.push({ from: position, direction, color, end: 'cell' });

    switch (element?.type) {
      case undefined:
        pending.push({ position: next, direction, color });
        break;
      case 'target':
        received[element.id] = (received[element.id] ?? 0) | color;
        break;
      case 'mirror':
        pending.push({ position: next, direction: REFLECTIONS[mirrorOrientation(element, state)][direction], color });
        break;
      case 'prism': {
        const spin = prismSpin(element, state);
        for (const primary of [RED, GREEN, BLUE]) {
          if ((color & primary) !== 0) {
            pending.push({ position: next, direction: splitDirection(primary, direction, spin), color: primary });
          }
        }
        break;
      }
      case 'filter': {
        const passing = color & element.color;
        if (passing !== 0) {
          pending.push({ position: next, direction, color: passing });
        }
        break;
      }
    }
  }

  const lit: Record<string, boolean> = {};
  for (const element of level.elements) {
    if (element.type === 'target') {
      lit[element.id] = received[element.id] === element.color;
    }
  }
  return { steps, received, lit };
}
