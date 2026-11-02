# Spécifications techniques : Leap

## Rendu

Canvas 2D, à la densité de l'écran (`devicePixelRatio`), sur le fond `--leap-bg` de la salle :

1. **rouages du décor** : un petit `<canvas>` par grand rouage, dessiné une fois et tourné par la Web Animations API ;
2. **décor** : murs, piques, plateformes fixes, ressorts, sortie, rails des plateformes mobiles ; dessiné une fois par salle (et à chaque redimensionnement), puisqu'il ne change pas ;
3. **scène** : portes, leviers, plateformes mobiles, rouage, automate et effets ; redessinée à chaque image.

Le décor et la scène forment la partie qui glisse au changement de salle ; les rouages du décor restent en place.

Taille : `fitCellSize` (`src/games/shell/dom.ts`) avec une salle de 12 × 12 cases, cases plafonnées à 48px. Les positions de la logique (en unités, 240 par case) sont converties en pixels au dessin.

Alternatives écartées :
- **DOM et CSS** : un seul personnage en mouvement serait abordable, mais l'interpolation entre pas, les effets de particules et le dessin des tuiles par code sont plus simples et plus sûrs à 60 images par seconde sur un canvas.
- **SVG** : mêmes limites pour les effets, et rien à gagner sur le repérage des clics, puisque le bouton se touche n'importe où.
- **Moteur de jeu 2D (Phaser...)** : nouvelle dépendance lourde pour une physique de quelques règles, que la logique pure doit de toute façon porter pour être testée.

## Boucle de jeu

