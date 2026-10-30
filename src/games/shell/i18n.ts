export interface Dictionary {
  [key: string]: string | Dictionary;
}

export type TranslationParams = Record<string, string | number>;

export type Translate = (key: string, params?: TranslationParams) => string;

export function createGameTranslator(dictionary: Dictionary, locale: string): Translate {
  return (key, params = {}) => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, segment) => (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[segment] : undefined),
        dictionary,
      );
    if (typeof value !== 'string') {
      throw new Error(`Missing translation "${key}" for locale "${locale}".`);
    }
    return value.replace(/\{([\w-]+)\}/g, (_, name: string) => {
      const param = params[name];
      if (param === undefined) {
        throw new Error(`Missing parameter "${name}" for translation "${key}".`);
      }
      return String(param);
    });
  };
}

export function formatShortcut(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}
