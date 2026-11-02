# Spécification fonctionnelle : Fold

Titre : "Fold" en anglais, "Pli" en français.

## Concept

Un puzzle de pliage (genre `puzzle`). Une feuille de papier quadrillée porte un motif de cases colorées. Le joueur la plie le long des lignes de la grille, et chaque rabat se retourne et vient se poser par-dessus le reste. La feuille est opaque : on ne voit que la couche du dessus. Le but est d'obtenir, sur la face visible, le motif d'une carte modèle. Tout se joue dans l'ordre des plis : le dernier rabat posé est celui qu'on voit, et le retournement inverse ce qu'il emporte.

## Objectif du joueur

Reproduire le motif de la carte modèle, en taille et en couleurs, en un minimum de plis. Il n'y a pas de défaite.

## Règles

1. La feuille de départ est une grille rectangulaire de 3 × 3 à 6 × 6 cases. Une case est du papier nu, du papier imprimé d'une encre (vermillon, indigo, ocre ou vert), ou une découpe (pas de papier).
2. Le papier est imprimé à l'identique sur ses deux faces : une case retournée garde sa couleur.
3. À tout moment, la feuille est un ensemble de piles posées sur une grille. Une pile est une suite de couches de papier, de bas en haut. La feuille occupe le plus petit rectangle qui contient toutes les piles non vides.
4. Un pli suit une ligne intérieure de ce rectangle, verticale ou horizontale, et rabat l'une des deux parties (la partie mobile) sur l'autre (la partie fixe). Chaque pile de la partie mobile est retournée, couche du dessus en dessous, et posée par-dessus la pile située à sa position symétrique par rapport à la ligne.
5. La partie mobile peut être plus grande que la partie fixe : elle déborde alors au-delà du bord de la partie fixe.
6. La face visible d'une position est la couleur de la couche du dessus de sa pile ; une position sans couche est vide. Une découpe n'est pas une couche : à travers elle, on voit la couche du dessous.
7. Une case peut être épinglée. Une pile qui contient une case épinglée ne bouge plus : un pli dont la partie mobile contient une telle pile est impossible. Un rabat peut se poser sur une pile épinglée, qui le fixe à son tour.
8. Chaque pli compte un coup. Un pli impossible est sans effet et ne compte pas.
9. Le niveau est résolu dès que la face visible de la feuille est identique au motif de la carte modèle : mêmes dimensions, et même contenu (encre, papier nu ou vide) à chaque position.
10. Annuler ramène l'état précédant le dernier pli et décrémente le compteur, jusqu'à l'état initial. Recommencer ramène la feuille dépliée et remet le compteur à zéro.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Plier | `Maj` + flèche : rabat la partie située à l'opposé de la flèche par-dessus la ligne sélectionnée, dans le sens de la flèche | Glisser sur la feuille dans le sens du pli, puis relâcher | Glisser le doigt sur la feuille dans le sens du pli, puis relâcher |
| Choisir la ligne de pli | Flèches : ligne voisine de même orientation ; une flèche de l'autre orientation passe à la ligne centrale de cette orientation | La ligne suit le geste (voir ci-dessous) | La ligne suit le geste (voir ci-dessous) |
| Renoncer à un pli en cours | Sans objet | Revenir au point de départ avant de relâcher | Revenir au point de départ avant de relâcher |
| Annuler le dernier pli | `Z` ou `Retour arrière` | Bouton "Undo" du HUD | Bouton "Undo" du HUD |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Le geste reproduit celui du papier : glisser vers la droite tire le bord gauche de la feuille vers la droite. La ligne de pli suit le milieu entre ce bord et sa position tirée, calée sur la ligne de la grille la plus proche, et un aperçu montre où le rabat va se poser. Le geste peut commencer n'importe où sur la feuille : seul le déplacement compte, pas le point de départ, ce qui évite les gestes de bord d'écran du système. Seuils et calcul dans `technical-specifications.md`.

## Progression

- 20 niveaux, en quatre séries de cinq :
  - niveaux 1 à 5 : un ou deux plis, deux encres au plus ;
  - niveaux 6 à 10 : ordre des plis, superpositions sur plusieurs couches, jusqu'à quatre encres ;
  - niveaux 11 à 15 : découpes, qui laissent voir les couches du dessous ;
  - niveaux 16 à 20 : épingles, combinaison de toutes les mécaniques.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente, avec une solution de deux plis au plus.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau terminé déverrouille le suivant.
- Par : nombre minimal de plis pour résoudre le niveau, calculé par le solveur (voir `game-model.md`), au plus 6.
- Statut `perfect` : le meilleur résultat du joueur sur ce niveau est égal au par.

## Statistiques et résultats

- HUD : "Moves" / "Coups" et "Par" / "Par". Action de jeu : "Undo" / "Annuler", désactivée quand il n'y a rien à annuler.
- Panneau de fin de niveau : coups joués, par, meilleur résultat ("Best" / "Record").
- Message du résultat parfait : "Perfect! Solved in the minimum number of moves." / "Parfait ! Résolu en un minimum de coups."
- Message sinon : "Solved in <n> moves. Can you do it in <par>?" / "Résolu en <n> coups. Sauras-tu le faire en <par> ?"

## Écrans et états propres au jeu

