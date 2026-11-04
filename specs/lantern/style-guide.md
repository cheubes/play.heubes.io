# Charte graphique : Lantern

## Direction artistique

Des cryptes de pierre, vues de dessus, dans un noir presque complet. Seule la lanterne découpe un cercle de lumière chaude et vacillante, où la pierre retrouve ses couleurs. Hors de la lumière, la salle n'est qu'un souvenir de contours violacés, et des paires d'yeux pâles y rôdent. Les braseros rallumés laissent derrière eux des îlots de lumière stables : à mesure qu'on avance, le donjon se rallume. L'ambiance est inquiétante sans être effrayante, et chaque flamme est un soulagement.

## Palette

Custom properties déclarées sur `.game-lantern`. Contrastes mesurés sur `--lantern-floor` (lumière) puis sur `--lantern-dark` (noir).

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--lantern-floor` | `#2E2A27` | | Sol de pierre éclairé. |
| `--lantern-dark` | `#0B0A0F` | | Voile de l'obscurité, fond de l'aire de jeu. |
| `--lantern-wall` | `#82786C` | 3,3:1 | Murs éclairés. |
| `--lantern-memory` | `#666173` | 3,3:1 sur `--lantern-dark` | Contours des cases dans le noir. |
| `--lantern-flame` | `#FFB347` | 8,0 / 11,1:1 | Flammes, lumière de la lanterne, braseros allumés. |
| `--lantern-brass` | `#E0B060` | 7,1 / 9,9:1 | Clés, serrures, mèche. |
| `--lantern-crate` | `#B07C45` | 3,9 / 5,5:1 | Caisses. |
| `--lantern-plate` | `#A4ADB8` | 6,3 / 8,7:1 | Plaques, sceaux des portes. |
| `--lantern-hero` | `#F2E6D0` | 11,5 / 16,0:1 | Explorateur. |
| `--lantern-eyes` | `#E8F0FF` | 12,4 / 17,2:1 | Yeux des ombres. |
| `--lantern-shard` | `#9FE7FF` | 10,4 / 14,4:1 | Éclats de lumière. |
| `--lantern-rune` | `#9B8CFF` | 5,1 / 7,1:1 | Runes des murs fantômes, visibles dans le noir. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Sol | Dalles `--lantern-floor` aux joints plus sombres ; dans le noir, seuls leurs contours `--lantern-memory` restent. |
| Mur | Bloc `--lantern-wall` à l'arête claire ; le bord de la salle sur un quart de case. |
| Mur fantôme | Comme un mur dans la lumière ; dans le noir, des runes `--lantern-rune` y brillent ; révélé, un passage de pierre effritée. |
| Brasero | Vasque de pierre ; éteint, cendres grises ; allumé, flamme `--lantern-flame`. Le grand brasero est deux fois plus large, sur un socle à marches. |
| Caisse | Carré `--lantern-crate` à planches, cerclé de fer. |
| Plaque | Dalle `--lantern-plate` ; pressée, enfoncée avec un contour intérieur. |
| Porte ouverte | Passage dans le bord. |
| Porte à serrure | Grille avec une petite serrure `--lantern-brass`. |
| Grande porte | Battants massifs avec une grande serrure `--lantern-brass` ornée. |
| Porte scellée | Grille avec un sceau rond `--lantern-plate` : une flamme gravée (braseros) ou un carré gravé (plaques). |
| Objets | Fiole (silhouette arrondie, reflet `--lantern-flame`), petite clé, grande clé (anneau orné), mèche (spirale `--lantern-brass`), éclat (losange `--lantern-shard` qui scintille). |
| Explorateur | Silhouette ronde capuchonnée `--lantern-hero`, lanterne tenue du côté où il regarde. |
| Ombre | Tache noire aux bords flous, deux yeux `--lantern-eyes` ; ombre dense : plus grande, bords hérissés, trois yeux. |
| Carte des salles | Petits carrés `--lantern-memory` pour les salles visitées, la salle courante en `--lantern-flame`, les portes connues en traits. |
| Case visée | Petit cercle `--lantern-hero` à 50 %. |

## Animations

La lumière vit : la flamme vacille, la lumière se resserre quand on voile la lanterne et s'ouvre en grand quand un brasero s'embrase. Les ombres glissent, et leurs yeux s'étirent quand elles chassent. Une capture referme le noir sur l'explorateur. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons de crypte : pas feutrés, souffle de la flamme, clapet de la lanterne, embrasement des braseros, tintement des clés et carillon des éclats, grincement des portes, raclement des caisses, murmure grave des ombres en chasse, souffle de la capture, et un accord chaud au grand brasero. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

L'explorateur au centre d'une crypte noire, sa lanterne découpant un cercle de lumière chaude sur les dalles ; au bord du cercle, trois paires d'yeux pâles reculent ; au fond, un brasero rallumé éclaire une grande porte à serrure dorée.
