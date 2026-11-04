# Plan de construction : Lantern

Neuf étapes, chacune démontrable avant de passer à la suivante. Specs du jeu : `functional-specifications.md`, `game-model.md`, `technical-specifications.md`, `style-guide.md` de ce dossier.

Prérequis : specs du jeu validées, branche `game/lantern` créée depuis `dev`.

## 1. Simulation

**Critère :** AC-01 à AC-09 couverts par des tests ; `vitest run` passe.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 1 de specs/lantern/BUILD-PLAN.md : simulation de Lantern.

Crée src/games/lantern/logic/ (types.ts, level-parser.ts, light.ts, pathing.ts, shadows.ts,
lantern.ts) en suivant specs/lantern/game-model.md ("Déroulement d'un pas", "Lumière") et les
règles de specs/lantern/functional-specifications.md.

Écris les tests de AC-01 à AC-09 (noms préfixés par l'identifiant du critère), sur de petits
donjons construits dans les tests. Pas de rendu à cette étape.

Critère de fin : vitest run passe.
```

## 2. Solveur et donjons

**Critère :** AC-11 passe pour les 6 donjons, en moins de 10 secondes.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 2 de specs/lantern/BUILD-PLAN.md : solveur et donjons de Lantern.

Crée src/games/lantern/logic/solver.ts (voir "Solveur" dans specs/lantern/game-model.md) et
src/games/lantern/levels/levels.ts. Conçois 6 donjons selon "Progression" dans
specs/lantern/functional-specifications.md. Propose-moi d'abord le plan de chaque donjon
(carte des salles, chaîne d'objets et de portes, cachettes des éclats) et des critères de
difficulté mesurables (longueur du plus court chemin, plus long trajet sans recharge, nombre
d'ombres sur le chemin), et consigne ceux retenus, ainsi que tout ajustement des constantes,
dans "Points tranchés à l'implémentation" (specs/lantern/technical-specifications.md).

Écris le test AC-11 (toutes les "Contraintes de validation" de game-model.md).

Critère de fin : vitest run passe, le test AC-11 prend moins de 10 secondes.
```

## 3. Reprise d'un niveau dans le socle

Le socle gagne la reprise d'un niveau en cours (voir "Reprise d'un niveau" dans `game-page.md` et "Contrat d'un jeu" dans `technical-specifications.md`), si Coffer ne l'a pas déjà ajoutée ; sinon, cette étape se limite à la boucle commune, si besoin. Si Slash n'a pas encore extrait la boucle commune, elle est extraite ici, comme décrit à l'étape 4 de `specs/slash/BUILD-PLAN.md`.

**Critère :** les autres jeux fonctionnent comme avant ; un jeu de test qui signale un niveau en cours affiche la marque, "Resume" et la confirmation de recommencement.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 3 de specs/lantern/BUILD-PLAN.md : reprise d'un niveau dans le socle.

Dans src/games/shell/, src/components/game-ui/ et src/i18n/, ajoute la reprise d'un niveau en
cours selon "Reprise d'un niveau" dans specs/game-page.md, le champ inProgress de LevelEntry
("Contrat d'un jeu" dans specs/technical-specifications.md) et la marque du sélecteur
("Sélecteur de niveaux" dans specs/style-guide.md). Vérifie que les autres jeux ne sont pas
affectés.

Si src/games/shell/loop.ts n'existe pas encore, extrais d'abord la boucle commune comme décrit
à l'étape 4 de specs/slash/BUILD-PLAN.md, en me proposant les modifications de specs.

Critère de fin : vitest run passe ; les autres jeux vérifiés dans le navigateur ; la marque,
"Resume" et la confirmation vérifiées avec un niveau en cours simulé.
```

## 4. Rendu et lumière

**Critère :** "Play" affiche la première salle du donjon 1, éclairée selon `litCells` ; AC-15 et AC-16 vérifiés à la main.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 4 de specs/lantern/BUILD-PLAN.md : rendu de Lantern.

Crée src/games/lantern/index.ts (GameDefinition, actions "lantern" et "room"),
render/canvas.ts, render/draw.ts et lantern.css, en suivant "Rendu" et "Boucle de jeu" dans
specs/lantern/technical-specifications.md et specs/lantern/style-guide.md. Ajoute les icônes
flame et door-open à src/icons/ (voir "Iconographie" dans specs/style-guide.md). Crée le
fichier de contenu minimal (src/content/games/lantern.en.md et .fr.md) et une couverture
provisoire. Statistiques du HUD (huile, éclats).

Critère de fin : la page /lantern/ affiche une salle éclairée et sombre, avec la carte ; AC-15
et AC-16 vérifiés dans le navigateur, avec une salle de test qui contient tous les éléments, en
portrait et en paysage.
```

## 5. Contrôles et effets

**Critère :** AC-12 et AC-14 vérifiés à la main, sur desktop et sur mobile.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 5 de specs/lantern/BUILD-PLAN.md : contrôles et effets de Lantern.

Crée src/games/lantern/render/input.ts et render/effects.ts selon "Contrôles" et "Animations"
dans specs/lantern/technical-specifications.md. Ajoute les annonces de "Accessibilité" dans
specs/lantern/functional-specifications.md.

Critère de fin : AC-12 et AC-14 vérifiés dans le navigateur, desktop et mobile.
```

## 6. Progression, reprise et résultats

**Critère :** AC-10 couvert par des tests ; AC-13 et AC-17 vérifiés à la main ; la réinitialisation efface aussi les parties en cours.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 6 de specs/lantern/BUILD-PLAN.md : progression, reprise et résultats.

Crée src/games/lantern/logic/progress.ts (voir "Données persistées" dans
specs/lantern/game-model.md) et branche la reprise (voir "Reprise" dans
specs/lantern/technical-specifications.md), getLevels, complete() avec les résultats et
messages de "Statistiques et résultats" (specs/lantern/functional-specifications.md), et
l'animation de victoire. Écris les tests de AC-10.

Critère de fin : vitest run passe ; AC-13 et AC-17 vérifiés ; terminer un donjon déverrouille
le suivant, y compris après rechargement ; la réinitialisation remet le sélecteur à zéro et
efface les parties en cours.
```

## 7. Son

**Critère :** chaque son se déclenche au bon moment, respecte le réglage "Son" et se coupe en pause.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 7 de specs/lantern/BUILD-PLAN.md : sons de Lantern.

Crée src/games/lantern/render/sounds.ts selon "Son" (specs/lantern/technical-specifications.md)
et "Sons" (style-guide.md), connecté à context.audio.output().

Critère de fin : chaque son se déclenche au bon moment ; couper le son les coupe tous ; aucun
son pendant la pause.
```

## 8. Fiche du jeu et finitions

**Critère :** tous les critères [manuel] revérifiés sur un téléphone réel.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 8 de specs/lantern/BUILD-PLAN.md : fiche et finitions de Lantern.

Finalise src/content/games/lantern.en.md et .fr.md ("Textes" dans
specs/lantern/functional-specifications.md), les textes de src/games/lantern/i18n/, et la
couverture public/covers/lantern.webp ("Couverture" dans specs/lantern/style-guide.md).

Repasse sur tous les critères [manuel] (AC-12 à AC-17) sur desktop et sur un téléphone, joue
les 6 donjons en entier en notant le temps et les captures, et liste-moi ce qui reste à
corriger, y compris les salles trop dures, les passages fantômes introuvables et les donjons
hors de la fourchette de 8 à 15 minutes.

Critère de fin : tous les critères d'acceptation sont vérifiés.
```

## 9. Fusion sur `dev`

Relecture de cohérence de l'ensemble des specs (voir "Avant chaque commit" dans `CLAUDE.md`), mise à jour de "Points tranchés à l'implémentation", ajout de Lantern aux crédits de "About" s'il utilise des assets tiers (aucun prévu), fusion de `game/lantern` sur `dev`. Le jeu est publié à la prochaine fusion de `dev` sur `main`.

**Statut :** à faire.
