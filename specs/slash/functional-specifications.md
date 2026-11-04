# Spécification fonctionnelle : Slash

Titre : "Slash", en anglais comme en français.

## Concept

Un hack 'n' slash d'arène à un seul geste (genre `hack-and-slash`). Sur la scène d'un théâtre de marionnettes, la nuit, un petit ruban de lumière affronte des vagues de pantins animés. Le héros ne marche pas : son seul geste est de foncer en ligne droite, et il tranche les fils de tous les pantins qu'il traverse. Le même geste sert à attaquer et à esquiver. Dès que le joueur vise, le temps ralentit, le temps de choisir son trait. Les pantins à bouclier arrêtent un trait de face : il faut les prendre de flanc ou de dos, et enchaîner les traits pour ne jamais rester là où une attaque va tomber.

## Objectif du joueur

Couper les fils de tous les pantins de chaque vague, jusqu'à la dernière. Le joueur a trois cœurs ; s'il les perd tous, le niveau est perdu.

## Règles

Le temps de jeu avance par pas fixes de 1/60 s. Les valeurs numériques (vitesses, distances, durées) sont fixées dans `game-model.md`.

1. L'arène est une grille de 12 × 12 cases, vue de dessus. Une case est un sol ou un pilier. Les bords de l'arène et les piliers sont solides.
2. Le héros reste immobile entre deux traits. Un trait le fait foncer en ligne droite, dans une direction choisie par le joueur, sur une distance fixe ; il s'arrête plus tôt contre un pilier ou un bord. Pendant un trait, le héros est invulnérable. Après un trait, un court délai de récupération précède le suivant.
3. Viser ralentit le temps à 20 % de sa vitesse, tant que la jauge de ralenti n'est pas vide. La jauge se vide pendant le ralenti et se remplit quand le joueur ne vise pas. Jauge vide, la visée continue à vitesse normale.
4. Un trait coupe les fils de chaque pantin dont il traverse le corps : le pantin est vaincu, sauf un colosse, qui encaisse deux traits. Un trait coupe aussi les projectiles qu'il traverse.
5. Un pantin à bouclier tient son bouclier face au héros et le tourne vers lui à vitesse limitée. Un trait qui arrive sur l'avant du bouclier est arrêté net : les pantins traversés avant lui sont coupés, le héros rebondit en arrière et reste étourdi un instant, sans pouvoir foncer ni être invulnérable.
6. Les pantins marchent vers le héros en contournant les piliers. À portée, un pantin prépare une attaque : la zone qu'elle va frapper s'affiche, puis l'attaque frappe. Un lanceur ne bouge pas : il prépare et lance des projectiles en ligne droite, arrêtés par les piliers et les bords.
7. Une attaque ou un projectile qui atteint le héros hors d'un trait lui retire un cœur. Il est ensuite invulnérable un court instant.
8. Un niveau est une suite de vagues. Les emplacements des pantins d'une vague sont marqués au sol avant leur arrivée. La vague suivante arrive peu après la fin de la précédente.
9. Le niveau démarre au premier geste du joueur : avant, les marques de la première vague sont visibles et rien ne bouge.
10. Victoire : la dernière vague est vaincue. Défaite : le héros n'a plus de cœur.
11. Il n'y a pas d'annulation. Recommencer remet le niveau dans son état initial.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Viser (ralentit le temps) | Maintenir une flèche, ou deux pour une diagonale | Maintenir le bouton et glisser | Poser le doigt et glisser |
| Foncer | Relâcher les flèches : trait dans la dernière direction visée | Relâcher : trait dans la direction du glisser ; sans glisser, trait vers le point cliqué | Relâcher : trait dans la direction du glisser ; sans glisser, trait vers le point touché |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Le glisser peut commencer n'importe où dans l'aire de jeu : c'est son sens qui donne la direction, pas son point de départ. Au clavier, huit directions ; au pointeur, toutes les directions. Seuils dans `technical-specifications.md`.

## Progression

- 20 niveaux, en quatre séries de cinq :
  - niveaux 1 à 5 : pantins simples, traits qui en coupent plusieurs, piliers ;
  - niveaux 6 à 10 : pantins à bouclier ;
  - niveaux 11 à 15 : lanceurs et projectiles ;
  - niveaux 16 à 20 : colosses, combinaison de tous les pantins.
