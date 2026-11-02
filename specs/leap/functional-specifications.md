# Spécification fonctionnelle : Leap

Titre : "Leap" en anglais, "Bond" en français.

## Concept

Un jeu de plateforme à un seul bouton (genre `platformer`). Un petit automate remonté traverse les salles d'une horloge géante. Il court tout seul et fait demi-tour dès qu'il touche un mur ; le seul geste du joueur est de le faire sauter. Chaque salle tient entière à l'écran, sans défilement, et forme une petite énigme de timing : savoir où et quand sauter, utiliser les murs pour changer de sens, monter sur une plateforme au bon passage. Une chute ne coûte qu'un retour au début de la salle.

## Objectif du joueur

Atteindre la sortie de chacune des deux salles du niveau. Il n'y a pas de défaite : une chute renvoie au début de la salle, sans limite. Objectif secondaire : ramasser le rouage caché dans chaque salle.

## Règles

Le temps de jeu avance par pas fixes de 1/60 s. Les valeurs numériques (vitesses, hauteurs de saut, boîtes de collision) sont fixées dans `game-model.md`.

1. Un niveau est une suite de deux salles. Une salle est une grille de 12 × 12 cases. Une case est vide, un mur, des piques (au sol ou au plafond), une plateforme traversable, un ressort, un levier, une porte, l'entrée, la sortie ou le rouage. Des plateformes mobiles s'y ajoutent.
2. En entrant dans une salle, ou en y réapparaissant, l'automate attend sur l'entrée, tourné dans le sens indiqué par la salle. Le premier appui le lance, sans le faire sauter.
3. Une fois lancé, l'automate court à vitesse constante. Quand il touche un mur de côté, au sol comme en l'air, il fait demi-tour sans s'arrêter.
4. Un appui le fait sauter, à hauteur fixe, s'il est au sol ou s'il vient de quitter le sol (tolérance de quelques pas). Un appui peu avant de toucher le sol est retenu et fait sauter à l'atterrissage. Tout autre appui en l'air est ignoré. La durée de l'appui ne compte pas.
5. L'automate tombe sous l'effet de la gravité, jusqu'à une vitesse de chute maximale. Il s'arrête de monter s'il se cogne à un plafond.
6. Une plateforme traversable ne porte l'automate que s'il arrive par le dessus en tombant ; il la traverse par le dessous et par les côtés.
7. Un ressort projette l'automate qui s'y pose, plus haut qu'un saut, sans appui.
8. Toucher un levier fait basculer toutes les portes de la salle (ouvertes et fermées s'échangent). Le levier ne rebascule qu'une fois l'automate reparti puis revenu. Une porte qui doit se fermer sur l'automate attend qu'il en soit sorti.
9. Une plateforme mobile fait l'aller-retour entre deux points à vitesse constante. Elle se comporte comme une plateforme traversable et emporte l'automate posé dessus.
10. Toucher des piques ou tomber par le bas de la salle est une chute : l'automate réapparaît à l'entrée de la salle, et la salle revient à son état initial (leviers, portes, plateformes mobiles, rouage de la salle). Les rouages des salles déjà franchies restent acquis.
11. Toucher le rouage le ramasse. Toucher la sortie termine la salle : l'automate passe à la salle suivante, ou le niveau est terminé.
12. Le temps du niveau ne compte que pendant que l'automate est lancé : l'attente sur l'entrée n'est pas comptée.
13. Recommencer ramène à la première salle du niveau, avec les rouages, les chutes et le temps remis à zéro.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Lancer l'automate, puis sauter | `Espace`, `Entrée` ou `↑` | Cliquer n'importe où dans l'aire de jeu | Toucher n'importe où dans l'aire de jeu |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Le saut part à l'appui (`keydown`, `pointerdown`), pas au relâcher. Une touche maintenue ne répète pas le saut.

## Progression

- 20 niveaux de deux salles, en quatre séries de cinq :
  - niveaux 1 à 5 : sauts, demi-tours contre les murs, piques ;
  - niveaux 6 à 10 : plateformes traversables et ressorts ;
  - niveaux 11 à 15 : leviers et portes ;
  - niveaux 16 à 20 : plateformes mobiles, combinaison de toutes les mécaniques.
- Le premier niveau d'une série qui introduit une mécanique la rend évidente : sa première salle se franchit sans chute en utilisant la mécanique une fois, sans précision particulière.
- Dans chaque salle, la sortie est atteignable sans le rouage ; le rouage demande un détour ou un saut plus risqué.
- Déverrouillage : le niveau 1 est disponible au départ ; chaque niveau terminé déverrouille le suivant.
- Statut `perfect` : le niveau a été terminé au moins une fois avec ses deux rouages.
- Record : le temps le plus court sur ce niveau, rouages ou non.

## Statistiques et résultats

- HUD : "Cogs" / "Rouages" (`1/2`) et "Time" / "Temps" (`m:ss.d`). Pas d'action de jeu.
- Panneau de fin de niveau : temps, rouages, chutes ("Falls" / "Chutes"), meilleur temps ("Best" / "Record").
- Message du résultat parfait : "Perfect! Both cogs collected." / "Parfait ! Les deux rouages sont à toi."
- Message sinon : "Finished in <time>. Can you find both cogs?" / "Terminé en <time>. Sauras-tu trouver les deux rouages ?"

## Écrans et états propres au jeu

- **Début de salle** : la salle apparaît, l'automate attend sur l'entrée, avec un discret indicateur d'appui ("Tap to start" / "Touche pour partir" au toucher, "Press Space" / "Appuie sur Espace" au clavier, selon la dernière entrée utilisée).
- **Saut, atterrissage, ressort** : l'automate s'étire au saut et s'écrase à l'atterrissage, avec un peu de poussière.
- **Levier** : il bascule, et les portes s'ouvrent ou se ferment.
- **Chute** : l'automate se disloque en quelques pièces, puis réapparaît à l'entrée après un court instant.
- **Rouage** : il est aspiré par l'automate avec un éclat.
- **Changement de salle** : la salle suivante glisse à la place de la précédente.
- **Fin de niveau** : l'automate passe la sortie, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : les salles sont carrées et mises à l'échelle pour tenir dans l'aire de jeu. Le bouton se touche n'importe où, donc la taille des cases n'a d'effet que sur la lisibilité.

## Accessibilité

- Un seul bouton, qui se touche n'importe où ; aucune précision de pointage.
- L'automate attend le premier appui au début de chaque salle et après chaque chute : le joueur lit la salle à son rythme.
- Les éléments se distinguent par la forme en plus de la couleur : piques en triangles, ressort en spirale, plateforme traversable en lame fine, levier en manette, porte fermée à barreaux et porte ouverte en pointillés, sortie en arche, rouage en roue dentée.
- Annonces : début de salle ("Room <n> of 2." / "Salle <n> sur 2."), rouage ("Cog collected." / "Rouage récupéré."), chute ("Fall. Back to the start of the room." / "Chute. Retour au début de la salle.").
- Limites connues : le jeu demande de voir la salle et de réagir en temps réel ; il n'y a pas de mode ralenti (voir "Hors périmètre").

## Textes

Accroche :
- EN : "A wind-up runner, one button: jump at the right time to cross the clockwork rooms."
- FR : "Un automate, un seul bouton : saute au bon moment pour traverser les salles de l'horloge."

How to play / Comment jouer :
- EN : "Your little automaton runs on its own and turns around when it hits a wall. Tap anywhere to make it jump. Reach the exit of each room, and grab the cog hidden in each one if you dare. Springs bounce you high, thin platforms can be jumped through from below, levers open and close doors. Hit spikes or fall, and you're back at the start of the room."
- FR : "Ton petit automate court tout seul et fait demi-tour quand il touche un mur. Touche n'importe où pour le faire sauter. Atteins la sortie de chaque salle, et attrape le rouage caché dans chacune si tu l'oses. Les ressorts te propulsent, les plateformes fines se traversent par le dessous, les leviers ouvrent et ferment les portes. Si tu touches des piques ou si tu tombes, tu repars du début de la salle."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Une fois lancé, l'automate avance à vitesse constante et fait demi-tour au contact latéral d'un mur, au sol comme en l'air, sans perdre de vitesse ; avant le premier appui, il ne bouge pas.
- **AC-02** [test] Un appui au sol, ou dans la tolérance après avoir quitté le sol, fait sauter à la hauteur et pendant la durée de `game-model.md` ; un appui retenu avant l'atterrissage fait sauter à l'atterrissage ; tout autre appui en l'air est ignoré.
- **AC-03** [test] La gravité s'applique jusqu'à la vitesse de chute maximale ; l'automate se pose sur un sol et s'arrête de monter contre un plafond.
- **AC-04** [test] Une plateforme traversable porte l'automate qui arrive par le dessus en tombant, et se laisse traverser par le dessous et par les côtés.
- **AC-05** [test] Un ressort projette l'automate qui s'y pose à la hauteur de `game-model.md`.
- **AC-06** [test] Toucher un levier fait basculer toutes les portes de la salle, une seule fois par contact ; une porte qui doit se fermer sur l'automate attend qu'il en soit sorti.
- **AC-07** [test] Une plateforme mobile suit son aller-retour et emporte l'automate posé dessus.
- **AC-08** [test] Toucher des piques ou sortir par le bas est une chute : l'automate réapparaît à l'entrée, arrêté, la salle et son rouage reviennent à leur état initial, les rouages des salles franchies restent acquis, et le compteur de chutes augmente de 1.
- **AC-09** [test] Toucher le rouage le ramasse ; toucher la sortie fait passer à la salle suivante ou termine le niveau ; le temps ne compte que les pas où l'automate est lancé.
- **AC-10** [test] Deux simulations d'une même salle avec la même suite d'appuis donnent exactement le même état à chaque pas.
- **AC-11** [test] Sans sauvegarde, le niveau 1 est `available` et les suivants `locked` ; terminer le niveau n rend le niveau n+1 `available` ; un niveau terminé une fois avec ses deux rouages est `perfect` ; le record est le temps le plus court.
- **AC-12** [test] Chaque salle du jeu est valide, et le solveur trouve une suite d'appuis qui atteint la sortie, et une autre qui ramasse le rouage puis atteint la sortie.
- **AC-13** [manuel] Toucher ou cliquer n'importe où dans l'aire de jeu, ou appuyer sur `Espace`, `Entrée` ou `↑`, lance puis fait sauter l'automate ; une touche maintenue ne répète pas le saut.
- **AC-14** [manuel] Un appui pendant la chute ou le changement de salle termine l'effet en cours, puis est traité (il lance l'automate).
- **AC-15** [manuel] En mouvement réduit, l'automate se déplace normalement, et les effets décoratifs (étirement, poussière, pièces de la chute, glissement entre salles, rotation du décor) sont supprimés.
- **AC-16** [manuel] En niveaux de gris, chaque type de case, l'état des portes, l'automate et le rouage restent lisibles.
- **AC-17** [manuel] Une salle tient entière dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 22 px, et le jeu reste fluide (60 images par seconde visées).
- **AC-18** [manuel] Le panneau de fin de niveau affiche temps, rouages, chutes et record, et la mise en valeur "perfect" avec les deux rouages.

## Hors périmètre

- Saut de hauteur variable, double saut, saut contre les murs, arrêt de l'automate.
- Ennemis, combats, salles qui défilent.
- Mode ralenti ou aide à la difficulté.
- Fantôme du meilleur passage, classements, éditeur de niveaux.
