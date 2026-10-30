# Modèle de jeu : Tilt

Contrat de `src/games/tilt/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation.

## Entités

| Entité | Attributs | Valeurs |
|---|---|---|
| Couleur | | `amber`, `azure`, `rose`, `mint` |
| Direction | | `up`, `down`, `left`, `right` |
| Position | `row`, `col` | Entiers à partir de 0, origine en haut à gauche. |
| Case | `type`, `color` (cible seulement) | `type` : `floor`, `wall`, `target`, `sticky`. |
| Bloc | `id`, `kind`, `color` (bloc coloré seulement), `position` | `kind` : `colored`, `neutral`. `id` stable pendant tout le niveau (sert au rendu et aux animations). |
| Niveau | `id`, `rows`, `cols`, `cells`, `blocks` (position initiale), `par` | |

## État de jeu

```ts
interface TiltState {
  blocks: Block[];          // position courante
  moves: number;            // coups joués
  history: Block[][];       // positions précédentes, la plus récente en dernier
}
```

L'état est immuable : chaque transition retourne un nouvel état.

## Transitions

```ts
createState(level: Level): TiltState
tilt(level: Level, state: TiltState, direction: Direction): { state: TiltState; motions: Motion[] }
undo(state: TiltState): TiltState
restart(level: Level): TiltState
isSolved(level: Level, state: TiltState): boolean

interface Motion {
  blockId: string;
  from: Position;
  to: Position;
  stoppedBy: 'wall' | 'block' | 'sticky';
}
```

### Résolution d'une inclinaison

1. Trier les blocs par distance au bord vers lequel on incline, du plus proche au plus éloigné (pour `right` : colonne décroissante).
2. Pour chaque bloc, dans cet ordre : avancer d'une case tant que la case suivante est dans le plateau, n'est pas un mur, n'est pas occupée par un bloc déjà traité, et tant que le bloc n'est pas entré sur une case collante pendant ce mouvement.
3. Si aucun bloc n'a bougé : retourner l'état inchangé (même référence) et une liste de `motions` vide. Sinon : empiler les positions précédentes dans `history`, incrémenter `moves`, retourner les `motions` des blocs qui ont bougé.

`stoppedBy` indique au rendu quel effet d'arrêt jouer (voir `technical-specifications.md`).

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/tilt/levels/levels.ts`, un tableau ordonné de sources de niveau :

```ts
interface LevelSource {
  id: string;          // kebab-case, stable : clé de sauvegarde, jamais renommé après publication
  par: number;
  terrain: string[];   // une chaîne par rangée
  pieces: string[];    // mêmes dimensions que terrain
}
```

Légende de `terrain` : `#` mur, `.` sol, `+` case collante, `a` `b` `c` `d` cible ambre, azur, rose, menthe.

Légende de `pieces` : `.` aucun bloc, `A` `B` `C` `D` bloc ambre, azur, rose, menthe, `X` bloc neutre.

Exemple (niveau d'introduction, par 2) :

```ts
{
  id: 'first-slide',
  par: 2,
  terrain: [
    '.....',
    '.#...',
    '.....',
    '...#.',
    '....a',
  ],
  pieces: [
    'A....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
}
```

`parseLevel(source)` produit un `Level`. Les identifiants de blocs sont dérivés de leur position initiale (`b-<row>-<col>`).

L'ordre du tableau est l'ordre de jeu. Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id` : réordonner les niveaux ne casse pas les sauvegardes.

Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` calcule le nombre minimal de coups d'un niveau par un parcours en largeur sur les positions des blocs. Deux positions qui ne diffèrent que par l'échange de deux blocs de même couleur (ou de deux blocs neutres) sont considérées comme identiques. Le parcours s'arrête au-delà de 500 000 positions explorées : le niveau est alors considéré comme trop complexe et le test échoue. Le solveur n'est utilisé que par les tests, jamais par le jeu publié.

## Données persistées

Clé `play:tilt`, version 1 :

```ts
interface TiltSave {
  best: Record<string, number>;   // id de niveau -> plus petit nombre de coups
}
```

- Un niveau est terminé s'il a une entrée dans `best`.
- Le statut se déduit de `best` et du `par` (voir "Progression" dans `functional-specifications.md`). Il n'est pas stocké.
- Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée.

## Contraintes de validation

Vérifiées par les tests (AC-12) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ;
- `terrain` et `pieces` ont les mêmes dimensions, entre 5 et 8 dans chaque sens, toutes les rangées de même longueur ;
- seuls les caractères de la légende sont utilisés ;
- aucun bloc sur un mur ;
- au moins un bloc coloré ; pour chaque couleur, autant de cibles que de blocs ;
- la position initiale n'est pas résolue ;
- le solveur trouve une solution, en exactement `par` coups au minimum.
