# Spécifications techniques : Prism

## Rendu

SVG. Un seul élément `<svg>` dont le `viewBox` est exprimé en unités de case (`0 0 cols rows`) : le plateau se met à l'échelle sans calcul, les faisceaux sont des segments nets à toute taille, et chaque élément est un groupe cliquable.

Couches, de bas en haut :

1. grille (fond et repères) ;
2. faisceaux : pour chaque tronçon, un trait large et translucide (halo) puis un trait fin et opaque (cœur), dans un groupe en `mix-blend-mode: screen` pour que les faisceaux superposés s'additionnent visuellement ;
3. éléments ;
4. curseur de sélection au clavier ;
5. zones de toucher : un rectangle transparent par case, au-dessus de tout le reste (voir "Contrôles").

Taille : l'élément `<svg>` est dimensionné pour tenir dans l'aire de jeu en gardant des cases carrées, avec une marge de `--space-4`, cases plafonnées à 72px.

Alternatives écartées :
- **Canvas 2D** : lueurs faciles à obtenir, mais il faudrait gérer soi-même la haute densité, le repérage des clics et le redessin. Le nombre d'objets (64 cases au plus) ne justifie pas ce coût.
- **DOM et CSS** : tracer des faisceaux en segments de `div` est artificiel. Le SVG est fait pour ça.
- **Filtres SVG pour les lueurs** (`feGaussianBlur`) : coûteux sur mobile à chaque redessin. Le double trait halo + cœur donne un rendu proche pour un coût négligeable.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`. |
| `logic/beams.ts` | `computeBeams`. |
| `logic/prism.ts` | `createState`, `toggle`, `undo`, `restart`, `isSolved`. |
| `logic/solver.ts` | Solveur, pour les tests uniquement. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/board.ts` | Création du SVG, dessin des éléments, dimensionnement. |
| `render/beams.ts` | Dessin des faisceaux à partir de `BeamResult`. |
| `render/animations.ts` | Bascules, changements d'état des cibles, victoire. |
| `render/input.ts` | Pointeur et sélection au clavier. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

La progression (statuts des niveaux, record) vient de `src/games/shell/progress.ts`, partagée avec Tilt.

## Contrôles

- Pointeur : chaque case porte un rectangle transparent qui couvre toute la case (zone de toucher maximale). Un `pointerup` sur une case appelle `toggle` à cette position. Un déplacement de plus de 10px entre `pointerdown` et `pointerup` annule le toucher. Toucher un élément orientable y déplace aussi la sélection, pour qu'un passage au clavier reprenne là où le joueur a touché.
- Sélection au clavier : la sélection démarre sur le premier élément orientable (ordre de lecture). Une flèche sélectionne, parmi les éléments orientables situés strictement dans cette direction, celui qui minimise `distance dans l'axe + 2 × écart perpendiculaire`. S'il n'y en a aucun, la sélection ne bouge pas. `Espace` et `Entrée` font basculer l'élément sélectionné ; `z`, `Z` et `Backspace` annulent.
- Le curseur de sélection n'est affiché qu'après une première touche du clavier, et masqué dès une utilisation du pointeur. Une flèche, `Espace` ou `Entrée` qui fait apparaître le curseur ne fait que l'afficher, sur l'élément sélectionné : le joueur voit la sélection avant d'agir dessus. L'annulation agit toujours.
- Une entrée reçue pendant une animation appelle `finish()` sur les animations en cours, puis est traitée (règle commune).

## Animations

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Bascule d'un miroir | Rotation de 90° autour du centre de la case, 150ms, `--ease-out` ; faisceaux redessinés à la fin | Instantanée |
| Bascule d'un prisme | Retournement (échelle horizontale 1 → 0 → -1), 150ms ; faisceaux redessinés à la fin | Instantanée |
| Flux des faisceaux | Défilement lent d'un motif en pointillés le long du cœur (`stroke-dashoffset`), en continu | Aucun, trait plein |
| Cible qui s'allume | Remplissage des secteurs et anneau lumineux, pulsation de 200ms | Changement immédiat |
| Cible qui s'éteint | Fondu de 120ms | Changement immédiat |
| Victoire | Halos des faisceaux intensifiés (opacité doublée) sur 320ms, cibles qui pulsent l'une après l'autre (80ms d'écart), puis `complete()` | Halos intensifiés sans transition, `complete()` immédiat |

L'animation du flux s'arrête en pause, comme toute animation (règle commune).

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Bascule | Clic bref : bruit filtré passe-haut, 40ms, plus une sinusoïde de 2kHz très courte | Chaque bascule |
| Cible allumée | Note de cloche (sinusoïdes harmoniques, décroissance de 600ms), hauteur selon la couleur de la cible | Cible qui s'allume |
| Cible éteinte | Note brève descendante, faible volume | Cible qui s'éteint |
| Victoire | Accord qui s'ouvre (trois notes décalées de 60ms), 900ms | Niveau résolu |
| Annulation | Clic bref, plus grave que la bascule | Annulation |

Hauteurs des cibles allumées : notes d'une gamme pentatonique, une par couleur (rouge, vert, bleu, jaune, cyan, magenta, blanc dans l'ordre croissant), pour que plusieurs cibles allumées d'affilée sonnent toujours juste ensemble.