- Le premier niveau d'une série qui introduit un pantin le rend évident : sa première vague ne contient que ce pantin, en petit nombre.
- Un niveau compte de deux à cinq vagues.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau gagné déverrouille le suivant. Une défaite ne change rien à la progression.
- Statut `perfect` : le niveau a été gagné au moins une fois sans perdre de cœur.
- Record : le temps de victoire le plus court (temps de jeu, ralenti compris à sa vitesse ralentie).

## Statistiques et résultats

- HUD : "Hearts" / "Cœurs" (`3/3`) et "Wave" / "Vague" (`2/4`). Pas d'action de jeu.
- Panneau de victoire : temps, coups reçus ("Hits taken" / "Coups reçus"), meilleur temps ("Best" / "Record").
- Message du résultat parfait : "Flawless! You didn't take a single hit." / "Sans faute ! Tu n'as pris aucun coup."
- Message sinon : "Cleared in <time>. Can you do it without taking a hit?" / "Terminé en <time>. Sauras-tu le faire sans prendre un coup ?"
- Panneau d'échec (commun) : temps, vague atteinte ("Wave" / "Vague", `3/4`), message "The puppets got the better of you." / "Les marionnettes ont eu raison de toi."

## Écrans et états propres au jeu

- **Début de niveau** : l'arène et les marques de la première vague sont affichées, avec un discret indicateur ("Swipe to slash" / "Glisse pour trancher" au pointeur, "Hold an arrow" / "Maintiens une flèche" au clavier, selon la dernière entrée utilisée).
- **Visée** : le temps ralentit, les couleurs de la scène se refroidissent, une ligne montre le trajet du trait jusqu'à son point d'arrivée, et la jauge de ralenti s'affiche autour du héros.
- **Trait** : le héros file en laissant une traînée ; chaque fil coupé jette une étincelle et le pantin s'effondre.
- **Bouclier** : un trait arrêté fait jaillir des étincelles sur le bouclier ; le héros rebondit, étourdi.
- **Coup reçu** : le héros clignote pendant son invulnérabilité.
- **Nouvelle vague** : les marques apparaissent au sol, puis les pantins descendent au bout de leurs fils.
- **Victoire** : le rideau s'ouvre plus grand et la scène s'illumine, puis le panneau de fin de niveau s'ouvre.
- **Défaite** : la lumière du héros s'éteint, puis le panneau d'échec s'ouvre.

## Orientation

Les deux orientations sont prises en charge : l'arène est carrée et mise à l'échelle pour tenir dans l'aire de jeu.

## Accessibilité

- Le ralenti à la visée, et le démarrage au premier geste, laissent le temps de lire la scène et de viser.
- Les attaques s'annoncent par leur forme, pas seulement par leur couleur : la zone qui va être frappée est un secteur au contour épais, hachuré, qui se remplit jusqu'à la frappe ; un lanceur qui prépare un tir montre une ligne pointillée.
- Chaque type de pantin a sa silhouette (pantin rond, porteur de bouclier avec un arc épais du côté du bouclier, lanceur à long bras, colosse deux fois plus grand) ; un colosse touché perd un de ses deux fils, visible.
- La ligne de visée montre le point d'arrivée du trait et s'interrompt, avec une marque, sur le premier bouclier qui l'arrêterait.
- Annonces : nouvelle vague ("Wave <n> of <total>." / "Vague <n> sur <total>."), coup reçu ("Hit! <k> hearts left." / "Touché ! Il te reste <k> cœurs.").
- Limites connues : le jeu demande de voir l'arène et de réagir en temps réel ; la scène n'est pas décrite aux lecteurs d'écran ; il n'y a pas de réglage de difficulté (voir "Hors périmètre").

## Textes

Accroche :
- EN : "One gesture to dash and slash: cut the puppets' strings before they cut you down."
- FR : "Un seul geste pour foncer et trancher : coupe les fils des pantins avant qu'ils t'aient."

