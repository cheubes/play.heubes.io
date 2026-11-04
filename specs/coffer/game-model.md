# Modèle de jeu : Coffer

Contrat de `src/games/coffer/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation.

## Entités

### Faces et vue

`Face` : `front`, `right`, `back`, `left`, `top`, `bottom`. Anneau des faces latérales, dans le sens d'une rotation vers la droite (le coffret tourne de façon à montrer la face de droite) : `front` → `right` → `back` → `left` → `front`.

Vue : `{ face: Face; side: LateralFace }`, où `side` est la dernière face latérale vue (égale à `face` quand celle-ci est latérale).

| Depuis | Rotation | Vers |
|---|---|---|
| Face latérale | `left` / `right` | Face précédente / suivante de l'anneau |
| Face latérale | `up` | `top` |
| Face latérale | `down` | `bottom` |
| `top` | `down` | `side` |
| `bottom` | `up` | `side` |

Les autres rotations ne sont pas disponibles (pas de flèche de bord). Le sens `up` correspond à un glisser vers le bas : le joueur tire le dessus vers lui.

### Coordonnées

Une face est un carré de 100 × 100 unités, origine en haut à gauche. Chaque élément a une position (`at`, centre) et, pour les compartiments, une taille (`size`).

### Symboles

Suites de valeurs des cadrans et des inscriptions :

| Suite | Valeurs |
|---|---|
| `digits` | `0` à `9` |
| `shapes` | `circle`, `triangle`, `square`, `star`, `diamond`, `cross` |

Un cadran utilise les `n` premières valeurs d'une suite (2 ≤ n ≤ 10, ou 6 pour `shapes`).

### Éléments

Chaque élément a un `id` unique dans le coffret (kebab-case).

| Type | Attributs |
|---|---|
| `compartment` | `style` (`drawer`, `panel` ou `hatch`), `size`, `requires` (facultatif), `auto` (défaut `false`), `secret` (défaut `false`), `contents` : objets (`items`) et éléments (`elements`) visibles une fois ouvert |
| `dial` | `symbols` (`digits` ou `shapes`), `count`, `initial` (index) |
| `button` | `initial` (`out` ou `in`) |
| `lever` | `initial` (`left` ou `right`) |
| `socket` | `style` (`lock` ou `slot`), `accepts` (sorte d'objet) |
| `engraving` | `symbols`, `values` (suite de valeurs à graver, ou `pips` : nombre de points de 1 à 9) |
| `lid` | `requires` ; seulement sur `top`, un seul par coffret |

Un compartiment secret ne contient que la breloque, et rien n'en dépend.

### Objets

Sorte (`ObjectKind`) : `key-round`, `key-square`, `key-triangle` (clés, par la forme de leur anneau), `gem-round`, `gem-square`, `coin`, `crank`. Un objet a un `id` et une sorte ; plusieurs objets peuvent être de la même sorte.

### Conditions

`requires` est une liste d'exigences, toutes nécessaires :

```ts
type Requirement =
  | { dial: string; is: number }              // index de valeur
  | { button: string; is: 'in' | 'out' }
  | { lever: string; is: 'left' | 'right' }
  | { filled: string }                        // logement
  | { open: string };                         // compartiment
