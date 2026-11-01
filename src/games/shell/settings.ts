import { STORAGE_PREFIX } from './storage';
import type { SaveFormat } from './types';

export interface Settings {
  sound: boolean;
}

export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

export const SETTINGS_FORMAT: SaveFormat = { version: 1 };

export function parseSettings(value: unknown): Settings {
  const sound = typeof value === 'object' && value !== null && 'sound' in value ? value.sound : undefined;
  return { sound: typeof sound === 'boolean' ? sound : true };
}
