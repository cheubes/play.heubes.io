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
| `logic/strategy.ts` | `decide`, et `REFERENCE_STRATEGY`, les paramètres de la stratégie de référence. |
| `logic/progress.ts` | Record et sauvegarde `DeltaSave`. Statuts des niveaux par `src/games/shell/unlock.ts`. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/canvas.ts` | Canvas, densité, mise à l'échelle et rotation, conversion entre écran et carte. |
| `render/draw.ts` | Dessin des couches. |
| `render/loop.ts` | Boucle à pas fixe, interpolation, début et fin de niveau. |
| `render/input.ts` | Pointeur et clavier. |
| `render/effects.ts` | Ondes de prise, victoire, défaite. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

Utilitaires communs : `fitCellSize` ne s'applique pas (pas de grille) ; la sélection au clavier commune (`src/games/shell/selection.ts`, issue de Prism) sert au curseur, avec les centres des bassins en coordonnées d'écran ; les statuts des niveaux viennent de `src/games/shell/unlock.ts`, partagé avec Leap.

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
- Les critères de difficulté des niveaux ("Points tranchés à l'implémentation") sont vérifiés par `logic/levels.difficulty.ts`, hors AC-11 et hors de `vitest run`, lancé par `npm run test:difficulty` comme pour les autres jeux. Il simule une dizaine de parties par niveau, en moins d'une seconde.

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
- **2026-11-02 / Partie de la stratégie de référence** : elle décide pour le joueur à chaque pas dont `tick` est un multiple de sa réaction, avant `step`, dès le pas 0. Raison : `game-model.md` fixe ses paramètres, pas le moment de ses décisions.
- **2026-11-02 / Mesures de difficulté** : T_ref est le temps de victoire de la stratégie de référence ; la marge d'un niveau est la plus grande réaction R parmi 5, 10, 20, 40 et 80 pas telle que la stratégie de référence jouée avec R (et `margin` = 0) gagne pour R et pour toutes les valeurs inférieures de la liste ; la part de croisements est la part des unités émises par le rival, dans la partie de référence, qui disparaissent d'un canal avant leur arrivée (les unités annulées au pas de leur émission ou de leur arrivée ne sont pas comptées). Raison : la marge mesure la lenteur qu'un joueur peut se permettre, la contrainte d'un humain face à un rival qui réagit en quelques secondes ; un bonus d'unités au rival, essayé, ne variait pas de façon monotone.
- **2026-11-02 / Critères de difficulté** : vérifiés par `logic/levels.difficulty.ts`. La réaction du rival ne croît jamais d'un niveau au suivant et vaut 40 en série 1 (le niveau 1 est l'exemple de `game-model.md`), de 35 à 25 en série 2, de 25 à 20 en série 3, de 15 à 10 en série 4 ; sa `margin` vaut 6, 4, 3 puis 2 selon la série ; 3 à 6 bassins en série 1, 5 à 9 en série 2, 6 à 10 en série 3, 10 à 14 en série 4, et 14 au niveau 20 ; T_ref sous 90 secondes pour les niveaux 1, 6, 11 et 16, de 20 secondes à 3 minutes pour les autres ; la marge vaut au moins 40 en série 1, 20 en séries 2 et 3, 10 en série 4, et ne croît pas dans une série ; à partir de la série 2, la stratégie de référence jouée avec une réaction de 80 pas ne gagne pas. Raison : "Progression" (`functional-specifications.md`) demande un rival de plus en plus vif et des cartes plus grandes sans mesurer la difficulté ; ces critères la rendent croissante et écartent les niveaux qu'un joueur distrait gagnerait.
- **2026-11-02 / Critères d'intérêt** : chaque niveau a un bassin neutre, et un joueur qui ne donne aucun ordre perd en moins de 5 minutes ; à partir du niveau 6, le rival commence avec au moins autant d'unités que le joueur ; aux niveaux 3 à 5, un bassin du joueur n'a au départ que des voisins à lui (relais) ; en séries 2 et 4, un niveau a au moins deux tailles de bassin ; le niveau 6 introduit les tailles : avec des bassins tous moyens, la stratégie de référence perd ou gagne 1,5 fois plus lentement ; aux niveaux 6 à 10, la part de croisements atteint 20 % (contre-courants) ; au niveau 11, le joueur ne peut atteindre le rival sans canal à marée ; aux niveaux 12 à 15, deux canaux à marée ou plus, et des canaux toujours ouverts changent l'issue ou T_ref d'au moins 20 % ; en série 4, au moins un canal à marée. Raison : "Progression" demande que chaque mécanique soit indispensable et évidente au niveau qui l'introduit ; la série 2 en introduit deux, les tailles sont rendues évidentes au niveau 6, les contre-courants sont garantis sur toute la série.
- **2026-11-02 / Constantes** : aucune constante de `game-model.md` n'a été ajustée pour la conception des niveaux.
- **2026-11-03 / Pression sur un voisin de la source** : un `pointerdown` sur un bassin du joueur voisin de la source sélectionnée ne le sélectionne pas tout de suite ; le toucher qui suit donne l'ordre `setRoute` vers ce voisin. Raison : à la lettre, la pression faisait de ce bassin la nouvelle source, et un ordre par toucher vers un bassin du joueur était impossible.
- **2026-11-03 / Pointeur annulé** : un `pointercancel` (geste système) abandonne l'ordre en cours, comme un relâcher hors d'un voisin. Raison : la spec ne disait rien de ce cas.
- **2026-11-03 / Mise en évidence de la sélection** : avec une source choisie, tout ce qui n'est ni ses canaux ni ses voisins passe à 50 % d'opacité ; le trait du glisser part du bord de la source. Raison : "voisins mis en évidence" ne fixait pas le moyen, et un trait parti du centre couvrait le chiffre de la source.
- **2026-11-03 / Sauvegarde à la fin du niveau** : le résultat est enregistré dès que `outcome` change, avant l'animation de fin, et une entrée pendant celle-ci ouvre aussitôt le panneau. Raison : quitter pendant l'animation garde la progression, comme dans Leap et Prism ; l'entrée suit la règle commune.
- **2026-11-03 / Animations de fin** : à la victoire, chaque bassin du joueur pulse 300ms, dans l'ordre des bassins du niveau ; à la défaite, ce sont les bassins et les unités du joueur au pas précédent qui s'éteignent, puisqu'il n'en a plus au pas final. Raison : la durée d'une pulsation et l'ordre n'étaient pas fixés, et "les dernières lueurs du joueur" n'existent plus à la fin.
- **2026-11-03 / "Most held"** : affiché `k/total`, comme le compteur "Basins" du HUD. Raison : le nombre seul ne disait pas sur combien de bassins.
- **2026-11-03 / Sons** : la cloche suit la gamme pentatonique de sol à partir de sol4, un degré par bassin tenu ; l'accord de victoire est do-mi-sol, celui de défaite la-do-mi grave ; le son de la dernière prise se superpose à l'accord de fin. Raison : la spec fixait la forme des sons, pas leurs hauteurs.