```

### Coffret

`id`, `wood` (`maple`, `walnut`, `ebony` ou `lacquer`), `faces` (éléments de chaque face), objets posés à même les faces (`items` par face).

## État de jeu

```ts
interface CofferState {
  view: { face: Face; side: LateralFace };
  dials: Readonly<Record<string, number>>;
  buttons: Readonly<Record<string, 'in' | 'out'>>;
  levers: Readonly<Record<string, 'left' | 'right'>>;
  open: ReadonlySet<string>;          // compartiments et couvercle ouverts
  filled: ReadonlySet<string>;        // logements remplis
  taken: ReadonlySet<string>;         // objets ramassés (dans l'inventaire ou placés)
  inventory: readonly string[];       // objets en main, dans l'ordre où ils ont été ramassés
  selected: string | null;            // objet sélectionné
  charm: boolean;
  hint: { step: string; tier: 1 | 2 | 3 } | null;
  hintsUsed: number;
  solved: boolean;
}
```

L'état est immuable : chaque transition retourne un nouvel état. L'état du mécanisme (tout sauf `view`, `inventory` en tant qu'ordre, `selected` et `hint`) est l'"état abstrait" utilisé par le solveur et les indices.

## Transitions

```ts
createState(level: Level): CofferState
rotate(level: Level, state: CofferState, direction: 'left' | 'right' | 'up' | 'down'): CofferState   // inchangé si la rotation n'est pas disponible
activate(level: Level, state: CofferState, target: string): CofferState                           // mécanisme, objet visible ou objet de l'inventaire
hint(level: Level, state: CofferState): CofferState
isVisible(level: Level, state: CofferState, element: string): boolean
```

`activate` applique les règles 3, 5, 7 et 8 de `functional-specifications.md` à l'élément visé, qui doit être visible sur la face affichée (ou dans l'inventaire). Après chaque changement de l'état abstrait :

1. les compartiments automatiques dont la condition est remplie s'ouvrent, jusqu'à ce qu'aucun ne change (un compartiment qui s'ouvre peut remplir la condition d'un autre) ;
2. `charm` devient vrai si le compartiment secret est ouvert ; `solved` si le couvercle est ouvert ;
3. si l'étape de l'indice en cours est faite, `hint` revient à `null`.

Un élément est visible s'il est posé sur une face, ou dans le contenu d'un compartiment ouvert lui-même visible.

### Actions abstraites

Le solveur et les indices raisonnent sur des actions sans rotation ni sélection : actionner un compartiment ou le couvercle, tourner un cadran d'un cran, inverser un bouton ou un levier, ramasser un objet visible, remplir un logement visible avec un objet attendu de l'inventaire.

### Indices

`hint` calcule, par une recherche en largeur sur les états abstraits, un plus court chemin vers `solved`, en ignorant le compartiment secret. L'étape est le premier mécanisme qu'il touche ; pour un cadran, la valeur visée est celle qu'il a quand le chemin passe à un autre mécanisme. Puis :

- si `hint` est `null` ou désigne une autre étape : palier 1 ;
- sinon : palier suivant, au plus 3.

Textes des paliers (clés de traduction) : 1, la face de l'étape ("Look at the <face>." / "Regarde <face>.", ou "It's on this side." / "C'est sur cette face." si elle est affichée) ; 2, la même phrase et le mécanisme cerclé ; 3, l'action ("Turn this dial to <value>." / "Mets ce cadran sur <valeur>.", "Use the <object> here." / "Utilise <objet> ici.", "Press this button." / "Appuie sur ce bouton.", etc.). Un mécanisme dans un compartiment est désigné par la face de ce compartiment. `hintsUsed` augmente de 1 à chaque appui.

## Contenu

### Fichier et encodage

Les coffrets sont dans `src/games/coffer/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                                   // kebab-case, stable : clé de sauvegarde
  wood: 'maple' | 'walnut' | 'ebony' | 'lacquer';
  objects: { id: string; kind: ObjectKind }[];
  faces: Partial<Record<Face, {
    elements: ElementSource[];                  // { type, id, at: [x, y], ...attributs du type }
    items?: { object: string; at: [number, number] }[];
  }>>;
}
```

Les objets d'un compartiment sont dans son `contents.items` (`{ object, at }`, en coordonnées de la face). Le libellé affiché d'un coffret est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue : les noms des objets, des faces et des valeurs viennent du dictionnaire du jeu.

## Données persistées

Clé `play:coffer`, version 1 :

```ts
interface CofferSave {
  levels: Record<string, { charm: boolean }>;   // coffret ouvert au moins une fois ; charm : avec sa breloque
}
```

Les entrées du sélecteur viennent de `getUnlockEntries` (`src/games/shell/unlock.ts`), avec `charm` comme règle du statut `perfect`. Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée.

## Contraintes de validation

Vérifiées par les tests (AC-09) sur chaque coffret de `levels.ts` :

- `id` uniques, en kebab-case ; références (`requires`, `accepts`, objets) toutes définies ;
- un couvercle, sur `top` ; un compartiment secret, qui ne contient que la breloque ;
- au plus 6 éléments visibles en même temps sur une face ; éléments dans la face, sans chevauchement (compartiments ouverts compris) ; taille minimale de 14 unités pour un élément actionnable ;
- cadrans : `count` et `initial` valides pour leur suite ; inscriptions : valeurs de leur suite ;
- au plus 6 objets en main dans tout état atteignable ;
- au plus 200 000 états abstraits atteignables ;
- le couvercle et le compartiment secret sont atteignables ; depuis chaque état atteignable, le couvercle reste atteignable (aucune impasse) ;
- chaque mécanisme apparaît dans un plus court chemin vers le couvercle ou vers la breloque ;
- l'état initial n'est pas résolu, et un plus court chemin vers le couvercle compte de 8 à 40 actions abstraites.
