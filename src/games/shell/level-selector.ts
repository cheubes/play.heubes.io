import type { LevelEntry } from './types';

export interface LevelSelector {
  render(levels: LevelEntry[]): void;
  reveal(): void;
}

export function createLevelSelector(root: HTMLElement): LevelSelector {
  const buttons = new Map<string, HTMLButtonElement>();
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-level-id]')) {
    buttons.set(button.dataset.levelId ?? '', button);
  }

  return {
    render(levels) {
      const nextLevelId = levels.find((level) => level.status === 'available')?.id;
      for (const level of levels) {
        const button = buttons.get(level.id);
        if (button) {
          button.dataset.status = level.status;
          button.disabled = level.status === 'locked';
          button.toggleAttribute('data-next', level.id === nextLevelId);
        }
      }
      this.reveal();
    },
    reveal() {
      delete root.dataset.pending;
    },
  };
}
