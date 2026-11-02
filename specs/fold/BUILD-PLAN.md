# Plan de construction : Fold

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, branche `game/fold` créée depuis `dev`.

## 1. Logique pure

**Critère :** AC-01 à AC-08 couverts par des tests ; `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 de specs/fold/BUILD-PLAN.md : logique pure de Fold.

Crée src/games/fold/logic/ (types.ts, level-parser.ts, sheet.ts, fold.ts) en suivant
specs/fold/game-model.md et les règles de specs/fold/functional-specifications.md.

Écris les tests de AC-01 à AC-08 (noms préfixés par l'identifiant du critère). AC-08 s'appuie
sur la progression commune (src/games/shell/progress.ts). Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Niveaux et solveur

**Critère :** AC-09 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 de specs/fold/BUILD-PLAN.md : solveur et niveaux de Fold.

Crée src/games/fold/logic/solver.ts (voir "Solveur" dans specs/fold/game-model.md) et
src/games/fold/levels/levels.ts. Conçois 20 niveaux selon "Progression" dans
specs/fold/functional-specifications.md. Utilise le solveur pour calculer le par et vérifier
que chaque niveau n'a pas de solution triviale au regard de sa place dans la série. Propose-moi
des critères de non-trivialité avant de concevoir les niveaux, et consigne ceux retenus dans
"Points tranchés à l'implémentation" (specs/fold/technical-specifications.md).

Écris le test AC-09 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, par) avant de conclure.

Critère de fin : vitest run passe, le test AC-09 prend moins de 10 secondes.
```

## 3. Rendu de la feuille et de la carte modèle

**Critère :** "Play" affiche le niveau 1, feuille et carte modèle, conforme à la charte ; AC-13 (hors ligne de pli, qui n'apparaît qu'à l'étape 4) et AC-14 vérifiés à la main.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 3 de specs/fold/BUILD-PLAN.md : rendu de Fold.

Crée src/games/fold/index.ts (GameDefinition), render/board.ts et fold.css, en suivant
"Rendu" dans specs/fold/technical-specifications.md et specs/fold/style-guide.md (palette,
motifs des encres, découpes, épingles, carte modèle). Crée le fichier de contenu minimal
(src/content/games/fold.en.md et .fr.md) et une couverture provisoire.

Pas encore de contrôles ni d'animations.

Critère de fin : la page /fold/ affiche le niveau 1 avec sa carte modèle ; AC-13 et AC-14
vérifiés dans le navigateur, avec une feuille de 6 × 6 qui utilise les quatre encres, des
découpes et une épingle, en portrait et en paysage.
```

## 4. Contrôles et animations

**Critère :** AC-10, AC-11 et AC-12 vérifiés à la main, sur desktop et sur mobile ; la ligne de pli d'AC-13 vérifiée en niveaux de gris.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 4 de specs/fold/BUILD-PLAN.md : contrôles et animations de Fold.

Crée src/games/fold/render/input.ts et render/animations.ts selon "Contrôles" et
"Animations" dans specs/fold/technical-specifications.md (geste, aperçu, ligne de pli au
clavier, rotation 3D du rabat). Déclare l'action "undo" dans la GameDefinition et gère son
état. Ajoute les annonces de "Accessibilité" dans specs/fold/functional-specifications.md.

Critère de fin : AC-10, AC-11 et AC-12 vérifiés dans le navigateur, desktop et mobile, y compris
un pli qui déborde et un pli bloqué par une épingle.
```

## 5. Progression et résultats

**Critère :** AC-15 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 5 de specs/fold/BUILD-PLAN.md : progression et résultats de Fold.

Branche la progression commune (src/games/shell/progress.ts) : getLevels, statistiques du HUD,
complete() avec le résultat et les messages de "Statistiques et résultats"
(specs/fold/functional-specifications.md), sauvegarde FoldSave. Ajoute l'animation de
victoire.

Critère de fin : AC-15 vérifié ; terminer un niveau déverrouille le suivant, y compris après
rechargement ; la réinitialisation remet le sélecteur à zéro.
```

## 6. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 6 de specs/fold/BUILD-PLAN.md : sons de Fold.

Crée src/games/fold/render/sounds.ts selon "Son" (specs/fold/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 7. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/fold/BUILD-PLAN.md : fiche et finitions de Fold.

Finalise src/content/games/fold.en.md et .fr.md ("Textes" dans
specs/fold/functional-specifications.md), les textes de src/games/fold/i18n/, et la
couverture public/covers/fold.webp ("Couverture" dans specs/fold/style-guide.md).

Repasse sur tous les critères [manuel] (AC-10 à AC-15) sur desktop et sur un téléphone, et
liste-moi ce qui reste à corriger.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Fold aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/fold` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
