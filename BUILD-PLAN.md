# Plan de construction incrémental

Douze étapes pour le site, chacune démontrable dans un navigateur avant de passer à la suivante, plus un plan par jeu. Voir `CLAUDE.md` pour la structure de `specs/` et les règles d'usage des spécifications.

Les étapes 4 à 10 s'appuient sur un jeu de test jetable (`sandbox`, voir étape 4), qui permet de construire et d'éprouver le socle des jeux sans dépendre d'un vrai jeu. L'étape 11 le retire. Le premier vrai jeu, Tilt, est construit selon son propre plan, puis le site est déployé (étape 12).

Ordre global : étapes 1 à 11, Tilt, étape 12, Prism.

## 1. Squelette Astro + chrome commun

Projet Astro, tokens de la charte, polices, icônes, en-tête et pied de page fixe sur une page vide. Voir "Stack technique" et "Structure des fichiers" dans `technical-specifications.md`, et `style-guide.md` ("Couleurs", "Typographie", "Espacements, grille et responsive", "En-tête", "Pied de page").

**Critère :** `astro dev` tourne ; l'en-tête et le pied de page fixe respectent la charte, sur mobile et sur desktop.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 du plan de construction (BUILD-PLAN.md) : squelette Astro et chrome commun.

Initialise le projet Astro en TypeScript strict (voir "Stack technique" et "Dépendances" dans
specs/technical-specifications.md : versions exactes, dernière version stable de chaque
package).

Crée src/styles/tokens.css et global.css (tous les tokens de specs/style-guide.md), les
polices hébergées dans public/fonts/ avec leur licence ("Polices" dans
technical-specifications.md), les icônes Lucide listées dans "Iconographie" (style-guide.md)
dans src/icons/ avec le composant Icon.astro, puis BaseLayout.astro, Header.astro (logo-texte,
sélecteur de langue visuel, pas encore fonctionnel) et Footer.astro (pied de page fixe).

Crée une page de test minimale (src/pages/index.astro). Rien au-delà de cette étape.

Critère de fin : astro dev tourne, l'en-tête et le pied de page s'affichent conformes à la
charte, sur mobile et sur desktop.
```

## 2. Outillage qualité et CI

Vérification des types, Vitest, workflow GitHub Actions sans déploiement. Voir "Hébergement et déploiement" et "Tests" dans `technical-specifications.md`.

**Critère :** `astro check`, `vitest run` et `astro build` passent en local et dans une pull request.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 du plan de construction (BUILD-PLAN.md) : outillage qualité et CI.

Ajoute @astrojs/check et vitest (versions exactes, voir "Dépendances" dans
specs/technical-specifications.md), les scripts npm correspondants, la config TypeScript
stricte avec noUncheckedIndexedAccess ("JavaScript : conventions"), un premier test trivial
pour valider la config Vitest, et .github/workflows/ci.yml avec le job de vérification (types,
tests, build) sur pull request et push. Pas encore de job de déploiement (étape 12).

Critère de fin : les trois commandes passent en local ; le workflow passe sur une pull request.
```

## 3. Multilingue

Routage `/` et `/fr/`, textes d'interface, sélecteur de langue fonctionnel, vues partagées entre les deux langues. Voir "Multilingue" dans `functional-specifications.md`, "Structure des URLs" et "Textes d'interface" dans `technical-specifications.md`.

**Critère :** la page de test existe en `/` et `/fr/`, le sélecteur passe de l'une à l'autre, le pied de page est traduit.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 3 du plan de construction (BUILD-PLAN.md) : multilingue.

Configure l'i18n d'Astro ("Structure des URLs" dans specs/technical-specifications.md), crée
src/i18n/en.json, fr.json et index.ts ("Textes d'interface"), le pattern pages -> views
("Structure des fichiers"), et rends le sélecteur de langue fonctionnel (même page dans l'autre
langue, voir "Multilingue" dans specs/functional-specifications.md et "En-tête" dans
specs/style-guide.md). Mets <html lang> à jour.

Critère de fin : / et /fr/ s'affichent dans leur langue, le sélecteur bascule de l'une à l'autre.
```

## 4. Content collection et jeu de test

Collection `games`, validation du contenu, jeu de test `sandbox` jetable. Voir "Jeu" et "Contraintes et règles de validation" dans `data-model.md`, "Schéma des content collections" et "Validation du contenu" dans `technical-specifications.md`.

**Critère :** le build passe avec `sandbox` ; retirer un champ requis ou la couverture fait échouer le build ou les tests.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 4 du plan de construction (BUILD-PLAN.md) : content collection et jeu de test.

Crée src/content.config.ts ("Schéma des content collections" dans
specs/technical-specifications.md, attributs de "Jeu" dans specs/data-model.md) et
src/content/content.test.ts pour les contrôles entre fichiers ("Validation du contenu").

Ajoute un jeu de test jetable, slug sandbox : src/content/games/sandbox.en.md et .fr.md (avec
les sections "How to play" et "Controls"), public/covers/sandbox.webp, src/games/sandbox/index.ts
(une GameDefinition vide à ce stade) et src/games/sandbox/i18n/. Marque-le explicitement comme
contenu jetable à retirer à l'étape 11.

Critère de fin : astro build et vitest run passent ; retire volontairement un champ requis
puis la couverture, vérifie que l'un ou l'autre échoue, puis remets-les.
```

