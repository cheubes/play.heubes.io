# Spécifications techniques : Tilt

## Rendu

DOM et CSS. Le plateau compte au plus 64 cases et quelques blocs : le DOM suffit largement, il donne des éléments nets à toute échelle et des animations fluides via les transformations CSS accélérées.

- Terrain : une grille CSS (`display: grid`), une cellule par case, dessinée une fois au démarrage du niveau.
- Blocs : éléments positionnés en absolu au-dessus du terrain, placés par `transform: translate()` en unités de case.
- Taille de case : custom property `--cell`, calculée par l'aire de jeu (`ResizeObserver` sur le conteneur) comme le plus grand entier tel que le plateau tienne dans l'espace disponible avec une marge de `--space-4`, plafonné à 72px.

Alternatives écartées :
- **Canvas 2D** : il faudrait gérer soi-même la netteté sur les écrans haute densité, le dessin des symboles et l'accessibilité, sans gain de performance perceptible à cette échelle.
- **SVG** : convenable, mais les transformations CSS animées sur des éléments HTML sont plus simples à orchestrer avec la Web Animations API.

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`. |
| `logic/tilt.ts` | `createState`, `tilt`, `undo`, `restart`, `isSolved`. |
| `logic/solver.ts` | Solveur, pour les tests uniquement. |
| `levels/levels.ts` | Les 20 niveaux. |
| `render/board.ts` | Création du DOM du plateau, placement des blocs, dimensionnement. |
| `render/animations.ts` | Animations de glissement, d'arrêt, d'inclinaison et de victoire. |
| `render/input.ts` | Clavier et geste de glissement. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition` : relie la logique, le rendu et le contexte de l'hôte. |

La progression (statuts des niveaux, record) vient de `src/games/shell/progress.ts`, partagée avec Prism.

`index.ts` n'importe pas `solver.ts`, qui n'est donc pas inclus dans le module publié.

## Contrôles

- Clavier : `keydown` sur le conteneur. `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` inclinent (avec `preventDefault` pour empêcher le défilement) ; `z`, `Z` et `Backspace` annulent. La répétition automatique d'une touche maintenue est ignorée (`event.repeat`).
- Glisser : `pointerdown` sur l'aire de jeu (capture du pointeur), puis `pointerup`. Si le déplacement total dépasse 30px, la direction est l'axe dominant (`|dx|` contre `|dy|`) ; sinon le geste est ignoré. Une seule inclinaison par geste.
- Une entrée reçue pendant une animation appelle `finish()` sur les animations en cours, puis est traitée (règle commune).

## Animations

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Glissement d'un bloc | `transform`, durée 60ms + 30ms par case parcourue (240ms au plus), accélération (`cubic-bezier(0.5, 0, 0.9, 0.6)`), tous les blocs partent ensemble | 60ms, linéaire |
| Arrêt d'un bloc (`stoppedBy` : `wall` ou `block`) | Écrasement de 80ms dans l'axe du mouvement (échelle 1.08 × 0.92, puis retour) | Aucune |
| Arrêt sur case collante | Léger enfoncement de 80ms (échelle 0.94, puis retour) | Aucune |
| Inclinaison du plateau | Rotation 3D de 3° vers la direction (perspective 900px) pendant le glissement, retour à plat à la fin | Aucune |
| Inclinaison sans effet | Rotation 3D de 2° et retour, 160ms | Aucune |
| Bloc sur sa cible | Lueur de la couleur du bloc, fondu de 120ms | Lueur sans fondu |
| Victoire | Pulsation des blocs l'un après l'autre (80ms d'écart, 320ms chacun), puis appel de `complete()` | Pas de pulsation, `complete()` immédiat |

Pendant une animation, l'état logique est déjà à jour : l'animation ne fait que rattraper l'affichage.

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Glissement | Bruit filtré passe-bande, 90ms, enveloppe douce | Début d'un coup |
| Impact | Sinusoïde de 140Hz, décroissance de 90ms | Arrêt du dernier bloc |
| Inclinaison sans effet | Sinusoïde de 90Hz, 70ms, faible volume | Inclinaison sans effet |
| Bloc sur sa cible | Deux notes brèves, hauteur propre à chaque couleur | Bloc qui s'immobilise sur sa cible |
| Victoire | Arpège ascendant de quatre notes | Niveau résolu |
| Annulation | Clic bref inversé | Annulation |

## Tests

- Tests des critères AC-01 à AC-12 dans `logic/*.test.ts`.
- AC-12 parcourt tous les niveaux de `levels.ts` avec le solveur. Le temps total de ce test reste sous 10 secondes en CI ; au-delà, le niveau fautif est à simplifier.

## Performance

Aucune contrainte particulière : le module publié (hors sons, synthétisés) reste sous 30 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

- **2026-10-30 / Sauvegarde à la résolution** : le record est écrit dès que le niveau est résolu, avant l'animation de victoire. Raison : quitter la page pendant l'animation ne doit pas faire perdre la progression.
- **2026-10-30 / Entrée après la résolution** : une fois le niveau résolu, une entrée ne joue plus de coup ; elle termine l'animation de victoire, ce qui ouvre le panneau de fin. Raison : le plateau ne doit plus bouger, et le joueur peut passer l'animation.
- **2026-10-30 / Ordre de la victoire** : seuls les blocs colorés pulsent, dans l'ordre de lecture (rangée, puis colonne). Raison : les blocs neutres n'ont pas de cible, ils ne participent pas à la résolution.
- **2026-10-30 / Sons interrompus** : les sons programmés pour la fin d'une animation (impact, notes de cible) sont annulés quand une entrée termine cette animation, ainsi qu'au chargement d'un niveau et au redémarrage. Raison : un son tardif ne doit pas se superposer au coup suivant ni au niveau qui commence. Révisé le 2026-11-01 : la fermeture du jeu n'annule plus rien, l'hôte coupant déjà tous les sons à la sortie de partie (voir "Son" dans les spécifications techniques générales).
- **2026-10-30 / Hauteur des sons** : notes de cible do6, ré6, mi6, sol6 (ambre, azur, rose, menthe), chacune suivie de sa quinte ; arpège de victoire do5, mi5, sol5, do6. Raison : des intervalles consonants, de plus en plus aigus d'une couleur à l'autre (voir "Sons" dans `style-guide.md`).
- **2026-10-30 / Touches avec modificateur** : une touche pressée avec `Ctrl`, `Cmd` ou `Alt` n'est pas interceptée. Raison : laisser au navigateur ses propres raccourcis (`Cmd+Z`, `Alt+←` ...).
- **2026-10-30 / Geste** : seuls le pointeur principal et, à la souris, le bouton gauche démarrent un geste ; un `pointercancel` l'abandonne. Raison : un second doigt ou un clic droit ne doivent pas incliner le plateau.
- **2026-10-30 / Accord des annonces** : l'annonce d'un coup existe au singulier et au pluriel, choisie par `Intl.PluralRules` selon le nombre de blocs en place. Raison : le français met le singulier à 0 et à 1 ("0 bloc sur 4 en place").
