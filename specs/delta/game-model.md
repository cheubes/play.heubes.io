# Modèle de jeu : Delta

Contrat de `src/games/delta/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation et leurs valeurs.

## Entités

### Constantes

| Constante | Valeur |
|---|---|
| Durée d'un pas | 100ms |
| Carte | 16 × 10 unités de carte, origine en haut à gauche |
| Vitesse des unités | 0,2 unité de carte par pas (2 par seconde) |
| Intervalle d'émission | 5 pas (2 unités par seconde) |

| Taille de bassin | Intervalle de production | Capacité | Rayon (unités de carte) |
|---|---|---|---|
| `small` | 20 pas | 20 | 0,45 |
| `medium` | 14 pas | 35 | 0,6 |
| `large` | 10 pas | 50 | 0,75 |

Ces valeurs peuvent être ajustées pendant la conception des niveaux ; tout changement est consigné dans "Points tranchés à l'implémentation" (`technical-specifications.md`).

### Camps

`Side` : `player`, `rival`. `Owner` : `Side` ou `neutral`.

### Bassins et canaux

- Bassin : `id` (kebab-case, unique dans le niveau), `at` (x, y en unités de carte), `size`. Son camp, ses unités et sa sortie font partie de l'état.
- Canal : deux bassins (`a`, `b`), une longueur (distance entre leurs centres), une durée de parcours de `ceil(longueur / 0,2)` pas, et une marée facultative : `{ open, closed, phase }` en pas. Au pas t, le canal est ouvert si `(t + phase) mod (open + closed) < open`.

### Niveau

`id`, `seed`, `rival` (paramètres de stratégie : `reaction`, en pas ; `margin`, en unités), `basins` (avec camp et unités initiaux), `channels`.

## État de jeu

```ts
interface DeltaState {
  tick: number;
  basins: readonly BasinState[];   // dans l'ordre du niveau
  transit: readonly Unit[];        // dans l'ordre d'émission
  rng: number;                     // état du générateur pseudo-aléatoire
  basinsLost: number;              // bassins du joueur pris par le rival
  mostHeld: number;                // plus grand nombre de bassins tenus par le joueur
  outcome: 'playing' | 'won' | 'lost';
}

interface BasinState {
  owner: Owner;
  units: number;
  output: number | null;           // index du canal de sortie
}

