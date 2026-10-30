# Page "About"

## Objectif

Expliquer ce qu'est le site, qui l'a fait, sous quelles licences le code et les contenus sont publiés, et créditer les ressources tierces.

## Accès

- Lien "About" / "À propos" du pied de page : `/about/` ou `/fr/about/`.
- Lien "License" / "Licence" du pied de page : même page, ancre `#license`.

## Contenu et structure

Contenu rédigé en Markdown dans `src/content/pages/about.en.md` et `about.fr.md`, mêmes sections et mêmes ancres dans les deux langues.

1. **Titre** (`h1`) : "About" / "À propos".
2. **Le site** : des mini jeux originaux, conçus pour le web, solo, jouables au clavier et au tactile, sans compte ni suivi. La progression reste dans le navigateur du joueur.
3. **Auteur** : Christophe Heubès, avec un lien vers son site, https://christophe.heubes.org/.
4. **Licences** (ancre `#license`) :
   - code : MIT, avec un lien vers le fichier `LICENSE` du dépôt ;
   - assets et textes originaux (graphismes, sons, textes des jeux et du site) : CC BY-NC-SA 4.0, avec un lien vers le texte de la licence ;
   - les ressources tierces restent sous leur propre licence (voir "Crédits").
5. **Crédits** (ancre `#credits`) : une ligne par ressource tierce, avec son nom, son auteur, un lien vers sa source et sa licence. Au départ : les polices Chakra Petch et Inter (SIL Open Font License) et les icônes Lucide (ISC). Les assets tiers d'un jeu y sont ajoutés quand le jeu est fusionné, regroupés sous le titre du jeu.
6. **Code source** : lien vers le dépôt GitHub.

### Règle sur les assets tiers

Seules les ressources sous CC0 ou CC BY (et, pour les polices et le code, sous licence permissive : OFL, MIT, ISC, Apache 2.0) sont acceptées. Les licences avec clause NC ou SA de tiers sont exclues, pour ne pas contraindre la licence du site. Chaque asset tiers d'un jeu est d'abord déclaré dans la section "Assets tiers" de son `style-guide.md`.

## Format

Page de texte simple, colonne de 68 caractères au plus, titres de section en `h2` avec ancres.

## États

Page statique, sans état particulier.

## Responsive

Une seule colonne à toutes les tailles, marges du conteneur commun.
