# Spécifications techniques

## Stack technique

### Génération de site

- **Astro**, en génération statique pure (`output: 'static'`), sans adaptateur serveur.
- **TypeScript** en mode strict pour tout le code (pages, composants, jeux, scripts).
- Routage multilingue natif d'Astro (voir "Structure des URLs").

### CSS / UI

- CSS natif avec custom properties. Les tokens de la charte (`style-guide.md`) sont déclarés une seule fois dans `src/styles/tokens.css`.
- Styles scopés des composants Astro pour le chrome du site et l'interface commune des jeux.
- Pas de framework UI (React, Vue, Svelte...) : l'interactivité du site se limite à l'hôte de jeu, écrit en TypeScript natif.

### Polices

- **Chakra Petch** (600, 700) pour les titres et l'interface de jeu, **Inter** (variable, 400 à 600) pour le texte. Voir "Typographie" dans `style-guide.md`.
- Fichiers `woff2` (sous-ensembles latin et latin-ext) hébergés par le site dans `public/fonts/<family>/`, accompagnés de leur licence (SIL Open Font License). Aucun appel à un service de polices tiers.
- `font-display: swap`. Préchargement (`<link rel="preload">`) des deux fichiers latin les plus utilisés : Inter et Chakra Petch 700.

### Icônes

Icônes SVG issues de Lucide (licence ISC), copiées une à une dans `src/icons/` et rendues inline par un composant `Icon.astro`. Pas de package d'icônes en dépendance. Liste des icônes dans "Iconographie" (`style-guide.md`).

### Jeux

- Chaque jeu est un module TypeScript autonome (`src/games/<slug>/`), chargé uniquement sur sa page.
- La technique de rendu est libre et choisie jeu par jeu (DOM et CSS, SVG, Canvas 2D, WebGL, moteur tiers), documentée dans le `technical-specifications.md` du jeu. Un moteur tiers est une nouvelle dépendance, à discuter avant ajout.
- Son : Web Audio API, via le service audio de l'hôte (voir "Contrat d'un jeu").

### Ce qu'on n'utilise pas

- Pas de framework UI ni de Tailwind.
- Pas de backend, de base de données ni d'API externe.
- Pas d'outil de mesure d'audience ni de cookie.
- Pas de CDN tiers à l'exécution : tout est servi depuis le site.
- Pas de tests end-to-end pour l'instant (voir "Tests").

## Hébergement et déploiement

- **GitHub Pages**, domaine personnalisé `play.heubes.io` (`public/CNAME`, enregistrement DNS `CNAME` vers `<compte>.github.io`), HTTPS forcé.
- **GitHub Actions**, workflow unique `.github/workflows/ci.yml` :
  - sur chaque pull request et chaque push : `npm ci`, vérification des types (`astro check`), tests (`vitest run`), build (`astro build`) ;
  - sur push sur `main` uniquement, si toutes les étapes passent : déploiement du dossier `dist/` sur GitHub Pages (`actions/upload-pages-artifact`, `actions/deploy-pages`).
- Un test ou une vérification de types en échec bloque le déploiement.

## Dépendances (versions figées)

Versions exactes dans `package.json` (pas de `^` ni de `~`), `package-lock.json` versionné.

| Package | Type | Rôle |
|---|---|---|
| `astro` | dépendance | Génération du site. |
| `typescript` | dev | Typage. |
| `@astrojs/check` | dev | Vérification des types des fichiers `.astro` et `.ts`. |
| `vitest` | dev | Tests unitaires (voir "Tests"). |

Les versions retenues sont la dernière version stable de chaque package au moment de l'étape 1 de `BUILD-PLAN.md`, sous réserve de compatibilité entre elles : TypeScript reste en 6.x tant que `@astrojs/check` n'accepte pas la 7 (pair `typescript ^5 || ^6`). Toute autre dépendance est discutée avant ajout et documentée ici (dépendance du site) ou dans le `technical-specifications.md` du jeu (dépendance propre à un jeu).

## Structure des fichiers

