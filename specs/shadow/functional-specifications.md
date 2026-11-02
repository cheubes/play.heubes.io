# Spécification fonctionnelle : Shadow

Titre : "Shadow" en anglais, "Ombre" en français.

## Concept

Un puzzle d'ombres portées (genre `puzzle`). Une lumière rasante éclaire une place vue du dessus, et chaque tour projette au sol une ombre aussi longue, en cases, qu'elle est haute. Le joueur règle la hauteur des tours pour que certaines cases soient à l'ombre et d'autres en plein soleil. Une même tour sert plusieurs cibles à la fois, et une ombre assez longue pour couvrir une cible peut en éteindre une autre : tout l'enjeu est de trouver la bonne longueur. Avec deux lumières, une case n'est vraiment à l'ombre que si les deux ombres la couvrent.

## Objectif du joueur

Satisfaire toutes les cibles en même temps, en un minimum de coups. Il n'y a pas de défaite.

## Règles

1. Le plateau est une grille rectangulaire de 5 × 5 à 8 × 8 cases. Une case est un sol, une tour, une cible d'ombre ou une cible de soleil. Les cibles sont des sols.
2. Chaque niveau a une ou deux lumières. Une lumière vient d'un côté du plateau (haut, bas, gauche ou droite) et éclaire tout le plateau. Deux lumières d'un même niveau viennent de côtés différents.
3. Une tour a une hauteur entière de 0 à 3. Une tour est réglable ou fixe (marquée comme telle). Une tour réglable de hauteur 0 est un socle vide ; une tour fixe a une hauteur de 1 à 3.
4. Pour chaque lumière, une tour de hauteur h projette une ombre sur les h cases qui la suivent dans le sens de la lumière (à l'opposé du côté d'où elle vient), dans la limite du plateau. Une tour de hauteur 0 ne projette pas d'ombre.
5. Les ombres passent par-dessus les tours et les cibles. Plusieurs ombres d'une même lumière qui couvrent une case la mettent à l'ombre de cette lumière, exactement comme une seule.
6. Une case de sol est au soleil si aucune lumière ne la met à l'ombre, à l'ombre si toutes les lumières l'y mettent, et dans la pénombre sinon (ce qui n'arrive qu'avec deux lumières).
7. Une cible d'ombre est satisfaite si sa case est à l'ombre. Une cible de soleil est satisfaite si sa case est au soleil. La pénombre ne satisfait aucune cible.
8. Toucher une tour réglable augmente sa hauteur de 1 ; une tour de hauteur 3 revient à 0. Chaque toucher compte un coup.
9. Toucher une tour fixe ou une case sans tour réglable est sans effet et ne compte pas.
10. Le niveau est résolu dès que toutes les cibles sont satisfaites. Chaque niveau a au moins une cible.
11. Annuler ramène l'état précédant le dernier coup et décrémente le compteur, jusqu'à l'état initial. Recommencer ramène l'état initial et remet le compteur à zéro.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Monter une tour | `Espace` ou `Entrée` sur la tour sélectionnée | Cliquer la tour | Toucher la tour |
| Sélectionner une tour | Flèches : sélection de la tour réglable la plus proche dans cette direction | Sans objet | Sans objet |
| Annuler le dernier coup | `Z` ou `Retour arrière` | Bouton "Undo" du HUD | Bouton "Undo" du HUD |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

## Progression

- 20 niveaux, en quatre séries de cinq :
  - niveaux 1 à 5 : une lumière, cibles d'ombre seulement ;
  - niveaux 6 à 10 : deux lumières, pénombre, cibles d'ombre seulement ;
  - niveaux 11 à 15 : cibles de soleil, qu'une ombre trop longue éteint, avec une ou deux lumières ;
  - niveaux 16 à 20 : tours fixes, combinaison de toutes les mécaniques.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente, avec une solution de deux coups au plus.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau terminé déverrouille le suivant.
- Par : nombre minimal de coups pour résoudre le niveau, calculé par le solveur (voir `game-model.md`). Le retour de 3 à 0 fait partie du calcul : faire passer une tour de 3 à 2 coûte trois coups.
- Statut `perfect` : le meilleur résultat du joueur sur ce niveau est égal au par.

## Statistiques et résultats

- HUD : "Moves" / "Coups" et "Par" / "Par". Action de jeu : "Undo" / "Annuler", désactivée quand il n'y a rien à annuler.
- Panneau de fin de niveau : coups joués, par, meilleur résultat ("Best" / "Record").
- Message du résultat parfait : "Perfect! Solved in the minimum number of moves." / "Parfait ! Résolu en un minimum de coups."
- Message sinon : "Solved in <n> moves. Can you do it in <par>?" / "Résolu en <n> coups. Sauras-tu le faire en <par> ?"

## Écrans et états propres au jeu

- **Début de niveau** : le plateau apparaît avec ses ombres déjà calculées pour l'état initial.
- **Tour qui monte** : un étage s'ajoute à la tour et son ombre s'allonge d'une case par lumière.
- **Tour qui revient à 0** : la tour s'enfonce jusqu'à son socle et son ombre disparaît.
- **Cible satisfaite ou non** : chaque changement d'état d'une cible est marqué visuellement et par un son.
- **Victoire** : la lumière se réchauffe sur tout le plateau, les cibles pulsent l'une après l'autre, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : le plateau est mis à l'échelle pour tenir dans l'aire de jeu.

## Accessibilité

