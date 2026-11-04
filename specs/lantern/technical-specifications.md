# Spécifications techniques : Lantern

## Rendu

Canvas 2D. Trois `<canvas>` superposés, à la densité de l'écran (`devicePixelRatio`) :

1. **salle** : sol, murs, braseros, plaques, portes, dessinés en pleine lumière ; redessiné à chaque changement de salle ou d'état fixe (porte ouverte, brasero allumé, caisse poussée) ;
2. **scène** : objets, caisses, ombres, explorateur ; redessiné à chaque image ;
3. **obscurité** : un voile `--lantern-dark` sur toute la salle, percé (`globalCompositeOperation: 'destination-out'`) d'un dégradé radial autour de chaque case éclairée par `litCells`, puis le dessin "en mémoire" des cases sombres (contours `--lantern-memory`) et les yeux des ombres ; redessiné à chaque image.

La lumière affichée suit exactement `litCells` (case par case), adoucie par les dégradés : ce que le joueur voit éclairé est ce que la logique considère comme éclairé.

Taille : la salle intérieure fait 8 × 8 cases, et son bord est dessiné sur un quart de case. Le plateau mesure donc 8,5 × 8,5 cases. La taille de case est calculée comme `fitCellSize` (`src/games/shell/dom.ts`), sur l'aire de jeu diminuée de la bande de la carte et des objets (72px sous la salle en portrait, à sa droite en paysage), cases plafonnées à 64px.

Alternatives écartées :
- **SVG ou DOM** : l'obscurité percée de dégradés à chaque image, et les ombres en mouvement, sont naturels sur un canvas et coûteux en SVG (masques recalculés).
- **WebGL (éclairage par shader)** : plus beau, mais une nouvelle couche technique pour un éclairage case par case que le Canvas 2D rend très bien.

## Boucle de jeu

