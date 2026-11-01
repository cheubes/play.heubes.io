import { describe, expect, it } from 'vitest';
import siteEn from '../i18n/en.json';
import siteFr from '../i18n/fr.json';

interface GameFrontmatter {
  title: string;
  genre: string;
}

const RESERVED_SLUGS = ['about', 'fr', 'en', 'covers', 'fonts', '404', 'settings'];
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REQUIRED_SECTIONS: Record<string, string[]> = {
  en: ['How to play', 'Controls'],
  fr: ['Comment jouer', 'Contrôles'],
};

const contentFiles = import.meta.glob<GameFrontmatter>('./games/*.md', { eager: true, import: 'frontmatter' });
const contentSources = import.meta.glob<string>('./games/*.md', { eager: true, query: '?raw', import: 'default' });
const coverFiles = Object.keys(import.meta.glob('/public/covers/*.webp', { query: '?url' }));
const entryFiles = Object.keys(import.meta.glob('/src/games/*/index.ts'));
const gameTranslations = import.meta.glob<Record<string, unknown>>('/src/games/*/i18n/*.json', { eager: true, import: 'default' });

const entries = Object.entries(contentFiles).map(([path, frontmatter]) => {
  const match = /\/([^/]+)\.(en|fr)\.md$/.exec(path);
  if (!match) {
    throw new Error(`Content file "${path}" must be named <slug>.en.md or <slug>.fr.md.`);
  }
  const [, slug = '', locale = ''] = match;
  return { path, slug, locale, frontmatter };
});

const slugs = [...new Set(entries.map((entry) => entry.slug))];

function findEntry(slug: string, locale: string) {
  return entries.find((entry) => entry.slug === slug && entry.locale === locale);
}

function flattenKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) {
    return [prefix];
  }
  return Object.entries(node)
    .flatMap(([key, value]) => flattenKeys(value, prefix ? `${prefix}.${key}` : key))
    .sort();
}

describe('site content', () => {
  it('has the same translation keys in src/i18n/en.json and fr.json', () => {
    expect(flattenKeys(siteFr)).toEqual(flattenKeys(siteEn));
  });

  it('has no duplicate game title within a language', () => {
    for (const locale of ['en', 'fr']) {
      const titles = entries.filter((entry) => entry.locale === locale).map((entry) => entry.frontmatter.title);
      expect(titles, `duplicate titles in ${locale}`).toEqual([...new Set(titles)]);
    }
  });
});

describe.each(slugs)('game "%s"', (slug) => {
  it('has a kebab-case, non-reserved slug', () => {
    expect(slug).toMatch(KEBAB_CASE);
    expect(RESERVED_SLUGS).not.toContain(slug);
  });

  it('has both content files with the same genre', () => {
    const en = findEntry(slug, 'en');
    const fr = findEntry(slug, 'fr');
    expect(en, `missing src/content/games/${slug}.en.md`).toBeDefined();
    expect(fr, `missing src/content/games/${slug}.fr.md`).toBeDefined();
    expect(fr?.frontmatter.genre).toBe(en?.frontmatter.genre);
  });

  it.each(['en', 'fr'])('has the required rule sections in %s', (locale) => {
    const entry = findEntry(slug, locale);
    const headings = (entry ? (contentSources[entry.path] ?? '') : '').match(/^## .+$/gm) ?? [];
    for (const section of REQUIRED_SECTIONS[locale] ?? []) {
      expect(headings, `missing "## ${section}" in ${slug}.${locale}.md`).toContain(`## ${section}`);
    }
  });

  it('has a cover image', () => {
    expect(coverFiles).toContain(`/public/covers/${slug}.webp`);
  });

  it('has an entry point', () => {
    expect(entryFiles).toContain(`/src/games/${slug}/index.ts`);
  });

  it('has the same translation keys in i18n/en.json and fr.json', () => {
    const en = gameTranslations[`/src/games/${slug}/i18n/en.json`];
    const fr = gameTranslations[`/src/games/${slug}/i18n/fr.json`];
    expect(en, `missing src/games/${slug}/i18n/en.json`).toBeDefined();
    expect(fr, `missing src/games/${slug}/i18n/fr.json`).toBeDefined();
    expect(flattenKeys(fr)).toEqual(flattenKeys(en));
  });
});
