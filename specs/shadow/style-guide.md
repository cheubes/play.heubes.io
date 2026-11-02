# Charte graphique : Shadow

## Direction artistique

Une place de pierre au soleil rasant de fin d'après-midi, vue du dessus. Le sol au soleil est un sable chaud et doré, les ombres sont froides, d'un violet profond, comme sur une photographie à l'heure dorée : le contraste chaud / froid fait lire l'ombre avant même la forme. Les tours sont des blocs de grès à étages, francs et géométriques. Le plateau est la seule surface claire de la page : il doit donner l'impression d'une fenêtre ouverte sur le soleil.

## Palette

Custom properties déclarées sur `.game-shadow`. Contrastes mesurés sur `--shadow-floor-sun` puis sur `--shadow-floor-shade`, sauf mention contraire. Aucun élément ne peut contraster avec les deux sols à la fois : chaque élément porteur d'information associe un contour `--shadow-ink`, lisible au soleil, et une face claire, lisible à l'ombre.

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--shadow-floor-sun` | `#E8C68A` | | Sol au soleil. |
| `--shadow-floor-sun-warm` | `#F5D9A3` | | Sol au soleil pendant la victoire. |
| `--shadow-floor-shade` | `#3E3A5C` | 6,6:1 contre le sol au soleil | Sol à l'ombre, hachures de la pénombre. |
| `--shadow-grid` | `#D9B577` | | Repères de grille (décoratifs). |
| `--shadow-ink` | `#1C1726` | 10,7:1 / 1,6:1 | Contours des tours, chiffres de hauteur, disque des cibles, rivets, trait intérieur du curseur clavier. |
| `--shadow-rim` | `#FFF1D6` | 1,5:1 / 9,6:1 | Bord des cibles, anneau du socle des tours réglables. |
| `--shadow-tower` | `#F2B880` | 1,1:1 / 6,1:1 | Face des étages des tours réglables. |
| `--shadow-tower-tier` | `#C46A3A` | | Arêtes entre étages (décoratives). |
| `--shadow-stone` | `#BDB7C9` | 1,2:1 / 5,5:1 | Face des étages des tours fixes. |
| `--shadow-moon` | `#8EA8FF` | 7,7:1 sur `--shadow-ink` | Symbole des cibles d'ombre. |
| `--shadow-sun` | `#FFB13B` | 9,7:1 sur `--shadow-ink` | Symbole des cibles de soleil. |
| `--shadow-light` | `#FFD166` | 13,3:1 sur `--color-bg` | Indicateurs de lumière, dans la marge du plateau. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Plateau | Cases de sol jointives, sans espace entre elles, un point `--shadow-grid` à chaque intersection, coins arrondis (`--radius-lg`). La marge autour du plateau garde le fond de l'aire de jeu. |
| Sol au soleil | `--shadow-floor-sun`, uni. |
| Sol à l'ombre | `--shadow-floor-shade`, uni. |
| Sol dans la pénombre | Fond `--shadow-floor-sun` et hachures diagonales `--shadow-floor-shade` de 0,08 case, couvrant la moitié de la surface. |
| Tour réglable | Vue du dessus : socle rond (anneau `--shadow-rim`, contour `--shadow-ink`), puis un carré arrondi par étage, chacun plus petit que le précédent (le premier de 0,7 case, puis 0,14 case de moins par étage), face `--shadow-tower`, contour `--shadow-ink`. Le chiffre de la hauteur, en Chakra Petch 700 `--shadow-ink`, est centré sur l'étage du haut. Hauteur 0 : socle seul, sans chiffre. |
| Tour fixe | Mêmes étages, face `--shadow-stone`, sans socle rond, avec un rivet `--shadow-ink` à chaque coin de l'étage du bas. |
| Cible d'ombre | Disque `--shadow-ink` de 0,64 case, bord `--shadow-rim`, croissant de lune `--shadow-moon` au centre. |
| Cible de soleil | Même disque, soleil `--shadow-sun` au centre (cercle et huit rayons). |
| Indicateur de lumière | Dans la demi-case de marge du côté d'où vient la lumière : un soleil `--shadow-light` au milieu du côté et un chevron `--shadow-light` face à chaque ligne ou colonne, pointé dans le sens de la lumière. |
| Curseur clavier | Carré arrondi autour de la case, trait de 2px `--color-accent` (token du site) doublé à l'intérieur d'un trait de 2px `--shadow-ink` : l'encre reste lisible au soleil, le cyan à l'ombre. |

### États d'une cible

| État | Apparence du symbole |
|---|---|
| Non satisfaite | Contour seul, dans la couleur du symbole. |
| Satisfaite | Plein, dans la couleur du symbole, avec un anneau extérieur de la même couleur autour du disque. |

## Animations

Gestes lents et lumineux, comme le soleil qui avance : un étage qui se pose sans brusquerie, une ombre qui s'étire depuis le pied de la tour. À la victoire, la lumière se réchauffe sur toute la place et les cibles pulsent en cascade. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons minéraux et feutrés : un choc de pierre qui monte d'un ton à chaque étage, un bruit sourd quand la tour retombe sur son socle, un carillon doux quand une cible est atteinte (grave pour l'ombre, aigu pour le soleil), une note brève descendante quand elle est perdue, un accord qui s'ouvre à la victoire. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Une place de sable doré vue du dessus, sous une lumière venant de la gauche : trois tours de hauteurs différentes étirent leurs ombres violettes jusqu'à des cibles lune satisfaites, tandis qu'une cible soleil reste en pleine lumière entre deux ombres.
