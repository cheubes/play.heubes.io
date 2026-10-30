# Modèle de jeu : Prism

Contrat de `src/games/prism/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation.

## Entités

### Couleurs

Une couleur est un ensemble de primaires, représenté par un masque de bits : rouge = 1, vert = 2, bleu = 4.

| Nom (`ColorName`) | Masque |
|---|---|
| `red` | 1 |
| `green` | 2 |
| `blue` | 4 |
| `yellow` | 3 |
| `magenta` | 5 |
| `cyan` | 6 |
| `white` | 7 |

Les niveaux utilisent les noms ; la logique travaille sur les masques.

### Directions et positions

`Direction` : `up`, `down`, `left`, `right`. `Position` : `row`, `col`, entiers à partir de 0, origine en haut à gauche.

### Éléments

Chaque élément a un `id` (dérivé de sa position : `e-<row>-<col>`) et une position.

| Type | Attributs |
|---|---|
| `wall` | |
| `source` | `color`, `direction` |
| `target` | `color` |
| `mirror` | `orientation` (`slash` ou `backslash`, état initial), `fixed` (défaut `false`) |
| `prism` | `spin` (`left` ou `right` : côté vers lequel le rouge est dévié, relativement à la direction du faisceau ; état initial), `fixed` (défaut `false`) |
| `filter` | `color` |

### Niveau

`id`, `rows`, `cols`, `elements`, `par`. Un niveau a au moins une source, au moins une cible, et au plus 14 éléments orientables.

## État de jeu

```ts
interface PrismState {
  toggled: ReadonlySet<string>;   // id des éléments orientables dans l'état opposé à leur état initial
  moves: number;
  history: ReadonlySet<string>[]; // valeurs précédentes de toggled, la plus récente en dernier
}
```

L'état est immuable : chaque transition retourne un nouvel état. Représenter l'état par l'ensemble des éléments basculés simplifie le solveur : le par est la taille minimale d'un tel ensemble qui résout le niveau.

## Transitions

```ts
createState(level: Level): PrismState
toggle(level: Level, state: PrismState, position: Position): PrismState   // inchangé (même référence) si rien d'orientable
undo(state: PrismState): PrismState
restart(level: Level): PrismState
computeBeams(level: Level, state: PrismState): BeamResult
isSolved(level: Level, state: PrismState): boolean

interface BeamResult {
  steps: BeamStep[];                       // pour le rendu
  received: Record<string, number>;        // id de cible -> masque reçu
  lit: Record<string, boolean>;            // id de cible -> allumée
}

interface BeamStep {
  from: Position;          // case de départ du tronçon
  direction: Direction;
  color: number;           // masque
  end: 'cell' | 'blocked'; // 'cell' : jusqu'au centre de la case suivante ; 'blocked' : jusqu'au bord de la case (mur, source, bord du plateau)
}
```

### Calcul des faisceaux

File de travail de triplets (position, direction, couleur), initialisée avec chaque source (sa position, sa direction, sa couleur). Pour chaque triplet :

1. S'il a déjà été traité, l'ignorer (règle 9).
2. Calculer la case suivante dans la direction.
3. Hors du plateau, mur ou source : enregistrer un tronçon `blocked` et s'arrêter.
4. Sinon, enregistrer un tronçon `cell`, puis selon le contenu de la case suivante :
   - vide : ajouter (case suivante, même direction, même couleur) ;
   - cible : ajouter la couleur à la couleur reçue par la cible, s'arrêter ;
   - miroir : ajouter (case suivante, direction réfléchie, même couleur) ;
   - prisme : pour chaque primaire de la couleur, ajouter (case suivante, direction de cette primaire, primaire seule) ;
   - filtre : si l'intersection avec la couleur du filtre est non vide, ajouter (case suivante, même direction, intersection).

Table de réflexion :

| Direction d'arrivée | Miroir `/` | Miroir `\` |
|---|---|---|
| `right` | `up` | `down` |
| `left` | `down` | `up` |
| `up` | `right` | `left` |
| `down` | `left` | `right` |

Prisme : le vert garde la direction. Avec `spin: 'left'`, le rouge tourne d'un quart de tour à gauche de la direction (pour `right` : `up`) et le bleu à droite (pour `right` : `down`). Avec `spin: 'right'`, c'est l'inverse.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/prism/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                 // kebab-case, stable : clé de sauvegarde
  par: number;
  rows: number;
  cols: number;
  elements: ElementSource[];  // { type, at: [row, col], ...attributs du type }
}
```

Exemple (niveau d'introduction, par 1) :

```ts
{
  id: 'first-light',
  par: 1,
  rows: 5,
  cols: 5,
  elements: [
    { type: 'source', at: [0, 0], color: 'red', direction: 'right' },
    { type: 'mirror', at: [0, 3], orientation: 'slash' },
    { type: 'target', at: [4, 3], color: 'red' },
  ],
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` énumère tous les sous-ensembles d'éléments orientables à faire basculer (au plus 2^14) et retient la taille du plus petit sous-ensemble qui résout le niveau : c'est le par. Il n'est utilisé que par les tests.

## Données persistées

Clé `play:prism`, version 1, même forme que Tilt :

```ts
interface PrismSave {
  best: Record<string, number>;   // id de niveau -> plus petit nombre de coups
}
```

Le statut des niveaux se déduit de `best` et du `par`, avec les mêmes règles que Tilt. La logique de progression est commune aux deux jeux et vit dans `src/games/shell/` (voir l'étape 1 de `BUILD-PLAN.md`).

## Contraintes de validation

Vérifiées par les tests (AC-12) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ;
- `rows` et `cols` entre 5 et 8 ; chaque élément dans le plateau, au plus un élément par case ;
- au moins une source et une cible ; au plus 14 éléments orientables ;
- couleurs et directions valides ;
- l'état initial n'est pas résolu ;
- le solveur trouve une solution, et `par` est égal au nombre minimal de bascules.