```
.github/workflows/ci.yml
public/
  CNAME
  robots.txt
  og-image.png                 image de partage par défaut
  covers/<slug>.webp
  fonts/<family>/*.woff2, OFL.txt
src/
  content.config.ts            schéma des content collections
  content/
    content.test.ts            contrôles de validation entre fichiers
    games/<slug>.en.md, <slug>.fr.md
    pages/about.en.md, about.fr.md
  i18n/
    en.json, fr.json           textes d'interface du site et de l'interface commune des jeux
    index.ts                   accès aux traductions
  icons/*.svg, LICENSE         icônes Lucide et leur licence (ISC)
  styles/
    tokens.css                 tokens de la charte
    global.css                 reset, polices, styles de base
  layouts/
    BaseLayout.astro           <head>, en-tête, pied de page
  components/
    Header.astro, Footer.astro, LanguageSelector.astro, Icon.astro
    GameCard.astro
    game-ui/                   interface commune des jeux (HUD, panneaux, sélecteur de niveaux)
  views/
    HomePage.astro, GamePage.astro, AboutPage.astro
  pages/
    index.astro, about.astro, [slug].astro
    fr/index.astro, fr/about.astro, fr/[slug].astro
    sitemap.xml.ts
  games/
    shell/                     hôte de jeu : contrat, cycle de vie, stockage, audio, i18n
    <slug>/
      index.ts                 point d'entrée : exporte la définition du jeu
      logic/                   logique pure, sans DOM, et ses tests (*.test.ts)
      render/                  rendu et contrôles
      levels/                  contenu (niveaux), si le jeu en a
      i18n/en.json, fr.json    textes du jeu
      <slug>.css               styles de l'aire de jeu
scripts/                       scripts de développement (hors build)
```

Les pages de `src/pages/` sont de simples points d'entrée qui passent la langue aux vues de `src/views/`, pour ne pas dupliquer le markup entre les deux langues.

Un utilitaire n'entre dans `src/games/shell/` que lorsqu'au moins deux jeux en ont besoin. D'ici là, il reste dans le dossier du jeu.

### Schéma des content collections (indicatif)

```ts
// src/content.config.ts
const games = defineCollection({
  loader: glob({
    pattern: '*.{en,fr}.md',
    base: './src/content/games',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().max(30),
    tagline: z.string().max(90),
    genre: z.enum(['puzzle', 'platformer', 'hack-and-slash', 'point-and-click', 'action-adventure', 'real-time-strategy']),
  }),
});
```

L'identifiant d'une entrée est `<slug>.<locale>` (`tilt.en`), d'où le slug et la langue se déduisent. Sans `generateId`, le loader dérive l'identifiant du nom de fichier en supprimant le point (`tilten`), ce qui rend slug et langue indissociables.

## Architecture

### Rendu

Toutes les pages sont générées au build. Le seul JavaScript envoyé au navigateur est celui de la page de jeu : l'hôte de jeu et le module du jeu. Les pages d'accueil et "About" n'envoient aucun JavaScript, en dehors du strict nécessaire à l'en-tête s'il y en a.

### Structure des URLs

| Page | Anglais | Français |
|---|---|---|
| Accueil | `/` | `/fr/` |
| Jeu | `/<slug>/` | `/fr/<slug>/` |
| About | `/about/` | `/fr/about/` |

Configuration i18n d'Astro : `defaultLocale: 'en'`, `locales: ['en', 'fr']`, `prefixDefaultLocale: false`. URLs avec barre oblique finale.

### Textes d'interface

- Textes du site et de l'interface commune des jeux : `src/i18n/en.json` et `fr.json`, clés hiérarchiques en kebab-case (`footer.license`, `game.pause.resume`).
- Textes propres à un jeu : `src/games/<slug>/i18n/`, chargés avec le module du jeu et exposés par le contexte du jeu (`t()`).
- Une clé absente dans une langue est une erreur de validation (voir `data-model.md`), jamais un repli silencieux sur l'autre langue.

### Hôte de jeu

L'hôte de jeu (`src/games/shell/`) est le script client de la page de jeu. Il :

- charge le module du jeu par import dynamique (`import.meta.glob('/src/games/*/index.ts')`), ce qui produit un chunk par jeu ; le chargement démarre dès que la page est inactive (`requestIdleCallback`), pour que "Play" réponde sans délai ;
- gère les modes de la page (hors partie, en partie, pause, fin de niveau) décrits dans `game-page.md` ;
- affiche le HUD, les panneaux et le sélecteur de niveaux, dont le markup est généré au build par les composants `game-ui/` ;
- capte les raccourcis communs (`Échap`, `P`, `R`), la perte de focus (`visibilitychange`, `blur`) et le plein écran ;
- fournit au jeu son contexte (stockage, audio, traductions, HUD, annonces) ;
- appelle les méthodes du cycle de vie du jeu.

### Contrat d'un jeu

Interface indicative, à affiner à l'implémentation sans en changer l'esprit :

