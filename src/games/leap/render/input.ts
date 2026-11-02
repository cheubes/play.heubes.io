export type InputSource = 'pointer' | 'keyboard';

const JUMP_KEYS = [' ', 'Enter', 'ArrowUp'];

// Before any input, the start indicator assumes the device's main input.
export function defaultInputSource(): InputSource {
  return window.matchMedia('(pointer: coarse)').matches ? 'pointer' : 'keyboard';
}

export function bindInput(container: HTMLElement, signal: AbortSignal, onPress: (source: InputSource) => void): void {
  container.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button === 0) {
        onPress('pointer');
      }
    },
    { signal },
  );
  container.addEventListener(
    'keydown',
    (event) => {
      if (!event.repeat && JUMP_KEYS.includes(event.key)) {
        event.preventDefault();
        onPress('keyboard');
      }
    },
    { signal },
  );
}
