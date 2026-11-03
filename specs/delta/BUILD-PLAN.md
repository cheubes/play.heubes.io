# Plan de construction : Delta

Neuf étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, Fold fusionné sur `dev`, branche `game/delta` créée depuis `dev`.

## 1. Simulation

**Critère :** AC-01 à AC-07 et AC-09 couverts par des tests ; `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 de specs/delta/BUILD-PLAN.md : simulation de Delta.

Crée src/games/delta/logic/ (types.ts, level-parser.ts, random.ts, simulation.ts) en suivant
specs/delta/game-model.md ("Déroulement d'un pas") et les règles de
specs/delta/functional-specifications.md. Le rival ne joue pas encore (decide n'existe pas) :
le pas 2 est sauté.

Écris les tests de AC-01 à AC-07 et AC-09 (noms préfixés par l'identifiant du critère), sur de
petites cartes construites dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Stratégie du rival

**Critère :** AC-08 couvert par des tests ; `vitest run` passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 de specs/delta/BUILD-PLAN.md : stratégie du rival.

Crée src/games/delta/logic/strategy.ts (decide, voir "Stratégie" dans specs/delta/game-model.md)
et branche-le dans step (pas 2).

Écris les tests de AC-08 : un cas par phase (menace, renfort, poursuite, attaque, relais,
réserve) et un cas d'égalité départagée par le générateur.

Critère de fin : vitest run passe.
```

## 3. Niveaux et validation

**Critère :** AC-11 passe pour les 20 niveaux, en moins de 10 secondes.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 3 de specs/delta/BUILD-PLAN.md : niveaux de Delta.

Crée src/games/delta/levels/levels.ts. Conçois 20 niveaux selon "Progression" dans
specs/delta/functional-specifications.md, en t'aidant de la stratégie de référence pour
mesurer la difficulté (temps de victoire, marge). Propose-moi des critères de difficulté et
d'intérêt avant de concevoir les niveaux, et consigne ceux retenus, ainsi que tout ajustement
des constantes, dans "Points tranchés à l'implémentation"
(specs/delta/technical-specifications.md).

Écris le test AC-11 (toutes les "Contraintes de validation" de game-model.md).

Présente-moi la liste des niveaux (id, mécaniques, bassins, temps de la stratégie de
référence) avant de conclure.

Critère de fin : vitest run passe, le test AC-11 prend moins de 10 secondes.
```

## 4. Rendu et boucle de jeu

**Critère :** "Play" lance le niveau 1, la simulation tourne et s'affiche conformément à la charte ; AC-13, AC-15 et AC-16 vérifiés à la main.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 4 de specs/delta/BUILD-PLAN.md : rendu et boucle de Delta.

Crée src/games/delta/index.ts (GameDefinition), render/canvas.ts, render/draw.ts,
render/loop.ts et delta.css, en suivant "Rendu" et "Boucle de jeu" dans
specs/delta/technical-specifications.md et specs/delta/style-guide.md. Crée le fichier de
contenu minimal (src/content/games/delta.en.md et .fr.md) et une couverture provisoire.
Statistiques du HUD (temps, bassins).

Pas encore de contrôles : pour vérifier, fais jouer la stratégie de référence pour le joueur
derrière un paramètre de développement, retiré à l'étape suivante.

Critère de fin : la page /delta/ affiche une partie qui se déroule ; AC-13, AC-15 et AC-16
vérifiés dans le navigateur, avec une carte de 14 bassins, en portrait et en paysage.
```

## 5. Contrôles et effets

Delta est le premier jeu après Prism à avoir besoin de la sélection au clavier : `nextSelection` est extraite de Prism vers `src/games/shell/selection.ts` dans cette étape (voir "Utilitaires communs actuels" dans `technical-specifications.md`).

**Critère :** AC-12 et AC-14 vérifiés à la main, sur desktop et sur mobile.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 5 de specs/delta/BUILD-PLAN.md : contrôles et effets de Delta.

Crée src/games/delta/render/input.ts et render/effects.ts selon "Contrôles" et "Animations"
dans specs/delta/technical-specifications.md. Retire le paramètre de développement de
l'étape 4. Ajoute les annonces de "Accessibilité" dans specs/delta/functional-specifications.md.

Critère de fin : AC-12 et AC-14 vérifiés dans le navigateur, desktop et mobile.
```

## 6. Échec de niveau et progression

Le socle gagne une fin de niveau en échec (voir "Fin de niveau" dans `game-page.md` et "Contrat d'un jeu" dans `technical-specifications.md`), puis Delta branche sa progression.

**Critère :** les autres jeux fonctionnent comme avant ; AC-10 couvert par des tests ; AC-17 vérifié à la main ; la progression survit à un rechargement ; la réinitialisation fonctionne.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 6 de specs/delta/BUILD-PLAN.md : échec de niveau et progression de Delta.

1. Dans le socle (src/games/shell/, src/components/game-ui/, src/i18n/), ajoute le statut
   'failed' à LevelResult et le panneau d'échec, selon "Fin de niveau" dans
   specs/game-page.md et "Panneaux" dans specs/style-guide.md. Vérifie que Tilt, Prism,
   Shadow, Fold et Leap ne sont pas affectés.
2. La logique de statuts de Delta est la même que celle de Leap (src/games/leap/logic/progress.ts) :
   extrais-la dans src/games/shell/, adapte Leap et ses tests, et mets à jour
   specs/technical-specifications.md ("Utilitaires communs actuels"), specs/leap/game-model.md,
   specs/leap/technical-specifications.md et specs/delta/game-model.md. Propose-moi ces
   modifications de specs avant de les appliquer. Puis crée src/games/delta/logic/progress.ts
   (voir "Données persistées" dans specs/delta/game-model.md), getLevels, complete() avec les résultats et messages de
   "Statistiques et résultats" (specs/delta/functional-specifications.md), animations de
   victoire et de défaite.

Écris les tests de AC-10.

Critère de fin : vitest run passe, tests de Leap compris ; AC-17 vérifié ; gagner un niveau déverrouille le suivant,
y compris après rechargement ; une défaite ne change rien ; la réinitialisation remet le
sélecteur à zéro.
```

## 7. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 7 de specs/delta/BUILD-PLAN.md : sons de Delta.

Crée src/games/delta/render/sounds.ts selon "Son" (specs/delta/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 8. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 8 de specs/delta/BUILD-PLAN.md : fiche et finitions de Delta.

Finalise src/content/games/delta.en.md et .fr.md ("Textes" dans
specs/delta/functional-specifications.md), les textes de src/games/delta/i18n/, et la
couverture public/covers/delta.webp ("Couverture" dans specs/delta/style-guide.md).

Repasse sur tous les critères [manuel] (AC-12 à AC-17) sur desktop et sur un téléphone, joue
les 20 niveaux, et liste-moi ce qui reste à corriger, y compris les niveaux trop faciles ou
trop difficiles.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 9. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Delta aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/delta` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
