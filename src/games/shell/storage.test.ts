import { describe, expect, it } from 'vitest';
import { createSafeBackend, createVersionedStorage, decodeSave, encodeSave, getGameStorageKey } from './storage';

function createFakeStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

function createBlockedStorage(): Storage {
  throw new DOMException('The operation is insecure.', 'SecurityError');
}

function createFullStorage(): Storage {
  const storage = createFakeStorage();
  storage.setItem = () => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  };
  return storage;
}

describe('getGameStorageKey', () => {
  it('prefixes the slug with play:', () => {
    expect(getGameStorageKey('tilt')).toBe('play:tilt');
  });
});

describe('decodeSave', () => {
  it('returns the data of a save in the current version', () => {
    expect(decodeSave(encodeSave(1, { best: { a: 3 } }), { version: 1 })).toEqual({ best: { a: 3 } });
  });

  it('ignores a missing save', () => {
    expect(decodeSave(null, { version: 1 })).toBeUndefined();
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['a value without envelope', '{"best":{}}'],
    ['an envelope without data', '{"version":1}'],
    ['a non-integer version', '{"version":1.5,"data":{}}'],
    ['a version below 1', '{"version":0,"data":{}}'],
    ['a version given as a string', '{"version":"1","data":{}}'],
    ['a primitive', '42'],
  ])('ignores %s', (_, raw) => {
    expect(decodeSave(raw, { version: 1 })).toBeUndefined();
  });

  it('ignores a save from a newer version', () => {
    expect(decodeSave(encodeSave(3, {}), { version: 2 })).toBeUndefined();
  });

  it('migrates an older save step by step', () => {
    const format = {
      version: 3,
      migrations: {
        1: (data: unknown) => ({ v1: data }),
        2: (data: unknown) => ({ v2: data }),
      },
    };
    expect(decodeSave(encodeSave(1, 'start'), format)).toEqual({ v2: { v1: 'start' } });
    expect(decodeSave(encodeSave(2, 'start'), format)).toEqual({ v2: 'start' });
  });

  it('ignores an older save when a migration step is missing', () => {
    const format = { version: 3, migrations: { 2: (data: unknown) => data } };
    expect(decodeSave(encodeSave(1, {}), format)).toBeUndefined();
  });

  it('ignores a save whose migration throws', () => {
    const format = {
      version: 2,
      migrations: {
        1: () => {
          throw new Error('Unexpected data.');
        },
      },
    };
    expect(decodeSave(encodeSave(1, {}), format)).toBeUndefined();
  });
});

describe('createVersionedStorage', () => {
  it('writes the data in a versioned envelope under its key', () => {
    const storage = createFakeStorage();
    createVersionedStorage(storage, 'play:tilt', { version: 2 }).write({ best: {} });
    expect(storage.getItem('play:tilt')).toBe('{"version":2,"data":{"best":{}}}');
  });

  it('reads back what it wrote', () => {
    const storage = createVersionedStorage(createFakeStorage(), 'play:tilt', { version: 1 });
    storage.write({ best: { a: 1 } });
    expect(storage.read()).toEqual({ best: { a: 1 } });
  });

  it('replaces an unreadable save on the next write', () => {
    const backend = createFakeStorage();
    backend.setItem('play:tilt', 'corrupted');
    const storage = createVersionedStorage(backend, 'play:tilt', { version: 1 });
    expect(storage.read()).toBeUndefined();
    storage.write({ best: {} });
    expect(storage.read()).toEqual({ best: {} });
  });
});

describe('createSafeBackend', () => {
  it('reads and writes through localStorage when it is available', () => {
    const storage = createFakeStorage();
    storage.setItem('play:tilt', 'saved');
    const backend = createSafeBackend(() => storage);
    expect(backend.getItem('play:tilt')).toBe('saved');
    backend.setItem('play:prism', 'new');
    expect(storage.getItem('play:prism')).toBe('new');
    backend.removeItem('play:tilt');
    expect(storage.getItem('play:tilt')).toBeNull();
    expect(backend.getItem('play:tilt')).toBeNull();
  });

  it('keeps the progression in memory when localStorage is blocked', () => {
    const backend = createSafeBackend(createBlockedStorage);
    expect(backend.getItem('play:tilt')).toBeNull();
    backend.setItem('play:tilt', 'saved');
    expect(backend.getItem('play:tilt')).toBe('saved');
    backend.removeItem('play:tilt');
    expect(backend.getItem('play:tilt')).toBeNull();
  });

  it('keeps the latest write in memory when localStorage is full', () => {
    const storage = createFullStorage();
    const backend = createSafeBackend(() => storage);
    backend.setItem('play:tilt', 'saved');
    expect(backend.getItem('play:tilt')).toBe('saved');
  });
});
