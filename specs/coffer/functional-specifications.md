# Spécification fonctionnelle : Coffer

Titre : "Coffer" en anglais, "Coffret" en français.

## Concept

Un point & click d'objet (genre `point-and-click`). Chaque niveau est une boîte à secrets d'ébéniste, qu'on tourne entre ses mains face par face : tiroirs dérobés, panneaux coulissants, cadrans à code, boutons, leviers, serrures. Ce qu'on trouve sur une face sert sur une autre : une clé au fond d'un tiroir ouvre une serrure au dos, une inscription gravée sous le coffret donne le code d'un cadran. Le but est d'ouvrir le couvercle. Chaque coffret cache aussi une breloque dans un compartiment que rien n'oblige à trouver. Aucun réflexe n'est demandé : on observe, on essaie, on relie.

## Objectif du joueur

Ouvrir le couvercle du coffret. Objectif secondaire : trouver la breloque cachée. Il n'y a pas de défaite.

## Règles

1. Un coffret a six faces : avant, droite, arrière, gauche, dessus, dessous. Le joueur voit une face à la fois.
2. Depuis une face latérale (avant, droite, arrière, gauche), le joueur peut faire pivoter le coffret d'un quart de tour vers la face latérale voisine, à gauche ou à droite, ou vers le dessus ou le dessous. Depuis le dessus ou le dessous, il revient à la face latérale d'où il est venu. Le dessus et le dessous se lisent toujours dans le même sens, aligné sur la face avant.
3. Une face porte des mécanismes et des inscriptions. Les mécanismes sont :
   - **compartiment** (tiroir, panneau coulissant ou trappe) : fermé, il s'ouvre au toucher si sa condition est remplie, et reste ouvert. Un compartiment automatique s'ouvre de lui-même dès que sa condition est remplie. Ouvert, il montre son contenu : des objets et d'autres mécanismes ;
   - **cadran** : affiche une valeur parmi une suite de chiffres ou de symboles ; chaque toucher passe à la valeur suivante, en boucle ;
   - **bouton** : enfoncé ou sorti ; chaque toucher l'inverse ;
   - **levier** : à gauche ou à droite ; chaque toucher l'inverse ;
   - **logement** (serrure ou emplacement) : vide, il attend un objet précis ; une fois rempli, il le reste ;
   - **couvercle** : sur le dessus ; il s'ouvre au toucher si sa condition est remplie.
