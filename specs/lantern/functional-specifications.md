# Spécification fonctionnelle : Lantern

Titre : "Lantern" en anglais, "Lanterne" en français.

## Concept

Une action-aventure en donjons (genre `action-adventure`). Un petit explorateur descend dans des cryptes plongées dans le noir, une lanterne à la main. Des ombres errent dans les salles : elles fuient la lumière, mais se jettent sur lui dès qu'il fait noir. La lanterne brûle de l'huile, qui s'épuise ; les braseros qu'il rallume font reculer les ombres pour de bon et remplissent sa lanterne. Voiler la lanterne économise l'huile et révèle des passages qu'on ne voit que dans le noir, au prix d'attirer les ombres. Chaque donjon se parcourt salle par salle : clés et portes, caisses à pousser sur des plaques, mèche plus longue pour faire reculer les ombres denses, jusqu'au grand brasero de la dernière salle.

## Objectif du joueur

Rallumer le grand brasero au bout du donjon. Objectif secondaire : trouver les trois éclats de lumière cachés dans chaque donjon. Il n'y a pas de défaite : une ombre qui attrape l'explorateur le renvoie à l'entrée de la salle.

## Règles

Le temps de jeu avance par pas fixes de 1/60 s. Les valeurs numériques (vitesses, rayons, huile) sont fixées dans `game-model.md`.

1. Un donjon est un ensemble de salles disposées sur une carte et reliées par des portes. Une salle est une grille de 8 × 8 cases entourée d'un mur percé de portes. Une case est un sol, un mur, un mur fantôme, un brasero, une caisse, une plaque, ou porte un objet.
2. L'explorateur se déplace d'une case à la fois, à vitesse constante, dans les quatre directions. Il ne traverse ni les murs, ni les braseros, ni les murs fantômes non révélés, ni les ombres denses.
3. Pousser une caisse : marcher vers une caisse la déplace d'une case dans le même sens si la case suivante est un sol libre ; sinon l'explorateur ne bouge pas.
4. Lumière : une case est éclairée si elle est à portée d'une source de lumière (la lanterne allumée, un brasero allumé) et en vue de cette source (les murs, murs fantômes et caisses arrêtent la lumière). La lanterne à mèche longue est une source forte, plus large ; les autres sources sont normales.
5. Lanterne : allumée, elle consomme de l'huile à cadence fixe ; voilée, elle ne consomme rien et n'éclaire pas. Le joueur peut la voiler ou la rallumer à tout moment, tant qu'il reste de l'huile. Sans huile, elle s'éteint.
6. Ombres : une ombre ne peut pas se trouver sur une case éclairée. Elle patrouille selon un trajet fixe ; quand l'explorateur est proche, elle le chasse par les cases sombres. Si sa case devient éclairée, elle fuit vers une case sombre voisine. Une ombre dense ne recule que devant une source forte ; elle bloque sa case.
7. Une ombre qui atteint la case de l'explorateur l'attrape : il revient à l'entrée de la salle, et le donjon revient à l'état où il était quand il y est entré.
8. Braseros : marcher contre un brasero éteint, lanterne allumée, l'allume pour de bon et remplit la lanterne. Le grand brasero de la dernière salle termine le donjon quand il est allumé.
9. Objets, ramassés en marchant dessus : fiole d'huile (remplit en partie la lanterne), petite clé, grande clé, mèche longue (la lanterne devient une source forte), éclat de lumière.
10. Portes : une porte ouverte se franchit ; une porte à serrure s'ouvre au contact avec une petite clé, qui est consommée, et reste ouverte ; la porte du grand brasero s'ouvre avec la grande clé ; une porte scellée s'ouvre quand tous les braseros de sa salle sont allumés, ou tant que toutes les plaques de sa salle sont pressées (par une caisse ou par l'explorateur).
11. Murs fantômes : ils ressemblent à des murs. Un mur fantôme proche de l'explorateur pendant que la lanterne est voilée se révèle pour de bon et devient franchissable.
12. Point de reprise : en entrant dans une salle, l'état du donjon est enregistré. Il sert quand une ombre attrape l'explorateur, quand le joueur demande à revenir à l'entrée de la salle (par exemple après avoir coincé une caisse), et quand il reprend le donjon plus tard (voir "Progression").
13. Recommencer reprend le donjon depuis le début, après confirmation, et efface sa partie en cours.

## Contrôles

| Action | Clavier | Souris | Tactile |
|---|---|---|---|
| Aller à une case | Sans objet | Cliquer la case : l'explorateur y va par le plus court chemin | Toucher la case : l'explorateur y va par le plus court chemin |
| Avancer dans une direction | Maintenir une flèche | Maintenir le bouton et glisser dans la direction | Poser le doigt et glisser dans la direction, puis le maintenir |
| Voiler ou rallumer la lanterne | `Espace` | Bouton "Lantern" du HUD | Bouton "Lantern" du HUD |
| Revenir à l'entrée de la salle | `Retour arrière` | Bouton "Room" du HUD | Bouton "Room" du HUD |
| Recommencer le donjon | `R` (commun, avec confirmation) | Bouton "Restart" du HUD (commun) | Bouton "Restart" du HUD (commun) |
| Pause | `Échap` ou `P` (commun) | Bouton pause du HUD (commun) | Bouton pause du HUD (commun) |

