# play.heubes.io

A catalog of original mini games for the web, playable in the browser with a keyboard and mouse on desktop, or by touch on mobile. Static site, in English and French, built with Astro and hosted on GitHub Pages.

## Project status

In development: the site is designed in `specs/` and built step by step following `BUILD-PLAN.md`. Each game has its own specs and build plan in `specs/<game-slug>/`.

## Development

Requires Node.js 22.23.4 or later.

```sh
npm install
npx playwright install chromium  # browser for the end-to-end tests, once
npm run dev      # start the dev server on http://localhost:4321
npm run check    # type-check .astro and .ts files
npm test         # run unit tests once
npm run test:e2e # run end-to-end tests on the built site (run the build first)
npm run build    # build the static site into dist/
npm run preview  # serve the built site
```

After editing `public/favicon.svg`, regenerate `favicon.ico` and `apple-touch-icon.png` with `node scripts/generate-favicons.ts` (requires `rsvg-convert`, from librsvg).

## Repository layout

- `specs/`: design specifications (in French), the source of truth for every implementation decision.
- `specs/_template/`: template folder to copy when specifying a new game.
- `BUILD-PLAN.md`: incremental build plan for the site.
- `CLAUDE.md`: working rules for AI-assisted development.

## Licenses

Code under MIT, original assets and texts under CC BY-NC-SA 4.0. Third-party resources keep their own licenses and are credited on the site's About page.
