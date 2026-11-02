# Spécifications techniques : Delta

## Rendu

Canvas 2D. Un seul `<canvas>` qui occupe l'aire de jeu, à la densité de l'écran (`devicePixelRatio`), redessiné à chaque image. Plusieurs centaines d'unités en mouvement à 60 images par seconde : un canvas les dessine en un seul passage, là où le DOM ou le SVG devraient modifier autant d'éléments à chaque image.

Mise à l'échelle : la carte de 16 × 10 unités est mise à l'échelle pour tenir dans l'aire de jeu avec une marge de `--space-4`. En portrait (aire plus haute que large), elle est tournée d'un quart de tour dans le sens horaire : le point (x, y) de la carte est dessiné en (10 - y, x). Les chiffres et symboles sont dessinés droits.

Couches, dessinées de bas en haut à chaque image :

1. fond `--delta-water` ;
2. canaux (lit du canal, état de la marée et arc du temps restant) ;
3. chevrons des sorties ;
4. unités en route, avec leur traînée ;
5. bassins (forme, anneaux de taille, nombre d'unités), ondes de prise ;
6. sélection : bassin source, voisins mis en évidence, trait du glisser ;
7. curseur clavier.

Alternatives écartées :
- **SVG ou DOM** : chaque unité serait un élément à déplacer à chaque image ; au-delà de quelques centaines, le coût de mise en page et de rendu devient sensible sur mobile.
- **WebGL ou moteur 2D (PixiJS...)** : nouvelle dépendance, inutile au volume visé ; le Canvas 2D tient le budget (voir "Performance").

## Boucle de jeu

- La logique avance par pas fixes de 100ms (`step`). Une boucle `requestAnimationFrame` accumule le temps écoulé et applique autant de pas que nécessaire, cinq au plus par image (au-delà, le retard est abandonné, pour ne pas figer l'affichage après un ralentissement).
- Le rendu interpole la position des unités entre le pas courant et le suivant, pour un mouvement fluide à toute fréquence d'affichage.
- `pause()` arrête la boucle et oublie le temps accumulé ; `resume()` la relance sans rattrapage.
- Avant le premier pas, la boucle dessine la carte sans avancer : le temps démarre au premier ordre du joueur ou au bout de 3 secondes de jeu (hors pause).
- À la fin (`outcome` différent de `playing`), la boucle joue l'animation de victoire ou de défaite, puis appelle `complete()` avec le statut `completed`, `perfect` ou `failed`.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types et constantes de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel` : canaux, longueurs, durées, voisinages. |
| `logic/random.ts` | Générateur à graine (mulberry32), fonctions pures sur `rng`. |
| `logic/simulation.ts` | `createState`, `setRoute`, `hold`, `step`. |
| `logic/strategy.ts` | `decide`. |
| `logic/progress.ts` | Statuts des niveaux, record et sauvegarde `DeltaSave`. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/canvas.ts` | Canvas, densité, mise à l'échelle et rotation, conversion entre écran et carte. |
| `render/draw.ts` | Dessin des couches. |
| `render/loop.ts` | Boucle à pas fixe, interpolation, début et fin de niveau. |
| `render/input.ts` | Pointeur et clavier. |
| `render/effects.ts` | Ondes de prise, victoire, défaite. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

Utilitaires communs : `fitCellSize` ne s'applique pas (pas de grille) ; la sélection au clavier commune (`src/games/shell/selection.ts`, issue de Prism et Shadow) sert au curseur, avec les centres des bassins en coordonnées d'écran.

## Contrôles

- Zones de toucher : un disque autour de chaque bassin, de rayon le plus grand entre le rayon du bassin et 22px. Les cartes garantissent qu'elles ne se chevauchent pas (bassins à 2 unités de carte au moins).
- Pointeur : un `pointerdown` sur un bassin du joueur le sélectionne comme source. Si le pointeur se déplace de plus de 10px, un trait le suit ; au `pointerup` sur un voisin, `setRoute`, ailleurs, rien. Sans déplacement, c'est un toucher : sur la source déjà sélectionnée, `hold` ; sur un voisin de la source, `setRoute` ; sur un autre bassin du joueur, il devient la source ; ailleurs, la sélection est abandonnée.
- Clavier : les flèches déplacent le curseur d'un bassin à l'autre (sélection commune, en coordonnées d'écran). `Espace` ou `Entrée` sur un bassin du joueur le sélectionne comme source ; les flèches ne parcourent alors que ses voisins ; `Espace` ou `Entrée` sur un voisin appelle `setRoute`, sur la source `hold`. `Backspace` abandonne la sélection.
- Le curseur clavier n'est affiché qu'après une première touche du clavier, et masqué dès une utilisation du pointeur. Une touche qui fait apparaître le curseur ne fait que l'afficher.
- Les ordres sont appliqués à l'état courant, entre deux pas : ils prennent effet au pas suivant.
- La règle commune "une entrée termine les animations en cours" ne vise pas la simulation (voir "Animations" dans `technical-specifications.md`) : une entrée ne termine que les effets décoratifs, qui n'empêchent jamais un ordre.

## Animations

La simulation (unités qui avancent, nombres qui changent) n'est pas une animation : elle ne change ni en mouvement réduit ni sur une entrée.

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Traînée des unités | Trois positions précédentes, en opacité décroissante | Aucune |
| Chevrons des sorties | Défilement lent dans le sens du courant | Chevrons fixes |
| Prise d'un bassin | Onde circulaire dans la couleur du nouveau camp, 300ms, et changement de couleur en fondu | Changement immédiat |
| Marée | Le lit du canal se remplit ou se vide en 300ms à l'ouverture ou à la fermeture | Changement immédiat |
| Victoire | Les bassins du joueur pulsent l'un après l'autre (80ms d'écart), puis `complete()` | `complete()` immédiat |
| Défaite | Les dernières lueurs du joueur s'éteignent en fondu, 400ms, puis `complete()` | `complete()` immédiat |

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Sélection | Tic doux, sinusoïde de 1,2kHz, 30ms | Bassin choisi comme source |
| Courant établi | Glissando court ascendant (sinusoïde de 400 à 700Hz), 120ms | `setRoute` |
| Réserve | Note brève descendante, 100ms | `hold` |
| Bassin gagné | Note de cloche, décroissance de 500ms, hauteur dans une gamme pentatonique qui monte avec le nombre de bassins tenus | Prise par le joueur |
| Bassin perdu | Note grave descendante, 300ms | Prise par le rival d'un bassin du joueur |
| Marée | Souffle de bruit filtré, très faible, 400ms | Ouverture ou fermeture d'un canal à marée |
| Victoire | Accord qui s'ouvre (trois notes décalées de 60ms), 900ms | Victoire |
| Défaite | Accord mineur grave qui s'éteint, 900ms | Défaite |

Les sons de prise par le rival d'un bassin neutre ne sont pas joués : seuls les changements qui concernent le joueur ont un son.

## Tests

- Tests des critères AC-01 à AC-11 dans `logic/*.test.ts`.
- AC-11 simule, pour chaque niveau, au plus deux fois 3 000 pas : le test complet reste sous 10 secondes en CI.

## Performance

- Un pas de simulation reste sous 1ms avec 14 bassins et 300 unités en route.
- Le dessin d'une image reste sous 4ms sur un mobile milieu de gamme récent.
- Le module publié reste sous 40 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

- **2026-11-02 / Croisements par paire de camps** : le pas 6 compare, dans chaque canal et pour chaque camp, l'unité la plus avancée de ce camp vers `b` et l'unité la plus avancée de l'autre camp vers `a`. Raison : la règle comparait les deux unités de tête du canal ; quand elles étaient toutes deux au joueur, une unité du rival placée derrière l'une d'elles traversait l'unité du joueur d'en face sans s'annuler.
- **2026-11-02 / Seuil de menace** : un bassin n'est menacé que si au moins une unité adverse est en route vers lui. Raison : à la lettre, tout bassin vide était menacé (0 ≥ 0), même sans adversaire en route, et attirait un renfort ; ses voisins se vidaient vers les bassins vides de l'arrière.
- **2026-11-02 / Lecture de la stratégie** : un bassin d'un autre camp inclut les neutres, dans toutes les phases ; la poursuite ne compte que les unités de son camp qui vont vers la cible ; un relais sans bassin d'un autre camp atteignable laisse le bassin en réserve. Raison : `game-model.md` ne précisait les neutres que pour l'attaque, et ne disait rien des deux autres cas.
- **2026-11-02 / Tirage des égalités** : le générateur ne tire qu'en cas d'égalité ; le choix est le candidat d'indice `floor(valeur × n)` parmi les n ex aequo, dans l'ordre des canaux du niveau. Raison : `game-model.md` confiait les égalités au générateur sans fixer son usage ; un tirage à chaque décision consommerait le générateur sans effet.
