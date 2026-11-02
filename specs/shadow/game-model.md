# Modèle de jeu : Shadow

Contrat de `src/games/shadow/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation.

## Entités

### Côtés, directions et positions

`Side` : `top`, `bottom`, `left`, `right` : côté du plateau d'où vient une lumière. `Position` : `row`, `col`, entiers à partir de 0, origine en haut à gauche.

Sens des ombres selon le côté de la lumière :

| Côté de la lumière | Sens de l'ombre | Case à la distance k de la tour |
|---|---|---|
| `left` | vers la droite | (`row`, `col + k`) |
| `right` | vers la gauche | (`row`, `col - k`) |
| `top` | vers le bas | (`row + k`, `col`) |
| `bottom` | vers le haut | (`row - k`, `col`) |

### Éléments

Chaque élément a un `id` (dérivé de sa position : `e-<row>-<col>`) et une position.

| Type | Attributs |
|---|---|
| `tower` | `height` (0 à 3, hauteur initiale), `fixed` (défaut `false` ; une tour fixe a une hauteur de 1 à 3) |
| `shade-target` | |
| `sun-target` | |

Une case sans élément est un sol.

### État d'une case

`Shade` : `sun`, `penumbra`, `shade` (règle 6).

### Niveau

`id`, `rows`, `cols`, `lights` (un ou deux `Side` distincts), `elements`, `par`. Un niveau a au moins une cible et entre une et huit tours réglables.

## État de jeu

```ts
interface ShadowState {
  heights: Readonly<Record<string, number>>;    // id de tour réglable -> hauteur actuelle
  moves: number;
  history: Readonly<Record<string, number>>[];  // valeurs précédentes de heights, la plus récente en dernier
}
```

L'état est immuable : chaque transition retourne un nouvel état. Les tours fixes ne figurent pas dans `heights` : leur hauteur est celle du niveau.

## Transitions

```ts
createState(level: Level): ShadowState
raise(level: Level, state: ShadowState, position: Position): ShadowState   // inchangé (même référence) si pas de tour réglable
undo(state: ShadowState): ShadowState
restart(level: Level): ShadowState
computeShade(level: Level, state: ShadowState): ShadeResult
isSolved(level: Level, state: ShadowState): boolean

interface ShadeResult {
  cells: Shade[][];                // [row][col]
  met: Record<string, boolean>;    // id de cible -> satisfaite
}
```

### Calcul des ombres

1. Pour chaque lumière, partir d'une grille de booléens à `false`. Pour chaque tour (réglable ou fixe) de hauteur h > 0, passer à `true` les cases aux distances 1 à h dans le sens de l'ombre (voir le tableau des côtés), en s'arrêtant au bord du plateau.
2. Pour chaque case, compter les lumières qui la mettent à l'ombre : 0 donne `sun`, le nombre de lumières du niveau donne `shade`, toute autre valeur donne `penumbra`.
3. Une cible d'ombre est satisfaite si sa case vaut `shade`, une cible de soleil si elle vaut `sun`.

Les cases de tour reçoivent aussi un état, calculé de la même façon, sans effet sur les règles.

Une ombre n'est ni arrêtée ni raccourcie par une tour qu'elle rencontre (règle 5). C'est aussi le résultat physique pour une lumière à 45° : si une tour de hauteur g se trouve à la distance d d'une tour de hauteur h, son ombre couvre au moins jusqu'à la distance d + g ; si g ≥ h - d, elle couvre donc déjà tout ce que l'ombre de la première aurait couvert au-delà.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/shadow/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                 // kebab-case, stable : clé de sauvegarde
  par: number;
  rows: number;
  cols: number;
  lights: Side[];
  elements: ElementSource[];  // { type, at: [row, col], ...attributs du type }
}
```

Exemple (niveau d'introduction, par 1) :

```ts
{
  id: 'first-shade',
  par: 1,
  rows: 5,
  cols: 5,
  lights: ['left'],
  elements: [
    { type: 'tower', at: [2, 1], height: 1 },
    { type: 'shade-target', at: [2, 3] },
  ],
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` énumère toutes les combinaisons de hauteurs des tours réglables (au plus 4^8, soit 65 536). Les touchers sur des tours différentes commutent, donc le coût d'une combinaison est la somme, pour chaque tour réglable, de (hauteur visée - hauteur initiale) modulo 4. Le par est le plus petit coût parmi les combinaisons qui résolvent le niveau. Le solveur n'est utilisé que par les tests.

## Données persistées

Clé `play:shadow`, version 1, même forme que Tilt et Prism :

```ts
interface ShadowSave {
  best: Record<string, number>;   // id de niveau -> plus petit nombre de coups
}
```

Le statut des niveaux se déduit de `best` et du `par`, avec la progression commune de `src/games/shell/progress.ts` (voir "Organisation du code" dans `technical-specifications.md`).

## Contraintes de validation

Vérifiées par les tests (AC-09) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ;
- `rows` et `cols` entre 5 et 8 ; chaque élément dans le plateau, au plus un élément par case ;
- une ou deux lumières, de côtés différents ;
- au moins une cible ; entre une et huit tours réglables ;
- hauteurs entières de 0 à 3, de 1 à 3 pour une tour fixe ;
- l'état initial n'est pas résolu ;
- le solveur trouve une solution, et `par` est égal au plus petit coût trouvé.
