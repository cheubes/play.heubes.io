# Spécifications techniques : Coffer

## Rendu

DOM et SVG, avec des transformations CSS 3D pour les rotations.

- Le coffret est un cube CSS (`transform-style: preserve-3d`, `perspective`) dont chaque face est un `<svg>` de `viewBox="0 0 100 100"`. Une rotation tourne le cube d'un quart de tour ; pour le dessus et le dessous atteints depuis une autre face que l'avant, le cube tourne aussi autour de l'axe vertical, pour finir aligné sur l'avant (règle 2).
- Les mécanismes sont des groupes SVG dessinés par type, avec `role="button"`, un nom accessible (`aria-label`) et un état (`aria-pressed` ou texte d'état) tenus à jour. Les inscriptions ont `role="img"` et un nom accessible.
- Les faces cachées restent dans le DOM, avec `aria-hidden="true"` et `inert`, pour que seule la face affichée soit lue et actionnable.
- L'inventaire et les flèches de bord sont des `<button>` HTML dans l'aire de jeu, avec leur nom accessible.

Taille : la face est le plus grand carré qui tient dans l'aire de jeu avec l'inventaire (une rangée de six places de 48px sous la face en portrait, une colonne à sa droite en paysage) et les flèches de bord (44px), avec une marge de `--space-4`, plafonnée à 560px.

Alternatives écartées :
- **Canvas 2D** : il faudrait gérer soi-même le repérage des clics, la rotation en perspective et toute l'accessibilité ; le SVG donne des éléments nommés, actionnables et lisibles par les lecteurs d'écran.
- **Moteur 3D** : écarté avec la rotation libre (voir "Hors périmètre" dans `functional-specifications.md`).

## Organisation du code

| Module | Rôle |
|---|---|
| `logic/types.ts` | Types de `game-model.md`. |
| `logic/level-parser.ts` | `parseLevel`, index des éléments et des contenus. |
| `logic/conditions.ts` | Évaluation des conditions, visibilité. |
| `logic/coffer.ts` | `createState`, `rotate`, `activate`, ouvertures automatiques. |
| `logic/search.ts` | États et actions abstraits, recherche en largeur (partagée par les indices et les tests). |
| `logic/hints.ts` | `hint`. |
| `logic/progress.ts` | Sauvegarde `CofferSave`, parties en cours, règle du statut `perfect`, autour de `getUnlockEntries`. |
| `levels/levels.ts` | Les 12 coffrets. |
| `render/box.ts` | Cube, faces, flèches de bord, dimensionnement. |
| `render/elements.ts` | Dessin de chaque type d'élément et de ses états, noms accessibles. |
| `render/inventory.ts` | Inventaire et sélection d'objet. |
| `render/animations.ts` | Rotations, ouvertures, objets ramassés, indices, victoire. |
| `render/input.ts` | Pointeur et clavier. |
| `render/sounds.ts` | Synthèse des sons. |
| `index.ts` | `GameDefinition`, action "hint", reprise. |

Utilitaires communs : `getUnlockEntries` (`unlock.ts`) et `nextSelection` (`selection.ts`) pour le curseur clavier, avec les centres des éléments à l'écran.

## Reprise

- `getLevels` signale les coffrets présents dans `inProgress` (voir "Contrat d'un jeu" dans `technical-specifications.md`).
- `start(levelId)` crée l'état depuis la partie en cours s'il y en a une, sinon depuis l'état initial du coffret ; le temps reprend à `elapsedMs`.
- `restart()` efface la partie en cours et recommence le coffret. La confirmation est demandée par l'hôte avant l'appel (voir "Reprise d'un niveau" dans `game-page.md`).
- `pause()` écrit la partie en cours, pour qu'une fermeture de la page après une perte de focus ne perde rien.

## Contrôles

- Pointeur : un `pointerup` sur un élément appelle `activate`, sauf si le pointeur s'est déplacé de plus de 10px depuis le `pointerdown`. Un déplacement de plus de 40px, à dominante horizontale ou verticale, fait pivoter le coffret au relâcher : vers la gauche, rotation `right` ; vers la droite, `left` ; vers le bas, `up` ; vers le haut, `down`. Un glisser vers une rotation indisponible ne fait rien.
- Clavier : le curseur parcourt, avec `nextSelection`, les éléments actionnables de la face, les objets de l'inventaire et les flèches de bord. Il démarre sur le premier élément actionnable de la face, dans l'ordre de lecture, et y revient après chaque rotation. `Espace` et `Entrée` activent l'élément sous le curseur ; `Maj` + flèche fait pivoter (`Maj` + `→` montre la face de droite, `Maj` + `↑` le dessus) ; `Backspace` désélectionne l'objet ; `H` demande un indice (raccourci de l'action du HUD).
- Le curseur clavier n'est affiché qu'après une première touche du clavier, et masqué dès une utilisation du pointeur. Une touche qui fait apparaître le curseur ne fait que l'afficher.
- Une entrée reçue pendant une animation appelle `finish()` sur les animations en cours, puis est traitée (règle commune).

## Indices

La recherche en largeur d'un indice tourne dans le fil principal, sur l'état abstrait courant. Avec au plus 200 000 états (voir "Contraintes de validation" dans `game-model.md`), elle reste sous 150ms sur un mobile milieu de gamme ; le bouton passe en chargement (`aria-busy`) le temps du calcul.

## Animations

| Animation | Normale | Mouvement réduit |
|---|---|---|
| Rotation | Quart de tour du cube, 400ms, `--ease-in-out` | Fondu enchaîné de 150ms entre les deux faces |
| Mécanisme bloqué | Tremblement horizontal de 2 unités, 200ms | Contour épaissi 200ms, sans mouvement |
| Tiroir, panneau, trappe | Le tiroir sort, le panneau glisse, la trappe bascule, 300ms, `--ease-out` | Changement immédiat |
| Cadran | La valeur défile d'un cran, 150ms | Changement immédiat |
| Bouton, levier | Enfoncement ou basculement, 120ms | Changement immédiat |
| Objet ramassé | L'objet file vers sa place dans l'inventaire, 300ms | Il apparaît directement dans l'inventaire |
| Indice | Bulle en fondu, 150ms ; au palier 2, anneau qui pulse autour du mécanisme | Bulle sans fondu ; anneau fixe |
| Breloque | Éclat de 400ms dans son compartiment, puis trajet vers l'inventaire | Elle apparaît directement dans son emplacement |
| Victoire | Le couvercle s'ouvre lentement sur une lueur, 800ms, puis `complete()` | `complete()` immédiat |

## Son

Synthèse Web Audio, sans fichier, connectée à `context.audio.output()` :

| Son | Synthèse | Déclencheur |
|---|---|---|
| Rotation | Frottement de bois (bruit filtré passe-bande), 250ms, faible | Rotation |
| Bloqué | Toc sourd (sinusoïde grave très brève et bruit passe-bas) | Mécanisme bloqué |
| Compartiment | Glissement de bois puis clic, 300ms | Compartiment qui s'ouvre |
| Cadran | Cliquetis de cran (deux clics très brefs) | Cadran tourné |
| Bouton, levier | Clic mécanique | Bouton ou levier inversé |
| Objet ramassé | Tintement doux selon la matière (métal, pierre) | Objet ramassé |
| Logement rempli | Clic de serrure, plus grave | Objet placé |
| Breloque | Carillon clair à trois notes | Breloque trouvée |
| Victoire | Petite mélodie de boîte à musique (cinq notes d'une gamme pentatonique), 1,5 s | Couvercle ouvert |

## Tests

- Tests des critères AC-01 à AC-09 dans `logic/*.test.ts`, sur de petits coffrets construits dans les tests pour AC-01 à AC-07.
- AC-09 parcourt tous les états abstraits de chaque coffret (au plus 200 000) pour vérifier l'absence d'impasse : le test complet reste sous 10 secondes en CI.

## Performance

- `activate` reste sous 1ms.
- Une rotation n'anime que `transform` ; les faces ne sont pas redessinées.
- Le module publié reste sous 40 Ko compressé.

## Nouvelles dépendances

Aucune.

## Points tranchés à l'implémentation

Aucun pour l'instant.
