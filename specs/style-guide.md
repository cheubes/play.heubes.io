# Charte graphique

## Direction

Un lanceur de jeux moderne, en thème sombre unique. Fond profond, cartes de jeu mises en valeur, une couleur d'accent vive pour le focus et les actions, retours visuels marqués au survol et au focus (légère élévation, liseré lumineux). Le chrome du site reste sobre pour laisser la vedette à la direction artistique de chaque jeu, qui peut aller du puzzle épuré au pixel art.

Cette charte s'applique au chrome du site et à l'interface commune des jeux. L'aire de jeu a sa propre direction artistique, définie dans le `style-guide.md` du jeu (voir "Ce qu'un jeu peut redéfinir").

## Couleurs

Tokens déclarés dans `src/styles/tokens.css`. Contrastes calculés selon WCAG 2.2, sur `--color-bg` sauf mention contraire.

### Surfaces

| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#0B0F17` | Fond de page et de l'aire de jeu. |
| `--color-surface` | `#131A26` | Tuiles, pied de page, HUD. |
| `--color-surface-raised` | `#1B2433` | Panneaux, boutons de niveau, éléments survolés. |
| `--color-border` | `#2B3648` | Bordures et séparateurs, décoratifs uniquement. |
| `--color-scrim` | `rgb(6 9 14 / 0.72)` | Voile derrière les panneaux de pause et de fin. |

### Texte

| Token | Valeur | Contraste | Usage |
|---|---|---|---|
| `--color-text` | `#E9EEF6` | 16,5:1 | Texte principal, titres. |
| `--color-text-muted` | `#9BA7BA` | 7,9:1 (6,4:1 sur `surface-raised`) | Texte secondaire, libellés, pied de page. |

### Accents et états

| Token | Valeur | Contraste | Usage |
|---|---|---|---|
| `--color-accent` | `#3BD9F5` | 11,4:1 | Action principale, liens, focus, niveau en cours. |
| `--color-accent-hover` | `#7BE7FA` | | Survol de l'action principale. |
| `--color-on-accent` | `#06121A` | 11,2:1 sur `accent` | Texte sur fond d'accent. |
| `--color-highlight` | `#FF5FA2` | 6,8:1 | Mise en valeur ponctuelle : résultat parfait, étoile. Jamais pour une action. |
| `--color-success` | `#5EE08F` | 11,5:1 | Niveau terminé, confirmation. |
| `--color-warning` | `#FFC857` | 12,5:1 | Avertissement. |
| `--color-danger` | `#FF6B6B` | 6,9:1 | Action destructrice (réinitialiser la progression). |

### Lueurs

| Token | Valeur | Usage |
|---|---|---|
| `--glow-accent` | `0 0 0 1px var(--color-accent), 0 0 20px rgb(59 217 245 / 0.35)` | Survol et focus des tuiles, niveau en cours. |
| `--glow-highlight` | `0 0 0 1px var(--color-highlight), 0 0 20px rgb(255 95 162 / 0.35)` | Niveau `perfect`, panneau de résultat parfait. |

## Typographie

| Rôle | Police | Graisse | Particularités |
|---|---|---|---|
| Titres, logo, boutons, HUD, badges | Chakra Petch | 600, 700 | Lettrage légèrement espacé (`0.02em`) ; libellés courts en capitales espacées (`0.08em`). |
| Texte courant, descriptions, règles | Inter | 400 à 600 | |
| Chiffres du HUD et des résultats | Chakra Petch | 700 | `font-variant-numeric: tabular-nums`, pour que les compteurs ne bougent pas. |

Échelle (`--font-size-*`) : `xs` 0.75rem, `sm` 0.875rem, `base` 1rem, `lg` 1.25rem, `xl` 1.5rem, `2xl` 2rem, `3xl` 2.75rem.

- Interlignage : 1.6 pour le texte, 1.15 pour les titres.
- Longueur de ligne du texte courant : 68 caractères au plus.
- Titre de page (`h1`) : `2xl` sur mobile, `3xl` à partir de 640 px.

## Espacements, grille et responsive