Pousser une caisse, ouvrir une porte, allumer un brasero ou ramasser un objet se fait en marchant dessus ou contre. Un nouvel ordre de déplacement remplace le précédent. Seuils dans `technical-specifications.md`.

## Progression

- 6 donjons, de 6 à 10 salles, de 8 à 15 minutes chacun. Chaque donjon introduit une mécanique :
  - donjon 1 : lumière, ombres, huile, braseros ;
  - donjon 2 : petites clés, portes à serrure, grande clé ;
  - donjon 3 : caisses, plaques, portes scellées ;
  - donjon 4 : lanterne voilée et murs fantômes ;
  - donjon 5 : mèche longue et ombres denses ;
  - donjon 6 : combinaison de toutes les mécaniques.
- La première salle où apparaît une mécanique la rend évidente, sans ombre ni contrainte d'huile.
- Déverrouillage : le donjon 1 est disponible au départ ; chaque donjon terminé déverrouille le suivant.
- Reprise : un donjon commencé et quitté (sélecteur, rechargement, fermeture de la page) est gardé en cours ; le rouvrir reprend à l'entrée de la dernière salle atteinte, dans l'état où elle était à l'entrée (voir "Reprise d'un niveau" dans `game-page.md`). Chaque donjon a au plus une partie en cours.
- Statut `perfect` : le donjon a été terminé au moins une fois avec ses trois éclats.

## Statistiques et résultats

