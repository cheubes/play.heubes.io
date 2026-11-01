import type { Locale } from '../../i18n';
import { createAudioService } from './audio';
import { createStatElement, focusFirstButton, requireElement, trapFocus } from './dom';
import { createHud } from './hud';
import { createGameTranslator, type Dictionary } from './i18n';
import { createLevelSelector } from './level-selector';
import { parseSettings, SETTINGS_FORMAT, SETTINGS_KEY } from './settings';
import { createSafeBackend, createVersionedStorage, DEFAULT_SAVE_FORMAT, getGameStorageKey } from './storage';
import type { GameContext, GameDefinition, GameInstance, GameStorage, LevelResult } from './types';

type Mode = 'playing' | 'paused' | 'ended';

interface LoadedGame {
  definition: GameDefinition;
  dictionary: Dictionary;
}

interface Session {
  definition: GameDefinition;
  storage: GameStorage;
  instance: GameInstance;
  controller: AbortController;
  levelId: string | undefined;
  nextLevelId: string | undefined;
  completed: boolean;
}

const GAME_MODULES = import.meta.glob<GameDefinition>('/src/games/*/index.ts', { import: 'default' });
const GAME_DICTIONARIES = import.meta.glob<Dictionary>('/src/games/*/i18n/*.json', { import: 'default' });
// Injected by the host rather than imported by the game module: the game page imports that module at build time,
// and Astro would then inline the game's styles into every page.
const GAME_STYLES = import.meta.glob<string>('/src/games/*/*.css', { query: '?inline', import: 'default' });
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

async function loadGame(slug: string, locale: Locale): Promise<LoadedGame> {
  const loadModule = GAME_MODULES[`/src/games/${slug}/index.ts`];
  const loadDictionary = GAME_DICTIONARIES[`/src/games/${slug}/i18n/${locale}.json`];
  if (!loadModule || !loadDictionary) {
    throw new Error(`Game "${slug}" has no entry point or no "${locale}" translations.`);
  }
  const [definition, dictionary, styles] = await Promise.all([loadModule(), loadDictionary(), GAME_STYLES[`/src/games/${slug}/${slug}.css`]?.()]);
  if (styles !== undefined) {
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.append(style);
  }
  return { definition, dictionary };
}

function whenIdle(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
}

