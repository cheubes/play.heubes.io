# Modèle de jeu : Lantern

Contrat de `src/games/lantern/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation et leurs valeurs.

## Entités

### Constantes

1 pas = 1/60 s. Les positions sont des cases entières ; les déplacements prennent plusieurs pas, pendant lesquels l'entité est entre deux cases (le rendu interpole).

| Constante | Valeur |
|---|---|
| Durée d'un pas de l'explorateur | 12 pas (5 cases par seconde) |
| Durée d'un pas d'une ombre qui patrouille | 30 pas |
| Durée d'un pas d'une ombre qui chasse | 18 pas |
| Distance de chasse | 6 cases, en chemin par les cases sombres |
| Portée d'une source normale (lanterne, brasero) | 2,5 cases (distance euclidienne entre centres) |
| Portée d'une source forte (lanterne à mèche longue) | 3,5 cases |
| Huile | 0 à 100 ; 1 consommée toutes les 30 pas, lanterne allumée (50 s pour une lanterne pleine) |
| Fiole d'huile | +40, sans dépasser 100 |
| Brasero allumé pour la première fois | lanterne remplie à 100 |
| Révélation d'un mur fantôme | à au plus 2,5 cases de l'explorateur, lanterne voilée |

Ces valeurs peuvent être ajustées pendant la conception des donjons ; tout changement est consigné dans "Points tranchés à l'implémentation" (`technical-specifications.md`).

### Cases d'une salle

Une salle est une grille de 10 × 10 : un anneau de bord (murs et portes) autour de 8 × 8 cases intérieures. Caractères :

| Caractère | Case |
|---|---|
| `.` | Sol |
| `#` | Mur |
| `g` | Mur fantôme |
| `b` | Brasero |
| `B` | Grand brasero |
| `c` | Caisse (sur un sol) |
| `p` | Plaque |
| `o` | Fiole d'huile |
| `k` | Petite clé |
| `K` | Grande clé |
| `w` | Mèche longue |
| `*` | Éclat de lumière |
| `D` | Porte (sur le bord seulement) |
| `s` | Départ d'une ombre |
| `S` | Départ d'une ombre dense |

Les objets, les caisses et les départs d'ombre sont posés sur un sol.

### Portes

Chaque porte relie deux salles voisines sur la carte, par leurs bords communs, à la même position. Sortes : `open`, `locked` (petite clé), `great` (grande clé), `sealed-braziers`, `sealed-plates`. Une porte scellée l'est du côté de sa salle ; de l'autre côté, elle est franchissable une fois ouverte.

### Ombres

`patrol` : liste de cases intérieures voisines formant une boucle, parcourue dans l'ordre. Une ombre dense ne bouge pas (pas de patrouille) ; elle ne quitte sa case que pour fuir une source forte.

### Donjon