How to play / Comment jouer :
- EN : "Swipe to dash in a straight line: you cut the strings of every puppet in your path, and nothing can hit you mid-dash. Time slows down while you aim. Shield bearers block a dash from the front, so strike them from the side or from behind. Watch the floor: a filling zone shows where an attack is about to land. Clear every wave to win, and keep at least one of your three hearts."
- FR : "Glisse pour foncer en ligne droite : tu coupes les fils de chaque pantin sur ton chemin, et rien ne peut te toucher pendant le trait. Le temps ralentit pendant que tu vises. Les porteurs de bouclier arrêtent un trait de face : prends-les de flanc ou de dos. Surveille le sol : une zone qui se remplit montre où une attaque va tomber. Viens à bout de chaque vague pour gagner, en gardant au moins un de tes trois cœurs."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Un trait déplace le héros en ligne droite sur la distance de `game-model.md`, s'arrête contre un pilier ou un bord, et ne peut commencer qu'après le délai de récupération ; avant le premier geste, rien ne bouge.
- **AC-02** [test] La jauge de ralenti se vide pendant la visée et se remplit sans visée, aux cadences de `game-model.md` ; jauge vide, le ralenti s'arrête même si la visée continue.
- **AC-03** [test] Un trait coupe chaque pantin et chaque projectile dont il traverse le corps ; un colosse demande deux traits.
- **AC-04** [test] Un trait qui arrive sur l'avant d'un bouclier s'arrête au contact, coupe les pantins traversés avant lui, fait rebondir et étourdit le héros ; le même trait de flanc ou de dos coupe le porteur.
- **AC-05** [test] Le bouclier se tourne vers le héros sans dépasser sa vitesse de rotation.
- **AC-06** [test] Un pantin marche vers le héros par le plus court chemin entre les piliers, prépare son attaque à portée, et frappe la zone fixée au début de la préparation.
- **AC-07** [test] Un projectile part en ligne droite, s'arrête sur un pilier ou un bord, et retire un cœur au héros qu'il atteint hors d'un trait.
- **AC-08** [test] Une attaque qui atteint le héros hors d'un trait et hors de son invulnérabilité lui retire un cœur et le rend invulnérable pour la durée de `game-model.md` ; pendant un trait ou un étourdissement, l'invulnérabilité suit la règle 2 et la règle 5.
- **AC-09** [test] Les vagues s'enchaînent selon la règle 8 ; la victoire et la défaite sont détectées selon la règle 10.
- **AC-10** [test] Deux simulations d'un même niveau avec la même suite d'entrées donnent exactement le même état à chaque pas.
- **AC-11** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; gagner le niveau n rend le niveau n+1 `available` ; une défaite ne change rien ; un niveau gagné une fois sans perdre de cœur est `perfect` ; le record est le temps de victoire le plus court.
- **AC-12** [test] Chaque niveau du jeu est valide, est gagné par la stratégie de référence en moins de 3 minutes de jeu, et un héros qui ne fait aucun trait perd en moins d'une minute.
- **AC-13** [manuel] Au doigt et à la souris, un glisser vise et ralentit le temps, relâcher fonce dans sa direction, un toucher ou un clic sans glisser fonce vers le point visé ; au clavier, maintenir une ou deux flèches vise, les relâcher fonce.
- **AC-14** [manuel] La pause fige la simulation et la jauge ; une visée en cours est abandonnée, sans trait.
- **AC-15** [manuel] En mouvement réduit, la simulation et le ralenti sont inchangés, et les effets décoratifs (traînée, étincelles, effondrement, descente des pantins, tremblement de l'écran) sont supprimés ou remplacés par un changement immédiat.
- **AC-16** [manuel] En niveaux de gris, chaque type de pantin, l'orientation des boucliers, les zones d'attaque en préparation, les projectiles et la ligne de visée restent lisibles.
- **AC-17** [manuel] L'arène tient entière dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 22 px, et reste fluide (60 images par seconde visées).
- **AC-18** [manuel] Le panneau de victoire affiche temps, coups reçus et record, et la mise en valeur "perfect" sans coup reçu ; le panneau d'échec affiche ses statistiques et propose de réessayer.

## Hors périmètre

- Déplacement libre du héros, autres attaques, objets, améliorations.
- Longueur de trait réglable : un trait va toujours à sa distance fixe, ou jusqu'à un obstacle.
- Génération aléatoire des vagues, mode survie sans fin, score.
- Réglage de la difficulté ou de la vitesse du jeu.
- Plusieurs joueurs, boss scénarisés.
