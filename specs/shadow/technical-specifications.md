# Spécifications techniques : Shadow

## Rendu

SVG, comme Prism. Un seul élément `<svg>` dont le `viewBox` est exprimé en unités de case, avec une marge d'une demi-case de chaque côté pour les indicateurs de lumière : `-0.5 -0.5 (cols + 1) (rows + 1)`. Le plateau se met à l'échelle sans calcul, les étages des tours restent nets à toute taille, et chaque case est une zone cliquable.

Couches, de bas en haut :

1. sol : un rectangle par case, rempli selon l'état de la case (soleil, pénombre, ombre), la pénombre par un motif de hachures (`<pattern>`) ;
2. repères de grille (décoratifs) ;
3. cibles ;
4. tours ;
5. indicateurs de lumière, dans la marge ;
6. curseur de sélection au clavier ;
7. zones de toucher : un rectangle transparent par case, au-dessus de tout le reste (voir "Contrôles").

L'état du sol est dessiné case par case, et non par des formes d'ombre superposées : les règles sont définies par case, et la pénombre doit se lire comme un état à part entière, pas comme la superposition de deux ombres translucides.

Taille : `fitCellSize` (`src/games/shell/dom.ts`) appelé avec `cols + 1` et `rows + 1` pour compter la marge, cases plafonnées à 72px.

Alternatives écartées :
- **Vue isométrique ou 3D (WebGL)** : plus spectaculaire, mais les tours masquent les cases situées derrière elles, les zones de toucher deviennent des losanges, et une case de 32px ne suffit plus à lire une hauteur. La vue du dessus avec étages garde la grille lisible, et un moteur 3D serait une nouvelle dépendance.
- **Canvas 2D** : mêmes raisons que pour Prism (haute densité, repérage des clics et redessin à gérer soi-même pour 64 cases au plus).

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`. |
| `logic/shade.ts` | `computeShade`. |
| `logic/shadow.ts` | `createState`, `raise`, `undo`, `restart`, `isSolved`. |
| `logic/solver.ts` | Solveur, pour les tests uniquement. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/board.ts` | Création du SVG, dessin du sol, des cibles, des tours et des lumières, dimensionnement. |
| `render/animations.ts` | Changements de hauteur, d'ombre et de cible, victoire. |
| `render/input.ts` | Pointeur et sélection au clavier. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

Utilitaires communs (`src/games/shell/`) :
- `progress.ts` pour la progression, et `fitCellSize` (`dom.ts`) pour la taille de case, partagés avec Tilt et Prism ;
- la sélection au clavier commune, `nextSelection` (`src/games/shell/selection.ts`), partagée avec Prism et Delta : Shadow lui passe les positions de ses éléments sélectionnables (voir "Structure des fichiers" dans `technical-specifications.md`). La sélection de départ reste propre à Shadow.

## Contrôles

- Pointeur : chaque case porte un rectangle transparent qui couvre toute la case. Un `pointerup` sur une case appelle `raise` à cette position. Un déplacement de plus de 10px entre `pointerdown` et `pointerup` annule le toucher. Toucher une tour réglable y déplace aussi la sélection.
- Sélection au clavier : positions sélectionnables = tours réglables. Même règle que Prism : départ sur la première tour réglable dans l'ordre de lecture ; une flèche sélectionne, parmi les tours réglables situées strictement dans cette direction, celle qui minimise `distance dans l'axe + 2 × écart perpendiculaire` ; s'il n'y en a aucune, la sélection ne bouge pas. `Espace` et `Entrée` montent la tour sélectionnée ; `z`, `Z` et `Backspace` annulent.
- Le curseur de sélection n'est affiché qu'après une première touche du clavier, et masqué dès une utilisation du pointeur. Une flèche, `Espace` ou `Entrée` qui fait apparaître le curseur ne fait que l'afficher. L'annulation agit toujours.
- Une entrée reçue pendant une animation appelle `finish()` sur les animations en cours, puis est traitée (règle commune).

## Animations

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Tour qui monte | Le nouvel étage apparaît par une mise à l'échelle de 0,6 à 1 et un fondu, 150ms, `--ease-out` | Instantanée |
| Tour qui revient à 0 | Les étages s'enfoncent (échelle de 1 à 0,6, fondu sortant), 150ms, `--ease-in-out` | Instantanée |
| Changement d'état d'une case | Fondu vers le nouvel état en 120ms, décalé de 25ms par case de distance à la tour touchée : l'ombre semble s'allonger ou se retirer depuis la tour | Changement immédiat |
| Cible satisfaite | Remplissage du symbole et anneau qui pulse, 200ms | Changement immédiat |
| Cible qui ne l'est plus | Fondu de 120ms | Changement immédiat |
| Victoire | Le sol au soleil s'éclaircit (`--shadow-floor-sun` vers `--shadow-floor-sun-warm`) sur 320ms, les cibles pulsent l'une après l'autre dans l'ordre de lecture (80ms d'écart), puis `complete()` | Sol éclairci sans transition, `complete()` immédiat |

Pas d'animation continue. Les états des cibles sont mis à jour à la fin du fondu de leur case.

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Tour qui monte | Choc de pierre : bruit filtré passe-bande, 50ms, plus une sinusoïde grave brève dont la hauteur monte avec la hauteur atteinte (trois notes) | Hauteur 1, 2 ou 3 atteinte |
| Tour qui revient à 0 | Bruit sourd : sinusoïde grave descendante de 120ms et souffle de bruit filtré passe-bas | Passage de 3 à 0 |
| Cible satisfaite | Note de carillon doux (sinusoïdes harmoniques, décroissance de 500ms) : grave pour une cible d'ombre, aiguë pour une cible de soleil | Cible qui devient satisfaite |
| Cible perdue | Note brève descendante, faible volume | Cible qui ne l'est plus |
| Victoire | Accord qui s'ouvre (trois notes décalées de 60ms), 900ms | Niveau résolu |
| Annulation | Clic bref, plus grave que le choc de pierre | Annulation |

Toutes les notes appartiennent à une même gamme pentatonique, pour que plusieurs cibles satisfaites d'affilée sonnent juste ensemble.

## Tests

- Tests des critères AC-01 à AC-09 dans `logic/*.test.ts`.
- AC-09 énumère au plus 4^8 combinaisons par niveau : le test complet reste sous 10 secondes en CI.

## Performance

- `computeShade` est recalculé après chaque coup : il reste sous 1ms pour un plateau de 8 × 8.
- Un coup met à jour l'état des cases de sol (classe ou remplissage de leur rectangle) et la tour touchée, sans reconstruire le reste du SVG.
- Le module publié reste sous 30 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

Aucun pour l'instant.
