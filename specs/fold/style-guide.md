# Charte graphique : Fold

## Direction artistique

Un atelier d'impression, la nuit, sous une lampe : une feuille de papier crème au grain léger, posée sur le fond sombre du site, imprimée d'encres mates aux tons d'imprimerie traditionnelle (vermillon, indigo, ocre, vert). Les motifs sont nets, comme sortis d'une presse. Plier doit donner une sensation tactile : la feuille a une épaisseur, les plis laissent une ombre, le rabat se pose avec un léger poids.

## Palette

Custom properties déclarées sur `.game-fold`. Contrastes mesurés sur `--fold-paper`, sauf mention contraire. Les quatre encres ont une luminosité proche (de 1,0:1 à 1,9:1 entre elles) : seul leur motif les distingue sans la couleur (voir "Éléments de jeu").

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--fold-paper` | `#F3EBD8` | 16,2:1 sur `--color-bg` | Papier nu, motifs dessinés sur les encres. |
| `--fold-crease` | `#DDD0B4` | | Lignes de la grille sur le papier (décoratives). |
| `--fold-paper-edge` | `#C9B996` | | Tranche des couches empilées (décorative). |
| `--fold-ink` | `#1E1B24` | 14,3:1 | Contours, épingles, trait intérieur de la ligne de pli. |
| `--fold-vermilion` | `#C8432F` | 4,1:1 | Encre vermillon. |
| `--fold-indigo` | `#2E4691` | 7,4:1 | Encre indigo. |
| `--fold-ochre` | `#9A6A12` | 4,0:1 | Encre ocre. |
| `--fold-green` | `#1F7A5C` | 4,4:1 | Encre verte. |
| `--fold-pin` | `#D4A72C` | 7,6:1 sur `--fold-ink` | Tête des épingles. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Feuille | Cases jointives, `--fold-paper`, grain léger (bruit à 4 % d'opacité), lignes de grille fines `--fold-crease`, coins de la feuille légèrement arrondis. Ombre portée douce sur le fond. |
| Papier nu | `--fold-paper`, sans motif. |
| Case d'encre | Remplie de son encre, avec son motif en `--fold-paper`. Motifs, tous symétriques par rapport aux deux axes : vermillon, trois rangées de trois pois ; indigo, trois rayures horizontales ; ocre, une croix centrale ; vert, un losange central. |
| Découpe et position vide | Le fond de l'aire de jeu apparaît, entouré d'un bord en pointillés `--fold-paper-edge`. |
| Épaisseur | Sous une pile de plusieurs couches, un liseré `--fold-paper-edge` décalé de 1px par couche, jusqu'à trois (décoratif). |
| Épingle | Tête ronde `--fold-pin` de 0,3 case, cerclée de `--fold-ink`, au centre de la case, toujours au-dessus de sa pile. |
| Carte modèle | La face à obtenir, dessinée comme la feuille (mêmes cases, motifs et découpes), en réduction, sans épaisseur ni épingle. Libellé "Goal" / "Modèle" au-dessus, en Chakra Petch 600 `sm`, `--color-text-muted`. |
| Ligne de pli (aperçu et curseur clavier) | Trait de 2px `--color-accent` (token du site) doublé à l'intérieur d'un trait de 2px `--fold-ink`, sur toute la longueur de la feuille : l'encre reste lisible sur le papier, le cyan sur le fond. |
| Rabat fantôme | La partie mobile, retournée, à sa position d'arrivée, à 40 % d'opacité, cases cerclées d'un trait fin `--fold-ink`. |

## Animations

Gestes de papier : le rabat tourne autour de la ligne avec un léger ralenti à l'arrivée, comme une feuille qu'on pose, et la feuille glisse pour rester centrée. À la victoire, la feuille se presse comme sous une presse et la carte modèle s'illumine. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons de papier : un froissement qui monte quand le rabat tourne et un clic sourd quand il se pose, deux clics graves quand une épingle bloque, un froissement descendant à l'annulation, un accord qui s'ouvre à la victoire. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Une feuille crème à moitié pliée, vue de trois quarts : le rabat, en train de tourner, montre des cases vermillon et indigo à motifs, et va recouvrir une partie ocre et verte. Une épingle dorée tient un coin. Fond sombre.