- L'état de chaque case de sol se lit sans la couleur : clair au soleil, sombre à l'ombre, hachuré dans la pénombre (voir "Éléments de jeu" dans `style-guide.md`).
- Les deux types de cibles se distinguent par leur symbole (lune pour l'ombre, soleil pour le soleil), et leur état par le remplissage du symbole et un anneau (contour seul : non satisfaite ; plein avec anneau : satisfaite).
- La hauteur d'une tour se lit par le nombre de ses étages et par un chiffre sur l'étage du haut ; un socle vide indique la hauteur 0.
- Les tours réglables se distinguent des fixes par leur forme (socle rond contre pierre carrée à rivets).
- Chaque lumière est signalée hors du plateau, sur son côté, par un symbole de soleil et des chevrons qui indiquent le sens de la lumière.
- Annonces après chaque coup : "Move <n>. Height <h>. <k> of <total> targets met." / "Coup <n>. Hauteur <h>. <k> cibles sur <total> atteintes." Annonce aussi les annulations ("Undo. Move <n>." / "Annulé. Coup <n>.").
- Limite connue : la disposition du plateau et des ombres n'est pas décrite aux lecteurs d'écran. Le jeu est pleinement jouable au clavier, mais il suppose de voir le plateau.

## Textes

Accroche :
- EN : "Set each tower's height so its shadow falls exactly where it should."
- FR : "Règle la hauteur des tours pour que leurs ombres tombent au bon endroit."

How to play / Comment jouer :
- EN : "Light comes from the side marked with a sun. Each tower casts a shadow as many squares long as it is tall. Tap a tower to raise it by one level: after 3, it drops back to 0. Moon targets must be in shade, sun targets in full light. With two lights, a square is only in shade when both shadows cover it: half-shade satisfies no target. Meet every target to win."
- FR : "La lumière vient du côté marqué d'un soleil. Chaque tour projette une ombre aussi longue, en cases, qu'elle est haute. Touche une tour pour la monter d'un niveau : après 3, elle redescend à 0. Les cibles lune doivent être à l'ombre, les cibles soleil en pleine lumière. Avec deux lumières, une case n'est à l'ombre que si les deux ombres la couvrent : la pénombre ne satisfait aucune cible. Atteins toutes les cibles pour gagner."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Étant donné une lumière venant de chacun des quatre côtés, une tour de hauteur h met à l'ombre exactement les h cases qui la suivent dans le sens de la lumière, tronquées au bord du plateau ; une tour de hauteur 0 ne met aucune case à l'ombre.
- **AC-02** [test] Une ombre passe par-dessus une tour ou une cible et continue au-delà ; deux ombres d'une même lumière qui se recouvrent donnent le même résultat qu'une seule.
- **AC-03** [test] Avec deux lumières, une case est au soleil si aucune ne la met à l'ombre, dans la pénombre si une seule l'y met, à l'ombre si les deux l'y mettent.
- **AC-04** [test] Une cible d'ombre est satisfaite si et seulement si sa case est à l'ombre ; une cible de soleil si et seulement si sa case est au soleil ; une cible dans la pénombre n'est jamais satisfaite.
- **AC-05** [test] Toucher une tour réglable fait passer sa hauteur de h à (h + 1) modulo 4 et incrémente le compteur ; toucher une tour fixe ou une case sans tour réglable ne change ni l'état ni le compteur.
- **AC-06** [test] Le niveau est résolu si et seulement si toutes les cibles sont satisfaites.
- **AC-07** [test] Annuler restaure exactement l'état précédent et décrémente le compteur ; annuler en état initial est sans effet ; recommencer restaure l'état initial avec un compteur à zéro.
- **AC-08** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; terminer le niveau n rend le niveau n+1 `available` ; un niveau dont le record est égal au par est `perfect` ; le record est le plus petit nombre de coups.
- **AC-09** [test] Chaque niveau du jeu est valide, n'est pas résolu dans son état initial, est résoluble, et son par est égal au nombre minimal de coups trouvé par le solveur.
- **AC-10** [manuel] Toucher ou cliquer une tour réglable la monte d'un niveau ; au clavier, les flèches déplacent la sélection d'une tour réglable à l'autre et `Espace` ou `Entrée` monte la tour sélectionnée.
- **AC-11** [manuel] Une entrée reçue pendant une animation de tour termine immédiatement l'animation, puis est traitée.
- **AC-12** [manuel] En mouvement réduit, les changements de hauteur et d'ombre sont instantanés.
- **AC-13** [manuel] En niveaux de gris, l'état de chaque case (soleil, pénombre, ombre), le type et l'état de chaque cible, la hauteur de chaque tour et la distinction entre tours réglables et fixes restent lisibles.
- **AC-14** [manuel] Un plateau de 8 × 8 tient en entier dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec ses indicateurs de lumière et des cases d'au moins 32 px.
- **AC-15** [manuel] Le panneau de fin de niveau affiche coups, par et record, et la mise en valeur "perfect" quand le par est atteint.

## Hors périmètre

- Poser, retirer ou déplacer des tours : leurs emplacements sont fixés par le niveau.
- Baisser une tour d'un cran : la hauteur ne fait que monter, avec retour à 0 après 3.
- Hauteurs au-delà de 3, lumières à un autre angle (ombre de longueur différente de la hauteur), lumières qui changent pendant un niveau, plus de deux lumières.
- Chronomètre, indices, éditeur de niveaux.
