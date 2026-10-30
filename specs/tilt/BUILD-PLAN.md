# Plan de construction : Tilt

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : étapes 1 à 10 de `BUILD-PLAN.md` faites (socle du site et hôte de jeu), branche `game/tilt` créée depuis `dev`.

## 1. Logique pure

Types, parseur de niveaux, inclinaison, annulation, victoire, progression. Voir "Entités", "État de jeu", "Transitions" et "Données persistées" dans `game-model.md`.

**Critère :** AC-01 à AC-11 couverts par des tests, `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 de specs/tilt/BUILD-PLAN.md : logique pure de Tilt.

Crée src/games/tilt/logic/ (types.ts, level-parser.ts, tilt.ts, progress.ts) en suivant
specs/tilt/game-model.md, et les règles de specs/tilt/functional-specifications.md. Respecte
"Séparation logique / rendu" dans specs/technical-specifications.md : aucun accès au DOM,
fonctions pures, état immuable.

Écris les tests de AC-01 à AC-11 (noms préfixés par l'identifiant du critère), avec de petits
niveaux construits dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Niveaux et solveur

Solveur, puis les 20 niveaux selon la courbe de "Progression" (`functional-specifications.md`).

**Critère :** AC-12 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 de specs/tilt/BUILD-PLAN.md : solveur et niveaux de Tilt.

Crée src/games/tilt/logic/solver.ts (voir "Solveur" dans specs/tilt/game-model.md) et
src/games/tilt/levels/levels.ts. Conçois 20 niveaux selon "Progression" dans
specs/tilt/functional-specifications.md : chaque série introduit sa mécanique par un niveau
évident, puis monte en difficulté. Utilise le solveur pour calculer le par de chaque niveau
et vérifier que la solution n'est pas triviale au regard de la place du niveau dans la
série.

Écris le test AC-12 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, par) avant de conclure.

Critère de fin : vitest run passe, le test AC-12 prend moins de 10 secondes.
```

## 3. Rendu du plateau

Plateau et blocs en DOM, sans animation, branchés sur le contrat de l'hôte (`start`, `restart`, `destroy`, `resize`). Voir "Rendu" dans `technical-specifications.md` et "Éléments de jeu" dans `style-guide.md`.

**Critère :** "Play" affiche le niveau 1 conforme à la charte ; AC-16 et AC-17 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/tilt/BUILD-PLAN.md : rendu du plateau de Tilt.

Crée src/games/tilt/index.ts (GameDefinition, voir "Contrat d'un jeu" dans
specs/technical-specifications.md), src/games/tilt/render/board.ts et tilt.css, en suivant
"Rendu" dans specs/tilt/technical-specifications.md et specs/tilt/style-guide.md (palette,
éléments de jeu, symboles). Crée le fichier de contenu minimal (src/content/games/tilt.en.md
et .fr.md, voir "Textes" dans functional-specifications.md) et une couverture provisoire pour
que la page existe.

Pas encore de contrôles ni d'animations.

Critère de fin : la page /tilt/ affiche le niveau 1 en partie ; AC-16 (niveaux de gris) et
AC-17 (8 × 8 sur 360 × 640, portrait et paysage) vérifiés dans le navigateur, avec un niveau
8 × 8.
```

## 4. Contrôles et animations

Clavier, glisser, annulation, animations et mouvement réduit. Voir "Contrôles" et "Animations" dans `technical-specifications.md`.

**Critère :** AC-13, AC-14 et AC-15 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/tilt/BUILD-PLAN.md : contrôles et animations de Tilt.

Crée src/games/tilt/render/input.ts et render/animations.ts selon "Contrôles" et
"Animations" dans specs/tilt/technical-specifications.md. Déclare l'action "undo" dans la
GameDefinition (HUD) et gère son état activé ou désactivé. Ajoute les annonces décrites dans
"Accessibilité" de specs/tilt/functional-specifications.md.

Critère de fin : AC-13, AC-14 et AC-15 vérifiés dans le navigateur, desktop et mobile.
```

## 5. Progression et résultats

Statistiques du HUD, fin de niveau, sauvegarde, sélecteur de niveaux. Voir "Progression" et "Statistiques et résultats" dans `functional-specifications.md`.

**Critère :** AC-18 vérifié à la main ; la progression survit à un rechargement de la page ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/tilt/BUILD-PLAN.md : progression et résultats de Tilt.

Branche logic/progress.ts sur le contexte de l'hôte : getLevels, statistiques du HUD
(Moves, Par), complete() avec le résultat et les messages de "Statistiques et résultats"
(specs/tilt/functional-specifications.md), sauvegarde TiltSave (game-model.md, "Données
persistées"). Ajoute l'animation de victoire (technical-specifications.md).

Critère de fin : AC-18 vérifié ; terminer un niveau déverrouille le suivant dans le
sélecteur, y compris après rechargement ; la réinitialisation remet le sélecteur à zéro.
```

## 6. Son

Voir "Son" dans `technical-specifications.md` et "Sons" dans `style-guide.md`.

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/tilt/BUILD-PLAN.md : sons de Tilt.

Crée src/games/tilt/render/sounds.ts : synthèse Web Audio des sons listés dans "Son"
(specs/tilt/technical-specifications.md), caractère décrit dans "Sons" (style-guide.md),
connectés à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son dans le HUD les coupe
tous ; aucun son pendant la pause.
```

## 7. Fiche du jeu et finitions

Textes définitifs, couverture, relecture de l'accessibilité et du mobile.

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel ; Lighthouse sans régression sur la page du jeu.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/tilt/BUILD-PLAN.md : fiche et finitions de Tilt.

Finalise src/content/games/tilt.en.md et .fr.md ("Textes" dans
specs/tilt/functional-specifications.md, sections obligatoires de specs/game-page.md),
les textes de src/games/tilt/i18n/, et la couverture public/covers/tilt.webp ("Couverture"
dans specs/tilt/style-guide.md, "Images de couverture" dans specs/style-guide.md).

Repasse sur tous les critères [manuel] (AC-13 à AC-18) sur desktop et sur un téléphone, et
liste-moi ce qui reste à corriger.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation" dans `technical-specifications.md`, fusion de `game/tilt` sur `dev`. Le jeu est publié avec le déploiement (étape 12 de `BUILD-PLAN.md`).

**Statut :** à faire.
