# Modèle de données

Ce fichier décrit les entités du site et les conventions communes de persistance. L'état de jeu, les niveaux et le format de sauvegarde propres à un jeu sont décrits dans son `game-model.md`.

## Entités

### Jeu

Un jeu publié dans le catalogue. Chaque jeu est décrit par deux fichiers de contenu, un par langue (voir "Organisation des fichiers").

| Attribut | Type | Traduit | Description |
|---|---|---|---|
| `slug` | string | non | Identifiant unique en anglais, kebab-case. Dérivé du nom des fichiers de contenu. C'est aussi le nom du dossier de specs et du dossier de code du jeu. |
| `title` | string | oui | Titre du jeu, 30 caractères maximum. Peut être identique dans les deux langues. |
| `tagline` | string | oui | Accroche d'une phrase, 90 caractères maximum. Affichée sur la tuile du catalogue et sous le titre de la page du jeu, reprise en meta description. |
| `genre` | Genre | non | Genre du jeu (voir "Genre"). |
| `cover` | image | non | Image de couverture, `public/covers/<slug>.webp` (voir "Images de couverture" dans `style-guide.md`). |
| corps du fichier | Markdown | oui | Règles du jeu, avec deux sections obligatoires : "How to play" / "Comment jouer" et "Controls" / "Contrôles" (voir `game-page.md`). |

Slugs réservés, interdits pour un jeu parce qu'ils entrent en conflit avec des routes du site : `about`, `fr`, `en`, `covers`, `fonts`.

### Genre

Liste fermée. Ajouter un genre impose de le déclarer d'abord ici, avec ses libellés dans les deux langues.

| Valeur | Libellé anglais | Libellé français |
|---|---|---|
| `puzzle` | Puzzle | Réflexion |
| `platformer` | Platformer | Plateforme |
| `hack-and-slash` | Hack 'n' slash | Hack 'n' slash |
| `point-and-click` | Point & click | Point & click |
| `action-adventure` | Action-adventure | Action-aventure |
| `real-time-strategy` | Real-time strategy | Stratégie en temps réel |

### Préférences du joueur

Réglages communs à tous les jeux, sauvegardés dans le navigateur.

| Attribut | Type | Défaut | Description |
|---|---|---|---|
| `sound` | boolean | `true` | Son activé ou coupé (voir "Son" dans `functional-specifications.md`). |

### Sauvegarde d'un jeu

Données persistées par un jeu (progression, meilleurs résultats). Leur contenu est propre à chaque jeu et décrit dans la section "Données persistées" de son `game-model.md`. Leur enveloppe est commune (voir "Persistance").

### Statut d'un niveau

Pour les jeux à niveaux, le sélecteur de niveaux commun (voir `game-page.md`) affiche chaque niveau avec l'un de ces statuts, calculés par le jeu à partir de sa sauvegarde :

| Valeur | Signification |
|---|---|
| `locked` | Pas encore accessible. |
| `available` | Accessible, jamais terminé. |
| `completed` | Terminé au moins une fois. |
| `perfect` | Terminé avec le résultat optimal. Chaque jeu définit ce qu'est un résultat optimal. |

## Persistance

### Conventions générales

- Stockage : `localStorage`, une clé par jeu et une clé pour les préférences.
- Clés : préfixe `play:`, suivi de `settings` pour les préférences ou du slug du jeu (`play:tilt`).
- Valeur : JSON, toujours enveloppé avec un numéro de version : `{ "version": 1, "data": { ... } }`.
- Lecture : une valeur illisible, de version inconnue ou non migrable est ignorée et remplacée par l'état initial à la prochaine écriture.
- Migration : quand le format de `data` change, le jeu incrémente `version` et fournit une migration depuis la version précédente si la progression mérite d'être conservée. Sinon, l'ancienne sauvegarde est ignorée.
- Un jeu n'accède jamais directement à `localStorage` : il passe par le service de stockage fourni par l'hôte de jeu (voir "Contrat d'un jeu" dans `technical-specifications.md`), qui applique ces conventions et gère l'indisponibilité du stockage.

### Réinitialisation

La réinitialisation de la progression d'un jeu (voir `game-page.md`) supprime sa clé `play:<slug>`. Elle ne touche ni aux préférences ni aux autres jeux.

## Organisation des fichiers

- Contenu d'un jeu : `src/content/games/<slug>.en.md` et `src/content/games/<slug>.fr.md`. Le frontmatter porte `title`, `tagline`, `genre` (identique dans les deux fichiers) ; le corps porte les règles.
- Couverture : `public/covers/<slug>.webp`.
- Code du jeu : `src/games/<slug>/` (voir "Structure des fichiers" dans `technical-specifications.md`).
- Specs du jeu : `specs/<slug>/`.
- Textes d'interface du jeu : `src/games/<slug>/i18n/en.json` et `fr.json`, mêmes clés dans les deux fichiers.
- Contenu de la page "About" : `src/content/pages/about.en.md` et `about.fr.md`.

## Contraintes et règles de validation

Vérifiées automatiquement, la CI échoue en cas d'écart (voir "Validation du contenu" dans `technical-specifications.md`) :

- chaque jeu a ses deux fichiers de contenu (`.en.md` et `.fr.md`), avec les mêmes `genre` ;
- `title` et `tagline` respectent leur longueur maximale ;
- `genre` appartient à la liste fermée ;
- le slug est en kebab-case et n'est pas réservé ;
- `public/covers/<slug>.webp` et `src/games/<slug>/index.ts` existent ;
- les fichiers `i18n/en.json` et `i18n/fr.json` d'un jeu ont exactement les mêmes clés ;
- deux jeux n'ont pas le même titre dans une même langue.

Les contraintes propres au contenu d'un jeu (validité des niveaux, par exemple) sont décrites dans son `game-model.md` et vérifiées par ses tests.

## Workflow d'ajout d'un jeu

1. Copier `specs/_template/` vers `specs/<slug>/` et rédiger les cinq fichiers. Faire valider les specs avant toute ligne de code.
2. Créer la branche du jeu.
3. Suivre `specs/<slug>/BUILD-PLAN.md`, dont la première étape est la logique pure et ses tests, et la dernière la fusion sur `main`.
4. Ajouter le jeu à la section "Jeux" de `BUILD-PLAN.md` dès la création du dossier de specs.
5. Si le jeu utilise des assets tiers, les ajouter aux crédits de la page "About" (voir `about-page.md`).
