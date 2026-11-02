# Plan de construction : Shadow

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, branche `game/shadow` créée depuis `dev`.

## 1. Logique pure

**Critère :** AC-01 à AC-08 couverts par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 1 de specs/shadow/BUILD-PLAN.md : logique pure de Shadow.

Crée src/games/shadow/logic/ (types.ts, level-parser.ts, shade.ts, shadow.ts) en suivant
specs/shadow/game-model.md et les règles de specs/shadow/functional-specifications.md.

Écris les tests de AC-01 à AC-08 (noms préfixés par l'identifiant du critère). AC-08 s'appuie
sur la progression commune (src/games/shell/progress.ts). Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Niveaux et solveur

**Critère :** AC-09 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 2 de specs/shadow/BUILD-PLAN.md : solveur et niveaux de Shadow.

Crée src/games/shadow/logic/solver.ts (voir "Solveur" dans specs/shadow/game-model.md) et
src/games/shadow/levels/levels.ts. Conçois 20 niveaux selon "Progression" dans
specs/shadow/functional-specifications.md. Utilise le solveur pour calculer le par et vérifier
que chaque niveau n'a pas de solution triviale au regard de sa place dans la série. Propose-moi
des critères de non-trivialité avant de concevoir les niveaux, et consigne ceux retenus dans
"Points tranchés à l'implémentation" (specs/shadow/technical-specifications.md).

Écris le test AC-09 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, par) avant de conclure.

Critère de fin : vitest run passe, le test AC-09 prend moins de 10 secondes.
```

## 3. Rendu du plateau et des ombres

**Critère :** "Play" affiche le niveau 1 avec ses ombres, conforme à la charte ; AC-13 et AC-14 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/shadow/BUILD-PLAN.md : rendu de Shadow.

Crée src/games/shadow/index.ts (GameDefinition), render/board.ts et shadow.css, en suivant
"Rendu" dans specs/shadow/technical-specifications.md et specs/shadow/style-guide.md (palette,
éléments de jeu, états des cibles). Crée le fichier de contenu minimal
(src/content/games/shadow.en.md et .fr.md) et une couverture provisoire.

Pas encore de contrôles ni d'animations.

Critère de fin : la page /shadow/ affiche le niveau 1 avec ses ombres ; AC-13 et AC-14
vérifiés dans le navigateur, avec un niveau 8 × 8 à deux lumières qui utilise tous les types
d'éléments et toutes les hauteurs.
```

## 4. Sélection commune, contrôles et animations

Extraction de la sélection au clavier de Prism vers `src/games/shell/` (elle sert désormais à deux jeux, voir "Organisation du code" dans `technical-specifications.md`), puis contrôles et animations de Shadow.

**Critère :** le comportement de Prism au clavier est inchangé ; AC-10, AC-11 et AC-12 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/shadow/BUILD-PLAN.md : sélection commune, contrôles et
animations de Shadow.

1. Déplace firstSelection et nextSelection de src/games/prism/render/input.ts vers
   src/games/shell/selection.ts, en les faisant travailler sur une liste de positions
   sélectionnables fournie par le jeu. Adapte Prism, et mets à jour
   specs/technical-specifications.md ("Utilitaires communs actuels") et
   specs/prism/technical-specifications.md ("Organisation du code"). Propose-moi ces
   modifications de specs avant de les appliquer.
2. Crée src/games/shadow/render/input.ts et render/animations.ts selon "Contrôles" et
   "Animations" dans specs/shadow/technical-specifications.md. Déclare l'action "undo" dans la
   GameDefinition et gère son état. Ajoute les annonces de "Accessibilité" dans
   specs/shadow/functional-specifications.md.

Critère de fin : Prism se joue au clavier comme avant ; AC-10, AC-11 et AC-12 de Shadow
vérifiés dans le navigateur, desktop et mobile.
```

## 5. Progression et résultats

**Critère :** AC-15 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/shadow/BUILD-PLAN.md : progression et résultats de Shadow.

Branche la progression commune (src/games/shell/progress.ts) : getLevels, statistiques du HUD,
complete() avec le résultat et les messages de "Statistiques et résultats"
(specs/shadow/functional-specifications.md), sauvegarde ShadowSave. Ajoute l'animation de
victoire.

Critère de fin : AC-15 vérifié ; terminer un niveau déverrouille le suivant, y compris après
rechargement ; la réinitialisation remet le sélecteur à zéro.
```

## 6. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/shadow/BUILD-PLAN.md : sons de Shadow.

Crée src/games/shadow/render/sounds.ts selon "Son" (specs/shadow/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 7. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/shadow/BUILD-PLAN.md : fiche et finitions de Shadow.

Finalise src/content/games/shadow.en.md et .fr.md ("Textes" dans
specs/shadow/functional-specifications.md), les textes de src/games/shadow/i18n/, et la
couverture public/covers/shadow.webp ("Couverture" dans specs/shadow/style-guide.md).

Repasse sur tous les critères [manuel] (AC-10 à AC-15) sur desktop et sur un téléphone, et
liste-moi ce qui reste à corriger.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Shadow aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/shadow` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
