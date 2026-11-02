import type { Level, LevelSource, Mover, MoverSource, Position, Room, RoomSource, Tile } from './types';

const TILES: Record<string, Tile> = {
  '.': 'empty',
  '#': 'wall',
  '^': 'spikes-up',
  v: 'spikes-down',
  '-': 'platform',
  s: 'spring',
  l: 'lever',
  D: 'door-closed-at-start',
  d: 'door-open-at-start',
  E: 'entry',
  X: 'exit',
  c: 'cog',
};

function parseMover(source: MoverSource): Mover {
  return {
    from: { col: source.from[0], row: source.from[1] },
    to: { col: source.to[0], row: source.to[1] },
    length: source.length,
    period: source.period,
  };
}

function parseRoom(levelId: string, roomNumber: number, source: RoomSource): Room {
  const tiles: Tile[][] = [];
  let entry: Position | undefined;
  for (const [row, line] of source.grid.entries()) {
    const tileRow: Tile[] = [];
    for (const [col, char] of [...line].entries()) {
      const tile = TILES[char];
      if (tile === undefined) {
        throw new Error(`Level ${levelId}, room ${roomNumber}: unknown character "${char}" at ${row},${col}`);
      }
      if (tile === 'entry') {
        entry = { row, col };
      }
      tileRow.push(tile);
    }
    tiles.push(tileRow);
  }
  if (entry === undefined) {
    throw new Error(`Level ${levelId}, room ${roomNumber}: no entry`);
  }
  return { tiles, facing: source.facing, entry, movers: (source.movers ?? []).map(parseMover) };
}

export function parseLevel(source: LevelSource): Level {
  return {
    id: source.id,
    rooms: [parseRoom(source.id, 1, source.rooms[0]), parseRoom(source.id, 2, source.rooms[1])],
  };
}
