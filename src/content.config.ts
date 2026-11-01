import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const GENRES = ['puzzle', 'platformer', 'hack-and-slash', 'point-and-click', 'action-adventure', 'real-time-strategy'] as const;

const games = defineCollection({
  // The default id slugifies the file name and drops the dot ("tilten"); keep "<slug>.<locale>".
  loader: glob({ pattern: '*.{en,fr}.md', base: './src/content/games', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string().max(30),
    tagline: z.string().max(90),
    genre: z.enum(GENRES),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.{en,fr}.md', base: './src/content/pages', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { games, pages };