## Tests

- Tests des critères AC-01 à AC-12 dans `logic/*.test.ts`.
- AC-12 énumère au plus 2^14 configurations par niveau : le test complet reste sous 10 secondes en CI.

## Performance

- `computeBeams` est recalculé après chaque bascule : il reste sous 1ms pour un plateau de 8 × 8.
- Les faisceaux sont redessinés en remplaçant le contenu de leur couche, sans reconstruire le reste du SVG.
- Le module publié reste sous 30 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

- **2026-10-31 / Une cible par niveau en série 1** : avec une seule source et sans prisme, il n'y a qu'un faisceau, absorbé par la première cible qu'il atteint. Les niveaux 1 à 5 ont donc une cible unique ; leur difficulté vient du trajet (détours, croisements, miroirs utilisés des deux côtés).
- **2026-10-31 / Nombre de sources en série 2** : sans prisme, chaque faisceau finit dans une seule cible, donc la somme des primaires attendues par les cibles ne peut dépasser le nombre de sources primaires. Les niveaux 6 à 10 ont jusqu'à quatre sources.
- **2026-10-31 / Non-trivialité des niveaux** : vérifiée avec le solveur à la conception des niveaux, pas par AC-12. Critères : une seule solution de taille minimale ; hors niveaux de par 1, aucun ordre de cette solution dans lequel chaque coup diminue le nombre de primaires erronées sur les cibles ; chaque source alimente une cible dans la solution ; chaque miroir, prisme ou filtre est touché par un faisceau dans l'état initial ou dans la solution ; en série 3, un prisme décompose un faisceau d'au moins deux primaires, en série 4 un filtre retire au moins une primaire ; par croissant au sein de chaque série. Raison : "Progression" (`functional-specifications.md`) demande une difficulté adaptée à la place du niveau sans la mesurer ; ces critères écartent les niveaux qui se résolvent en suivant l'amélioration visible, coup par coup, et les éléments décoratifs.
- **2026-10-31 / Fusion des faisceaux** : `mix-blend-mode: screen` est porté par un groupe par couleur, à l'intérieur de la couche des faisceaux, et non par la couche elle-même. Chaque couleur a un seul tracé de halo et un seul tracé de cœur. Raison : appliqué à la couche entière, le mode `screen` fond les faisceaux avec le plateau mais pas entre eux ; et un halo translucide tracé segment par segment s'éclaircit à chaque jonction, alors qu'un tracé unique n'est peint qu'une fois.
- **2026-10-31 / Éventail du prisme** : l'éventail est dessiné pour un faisceau qui va vers la droite (rouge vers le haut, vert tout droit, bleu vers le bas) avec `spin: 'left'` ; `spin: 'right'` en est l'image miroir horizontale. Raison : le sens du prisme est relatif à la direction du faisceau, seul l'ordre de rotation des couleurs compte, et la symétrie horizontale l'inverse, ce qui correspond au retournement animé.
- **2026-10-31 / Compléments visuels** : un disque `--prism-floor` sous les secteurs des sources et des filtres, et un contour fin `--prism-metal` sur le disque des cibles éteintes. Raison : sans fond, un secteur vide (primaire absente) disparaît au lieu de se lire comme un emplacement vide ; le contour des cibles reprend celui des sources et des filtres, selon l'usage de `--prism-metal` défini dans la palette ("contours des éléments", `style-guide.md`).
- **2026-10-31 / Pulsation de victoire** : chaque cible grossit jusqu'à 1,15 fois sa taille puis revient, en 320ms, `ease-in-out`, dans l'ordre de lecture. Raison : "Animations" fixe l'écart entre deux cibles (80ms) mais ni la forme ni la durée de la pulsation ; la durée reprend celle de l'intensification des halos et de la victoire de Tilt.
- **2026-10-31 / Début de la victoire** : l'animation de victoire démarre quand les faisceaux du coup gagnant sont dessinés, à la fin de la bascule (150ms) ; la sauvegarde est écrite dès le coup joué, sans attendre. Raison : les halos intensifiés sont ceux du coup gagnant, qui ne sont dessinés qu'à la fin de la bascule ; sauvegarder aussitôt garde la progression si le joueur quitte pendant l'animation.
- **2026-10-31 / Entrée après la résolution** : une fois le niveau résolu, "Undo" est désactivé et toute entrée, y compris pendant la bascule du coup gagnant, termine les animations en cours, victoire comprise, ce qui ouvre le panneau de fin ; elle n'a pas d'autre effet. Raison : c'est la règle commune (une entrée termine les animations en cours) appliquée à la victoire, comme dans Tilt ; l'entrée elle-même n'a plus d'objet une fois le niveau résolu.
