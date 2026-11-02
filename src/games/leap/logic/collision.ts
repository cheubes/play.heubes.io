import { CELL_SIZE, ROOM_SIZE, RUNNER_HEIGHT, RUNNER_WIDTH, SPIKE_INSET } from './types';
import type { Box, Mover, Position, Room, Tile } from './types';

export interface Landing {
  top: number;
  spring: boolean;
}

export function runnerBox(x: number, y: number): Box {
  return { x, y, width: RUNNER_WIDTH, height: RUNNER_HEIGHT };
}

export function boxesOverlap(first: Box, second: Box): boolean {
  return (
    first.x < second.x + second.width &&
    second.x < first.x + first.width &&
    first.y < second.y + second.height &&
    second.y < first.y + first.height
  );
}

export function overlappedCells(box: Box): Position[] {
  const cells: Position[] = [];
  const lastRow = Math.floor((box.y + box.height - 1) / CELL_SIZE);
  const lastCol = Math.floor((box.x + box.width - 1) / CELL_SIZE);
  for (let row = Math.floor(box.y / CELL_SIZE); row <= lastRow; row++) {
    for (let col = Math.floor(box.x / CELL_SIZE); col <= lastCol; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
}

export function tileAt(room: Room, position: Position): Tile | undefined {
  return room.tiles[position.row]?.[position.col];
}

export function isDoorClosed(tile: Tile | undefined, doorsSwapped: boolean): boolean {
  if (tile === 'door-closed-at-start') {
    return !doorsSwapped;
  }
  if (tile === 'door-open-at-start') {
    return doorsSwapped;
  }
  return false;
}

export function isSolid(room: Room, position: Position, doorsSwapped: boolean): boolean {
  if (position.row >= ROOM_SIZE) {
    return false;
  }
  if (position.row < 0 || position.col < 0 || position.col >= ROOM_SIZE) {
    return true;
  }
  const tile = tileAt(room, position);
  return tile === 'wall' || isDoorClosed(tile, doorsSwapped);
}

export function touchesTile(room: Room, box: Box, tile: Tile): boolean {
  return overlappedCells(box).some((position) => tileAt(room, position) === tile);
}

function spikeBox(tile: Tile | undefined, position: Position): Box | undefined {
  if (tile !== 'spikes-up' && tile !== 'spikes-down') {
    return undefined;
  }
  const half = CELL_SIZE / 2;
  return {
    x: position.col * CELL_SIZE + SPIKE_INSET,
    y: position.row * CELL_SIZE + (tile === 'spikes-up' ? half : 0),
    width: CELL_SIZE - 2 * SPIKE_INSET,
    height: half,
  };
}

export function touchesSpikes(room: Room, box: Box): boolean {
  return overlappedCells(box).some((position) => {
    const spikes = spikeBox(tileAt(room, position), position);
    return spikes !== undefined && boxesOverlap(box, spikes);
  });
}

export function overlapsClosingDoor(room: Room, box: Box, doorsSwapped: boolean): boolean {
  return overlappedCells(box).some((position) => isDoorClosed(tileAt(room, position), !doorsSwapped));
}

export function moverPosition(mover: Mover, tick: number): { x: number; y: number } {
  const phase = tick % mover.period;
  const progress = 2 * Math.min(phase, mover.period - phase);
  return {
    x: mover.from.col * CELL_SIZE + Math.round(((mover.to.col - mover.from.col) * CELL_SIZE * progress) / mover.period),
    y: mover.from.row * CELL_SIZE + Math.round(((mover.to.row - mover.from.row) * CELL_SIZE * progress) / mover.period),
  };
}

function overlapsHorizontally(x: number, left: number, width: number): boolean {
  return x < left + width && left < x + RUNNER_WIDTH;
}

export function carryingMover(room: Room, x: number, bottom: number, tick: number): Mover | undefined {
  return room.movers.find((mover) => {
    const position = moverPosition(mover, tick);
    return position.y === bottom && overlapsHorizontally(x, position.x, mover.length * CELL_SIZE);
  });
}

export function moveHorizontally(
  room: Room,
  doorsSwapped: boolean,
  x: number,
  y: number,
  dx: number,
): { x: number; blocked: boolean } {
  const solids = overlappedCells(runnerBox(x + dx, y)).filter((position) => isSolid(room, position, doorsSwapped));
  if (dx === 0 || solids.length === 0) {
    return { x: x + dx, blocked: false };
  }
  const contact =
    dx > 0
      ? Math.min(...solids.map((position) => position.col * CELL_SIZE)) - RUNNER_WIDTH
      : Math.max(...solids.map((position) => (position.col + 1) * CELL_SIZE));
  return { x: contact, blocked: true };
}

export function moveUp(room: Room, doorsSwapped: boolean, x: number, y: number, dy: number): { y: number; blocked: boolean } {
  const solids = overlappedCells(runnerBox(x, y + dy)).filter((position) => isSolid(room, position, doorsSwapped));
  if (solids.length === 0) {
    return { y: y + dy, blocked: false };
  }
  return { y: Math.max(...solids.map((position) => (position.row + 1) * CELL_SIZE)), blocked: true };
}

function higherLanding(current: Landing | undefined, candidate: Landing): Landing {
  if (current === undefined || candidate.top < current.top || (candidate.top === current.top && candidate.spring)) {
    return candidate;
  }
  return current;
}

// A spring is a surface at the bottom of its cell, level with the floor under it: walking onto it triggers it.
export function findLanding(
  room: Room,
  doorsSwapped: boolean,
  x: number,
  previousBottom: number,
  nextBottom: number,
  previousTick: number,
  tick: number,
): Landing | undefined {
  let landing: Landing | undefined;
  const lastCol = Math.floor((x + RUNNER_WIDTH - 1) / CELL_SIZE);
  for (let col = Math.floor(x / CELL_SIZE); col <= lastCol; col++) {
    for (let row = Math.floor(previousBottom / CELL_SIZE) - 1; row <= Math.floor(nextBottom / CELL_SIZE); row++) {
      const position = { row, col };
      const top = row * CELL_SIZE;
      const bottom = top + CELL_SIZE;
      if (
        top >= previousBottom &&
        top <= nextBottom &&
        (isSolid(room, position, doorsSwapped) || tileAt(room, position) === 'platform')
      ) {
        landing = higherLanding(landing, { top, spring: false });
      }
      if (bottom >= previousBottom && bottom <= nextBottom && tileAt(room, position) === 'spring') {
        landing = higherLanding(landing, { top: bottom, spring: true });
      }
    }
  }
  for (const mover of room.movers) {
    const previous = moverPosition(mover, previousTick);
    const current = moverPosition(mover, tick);
    if (
      previousBottom <= previous.y &&
      nextBottom >= current.y &&
      overlapsHorizontally(x, current.x, mover.length * CELL_SIZE)
    ) {
      landing = higherLanding(landing, { top: current.y, spring: false });
    }
  }
  return landing;
}
