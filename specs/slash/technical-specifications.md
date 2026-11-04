# Spécifications techniques : Slash

## Rendu

Canvas 2D, comme Delta et Leap. Deux `<canvas>` superposés, à la densité de l'écran (`devicePixelRatio`) :

1. **décor** : plancher de la scène, piliers, coulisses ; dessiné une fois par niveau (et à chaque redimensionnement) ;
2. **scène** : marques des vagues, zones d'attaque, pantins et leurs fils, projectiles, héros, ligne de visée, jauge et effets ; redessiné à chaque image.

Le refroidissement des couleurs pendant le ralenti est un filtre CSS (`filter: saturate() hue-rotate()`) posé sur les deux canvas, sans redessin.

Taille : `fitCellSize` (`src/games/shell/dom.ts`) avec une arène de 12 × 12 cases, cases plafonnées à 48px. Les positions de la logique (240 unités par case) sont converties en pixels au dessin.

Alternatives écartées :
- **SVG ou DOM** : des dizaines d'objets en mouvement, des traînées et des étincelles à chaque image ; le canvas les dessine en un passage.
- **Moteur de jeu 2D (Phaser...)** : nouvelle dépendance lourde ; la physique tient en quelques règles que la logique pure doit de toute façon porter pour être testée.

## Boucle de jeu

- La logique avance par pas fixes de 1/60 s de temps de jeu (`step`). La boucle `requestAnimationFrame` accumule le temps réel écoulé, multiplié par 0,2 quand `slowed` est vrai au dernier pas, et applique autant de pas que nécessaire, quatre au plus par image.
- C'est la troisième boucle à pas fixe du catalogue, après Delta et Leap, qui ont chacune la leur : elle est extraite dans `src/games/shell/loop.ts` (pas fixe, rattrapage borné, interpolation, facteur de vitesse, pause), et Delta et Leap l'adoptent (voir "Structure des fichiers" dans `technical-specifications.md`).
- Les entrées (visée en cours, trait demandé) sont lues au début de chaque pas.
- Le rendu interpole les positions entre le pas précédent et le pas courant.
- `pause()` arrête la boucle, oublie le temps accumulé et abandonne une visée en cours, sans trait ; `resume()` relance la boucle sans rattrapage.
- Quand `outcome` passe à `won` ou `lost`, le résultat est enregistré, la boucle joue l'animation de fin, puis appelle `complete()` avec le statut `completed`, `perfect` ou `failed`.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types et constantes de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`. |
| `logic/geometry.ts` | Vecteurs entiers, balayage d'un cercle le long d'un segment, secteurs. |
| `logic/pathing.ts` | Champ de distances vers le héros. |
| `logic/enemies.ts` | Comportement des pantins et des projectiles. |
| `logic/slash.ts` | `createState`, `step`, `previewDash`. |
| `logic/reference.ts` | Stratégie de référence, pour les tests uniquement. |
| `logic/progress.ts` | Sauvegarde `SlashSave` et règle du statut `perfect`, autour de `getUnlockEntries`. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/canvas.ts` | Canvas, densité, dimensionnement. |
| `render/draw.ts` | Dessin du décor et de la scène. |
| `render/input.ts` | Visée et traits au pointeur et au clavier, indicateur de départ. |
| `render/effects.ts` | Traînée, étincelles, effondrement, descente des pantins, fin de niveau. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`. |

Utilitaires communs : `fitCellSize`, `getUnlockEntries` et la boucle commune (`src/games/shell/`).

## Contrôles

