export type SelectionDirection = 'up' | 'down' | 'left' | 'right';

export interface SelectionPoint {
  x: number;
  y: number;
}

// The candidate nearest to `from` in the direction, favoring those in line with it; `from` when there is none.
// Positions are on screen: y grows downwards.
export function nextSelection<T>(
  candidates: readonly T[],
  from: T,
  direction: SelectionDirection,
  positionOf: (candidate: T) => SelectionPoint,
): T {
  const origin = positionOf(from);
  let best = from;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const position = positionOf(candidate);
    const xOffset = position.x - origin.x;
    const yOffset = position.y - origin.y;
    const [axis, perpendicular] =
      direction === 'up'
        ? [-yOffset, xOffset]
        : direction === 'down'
          ? [yOffset, xOffset]
          : direction === 'left'
            ? [-xOffset, yOffset]
            : [xOffset, yOffset];
    const score = axis + 2 * Math.abs(perpendicular);
    if (axis > 0 && score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}
