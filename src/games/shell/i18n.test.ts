import { describe, expect, it } from 'vitest';
import { createGameTranslator, formatShortcut } from './i18n';

const t = createGameTranslator({ level: 'Level {number}', stats: { moves: 'Moves' } }, 'en');

describe('createGameTranslator', () => {
  it('resolves nested keys', () => {
    expect(t('stats.moves')).toBe('Moves');
  });

  it('interpolates parameters', () => {
    expect(t('level', { number: 3 })).toBe('Level 3');
  });

  it('throws on a missing key instead of falling back', () => {
    expect(() => t('stats.time')).toThrow('Missing translation "stats.time" for locale "en".');
  });

  it('throws on a key that points to a group', () => {
    expect(() => t('stats')).toThrow();
  });

  it('throws on a missing parameter', () => {
    expect(() => t('level')).toThrow('Missing parameter "number"');
  });
});

describe('formatShortcut', () => {
  it('upper-cases single characters and keeps named keys', () => {
    expect(formatShortcut('z')).toBe('Z');
    expect(formatShortcut('Backspace')).toBe('Backspace');
  });
});
