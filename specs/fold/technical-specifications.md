# Spécifications techniques : Fold

## Rendu

DOM et CSS, avec des transformations 3D pour les plis. La feuille est une grille de `div` (une par position, qui affiche la couche du dessus de sa pile) dans un conteneur en `transform-style: preserve-3d` avec une `perspective`. La carte modèle est une seconde grille, en réduction, construite avec les mêmes styles de cases.

Animation d'un pli : au relâcher, les positions de la partie mobile sont regroupées dans un calque qui tourne de 180° autour de la ligne de pli (`transform-origin` sur la ligne, `rotateY` ou `rotateX`). Chaque position de ce calque a deux faces, avec `backface-visibility: hidden` : l'avant montre la couche du dessus de sa pile, l'arrière la couche du dessous, qui sera celle du dessus une fois le rabat posé. La face arrière, retournée par la rotation, apparaît naturellement en miroir. À la fin de l'animation, la feuille est reconstruite depuis le nouvel état.

Taille : `fitCellSize` (`src/games/shell/dom.ts`) appelé avec des dimensions augmentées de la place de la carte modèle (cases de la carte à 40 % de celles de la feuille, plus une demi-case d'écart) : `rows + 0.4 × goal.rows + 0.5` lignes en portrait, `cols + 0.4 × goal.cols + 0.5` colonnes en paysage. Cases de la feuille plafonnées à 72px. La taille est calculée pour la feuille de départ et reste fixe pendant le niveau : la feuille ne fait que rétrécir. Un rabat qui déborde pendant l'aperçu ou l'animation reste visible, sans découpage, dans la limite de l'aire de jeu.

Alternatives écartées :
- **SVG** : pas de transformations 3D. Un retournement aplati (échelle de 1 à -1, comme le prisme de Prism) perdrait l'impression de papier qui se plie, qui fait le charme du jeu.
- **Canvas 2D** : il faudrait projeter soi-même la rotation en perspective et gérer les clics. Le DOM le fait nativement pour 36 positions au plus.
- **WebGL** (moteur 3D) : nouvelle dépendance, disproportionnée pour une feuille plate qui tourne autour d'un axe.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`. |
| `logic/sheet.ts` | Application d'un pli, normalisation, `visibleFace`. |
| `logic/fold.ts` | `createState`, `canFold`, `fold`, `undo`, `restart`, `isSolved`. |
| `logic/solver.ts` | Solveur, pour les tests uniquement. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/board.ts` | Construction de la feuille et de la carte modèle, disposition selon l'orientation, dimensionnement. |
| `render/animations.ts` | Pli, pli impossible, annulation, victoire. |
| `render/input.ts` | Geste de pli, ligne de pli au clavier, aperçu. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

Utilitaires communs : `progress.ts` et `fitCellSize` (`src/games/shell/`), partagés avec les autres jeux. La sélection au clavier commune (Prism, Shadow) ne s'applique pas : Fold sélectionne des lignes, pas des éléments.

## Contrôles

- Geste : un `pointerdown` sur la feuille ou dans une marge d'une case autour d'elle démarre un geste. Tant que le déplacement reste sous 10px, rien ne se passe. Au-delà, l'axe dominant du déplacement (horizontal ou vertical) et son sens donnent le pli : glisser vers la droite rabat la partie gauche (`vertical`, `before`), vers la gauche la partie droite (`vertical`, `after`), vers le bas la partie du haut, vers le haut celle du bas. L'axe et le sens sont recalculés à chaque mouvement.
- Ligne : avec d le déplacement le long de l'axe, en cases, la ligne est à `round(d / 2)` cases du bord tiré, ramenée entre 1 et la dimension moins 1. Sous un déplacement d'une case, aucune ligne n'est retenue et aucun aperçu n'est affiché.
- Aperçu : ligne de pli mise en évidence et rabat fantôme à sa position d'arrivée. Si `canFold` vaut `pinned`, l'aperçu montre les épingles qui bloquent à la place du fantôme.
- Relâcher : plie si une ligne est retenue et que `canFold` vaut `ok`, déclenche l'animation de pli impossible si `pinned`, ne fait rien sinon. `pointercancel` renonce au pli.
- Clavier : le curseur est une ligne de pli. Il démarre sur la ligne verticale centrale (`floor(cols / 2)`). `←` et `→` le déplacent d'une ligne verticale à la voisine, sans boucler ; si le curseur est horizontal, ils le placent sur la ligne verticale centrale. `↑` et `↓` font de même pour les lignes horizontales. `Maj` + `→` rabat la partie gauche sur la ligne verticale sélectionnée, `Maj` + `←` la partie droite, `Maj` + `↓` la partie du haut sur la ligne horizontale, `Maj` + `↑` celle du bas ; `Maj` + une flèche d'une autre orientation que le curseur est sans effet. Après un pli, le curseur revient sur la ligne centrale de son orientation dans la nouvelle feuille. `z`, `Z` et `Backspace` annulent.
- Le curseur clavier n'est affiché qu'après une première touche du clavier, et masqué dès une utilisation du pointeur. Une flèche ou `Maj` + flèche qui fait apparaître le curseur ne fait que l'afficher. L'annulation agit toujours.
- Une entrée reçue pendant une animation appelle `finish()` sur les animations en cours, puis est traitée (règle commune).

## Animations

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Aperçu pendant le geste | Ligne mise en évidence, rabat fantôme à 40 % d'opacité, qui suivent le geste sans transition | Identique |
| Pli | Rotation de 180° du rabat autour de la ligne, en perspective, 280ms, `--ease-in-out` ; la feuille glisse en même temps pour finir centrée | Instantané |
| Pli impossible | Les épingles qui bloquent pulsent (échelle 1 → 1,3 → 1), 200ms | Épingles cerclées du double trait de la ligne de pli (voir `style-guide.md`) pendant 400ms, sans mouvement |
| Annulation | Rotation inverse du dernier rabat, 200ms, `--ease-in-out` | Instantanée |
| Victoire | La feuille se presse (échelle 1,03 → 1) et la carte modèle s'illumine, 320ms, puis `complete()` | Carte illuminée sans transition, `complete()` immédiat |

Pas d'animation continue.

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Pli | Froissement : bruit filtré passe-bande dont la fréquence monte de 800Hz à 2,5kHz, 220ms, enveloppe en cloche ; puis un clic sourd (bruit passe-bas, 30ms) quand le rabat se pose | Pli |
| Pli impossible | Deux clics graves à 40ms d'écart | Pli impossible |
| Annulation | Froissement court dont la fréquence descend, 150ms | Annulation |
| Victoire | Accord qui s'ouvre (trois notes d'une gamme pentatonique décalées de 60ms), 900ms | Niveau résolu |

## Tests

- Tests des critères AC-01 à AC-09 dans `logic/*.test.ts`.
- AC-09 fait une recherche en largeur par niveau, élaguée par les dimensions du modèle : le test complet reste sous 10 secondes en CI.
- Les critères de non-trivialité des niveaux ("Points tranchés à l'implémentation") sont vérifiés par `logic/levels.difficulty.ts`, hors AC-09 et hors de `vitest run` : le décompte des suites de plis explore tous les états jusqu'au par, là où AC-09 s'arrête à la première solution. Ils sont lancés par `npm run test:difficulty`, en CI comme à chaque modification des niveaux.

## Performance

- Un pli et le calcul de la face visible restent sous 1ms pour une feuille de 6 × 6.
- L'animation de pli n'anime que `transform` et `opacity` : elle reste fluide sur un téléphone d'entrée de gamme.
- Le module publié reste sous 30 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

- **2026-11-02 / Profondeur du solveur** : la recherche s'arrête à 6 plis, le par maximal ; au-delà, le niveau est déclaré non résoluble. Raison : sans limite, un niveau non résoluble fait explorer tout l'espace des feuilles, qui épuise la mémoire pour une feuille de 6 × 6 et un modèle de 1 × 1.
- **2026-11-02 / Non-trivialité des niveaux** : vérifiée par `logic/levels.difficulty.ts` (voir "Tests"). Critères : par d'au plus 2 pour les niveaux 1, 6, 11 et 16, de 1 ou 2 en série 1, d'au moins 3 pour les autres niveaux des séries 2 à 4, sans décroître d'un niveau au suivant dans une série ; hors niveau 1, parmi les suites d'au plus "par" plis qui mènent aux dimensions du modèle, au plus 50 % (série 1) ou 20 % (séries 2 à 4) résolvent le niveau ; dans les séries 2 à 4, l'état résolu par la solution du solveur porte au moins trois couches sur une position ; en série 3, la solution rejouée sur la feuille dont les découpes sont remplacées par du papier nu donne une face différente en au moins une position non vide du modèle ; en série 4, le niveau sans ses épingles se résout en moins de plis que le par, et chaque épingle bloque au moins un pli dans un état de la solution ; les niveaux 18 à 20 ont des découpes et des épingles ; au plus deux encres en série 1, au moins trois dans les niveaux 8 à 10 et 18 à 20. Raison : "Progression" (`functional-specifications.md`) demande une difficulté adaptée à la place du niveau sans la mesurer ; ces critères écartent les niveaux qui se résolvent en pliant au hasard jusqu'à la bonne taille, et les mécaniques décoratives. Les suites plus courtes que le par qui atteignent les dimensions du modèle comptent parmi les échecs : ce sont des pièges comme les autres.
- **2026-11-02 / Budget d'AC-09** : le solveur prend environ 0,3 s pour les 20 niveaux, 135ms pour le plus coûteux (niveau 15), et le test de difficulté environ 2 s. Raison : les mesures sur une feuille de 6 × 6 montraient jusqu'à 5 s pour un seul niveau de par 6 avec un modèle de 2 × 2 ; les niveaux profonds ont donc des modèles d'au moins 6 cases, et les épingles réduisent les plis possibles.
- **2026-11-02 / Perspective du pli** : la `perspective` est portée par la grille de la feuille, et le rabat qui tourne est un calque en `transform-style: preserve-3d` à l'intérieur. Raison : l'ombre portée de la feuille (`filter: drop-shadow`) l'aplatit, ce qui couperait une perspective posée sur un conteneur au-dessus ; posée sur la feuille elle-même, elle s'applique au rabat, qui reçoit aussi l'ombre.
- **2026-11-02 / Accord des annonces** : "<k> cases sur <total> conformes." s'accorde avec le nombre de cases conformes ("1 case sur 9 conforme." en français), selon les règles de pluriel de la langue. Raison : `functional-specifications.md` ne donne que la forme au pluriel ; Prism accorde ses annonces de la même façon.
- **2026-11-02 / Illumination de la carte modèle** : à la victoire, la carte modèle porte `--glow-accent` (jeton du site), qui apparaît en 320ms et reste jusqu'au recommencement du niveau. Raison : `style-guide.md` dit que la carte "s'illumine" sans en fixer l'apparence ; le jeton du site sert déjà à mettre en valeur une tuile ou le niveau en cours.
- **2026-11-02 / Sauvegarde à la résolution** : le résultat est enregistré dès le pli gagnant, avant l'animation de victoire. Raison : quitter pendant l'animation garde la progression, comme dans Prism.
- **2026-11-02 / Entrée après la résolution** : une fois le niveau résolu, "Undo" est désactivé et toute entrée termine les animations en cours, victoire comprise, ce qui ouvre le panneau de fin ; elle n'a pas d'autre effet. Raison : c'est la règle commune (une entrée termine les animations en cours) appliquée à la victoire, comme dans Prism et Tilt.
