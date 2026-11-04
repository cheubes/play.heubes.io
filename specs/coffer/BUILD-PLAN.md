# Plan de construction : Coffer

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, branche `game/coffer` créée depuis `dev`.

## 1. Logique pure

**Critère :** AC-01 à AC-06 et AC-08 couverts par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 1 de specs/coffer/BUILD-PLAN.md : logique pure de Coffer.

Crée src/games/coffer/logic/ (types.ts, level-parser.ts, conditions.ts, coffer.ts,
progress.ts) en suivant specs/coffer/game-model.md et les règles de
specs/coffer/functional-specifications.md. progress.ts s'appuie sur getUnlockEntries
(src/games/shell/unlock.ts).

Écris les tests de AC-01 à AC-06 et AC-08 (noms préfixés par l'identifiant du critère), sur de
petits coffrets construits dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Recherche et indices

**Critère :** AC-07 couvert par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 2 de specs/coffer/BUILD-PLAN.md : recherche et indices.

Crée src/games/coffer/logic/search.ts (états et actions abstraits, recherche en largeur) et
logic/hints.ts (voir "Indices" dans specs/coffer/game-model.md).

Écris les tests de AC-07 : paliers, retour au palier 1, valeur visée d'un cadran, mécanisme
dans un compartiment, et aucun indice vers le compartiment secret.

Critère de fin : vitest run passe.
```

## 3. Coffrets et validation

**Critère :** AC-09 passe pour les 12 coffrets, en moins de 10 secondes.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/coffer/BUILD-PLAN.md : coffrets de Coffer.

Crée src/games/coffer/levels/levels.ts. Conçois 12 coffrets selon "Progression" dans
specs/coffer/functional-specifications.md. Propose-moi d'abord, pour chaque série, le principe
des coffrets (mécanismes, chaîne d'étapes, rôle des inscriptions, cachette de la breloque) et
des critères de difficulté mesurables (longueur du plus court chemin, nombre de faces
traversées, objets en main), et consigne ceux retenus dans "Points tranchés à
l'implémentation" (specs/coffer/technical-specifications.md).

Écris le test AC-09 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des coffrets (id, bois, mécanismes, longueur du plus court chemin) avant
de conclure.

Critère de fin : vitest run passe, le test AC-09 prend moins de 10 secondes.
```

## 4. Rendu

**Critère :** "Play" affiche la face avant du coffret 1, conforme à la charte ; AC-13 et AC-14 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/coffer/BUILD-PLAN.md : rendu de Coffer.

Crée src/games/coffer/index.ts (GameDefinition, action "hint"), render/box.ts,
render/elements.ts, render/inventory.ts et coffer.css, en suivant "Rendu" dans
specs/coffer/technical-specifications.md et specs/coffer/style-guide.md, avec les noms
accessibles. Ajoute l'icône lightbulb à src/icons/ (voir "Iconographie" dans
specs/style-guide.md). Crée le fichier de contenu minimal (src/content/games/coffer.en.md et
.fr.md) et une couverture provisoire.

Pas encore de contrôles ni d'animations.

Critère de fin : la page /coffer/ affiche la face avant du coffret 1 ; AC-13 et AC-14
vérifiés dans le navigateur, avec un coffret de test qui utilise tous les éléments sur les
quatre bois, en portrait et en paysage.
```

## 5. Contrôles et animations

**Critère :** AC-10, AC-11 et AC-12 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/coffer/BUILD-PLAN.md : contrôles et animations de Coffer.

Crée src/games/coffer/render/input.ts et render/animations.ts selon "Contrôles", "Indices" et
"Animations" dans specs/coffer/technical-specifications.md. Ajoute les annonces de
"Accessibilité" dans specs/coffer/functional-specifications.md.

Critère de fin : AC-10, AC-11 et AC-12 vérifiés dans le navigateur, desktop et mobile.
```

## 6. Résultats et accessibilité

**Critère :** AC-15 et AC-16 vérifiés à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/coffer/BUILD-PLAN.md : résultats et accessibilité de Coffer.

Branche getLevels, complete() avec les résultats et messages de "Statistiques et résultats"
(specs/coffer/functional-specifications.md), la sauvegarde CofferSave et l'animation de
victoire. Puis vérifie AC-15 avec VoiceOver sur desktop et sur iPhone, et corrige les noms et
états accessibles qui ne suffisent pas.

Critère de fin : AC-15 et AC-16 vérifiés ; ouvrir un coffret déverrouille le suivant, y
compris après rechargement ; la réinitialisation remet le sélecteur à zéro.
```

## 7. Son et finitions

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause ; tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/coffer/BUILD-PLAN.md : sons et finitions de Coffer.

Crée src/games/coffer/render/sounds.ts selon "Son" (specs/coffer/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output(). Finalise
src/content/games/coffer.en.md et .fr.md ("Textes" dans
specs/coffer/functional-specifications.md), les textes de src/games/coffer/i18n/, et la
couverture public/covers/coffer.webp ("Couverture" dans specs/coffer/style-guide.md).

Repasse sur tous les critères [manuel] (AC-10 à AC-16) sur desktop et sur un téléphone, ouvre
les 12 coffrets sans indice en notant le temps, et liste-moi ce qui reste à corriger, y compris
les coffrets trop faciles, trop longs ou dont une inscription prête à confusion.

Critère de fin : chaque son se déclenche au bon moment, aucun pendant la pause ; tous les
critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Coffer aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/coffer` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
