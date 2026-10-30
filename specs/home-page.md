# Page d'accueil

## Objectif

Présenter le catalogue des jeux et permettre d'en lancer un en un clic. La page doit faire comprendre en un coup d'œil ce qu'est le site : des mini jeux originaux, jouables tout de suite dans le navigateur.

## Contenu et structure

1. En-tête et pied de page communs (voir `style-guide.md`).
2. Introduction courte : un titre (`h1`) et une phrase de présentation du site, dans `src/i18n/`.
   - Anglais : "Original mini games" / "Small games made for the web. No install, no account: pick one and play."
   - Français : "Mini jeux originaux" / "Des petits jeux conçus pour le web. Rien à installer, pas de compte : choisis-en un et joue."
3. Grille de tuiles, une par jeu (voir "Tuiles" dans `style-guide.md`) : couverture, titre, accroche, badge de genre.

Ordre des tuiles : alphabétique sur le titre, dans la langue de la page (comparaison avec `Intl.Collator` de la langue, insensible à la casse et aux accents).

## Interactions

- Toute la tuile est un lien vers la page du jeu, dans la langue courante.
- Pas de filtre, de tri ni de recherche (voir "Hors périmètre" dans `functional-specifications.md`).

## États

- **Chargement** : la page est statique, les trois premières couvertures (une rangée complète sur la grille la plus large) sont chargées immédiatement, les suivantes en différé (`loading="lazy"`), avec des dimensions fixées pour éviter les décalages de mise en page.
- **Catalogue vide** : l'introduction reste affichée, suivie d'un message "New games are on the way." / "De nouveaux jeux arrivent bientôt."
- **Couverture manquante** : impossible en production (validation, voir `data-model.md`).

## Responsive

Grille d'une colonne sur mobile, deux à partir de 640px, trois à partir de 1024px (voir `style-guide.md`).
