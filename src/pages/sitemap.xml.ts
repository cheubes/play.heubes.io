import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLocalizedPath, LOCALES } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('The sitemap needs "site" in astro.config.mjs.');
  }
  const games = await getCollection('games');
  const paths = LOCALES.flatMap((locale) => [
    getLocalizedPath(locale),
    getLocalizedPath(locale, 'about'),
    ...games.filter((entry) => entry.id.endsWith(`.${locale}`)).map((entry) => getLocalizedPath(locale, entry.id.slice(0, -`.${locale}`.length))),
  ]);
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