La boucle à pas fixe commune (`src/games/shell/loop.ts`, extraite par Slash) : pas de 1/60 s, rattrapage borné, interpolation des positions entre deux cases, pause sans rattrapage. Les entrées sont lues au début de chaque pas. Si Slash n'est pas encore construit, l'extraction se fait à l'étape 3 de ce plan, dans les mêmes termes.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types et constantes de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel` : salles, portes, patrouilles. |
| `logic/light.ts` | `litCells`, lignes de vue. |
| `logic/pathing.ts` | Plus court chemin de l'explorateur, chemin des ombres par les cases sombres. |
| `logic/shadows.ts` | Fuite, chasse, patrouille. |
| `logic/lantern.ts` | `createState`, `step`, points de reprise. |
| `logic/solver.ts` | Solveur et partie de référence, pour les tests uniquement. |
| `logic/progress.ts` | Sauvegarde `LanternSave`, parties en cours, règle du statut `perfect`, autour de `getUnlockEntries`. |
| `levels/levels.ts` | Les 6 donjons. |
| `render/canvas.ts` | Canvas, densité, dimensionnement, disposition de la carte. |
| `render/draw.ts` | Salle, scène, obscurité, carte des salles. |
| `render/input.ts` | Toucher, glisser maintenu, clavier. |
| `render/effects.ts` | Flamme, changement de salle, capture, victoire. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`, actions "lantern" et "room", reprise. |

## Reprise

- `getLevels` signale les donjons présents dans `inProgress` (voir "Contrat d'un jeu" dans `technical-specifications.md`).
- `start(levelId)` crée l'état depuis le point de reprise s'il existe, sinon depuis le départ du donjon.
- `restart()` efface le point de reprise du donjon et recommence depuis le départ. La confirmation est demandée par l'hôte avant l'appel (voir "Reprise d'un niveau" dans `game-page.md`).
- Le point de reprise est écrit dans la sauvegarde à chaque entrée dans une salle, et effacé quand le donjon est terminé, avant l'animation de victoire.

## Contrôles

- Pointeur : un `pointerdown` puis un `pointerup` sans déplacement de plus de 24px envoie `goTo` vers la case visée (le plus court chemin y mène, ou s'arrête au plus près si elle est infranchissable). Au-delà de 24px, l'axe dominant du glisser donne une direction, envoyée en `hold` tant que le pointeur reste posé, et remplacée si le doigt change de direction ; au relâcher, `hold` passe à `null`. `pointercancel` équivaut à un relâcher.
- Clavier : une flèche enfoncée envoie `hold` dans sa direction ; la dernière flèche enfoncée l'emporte ; quand toutes sont relâchées, `hold` passe à `null`. `Espace` voile ou rallume la lanterne ; `Backspace` ramène à l'entrée de la salle. Les répétitions de touche sont ignorées.
- Une case visée au toucher est marquée d'un petit cercle jusqu'à ce que l'explorateur l'atteigne ou change d'ordre.
- Une entrée reçue pendant un effet décoratif (changement de salle, voile de capture) termine l'effet, puis est traitée (règle commune).

## Animations

La simulation (déplacements de l'explorateur et des ombres, étendue de la lumière) n'est pas une animation : elle ne change ni en mouvement réduit ni sur une entrée (voir "Animations" dans `technical-specifications.md`).

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Flamme | Vacillement des dégradés de lumière (±4 % de rayon), en continu | Lumière fixe |
| Lanterne voilée ou rallumée | La lumière se resserre ou s'ouvre en 200ms | Changement immédiat |
| Brasero allumé | Jaillissement de la flamme et onde de lumière, 400ms | Changement immédiat |
| Ombre qui chasse | Les yeux s'allongent vers l'explorateur | Yeux fixes, plus gros |
| Capture | Voile noir qui se referme, 400ms, puis réapparition à l'entrée | Noir immédiat 300ms, puis réapparition |
| Changement de salle | La nouvelle salle glisse dans le sens de la porte, 300ms, `--ease-in-out` | Changement immédiat |
| Victoire | Le grand brasero s'embrase et la lumière envahit la salle, 800ms, puis `complete()` | `complete()` immédiat |

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Pas | Frottement très bref (bruit filtré), faible, une fois par case | Pas de l'explorateur |
| Flamme | Souffle continu très faible (bruit rose filtré), qui suit l'état de la lanterne | Lanterne allumée |
| Voile | Clapet métallique | Lanterne voilée ou rallumée |
| Brasero | Embrasement (bruit qui monte puis crépite), 600ms | Brasero allumé |
| Objet | Tintement, plus grave pour une clé, carillon pour un éclat | Objet ramassé |
| Porte | Grincement et déclic ; plus lourd pour la grande porte | Porte ouverte |
| Caisse | Raclement de pierre, 200ms | Caisse poussée |
| Ombre qui chasse | Murmure grave (bruit filtré modulé), plus fort quand elle approche | Ombre en chasse |
| Capture | Souffle descendant, 400ms | Capture |
| Huile basse | Deux notes graves, une fois | Huile qui passe sous 20 |
| Victoire | Accord qui s'ouvre et crépitement, 1,5 s | Grand brasero allumé |

## Tests

- Tests des critères AC-01 à AC-11 dans `logic/*.test.ts`, sur de petits donjons construits dans les tests pour AC-01 à AC-09.
- AC-11 explore les états de chaque donjon sans les ombres, puis joue la partie de référence : le test complet reste sous 10 secondes en CI. La taille de l'exploration dépend surtout des caisses ; si le budget n'est pas tenu, la mesure est consignée dans "Points tranchés à l'implémentation" avant tout changement des contraintes.

## Performance

- Un pas de simulation reste sous 0,5ms, `litCells` compris (au plus une dizaine de sources sur 64 cases).
- Le dessin d'une image reste sous 4ms sur un mobile milieu de gamme récent : la couche de la salle n'est pas redessinée à chaque image.
- Le module publié reste sous 50 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

Aucun pour l'instant.
