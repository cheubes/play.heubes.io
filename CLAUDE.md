# play.heubes.io

Catalogue de mini jeux web originaux, jouables dans le navigateur au clavier et à la souris sur desktop, et au tactile sur mobile. Site statique, bilingue (anglais par défaut, français), généré avec Astro et hébergé sur GitHub Pages.

## État du projet

L'implémentation du site suit `BUILD-PLAN.md`, qui définit l'ordre en étapes incrémentales. Chaque jeu a son propre plan, `specs/<game-slug>/BUILD-PLAN.md`, référencé depuis la section "Jeux" du plan général. `specs/` reste la source de vérité pour toute décision de conception : avant d'écrire ou de modifier du code, lire les fichiers de specs concernés par la tâche.

Les fichiers `BUILD-PLAN.md` décrivent l'ordre de construction et l'avancement : ce ne sont pas des specs. Ils renvoient aux specs, ils ne les complètent pas.

## Structure de `specs/`

- **`functional-specifications.md`** : contexte, périmètre, utilisateurs cibles, parcours utilisateurs, règles transverses (multilingue, navigation, contrôles, son, persistance, mouvement réduit), hors périmètre.
- **`data-model.md`** : entités du site (Jeu, Genre, Préférences du joueur, Sauvegarde d'un jeu), organisation des fichiers de contenu, conventions de persistance, contraintes de validation, workflow d'ajout d'un jeu.
- **`technical-specifications.md`** : stack technique, hébergement et déploiement, architecture (routage, content collections, hôte de jeu), contrat commun à tous les jeux, tests, performance, accessibilité, SEO, conventions de code.
- **`style-guide.md`** : charte graphique (couleurs, typographie, espacements, animations), composants du site (en-tête, pied de page, tuiles) et interface commune des jeux (HUD, panneaux, sélecteur de niveaux), ce qu'un jeu peut ou ne peut pas redéfinir.
- **`home-page.md`** : page d'accueil (catalogue).
- **`about-page.md`** : page "About" (présentation, licences, crédits).
- **`not-found-page.md`** : page 404 (en anglais seulement).
- **`game-page.md`** : gabarit commun d'une page de jeu (modes hors partie et en partie, pause, fin de niveau, sélecteur de niveaux, plein écran).
- **`_template/`** : modèle de dossier de jeu, à copier pour spécifier un nouveau jeu. Il fixe les fichiers et les sections obligatoires.
- **`<game-slug>/`** : un dossier par jeu, avec :
  - `functional-specifications.md` : concept, règles, contrôles (clavier, souris et tactile), progression, écrans, critères d'acceptation.
  - `game-model.md` : état de jeu, contenu (niveaux et leur encodage), données persistées, contraintes de validation.
  - `technical-specifications.md` : choix de rendu, découpage logique / rendu, animations, contraintes propres au jeu, nouvelles dépendances éventuelles.
  - `style-guide.md` : direction artistique de l'aire de jeu (palette, formes, animations, sons, assets tiers).
  - `BUILD-PLAN.md` : étapes de construction du jeu, de la logique pure à la fusion sur `dev`.

Sept dossiers `<game-slug>/` existent à ce stade : `tilt/`, `prism/`, `fold/`, `delta/`, `leap/`, `slash/` et `coffer/`.

## Quand et comment utiliser ces specs

- **Avant toute implémentation**, lire le ou les fichiers concernés par la tâche. Les huit specs générales (`functional-specifications.md`, `data-model.md`, `technical-specifications.md`, `style-guide.md`, `home-page.md`, `about-page.md`, `not-found-page.md`, `game-page.md`) s'appliquent à tout le site ; chaque dossier `<game-slug>/` complète avec ce qui est propre à ce jeu.
- **Les fichiers se référencent constamment entre eux** ("voir `X.md`") plutôt que de dupliquer l'information. Suivre ces renvois plutôt que de deviner : si une spec mentionne une règle définie ailleurs (le contrat d'un jeu, une couleur de la charte...), la source de vérité est le fichier référencé.
- **Les critères d'acceptation** d'une spec de jeu sont le contrat de vérification : ceux qui portent sur la logique de jeu sont couverts par des tests, les autres sont vérifiés dans le navigateur (voir "Tests" dans `technical-specifications.md`).
- **En cas de modification d'une spec**, chercher les autres fichiers qui la référencent (`grep` du nom de fichier dans `specs/`) et vérifier qu'ils restent cohérents avec le changement. Une modification d'une spec générale qui touche le contrat des jeux impose de relire `_template/` et chaque dossier de jeu.
- **En cas de doute ou de silence des specs** sur un point nécessaire à l'implémentation, demander plutôt que de supposer : ce sont des choix de conception, pas des détails d'implémentation libres.
- **En cas de contradiction** entre le code et une spec, la spec fait foi ; si l'implémentation révèle qu'une spec doit changer, mettre à jour la spec et expliquer pourquoi, plutôt que de s'en écarter silencieusement dans le code.

## Avant chaque commit

- **Vérifier l'ensemble des fichiers de `specs/`** pour cohérence, pas seulement ceux directement modifiés par ce commit.
- **Si une ou plusieurs specs doivent être ajustées** (pour rester cohérentes entre elles, ou avec le changement en cours), bloquer le commit : proposer les mises à jour nécessaires et attendre validation avant de les appliquer, puis de committer.
- **Mettre à jour `BUILD-PLAN.md`** (général ou du jeu concerné) si nécessaire (état d'avancement).
- **Mettre à jour `README.md`** si nécessaire.

## Conventions établies

- Le contenu des specs (`specs/`, les `BUILD-PLAN.md`, ce fichier) est en français : ce sont des documents de conception, pas de la documentation au sens des règles globales. `README.md` reste en anglais.
- Les noms de fichiers, dossiers, attributs de données et identifiants techniques sont en anglais, en kebab-case (slugs, données, classes CSS) ou en PascalCase pour les composants Astro (voir "Conventions de nommage" dans `technical-specifications.md`).
- Les couleurs et composants de la charte graphique sont définis une seule fois, dans `style-guide.md` : ne pas introduire de nouvelles valeurs de couleur ou de nouveaux styles de composants ailleurs sans les y ajouter d'abord. Seule exception : la palette de l'aire de jeu, définie dans le `style-guide.md` du jeu.
- Toute nouvelle dépendance (moteur de rendu, librairie, package npm) propre à un jeu est documentée dans le `technical-specifications.md` de ce jeu et discutée avant ajout (voir les règles globales de sécurité du projet).
- Un nouveau jeu commence par la copie de `specs/_template/` et la rédaction complète de ses specs, validées avant toute ligne de code. Il est développé sur sa propre branche, créée depuis `dev`, et fusionné sur `dev` une fois jouable. `dev` est fusionné sur `main` pour publier : un jeu présent sur `main` est publié.