## 5. Page d'accueil

Voir `home-page.md`, "Tuiles" et "Badge de genre" dans `style-guide.md`.

**Critère :** la tuile de `sandbox` s'affiche dans les deux langues et mène à sa page ; l'état "catalogue vide" s'affiche si l'on retire temporairement le jeu.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 5 du plan de construction (BUILD-PLAN.md) : page d'accueil.

Construis HomePage.astro et GameCard.astro en suivant specs/home-page.md (introduction, grille,
tri alphabétique par langue, chargement différé des couvertures, catalogue vide) et
specs/style-guide.md ("Tuiles", "Badge de genre").

Critère de fin : la tuile de sandbox s'affiche à l'accueil dans les deux langues et mène à
/sandbox/ (même si la page n'existe pas encore) ; l'état vide s'affiche sans jeu.
```

## 6. Page de jeu : mode hors partie

Titre, accroche, bouton "Play", règles, tableau des contrôles, message sans JavaScript. Voir "Mode hors partie" et "États" dans `game-page.md`.

**Critère :** `/sandbox/` et `/fr/sandbox/` affichent la fiche complète ; le bouton "Play" est présent mais inactif.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 6 du plan de construction (BUILD-PLAN.md) : page de jeu, mode hors partie.

Construis GamePage.astro et les routes [slug].astro (deux langues) en suivant "Mode hors
partie" dans specs/game-page.md : titre, badge, accroche, bouton Play (pas encore branché),
règles issues du corps Markdown, tableau des contrôles stylé, message <noscript>. Pas encore
de sélecteur de niveaux ni d'hôte de jeu.

Critère de fin : /sandbox/ et /fr/sandbox/ affichent la fiche complète, conforme à la charte.
```

## 7. Hôte de jeu : contrat et cycle de vie

Chargement du module, modes en partie, pause et fin de niveau, HUD, panneaux, raccourcis communs, pause automatique, gestion du focus, plein écran. `sandbox` devient un jeu minimal qui exerce tout le contrat.

**Critère :** avec `sandbox`, on enchaîne Play, partie, pause (bouton, `Échap`, changement d'onglet), reprise, recommencer, fin de niveau et retour, au clavier comme au tactile ; le chrome se masque et réapparaît comme décrit dans `game-page.md`.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 7 du plan de construction (BUILD-PLAN.md) : hôte de jeu.

Crée src/games/shell/ ("Hôte de jeu" et "Contrat d'un jeu" dans
specs/technical-specifications.md) et les composants src/components/game-ui/ (HUD, panneaux de
pause et de fin, voir "Interface commune des jeux" dans specs/style-guide.md). Implémente les
modes de specs/game-page.md ("Modes de la page", "Mode en partie", "Pause", "Fin de niveau",
états de chargement et d'erreur), les raccourcis communs, la pause automatique, la gestion du
focus et des annonces ("Accessibilité" dans technical-specifications.md), le plein écran.

Fais de sandbox un jeu minimal à trois niveaux qui exerce tout le contrat (par exemple :
appuyer sur Espace ou toucher l'aire de jeu N fois pour finir le niveau N, avec une action
"undo" et une statistique dans le HUD). Pas encore de stockage ni de son (étape 8).

Critère de fin : tout le cycle de vie fonctionne avec sandbox, au clavier et au tactile, sur
desktop et sur mobile.
```

## 8. Services communs : stockage, son, niveaux

Enveloppe de stockage versionnée, préférences, service audio, sélecteur de niveaux, réinitialisation de la progression. Voir "Persistance" dans `data-model.md`, "Son" et "Persistance" dans `functional-specifications.md`, "Sélecteur de niveaux" dans `game-page.md`.

**Critère :** la progression de `sandbox` survit à un rechargement ; le réglage "Son" est conservé ; la réinitialisation fonctionne ; le site reste utilisable avec `localStorage` bloqué.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 8 du plan de construction (BUILD-PLAN.md) : services communs.

Dans src/games/shell/ : service de stockage (enveloppe versionnée, clés play:, migrations,
stockage indisponible, voir "Persistance" dans specs/data-model.md) avec ses tests Vitest ;
préférences du joueur (sound) ; service audio (AudioContext créé au premier Play, nœud de
sortie coupé selon le réglage, suspendu en pause, voir "Son" dans
specs/functional-specifications.md). Ajoute le sélecteur de niveaux et la réinitialisation
avec confirmation (specs/game-page.md, "Sélecteur de niveaux" dans specs/style-guide.md).

Fais sauvegarder sa progression à sandbox et jouer un son simple, pour exercer ces services.

Critère de fin : progression et réglage du son conservés après rechargement ; réinitialisation
fonctionnelle ; aucun plantage avec localStorage bloqué.
```

## 9. Page "About" et licences

Voir `about-page.md`.

**Critère :** `/about/` et `/fr/about/` affichent toutes les sections ; le lien "License" du pied de page mène à l'ancre `#license` ; le fichier `LICENSE` (MIT) existe à la racine.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 9 du plan de construction (BUILD-PLAN.md) : page About et licences.

Crée src/content/pages/about.en.md et about.fr.md, AboutPage.astro et les routes, en suivant
specs/about-page.md (sections, ancres, crédits des polices et des icônes). Ajoute le fichier
LICENSE (MIT) à la racine. Branche les liens du pied de page, y compris le lien "Created by" (voir "Pied de page"
dans specs/style-guide.md).

Critère de fin : la page s'affiche dans les deux langues, les liens du pied de page mènent aux
bonnes ancres.
```

## 10. SEO et accessibilité

Meta, liens alternatifs, Open Graph, sitemap, robots, lien d'évitement, audit. Voir "SEO" et "Accessibilité" dans `technical-specifications.md`.

**Critère :** chaque page a ses meta et ses liens `hreflang` ; `sitemap.xml` liste toutes les pages des deux langues ; Lighthouse (mobile) au-dessus de 90 en accessibilité, bonnes pratiques et SEO sur l'accueil, `/sandbox/` et `/about/`.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 10 du plan de construction (BUILD-PLAN.md) : SEO et accessibilité.

Ajoute dans BaseLayout les éléments de "SEO" (specs/technical-specifications.md) : title,
description, canonical, hreflang, Open Graph, Twitter Card, avec public/og-image.png
("Image de partage par défaut" dans specs/style-guide.md). Crée src/pages/sitemap.xml.ts et
public/robots.txt. Ajoute le lien d'évitement et vérifie tous les points de "Accessibilité"
(technical-specifications.md), en particulier la gestion du focus de l'hôte de jeu.

Critère de fin : Lighthouse mobile au-dessus de 90 en accessibilité, bonnes pratiques et SEO
sur /, /sandbox/ et /about/, dans les deux langues.
```

## 11. Retrait du jeu de test

**Critère :** plus aucune trace de `sandbox` ; l'accueil affiche l'état "catalogue vide" ; build et tests passent.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 11 du plan de construction (BUILD-PLAN.md) : retrait du jeu de test.

Supprime tout ce qui concerne sandbox (contenu, couverture, src/games/sandbox/, traductions,
références éventuelles). Vérifie qu'aucun code du socle n'en dépendait.

Critère de fin : grep -ri sandbox ne renvoie plus rien hors de BUILD-PLAN.md ; l'accueil
affiche l'état vide ; astro build et vitest run passent.
```

## Jeux

Chaque jeu a son plan et son statut dans son dossier de specs. Cette liste donne seulement l'ordre de construction.

1. **Tilt** : `specs/tilt/BUILD-PLAN.md`. Prérequis : étapes 1 à 11.
2. **Prism** : `specs/prism/BUILD-PLAN.md`. Prérequis : Tilt fusionné et étape 12.

## 12. Déploiement

Job de déploiement GitHub Pages, domaine personnalisé. Voir "Hébergement et déploiement" dans `technical-specifications.md`.

Prérequis : Tilt fusionné sur `main`, pour ne pas publier un catalogue vide.

**Critère :** un push sur `main` déploie le site sur `https://play.heubes.io` en HTTPS ; un test en échec bloque le déploiement.

**Statut :** à faire.

**Prompt :**
```
Implémente l'étape 12 du plan de construction (BUILD-PLAN.md) : déploiement.

Ajoute le job de déploiement à .github/workflows/ci.yml (sur push sur main uniquement, après
le job de vérification, voir "Hébergement et déploiement" dans
specs/technical-specifications.md) et public/CNAME. Liste-moi les réglages à faire côté GitHub
(Pages : source GitHub Actions, domaine, HTTPS) et côté DNS (enregistrement CNAME), que je ferai
moi-même.

Critère de fin : le site est servi sur https://play.heubes.io ; un test volontairement cassé
sur une branche bloque le workflow.
```
