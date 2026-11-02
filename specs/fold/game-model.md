# Modèle de jeu : Fold

Contrat de `src/games/fold/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation.

## Entités

### Contenu d'une case

`Ink` : `vermilion`, `indigo`, `ochre`, `green`. Une case de la feuille de départ est du papier nu, une encre ou une découpe. Une position de la face visible est du papier nu, une encre ou vide.

Caractères d'encodage, communs à la feuille et au modèle :

| Caractère | Feuille de départ | Modèle |
|---|---|---|
| `.` | Papier nu | Papier nu visible |
| `v`, `i`, `o`, `g` | Encre vermillon, indigo, ocre, verte | Encre visible |
| `_` | Découpe | Position vide |

### Couches

Chaque case de papier de la feuille de départ est une couche, identifiée par son index dans la feuille de départ (`row * cols + col`). Une couche garde son contenu (papier nu ou encre) et son éventuelle épingle tout au long du niveau. Les découpes ne sont pas des couches.

### Plis

```ts
interface Fold {
  axis: 'vertical' | 'horizontal';
  line: number;                // ligne intérieure : 1 à cols - 1 (vertical) ou 1 à rows - 1 (horizontal) ; la ligne k sépare les colonnes (ou lignes) k - 1 et k
  moving: 'before' | 'after';  // partie mobile : avant la ligne (gauche ou haut) ou après (droite ou bas)
}
```

### Niveau

`id`, `sheet` (feuille de départ), `pins` (couches épinglées), `goal` (modèle), `par`.

## État de jeu

```ts
interface Sheet {
  rows: number;
  cols: number;
  stacks: readonly (readonly number[])[];  // index row * cols + col -> couches, de bas en haut
}

interface FoldState {
  sheet: Sheet;
  moves: number;
  history: Sheet[];   // valeurs précédentes de sheet, la plus récente en dernier
}
```

L'état est immuable : chaque transition retourne un nouvel état.

## Transitions

```ts
createState(level: Level): FoldState
canFold(level: Level, sheet: Sheet, fold: Fold): 'ok' | 'pinned' | 'invalid'
fold(level: Level, state: FoldState, fold: Fold): FoldState   // inchangé (même référence) si canFold ne vaut pas 'ok'
undo(state: FoldState): FoldState
restart(level: Level): FoldState
visibleFace(level: Level, sheet: Sheet): Cell[][]             // Cell : 'paper' | Ink | 'empty'
isSolved(level: Level, state: FoldState): boolean
```

### Application d'un pli

Pour un pli vertical sur la ligne k (le cas horizontal est le même sur les lignes) :

1. `invalid` si k n'est pas entre 1 et `cols - 1` ; `pinned` si une pile de la partie mobile contient une couche épinglée.
2. Chaque position (r, c) de la partie mobile a pour symétrique (r, 2k - 1 - c). Sa pile, inversée, est ajoutée au-dessus de la pile de cette position, qui peut se trouver hors du rectangle actuel (débordement). Deux positions mobiles n'ont jamais le même symétrique.
3. Les piles de la partie fixe restent en place.
4. Normalisation : la feuille est ramenée au plus petit rectangle qui contient les piles non vides, origine en haut à gauche.

Une dimension de la feuille ne fait que diminuer : après un pli sur la ligne k, la largeur vaut au plus max(k, `cols` - k).

La face visible d'une position est le contenu de la dernière couche de sa pile, ou `empty` si la pile est vide.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/fold/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                 // kebab-case, stable : clé de sauvegarde
  par: number;
  sheet: string[];            // une chaîne par ligne de la feuille de départ
  goal: string[];             // une chaîne par ligne du modèle
  pins?: [number, number][];  // [row, col] dans la feuille de départ
}
```

Exemple (niveau d'introduction, par 1) :

```ts
{
  id: 'first-crease',
  par: 1,
  sheet: [
    '..vv',
    '..vv',
    '....',
  ],
  goal: [
    'vv',
    'vv',
    '..',
  ],
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` fait une recherche en largeur depuis l'état initial, sur tous les plis possibles (au plus 20 par état pour une feuille de 6 × 6), avec élimination des feuilles déjà vues (sérialisation des piles). Une feuille plus étroite ou moins haute que le modèle est écartée, puisque ses dimensions ne peuvent plus que diminuer. Le par est la profondeur de la première feuille dont la face visible est le modèle. La recherche s'arrête à 6 plis, le par maximal (voir "Points tranchés à l'implémentation" dans `technical-specifications.md`). Le solveur n'est utilisé que par les tests.

## Données persistées

Clé `play:fold`, version 1, même forme que les autres jeux à coups et par :

```ts
interface FoldSave {
  best: Record<string, number>;   // id de niveau -> plus petit nombre de coups
}
```

Le statut des niveaux se déduit de `best` et du `par`, avec la progression commune de `src/games/shell/progress.ts` (voir "Organisation du code" dans `technical-specifications.md`).

## Contraintes de validation

Vérifiées par les tests (AC-09) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ;
- `sheet` : de 3 à 6 lignes de même longueur, de 3 à 6 caractères, tous dans l'alphabet d'encodage ; ses cases de papier sont connexes (par les côtés) ; sa première et sa dernière ligne, sa première et sa dernière colonne contiennent chacune au moins une case de papier ;
- `pins` : au plus trois, chacune sur une case de papier ;
- `goal` : lignes de même longueur, caractères de l'alphabet, dimensions au plus égales à celles de `sheet` ; sa première et sa dernière ligne, sa première et sa dernière colonne contiennent chacune au moins une position non vide ;
- l'état initial n'est pas résolu ;
- le solveur trouve une solution, `par` est égal à sa profondeur et vaut au plus 6.
