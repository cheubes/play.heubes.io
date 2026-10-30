import type { GameStorage, SaveFormat } from './types';

export type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const STORAGE_PREFIX = 'play:';

export const DEFAULT_SAVE_FORMAT: SaveFormat = { version: 1 };

export function getGameStorageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

// Writes are mirrored in memory so that a blocked or full localStorage still keeps the progression
// consistent during the visit (next level unlocked), without surviving a reload.
export function createSafeBackend(getStorage: () => Storage): StorageBackend {
  const memory = new Map<string, string | null>();
  return {
    getItem(key) {
      if (memory.has(key)) {
        return memory.get(key) ?? null;
      }
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        getStorage().setItem(key, value);
      } catch {
        // Storage unavailable or full: the game stays playable without saving.
      }
    },
    removeItem(key) {
      memory.set(key, null);
      try {
        getStorage().removeItem(key);
      } catch {
        // Storage unavailable: nothing to remove.
      }
    },
  };
}

export function encodeSave(version: number, data: unknown): string {
  return JSON.stringify({ version, data });
}

export function decodeSave(raw: string | null, { version, migrations = {} }: SaveFormat): unknown {
  if (raw === null) {
    return undefined;
  }
  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (
    typeof envelope !== 'object' ||
    envelope === null ||
    !('version' in envelope) ||
    !('data' in envelope) ||
    typeof envelope.version !== 'number' ||
    !Number.isInteger(envelope.version) ||
    envelope.version < 1 ||
    envelope.version > version
  ) {
    return undefined;
  }
  let data = envelope.data;
  try {
    for (let from = envelope.version; from < version; from++) {
      const migrate = migrations[from];
      if (!migrate) {
        return undefined;
      }
      data = migrate(data);
    }
  } catch {
    return undefined;
  }
  return data;
}

export function createVersionedStorage(backend: StorageBackend, key: string, format: SaveFormat): GameStorage {
  return {
    read: <T>() => decodeSave(backend.getItem(key), format) as T | undefined,
    write: (data) => backend.setItem(key, encodeSave(format.version, data)),
  };
}
