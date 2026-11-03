import type { Locale } from '../../i18n';
import type { Translate } from './i18n';

export type LevelStatus = 'locked' | 'available' | 'completed' | 'perfect';

export interface LevelEntry {
  id: string;
  label: string;
  status: LevelStatus;
}

export interface GameAction {
  id: string;
  icon: string;
  labelKey: string;
  shortcut?: string;
}

export interface HudStat {
  id: string;
  label: string;
  value: string;
}

export interface GameHud {
  setLevelLabel(label: string): void;
  setStats(stats: HudStat[]): void;
  setActionEnabled(actionId: string, enabled: boolean): void;
}

export interface GameStorage {
  read<T>(): T | undefined;
  write<T>(data: T): void;
}

export interface SaveFormat {
  version: number;
  // migrations[n] converts the data of a version n save to version n + 1.
  migrations?: Record<number, (data: unknown) => unknown>;
}

export interface GameAudio {
  context(): AudioContext | undefined;
  output(): AudioNode | undefined;
}

export interface LevelResult {
  status: 'completed' | 'perfect' | 'failed';
  stats: { label: string; value: string }[];
  message?: string;
}

export interface GameContext {
  container: HTMLElement;
  locale: Locale;
  t: Translate;
  storage: GameStorage;
  audio: GameAudio;
  hud: GameHud;
  announce(message: string): void;
  reducedMotion(): boolean;
  complete(result: LevelResult): void;
  signal: AbortSignal;
}

export interface GameInstance {
  start(levelId?: string): void;
  pause(): void;
  resume(): void;
  restart(): void;
  action?(actionId: string): void;
  resize?(): void;
  destroy(): void;
}

export interface GameDefinition {
  getLevels?(storage: GameStorage): LevelEntry[];
  actions?: GameAction[];
  // Absent: version 1, without migrations.
  save?: SaveFormat;
  create(context: GameContext): GameInstance;
}
