# Spécification fonctionnelle : Prism

Titre : "Prism" en anglais, "Prisme" en français.

## Concept

Un puzzle d'optique (genre `puzzle`). Des sources émettent des faisceaux de lumière colorée sur un plateau. Le joueur fait pivoter des miroirs et retourne des prismes pour guider les faisceaux vers des cibles, chacune attendant une couleur précise. La lumière obéit à une synthèse additive simplifiée : les prismes décomposent un faisceau en ses couleurs primaires, et une cible qui reçoit plusieurs faisceaux les additionne. Les faisceaux sont toujours allumés : chaque rotation redessine immédiatement leur trajet.

## Objectif du joueur

Allumer toutes les cibles en même temps, chacune avec exactement sa couleur, en un minimum de rotations. Il n'y a pas de défaite.

## Règles

1. Le plateau est une grille rectangulaire de 5 × 5 à 8 × 8 cases. Une case est vide ou porte un élément : mur, source, cible, miroir, prisme ou filtre.
2. Les couleurs sont des combinaisons de trois primaires (rouge, vert, bleu) : rouge, vert, bleu, jaune (rouge + vert), cyan (vert + bleu), magenta (rouge + bleu), blanc (rouge + vert + bleu).
3. Une source émet en permanence un faisceau de sa couleur, dans sa direction (haut, bas, gauche ou droite).
4. Un faisceau se propage en ligne droite, case par case. Il traverse les cases vides. Il est arrêté par un mur, une source ou le bord du plateau. Deux faisceaux qui se croisent ou se superposent n'interagissent pas.
5. Un miroir est une diagonale (`/` ou `\`), réfléchissante des deux côtés : il dévie le faisceau de 90°.
6. Un prisme décompose le faisceau qui le traverse en ses primaires : le vert continue tout droit, le rouge tourne d'un quart de tour d'un côté et le bleu de l'autre. Le sens du prisme (rouge à gauche ou rouge à droite, relativement à la direction du faisceau) est visible sur l'élément. Un faisceau d'une seule primaire traverse donc un prisme en ne changeant de direction que s'il est rouge ou bleu.
7. Un filtre ne laisse passer que les primaires de sa couleur. Si aucune ne passe, le faisceau est arrêté.
8. Une cible absorbe tous les faisceaux qui l'atteignent, de n'importe quel côté. La couleur reçue est l'union des primaires de ces faisceaux. La cible est allumée si la couleur reçue est exactement sa couleur : une primaire en trop ou en moins l'éteint.
9. Un faisceau qui repasse par une case dans la même direction et avec la même couleur s'arrête (aucune boucle infinie).
10. Les miroirs et les prismes sont orientables, sauf s'ils sont fixes (marqués comme tels). Toucher un élément orientable le fait basculer entre ses deux états : `/` et `\` pour un miroir, rouge à gauche et rouge à droite pour un prisme. Chaque bascule compte un coup.
11. Toucher un élément fixe ou une case sans élément orientable est sans effet et ne compte pas.
12. Le niveau est résolu dès que toutes les cibles sont allumées en même temps.
13. Annuler ramène l'état précédant le dernier coup et décrémente le compteur, jusqu'à l'état initial. Recommencer ramène l'état initial et remet le compteur à zéro.

## Contrôles

| Action | Clavier | Tactile |
|---|---|---|
| Faire basculer un élément | `Espace` ou `Entrée` sur l'élément sélectionné | Toucher l'élément |
| Sélectionner un élément | Flèches : sélection de l'élément orientable le plus proche dans cette direction | Sans objet |
| Annuler le dernier coup | `Z` ou `Retour arrière` | Bouton "Undo" du HUD |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) |

Avec une souris, un clic fait basculer l'élément, comme au doigt.

## Progression

- 20 niveaux, en quatre séries de cinq :
  - niveaux 1 à 5 : miroirs, une source, cibles d'une seule couleur ;
  - niveaux 6 à 10 : plusieurs sources, cibles qui demandent une couleur mélangée (jaune, cyan, magenta, blanc) ;
  - niveaux 11 à 15 : prismes, décomposition de faisceaux blancs ou mélangés ;
  - niveaux 16 à 20 : filtres et éléments fixes, combinaison de toutes les mécaniques.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente, avec une solution de deux coups au plus.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau terminé déverrouille le suivant.
- Par : nombre minimal de bascules pour résoudre le niveau, calculé par le solveur (voir `game-model.md`).
- Statut `perfect` : le meilleur résultat du joueur sur ce niveau est égal au par.

## Statistiques et résultats

- HUD : "Moves" / "Coups" et "Par" / "Par". Action de jeu : "Undo" / "Annuler", désactivée quand il n'y a rien à annuler.
- Panneau de fin de niveau : coups joués, par, meilleur résultat ("Best" / "Record").
- Message du résultat parfait : "Perfect! Solved in the minimum number of moves." / "Parfait ! Résolu en un minimum de coups."
- Message sinon : "Solved in <n> moves. Can you do it in <par>?" / "Résolu en <n> coups. Sauras-tu le faire en <par> ?"

## Écrans et états propres au jeu

- **Début de niveau** : le plateau apparaît avec ses faisceaux déjà calculés pour l'état initial.
- **Bascule** : l'élément pivote ou se retourne, puis les faisceaux sont redessinés.
- **Cible allumée ou éteinte** : chaque changement d'état d'une cible est marqué visuellement et par un son.
- **Victoire** : tous les faisceaux s'intensifient, les cibles pulsent, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : le plateau est mis à l'échelle pour tenir dans l'aire de jeu.

## Accessibilité

- Chaque cible, source et filtre affiche sa couleur sous forme de trois secteurs à position fixe (rouge en haut, vert en bas à droite, bleu en bas à gauche). Sur une cible, chaque secteur indique si la primaire est attendue et si elle est reçue, sans dépendre de la couleur (voir "Éléments de jeu" dans `style-guide.md`). L'état d'une cible se lit donc sans percevoir les couleurs.
- Les éléments orientables se distinguent des fixes par leur forme (socle pivotant contre rivets).
- Annonces après chaque coup : "Move <n>. <k> of <total> targets lit." / "Coup <n>. <k> cibles sur <total> allumées."
- Limite connue : le trajet des faisceaux n'est pas décrit aux lecteurs d'écran. Le jeu est pleinement jouable au clavier, mais il suppose de voir le plateau.

## Textes

Accroche :
- EN : "Turn mirrors and split light to color every target."
- FR : "Oriente les miroirs et décompose la lumière pour allumer chaque cible."

How to play / Comment jouer :
- EN : "Light beams travel in straight lines. Tap a mirror to turn it, tap a prism to flip it. Prisms split light into red, green and blue. Each target needs one exact color: beams reaching the same target add up, so yellow is red plus green, and white is all three. Filters only let their own colors through. Light up every target to win."
- FR : "Les faisceaux de lumière vont en ligne droite. Touche un miroir pour le faire pivoter, un prisme pour le retourner. Les prismes décomposent la lumière en rouge, vert et bleu. Chaque cible attend une couleur exacte : les faisceaux qui atteignent une même cible s'additionnent, le jaune est fait de rouge et de vert, le blanc des trois. Les filtres ne laissent passer que leurs couleurs. Allume toutes les cibles pour gagner."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Un faisceau traverse les cases vides en ligne droite et s'arrête sur un mur, une source ou le bord du plateau.
- **AC-02** [test] Un miroir `/` et un miroir `\` dévient un faisceau selon la table de réflexion de `game-model.md`, pour les quatre directions d'arrivée.
- **AC-03** [test] Étant donné un faisceau blanc qui traverse un prisme, alors il en sort trois faisceaux rouge, vert et bleu, dans les directions données par le sens du prisme ; un faisceau vert seul le traverse sans dévier ; un faisceau rouge seul est dévié du côté rouge.
- **AC-04** [test] Un filtre ne laisse passer que l'intersection de la couleur du faisceau et de la sienne, et arrête le faisceau si elle est vide.
- **AC-05** [test] La couleur reçue par une cible est l'union des primaires de tous les faisceaux qui l'atteignent ; la cible est allumée si et seulement si cette couleur est exactement la sienne.
- **AC-06** [test] Deux faisceaux qui se croisent continuent leur trajet sans modification.
- **AC-07** [test] Le calcul des faisceaux se termine, y compris quand le trajet revient à sa source.
- **AC-08** [test] Faire basculer un élément orientable change son état et incrémente le compteur ; toucher un élément fixe ou une case sans élément orientable ne change ni l'état ni le compteur.
- **AC-09** [test] Le niveau est résolu si et seulement si toutes les cibles sont allumées.
- **AC-10** [test] Annuler restaure exactement l'état précédent et décrémente le compteur ; annuler en état initial est sans effet ; recommencer restaure l'état initial avec un compteur à zéro.
- **AC-11** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; terminer le niveau n rend le niveau n+1 `available` ; un niveau dont le record est égal au par est `perfect` ; le record est le plus petit nombre de coups.
- **AC-12** [test] Chaque niveau du jeu est valide, n'est pas résolu dans son état initial, est résoluble, et son par est égal au nombre minimal de bascules trouvé par le solveur.
- **AC-13** [manuel] Toucher ou cliquer un élément orientable le fait basculer ; au clavier, les flèches déplacent la sélection d'un élément orientable à l'autre et `Espace` ou `Entrée` le fait basculer.
- **AC-14** [manuel] Une entrée reçue pendant une animation de bascule termine immédiatement l'animation, puis est traitée.
- **AC-15** [manuel] En mouvement réduit, les bascules sont instantanées et les faisceaux ne sont pas animés.
- **AC-16** [manuel] En niveaux de gris, l'état de chaque cible (primaires attendues, reçues, en trop) reste lisible.
- **AC-17** [manuel] Un plateau de 8 × 8 tient en entier dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 32 px.
- **AC-18** [manuel] Le panneau de fin de niveau affiche coups, par et record, et la mise en valeur "perfect" quand le par est atteint.

## Hors périmètre

- Déplacement des éléments (glisser un miroir d'une case à l'autre).
- Miroirs à quatre orientations ou angles à 45°.
- Chronomètre, indices, éditeur de niveaux.
- Interactions entre faisceaux (interférences, faisceaux qui s'arrêtent mutuellement).
