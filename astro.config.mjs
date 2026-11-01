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

const TABLE_ROLES = { table: 'table', thead: 'rowgroup', tbody: 'rowgroup', tr: 'row', th: 'columnheader', td: 'cell' };

function childElements(node) {
  return (node?.children ?? []).filter((child) => child.type === 'element');
}

function textContent(node) {
  return node.type === 'text' ? node.value : (node.children ?? []).map(textContent).join('');
}

// Below 640px, tables are laid out as cards, which needs each cell's column header.
// The explicit roles keep the table semantics that some browsers drop once the display of table elements changes.
const tableLabels = {
  name: 'table-labels',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      const setRoles = (element) => {
        if (TABLE_ROLES[element.tagName]) {
          ctx.setProperty(element, 'role', TABLE_ROLES[element.tagName]);
        }
        childElements(element).forEach(setRoles);
      };
      setRoles(node);
      const [head, body] = childElements(node);
      const labels = childElements(childElements(head)[0]).map(textContent);
      for (const row of childElements(body)) {
        childElements(row).forEach((cell, index) => ctx.setProperty(cell, 'dataLabel', labels[index]));
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
    processor: satteri({ hastPlugins: [externalLinks, tableLabels] }),
  },
});