4. Une condition est une liste d'exigences toutes remplies en même temps : un cadran sur une valeur, un bouton enfoncé ou sorti, un levier d'un côté, un logement rempli, un compartiment ouvert.
5. Toucher un compartiment fermé ou le couvercle dont la condition n'est pas remplie est sans effet, sinon un tremblement et un son sourd.
6. Les inscriptions ne réagissent pas : ce sont des gravures (points, symboles, suites de chiffres) qui donnent des indications. Elles ne contiennent aucun mot, pour ne dépendre d'aucune langue.
7. Toucher un objet visible le ramasse dans l'inventaire. Toucher un objet de l'inventaire le sélectionne ; toucher ensuite un logement l'y place s'il est attendu (l'objet quitte l'inventaire), et ne fait rien sinon. Toucher à nouveau l'objet sélectionné le désélectionne. Tant qu'un objet est sélectionné, toucher un autre mécanisme le désélectionne et agit normalement.
8. La breloque est un objet à part, dans le compartiment secret du coffret : elle est trouvée dès que ce compartiment s'ouvre.
9. Le niveau est terminé quand le couvercle s'ouvre.
10. Indices : le bouton "Hint" / "Indice" du HUD guide vers la prochaine étape d'un plus court chemin vers le couvercle, en trois paliers de plus en plus précis : la face où agir, puis le mécanisme (mis en évidence), puis l'action (par exemple la valeur à afficher sur un cadran, ou l'objet à utiliser). Chaque appui passe au palier suivant ; le palier revient au premier dès que l'étape est faite. Les indices ne mènent jamais à la breloque.
11. Il n'y a pas d'annulation. Recommencer remet le coffret dans son état initial. Aucun état du coffret n'est une impasse (voir "Contraintes de validation" dans `game-model.md`).

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Faire pivoter le coffret | `Maj` + flèche, ou flèches jusqu'à une flèche de bord puis `Espace` ou `Entrée` | Cliquer une flèche au bord de la face, ou glisser sur la face | Glisser sur la face, ou toucher une flèche au bord |
| Agir sur un mécanisme, ramasser un objet | Flèches pour sélectionner, puis `Espace` ou `Entrée` | Cliquer | Toucher |
| Sélectionner ou désélectionner un objet de l'inventaire | Flèches jusqu'à l'objet, puis `Espace` ou `Entrée` ; `Retour arrière` désélectionne | Cliquer l'objet | Toucher l'objet |
| Demander un indice | `H` | Bouton "Hint" du HUD | Bouton "Hint" du HUD |
| Recommencer le niveau | `R` (commun) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Glisser vers la gauche montre la face de droite, comme si l'on tournait l'objet du doigt ; glisser vers le bas montre le dessus. Seuils dans `technical-specifications.md`.

## Progression

- 12 coffrets, en quatre séries de trois :
  - coffrets 1 à 3 : compartiments, boutons, serrures et clés ;
  - coffrets 4 à 6 : cadrans à code et inscriptions ;
  - coffrets 7 à 9 : mécanismes cachés dans des compartiments, dessus et dessous du coffret ;
  - coffrets 10 à 12 : leviers et compartiments automatiques, combinaison de tous les mécanismes.
- Un coffret se résout en 3 à 6 minutes pour un joueur qui le découvre. Le premier coffret d'une série rend son mécanisme évident : il n'en contient qu'un exemplaire, sur la face avant.
- Déverrouillage : le coffret 1 est disponible au départ ; chaque coffret ouvert déverrouille le suivant.
- Statut `perfect` : le coffret a été ouvert au moins une fois après avoir trouvé sa breloque.

## Statistiques et résultats

- HUD : pas de statistique. Action de jeu : "Hint" / "Indice".
- Panneau de fin de niveau : temps, indices demandés ("Hints" / "Indices"), breloque ("Charm" / "Breloque" : "Found" / "Trouvée" ou "Not found" / "Pas trouvée").
- Message du résultat parfait : "Perfect! You found the hidden charm." / "Parfait ! Tu as trouvé la breloque cachée."
- Message sinon : "Box opened. It's still hiding something..." / "Coffret ouvert. Il cache encore quelque chose..."

## Écrans et états propres au jeu

- **Disposition** : la face du coffret, en grand, avec une flèche à chacun de ses bords praticables ; l'inventaire (six places) sous la face en portrait, à sa droite en paysage.
- **Début de niveau** : la face avant apparaît, inventaire vide.
- **Rotation** : le coffret pivote d'un quart de tour en 3D vers la nouvelle face.
- **Mécanisme bloqué** : il tremble, avec un son sourd.
- **Compartiment qui s'ouvre** : le tiroir sort, le panneau glisse ou la trappe bascule, et son contenu apparaît.
- **Objet ramassé** : il file vers sa place dans l'inventaire.
- **Indice** : une bulle de texte au-dessus de la face, et, au deuxième palier, le mécanisme cerclé.
- **Breloque** : elle brille un instant dans son compartiment, puis rejoint un emplacement à part de l'inventaire.
- **Victoire** : le couvercle s'ouvre lentement sur un intérieur lumineux, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : la face est carrée et mise à l'échelle, l'inventaire change de place (voir "Disposition").

## Accessibilité

- Les mécanismes, les objets et les flèches de bord ont un nom accessible et un état, lus par les lecteurs d'écran (par exemple "Dial, showing 4" / "Cadran, sur 4", "Drawer, locked" / "Tiroir, bloqué"). Les inscriptions ont un nom accessible qui décrit leurs symboles ("Engraving: three dots, a star" / "Gravure : trois points, une étoile").
- L'état de chaque mécanisme se lit sans la couleur : position du levier, bouton en relief ou enfoncé, logement vide ou rempli, compartiment fermé ou ouvert. Les objets se distinguent par leur forme (les clés par la forme de leur anneau).
- Annonces : face affichée ("Front face." / "Face avant."), objet ramassé ("Picked up: <object>." / "Tu as pris : <objet>."), mécanisme bloqué ("It won't budge." / "Ça ne bouge pas."), texte de l'indice, ouverture du couvercle.
- Pas de temps limité ni de réflexe : le jeu est jouable entièrement au clavier, et vise à l'être avec un lecteur d'écran.
- Limite connue : la lecture complète au lecteur d'écran n'est vérifiée qu'avec VoiceOver (voir AC-15).

## Textes

Accroche :
- EN : "Turn the puzzle box in your hands and uncover every hidden drawer to open its lid."
- FR : "Tourne la boîte à secrets entre tes mains et déniche ses tiroirs cachés pour l'ouvrir."

How to play / Comment jouer :
- EN : "Swipe or use the arrows to turn the box and see its six sides. Tap a mechanism to work it: drawers, sliding panels, dials, buttons, levers. Things you find on one side are needed on another: tap an object to pick it up, then tap it in your inventory and tap where it goes. Engravings give you clues. Open the lid to finish, and look for the charm hidden in every box. Stuck? Ask for a hint."
- FR : "Glisse ou utilise les flèches pour tourner le coffret et voir ses six faces. Touche un mécanisme pour l'actionner : tiroirs, panneaux coulissants, cadrans, boutons, leviers. Ce que tu trouves sur une face sert sur une autre : touche un objet pour le ramasser, puis touche-le dans ton inventaire et touche l'endroit où il va. Les gravures te donnent des pistes. Ouvre le couvercle pour finir, et cherche la breloque cachée dans chaque coffret. Bloqué ? Demande un indice."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] Les rotations suivent la règle 2 : quatre quarts de tour dans un sens ramènent à la même face latérale ; le dessus et le dessous ramènent à la face latérale d'où l'on vient.
- **AC-02** [test] Un compartiment fermé s'ouvre au toucher si et seulement si sa condition est remplie, et reste ouvert ; un compartiment automatique s'ouvre au moment où sa condition devient remplie.
- **AC-03** [test] Un cadran passe à la valeur suivante en boucle ; un bouton et un levier s'inversent à chaque toucher.
- **AC-04** [test] Un logement accepte seulement l'objet attendu, qui quitte l'inventaire ; un autre objet ne change rien.
- **AC-05** [test] Un objet visible se ramasse ; un objet ou un mécanisme dans un compartiment fermé n'est ni visible ni actionnable.
- **AC-06** [test] Le niveau est terminé quand le couvercle s'ouvre ; la breloque est trouvée quand le compartiment secret s'ouvre.
- **AC-07** [test] L'indice désigne la prochaine étape d'un plus court chemin vers le couvercle, avec les trois paliers de la règle 10 ; le palier revient au premier quand l'étape est faite ; aucun indice ne désigne le compartiment secret ni un mécanisme qui ne sert qu'à lui.
- **AC-08** [test] Sans sauvegarde, le coffret 1 est `available` et les suivants `locked` ; ouvrir le coffret n rend le coffret n+1 `available` ; un coffret ouvert une fois avec sa breloque est `perfect`.
- **AC-09** [test] Chaque coffret du jeu est valide (voir "Contraintes de validation" dans `game-model.md`) : le couvercle et la breloque sont atteignables, aucun état atteignable n'est une impasse, et chaque mécanisme sert au couvercle ou à la breloque.
- **AC-10** [manuel] Toucher ou cliquer actionne les mécanismes et ramasse les objets ; glisser et les flèches de bord font pivoter le coffret ; au clavier, les flèches parcourent les mécanismes, les objets et les flèches de bord, `Espace` ou `Entrée` agit, `Maj` + flèche fait pivoter, `H` demande un indice.
- **AC-11** [manuel] Une entrée reçue pendant une rotation ou l'ouverture d'un compartiment termine l'animation, puis est traitée.
- **AC-12** [manuel] En mouvement réduit, les rotations sont remplacées par un fondu, et les compartiments, les objets et le couvercle changent d'état sans mouvement.
- **AC-13** [manuel] En niveaux de gris, l'état de chaque mécanisme, la valeur des cadrans, les objets et les inscriptions restent lisibles, sur chacun des bois.
- **AC-14** [manuel] Une face et l'inventaire tiennent ensemble dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des zones de toucher d'au moins 32 px pour les mécanismes et de 44 px pour les objets et les flèches de bord.
- **AC-15** [manuel] Avec VoiceOver, sur desktop et sur iPhone, le coffret 1 peut être ouvert en s'aidant des noms et des états annoncés.
- **AC-16** [manuel] Le panneau de fin de niveau affiche temps, indices et breloque, et la mise en valeur "perfect" quand la breloque a été trouvée.

## Hors périmètre

- Combinaison d'objets entre eux dans l'inventaire.
- Énigmes avec du texte, coffrets générés aléatoirement.
- Sauvegarde d'un coffret en cours : quitter le coffret perd sa progression, comme dans les autres jeux.
- Rotation libre en 3D, zoom sur un détail.
- Classement par temps ou par nombre d'indices.
