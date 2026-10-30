# Charte graphique : Tilt

## Direction artistique

Un plateau de jeu physique, épuré et tactile : un plateau sombre posé dans l'aire de jeu, des murs en relief, et des blocs aux couleurs vives, comme des pièces de bonbon laqué gravées d'un symbole. Le mouvement doit donner une sensation de poids : accélération en glissant, petit écrasement à l'impact.

## Palette

Custom properties déclarées sur `.game-tilt`. Contrastes mesurés sur `--tilt-floor`.

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--tilt-floor` | `#161E2C` | | Cases de sol. |
| `--tilt-grid` | `#222C3E` | | Séparation des cases (décorative). |
| `--tilt-wall` | `#5A6984` | 3,0:1 | Murs. |
| `--tilt-wall-edge` | `#7B8AA6` | | Arête supérieure éclairée des murs. |
| `--tilt-sticky` | `#8B73FF` | 4,8:1 | Motif des cases collantes. |
| `--tilt-amber` | `#FFB627` | 9,5:1 | Bloc et cible ambre. |
| `--tilt-azure` | `#3D9BFF` | 5,8:1 | Bloc et cible azur. |
| `--tilt-rose` | `#FF5C8A` | 5,7:1 | Bloc et cible rose. |
| `--tilt-mint` | `#3EE0A5` | 9,9:1 | Bloc et cible menthe. |
| `--tilt-neutral` | `#8A96AD` | 5,6:1 | Bloc neutre. |
| `--tilt-symbol` | `#0B0F17` | 4,3:1 à 11,3:1 selon le bloc | Symbole gravé sur les blocs. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Plateau | Fond `--tilt-floor`, cases séparées par un filet `--tilt-grid`, coins extérieurs arrondis (`--radius-lg`), ombre portée douce sur `--color-bg`. |
| Mur | Case pleine `--tilt-wall`, arête supérieure `--tilt-wall-edge` pour l'effet de relief, coins vifs. |
| Case collante | Sol avec une trame de points `--tilt-sticky`. |
| Cible | Symbole de la couleur en contour (trait de 2px), sur un fond de case teinté à 12 % de la couleur. |
| Bloc coloré | Carré arrondi de 84 % de la case (rayon de 18 %), dégradé léger du haut vers le bas, symbole plein `--tilt-symbol` centré (40 % de la case). |
| Bloc neutre | Même forme, `--tilt-neutral`, hachures diagonales, sans symbole. |
| Bloc sur sa cible | Lueur extérieure de sa couleur. |

Symboles par couleur : ambre = cercle, azur = triangle, rose = carré, menthe = losange.

## Animations

Sensation de poids : les blocs accélèrent en glissant, s'écrasent légèrement à l'impact, le plateau s'incline à peine pendant le mouvement. La victoire fait pulser les blocs en cascade. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons courts, feutrés et boisés, jamais agressifs : un souffle au glissement, un "toc" à l'impact, deux notes cristallines quand un bloc trouve sa cible (de plus en plus aiguës d'une couleur à l'autre : ambre, azur, rose, menthe), un arpège bref à la victoire. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Le plateau vu en légère perspective, quatre blocs colorés en plein glissement avec une traînée de mouvement, une cible éclairée, sur `--color-bg`.
