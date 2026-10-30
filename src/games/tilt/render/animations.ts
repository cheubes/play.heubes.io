import type { Direction, Motion } from '../logic/types';
import { blockTransform, type BoardView } from './board';

const SLIDE_EASING = 'cubic-bezier(0.5, 0, 0.9, 0.6)';
const REDUCED_SLIDE_DURATION = 60;
const IMPACT_DURATION = 80;
const GLOW_DURATION = 120;
const BOARD_TILT_ANGLE = 3;
const BOARD_RETURN_DURATION = 120;
const BLOCKED_TILT_ANGLE = 2;
const BLOCKED_TILT_DURATION = 160;
const VICTORY_PULSE_GAP = 80;
const VICTORY_PULSE_DURATION = 320;

const IMPACT_ORIGINS: Record<Direction, string> = {
  up: '50% 0%',
  down: '50% 100%',
  left: '0% 50%',
  right: '100% 50%',
};

function slideDuration(motion: Motion): number {
  const distance = Math.abs(motion.to.row - motion.from.row) + Math.abs(motion.to.col - motion.from.col);
  return Math.min(60 + 30 * distance, 240);
}

function boardTilt(direction: Direction, angle: number): string {
  switch (direction) {
    case 'up':
      return `perspective(900px) rotateX(${angle}deg)`;
    case 'down':
      return `perspective(900px) rotateX(${-angle}deg)`;
    case 'left':
      return `perspective(900px) rotateY(${-angle}deg)`;
    case 'right':
      return `perspective(900px) rotateY(${angle}deg)`;
  }
}

function animateImpact(element: HTMLElement, motion: Motion, direction: Direction, delay: number): void {
  if (motion.stoppedBy === 'sticky') {
    element.animate([{ scale: '1' }, { scale: '0.94' }, { scale: '1' }], { delay, duration: IMPACT_DURATION, easing: 'ease-out' });
    return;
  }
  const squash = direction === 'left' || direction === 'right' ? '0.92 1.08' : '1.08 0.92';
  const transformOrigin = IMPACT_ORIGINS[direction];
  element.animate(
    [
      { scale: '1', transformOrigin },
      { scale: squash, transformOrigin },
      { scale: '1', transformOrigin },
    ],
    { delay, duration: IMPACT_DURATION, easing: 'ease-out' },
  );
}

// Blocks are already placed at their final position, glow included: the animations only replay the move.
export function animateMove(view: BoardView, motions: readonly Motion[], direction: Direction, reducedMotion: boolean): void {
  let longestSlide = 0;
  for (const motion of motions) {
    const element = view.blocks.get(motion.blockId);
    if (!element) {
      continue;
    }
    const duration = reducedMotion ? REDUCED_SLIDE_DURATION : slideDuration(motion);
    longestSlide = Math.max(longestSlide, duration);
    element.animate([{ transform: blockTransform(motion.from) }, { transform: blockTransform(motion.to) }], {
      duration,
      easing: reducedMotion ? 'linear' : SLIDE_EASING,
    });
    if (element.classList.contains('is-on-target')) {
      element.animate([{ offset: 0, boxShadow: 'none' }], {
        delay: duration,
        duration: reducedMotion ? 0 : GLOW_DURATION,
        fill: 'backwards',
      });
    }
    if (!reducedMotion) {
      animateImpact(element, motion, direction, duration);
    }
  }

  if (!reducedMotion && longestSlide > 0) {
    const flat = boardTilt(direction, 0);
    const total = longestSlide + BOARD_RETURN_DURATION;
    view.element.animate(
      [{ transform: flat }, { transform: boardTilt(direction, BOARD_TILT_ANGLE), offset: longestSlide / total }, { transform: flat }],
      { duration: total, easing: 'ease-out' },
    );
  }
}

export function animateBlockedTilt(view: BoardView, direction: Direction, reducedMotion: boolean): void {
  if (reducedMotion) {
    return;
  }
  const flat = boardTilt(direction, 0);
  view.element.animate([{ transform: flat }, { transform: boardTilt(direction, BLOCKED_TILT_ANGLE) }, { transform: flat }], {
    duration: BLOCKED_TILT_DURATION,
    easing: 'ease-in-out',
  });
}

// The pulses are scheduled after the running move animations rather than chained to them,
// so that finishing every animation of the board on an input also ends the victory at once.
export async function animateVictory(view: BoardView, blockIds: readonly string[]): Promise<void> {
  const moveEnd = Math.max(
    0,
    ...view.element.getAnimations({ subtree: true }).map((animation) => Number(animation.effect?.getComputedTiming().endTime ?? 0)),
  );
  const pulses = blockIds.flatMap((blockId, index) => {
    const element = view.blocks.get(blockId);
    if (!element) {
      return [];
    }
    return [
      element.animate([{ scale: '1' }, { scale: '1.12', filter: 'brightness(1.3)' }, { scale: '1' }], {
        delay: moveEnd + index * VICTORY_PULSE_GAP,
        duration: VICTORY_PULSE_DURATION,
        easing: 'ease-in-out',
      }),
    ];
  });
  await Promise.all(pulses.map((pulse) => pulse.finished));
}

export function finishAnimations(root: HTMLElement): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    animation.finish();
  }
}
