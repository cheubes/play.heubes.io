import type { BoardElement, PrismState } from '../logic/types';
import { isSlash, isSpinLeft, type BoardView } from './board';

const TOGGLE_DURATION = 150;
const TARGET_LIGHT_DURATION = 200;
const TARGET_FADE_DURATION = 120;
// One dash and its gap per half cell: every beam segment starts at a cell center, so the pattern runs on across cells.
const FLOW_DASHES = '0.35px 0.15px';
const FLOW_PERIOD = 0.5;
const FLOW_DURATION = 1000;
const LIGHT_LAYERS = '.prism-target-glow, .prism-target-ring, .prism-target-check-outline, .prism-target-check';

// A CSS transform-origin would also shift the body's transform attribute, which has its own center.
function aroundCellCenter(transform: string): string {
  return `translate(0.5px, 0.5px) ${transform} translate(-0.5px, -0.5px)`;
}

function easeOut(element: Element): string {
  return getComputedStyle(element).getPropertyValue('--ease-out').trim() || 'ease-out';
}

// The body is already placed in its new state: the animation only replays the toggle.
export function animateToggle(
  view: BoardView,
  element: BoardElement,
  before: PrismState,
  reducedMotion: boolean,
): Animation | undefined {
  const body = view.bodies.get(element.id);
  if (reducedMotion || !body) {
    return undefined;
  }
  let keyframes: Keyframe[];
  if (element.type === 'mirror') {
    // Half a turn draws the same mirror, so turning on from 90° keeps every toggle clockwise.
    const from = isSlash(element, before) ? 0 : 90;
    keyframes = [{ transform: aroundCellCenter(`rotate(${from}deg)`) }, { transform: aroundCellCenter(`rotate(${from + 90}deg)`) }];
  } else if (element.type === 'prism') {
    const from = isSpinLeft(element, before) ? 1 : -1;
    keyframes = [{ transform: aroundCellCenter(`scaleX(${from})`) }, { transform: aroundCellCenter(`scaleX(${-from})`) }];
  } else {
    return undefined;
  }
  return body.animate(keyframes, { duration: TOGGLE_DURATION, easing: easeOut(body) });
}

export function animateTarget(view: BoardView, targetId: string, lit: boolean, reducedMotion: boolean): void {
  const target = view.targets.get(targetId);
  if (reducedMotion || !target) {
    return;
  }
  const easing = easeOut(target.element);
  if (!lit) {
    for (const layer of target.element.querySelectorAll(LIGHT_LAYERS)) {
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TARGET_FADE_DURATION, easing });
    }
    return;
  }
  for (const layer of target.element.querySelectorAll(LIGHT_LAYERS)) {
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: TARGET_LIGHT_DURATION, easing });
  }
  target.element.querySelector('.prism-target-glow')?.animate(
    [{ strokeWidth: '0.14px' }, { strokeWidth: '0.28px' }, { strokeWidth: '0.14px' }],
    { duration: TARGET_LIGHT_DURATION, easing: 'ease-in-out' },
  );
  for (const sector of target.sectors.querySelectorAll('.prism-sector.is-received')) {
    sector.animate([{ fillOpacity: 0.2 }, { fillOpacity: 1 }], { duration: TARGET_LIGHT_DURATION, easing });
  }
}

export function animateBeamFlow(view: BoardView): void {
  for (const core of view.beams.querySelectorAll('.prism-beam-core')) {
    const flow = core.animate(
      [
        { strokeDasharray: FLOW_DASHES, strokeDashoffset: `${FLOW_PERIOD}px` },
        { strokeDasharray: FLOW_DASHES, strokeDashoffset: '0px' },
      ],
      { duration: FLOW_DURATION, iterations: Infinity },
    );
    // Aligned on the timeline origin, so that the dashes keep their phase when the beams are redrawn.
    flow.startTime = 0;
  }
}

// The beam flow never ends: finishing it would throw.
export function finishAnimations(root: HTMLElement): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    if (animation.effect?.getTiming().iterations !== Infinity) {
      animation.finish();
    }
  }
}