- Pointeur : un `pointerdown` n'importe où dans l'aire de jeu commence une visée. Au-delà de 24px de déplacement, la direction visée est celle du vecteur entre le point de départ et le pointeur. Au `pointerup`, un trait part dans cette direction ; sans déplacement au-delà de 24px, il part vers le point relâché (rien si ce point est dans le cercle du héros). `pointercancel` abandonne la visée sans trait.
- Clavier : maintenir une flèche, ou deux flèches perpendiculaires, vise dans l'une des huit directions. La direction suit les flèches maintenues ; quand toutes sont relâchées, un trait part dans la dernière direction visée. Si les deux flèches d'une diagonale sont relâchées à moins de 100ms d'écart, la diagonale est gardée. Les répétitions de touche (`event.repeat`) sont ignorées.
- La visée et la ligne de visée sont affichées même pendant la récupération ou l'étourdissement ; le trait part dès qu'il le peut (demande retenue 6 pas, voir `game-model.md`).
- L'indicateur de départ suit la dernière entrée utilisée, avec la même règle que Leap avant toute entrée (`pointer: coarse`).

## Animations

La simulation (déplacements du héros, des pantins et des projectiles, préparation des attaques) et le ralenti ne sont pas des animations : ils ne changent ni en mouvement réduit ni sur une entrée (voir "Animations" dans `technical-specifications.md`).

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Traînée du trait | Ruban qui s'efface en 200ms derrière le héros | Aucune |
| Fil coupé | Étincelle au point de coupe, fils qui retombent, 250ms | Aucune |
| Pantin vaincu | Le pantin s'effondre et disparaît en fondu, 300ms | Disparition immédiate |
| Bouclier qui arrête un trait | Gerbe d'étincelles sur le bouclier, 200ms | Contour du bouclier épaissi 200ms, sans mouvement |
| Coup reçu | Tremblement de l'arène de 3px, 150ms, et clignotement du héros pendant son invulnérabilité | Pas de tremblement ; héros à 50 % d'opacité pendant son invulnérabilité |
| Arrivée d'une vague | Les pantins descendent au bout de leurs fils sur leurs marques, 300ms | Apparition immédiate |
| Ralenti | Les couleurs se refroidissent en 120ms | Changement immédiat |
| Victoire | Les rideaux s'écartent et la scène s'éclaire, 500ms, puis `complete()` | `complete()` immédiat |
| Défaite | La lumière du héros s'éteint en fondu, 400ms, puis `complete()` | `complete()` immédiat |

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Visée | Souffle grave et continu (bruit filtré passe-bas), tant que le ralenti dure | Ralenti actif |
| Trait | Sifflement bref (bruit filtré passe-haut, balayage descendant), 120ms | Début d'un trait |
| Fil coupé | Pincement de corde (synthèse de Karplus-Strong), hauteur qui monte avec chaque fil coupé dans un même trait | Pantin ou fil de colosse coupé |
| Bouclier | Choc métallique (sinusoïdes inharmoniques, décroissance de 300ms) | Trait arrêté par un bouclier |
| Préparation | Grincement de bois discret, 150ms | Début d'une préparation |
| Coup reçu | Note grave et sourde, 250ms | Cœur perdu |
| Nouvelle vague | Trois coups de bâton de théâtre (bruit filtré, 60ms, à 250ms d'écart) | Annonce d'une vague |
| Victoire | Accord qui s'ouvre (trois notes décalées de 60ms), 900ms | Victoire |
| Défaite | Accord mineur grave qui s'éteint, 900ms | Défaite |

## Tests

- Tests des critères AC-01 à AC-12 dans `logic/*.test.ts`, sur de petites arènes construites dans les tests pour AC-01 à AC-10.
- AC-12 simule, pour chaque niveau, au plus 10 800 pas avec la stratégie de référence et 3 600 sans trait : le test complet reste sous 10 secondes en CI. La stratégie de référence est le poste le plus coûteux (une quarantaine de traits simulés à chaque pas où elle peut foncer) ; si le budget n'est pas tenu, la mesure est consignée dans "Points tranchés à l'implémentation" avant tout changement.

## Performance

- Un pas de simulation reste sous 0,5ms avec 8 pantins et 20 projectiles.
- Le dessin d'une image reste sous 3ms sur un mobile milieu de gamme récent.
- Le module publié reste sous 40 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

Aucun pour l'instant.