```ts
// src/games/<slug>/index.ts exporte par défaut une GameDefinition
export interface GameDefinition {
  // Absent pour un jeu sans niveaux : le sélecteur n'est alors pas affiché.
  getLevels?(storage: GameStorage): LevelEntry[];
  // Actions propres au jeu affichées dans le HUD (ex. annuler un coup).
  actions?: GameAction[];
  create(context: GameContext): GameInstance;
}

export interface LevelEntry {
  id: string;
  label: string;
  status: 'locked' | 'available' | 'completed' | 'perfect';
}

export interface GameAction {
  id: string;
  icon: string;          // nom d'une icône de src/icons/
  labelKey: string;      // clé de traduction du jeu
  shortcut?: string;     // valeur de KeyboardEvent.key, affichée dans l'infobulle
}

export interface GameContext {
  container: HTMLElement;        // aire de jeu, vide, dimensionnée par l'hôte
  locale: 'en' | 'fr';
  t(key: string, params?: Record<string, string | number>): string;
  storage: GameStorage;          // clé play:<slug>, enveloppe versionnée gérée par l'hôte
  audio: GameAudio;
  hud: {
    setLevelLabel(label: string): void;
    setStats(stats: { id: string; label: string; value: string }[]): void;
    setActionEnabled(actionId: string, enabled: boolean): void;
  };
  announce(message: string): void;   // région aria-live
  reducedMotion(): boolean;
  complete(result: LevelResult): void;
  signal: AbortSignal;               // annulé à la destruction : écouteurs ajoutés avec { signal }
}

export interface LevelResult {
  status: 'completed' | 'perfect';
  stats: { label: string; value: string }[];
  message?: string;
}

export interface GameStorage {
  read<T>(): T | undefined;
  write<T>(data: T): void;
}

export interface GameAudio {
  context(): AudioContext | undefined; // undefined tant que le joueur n'a pas interagi
  output(): AudioNode | undefined;     // nœud de sortie, coupé par l'hôte selon le réglage Son
}

export interface GameInstance {
  start(levelId?: string): void;
  pause(): void;
  resume(): void;
  restart(): void;
  action?(actionId: string): void;
  resize?(): void;
  destroy(): void;
}
```

Règles :