interface Unit {
  side: Side;
  channel: number;                 // index du canal
  towards: 'a' | 'b';
  progress: number;                // pas parcourus
}
```

L'état est immuable : chaque transition retourne un nouvel état. Le générateur est un générateur à graine (mulberry32), dont l'état vit dans `rng` : la logique reste pure et rejouable.

## Transitions

```ts
createState(level: Level): DeltaState
setRoute(level: Level, state: DeltaState, from: string, to: string): DeltaState   // inchangé (même référence) si from n'est pas au joueur ou to pas voisin
hold(level: Level, state: DeltaState, basin: string): DeltaState                 // retire la sortie ; inchangé si le bassin n'est pas au joueur
step(level: Level, state: DeltaState): DeltaState                                  // un pas ; inchangé si outcome n'est pas 'playing'
decide(level: Level, state: DeltaState, side: Side, params: StrategyParams): DeltaState  // stratégie, utilisée pour le rival et pour la stratégie de référence
```

### Déroulement d'un pas

Dans cet ordre :

1. `tick` augmente de 1.
2. Si `tick` est un multiple de `rival.reaction`, appliquer `decide` pour le rival.
3. Production : chaque bassin du joueur ou du rival dont l'intervalle de production divise `tick`, et sous sa capacité, gagne une unité.
4. Émission : si `tick` est un multiple de l'intervalle d'émission, chaque bassin avec une sortie dont le canal est ouvert et au moins une unité en perd une, qui entre dans le canal (`progress` à 0).
5. Mouvement : chaque unité en route avance d'un pas.
6. Croisements : dans chaque canal et pour chaque camp, tant que l'unité la plus avancée de ce camp vers `b` et l'unité la plus avancée de l'autre camp vers `a` ont une somme de fractions parcourues (`progress / durée`) qui atteint 1, les deux sont retirées. Une unité croise ainsi chaque unité adverse qui vient en sens inverse, même quand une unité de son propre camp la précède.
7. Arrivées : les unités dont `progress` atteint la durée du canal arrivent, dans l'ordre de `transit`, et appliquent la règle 7. Une prise par le rival d'un bassin du joueur incrémente `basinsLost`.
8. `mostHeld` est mis à jour, puis `outcome` selon la règle 11.

### Stratégie

`decide(level, state, side, { reaction, margin })` donne de nouvelles sorties aux bassins de `side`, en trois phases. Un bassin d'un autre camp est un bassin adverse ou neutre. Les égalités sont départagées par le générateur : il ne tire qu'en cas d'égalité, et le choix est le candidat d'indice `floor(valeur × n)` parmi les n ex aequo, dans l'ordre des canaux du niveau.

1. **Menaces** : un bassin est menacé si au moins une unité adverse est en route vers lui et que le nombre d'unités adverses en route vers lui est au moins égal à ses unités. Un bassin menacé est mis en réserve (pas de sortie).
2. **Renforts** : pour chaque bassin menacé, dans l'ordre du niveau, son voisin du même camp non menacé, et pas encore choisi comme renfort, qui a le plus d'unités oriente sa sortie vers lui.
3. **Autres bassins**, dans l'ordre du niveau, sauf les renforts :
   - **Poursuite** : si sa sortie vise un bassin d'un autre camp et que ses unités, plus les unités de son camp en route vers la cible sur ce canal, dépassent la garnison de la cible, il la garde ;
   - **Attaque** : sinon, parmi ses voisins d'un autre camp dont la garnison plus `margin` est inférieure à ses unités, il vise celui qui a la plus petite garnison ;
   - **Relais** : sinon, si tous ses voisins sont de son camp, il vise le voisin le plus proche (en nombre de canaux) d'un bassin d'un autre camp, s'il en existe un d'atteignable ;
   - **Réserve** : sinon, pas de sortie.

La stratégie de référence, utilisée par les tests de validation des niveaux, est cette stratégie jouée pour le joueur avec `reaction` = 5 et `margin` = 0.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/delta/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                     // kebab-case, stable : clé de sauvegarde
  seed: number;
  rival: { reaction: number; margin: number };
  basins: {
    id: string;
    at: [number, number];         // x, y en unités de carte
    size: 'small' | 'medium' | 'large';
    owner: 'player' | 'rival' | 'neutral';
    units: number;
  }[];
  channels: {
    between: [string, string];
    tide?: { open: number; closed: number; phase: number };
  }[];
}
```

Exemple (niveau d'introduction) :

```ts
{
  id: 'first-current',
  seed: 1,
  rival: { reaction: 40, margin: 6 },
  basins: [
    { id: 'home', at: [3, 5], size: 'medium', owner: 'player', units: 12 },
    { id: 'ford', at: [8, 5], size: 'small', owner: 'neutral', units: 4 },
    { id: 'den', at: [13, 5], size: 'small', owner: 'rival', units: 6 },
  ],
  channels: [
    { between: ['home', 'ford'] },
    { between: ['ford', 'den'] },
  ],
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

## Données persistées

Clé `play:delta`, version 1 :

```ts
interface DeltaSave {
  levels: Record<string, {
    bestTicks: number;     // durée de la victoire la plus rapide, en pas
    flawless: boolean;     // au moins une victoire sans bassin perdu
  }>;
}
```

- Un niveau est gagné s'il a une entrée dans `levels`. Une défaite n'écrit rien.
- Statuts : `available` pour le premier niveau non gagné qui suit un niveau gagné (ou le niveau 1), `completed` pour un niveau gagné, `perfect` si `flawless`, `locked` sinon. Ils ne sont pas stockés.
- Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée.

La progression commune de `src/games/shell/progress.ts` ne s'applique pas : elle repose sur des coups et un par.

## Contraintes de validation

Vérifiées par les tests (AC-11) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ; `seed` entier ; `rival.reaction` entre 5 et 50, `rival.margin` entre 0 et 10 ;
- de 3 à 14 bassins, d'`id` uniques ; centres dans le rectangle [1, 15] × [1, 9], à au moins 2 unités de carte les uns des autres ;
- au moins un bassin au joueur et un au rival ; unités initiales entre 0 et la capacité ;
- canaux entre deux bassins distincts existants, sans doublon ; le réseau est connexe ; deux canaux ne se croisent pas, et un canal passe à au moins 0,8 unité de carte de tout bassin qu'il ne relie pas ;
- marées : `open` et `closed` d'au moins 20 pas, `phase` positive ;
- la stratégie de référence gagne en moins de 3 000 pas (5 minutes) ;
- un joueur qui ne donne aucun ordre ne gagne pas en 3 000 pas.
