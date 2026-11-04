# Plan de construction : Slash

Neuf étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, branche `game/slash` créée depuis `dev`.

## 1. Simulation du héros et des traits

**Critère :** AC-01 à AC-04 et AC-08 couverts par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 1 de specs/slash/BUILD-PLAN.md : simulation du héros et des traits.

Crée src/games/slash/logic/ (types.ts, level-parser.ts, geometry.ts, slash.ts) en suivant
specs/slash/game-model.md ("Déroulement d'un pas", pas 1 à 4 et 7) et les règles de
specs/slash/functional-specifications.md. Les pantins sont immobiles à cette étape (pas 5
sauté), sauf dans les tests de coups, où une frappe est posée directement dans l'état.

Écris les tests de AC-01 à AC-04 et AC-08 (noms préfixés par l'identifiant du critère), sur de
petites arènes construites dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Pantins et vagues

**Critère :** AC-05 à AC-07, AC-09 et AC-10 couverts par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 2 de specs/slash/BUILD-PLAN.md : pantins et vagues.

Crée src/games/slash/logic/pathing.ts et logic/enemies.ts, et complète step (pas 5, 6, 8 et 9)
selon specs/slash/game-model.md.

Écris les tests de AC-05 à AC-07, AC-09 et AC-10.

Critère de fin : vitest run passe.
```

## 3. Stratégie de référence et niveaux

**Critère :** AC-12 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/slash/BUILD-PLAN.md : stratégie de référence et niveaux.

Crée src/games/slash/logic/reference.ts (voir "Stratégie de référence" dans
specs/slash/game-model.md) et src/games/slash/levels/levels.ts. Conçois 20 niveaux selon
"Progression" dans specs/slash/functional-specifications.md. Propose-moi des critères de
difficulté et d'intérêt avant de concevoir les niveaux (par exemple les cœurs restants et le
nombre de traits de la stratégie de référence, ou la plus petite jauge avec laquelle elle
gagne), et consigne ceux retenus, ainsi que tout ajustement des constantes, dans "Points
tranchés à l'implémentation" (specs/slash/technical-specifications.md).

Écris le test AC-12 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, pantins par vague, mesures de difficulté) avant de
conclure.

Critère de fin : vitest run passe, le test AC-12 prend moins de 10 secondes.
```

## 4. Boucle commune

Extraction d'une boucle à pas fixe commune depuis Delta et Leap (voir "Boucle de jeu" dans `technical-specifications.md` de ce dossier).

**Critère :** Delta et Leap se jouent comme avant ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/slash/BUILD-PLAN.md : boucle commune.

Compare src/games/delta/render/loop.ts et src/games/leap/render/loop.ts, et extrais leur
partie commune dans src/games/shell/loop.ts : pas fixe, rattrapage borné, interpolation, pause
sans rattrapage, et un facteur de vitesse lu à chaque image (pour le ralenti de Slash). Adapte
Delta et Leap. Mets à jour specs/technical-specifications.md ("Utilitaires communs actuels"),
et les "Organisation du code" de specs/delta/technical-specifications.md et
specs/leap/technical-specifications.md. Propose-moi ces modifications de specs avant de les
appliquer.

Critère de fin : vitest run passe ; Delta et Leap vérifiés dans le navigateur (partie
complète, pause, reprise).
```

## 5. Rendu

**Critère :** "Play" lance le niveau 1, la simulation tourne et s'affiche conformément à la charte ; AC-16 et AC-17 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/slash/BUILD-PLAN.md : rendu de Slash.

Crée src/games/slash/index.ts (GameDefinition), render/canvas.ts, render/draw.ts et slash.css,
en suivant "Rendu" et "Boucle de jeu" dans specs/slash/technical-specifications.md et
specs/slash/style-guide.md, avec la boucle commune. Crée le fichier de contenu minimal
(src/content/games/slash.en.md et .fr.md) et une couverture provisoire. Statistiques du HUD
(cœurs, vague).

Pas encore de contrôles : pour vérifier, fais jouer la stratégie de référence derrière un
paramètre de développement, retiré à l'étape suivante.

Critère de fin : la page /slash/ affiche une partie qui se déroule ; AC-16 et AC-17 vérifiés
dans le navigateur, avec une vague qui contient les quatre types de pantins, en portrait et en
paysage.
```

## 6. Contrôles et effets

**Critère :** AC-13, AC-14 et AC-15 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/slash/BUILD-PLAN.md : contrôles et effets de Slash.

Crée src/games/slash/render/input.ts et render/effects.ts selon "Contrôles" et "Animations"
dans specs/slash/technical-specifications.md, avec la ligne de visée, la jauge et l'indicateur
de départ. Retire le paramètre de développement de l'étape 5. Ajoute les annonces de
"Accessibilité" dans specs/slash/functional-specifications.md.

Critère de fin : AC-13, AC-14 et AC-15 vérifiés dans le navigateur, desktop et mobile.
```

## 7. Progression et résultats

**Critère :** AC-11 couvert par des tests ; AC-18 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/slash/BUILD-PLAN.md : progression et résultats de Slash.

Crée src/games/slash/logic/progress.ts autour de getUnlockEntries (src/games/shell/unlock.ts),
voir "Données persistées" dans specs/slash/game-model.md. Branche getLevels, complete() avec
les résultats et messages de "Statistiques et résultats"
(specs/slash/functional-specifications.md), et les animations de victoire et de défaite.
Écris les tests de AC-11.

Critère de fin : vitest run passe ; AC-18 vérifié ; gagner un niveau déverrouille le suivant,
y compris après rechargement ; une défaite ne change rien ; la réinitialisation remet le
sélecteur à zéro.
```

## 8. Son et finitions

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause ; tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 8 de specs/slash/BUILD-PLAN.md : sons et finitions de Slash.

Crée src/games/slash/render/sounds.ts selon "Son" (specs/slash/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output(). Finalise
src/content/games/slash.en.md et .fr.md ("Textes" dans
specs/slash/functional-specifications.md), les textes de src/games/slash/i18n/, et la
couverture public/covers/slash.webp ("Couverture" dans specs/slash/style-guide.md).

Repasse sur tous les critères [manuel] (AC-13 à AC-18) sur desktop et sur un téléphone, joue
les 20 niveaux, et liste-moi ce qui reste à corriger, y compris les niveaux trop faciles ou
trop difficiles.

Critère de fin : chaque son se déclenche au bon moment, aucun pendant la pause ; tous les
critères d'acceptation sont vérifiés.
```

## 9. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Slash aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/slash` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