- Le jeu ne touche qu'à son `container`. Il n'accède ni au reste du DOM, ni à `localStorage`, ni à `document` pour les écouteurs globaux (les raccourcis communs appartiennent à l'hôte). Ses écouteurs clavier sont posés sur `container`, qui reçoit le focus pendant la partie.
- `pause()` arrête toute boucle d'animation, tout timer et tout traitement des entrées. `resume()` les relance.
- `destroy()` libère toutes les ressources. L'usage de `signal` pour les écouteurs est obligatoire.
- `complete()` est appelé une seule fois par niveau. Le jeu ne traite plus d'entrée ensuite, jusqu'au prochain `start()` ou `restart()`.
- Le versionnement de la sauvegarde est déclaré par le jeu (numéro de version et migrations) et appliqué par l'hôte (voir "Persistance" dans `data-model.md`).

## Règles communes à tous les jeux

### Séparation logique / rendu

- `logic/` contient l'état et les règles du jeu en TypeScript pur : aucun accès au DOM, aux API du navigateur, au temps réel ni à `Math.random`. L'aléatoire passe par un générateur pseudo-aléatoire à graine, injecté.
- Les fonctions de `logic/` prennent un état et retournent un nouvel état, sans mutation. L'annulation d'un coup s'obtient en conservant les états précédents.
- `render/` lit l'état et le traduit en affichage, et traduit les entrées du joueur en appels à `logic/`.
- Les jeux en temps réel (plateforme, action) appliquent la même séparation : `logic/` expose une fonction de pas de simulation à durée fixe, testable sans boucle d'animation.

### Contrôles

- Pointeur : Pointer Events uniquement (pas d'écouteurs `mouse*` ou `touch*` séparés). `touch-action: none` sur l'aire de jeu pendant la partie.
- Cibles tactiles : au moins 44 × 44 px CSS pour les boutons de l'interface ; au moins 32 × 32 px pour les éléments touchables d'une grille de jeu, qui ne peut pas toujours tenir à 44px sur un téléphone en paysage (le minimum WCAG 2.2 AA est de 24px).
- Une entrée reçue pendant une animation la termine immédiatement, puis est traitée : le jeu ne perd ni ne met en attente une entrée.

### Animations

- Les animations passent par CSS, la Web Animations API ou la boucle de rendu du jeu, jamais par des timers.
- `context.reducedMotion()` est relu au début de chaque niveau. Le `technical-specifications.md` du jeu indique ce que devient chaque animation en mouvement réduit.

### Son

- Les sons sont synthétisés avec Web Audio ou chargés depuis des fichiers (`.mp3`, pour la compatibilité Safari) placés dans `src/games/<slug>/sounds/`.
- Tout son est connecté à `context.audio.output()`. Un jeu ne crée pas son propre `AudioContext`.

### Performance

- 60 images par seconde visées sur un mobile milieu de gamme récent.
- Le module d'un jeu reste léger. Un budget propre au jeu peut être fixé dans son `technical-specifications.md`.

## Tests

- **Outil** : Vitest. Les tests sont colocalisés avec le code testé (`logic/*.test.ts`).
- **Périmètre obligatoire** : la logique pure de chaque jeu (`logic/`), le contenu des jeux (validité des niveaux, voir `game-model.md` de chaque jeu) et les utilitaires purs de `shell/` (enveloppe de stockage, migrations).
- **Traçabilité** : chaque critère d'acceptation d'une spec de jeu porte un identifiant (`AC-01`, `AC-02`...). Un critère qui porte sur la logique est couvert par au moins un test dont le nom commence par cet identifiant (`it('AC-03: a block stops on a sticky tile', ...)`). Les critères marqués "vérification manuelle" sont vérifiés dans le navigateur, en desktop et en mobile, au critère de fin de l'étape correspondante du `BUILD-PLAN.md` du jeu.
- **Hors périmètre** : rendu, DOM, animations, tests end-to-end.
- Les tests tournent en CI et bloquent le déploiement (voir "Hébergement et déploiement").

## Validation du contenu

Les règles de `data-model.md` ("Contraintes et règles de validation") sont vérifiées automatiquement : le schéma Zod des content collections fait échouer le build, et les contrôles entre fichiers (couverture et point d'entrée présents, sections obligatoires des règles, clés de traduction identiques, unicité des titres) sont écrits en tests Vitest dans `src/content/content.test.ts`.

## Accessibilité

- WCAG 2.2 niveau AA pour le site et l'interface commune des jeux.
- Navigation complète au clavier, focus toujours visible (voir "Focus" dans `style-guide.md`).
- Gestion du focus par l'hôte : il passe à l'aire de jeu au démarrage d'une partie, au panneau ouvert en pause ou en fin de niveau (focus piégé dans le panneau), et revient sur le bouton "Play" en sortie de partie.
- L'aire de jeu a un nom accessible (titre du jeu) et une description qui renvoie aux contrôles. Les changements d'état importants (coup joué, objectif atteint, niveau terminé) sont annoncés par `context.announce()`.
- Une information de jeu n'est jamais portée par la couleur seule : forme, symbole ou texte la doublent.
- `lang` correct sur `<html>` ; lien d'évitement vers le contenu principal.

## SEO

- `<title>` : `<titre de la page> | play.heubes.io` (accueil : `play.heubes.io | <accroche du site>`).
- Meta description : accroche du jeu, ou texte dédié pour l'accueil et "About" (dans `src/i18n/`).
- `<link rel="canonical">`, `<link rel="alternate" hreflang>` pour `en`, `fr` et `x-default` (anglais).
- Open Graph et Twitter Card : titre, description, image (couverture du jeu, image générique du site ailleurs), URL absolues.
- `sitemap.xml` généré par un endpoint Astro (`src/pages/sitemap.xml.ts`), sans dépendance. `robots.txt` statique qui le référence.

## Conventions de nommage

- Slugs, fichiers de données, classes CSS, clés de traduction : kebab-case.
- Composants Astro : PascalCase (`GameCard.astro`).
- Fichiers TypeScript : kebab-case (`level-parser.ts`). Types et interfaces en PascalCase, fonctions et variables en camelCase, constantes de module en SCREAMING_SNAKE_CASE.
- Identifiants de niveau : propres à chaque jeu, stables dans le temps (ils servent de clé dans les sauvegardes).

## CSS : conventions

- Les couleurs, tailles et durées viennent des tokens (`var(--color-...)`). Aucune valeur de couleur en dur hors de `tokens.css`, sauf la palette de l'aire de jeu, déclarée en custom properties à la racine de l'aire de jeu (`.game-<slug>`) et documentée dans le `style-guide.md` du jeu.
- Les styles d'un jeu sont préfixés par sa classe racine `.game-<slug>` et ne débordent pas de l'aire de jeu.
- Mobile first, `min-width` dans les media queries.
- `@media (prefers-reduced-motion: reduce)` traité dans chaque feuille qui anime.

## JavaScript : conventions

- TypeScript strict, avec `noUncheckedIndexedAccess`. Pas de `any` ; `unknown` puis affinage pour les données externes (sauvegardes, JSON).
- Modules ES, exports nommés, sauf l'export par défaut de `GameDefinition` dans `src/games/<slug>/index.ts`.
- Pas de variable globale ni d'état au niveau du module dans un jeu : tout l'état d'une instance vit dans `create()`.
