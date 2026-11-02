# Plan de construction : Leap

Huit étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, Delta fusionné sur `dev`, branche `game/leap` créée depuis `dev`.

## 1. Simulation

**Critère :** AC-01 à AC-10 couverts par des tests ; `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 de specs/leap/BUILD-PLAN.md : simulation de Leap.

Crée src/games/leap/logic/ (types.ts, level-parser.ts, collision.ts, leap.ts) en suivant
specs/leap/game-model.md ("Déroulement d'un pas") et les règles de
specs/leap/functional-specifications.md.

Écris les tests de AC-01 à AC-10 (noms préfixés par l'identifiant du critère), sur de petites
salles construites dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Solveur et salles

**Critère :** AC-12 passe pour les 40 salles, en moins de 10 secondes.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 de specs/leap/BUILD-PLAN.md : solveur et niveaux de Leap.

Crée src/games/leap/logic/solver.ts (voir "Solveur" dans specs/leap/game-model.md) et
src/games/leap/levels/levels.ts. Conçois 20 niveaux de deux salles selon "Progression" dans
specs/leap/functional-specifications.md. Propose-moi des critères de difficulté avant de
concevoir les salles (par exemple la largeur de la fenêtre de saut la plus étroite, mesurée
avec le solveur), et consigne ceux retenus, ainsi que tout ajustement des constantes, dans
"Points tranchés à l'implémentation" (specs/leap/technical-specifications.md).

Écris le test AC-12 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, fenêtre la plus étroite par salle) avant de
conclure.

Critère de fin : vitest run passe, le test AC-12 prend moins de 10 secondes.
```

## 3. Rendu et boucle de jeu

**Critère :** "Play" affiche la première salle du niveau 1, conforme à la charte ; AC-16 et AC-17 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/leap/BUILD-PLAN.md : rendu et boucle de Leap.

Crée src/games/leap/index.ts (GameDefinition), render/canvas.ts, render/draw.ts,
render/loop.ts et leap.css, en suivant "Rendu" et "Boucle de jeu" dans
specs/leap/technical-specifications.md et specs/leap/style-guide.md. Crée le fichier de
contenu minimal (src/content/games/leap.en.md et .fr.md) et une couverture provisoire.
Statistiques du HUD (rouages, temps).

Critère de fin : la page /leap/ affiche la salle et l'automate y court dès un appui (contrôles
provisoires) ; AC-16 et AC-17 vérifiés dans le navigateur, avec une salle qui utilise tous
les types de cases, en portrait et en paysage.
```

## 4. Contrôles et effets

**Critère :** AC-13, AC-14 et AC-15 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/leap/BUILD-PLAN.md : contrôles et effets de Leap.

Crée src/games/leap/render/input.ts et render/effects.ts selon "Contrôles" et "Animations"
dans specs/leap/technical-specifications.md, avec l'indicateur de départ. Ajoute les annonces
de "Accessibilité" dans specs/leap/functional-specifications.md.

Critère de fin : AC-13, AC-14 et AC-15 vérifiés dans le navigateur, desktop et mobile.
```

## 5. Progression et résultats

**Critère :** AC-11 couvert par des tests ; AC-18 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/leap/BUILD-PLAN.md : progression et résultats de Leap.

La logique de statuts de Leap est la même que celle de Delta (src/games/delta/logic/progress.ts) :
extrais-la dans src/games/shell/, adapte Delta et ses tests, et mets à jour
specs/technical-specifications.md ("Utilitaires communs actuels"), specs/delta/game-model.md,
specs/delta/technical-specifications.md et specs/leap/game-model.md. Propose-moi ces
modifications de specs avant de les appliquer.

Puis crée src/games/leap/logic/progress.ts, getLevels, complete() avec le résultat et les
messages de "Statistiques et résultats" (specs/leap/functional-specifications.md), et
l'animation de fin de niveau. Écris les tests de AC-11.

Critère de fin : vitest run passe, tests de Delta compris ; AC-18 vérifié ; terminer un niveau
déverrouille le suivant, y compris après rechargement ; la réinitialisation remet le
sélecteur à zéro.
```

## 6. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/leap/BUILD-PLAN.md : sons de Leap.

Crée src/games/leap/render/sounds.ts selon "Son" (specs/leap/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 7. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/leap/BUILD-PLAN.md : fiche et finitions de Leap.

Finalise src/content/games/leap.en.md et .fr.md ("Textes" dans
specs/leap/functional-specifications.md), les textes de src/games/leap/i18n/, et la
couverture public/covers/leap.webp ("Couverture" dans specs/leap/style-guide.md).

Repasse sur tous les critères [manuel] (AC-13 à AC-18) sur desktop et sur un téléphone, joue
les 20 niveaux, et liste-moi ce qui reste à corriger, y compris les salles trop faciles ou trop
difficiles.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 8. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Leap aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/leap` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
