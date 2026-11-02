# Charte graphique : Delta

## Direction artistique

Un delta la nuit, vu du ciel. L'eau est presque noire, les canaux sont des lits plus clairs, et deux courants bioluminescents s'y affrontent : le tien, ambré et chaud, celui du rival, rose et froid. Les unités sont des lueurs qui filent le long des canaux en laissant une traînée. Les bassins sont des disques lumineux qui se remplissent. Une partie gagnée doit donner l'impression d'avoir allumé tout le delta.

## Palette

Custom properties déclarées sur `.game-delta`. Contrastes mesurés sur `--delta-water`. Le rival et les neutres ont la même luminosité (1,0:1 entre eux) et le joueur en est proche (1,7:1) : la forme distingue les camps (voir "Éléments de jeu").

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--delta-water` | `#0A1520` | | Fond de l'aire de jeu. |
| `--delta-channel` | `#4A6680` | 3,1:1 | Lit des canaux. |
| `--delta-player` | `#FFB627` | 10,5:1 | Bassins, unités et sorties du joueur. |
| `--delta-rival` | `#FF5C8A` | 6,3:1 | Bassins, unités et sorties du rival. |
| `--delta-neutral` | `#8A97AB` | 6,2:1 | Contour et chiffre des bassins neutres. |
| `--delta-ink` | `#0A1520` | 10,5:1 sur `--delta-player`, 6,3:1 sur `--delta-rival` | Chiffres sur les bassins pleins. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Canal | Trait `--delta-channel` de 0,18 unité de carte, extrémités arrondies. |
| Canal à marée | Même trait, ponctué de petites vagues ; fermé : pointillés et opacité 40 %. Un arc fin `--delta-channel` au milieu du canal indique le temps restant avant le prochain changement. |
| Bassin du joueur | Disque plein `--delta-player`, halo de la même couleur à 25 %, chiffre `--delta-ink` au centre (Chakra Petch 700). |
| Bassin du rival | Losange plein `--delta-rival` (carré tourné de 45°) inscrit dans le même diamètre, halo, chiffre `--delta-ink`. |
| Bassin neutre | Cercle vide, contour en pointillés `--delta-neutral`, chiffre `--delta-neutral`. |
| Taille | Diamètre selon la taille (voir `game-model.md`), et un, deux ou trois anneaux fins concentriques autour du bassin. |
| Sortie | Chevrons dans la couleur du camp, espacés de 0,5 unité de carte, le long du canal, dans le sens du courant. |
| Unité en route | Point rond de 0,12 unité de carte pour le joueur, petit losange de même taille pour le rival, avec une traînée. |
| Source sélectionnée | Anneau blanc (`--color-text`, token du site) autour du bassin ; ses canaux et ses voisins passent en pleine opacité, les autres éléments à 50 %. |
| Trait du glisser | Trait pointillé `--delta-player` du bassin source jusqu'au pointeur. |
| Curseur clavier | Anneau de 2px `--color-accent` (token du site) autour du bassin. |

## Animations

Tout coule : les lueurs filent avec leur traînée, les chevrons défilent lentement dans le sens du courant, une prise se propage en onde. À la victoire, les bassins du joueur pulsent en cascade ; à la défaite, ses dernières lueurs s'éteignent. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons aquatiques et cristallins : un tic à la sélection, un glissando montant quand un courant s'établit, une note descendante pour la réserve, une cloche qui monte avec chaque bassin gagné, une note grave pour un bassin perdu, un souffle discret avec la marée, un accord qui s'ouvre à la victoire et un accord grave qui s'éteint à la défaite. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Un delta nocturne vu du ciel : des courants ambrés remontent les canaux depuis le bas à gauche et viennent frapper des bassins roses en losange, en haut à droite ; au milieu, deux courants se croisent dans un canal et s'annulent en une gerbe d'étincelles.
