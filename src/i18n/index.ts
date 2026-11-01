import { getRelativeLocaleUrl } from 'astro:i18n';
import en from './en.json';
import fr from './fr.json';

export const LOCALES = ['en', 'fr'] as const;

export type Locale = (typeof LOCALES)[number];

type Dictionary = typeof en;

type NestedKey<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKey<T[K]>}`;
}[keyof T & string];

export type TranslationKey = NestedKey<Dictionary>;

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function createTranslator(locale: Locale): (key: TranslationKey) => string {
  const dictionary = DICTIONARIES[locale];
  return (key) => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, segment) => (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[segment] : undefined),
        dictionary,
      );
    if (typeof value !== 'string') {
      throw new Error(`Missing translation "${key}" for locale "${locale}".`);
    }
    return value;
  };
}

export function getLocalizedPath(locale: Locale, path = ''): string {
  return getRelativeLocaleUrl(locale, path);
}

export function getAlternatePath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== undefined && isLocale(segments[0])) {
    segments.shift();
  }
  return getLocalizedPath(locale, segments.join('/'));
}
