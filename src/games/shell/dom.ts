export function requireElement<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Game host markup is missing "${selector}".`);
  }
  return element;
}

export function createStatElement(label: string, value: string): HTMLElement {
  const group = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  group.append(term, description);
  return group;
}

function getFocusableButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter((button) => button.offsetParent !== null);
}

export function focusFirstButton(container: HTMLElement): void {
  getFocusableButtons(container)[0]?.focus();
}

export function trapFocus(container: HTMLElement): void {
  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }
    const buttons = getFocusableButtons(container);
    const first = buttons[0];
    const last = buttons.at(-1);
    if (!first || !last) {
      return;
    }
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
