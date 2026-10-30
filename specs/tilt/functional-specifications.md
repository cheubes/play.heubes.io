# Spécification fonctionnelle : Tilt

## Concept

Un puzzle de glissement (genre `puzzle`). Le joueur incline un plateau dans l'une des quatre directions, et tous les blocs glissent ensemble jusqu'à rencontrer un obstacle. Le but est d'amener chaque bloc coloré sur une cible de sa couleur. Le jeu repose sur un mouvement collectif : on ne déplace jamais un bloc seul, il faut composer avec la trajectoire de tous les autres. Les cases collantes et les blocs neutres ajoutent des mécaniques au fil des niveaux.

## Objectif du joueur

Résoudre chaque niveau en plaçant tous les blocs colorés sur leurs cibles, idéalement dans le nombre minimal de coups. Il n'y a pas de défaite : une position bloquée se corrige en annulant ou en recommençant.

## Règles

1. Le plateau est une grille rectangulaire de 5 × 5 à 8 × 8 cases. Les bords du plateau se comportent comme des murs.
2. Une case est un sol, un mur, une cible (de l'une des quatre couleurs) ou une case collante. Les cibles et les cases collantes sont des sols.
3. Un bloc occupe une case qui n'est pas un mur, et une case porte au plus un bloc. Un bloc est soit coloré (l'une des quatre couleurs : ambre, azur, rose, menthe), soit neutre.
4. Incliner le plateau dans une direction fait glisser tous les blocs dans cette direction, simultanément. Chaque bloc avance case par case jusqu'à ce que la case suivante soit un mur, le bord du plateau, ou un bloc déjà immobilisé.
5. Les blocs les plus proches du côté vers lequel on incline s'immobilisent en premier : deux blocs alignés dans la direction de l'inclinaison finissent l'un contre l'autre.
6. Un bloc qui entre sur une case collante s'y arrête, même si la case suivante est libre. Un bloc qui commence une inclinaison sur une case collante la quitte normalement.
7. Les cibles n'arrêtent pas les blocs : un bloc traverse une cible, y compris de sa couleur, sans s'y arrêter.
8. Un coup est une inclinaison qui déplace au moins un bloc. Une inclinaison sans effet n'est pas comptée.
9. Le niveau est résolu quand, après un coup, chaque bloc coloré est sur une cible de sa couleur. Chaque niveau a exactement autant de cibles d'une couleur que de blocs de cette couleur. Les blocs neutres peuvent être n'importe où.
10. Annuler ramène à la position précédant le dernier coup et décrémente le compteur de coups. On peut annuler jusqu'à la position initiale du niveau.
11. Recommencer ramène à la position initiale et remet le compteur à zéro.

## Contrôles

| Action | Clavier | Tactile |
|---|---|---|
| Incliner le plateau | Flèches | Glisser le doigt sur l'aire de jeu dans la direction voulue |
| Annuler le dernier coup | `Z` ou `Retour arrière` | Bouton "Undo" du HUD |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) |

Avec une souris, un glisser sur l'aire de jeu incline le plateau, comme au doigt. Un geste trop court est ignoré (voir `technical-specifications.md`).

## Progression

- 20 niveaux, en quatre séries de cinq qui introduisent les mécaniques une à une :
  - niveaux 1 à 5 : un ou deux blocs d'une seule couleur, murs ;
  - niveaux 6 à 10 : plusieurs couleurs, puis blocs neutres ;
  - niveaux 11 à 15 : cases collantes ;
  - niveaux 16 à 20 : combinaison de toutes les mécaniques, jusqu'à quatre couleurs.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente, avec une solution courte (trois coups au plus).
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau terminé déverrouille le suivant.
- Chaque niveau a un "par" : le nombre minimal de coups pour le résoudre, calculé par le solveur (voir `game-model.md`).
- Statut `perfect` : le meilleur résultat du joueur sur ce niveau est égal au par.

## Statistiques et résultats

- HUD : "Moves" / "Coups" (coups joués) et "Par" / "Par" (par du niveau). Action de jeu : "Undo" / "Annuler", désactivée quand il n'y a rien à annuler.
- Panneau de fin de niveau : coups joués, par, meilleur résultat ("Best" / "Record").
- Message du résultat parfait : "Perfect! Solved in the minimum number of moves." / "Parfait ! Résolu en un minimum de coups."
- Message sinon : "Solved in <n> moves. Can you do it in <par>?" / "Résolu en <n> coups. Sauras-tu le faire en <par> ?"

## Écrans et états propres au jeu

