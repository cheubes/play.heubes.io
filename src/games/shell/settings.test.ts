import { describe, expect, it } from 'vitest';
import { parseSettings } from './settings';

describe('parseSettings', () => {
  it('turns the sound on by default', () => {
    expect(parseSettings(undefined)).toEqual({ sound: true });
    expect(parseSettings({ sound: 'off' })).toEqual({ sound: true });
  });

  it('keeps a saved sound setting', () => {
    expect(parseSettings({ sound: false })).toEqual({ sound: false });
  });
});
