import type { GameHud } from './types';
import { createStatElement, requireElement } from './dom';

export interface HostHud extends GameHud {
  reset(): void;
}

export function createHud(root: HTMLElement, onFocusedActionDisabled: () => void): HostHud {
  const levelLabel = requireElement(root, '[data-hud-level]');
  const stats = requireElement(root, '[data-hud-stats]');

  return {
    setLevelLabel(label) {
      levelLabel.textContent = label;
    },
    setStats(list) {
      stats.replaceChildren(...list.map((stat) => createStatElement(stat.label, stat.value)));
    },
    setActionEnabled(actionId, enabled) {
      const button = root.querySelector<HTMLButtonElement>(`[data-action-id="${CSS.escape(actionId)}"]`);
      if (!button) {
        throw new Error(`Unknown game action "${actionId}".`);
      }
      const hadFocus = document.activeElement === button;
      button.disabled = !enabled;
      if (hadFocus && !enabled) {
        onFocusedActionDisabled();
      }
    },
    reset() {
      levelLabel.textContent = '';
      stats.replaceChildren();
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-action-id]')) {
        button.disabled = false;
      }
    },
  };
}
