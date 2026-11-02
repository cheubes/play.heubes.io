import { isMoving, visibleFace } from '../logic/sheet';
import type { Fold, Level, Sheet } from '../logic/types';
import { bottomFace, createCell, placeAt, type BoardView } from './board';

const FOLD_DURATION = 280;
const UNFOLD_DURATION = 200;
const PIN_PULSE_DURATION = 200;
const PIN_RING_DURATION = 400;

function easeInOut(element: Element): string {
  return getComputedStyle(element).getPropertyValue('--ease-in-out').trim() || 'ease-in-out';
}

// Where the folded sheet starts, in the positions of the sheet before the fold.
function foldedOrigin(sheet: Sheet, fold: Fold): { row: number; col: number } {
  const size = fold.axis === 'vertical' ? sheet.cols : sheet.rows;
  const start = fold.moving === 'before' ? fold.line : Math.min(0, 2 * fold.line - size);
  return fold.axis === 'vertical' ? { row: 0, col: start } : { row: start, col: 0 };
}

// The stage centers the sheet: this shift keeps the fixed part in place while the sheet recenters.
function glide(view: BoardView, before: Sheet, after: Sheet, fold: Fold): string {
  const origin = foldedOrigin(before, fold);
  const x = ((before.cols - after.cols) / 2 - origin.col) * view.cellSize;
  const y = ((before.rows - after.rows) / 2 - origin.row) * view.cellSize;
  return `translate(${x}px, ${y}px)`;
}

// The moving part leaves its positions and turns over around the fold line, each position with two faces:
// its top layer in front, and behind it its bottom layer, which is the top one once the flap has landed.
function createFlap(view: BoardView, level: Level, sheet: Sheet, fold: Fold): HTMLElement {
  const flap = document.createElement('div');
  flap.className = `fold-flap is-${fold.axis} is-${fold.moving}`;
  const lineOffset = `calc(${fold.line} * var(--size))`;
  flap.style.transformOrigin = fold.axis === 'vertical' ? `${lineOffset} 50%` : `50% ${lineOffset}`;
  const tops = visibleFace(level, sheet);
  const bottoms = bottomFace(level, sheet);
  for (let row = 0; row < sheet.rows; row++) {
    for (let col = 0; col < sheet.cols; col++) {
      const top = tops[row]?.[col];
      const bottom = bottoms[row]?.[col];
      if (!isMoving(fold, row, col) || top === undefined || bottom === undefined || top === 'empty') {
        continue;
      }
      view.cells[row * sheet.cols + col]?.classList.add('is-lifted');
      const front = createCell(top);
      const back = createCell(bottom);
      front.classList.add('fold-face');
      back.classList.add('fold-face', 'is-back');
      placeAt(front, row, col);
      placeAt(back, row, col);
      flap.append(front, back);
    }
  }
  view.sheet.append(flap);
  return flap;
}

function turn(fold: Fold): string {
  // The flap always lifts towards the viewer.
  const angle = (fold.axis === 'vertical') === (fold.moving === 'before') ? 180 : -180;
  return fold.axis === 'vertical' ? `rotateY(${angle}deg)` : `rotateX(${angle}deg)`;
}

function animateFlap(
  view: BoardView,
  level: Level,
  before: Sheet,
  after: Sheet,
  fold: Fold,
  direction: 'normal' | 'reverse',
  duration: number,
): Animation {
  const flap = createFlap(view, level, before, fold);
  const easing = easeInOut(view.element);
  const timing: KeyframeAnimationOptions = { duration, easing, direction };
  flap.animate([{ transform: 'none' }, { transform: turn(fold) }], timing);
  return view.sheet.animate([{ transform: 'none' }, { transform: glide(view, before, after, fold) }], timing);
}

// The view shows the sheet before the fold; it is rebuilt from the folded sheet when the animation ends.
export function animateFold(
  view: BoardView,
  level: Level,
  before: Sheet,
  after: Sheet,
  fold: Fold,
  reducedMotion: boolean,
): Animation | undefined {
  return reducedMotion ? undefined : animateFlap(view, level, before, after, fold, 'normal', FOLD_DURATION);
}

// The view shows the sheet before the undone fold, with its flap turned over where it had landed.
export function animateUnfold(
  view: BoardView,
  level: Level,
  before: Sheet,
  after: Sheet,
  fold: Fold,
  reducedMotion: boolean,
): Animation | undefined {
  return reducedMotion ? undefined : animateFlap(view, level, before, after, fold, 'reverse', UNFOLD_DURATION);
}

export function animateBlockedPins(pins: HTMLElement[], reducedMotion: boolean): void {
  for (const pin of pins) {
    if (reducedMotion) {
      const ring = getComputedStyle(pin).getPropertyValue('--fold-blocking-ring');
      pin.animate([{ boxShadow: ring }, { boxShadow: ring }], { duration: PIN_RING_DURATION });
    } else {
      pin.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], {
        duration: PIN_PULSE_DURATION,
        easing: 'ease-in-out',
      });
    }
  }
}

export function finishAnimations(root: HTMLElement): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    animation.finish();
  }
}