- HUD : "Oil" / "Huile" (de 0 à 100) et "Shards" / "Éclats" (`1/3`). Actions de jeu : "Lantern" / "Lanterne" et "Room" / "Salle" (revenir à l'entrée de la salle).
- Panneau de fin de niveau : temps, éclats, fois où l'explorateur a été attrapé ("Caught" / "Captures").
- Message du résultat parfait : "Perfect! All three shards are yours." / "Parfait ! Les trois éclats sont à toi."
- Message sinon : "The great brazier burns again. <n> shards are still hidden in the dark." / "Le grand brasero brûle de nouveau. Il reste <n> éclats cachés dans le noir." (n vaut 1 ou 2 ; "1 shard is still hidden" / "Il reste 1 éclat caché" au singulier, sous une clé distincte.)

## Écrans et états propres au jeu

- **Disposition** : la salle en grand ; à côté (dessous en portrait, à droite en paysage), la carte des salles visitées, les clés en main et la mèche si elle est acquise.
- **Début de donjon** : l'explorateur entre dans la première salle, lanterne allumée et pleine.
- **Noir** : les cases sombres sont presque noires, avec le dessin de la salle à peine visible ; les ombres y sont signalées par leurs yeux.
- **Lanterne voilée** : la lumière se resserre et disparaît ; les murs fantômes proches laissent voir leurs runes.
- **Ombre qui chasse** : ses yeux s'allongent vers l'explorateur.
- **Capture** : l'écran se voile de noir, puis l'explorateur réapparaît à l'entrée de la salle.
- **Brasero allumé** : la flamme jaillit et la lumière s'étend ; la jauge d'huile se remplit.
- **Changement de salle** : la salle suivante glisse à la place de la précédente ; la carte se met à jour.
- **Victoire** : le grand brasero s'embrase et la lumière envahit la salle, puis le panneau de fin de niveau s'ouvre.

## Orientation

Les deux orientations sont prises en charge : la salle est carrée et mise à l'échelle, la carte et les objets changent de place (voir "Disposition").

## Accessibilité

- Les éléments se distinguent par la forme en plus de la couleur et de la lumière : brasero éteint ou allumé (flamme), portes par leur serrure (petite, grande, sceau), caisse, plaque enfoncée ou non, objets par leur silhouette, ombres par leurs yeux, ombres denses plus grandes et hérissées.
- Le dessin des cases sombres reste visible (à faible luminosité) : le joueur peut toujours lire la salle pour choisir où aller.
- L'huile est affichée en chiffres dans le HUD, et la jauge de la lanterne clignote sous 20.
- Annonces : entrée dans une salle ("Room <n> of <total>." / "Salle <n> sur <total>."), objet ramassé ("Found: <object>." / "Trouvé : <objet>."), huile basse ("Oil running low." / "L'huile s'épuise."), capture ("Caught! Back to the room entrance." / "Attrapé ! Retour à l'entrée de la salle.").
- Limites connues : le jeu demande de voir la salle et de réagir en temps réel ; la salle n'est pas décrite aux lecteurs d'écran ; il n'y a pas de réglage de difficulté.

## Textes

Accroche :
- EN : "Carry your lantern through the dark crypts, where shadows flee the light."
- FR : "Porte ta lanterne au fond des cryptes, là où les ombres fuient la lumière."

How to play / Comment jouer :
- EN : "Tap where you want to go, or hold a direction. Shadows can't stand the light, but your lantern burns oil: relight the braziers to refill it and push the shadows back for good. Veil your lantern to save oil and to reveal hidden passages, but then the shadows will come for you. Find keys, push crates onto plates, and relight the great brazier at the end of each crypt. Three light shards are hidden in every crypt."
- FR : "Touche l'endroit où tu veux aller, ou maintiens une direction. Les ombres ne supportent pas la lumière, mais ta lanterne brûle de l'huile : rallume les braseros pour la remplir et repousser les ombres pour de bon. Voile ta lanterne pour économiser l'huile et révéler des passages cachés, mais les ombres viendront te chercher. Trouve les clés, pousse les caisses sur les plaques, et rallume le grand brasero au bout de chaque crypte. Trois éclats de lumière sont cachés dans chacune."

Controls / Contrôles : le tableau de la section "Contrôles", traduit.

## Critères d'acceptation

- **AC-01** [test] L'explorateur avance d'une case à la vitesse de `game-model.md` et ne traverse ni mur, ni brasero, ni mur fantôme non révélé, ni ombre dense ; pousser une caisse suit la règle 3.
- **AC-02** [test] Une case est éclairée si et seulement si elle est à portée d'une source allumée et en vue de cette source, selon `game-model.md` ; une source forte éclaire plus loin.
- **AC-03** [test] La lanterne allumée consomme l'huile à la cadence de `game-model.md`, voilée elle ne consomme rien ; sans huile, elle s'éteint et ne peut plus être rallumée ; fioles et braseros la remplissent selon les règles 8 et 9.
- **AC-04** [test] Une ombre n'occupe jamais une case éclairée, patrouille, chasse l'explorateur proche par les cases sombres, et fuit une case qui devient éclairée ; une ombre dense ne recule que devant une source forte.
- **AC-05** [test] Une ombre qui atteint l'explorateur l'attrape : l'état revient au point de reprise de la salle et le compteur de captures augmente de 1 ; revenir à l'entrée de la salle restaure le même état sans augmenter le compteur.
- **AC-06** [test] Les portes suivent la règle 10 : clés consommées, porte du grand brasero, portes scellées par les braseros ou par les plaques.
- **AC-07** [test] Un mur fantôme proche de l'explorateur, lanterne voilée, se révèle et devient franchissable, pour le reste du donjon.
- **AC-08** [test] Le point de reprise est enregistré à l'entrée de chaque salle ; reprendre un donjon restaure exactement cet état ; allumer le grand brasero termine le donjon.
- **AC-09** [test] Deux simulations d'un même donjon avec la même suite d'entrées donnent exactement le même état à chaque pas.
- **AC-10** [test] Sans sauvegarde, le donjon 1 est `available` et les suivants `locked` ; terminer le donjon n rend le donjon n+1 `available` ; un donjon terminé une fois avec ses trois éclats est `perfect` ; un donjon commencé est signalé en cours, et ne l'est plus une fois terminé ou recommencé.
- **AC-11** [test] Chaque donjon du jeu est valide (voir "Contraintes de validation" dans `game-model.md`) : le grand brasero et les trois éclats sont atteignables, aucun point de reprise atteignable n'est une impasse, et la partie de référence se termine sans capture.
- **AC-12** [manuel] Toucher ou cliquer une case y mène l'explorateur ; glisser puis maintenir, ou maintenir une flèche, le fait avancer ; les boutons et les touches voilent la lanterne et ramènent à l'entrée de la salle.
- **AC-13** [manuel] Quitter un donjon en cours (sélecteur, rechargement) puis le rouvrir le reprend à l'entrée de la dernière salle atteinte ; recommencer demande confirmation.
- **AC-14** [manuel] En mouvement réduit, la simulation est inchangée, et les effets décoratifs (vacillement de la flamme, glissement entre salles, voile de capture, yeux qui s'allongent) sont supprimés ou remplacés par un changement immédiat.
- **AC-15** [manuel] En niveaux de gris, chaque type de case, l'état des braseros, des portes et des plaques, les objets et les ombres restent lisibles, dans la lumière comme dans le noir.
- **AC-16** [manuel] La salle, la carte et les objets en main tiennent ensemble dans l'aire de jeu d'un téléphone de 360 × 640 px, en portrait comme en paysage, avec des cases d'au moins 32 px, et le jeu reste fluide (60 images par seconde visées).
- **AC-17** [manuel] Le panneau de fin de niveau affiche temps, éclats et captures, et la mise en valeur "perfect" avec les trois éclats.

## Hors périmètre

- Combat, points de vie, armes.
- Déplacement libre ou en diagonale.
- Donjons générés aléatoirement, donjon unique sans niveaux.
- Plusieurs parties en cours pour un même donjon, sauvegarde au milieu d'une salle.
- Réglage de la difficulté.
