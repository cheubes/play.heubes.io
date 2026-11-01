# Spécifications fonctionnelles générales

## Contexte et objectifs

play.heubes.io est un catalogue de mini jeux web originaux, jouables directement dans le navigateur, sans installation ni compte. Chaque jeu est une pièce conçue pour le site : un concept, des règles et une direction artistique propres, construits sur un socle commun (page de jeu, cycle de vie, contrôles, son, sauvegarde) qui garantit une expérience homogène d'un jeu à l'autre.

Objectifs :

- proposer des parties courtes, accessibles en quelques secondes depuis le catalogue ;
- offrir la même qualité de jeu au clavier sur desktop et au tactile sur mobile ;
- permettre d'ajouter un jeu sans retoucher le socle, en suivant un modèle de spec unique (`_template/`).

## Périmètre du projet

- Une page d'accueil listant les jeux (voir `home-page.md`).
- Une page par jeu, construite sur un gabarit commun (voir `game-page.md`).
- Une page "About" (voir `about-page.md`).
- Une page 404 (voir `not-found-page.md`).
- Des jeux solo, de tout genre à terme (réflexion / puzzle, plateforme, hack 'n' slash, point & click, action-aventure, stratégie en temps réel...). Les premiers jeux sont des jeux de réflexion / puzzle.
- Le site en anglais (langue par défaut) et en français.
- La progression et les préférences du joueur sauvegardées dans son navigateur.

## Utilisateurs cibles

- **Joueur occasionnel** : arrive sur le site par un lien partagé ou par le catalogue, veut comprendre les règles en quelques secondes et jouer tout de suite, souvent sur mobile.
- **Joueur régulier** : revient pour progresser dans les niveaux d'un jeu ou améliorer ses résultats, s'attend à retrouver sa progression.
- **Curieux du web** : s'intéresse à la réalisation (jeux originaux, code ouvert), consulte la page "About".

## Parcours utilisateurs principaux

1. **Découvrir et lancer un jeu** : accueil, choix d'une tuile, page du jeu (titre, accroche, règles, contrôles), "Play", partie.
2. **Reprendre sa progression** : page du jeu, sélecteur de niveaux affichant les niveaux terminés et le prochain disponible, choix d'un niveau, partie.
3. **Interrompre une partie** : pause (bouton, touche ou perte de focus de l'onglet), puis reprise, recommencement ou retour au sélecteur de niveaux.
4. **Terminer un niveau** : panneau de fin de niveau avec le résultat, puis niveau suivant, rejouer ou retour au sélecteur.
5. **Changer de langue** : sélecteur de langue dans l'en-tête, même page dans l'autre langue.
6. **Couper le son** : bouton "Son" dans l'interface du jeu, réglage conservé pour tous les jeux.

## Règles transverses

### Multilingue

- Deux langues : anglais (par défaut) et français. Toute page existe dans les deux langues, aucun contenu n'est publié dans une seule langue. Seule exception : la page 404, en anglais seulement (voir `not-found-page.md`).
- L'anglais est servi sans préfixe d'URL, le français sous `/fr/` (voir "Structure des URLs" dans `technical-specifications.md`).
- Pas de détection de la langue du navigateur ni de redirection automatique : la langue est celle de l'URL.
- Le sélecteur de langue de l'en-tête mène à la même page dans l'autre langue. Il est absent de la page 404, qui n'a pas de version française.
- Tout texte affiché, y compris dans les jeux (HUD, panneaux, messages), passe par un dictionnaire de traductions : aucun texte en dur dans le code d'un jeu.
- Ton : direct et chaleureux. En français, le joueur est tutoyé.

### Navigation

- L'en-tête (logo menant à l'accueil, sélecteur de langue) et le pied de page fixe (licence, About, crédit) sont présents sur toutes les pages, sauf pendant une partie (voir "Modes de la page" dans `game-page.md`).
- Pas de menu de navigation : le catalogue est la page d'accueil, et chaque page de jeu y ramène par le logo.
- Les liens externes (vers un autre site que play.heubes.io) s'ouvrent dans un nouvel onglet, y compris ceux des contenus Markdown.

### Cycle de vie d'une partie

Chaque jeu suit le même cycle de vie, défini dans `game-page.md` : page du jeu (hors partie), partie en cours, pause, fin de niveau ou de partie. Un jeu n'invente pas ses propres écrans de pause ou de fin : il fournit le contenu (résultat, statistiques) affiché par les panneaux communs.

### Contrôles

- Chaque action d'un jeu est réalisable au clavier et au tactile. Aucune action ne dépend du survol à la souris.
- La spec fonctionnelle de chaque jeu décrit ses contrôles dans un tableau à trois colonnes (action, clavier, tactile).
- Raccourcis communs à tous les jeux : `Échap` ou `P` met en pause, `R` recommence le niveau en cours. Un jeu ne réaffecte pas ces touches.
- La souris est traitée comme un pointeur, au même titre que le doigt : un jeu jouable au tactile l'est à la souris.
- La manette n'est pas prise en charge (voir "Hors périmètre").

### Son

- Un seul réglage "Son" (activé ou coupé), commun à tous les jeux et mémorisé dans le navigateur.
- Activé par défaut, mais aucun son n'est joué avant une première interaction du joueur (le bouton "Play" sert de déclencheur).
- Le son est coupé pendant la pause et quand l'onglet perd le focus, et reprend avec la partie.
- Un jeu peut ne pas avoir de son. Les sons d'un jeu sont décrits dans son `style-guide.md`.

### Persistance

- La progression de chaque jeu et les préférences du joueur sont sauvegardées dans le navigateur (voir "Persistance" dans `data-model.md`). Rien n'est envoyé à un serveur.
- Si le stockage est indisponible (navigation privée stricte, stockage plein), les jeux restent jouables sans sauvegarde, sans message d'erreur.
- Une sauvegarde dans un format obsolète et non migrable est ignorée : le joueur repart de zéro sur ce jeu.
- La page de chaque jeu permet de réinitialiser sa progression, après confirmation.

### Mouvement réduit

Quand le système du joueur demande de réduire les animations (`prefers-reduced-motion`), les animations décoratives sont supprimées et les animations porteuses d'information (déplacement d'une pièce, par exemple) sont raccourcies au point d'être quasi instantanées. Chaque jeu précise dans son `technical-specifications.md` ce que devient chacune de ses animations.

### Orientation de l'écran

Un jeu fonctionne dans les deux orientations, sauf exception documentée dans sa spec fonctionnelle. Dans ce cas, la page affiche une invite à tourner l'appareil tant que l'orientation ne convient pas.

## Hors périmètre

- Multijoueur, local ou en ligne.
- Classements en ligne, comptes, synchronisation de la progression entre appareils.
- Mesure d'audience et cookies.
- Filtre ou recherche dans le catalogue (le genre est stocké pour permettre un filtre ultérieur, voir `data-model.md`).
- Thème clair.
- Réglages séparés pour la musique et les effets sonores.
- Prise en charge de la manette.
- Mode hors ligne (PWA) et installation sur l'écran d'accueil.
- Détection et mémorisation de la langue du navigateur.