export function initGameHost(shell: HTMLElement): void {
  const { slug: slugAttribute, locale: localeAttribute } = shell.dataset;
  if (!slugAttribute || (localeAttribute !== 'en' && localeAttribute !== 'fr')) {
    throw new Error('Game host needs data-slug and data-locale.');
  }
  const slug: string = slugAttribute;
  const locale: Locale = localeAttribute;

  const content = requireElement(document, '[data-game-content]');
  const playButton = requireElement<HTMLButtonElement>(document, '[data-play-button]');
  const playLabel = requireElement(playButton, '[data-play-label]');
  const retryLabel = requireElement(playButton, '[data-retry-label]');
  const loadError = requireElement(document, '[data-load-error]');
  const announcer = requireElement(document, '[data-game-announcer]');
  const hudRoot = requireElement(shell, '[data-hud]');
  const soundButton = requireElement(hudRoot, '[data-command="sound"]');
  const fullscreenButton = requireElement(hudRoot, '[data-command="fullscreen"]');
  const area = requireElement(shell, '[data-game-area]');
  const pausePanel = requireElement(shell, '[data-panel="pause"]');
  const endPanel = requireElement(shell, '[data-panel="end"]');
  const endStar = requireElement(endPanel, '[data-end-star]');
  const endMessage = requireElement(endPanel, '[data-end-message]');
  const endStats = requireElement(endPanel, '[data-end-stats]');
  const levelSelectorRoot = document.querySelector<HTMLElement>('[data-level-selector]');
  const resetButton = requireElement(document, '[data-reset-button]');
  const resetPanel = requireElement(document, '[data-panel="reset"]');
  const resetConfirmButton = requireElement(resetPanel, '[data-reset-confirm]');
  const resetCancelButton = requireElement(resetPanel, '[data-reset-cancel]');

  const backend = createSafeBackend(() => window.localStorage);
  const storageKey = getGameStorageKey(slug);
  const settingsStorage = createVersionedStorage(backend, SETTINGS_KEY, SETTINGS_FORMAT);
  let settings = parseSettings(settingsStorage.read());
  const audio = createAudioService(settings.sound);
  const hud = createHud(hudRoot, () => area.focus());
  const levelSelector = levelSelectorRoot ? createLevelSelector(levelSelectorRoot) : undefined;
  let loading: Promise<LoadedGame> | undefined;
  let session: Session | undefined;
  let mode: Mode | undefined;
  let pointerStartedInPanel = false;

  function load(): Promise<LoadedGame> {
    loading ??= loadGame(slug, locale).catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  }

  function createGameStorage(definition: GameDefinition): GameStorage {
    return createVersionedStorage(backend, storageKey, definition.save ?? DEFAULT_SAVE_FORMAT);
  }

  function refreshProgress(): void {
    resetButton.hidden = backend.getItem(storageKey) === null;
    load()
      .then(({ definition }) => {
        const levels = definition.getLevels?.(createGameStorage(definition));
        if (levels) {
          levelSelector?.render(levels);
        }
      })
      .catch(() => {
        // Reported when the player presses Play, which retries the load.
      })
      .finally(() => levelSelector?.reveal());
  }

  function setMode(next: Mode | undefined): void {
    mode = next;
    if (next) {
      document.documentElement.dataset.gameMode = next;
    } else {
      delete document.documentElement.dataset.gameMode;
    }
  }

  function announce(message: string): void {
    announcer.replaceChildren(document.createTextNode(message));
  }

  function openPanel(panel: HTMLElement, panelMode: Mode): void {
    closePanels();
    setMode(panelMode);
    hudRoot.inert = true;
    area.inert = true;
    panel.hidden = false;
    focusFirstButton(panel);
  }

  function closePanels(): void {
    pausePanel.hidden = true;
    endPanel.hidden = true;
    hudRoot.inert = false;
    area.inert = false;
  }

  function enterPlaying(): void {
    closePanels();
    setMode('playing');
    audio.activate();
  }

  async function play(levelId?: string): Promise<void> {
    if (playButton.getAttribute('aria-busy') === 'true') {
      return;
    }
    audio.activate();
    playButton.setAttribute('aria-busy', 'true');
    loadError.textContent = '';
    let game: LoadedGame;
    try {
      game = await load();
    } catch (error) {
      console.error(error);
      loadError.textContent = loadError.dataset.message ?? '';
      playLabel.hidden = true;
      retryLabel.hidden = false;
      return;
    } finally {
      playButton.removeAttribute('aria-busy');
    }
    playLabel.hidden = false;
    retryLabel.hidden = true;
    startSession(game, levelId);
  }

  function startSession({ definition, dictionary }: LoadedGame, requestedLevelId: string | undefined): void {
    const storage = createGameStorage(definition);
    const levels = definition.getLevels?.(storage);
    const levelId = requestedLevelId ?? (levels ? (levels.find((level) => level.status === 'available') ?? levels[0])?.id : undefined);
    const controller = new AbortController();
    const context: GameContext = {
      container: area,
      locale,
      t: createGameTranslator(dictionary, locale),
      storage,
      audio: audio.gameAudio,
      hud,
      announce,
      reducedMotion: () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
      complete: (result) => {
        if (session?.controller === controller) {
          completeLevel(result);
        }
      },
      signal: controller.signal,
    };
    content.inert = true;
    shell.hidden = false;
    session = { definition, storage, controller, levelId, nextLevelId: undefined, completed: false, instance: definition.create(context) };
    startLevel(levelId);
  }

  function startLevel(levelId: string | undefined): void {
    if (!session) {
      return;
    }
    session.levelId = levelId;
    session.completed = false;
    enterPlaying();
    session.instance.start(levelId);
    area.focus();
  }

  function restartLevel(): void {
    if (!session) {
      return;
    }
    session.completed = false;
    enterPlaying();
    session.instance.restart();
    area.focus();
  }

  function pause(): void {
    if (mode !== 'playing' || !session) {
      return;
    }
    session.instance.pause();
    audio.suspend();
    openPanel(pausePanel, 'paused');
  }

  function resume(): void {
    if (mode !== 'paused' || !session) {
      return;
    }
    enterPlaying();
    session.instance.resume();
    area.focus();
  }

  function completeLevel(result: LevelResult): void {
    if (!session || session.completed) {
      return;
    }
    session.completed = true;
    const levels = session.definition.getLevels?.(session.storage) ?? [];
    const index = levels.findIndex((level) => level.id === session?.levelId);
    const nextLevel = index >= 0 ? levels[index + 1] : undefined;
    const isLastLevel = index >= 0 && index === levels.length - 1;
    session.nextLevelId = nextLevel && nextLevel.status !== 'locked' ? nextLevel.id : undefined;
    const hasNext = session.nextLevelId !== undefined;
    const isPerfect = result.status === 'perfect';

    endPanel.toggleAttribute('data-perfect', isPerfect);
    endStar.hidden = !isPerfect;
    for (const title of endPanel.querySelectorAll<HTMLElement>('[data-end-title]')) {
      title.hidden = title.dataset.endTitle !== (isLastLevel ? 'all' : 'level');
    }
    endMessage.textContent = result.message ?? '';
    endMessage.hidden = !result.message;
    endStats.replaceChildren(...result.stats.map((stat) => createStatElement(stat.label, stat.value)));
    for (const button of endPanel.querySelectorAll<HTMLElement>('[data-end-when]')) {
      button.hidden = button.dataset.endWhen !== (hasNext ? 'next' : 'no-next');
    }
    openPanel(endPanel, 'ended');
  }

  function exitSession(): void {
    if (!session) {
      return;
    }
    session.instance.destroy();
    session.controller.abort();
    session = undefined;
    audio.replaceOutput();
    audio.suspend();
    area.replaceChildren();
    hud.reset();
    closePanels();
    shell.hidden = true;
    setMode(undefined);
    content.inert = false;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error: unknown) => console.error(error));
    }
    playButton.focus();
    refreshProgress();
  }

  function toggleSound(): void {
    settings = { ...settings, sound: !settings.sound };
    settingsStorage.write(settings);
    audio.setEnabled(settings.sound);
    soundButton.setAttribute('aria-pressed', String(settings.sound));
  }

  function openResetPanel(): void {
    content.inert = true;
    resetPanel.hidden = false;
    resetCancelButton.focus();
  }

  function closeResetPanel(focusTarget: HTMLElement): void {
    resetPanel.hidden = true;
    content.inert = false;
    focusTarget.focus();
  }

  function pauseOnFocusLoss(): void {
    pause();
    // Also silences the end panel, which pause() leaves alone.
    audio.suspend();
  }

  function toggleFullscreen(): void {
    const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    request.catch((error: unknown) => console.error(error));
  }

  playButton.addEventListener('click', () => void play());

  levelSelectorRoot?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-level-id]') : null;
    if (button?.dataset.levelId !== undefined) {
      void play(button.dataset.levelId);
    }
  });

  resetButton.addEventListener('click', openResetPanel);
  resetCancelButton.addEventListener('click', () => closeResetPanel(resetButton));
  resetConfirmButton.addEventListener('click', () => {
    backend.removeItem(storageKey);
    refreshProgress();
    closeResetPanel(playButton);
  });
  resetPanel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeResetPanel(resetButton);
    }
  });

  // A tap that completes a level opens the end panel before the browser sends that tap's click,
  // which could then land on a panel button: panel buttons only accept pointers that went down in the panel.
  shell.addEventListener('pointerdown', (event) => {
    pointerStartedInPanel = event.target instanceof Element && event.target.closest('[data-panel]') !== null;
  });

  // The same late compatibility mousedown, or a click on the scrim, would otherwise move the focus out of the panel.
  document.addEventListener('mousedown', (event) => {
    const isControl = event.target instanceof Element && event.target.closest('button, a') !== null;
    if ((mode === 'paused' || mode === 'ended' || !resetPanel.hidden) && !isControl) {
      event.preventDefault();
    }
  });

  shell.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-command], button[data-action-id]') : null;
    const activatedByPointer = event.detail > 0;
    if (!button || !session || (activatedByPointer && button.closest('[data-panel]') && !pointerStartedInPanel)) {
      return;
    }
    const { actionId, command } = button.dataset;
    if (actionId !== undefined) {
      session.instance.action?.(actionId);
    } else if (command === 'pause') {
      pause();
    } else if (command === 'resume') {
      resume();
    } else if (command === 'restart') {
      restartLevel();
    } else if (command === 'next' && session.nextLevelId !== undefined) {
      startLevel(session.nextLevelId);
    } else if (command === 'exit') {
      exitSession();
    } else if (command === 'sound') {
      toggleSound();
    } else if (command === 'fullscreen') {
      toggleFullscreen();
    }
    // A HUD button clicked with a pointer would otherwise keep the focus and swallow the game's keys (Space).
    if (activatedByPointer && mode === 'playing' && hudRoot.contains(button)) {
      area.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
      return;
    }
    const key = event.key.toLowerCase();
    const isPauseKey = key === 'escape' || key === 'p';
    if (mode === 'playing' && isPauseKey) {
      event.preventDefault();
      pause();
    } else if (mode === 'playing' && key === 'r') {
      event.preventDefault();
      restartLevel();
    } else if (mode === 'paused' && isPauseKey) {
      event.preventDefault();
      resume();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseOnFocusLoss();
    }
  });
  window.addEventListener('blur', pauseOnFocusLoss);

  soundButton.setAttribute('aria-pressed', String(settings.sound));
  fullscreenButton.hidden = !document.fullscreenEnabled;
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.setAttribute('aria-pressed', String(document.fullscreenElement !== null));
  });

  new ResizeObserver(() => session?.instance.resize?.()).observe(area);

  trapFocus(pausePanel);
  trapFocus(endPanel);
  trapFocus(resetPanel);

  whenIdle(refreshProgress);
}
