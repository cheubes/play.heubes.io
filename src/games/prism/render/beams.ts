import type { BeamResult, Direction } from '../logic/types';
import { COLOR_NAMES, createSvgElement } from './board';

const DELTAS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// One halo path per color: its translucent stroke is painted once, so overlapping segments of a color
// do not add up. Only different colors add up, through the screen blending of their groups.
export function drawBeams(layer: SVGGElement, beams: BeamResult): void {
  const segments = new Map<number, string[]>();
  for (const step of beams.steps) {
    const [dx, dy] = DELTAS[step.direction];
    const length = step.end === 'cell' ? 1 : 0.5;
    const segment = `M ${step.from.col + 0.5} ${step.from.row + 0.5} l ${dx * length} ${dy * length}`;
    segments.set(step.color, [...(segments.get(step.color) ?? []), segment]);
  }
  layer.replaceChildren(
    ...[...segments.entries()]
      .sort(([first], [second]) => first - second)
      .map(([color, paths]) => {
        const d = paths.join(' ');
        const group = createSvgElement('g', { class: `prism-beam is-${COLOR_NAMES[color]}` });
        group.append(
          createSvgElement('path', { d, class: 'prism-beam-halo' }),
          createSvgElement('path', { d, class: 'prism-beam-core' }),
        );
        return group;
      }),
  );
}
