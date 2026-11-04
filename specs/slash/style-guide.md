# Charte graphique : Slash

## Direction artistique

Un petit théâtre de marionnettes, la nuit, vu des cintres. Le plancher de la scène est sombre, les piliers sont des décors peints, des rideaux pourpres encadrent l'arène. Les pantins sont en bois tourné et en tissu, suspendus à des fils clairs qui montent vers l'obscurité. Le héros est un ruban de lumière dorée, vif et précis, qui laisse une traînée à chaque trait. Le danger se lit au sol : des secteurs rouges hachurés qui se remplissent. Le ralenti refroidit toute la scène, comme si le temps retenait son souffle.

## Palette

Custom properties déclarées sur `.game-slash`. Contrastes mesurés sur `--slash-floor`. Les pantins et les zones d'attaque ont des luminosités proches (1,1:1 à 1,3:1 entre eux) : les zones d'attaque se distinguent par leurs hachures et leur contour, les pantins par leur silhouette (voir "Éléments de jeu").

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--slash-floor` | `#1C1519` | | Plancher de la scène, fond de l'aire de jeu. |
| `--slash-plank` | `#251C21` | | Lattes du plancher (décoratives). |
| `--slash-pillar` | `#806A76` | 3,6:1 | Piliers et bords de l'arène. |
| `--slash-curtain` | `#5A1E3A` | | Rideaux autour de l'arène (décoratifs). |
| `--slash-hero` | `#FFE9B0` | 15,0:1 | Héros, traînée, ligne de visée. |
| `--slash-string` | `#E8DCC8` | 13,2:1 | Fils des pantins, marques des vagues. |
| `--slash-puppet` | `#D49A66` | 7,4:1 | Pantins simples. |
| `--slash-shield` | `#9FB4C8` | 8,4:1 | Porteurs de bouclier et leur bouclier. |
| `--slash-thrower` | `#C38BE8` | 7,0:1 | Lanceurs. |
| `--slash-colossus` | `#E07A5F` | 6,1:1 | Colosses. |
| `--slash-danger` | `#FF4D5E` | 5,5:1 | Zones d'attaque en préparation, projectiles. |
| `--slash-gauge` | `#7FE0C2` | 11,4:1 | Jauge de ralenti. |

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Plancher | `--slash-floor`, lattes horizontales `--slash-plank`. |
| Pilier | Case pleine `--slash-pillar`, arête claire en haut, motif de décor peint discret. |
| Héros | Losange allongé `--slash-hero` qui pointe dans la dernière direction de trait, avec un halo. |
| Ligne de visée | Trait pointillé `--slash-hero` du héros au point d'arrivée, terminé par un petit cercle ; interrompu par une croix sur le premier bouclier qui arrêterait le trait. |
| Jauge de ralenti | Arc `--slash-gauge` de 3px autour du héros, visible pendant la visée et pendant sa recharge, qui se vide dans le sens horaire. |
| Pantin | Corps rond, tête ronde plus petite, couleur de son type ; un petit point `--slash-string` au-dessus de la tête et un fil court vers le haut de l'écran, qui suggère la suspension. |
| Porteur de bouclier | Corps de pantin et, du côté de son `facing`, un arc épais de 120° (`--slash-shield`, contour clair). |
| Lanceur | Corps de pantin avec un long bras du côté où il vise. |
| Colosse | Corps de pantin une fois et demie plus grand, deux fils ; un fil disparaît au premier trait. |
| Zone d'attaque en préparation | Secteur au contour épais `--slash-danger`, hachuré, qui se remplit de la base vers l'extérieur jusqu'à la frappe. |
| Tir en préparation | Ligne pointillée `--slash-danger` du lanceur jusqu'au premier obstacle. |
| Projectile | Petite balle `--slash-danger` cerclée de `--slash-string`. |
| Marque de vague | Croix `--slash-string` au sol, qui pulse jusqu'à l'arrivée du pantin. |
| Indicateur de départ | Texte (Chakra Petch 600 `sm`, `--color-text-muted`, token du site) sur une pastille `--slash-floor` (`--radius-sm`), sous le héros, gardée dans l'arène. |

## Animations

Des gestes de spectacle : le trait laisse un ruban de lumière, chaque fil coupé jette une étincelle et le pantin s'effondre comme une marionnette lâchée, les nouvelles vagues descendent au bout de leurs fils, les rideaux s'ouvrent à la victoire. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons de théâtre : un souffle grave pendant le ralenti, un sifflement à chaque trait, un pincement de corde pour chaque fil coupé (de plus en plus aigu dans un même trait), un choc métallique sur un bouclier, un grincement de bois quand un pantin prépare une attaque, trois coups de bâton à chaque nouvelle vague, un accord à la victoire et un accord grave à la défaite. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Le héros, ruban de lumière dorée, traverse en diagonale trois pantins dont les fils se rompent dans une gerbe d'étincelles ; un porteur de bouclier se retourne trop tard, et des rideaux pourpres encadrent la scène.