- **Début de niveau** : le plateau apparaît directement dans sa position initiale, prêt à jouer.
- **Inclinaison sans effet** : le plateau esquisse l'inclinaison et revient, avec un son sourd, sans compter de coup.
- **Bloc arrivé sur sa cible** : quand un bloc s'immobilise sur une cible de sa couleur, il s'illumine et un son l'accompagne. Il s'éteint s'il en repart.
- **Victoire** : après le dernier mouvement, les blocs s'illuminent en séquence, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : le plateau est mis à l'échelle pour tenir dans l'aire de jeu.

## Accessibilité

- Chaque couleur de bloc porte un symbole distinct (cercle, triangle, carré, losange), repris en creux par les cibles de cette couleur. Le jeu se joue sans percevoir les couleurs.
- Les blocs neutres se distinguent des murs par leur forme (bloc arrondi hachuré, contre case pleine).
- Annonces après chaque coup : "Move <n>. <k> of <total> blocks on target." / "Coup <n>. <k> blocs sur <total> en place." Annonce aussi les inclinaisons sans effet ("No block moved." / "Aucun bloc n'a bougé.").
- Limite connue : la disposition du plateau n'est pas décrite case par case aux lecteurs d'écran. Le jeu est pleinement jouable au clavier, mais il suppose de voir le plateau.

## Textes

Accroche :
- EN : "Tilt the board and slide every block onto its target."
- FR : "Incline le plateau et fais glisser chaque bloc sur sa cible."

How to play / Comment jouer :
- EN : "Tilt the board to slide all the blocks at once. Blocks slide until they hit a wall or another block. Get every colored block onto a target of the same color and shape. Sticky tiles stop any block that slides onto them. Grey blocks have no target: use them as obstacles."
- FR : "Incline le plateau pour faire glisser tous les blocs à la fois. Ils glissent jusqu'à heurter un mur ou un autre bloc. Amène chaque bloc coloré sur une cible de même couleur et de même forme. Les cases collantes arrêtent tout bloc qui glisse dessus. Les blocs gris n'ont pas de cible : sers-t'en comme obstacles."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Étant donné un bloc seul sur une ligne libre, quand on incline vers la droite, alors il s'arrête sur la dernière case avant le mur ou le bord.
- **AC-02** [test] Étant donné deux blocs sur la même ligne, quand on incline vers la droite, alors ils finissent côte à côte contre l'obstacle, dans le même ordre qu'avant.
- **AC-03** [test] Étant donné un bloc dont la trajectoire traverse une case collante, quand on incline, alors il s'arrête sur la case collante.
- **AC-04** [test] Étant donné un bloc posé sur une case collante, quand on incline, alors il la quitte et glisse normalement.
- **AC-05** [test] Étant donné un bloc dont la trajectoire traverse une cible de sa couleur, quand on incline, alors il ne s'y arrête pas.
- **AC-06** [test] Étant donné une position où aucun bloc ne peut bouger dans une direction, quand on incline dans cette direction, alors l'état, le compteur et l'historique sont inchangés.
- **AC-07** [test] Le niveau est résolu si et seulement si chaque bloc coloré est sur une cible de sa couleur, quelle que soit la position des blocs neutres.
- **AC-08** [test] Annuler restaure exactement la position précédente et décrémente le compteur ; annuler en position initiale est sans effet.
- **AC-09** [test] Recommencer restaure la position initiale, un compteur à zéro et un historique vide.
- **AC-10** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; terminer le niveau n rend le niveau n+1 `available` ; un niveau dont le record est égal au par est `perfect`.
- **AC-11** [test] Le record d'un niveau est le plus petit nombre de coups avec lequel il a été résolu.
- **AC-12** [test] Chaque niveau du jeu est valide, n'est pas résolu dans sa position initiale, est résoluble, et son par est égal au nombre minimal de coups trouvé par le solveur.
- **AC-13** [manuel] Les flèches inclinent le plateau sur desktop ; un glisser du doigt l'incline sur mobile ; un geste trop court est ignoré.
- **AC-14** [manuel] Une entrée reçue pendant une animation termine immédiatement l'animation en cours, puis est traitée.
- **AC-15** [manuel] En mouvement réduit, les blocs se déplacent de façon quasi instantanée et le plateau ne s'incline pas visuellement.
- **AC-16** [manuel] En niveaux de gris, chaque couleur reste identifiable par son symbole, sur les blocs comme sur les cibles.
- **AC-17** [manuel] Un plateau de 8 × 8 tient en entier dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 32 px.
- **AC-18** [manuel] Le panneau de fin de niveau affiche coups, par et record, et la mise en valeur "perfect" quand le par est atteint.

## Hors périmètre

- Chronomètre et score basé sur le temps.
- Indices et solution affichable.
- Éditeur de niveaux, niveaux générés aléatoirement.
- Autres mécaniques (trous, glace, téléporteurs, blocs collés entre eux) : candidates pour une seconde série de niveaux.
