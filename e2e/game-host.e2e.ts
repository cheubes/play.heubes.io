import { expect, test, type Page } from '@playwright/test';

// The first level of Tilt is solved in its par of two moves.
const FIRST_LEVEL_SOLUTION = ['ArrowDown', 'ArrowRight'];

function hudMoves(page: Page) {
  return page.locator('[data-hud-stats] dd').first();
}

async function startGame(page: Page): Promise<void> {
  await page.locator('[data-play-button]').click();
  await expect(page.locator('html')).toHaveAttribute('data-game-mode', 'playing');
}

async function solveFirstLevel(page: Page): Promise<void> {
  for (const key of FIRST_LEVEL_SOLUTION) {
    await page.keyboard.press(key);
  }
  await expect(page.getByRole('dialog', { name: /Level complete/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tilt/');
});

test('starts a game on the first available level, with the focus on the game area', async ({ page }) => {
  await startGame(page);
  await expect(page.locator('[data-game-area]')).toBeFocused();
  await expect(page.locator('[data-hud-level]')).toHaveText('Level 1');
  await expect(hudMoves(page)).toHaveText('0');
});

test('pauses with the focus trapped in the panel, then resumes and restarts', async ({ page }) => {
  await startGame(page);
  await page.keyboard.press('ArrowDown');
  await expect(hudMoves(page)).toHaveText('1');

  await page.keyboard.press('Escape');
  const pausePanel = page.getByRole('dialog', { name: 'Paused' });
  await expect(pausePanel).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-game-mode', 'paused');
  const resumeButton = pausePanel.getByRole('button', { name: 'Resume' });
  await expect(resumeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(pausePanel.getByRole('button', { name: 'Levels' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(resumeButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(pausePanel).toBeHidden();
  await expect(page.locator('[data-game-area]')).toBeFocused();
  await expect(hudMoves(page)).toHaveText('1');

  await page.keyboard.press('Escape');
  await pausePanel.getByRole('button', { name: 'Restart level' }).click();
  await expect(pausePanel).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-game-mode', 'playing');
  await expect(page.locator('[data-game-area]')).toBeFocused();
  await expect(hudMoves(page)).toHaveText('0');
});

test('ends a level with its result, then moves on to the next level', async ({ page }) => {
  await startGame(page);
  await solveFirstLevel(page);
  const endPanel = page.getByRole('dialog', { name: /Level complete/ });
  await expect(page.locator('html')).toHaveAttribute('data-game-mode', 'ended');
  await expect(endPanel.locator('[data-end-message]')).toHaveText('Perfect! Solved in the minimum number of moves.');
  await expect(endPanel.locator('[data-end-stats] dd')).toHaveText(['2', '2', '2']);
  const nextButton = endPanel.getByRole('button', { name: 'Next level' });
  await expect(nextButton).toBeFocused();

  await nextButton.click();
  await expect(endPanel).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-game-mode', 'playing');
  await expect(page.locator('[data-game-area]')).toBeFocused();
  await expect(page.locator('[data-hud-level]')).toHaveText('Level 2');
  await expect(hudMoves(page)).toHaveText('0');
});

test('exits to the level selector, which keeps the progress after a reload', async ({ page }) => {
  await startGame(page);
  await solveFirstLevel(page);
  await page.getByRole('dialog', { name: /Level complete/ }).getByRole('button', { name: 'Levels' }).click();

  await expect(page.locator('html')).not.toHaveAttribute('data-game-mode');
  await expect(page.locator('[data-play-button]')).toBeFocused();
  for (const reloaded of [false, true]) {
    if (reloaded) {
      await page.reload();
    }
    await expect(page.locator('[data-level-id="first-slide"]')).toHaveAttribute('data-status', 'perfect');
    await expect(page.locator('[data-level-id="corner-turn"]')).toHaveAttribute('data-status', 'available');
    await expect(page.locator('[data-reset-button]')).toBeVisible();
  }
});

test('resets the progress after confirmation', async ({ page }) => {
  await startGame(page);
  await solveFirstLevel(page);
  await page.getByRole('dialog', { name: /Level complete/ }).getByRole('button', { name: 'Levels' }).click();

  await page.locator('[data-reset-button]').click();
  const resetPanel = page.getByRole('dialog', { name: 'Reset your progress in Tilt?' });
  await expect(resetPanel).toBeVisible();
  await expect(resetPanel.getByRole('button', { name: 'Cancel' })).toBeFocused();

  await resetPanel.getByRole('button', { name: 'Reset' }).click();
  await expect(resetPanel).toBeHidden();
  await expect(page.locator('[data-play-button]')).toBeFocused();
  await expect(page.locator('[data-reset-button]')).toBeHidden();
  for (const reloaded of [false, true]) {
    if (reloaded) {
      await page.reload();
    }
    await expect(page.locator('[data-level-id="first-slide"]')).toHaveAttribute('data-status', 'available');
    await expect(page.locator('[data-level-id="corner-turn"]')).toHaveAttribute('data-status', 'locked');
  }
});
