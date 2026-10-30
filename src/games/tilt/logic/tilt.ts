import type { Cell, Direction, Level, Motion, Position, TiltState } from './types';

const STEPS: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

function cellAt(level: Level, position: Position): Cell | undefined {
  return level.cells[position.row]?.[position.col];
}

function distanceToEdge(level: Level, position: Position, direction: Direction): number {
  switch (direction) {
    case 'up':
      return position.row;
    case 'down':
      return level.rows - 1 - position.row;
    case 'left':
      return position.col;
    case 'right':
      return level.cols - 1 - position.col;
  }
}

function positionKey(position: Position): string {
  return `${position.row},${position.col}`;
}

export function createState(level: Level): TiltState {
  return { blocks: level.blocks, moves: 0, history: [] };
}

export function tilt(level: Level, state: TiltState, direction: Direction): { state: TiltState; motions: Motion[] } {
  const step = STEPS[direction];
  const order = [...state.blocks].sort(
    (first, second) =>
      distanceToEdge(level, first.position, direction) - distanceToEdge(level, second.position, direction),
  );
  const occupied = new Set<string>();
  const destinations = new Map<string, Position>();
  const motions: Motion[] = [];

  for (const block of order) {
    let position = block.position;
    let stoppedBy: Motion['stoppedBy'];
    while (true) {
      const next = { row: position.row + step.row, col: position.col + step.col };
      const cell = cellAt(level, next);
      if (cell === undefined || cell.type === 'wall') {
        stoppedBy = 'wall';
        break;
      }
      if (occupied.has(positionKey(next))) {
        stoppedBy = 'block';
        break;
      }
      position = next;
      if (cell.type === 'sticky') {
        stoppedBy = 'sticky';
        break;
      }
    }
    occupied.add(positionKey(position));
    destinations.set(block.id, position);
    if (position !== block.position) {
      motions.push({ blockId: block.id, from: block.position, to: position, stoppedBy });
    }
  }

  if (motions.length === 0) {
    return { state, motions };
  }

  const blocks = state.blocks.map((block) => {
    const position = destinations.get(block.id) ?? block.position;
    return position === block.position ? block : { ...block, position };
  });
  return {
    state: { blocks, moves: state.moves + 1, history: [...state.history, state.blocks] },
    motions,
  };
}

export function undo(state: TiltState): TiltState {
  const previous = state.history.at(-1);
  if (previous === undefined) {
    return state;
  }
  return { blocks: previous, moves: state.moves - 1, history: state.history.slice(0, -1) };
}

export function restart(level: Level): TiltState {
  return createState(level);
}

export function isSolved(level: Level, state: TiltState): boolean {
  return state.blocks.every((block) => {
    if (block.kind === 'neutral') {
      return true;
    }
    const cell = cellAt(level, block.position);
    return cell?.type === 'target' && cell.color === block.color;
  });
}
