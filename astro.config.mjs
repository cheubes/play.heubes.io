import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

const externalLinks = {
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      if (/^https?:\/\//.test(String(node.properties?.href ?? ''))) {
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'ariaDescribedBy', 'new-tab-hint');
      }
    },
  },
};

export default defineConfig({
  site: 'https://play.heubes.io',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: satteri({ hastPlugins: [externalLinks] }),
  },
});
