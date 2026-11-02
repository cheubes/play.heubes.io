# Charte graphique : Leap

## Direction artistique

L'intérieur d'une horloge géante, dans la pénombre. Les salles sont faites de poutres de laiton patiné, de grands rouages tournent lentement à l'arrière-plan, et un petit automate crème, avec une clé de remontage dans le dos et un œil lumineux, y trotte sans s'arrêter. Le danger est rouge-orangé et franc, les mécanismes utiles (ressorts, leviers, portes) ont chacun leur couleur vive. L'ensemble évoque un jouet mécanique : précis, un peu attendrissant.

## Palette

Custom properties déclarées sur `.game-leap`. Contrastes mesurés sur `--leap-bg`. Les éléments posés sur un mur (piques, ressorts) sont cernés de `--leap-bg`, qui les détache du laiton.

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--leap-bg` | `#121A1F` | | Fond des salles, contour des éléments posés sur les murs. |
| `--leap-backdrop` | `#1A252C` | | Rouages du décor (décoratifs). |
| `--leap-wall` | `#B08A4E` | 5,5:1 | Murs. |
| `--leap-wall-edge` | `#E0B56A` | 9,2:1 | Arête supérieure des murs. |
| `--leap-spike` | `#FF6B4A` | 6,2:1 | Piques. |
| `--leap-platform` | `#C9D3DA` | 11,6:1 | Plateformes traversables et mobiles. |
| `--leap-spring` | `#5EE08A` | 10,5:1 | Ressorts. |
| `--leap-mechanism` | `#4FC3F7` | 8,8:1 | Leviers et portes. |
| `--leap-runner` | `#F4EBDD` | 14,9:1 | Automate. |
| `--leap-cog` | `#FFD24A` | 12,2:1 | Rouage à ramasser, œil de l'automate. |
| `--leap-exit` | `#B9A6FF` | 8,3:1 | Arche de sortie. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Mur | Case pleine `--leap-wall`, arête supérieure `--leap-wall-edge` quand la case au-dessus n'est pas un mur, rivets discrets. |
| Piques | Trois triangles `--leap-spike` cernés de `--leap-bg`, pointe vers le haut (sol) ou vers le bas (plafond), sur la moitié de la case. |
| Plateforme traversable | Lame fine (1/6 de case) `--leap-platform` sur le haut de la case, avec de petites encoches. |
| Plateforme mobile | Même lame, sur 1 à 3 cases, avec un petit rail en pointillés `--leap-platform` à 35 % d'opacité qui montre son trajet. |
| Ressort | Spirale `--leap-spring` sur le bas de la case, surmontée d'un plateau. |
| Levier | Manette `--leap-mechanism` sur un socle, inclinée à gauche ou à droite selon l'état des portes. |
| Porte fermée | Case de barreaux verticaux `--leap-mechanism`. |
| Porte ouverte | Contour en pointillés `--leap-mechanism`, sans barreaux. |
| Entrée | Petit socle en laiton au sol (décoratif). |
| Sortie | Arche `--leap-exit` qui occupe la case, avec une lueur intérieure. |
| Rouage | Roue dentée `--leap-cog` à huit dents, qui flotte légèrement. |
| Automate | Silhouette ronde `--leap-runner`, deux petites jambes, œil `--leap-cog` du côté où il court, clé de remontage dans le dos. |
| Indicateur de départ | Texte (Chakra Petch 600 `sm`, `--color-text-muted`, token du site) sous l'entrée, avec une petite flèche dans le sens de départ. |

## Animations

Un jouet mécanique : l'automate s'étire au saut et s'écrase à l'atterrissage, soulève un peu de poussière, se disloque en pièces à la chute et se remonte à l'entrée. Les grands rouages du fond tournent lentement. Les salles s'enchaînent par un glissement. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons de mécanique miniature : un bip qui monte au saut, des tics d'horlogerie à l'atterrissage et au demi-tour, un "boing" pour le ressort, un clac de levier, un carillon pour le rouage, un bruit de ferraille à la chute, deux notes à la sortie d'une salle et un accord à la fin du niveau. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

L'automate en plein saut au-dessus d'une rangée de piques, dans une salle de laiton, un rouage doré juste devant lui ; à l'arrière-plan, de grands rouages sombres et l'arche violette de la sortie.
