# Charte graphique : Prism

## Direction artistique

Un banc d'optique dans la pénombre. Le plateau est presque noir, pour que la lumière soit la vedette. Les faisceaux sont vifs, avec un halo qui s'additionne là où ils se superposent. Les éléments sont en verre et en métal clair, fins et précis, comme des instruments de laboratoire. Une partie réussie doit donner l'impression d'allumer une installation lumineuse.

## Palette

Custom properties déclarées sur `.game-prism`. Contrastes mesurés sur `--prism-floor`.

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--prism-floor` | `#111826` | | Fond du plateau. |
| `--prism-grid` | `#1E2738` | | Repères de grille (décoratifs). |
| `--prism-wall` | `#5A6984` | 3,2:1 | Murs. |
| `--prism-metal` | `#C9D3E3` | 11,8:1 | Miroirs, contours des éléments, rivets. |
| `--prism-housing` | `#2B3648` | | Corps des sources et des cibles. |
| `--prism-red` | `#FF5050` | 5,5:1 | Faisceau et secteur rouge. |
| `--prism-green` | `#45F07A` | 11,8:1 | Faisceau et secteur vert. |
| `--prism-blue` | `#5B8CFF` | 5,6:1 | Faisceau et secteur bleu. |
| `--prism-yellow` | `#FFE45C` | 14,0:1 | Faisceau jaune. |
| `--prism-cyan` | `#5CF2FF` | 13,2:1 | Faisceau cyan. |
| `--prism-magenta` | `#FF5CF0` | 6,8:1 | Faisceau magenta. |
| `--prism-white` | `#F5F7FA` | 16,6:1 | Faisceau blanc, anneau des cibles allumées. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Plateau | Fond `--prism-floor`, un point `--prism-grid` à chaque intersection de cases, coins arrondis (`--radius-lg`). |
| Mur | Case pleine `--prism-wall`. |
| Source | Boîtier carré arrondi `--prism-housing`, contour `--prism-metal`, une encoche lumineuse du côté de l'émission, et les trois secteurs de sa couleur au centre. |
| Cible | Disque `--prism-housing` divisé en trois secteurs à position fixe : rouge en haut, vert en bas à droite, bleu en bas à gauche. |
| Miroir | Barre diagonale épaisse `--prism-metal`, avec un reflet en dégradé. |
| Prisme | Triangle de verre (remplissage blanc à 12 %, contour `--prism-white`), avec un petit éventail rouge-vert-bleu à l'intérieur qui indique le côté vers lequel part le rouge. |
| Filtre | Vitre carrée teintée de sa couleur à 35 %, contour `--prism-metal`, les trois secteurs de sa couleur dans un coin. |
| Élément orientable | Socle circulaire discret sous l'élément (le pivot). |
| Élément fixe | Deux rivets `--prism-metal` aux extrémités, pas de socle. |
| Faisceau | Cœur de 0,08 case dans sa couleur, halo de 0,3 case dans sa couleur à 25 % d'opacité, extrémités arrondies. |
| Curseur clavier | Carré arrondi autour de la case, trait de 2px `--color-accent` (token du site). |

### Secteurs d'une cible

Chaque secteur combine deux informations, lisibles sans la couleur :

| Primaire attendue | Primaire reçue | Apparence du secteur |
|---|---|---|
| Oui | Non | Contour seul, dans la couleur de la primaire. |
| Oui | Oui | Plein, dans la couleur de la primaire. |
| Non | Oui | Plein, hachuré, avec une petite croix : primaire en trop. |
| Non | Non | Vide, sans contour. |

Cible allumée : anneau extérieur `--prism-white` lumineux et petite coche au centre.

Sources et filtres utilisent les mêmes secteurs, en version pleine uniquement (ils n'ont pas d'état attendu ou reçu).

## Animations

Bascules franches et rapides, comme un instrument qu'on règle. Le flux des faisceaux est lent et discret, il donne vie au plateau sans distraire. À la victoire, la lumière s'intensifie et les cibles pulsent en cascade. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons cristallins et doux : un clic net à chaque bascule, une note de cloche quand une cible s'allume (une note par couleur, toutes dans la même gamme pentatonique), une note brève descendante quand elle s'éteint, une note plus courte et plus discrète quand elle reçoit ou perd une de ses primaires sans s'allumer ni s'éteindre, un accord qui s'ouvre à la victoire. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Un faisceau blanc qui entre dans un prisme et s'ouvre en trois faisceaux rouge, vert et bleu, renvoyés par des miroirs vers des cibles allumées, sur un plateau presque noir.