- **Disposition** : l'aire de jeu montre la feuille et, à côté, la carte modèle ("Goal" / "Modèle"), en réduction. La carte est au-dessus de la feuille en portrait, à sa gauche en paysage.
- **Début de niveau** : la feuille apparaît dépliée, centrée.
- **Pli en cours** : pendant le geste, la ligne de pli est mise en évidence et un aperçu translucide du rabat apparaît à sa position d'arrivée.
- **Pli** : au relâcher, le rabat tourne autour de la ligne et se pose sur la partie fixe ; la feuille glisse pour rester centrée.
- **Pli impossible** : les épingles qui bloquent le pli sont mises en évidence, avec un son sourd, sans compter de coup.
- **Victoire** : la feuille se presse brièvement et la carte modèle s'illumine, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : la carte modèle change de place (voir "Disposition"), et la feuille est mise à l'échelle pour tenir dans l'aire de jeu.

## Accessibilité

- Chaque encre porte, en plus de sa couleur, un motif propre (voir "Éléments de jeu" dans `style-guide.md`) : la face visible et la carte modèle se lisent sans percevoir les couleurs. Les motifs sont symétriques, pour qu'une case retournée se lise de la même façon.
- Le papier nu, l'encre et le vide se distinguent par leur luminosité et leur motif ; une découpe a un bord en pointillés.
- Les épingles se distinguent par leur forme (tête ronde cerclée).
- La ligne de pli sélectionnée est tracée d'un double trait, lisible sur le papier comme sur le fond.
- Annonces après chaque pli : "Move <n>. Sheet <w> by <h>." / "Coup <n>. Feuille de <w> sur <h>.", suivies, quand la feuille a les dimensions du modèle, de "<k> of <total> squares match." / "<k> cases sur <total> conformes." Annonce aussi les plis impossibles ("A pin holds this side." / "Une épingle retient ce côté.") et les annulations ("Undo. Move <n>." / "Annulé. Coup <n>.").
- Limite connue : le motif de la feuille et de la carte n'est pas décrit aux lecteurs d'écran. Le jeu est pleinement jouable au clavier, mais il suppose de voir le plateau.

## Textes

Accroche :
- EN : "Fold the sheet until its top layer matches the pattern."
- FR : "Plie la feuille jusqu'à ce que sa face visible reproduise le modèle."

How to play / Comment jouer :
- EN : "Drag across the sheet to fold it: the fold line follows halfway between the edge you pull and where it lands. The folded part flips over and lands on top, so the last fold is the one you see. Match the pattern on the card, same size and same colors. Cut-out squares let the layers below show through, and pinned squares hold their part in place."
- FR : "Fais glisser ton doigt sur la feuille pour la plier : la ligne de pli suit le milieu entre le bord que tu tires et l'endroit où il arrive. La partie pliée se retourne et se pose par-dessus, c'est donc le dernier pli qu'on voit. Reproduis le motif de la carte, même taille et mêmes couleurs. Les découpes laissent voir les couches du dessous, et les épingles retiennent leur partie de la feuille."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Étant donné un pli vertical ou horizontal, avec l'une ou l'autre partie mobile, alors chaque pile de la partie mobile se retrouve, dans l'ordre inverse de ses couches, par-dessus la pile de sa position symétrique par rapport à la ligne, et les piles de la partie fixe ne bougent pas.
- **AC-02** [test] Après un pli, la feuille est ramenée au plus petit rectangle qui contient ses piles non vides ; une partie mobile plus grande que la partie fixe déborde au-delà de son bord.
- **AC-03** [test] La face visible d'une position est la couleur de la couche du dessus ; une position sans couche est vide ; une découpe dans un rabat laisse voir la couche du dessous.
- **AC-04** [test] Un pli dont la partie mobile contient une pile épinglée, ou qui ne suit pas une ligne intérieure de la feuille, ne change ni l'état ni le compteur ; un rabat posé sur une pile épinglée ne bouge plus ensuite.
- **AC-05** [test] Un pli possible incrémente le compteur de 1.
- **AC-06** [test] Le niveau est résolu si et seulement si la face visible a les dimensions du modèle et le même contenu à chaque position.
- **AC-07** [test] Annuler restaure exactement l'état précédent et décrémente le compteur ; annuler en état initial est sans effet ; recommencer restaure la feuille dépliée avec un compteur à zéro.
- **AC-08** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; terminer le niveau n rend le niveau n+1 `available` ; un niveau dont le record est égal au par est `perfect` ; le record est le plus petit nombre de coups.
- **AC-09** [test] Chaque niveau du jeu est valide, n'est pas résolu dans son état initial, est résoluble, et son par est égal au nombre minimal de plis trouvé par le solveur.
- **AC-10** [manuel] À la souris comme au doigt, la ligne de pli suit la moitié du déplacement, l'aperçu montre la position d'arrivée du rabat, relâcher plie, et revenir au point de départ avant de relâcher renonce au pli ; au clavier, les flèches déplacent la ligne et `Maj` + flèche plie.
- **AC-11** [manuel] Une entrée reçue pendant une animation de pli termine immédiatement l'animation, puis est traitée.
- **AC-12** [manuel] En mouvement réduit, les plis et les annulations sont instantanés.
- **AC-13** [manuel] En niveaux de gris, chaque encre, le papier nu, le vide, les épingles et la ligne de pli restent lisibles, sur la feuille comme sur la carte modèle.
- **AC-14** [manuel] Une feuille de 6 × 6 et sa carte modèle tiennent ensemble dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 40 px sur la feuille.
- **AC-15** [manuel] Le panneau de fin de niveau affiche coups, par et record, et la mise en valeur "perfect" quand le par est atteint.

## Hors périmètre

- Plis en diagonale ou hors des lignes de la grille.
- Rabat glissé sous la partie fixe (pli "vallée" ou "montagne") : un rabat se pose toujours par-dessus.
- Faces différentes au recto et au verso, retournement de toute la feuille.
- Déplier un pli autrement qu'en annulant.
- Chronomètre, indices, éditeur de niveaux.