- Espacements (`--space-*`), base 4 px : `1` 4px, `2` 8px, `3` 12px, `4` 16px, `5` 24px, `6` 32px, `7` 48px, `8` 64px.
- Rayons : `--radius-sm` 6px (badges), `--radius-md` 10px (boutons), `--radius-lg` 16px (tuiles, panneaux).
- Points de rupture : 640px et 1024px. Conception mobile first.
- Conteneur : largeur maximale 1200px, marges latérales de `--space-4` sur mobile, `--space-5` à partir de 640px, `--space-6` à partir de 1024px.
- Zones de sécurité (encoches, barre d'accueil) respectées avec `env(safe-area-inset-*)`, en particulier pour le pied de page, le HUD et l'aire de jeu.

### Couches (`z-index`)

| Couche | Valeur | Contenu |
|---|---|---|
| Contenu | 0 | Pages. |
| Chrome | 10 | En-tête et pied de page, hors partie. |
| Partie | 100 | Aire de jeu et HUD en mode "en partie". |
| Panneaux | 200 | Voile et panneaux (pause, fin de niveau, confirmation). |
| Chrome en pause | 300 | En-tête et pied de page réaffichés pendant la pause et la fin de niveau. |

## Animations

| Token | Valeur | Usage |
|---|---|---|
| `--duration-fast` | 120ms | Survols, changements d'état des boutons. |
| `--duration-base` | 200ms | Apparition des panneaux, transitions de mode. |
| `--duration-slow` | 320ms | Mise en valeur d'un résultat. |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Apparitions, élévations. |
| `--ease-in-out` | `cubic-bezier(0.6, 0, 0.4, 1)` | Déplacements. |

En mouvement réduit : plus de translation ni de mise à l'échelle, seules les transitions d'opacité sont conservées, en `--duration-fast`.

## Composants du site

### En-tête

- Hauteur 56px (64px à partir de 1024px), fond `--color-bg`, bordure basse `--color-border`, collant en haut de page.
- À gauche, le logo-texte : "play" en `--color-accent` suivi de ".heubes.io" en `--color-text-muted`, Chakra Petch 700, `lg`. Lien vers l'accueil de la langue courante.
- À droite, le sélecteur de langue : deux boutons texte "EN" et "FR" en Chakra Petch 600 `sm`. La langue courante est en `--color-accent`, soulignée, avec `aria-current="true"` ; l'autre en `--color-text-muted`, `--color-text` au survol. Pas de drapeaux.

### Pied de page

- Fixe en bas de l'écran, sur toutes les pages, sauf pendant une partie (voir `game-page.md`).
- Hauteur 40px plus la zone de sécurité basse, fond `--color-surface`, bordure haute `--color-border`, texte `sm` en `--color-text-muted`, centré. Sous 640px, texte `xs` et séparateurs resserrés (`--space-1`), pour que le contenu tienne sur une ligne dès 320px de large.
- Contenu, séparé par des points médians : "License" (lien vers la section licences de "About"), "About" (lien vers "About"), "Created by Christophe Heubès" (lien vers https://christophe.heubes.org/, ouvert dans le même onglet). En français : "Licence", "À propos", "Créé par Christophe Heubès".
- Les liens passent en `--color-text` au survol et au focus.
- Le corps de la page a une marge basse égale à la hauteur du pied de page, pour que rien ne soit masqué dessous.

### Boutons

| Variante | Apparence | Usage |
|---|---|---|
| Principal | Fond `--color-accent`, texte `--color-on-accent`, Chakra Petch 600 en capitales, hauteur 48px, `--radius-md`. Survol : `--color-accent-hover` et `--glow-accent`. | Une seule action principale par écran ("Play", "Next level"). |
| Secondaire | Fond transparent, bordure `--color-border`, texte `--color-text`. Survol : bordure `--color-accent`. | Actions alternatives ("Replay", "Levels"). |
| Icône | Carré de 44px, icône de 24px en `--color-text-muted`. Survol : fond `--color-surface-raised`, icône `--color-text`. Nom accessible et infobulle obligatoires. | HUD. |
| Danger | Comme le secondaire, texte et bordure en `--color-danger`. | Réinitialiser la progression. |

Désactivé : opacité 0.4, pas de survol.

### Focus

Contour de 2px en `--color-accent`, décalé de 2px, sur tous les éléments interactifs (`:focus-visible`). Exception : l'aire de jeu elle-même n'affiche pas de contour ; le jeu matérialise le focus par son propre curseur ou sa propre sélection.

### Badge de genre

Chakra Petch 600 `xs` en capitales espacées, texte `--color-text-muted`, bordure 1px `--color-border`, `--radius-sm`, marges internes 2px × 8px. Même apparence pour tous les genres.

### Tuiles (catalogue)

- Fond `--color-surface`, bordure 1px `--color-border`, `--radius-lg`, coins de l'image arrondis avec la tuile.
- Couverture en 16:9 en haut, puis, avec des marges de `--space-4` : titre (Chakra Petch 700 `xl`), accroche (Inter `sm`, `--color-text-muted`), badge de genre.
- Toute la tuile est un lien. Survol et focus : élévation de 4px, bordure `--color-accent`, `--glow-accent`, transition en `--duration-fast`.
- Grille : une colonne, deux à partir de 640px, trois à partir de 1024px, espacement `--space-5`.

## Interface commune des jeux

Composants de `src/components/game-ui/`, utilisés par tous les jeux. Leur comportement est décrit dans `game-page.md`.

### HUD

- Barre en haut de l'écran pendant la partie, hauteur 56px plus la zone de sécurité haute, fond `--color-surface` à 85 % d'opacité avec flou d'arrière-plan, bordure basse `--color-border`.
- À gauche : bouton pause, puis libellé du niveau (Chakra Petch 600 `base`).
- Au centre : statistiques du jeu, chacune avec un libellé (`xs`, capitales, `--color-text-muted`) au-dessus de sa valeur (Chakra Petch 700 `lg`, chiffres tabulaires).
- À droite : actions du jeu (ex. annuler), recommencer, son, plein écran (si disponible).
- Sous 640px, le libellé du niveau est masqué s'il manque de place ; les statistiques et les boutons restent visibles.

### Aire de jeu

Occupe toute la hauteur sous le HUD, fond `--color-bg` par défaut. Le jeu y centre son contenu et peut redéfinir le fond.

### Panneaux (pause, fin de niveau, confirmation)

- Voile `--color-scrim` sur l'aire de jeu, panneau centré : fond `--color-surface-raised`, `--radius-lg`, largeur maximale 400px, marges internes `--space-6`.
- Titre en Chakra Petch 700 `2xl`, statistiques sous forme de liste libellé / valeur, puis les boutons empilés sur toute la largeur (le principal en premier).
- Apparition : fondu et mise à l'échelle de 0.96 à 1 en `--duration-base`.
- Résultat parfait : icône étoile en `--color-highlight` au-dessus du titre, `--glow-highlight` sur le panneau, mise en valeur en `--duration-slow`.

### Sélecteur de niveaux

- Grille de boutons carrés de 64px (56px sous 640px), espacement `--space-3`, numéro du niveau en Chakra Petch 700 `lg`.

| Statut | Apparence |
|---|---|
| `locked` | Fond `--color-surface`, numéro en `--color-text-muted` remplacé par une icône cadenas, désactivé. |
| `available` | Fond `--color-surface-raised`, bordure `--color-border`. |
| `completed` | Comme `available`, avec une petite coche en `--color-success` dans le coin supérieur droit. |
| `perfect` | Comme `available`, avec une petite étoile en `--color-highlight` dans le coin supérieur droit et une bordure `--color-highlight`. |

- Le premier niveau `available` (le prochain à jouer) porte `--glow-accent`.
- Le statut est aussi donné dans le nom accessible du bouton ("Level 4, completed").

### Invite d'orientation

Panneau plein écran, icône d'appareil qui pivote et message court, pour les jeux qui imposent une orientation (voir `functional-specifications.md`).

## Ce qu'un jeu peut redéfinir

Le `style-guide.md` d'un jeu définit librement, dans l'aire de jeu uniquement :

- sa palette, déclarée en custom properties sur `.game-<slug>` ;
- ses formes, sprites, décors, effets et animations ;
- ses polices d'affichage, si elles sont hébergées par le site et sous licence compatible ;
- ses sons.

Il ne redéfinit pas le chrome du site, le HUD, les panneaux, le sélecteur de niveaux ni les boutons. S'il a besoin d'une variante de ces composants, elle est d'abord ajoutée à ce fichier.

Les éléments de jeu respectent les contrastes non textuels de WCAG (3:1 contre leur fond) et ne portent jamais une information par la couleur seule.

## Images

### Images de couverture

- `public/covers/<slug>.webp`, format 16:9, 1280 × 720 px, 120 Ko au plus.
- Une illustration ou une capture mise en scène du jeu, sans texte incrusté (le titre est affiché par la tuile).
- Lisible en petit : la tuile du catalogue l'affiche à environ 360px de large sur mobile.

### Image de partage par défaut

`public/og-image.png`, 1200 × 630 px, logo-texte du site sur `--color-bg`. Utilisée par l'accueil et "About".

## Iconographie

Icônes Lucide (voir "Icônes" dans `technical-specifications.md`), trait de 2px, taille 24px dans les boutons, 16px dans les badges de statut. Liste initiale :

| Icône Lucide | Usage |
|---|---|
| `play` | Bouton "Play". |
| `pause` | Pause (HUD). |
| `rotate-ccw` | Recommencer le niveau. |
| `undo-2` | Annuler un coup (action de jeu). |
| `volume-2`, `volume-x` | Son activé, coupé. |
| `maximize`, `minimize` | Entrer et sortir du plein écran. |
| `layout-grid` | Retour au sélecteur de niveaux. |
| `chevron-right` | Niveau suivant. |
| `lock`, `check`, `star` | Statuts de niveau. |
| `smartphone` | Invite d'orientation. |

Ajouter une icône impose de la déclarer d'abord dans ce tableau.
