# Spécification fonctionnelle : Delta

Titre : "Delta", en anglais comme en français.

## Concept

Un jeu de stratégie en temps réel minimaliste (genre `real-time-strategy`). Un delta, la nuit : des bassins reliés par des canaux fixes, et deux courants lumineux, le tien et celui d'un rival dirigé par l'ordinateur, qui se disputent les bassins. On ne commande pas d'armée : on oriente la sortie de chacun de ses bassins vers un bassin voisin, et sa lumière y coule en continu, unité par unité. Un bassin sans sortie garde sa lumière et se défend. La stratégie tient au réseau : relayer la lumière de l'arrière vers le front, couper un flux adverse par un contre-courant, choisir quand vider un bassin pour attaquer. Peu d'actions par minute, chacune décisive : le jeu se joue aussi bien au doigt qu'au clavier.

## Objectif du joueur

Prendre tous les bassins du rival et éteindre toute sa lumière en route. Le joueur perd si le rival en fait autant de son côté.

## Règles

Le temps de jeu avance par pas fixes de 100ms (les "pas"). Les valeurs numériques (cadences, capacités, vitesse) sont fixées dans `game-model.md`.

1. La carte est un ensemble de bassins reliés par des canaux. Un canal relie deux bassins voisins et se parcourt dans les deux sens.
2. Un bassin appartient au joueur, au rival, ou à personne (neutre). Il contient un nombre entier d'unités de lumière. Il est petit, moyen ou grand.
3. Un bassin du joueur ou du rival produit une unité à cadence fixe, selon sa taille, tant qu'il est sous sa capacité (qui dépend aussi de sa taille). Un bassin neutre ne produit rien.
4. Un bassin du joueur ou du rival a au plus une sortie : un de ses voisins. Tant qu'il a une sortie et au moins une unité, il émet une unité dans le canal vers ce voisin, à cadence fixe, quelle que soit sa taille. Sans sortie, il garde ses unités.
5. Une unité parcourt son canal à vitesse constante. Une fois émise, elle ne dépend plus de son bassin d'origine.
6. Deux unités de camps opposés qui se croisent dans un même canal, en sens inverses, s'annulent toutes les deux. Des unités qui vont dans le même sens ne s'affectent pas.
7. Une unité qui arrive dans un bassin de son camp s'ajoute à ses unités, même au-delà de la capacité. Une unité qui arrive dans un bassin d'un autre camp, ou neutre, lui retire une unité ; si le bassin n'en avait plus aucune, l'unité le prend : il passe à son camp avec une unité, et sans sortie.
8. Certains canaux sont soumis à la marée : ils sont alternativement ouverts et fermés, selon un cycle propre à chacun. Aucune unité n'entre dans un canal fermé ; celles qui s'y trouvent déjà poursuivent leur trajet.
9. Le joueur peut à tout moment donner à l'un de ses bassins une sortie vers un voisin, la changer, ou la retirer. Ces ordres sont gratuits et immédiats.
10. Le rival suit une stratégie fixe (décrite dans `game-model.md`), réévaluée à intervalle régulier, d'autant plus court que le niveau est avancé.
11. Victoire : le rival n'a plus aucun bassin ni aucune unité en route. Défaite : le joueur n'a plus aucun bassin ni aucune unité en route. Si les deux arrivent au même pas, c'est une défaite.
12. Il n'y a pas d'annulation. Recommencer remet le niveau dans son état initial.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Orienter la sortie d'un bassin | `Espace` ou `Entrée` sur un de tes bassins, flèches vers un voisin, puis `Espace` ou `Entrée` | Glisser d'un de tes bassins vers un voisin, ou cliquer l'un puis l'autre | Glisser d'un de tes bassins vers un voisin, ou toucher l'un puis l'autre |
| Retirer la sortie d'un bassin (le mettre en réserve) | `Espace` ou `Entrée` sur un de tes bassins, puis encore `Espace` ou `Entrée` | Cliquer deux fois le bassin | Toucher deux fois le bassin |
| Déplacer le curseur | Flèches : bassin le plus proche dans cette direction | Sans objet | Sans objet |
| Renoncer à un ordre en cours | `Retour arrière` | Relâcher hors d'un voisin, ou cliquer ailleurs | Relâcher hors d'un voisin, ou toucher ailleurs |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Un bassin choisi comme source reste sélectionné, avec ses canaux mis en évidence, jusqu'à ce que l'ordre soit donné ou abandonné. Seuils et zones de toucher dans `technical-specifications.md`.

## Progression

