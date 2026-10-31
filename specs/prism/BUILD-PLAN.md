# Plan de construction : Prism

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : Tilt fusionné sur `dev` (le socle des jeux a été éprouvé par un premier jeu), branche `game/prism` créée depuis `dev`.

## 1. Progression commune et logique pure

Extraction de la logique de progression de Tilt vers `src/games/shell/` (elle sert désormais à deux jeux, voir "Structure des fichiers" dans `technical-specifications.md`), puis logique pure de Prism.

**Critère :** les tests de Tilt passent toujours ; AC-01 à AC-11 de Prism couverts par des tests ; `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 de specs/prism/BUILD-PLAN.md : progression commune et logique pure de Prism.

1. Déplace la logique de progression de src/games/tilt/logic/progress.ts vers
   src/games/shell/ (statuts des niveaux et record à partir de { best }, avec le par de chaque
   niveau), adapte Tilt et ses tests, et mets à jour specs/tilt/technical-specifications.md
   ("Organisation du code"). Propose-moi ces modifications de specs avant de les appliquer.
2. Crée src/games/prism/logic/ (types.ts, level-parser.ts, beams.ts, prism.ts) en suivant
   specs/prism/game-model.md et les règles de specs/prism/functional-specifications.md.

Écris les tests de AC-01 à AC-11 de Prism (noms préfixés par l'identifiant du critère).
Pas de rendu à cette étape.

Critère de fin : vitest run passe, tests de Tilt compris.
```

## 2. Niveaux et solveur

**Critère :** AC-12 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 de specs/prism/BUILD-PLAN.md : solveur et niveaux de Prism.

Crée src/games/prism/logic/solver.ts (voir "Solveur" dans specs/prism/game-model.md) et
src/games/prism/levels/levels.ts. Conçois 20 niveaux selon "Progression" dans
specs/prism/functional-specifications.md. Utilise le solveur pour calculer le par et vérifier
que chaque niveau n'a pas de solution triviale au regard de sa place dans la série.

Écris le test AC-12 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, par) avant de conclure.

Critère de fin : vitest run passe, le test AC-12 prend moins de 10 secondes.
```

## 3. Rendu du plateau et des faisceaux

**Critère :** "Play" affiche le niveau 1 avec ses faisceaux, conforme à la charte ; AC-16 et AC-17 vérifiés à la main.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 3 de specs/prism/BUILD-PLAN.md : rendu de Prism.

Crée src/games/prism/index.ts (GameDefinition), render/board.ts, render/beams.ts et
prism.css, en suivant "Rendu" dans specs/prism/technical-specifications.md et
specs/prism/style-guide.md (palette, éléments de jeu, secteurs des cibles). Crée le fichier de
contenu minimal (src/content/games/prism.en.md et .fr.md) et une couverture provisoire.

Pas encore de contrôles ni d'animations.

Critère de fin : la page /prism/ affiche le niveau 1 avec ses faisceaux ; AC-16 et AC-17
vérifiés dans le navigateur, avec un niveau 8 × 8 qui utilise tous les types d'éléments.
```

## 4. Contrôles et animations

**Critère :** AC-13, AC-14 et AC-15 vérifiés à la main, sur desktop et sur mobile.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 4 de specs/prism/BUILD-PLAN.md : contrôles et animations de Prism.

Crée src/games/prism/render/input.ts et render/animations.ts selon "Contrôles" et
"Animations" dans specs/prism/technical-specifications.md. Déclare l'action "undo" dans la
GameDefinition et gère son état. Ajoute les annonces de "Accessibilité" dans
specs/prism/functional-specifications.md.

Critère de fin : AC-13, AC-14 et AC-15 vérifiés dans le navigateur, desktop et mobile.
```

## 5. Progression et résultats

**Critère :** AC-18 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/prism/BUILD-PLAN.md : progression et résultats de Prism.

Branche la progression commune (src/games/shell/) : getLevels, statistiques du HUD, complete()
avec le résultat et les messages de "Statistiques et résultats"
(specs/prism/functional-specifications.md), sauvegarde PrismSave. Ajoute l'animation de
victoire.

Critère de fin : AC-18 vérifié ; terminer un niveau déverrouille le suivant, y compris après
rechargement ; la réinitialisation remet le sélecteur à zéro.
```

## 6. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/prism/BUILD-PLAN.md : sons de Prism.

Crée src/games/prism/render/sounds.ts selon "Son" (specs/prism/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 7. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/prism/BUILD-PLAN.md : fiche et finitions de Prism.

Finalise src/content/games/prism.en.md et .fr.md ("Textes" dans
specs/prism/functional-specifications.md), les textes de src/games/prism/i18n/, et la
couverture public/covers/prism.webp ("Couverture" dans specs/prism/style-guide.md).

Repasse sur tous les critères [manuel] (AC-13 à AC-18) sur desktop et sur un téléphone, et
liste-moi ce qui reste à corriger.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Prism aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/prism` sur `dev`. Le jeu est publié avec le déploiement (étape 12 de `BUILD-PLAN.md`).

**Statut :** à faire.