- La logique avance par pas fixes de 1/60 s (`step`). Une boucle `requestAnimationFrame` accumule le temps écoulé et applique autant de pas que nécessaire, quatre au plus par image (au-delà, le retard est abandonné).
- Les appuis sont enregistrés entre deux pas et transmis au pas suivant (`pressed`). Plusieurs appuis entre deux pas comptent pour un.
- Le rendu interpole la position de l'automate et des plateformes mobiles entre le pas précédent et le pas courant, pour un mouvement fluide sur un écran à 120Hz.
- `pause()` arrête la boucle et oublie le temps accumulé ; `resume()` la relance sans rattrapage.
- Quand `outcome` passe à `complete`, la boucle joue la sortie de l'automate, puis appelle `complete()` avec le statut `completed` ou `perfect`.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types et constantes de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel` : grilles, entrées, plateformes mobiles. |
| `logic/collision.ts` | Boîtes, chevauchements, contacts avec les cases. |
| `logic/leap.ts` | `createState`, `step`. |
| `logic/solver.ts` | Solveur et mesure de la fenêtre de saut, pour les tests uniquement. |
| `logic/progress.ts` | Statuts des niveaux, record et sauvegarde `LeapSave`. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/canvas.ts` | Canvas, densité, dimensionnement. |
| `render/draw.ts` | Dessin du décor et de la scène. |
| `render/loop.ts` | Boucle à pas fixe, interpolation, fin de niveau. |
| `render/input.ts` | Appuis clavier et pointeur, indicateur de départ. |
| `render/effects.ts` | Étirement, poussière, chute, rouage, changement de salle. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

## Contrôles

- Pointeur : un `pointerdown` n'importe où dans l'aire de jeu compte comme un appui. Pas de seuil ni de geste : la réactivité prime.
- Clavier : `keydown` de `Espace`, `Entrée` ou `ArrowUp`, en ignorant les répétitions (`event.repeat`).
- L'indicateur de départ affiche le texte adapté à la dernière entrée utilisée (pointeur ou clavier).
- Un appui pendant un effet de chute ou de changement de salle termine l'effet (règle commune), puis est transmis au pas suivant : il lance l'automate.

## Animations

Le mouvement de l'automate et des plateformes mobiles est la simulation : il ne change ni en mouvement réduit ni sur une entrée (voir "Animations" dans `technical-specifications.md`).

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Étirement au saut, écrasement à l'atterrissage | Échelle verticale 1,15 au saut, 0,85 à l'atterrissage, retour en 120ms | Aucun |
| Poussière | Quelques particules à l'atterrissage et au demi-tour, 250ms | Aucune |
| Chute | L'automate se disloque en quatre pièces qui retombent, 400ms, puis réapparition à l'entrée | L'automate disparaît, 400ms d'attente, puis réapparition |
| Rouage ramassé | Le rouage file vers l'automate avec un éclat, 200ms | Il disparaît |
| Bascule des portes | Les barreaux glissent, 150ms | Changement immédiat |
| Changement de salle | La nouvelle salle glisse à la place de l'ancienne, dans le sens de la sortie, 300ms, `--ease-in-out` | Changement immédiat |
| Rouages du décor | Rotation lente et continue de grands rouages en fond | Rouages fixes |
| Fin de niveau | L'automate entre dans l'arche de sortie et s'y efface, 300ms, puis `complete()` | `complete()` immédiat |

L'attente de 400ms après une chute est conservée en mouvement réduit : elle marque la chute, sans mouvement.

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Saut | Bip court ascendant (carré filtré, 300 à 600Hz), 80ms | Saut |
| Atterrissage | Tic mécanique (bruit filtré passe-bande), 30ms, faible | Atterrissage |
| Demi-tour | Clic métallique très bref, faible | Demi-tour contre un mur |
| Ressort | "Boing" : sinusoïde de 200 à 700Hz avec vibrato, 250ms | Ressort |
| Levier | Clac mécanique (deux clics à 30ms d'écart) | Levier |
| Rouage | Carillon clair (deux notes ascendantes), 300ms | Rouage ramassé |
| Chute | Bruit de ferraille descendant (bruit filtré dont la fréquence baisse), 350ms | Chute |
| Sortie de salle | Deux notes en tierce, 250ms | Fin de la première salle |
| Fin de niveau | Accord qui s'ouvre (trois notes décalées de 60ms), 900ms | Fin de niveau |

## Tests

- Tests des critères AC-01 à AC-12 dans `logic/*.test.ts`, sur de petites salles construites dans les tests pour AC-01 à AC-10.
- AC-12 lance le solveur deux fois par salle (40 salles) : le test complet reste sous 10 secondes en CI. Si ce n'est pas tenable, les résultats du solveur sont consignés dans "Points tranchés à l'implémentation" avec la mesure, avant tout changement de la contrainte.
- Les critères de difficulté des salles ("Points tranchés à l'implémentation") sont vérifiés par `logic/levels.difficulty.ts`, hors AC-12 et hors de `vitest run` : ils explorent tous les états de chaque salle (jusqu'à 3,5 millions avec une plateforme mobile) et prennent environ une minute. Ils sont lancés par `npm run test:difficulty`, en CI comme à chaque modification des niveaux.

## Performance

- Un pas de simulation reste sous 0,1ms.
- Le dessin d'une image reste sous 2ms sur un mobile milieu de gamme récent : le décor n'est pas redessiné à chaque image.
- Le module publié reste sous 40 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

- **2026-11-02 / Géométrie du ressort** : le ressort est une surface traversable au bas de sa case, au niveau du sol ; il se déclenche dès que l'automate s'y pose, en tombant ou en y marchant, si sa boîte chevauche la case. À égalité avec le sol voisin, le ressort l'emporte. Raison : `game-model.md` ne fixait pas sa hauteur ; un ressort sur le chemin fait toujours rebondir, sans précision demandée.
- **2026-11-02 / Tolérance au ressort** : le rebond d'un ressort remet `coyote` à 0. Raison : l'atterrissage sur le ressort met `coyote` à 6, et un appui (ou un appui retenu) dans les pas suivants remplaçait le rebond par un saut normal, plus bas.
- **2026-11-02 / Zones de contact** : levier, rouage et sortie se touchent sur toute leur case ; un contact demande un chevauchement strict (un bord commun ne compte pas), comme pour les solides et les piques. Raison : seule la boîte des piques est fixée par `game-model.md`.
- **2026-11-02 / Atterrissage** : parmi les surfaces franchies pendant un pas, l'automate se pose sur la plus haute. Une plateforme mobile est franchie si le bas de la boîte, avant le pas, n'était pas sous son dessus au pas précédent, et l'atteint ou le dépasse après le pas, à sa position du pas courant. Raison : "au pas précédent" (étape 4) doit tenir compte du déplacement de la plateforme pendant le pas.
- **2026-11-02 / Entraînement par une plateforme mobile** : le déplacement transmis s'arrête au contact d'un solide, sans demi-tour, et, vers le haut, sous un plafond. Raison : seule la course de l'automate le fait se retourner (règle 3).
- **2026-11-02 / Levier retouché pendant une bascule en attente** : les deux bascules s'annulent, et plus rien n'est en attente. Raison : chaque contact échange les portes (règle 8).
- **2026-11-02 / Fenêtre de saut** : la difficulté d'une salle se mesure par sa fenêtre W, en pas : la plus grande largeur w telle qu'il existe un chemin vers le but où chaque appui nécessaire peut tomber n'importe où dans une plage de w pas consécutifs. Elle est calculée sur le graphe complet des états de la salle, pour la sortie et pour la sortie avec le rouage ; elle est infinie si le but s'atteint sans appui. La fenêtre d'un niveau est la plus petite fenêtre de sortie de ses deux salles. Raison : la largeur de la fenêtre la plus étroite mesure la précision demandée, indépendamment du chemin choisi.
- **2026-11-02 / Critères de difficulté** : toute fenêtre, rouage compris, fait au moins 4 pas ; la fenêtre d'un niveau fait au moins 10, 8, 6 puis 5 pas selon la série, et ne croît pas d'un niveau au suivant dans une série ; chaque salle demande au moins un saut, sauf si un ressort suffit ; la sortie la plus rapide prend de 2 à 20 secondes, sans minimum pour la première salle des niveaux 1, 6, 11 et 16 ; cette première salle a une fenêtre de sortie d'au moins 15 pas ; dans les séries 2 à 4, chaque salle a une mécanique de sa série sans laquelle la sortie est inatteignable (plateformes traversables ou ressorts, leviers, plateformes mobiles) ; le rouage demande un détour d'au moins 2 secondes, ou a une fenêtre plus étroite que la sortie. Raison : "Progression" (`functional-specifications.md`) demande une difficulté croissante, une mécanique évidente à son introduction et un rouage plus risqué, sans les mesurer. Le minimum, d'abord fixé à 3 secondes sans exception, est ramené à 2 : une salle se traverse en 1,7 seconde, et 3 secondes imposaient un aller-retour complet même aux salles d'introduction.
- **2026-11-02 / Constantes** : aucun ajustement des constantes de `game-model.md` pour la conception des 40 salles.
- **2026-11-02 / Clé des états du solveur** : le solveur élimine les états selon tout l'état de l'automate (y compris `grounded`, `coyote` et `onLever`) et la bascule en attente, en plus des champs cités par `game-model.md`. Raison : deux états qui ne diffèrent que par ces champs n'ont pas le même avenir ; les confondre peut faire manquer une solution.
- **2026-11-02 / Périodes des plateformes mobiles** : les plateformes mobiles d'une même salle ont la même période. Raison : le nombre d'états croît avec le plus petit commun multiple des périodes ; avec deux périodes de 90 et 60 pas, une seule salle demandait 9 secondes de solveur, au-delà du budget d'AC-12.
- **2026-11-02 / Rail des plateformes mobiles** : le rail en pointillés est dessiné en `--leap-platform` à 35 % d'opacité, et non en `--leap-backdrop`. Raison : en `--leap-backdrop`, il était presque invisible sur le fond et disparaissait sur les rouages du décor, de la même couleur ; la couleur des plateformes le rattache à la plateforme qu'il guide.
- **2026-11-02 / Rouages du décor à part** : le fond et les grands rouages ne sont plus dessinés dans le canvas du décor, mais dans un canvas par rouage, sous le décor, tourné par la Web Animations API. Raison : la rotation continue demandait de redessiner le décor à chaque image, que la spec réserve à la scène ; une rotation par le compositeur ne coûte rien au dessin et se met en pause avec les autres animations.
- **2026-11-02 / Poussière** : les particules de poussière sont en `--leap-wall-edge`. Raison : la charte ne fixait pas leur couleur ; le laiton clair évoque la poussière soulevée du sol de l'horloge.
- **2026-11-02 / Indicateur de départ avant toute entrée** : tant que le joueur n'a ni touché ni appuyé sur une touche, l'indicateur suppose le tactile si l'appareil a un pointeur grossier (`pointer: coarse`), le clavier sinon. La souris compte comme le tactile ("Tap to start" / "Touche pour partir") : la spec ne définit qu'un texte par type d'entrée, pointeur ou clavier.
- **2026-11-02 / Pastille de l'indicateur** : l'indicateur de départ est posé sur une pastille `--leap-bg` et gardé dans la salle. Raison : sous l'entrée, il tombe sur le laiton du mur, où `--color-text-muted` était presque illisible (contraste d'environ 1,3:1, environ 7:1 sur la pastille) ; centré sous une entrée qui touche un mur, il débordait de la salle.
