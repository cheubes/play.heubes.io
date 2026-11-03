import { UNIT_SPEED } from './types';
import type { Basin, Channel, Level, Link, LevelSource } from './types';

export function parseLevel(source: LevelSource): Level {
  const indexOf = (id: string): number => {
    const index = source.basins.findIndex((basin) => basin.id === id);
    if (index === -1) {
      throw new Error(`Level ${source.id}: unknown basin "${id}"`);
    }
    return index;
  };

  const channels: Channel[] = source.channels.map(({ between, tide }) => {
    const a = indexOf(between[0]);
    const b = indexOf(between[1]);
    const [ax, ay] = source.basins[a]!.at;
    const [bx, by] = source.basins[b]!.at;
    const length = Math.hypot(bx - ax, by - ay);
    return { a, b, length, duration: Math.ceil(length / UNIT_SPEED), tide: tide ?? null };
  });

  const basins: Basin[] = source.basins.map((basin, index) => {
    const links: Link[] = [];
    for (const [channel, { a, b }] of channels.entries()) {
      if (a === index) {
        links.push({ channel, basin: b });
      } else if (b === index) {
        links.push({ channel, basin: a });
      }
    }
    return {
      id: basin.id,
      at: { x: basin.at[0], y: basin.at[1] },
      size: basin.size,
      owner: basin.owner,
      units: basin.units,
      links,
    };
  });

  return { id: source.id, seed: source.seed, rival: source.rival, basins, channels };
}