`id`, `rooms` (par position sur la carte `[col, row]`), `doors`, `start` (salle et case d'entrée). Une seule salle contient le grand brasero.

## État de jeu

```ts
interface DungeonState {           // état enregistré au point de reprise
  room: [number, number];
  hero: { x: number; y: number; facing: Direction };
  oil: number;
  lantern: 'lit' | 'veiled' | 'out';
  wick: boolean;
  keys: number;
  greatKey: boolean;
  shards: readonly string[];       // id des éclats trouvés
  taken: ReadonlySet<string>;      // objets ramassés (id dérivé de la salle et de la case)
  opened: ReadonlySet<string>;     // portes ouvertes pour de bon
  lit: ReadonlySet<string>;        // braseros allumés
  revealed: ReadonlySet<string>;   // murs fantômes révélés
  crates: Readonly<Record<string, readonly [number, number][]>>;   // positions des caisses, par salle
  visited: ReadonlySet<string>;    // salles visitées (carte)
  runTicks: number;
  caught: number;
}

interface LanternState extends DungeonState {
  tick: number;
  move: Movement | null;           // pas en cours (départ, arrivée, pas restants)
  order: { path: [number, number][] } | { direction: Direction } | null;
  shadows: readonly Shadow[];      // ombres de la salle courante
  checkpoint: DungeonState;
  outcome: 'playing' | 'complete';
}
```

L'état est immuable : chaque transition retourne un nouvel état. Aucun aléatoire.

## Transitions

```ts
createState(level: Level, resume?: DungeonState): LanternState
step(level: Level, state: LanternState, input: Input): LanternState
litCells(level: Level, state: LanternState): ReadonlyMap<string, 'normal' | 'strong'>

type Input = {
  goTo?: [number, number];         // case visée (chemin calculé à la réception)
  hold?: Direction | null;         // direction maintenue
  toggleLantern?: boolean;
  backToEntrance?: boolean;
};
```

### Déroulement d'un pas

1. `tick` et `runTicks` augmentent de 1.
2. Ordres : `goTo` remplace l'ordre par un plus court chemin vers la case (par les cases franchissables connues : sols, plaques, objets, portes ouvertes, murs fantômes révélés ; une caisse ou une porte fermée au bout du chemin est acceptée comme dernier pas). `hold` remplace l'ordre par une direction. `toggleLantern` voile une lanterne allumée ou rallume une lanterne voilée qui a de l'huile. `backToEntrance` restaure le point de reprise et termine le pas.
3. Explorateur : sans pas en cours, il commence le pas suivant de son ordre, si la case visée est franchissable (sinon, l'ordre de chemin est abandonné ; l'ordre de direction attend). Contre une caisse : poussée selon la règle 3. Contre une porte : ouverture selon la règle 10 (clé consommée), puis passage. Contre un brasero éteint, lanterne allumée : brasero allumé, huile à 100. Un pas dure 12 pas ; l'explorateur occupe sa case d'arrivée dès le début du pas.
4. Arrivée sur une case : objets ramassés ; plaques mises à jour ; sur une porte du bord : changement de salle (l'explorateur entre par la porte opposée de la salle voisine, `visited` mis à jour, nouvelles ombres, point de reprise enregistré).
5. Huile : lanterne allumée, 1 consommée tous les 30 pas ; à 0, `lantern` passe à `out`.
6. Lumière : `litCells` calcule les cases éclairées (voir ci-dessous).
7. Ombres, dans l'ordre de la salle : une ombre sur une case éclairée (éclairée fort pour une ombre dense) fuit vers la case voisine sombre la plus éloignée de l'explorateur, s'il y en a une ; sinon, une ombre (non dense) à au plus 6 cases de l'explorateur par les cases sombres avance d'une case vers lui (un pas de 18 pas) ; sinon elle continue sa patrouille (un pas de 30 pas), en attendant si la case suivante est éclairée. Une ombre n'entre jamais dans une case éclairée, une caisse, un mur ou une autre ombre.
8. Capture : si une ombre et l'explorateur occupent la même case, ou échangent leurs cases pendant ce pas, `caught` augmente de 1 et le point de reprise est restauré (en gardant `caught` et `runTicks`).
9. Murs fantômes : lanterne voilée, ceux à au plus 2,5 cases de l'explorateur sont révélés.
10. Grand brasero allumé : `outcome` passe à `complete`.

### Lumière

Pour chaque source allumée (la lanterne de l'explorateur, sur sa case ; chaque brasero allumé), une case intérieure est éclairée si la distance entre centres est au plus la portée de la source, et si le segment entre les deux centres ne traverse aucune case opaque (mur, mur fantôme non révélé, caisse, brasero), les deux extrémités exceptées. Le parcours du segment suit l'algorithme de Bresenham. Une case est éclairée fort si une source forte l'éclaire.

## Contenu

### Fichier et encodage

Les donjons sont dans `src/games/lantern/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                                        // kebab-case, stable : clé de sauvegarde
  start: { room: [number, number]; at: [number, number] };
  rooms: {
    at: [number, number];                            // position sur la carte
    grid: string[];                                  // 10 chaînes de 10 caractères
    patrols?: [number, number][][];                  // une patrouille par ombre, dans l'ordre de lecture de leurs départs
  }[];
  doors: { between: [[number, number], [number, number]]; kind: DoorKind }[];   // salles voisines ; la position de la porte vient des grilles
}
```

Le libellé affiché d'un donjon est sa position ("Level 3" / "Niveau 3"). Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` fait une recherche en largeur sur les états du donjon sans les ombres ni l'huile : position de l'explorateur, objets, portes, braseros, murs fantômes révélés (la lanterne peut être voilée à tout moment), caisses. Il donne un plus court chemin vers le grand brasero et vers chaque éclat. La partie de référence joue ce plus court chemin en temps réel, lanterne allumée sauf pour révéler un mur fantôme, sans attendre. Le solveur n'est utilisé que par les tests.

## Données persistées

Clé `play:lantern`, version 1 :

```ts
interface LanternSave {
  levels: Record<string, { allShards: boolean }>;   // donjon terminé au moins une fois ; allShards : avec ses trois éclats
  inProgress: Record<string, DungeonState>;         // point de reprise d'un donjon commencé et pas terminé
}
```

- Le point de reprise est écrit à chaque entrée dans une salle, et effacé quand le donjon est terminé ou recommencé.
- Les entrées du sélecteur viennent de `getUnlockEntries` (`src/games/shell/unlock.ts`), avec `allShards` comme règle du statut `perfect`, et la marque "en cours" pour les donjons présents dans `inProgress`.
- Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée, et un point de reprise illisible ou incohérent avec le donjon est effacé.

## Contraintes de validation

Vérifiées par les tests (AC-11) sur chaque donjon de `levels.ts` :

- `id` unique, en kebab-case ; de 6 à 10 salles, à des positions distinctes, toutes reliées ;
- grilles de 10 × 10 caractères de l'alphabet ; bord fait de murs et de portes ; chaque porte a sa porte correspondante dans la salle voisine, et une entrée dans `doors` ;
- un grand brasero ; trois éclats ; au plus trois caisses et quatre ombres par salle ; patrouilles en boucle de cases voisines, sur des sols ;
- le grand brasero et chaque éclat sont atteignables depuis le départ ; depuis chaque point de reprise atteignable, le grand brasero reste atteignable (aucune impasse, notamment par une clé utilisée sur la mauvaise porte) ;
- sur le plus court chemin, chaque trajet entre deux recharges (brasero allumé, fiole) tient en 200 pas de l'explorateur ;
- la partie de référence se termine sans capture.
