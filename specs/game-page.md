# Page de jeu

Gabarit commun à tous les jeux. Le jeu fournit son contenu (règles, niveaux, aire de jeu, statistiques) ; la page fournit tout le reste, à l'identique d'un jeu à l'autre. L'implémentation technique (hôte de jeu, contrat) est décrite dans `technical-specifications.md`.

## Objectif

Permettre de comprendre un jeu en quelques secondes, de le lancer immédiatement, de reprendre sa progression, et de jouer dans les meilleures conditions sur desktop comme sur mobile.

## Accès

`/<slug>/` en anglais, `/fr/<slug>/` en français, depuis une tuile du catalogue ou un lien direct.

## Modes de la page

| Mode | Chrome du site (en-tête, pied de page) | Aire de jeu |
|---|---|---|
| Hors partie | Visible | Non affichée |
| En partie | Masqué | Plein écran sous le HUD |
| Pause | Réaffiché par-dessus | Visible, assombrie, figée, panneau de pause |
| Fin de niveau | Réaffiché par-dessus | Visible, assombrie, panneau de fin |

Le chrome n'est masqué que pendant le jeu effectif : dès qu'un panneau s'ouvre, l'en-tête et le pied de page réapparaissent par-dessus l'aire de jeu (voir "Couches" dans `style-guide.md`).

## Mode hors partie

Contenu, dans l'ordre :

1. **Titre** (`h1`), badge de genre, accroche.
2. **Bouton "Play"** (principal). Il démarre le premier niveau `available` (le prochain à jouer), ou le premier niveau si tous sont terminés. Pour un jeu sans niveaux, il démarre une partie.
3. **Sélecteur de niveaux**, pour les jeux à niveaux (voir "Sélecteur de niveaux").
4. **Règles** : le corps du fichier de contenu du jeu, avec ses deux sections obligatoires :
   - "How to play" / "Comment jouer" : but du jeu et règles, en quelques phrases ;
   - "Controls" / "Contrôles" : un tableau à trois colonnes, action, clavier, tactile.
5. **Réinitialiser la progression** (bouton danger, en bas de page), seulement si une sauvegarde existe. Il ouvre un panneau de confirmation ("Reset your progress in <title>? This can't be undone." / "Réinitialiser ta progression dans <title> ? C'est irréversible.") avec "Reset" (danger) et "Cancel" (secondaire). Une fois la réinitialisation confirmée, le sélecteur de niveaux est mis à jour.

## Mode en partie

- L'aire de jeu occupe tout l'écran, sous le HUD. L'en-tête et le pied de page sont masqués, et la page ne défile plus.
- Le HUD (voir `style-guide.md`) affiche : pause, libellé du niveau, statistiques fournies par le jeu, actions du jeu, recommencer, son, plein écran.
- Le focus passe à l'aire de jeu.
- **Recommencer** (bouton ou `R`) : redémarre le niveau en cours immédiatement, sans confirmation.
- **Son** : bascule le réglage commun (voir "Son" dans `functional-specifications.md`). L'icône reflète l'état.
- **Plein écran natif** : le bouton n'est affiché que si le navigateur le permet (`document.fullscreenEnabled`). Il demande le plein écran pour toute la page, pas seulement pour l'aire de jeu, et l'icône reflète l'état. Sur iPhone, où l'API n'existe pas, seul le mode "en partie" s'applique, sans bouton.
- Le plein écran natif est conservé en pause et en fin de niveau, et quitté en sortant de la partie.

## Pause

- **Déclencheurs** : bouton pause du HUD, `Échap` ou `P`, perte de focus de l'onglet ou de la fenêtre (pause automatique).
- Le jeu est figé (aucune animation, aucun timer, aucune entrée traitée) et le son est coupé.
- Le panneau "Paused" / "Pause" propose :
  - "Resume" / "Reprendre" (principal) ;
  - "Restart level" / "Recommencer le niveau" ;
  - "Levels" / "Niveaux" (pour un jeu à niveaux) ou "Quit" / "Quitter" (sans niveaux) : retour au mode hors partie, la progression du niveau en cours est perdue.
- `Échap` ou `P` dans le panneau reprend la partie.
- Une reprise après une pause automatique se fait toujours par une action du joueur, jamais automatiquement au retour du focus.

## Fin de niveau

- Le jeu signale la fin d'un niveau avec son résultat (statut `completed` ou `perfect`, statistiques, message facultatif). La sauvegarde est mise à jour avant l'affichage du panneau.
- Le panneau "Level complete" / "Niveau terminé" affiche les statistiques du résultat, et la mise en valeur "perfect" le cas échéant (voir "Panneaux" dans `style-guide.md`). Il propose :
  - "Next level" / "Niveau suivant" (principal), s'il existe un niveau suivant ;
  - "Replay" / "Rejouer" ;
  - "Levels" / "Niveaux".
- Après le dernier niveau, le titre devient "All levels complete!" / "Tous les niveaux sont terminés !", et "Levels" devient l'action principale.
- Pour un jeu sans niveaux, le panneau "Game over" / "Partie terminée" propose "Play again" / "Rejouer" et "Quit" / "Quitter".

## Sélecteur de niveaux

- Grille des niveaux, dans l'ordre défini par le jeu, chacun avec son statut (`locked`, `available`, `completed`, `perfect`, voir `data-model.md`). Apparence dans `style-guide.md`.
- Un niveau `locked` n'est pas sélectionnable. Les autres démarrent directement la partie sur ce niveau.
- La règle de déverrouillage est propre à chaque jeu et décrite dans sa spec fonctionnelle.
- Navigation au clavier : `Tab` entre les niveaux disponibles, `Entrée` ou `Espace` pour lancer.

## États

- **Chargement du jeu** : le module du jeu est chargé en arrière-plan dès l'affichage de la page. Si le joueur appuie sur "Play" avant la fin du chargement, le bouton affiche un indicateur de chargement et la partie démarre dès que le module est prêt.
- **Erreur de chargement** : message "The game couldn't be loaded." / "Le jeu n'a pas pu être chargé." sous le bouton "Play", qui devient "Retry" / "Réessayer".
- **JavaScript désactivé** : le mode hors partie s'affiche (règles comprises), avec un message `<noscript>` "This game needs JavaScript." / "Ce jeu a besoin de JavaScript." à la place du bouton "Play".
- **Stockage indisponible** : aucun message, le sélecteur de niveaux affiche l'état initial et la progression n'est pas sauvegardée (voir "Persistance" dans `functional-specifications.md`).
- **Orientation non prise en charge** (jeux qui l'imposent seulement) : invite d'orientation par-dessus l'aire de jeu, et pause automatique.

## Responsive

- Hors partie : une colonne sur mobile ; à partir de 1024px, règles et sélecteur de niveaux côte à côte sous le titre, si le contenu le permet.
- En partie : l'aire de jeu s'adapte à l'espace disponible (`100dvh` moins le HUD et les zones de sécurité) et le jeu est informé de chaque redimensionnement ou changement d'orientation.

## Accessibilité

- Voir "Accessibilité" dans `technical-specifications.md` pour la gestion du focus et les annonces.
- Le tableau des contrôles est un vrai tableau HTML, avec des en-têtes de colonnes.
- Les boutons du HUD ont un nom accessible et une infobulle indiquant leur raccourci clavier.