- 20 niveaux, en quatre séries de cinq :
  - niveaux 1 à 5 : sorties, prise de bassins neutres, relais de l'arrière vers le front ; rival lent ;
  - niveaux 6 à 10 : contre-courants, tailles de bassins (production et capacité) ; rival plus vif ;
  - niveaux 11 à 15 : canaux à marée ;
  - niveaux 16 à 20 : combinaison, cartes plus grandes (jusqu'à 14 bassins), rival rapide.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente : elle est indispensable pour gagner, et une partie qui l'emploie se gagne en moins de 90 secondes.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau gagné déverrouille le suivant. Une défaite ne change rien à la progression.
- Statut `perfect` : le niveau a été gagné au moins une fois sans perdre aucun bassin (un bassin du joueur pris par le rival). Un bassin neutre que le joueur n'a jamais possédé ne compte pas.
- Record : le temps de victoire le plus court.

## Statistiques et résultats

- HUD : "Time" / "Temps" (temps écoulé, `m:ss`) et "Basins" / "Bassins" (bassins du joueur sur le total, `4/9`). Pas d'action de jeu.
- Panneau de victoire (fin de niveau commune) : temps, bassins perdus ("Lost" / "Perdus"), meilleur temps ("Best" / "Record").
- Message du résultat parfait : "Flawless! You didn't lose a single basin." / "Sans faute ! Tu n'as perdu aucun bassin."
- Message sinon : "Won in <time>. Can you win without losing a basin?" / "Gagné en <time>. Sauras-tu gagner sans perdre un seul bassin ?"
- Panneau d'échec (commun, voir "Fin de niveau" dans `game-page.md`) : temps, plus grand nombre de bassins tenus ("Most held" / "Au plus fort"), message "The rival took your last basin." / "Le rival a pris ton dernier bassin."

## Écrans et états propres au jeu

- **Début de niveau** : la carte apparaît, simulation à l'arrêt, puis le temps démarre dès le premier ordre du joueur ou au bout de 3 secondes, au premier des deux. Le joueur a ainsi le temps de lire la carte.
- **Bassin sélectionné** : ses canaux et ses voisins sont mis en évidence ; un trait suit le doigt pendant un glisser.
- **Sortie** : une sortie du joueur est marquée par des chevrons le long du canal, dans le sens du courant ; les sorties du rival aussi, dans sa couleur.
- **Bassin pris** : il change de camp avec une onde, et un son différent selon qu'on le gagne ou qu'on le perd.
- **Marée** : un canal fermé est assombri et en pointillés, avec un arc qui montre le temps restant avant son ouverture ; un canal ouvert montre de même le temps avant sa fermeture.
- **Victoire** : tous les bassins pulsent l'un après l'autre, puis le panneau de fin de niveau s'ouvre.
- **Défaite** : la lumière du joueur s'éteint, puis le panneau d'échec s'ouvre.

## Orientation

Les deux orientations sont prises en charge. Les cartes sont conçues en paysage ; en portrait, la carte est tournée d'un quart de tour pour occuper l'écran (les chiffres et symboles restent droits). Les flèches du clavier suivent l'écran, pas la carte.

## Accessibilité

- Les camps se distinguent par la forme en plus de la couleur : bassins du joueur ronds et pleins, bassins du rival en losange plein, bassins neutres ronds et vides, au contour en pointillés. Les unités en route reprennent ces formes (points ronds pour le joueur, petits losanges pour le rival).
- Le nombre d'unités est écrit dans chaque bassin. La taille d'un bassin se lit à son diamètre et à un nombre d'anneaux (un, deux ou trois).
- Le sens d'une sortie est marqué par des chevrons, pas seulement par la couleur ; un canal fermé par la marée est en pointillés.
- Annonces : ordres ("Route set." / "Courant établi.", "Holding." / "En réserve."), prises ("You took a basin. <k> of <total>." / "Tu as pris un bassin. <k> sur <total>.", "The rival took one of your basins. <k> of <total>." / "Le rival t'a pris un bassin. <k> sur <total>.").
- La pause est disponible à tout moment et fige entièrement la simulation.
- Limites connues : le jeu demande de voir la carte et de réagir en temps réel ; la carte n'est pas décrite aux lecteurs d'écran ; il n'y a pas de réglage de vitesse (voir "Hors périmètre").

## Textes

Accroche :
- EN : "Steer glowing currents through the delta and flood every basin before your rival."
- FR : "Guide tes courants de lumière dans le delta et prends chaque bassin avant ton rival."

How to play / Comment jouer :
- EN : "Your basins fill with light. Drag from one of your basins to a neighbor: its light flows there, unit by unit, until you change its route. Tap a basin twice to hold its light instead. Light arriving at a rival or empty basin drains it, and takes it once it's empty. Currents meeting head-on in a channel cancel out, and some channels open and close with the tide. Take every rival basin to win."
- FR : "Tes bassins se remplissent de lumière. Fais glisser ton doigt de l'un d'eux vers un voisin : sa lumière y coule, unité par unité, jusqu'à ce que tu changes de route. Touche deux fois un bassin pour qu'il garde sa lumière. La lumière qui arrive dans un bassin rival ou neutre le vide, puis le prend quand il est vide. Deux courants qui se croisent dans un canal s'annulent, et certains canaux s'ouvrent et se ferment avec la marée. Prends tous les bassins du rival pour gagner."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Un bassin du joueur ou du rival produit une unité à chaque intervalle de sa taille tant qu'il est sous sa capacité, et plus au-delà ; un bassin neutre ne produit rien.
- **AC-02** [test] Un bassin avec une sortie et au moins une unité émet une unité à chaque intervalle d'émission ; sans sortie ou sans unité, il n'émet rien ; une unité met, pour parcourir un canal, le nombre de pas donné par sa longueur.
- **AC-03** [test] Deux unités de camps opposés en sens inverses dans un même canal s'annulent au pas où elles se croisent ; deux unités dans le même sens ne s'affectent pas.
- **AC-04** [test] Une unité qui arrive dans un bassin de son camp l'augmente de 1, même au-delà de la capacité ; dans un bassin d'un autre camp ou neutre, elle le diminue de 1, ou le prend s'il est à 0 (camp changé, une unité, pas de sortie).
- **AC-05** [test] Un canal à marée fermé n'accepte aucune nouvelle unité et laisse finir celles qui sont en route ; son état suit son cycle.
- **AC-06** [test] Donner, changer ou retirer la sortie d'un bassin du joueur vers un voisin modifie l'état ; un ordre sur un bassin qui n'est pas au joueur, ou vers un bassin qui n'est pas voisin, ne change rien.
- **AC-07** [test] La victoire et la défaite sont détectées selon la règle 11, y compris le cas simultané ; le compteur de bassins perdus ne compte que les bassins du joueur pris par le rival.
- **AC-08** [test] Le rival suit la stratégie de `game-model.md` : mise en réserve d'un bassin menacé et renfort, poursuite et choix des attaques, relais vers le front.
- **AC-09** [test] Deux simulations d'un même niveau avec la même suite d'ordres donnent exactement le même état à chaque pas.
- **AC-10** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; gagner le niveau n rend le niveau n+1 `available` ; une défaite ne change rien ; un niveau gagné une fois sans perte est `perfect` ; le record est le temps de victoire le plus court.
- **AC-11** [test] Chaque niveau du jeu est valide, est gagné par la stratégie de référence en moins de 5 minutes de jeu, et n'est pas gagné en 5 minutes par un joueur qui ne donne aucun ordre.
- **AC-12** [manuel] Glisser ou toucher deux bassins donne une sortie, toucher deux fois un bassin le met en réserve, relâcher hors d'un voisin renonce ; au clavier, les flèches déplacent le curseur, `Espace` ou `Entrée` sélectionne puis donne l'ordre, `Retour arrière` renonce.
- **AC-13** [manuel] La pause fige la simulation, le temps et les sons ; la reprise repart exactement du même état.
- **AC-14** [manuel] En mouvement réduit, les unités se déplacent normalement, et les effets décoratifs (traînées, ondes, défilement des chevrons) sont supprimés.
- **AC-15** [manuel] En niveaux de gris, le camp et la taille de chaque bassin, le sens des sorties et l'état des canaux à marée restent lisibles.
- **AC-16** [manuel] Une carte de 14 bassins tient dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des zones de toucher d'au moins 44 px par bassin, et reste fluide (60 images par seconde visées).
- **AC-17** [manuel] Le panneau de victoire affiche temps, bassins perdus et record, et la mise en valeur "perfect" sans perte ; le panneau d'échec affiche ses statistiques et propose de réessayer.

## Hors périmètre

- Plusieurs rivaux, rivaux qui s'affrontent entre eux, multijoueur.
- Construction de canaux ou de bassins, améliorations, types d'unités.
- Envoi d'une quantité donnée d'unités : une sortie coule en continu.
- Réglage de la vitesse du jeu ou de la difficulté du rival.
- Pause tactique (donner des ordres pendant la pause).
- Brouillard de guerre.
