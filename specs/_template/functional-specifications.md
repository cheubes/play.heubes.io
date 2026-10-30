# Spécification fonctionnelle : <Titre du jeu>

> Modèle à copier dans `specs/<slug>/`. Toutes les sections sont obligatoires ; une section sans objet le dit explicitement ("Sans objet : ..."). Les règles communes (`functional-specifications.md`, `game-page.md`) ne sont pas répétées : seul ce qui est propre au jeu figure ici.

## Concept

> Le jeu en deux ou trois phrases, son genre (voir "Genre" dans `data-model.md`), et ce qui le rend original. Le jeu est original ou relève d'un genre : ce n'est pas la recréation d'un jeu existant précis.

## Objectif du joueur

> Ce que le joueur doit accomplir pour terminer un niveau ou une partie, et comment il peut perdre, le cas échéant.

## Règles

> Règles complètes et non ambiguës, numérotées. Chaque règle doit pouvoir être vérifiée par un test sur la logique pure.

## Contrôles

| Action | Clavier | Tactile |
|---|---|---|
| | | |

> Les raccourcis communs (`Échap`, `P`, `R`) ne sont pas réaffectés.

## Progression

> Niveaux (nombre, courbe de difficulté, introduction des mécaniques), règle de déverrouillage, définition du résultat `perfect`. Pour un jeu sans niveaux : déroulement d'une partie.

## Statistiques et résultats

> Statistiques affichées dans le HUD, statistiques et message du panneau de fin de niveau.

## Écrans et états propres au jeu

> Ce qui se passe dans l'aire de jeu au-delà des modes communs (`game-page.md`) : début de niveau, victoire, défaite...

## Orientation

> Les deux orientations sont prises en charge, ou exception justifiée.

## Accessibilité

> Comment l'information est doublée au-delà de la couleur, ce qui est annoncé aux lecteurs d'écran, limites connues.

## Textes

> Contenu des sections "How to play" / "Comment jouer" et "Controls" / "Contrôles" du fichier de contenu, en anglais et en français. Accroche dans les deux langues.

## Critères d'acceptation

> Liste numérotée `AC-01`, `AC-02`... Chaque critère est marqué [test] (couvert par un test sur la logique, dont le nom commence par son identifiant) ou [manuel] (vérifié dans le navigateur, desktop et mobile). Formulation : "Étant donné..., quand..., alors...".

## Hors périmètre

> Ce qui a été envisagé pour ce jeu et volontairement écarté.
