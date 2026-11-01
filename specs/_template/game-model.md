# Modèle de jeu : <Titre du jeu>

> Modèle à copier dans `specs/<slug>/`. Décrit les données du jeu indépendamment du rendu : c'est le contrat de `src/games/<slug>/logic/`.

## Entités

> Éléments du jeu (pièces, cases, ennemis...), avec leurs attributs et leurs valeurs possibles.

## État de jeu

> Structure de l'état d'une partie en cours (indicatif en TypeScript si utile). Ce qui est conservé pour l'annulation, le cas échéant.

## Transitions

> Actions du joueur et événements, et leur effet sur l'état. Algorithmes de résolution quand ils ne sont pas triviaux (ordre de traitement, cas limites).

## Contenu

> Niveaux ou contenu du jeu : format d'encodage, emplacement des fichiers, identifiants stables, liste ou principes de construction. Dépendance éventuelle à la langue.

## Données persistées

> Contenu de `data` dans l'enveloppe commune (voir "Persistance" dans `data-model.md`), numéro de version, migrations.

## Contraintes de validation

> Règles vérifiées par les tests sur le contenu (validité, résolubilité des niveaux...).
