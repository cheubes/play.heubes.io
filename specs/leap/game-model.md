# Modèle de jeu : Leap

Contrat de `src/games/leap/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation et leurs valeurs.

## Entités

### Unités et constantes

Positions et vitesses sont des entiers, pour une simulation exacte et rejouable : 1 case = 240 unités, 1 pas = 1/60 s. L'axe vertical est orienté vers le bas.

| Constante | Valeur | Équivalent |
|---|---|---|
| Vitesse de course | 24 unités par pas | 6 cases par seconde |
| Gravité | 4 unités par pas, par pas | |
| Vitesse de saut | 66 unités par pas, vers le haut | sommet à 512 unités (2,13 cases), retour au même niveau en 33 pas (0,55 s) : un mur de 2 cases se franchit de justesse |
| Vitesse de ressort | 93 unités par pas, vers le haut | sommet à 1 035 unités (4,31 cases) |
| Vitesse de chute maximale | 60 unités par pas | 15 cases par seconde |
| Tolérance après le sol | 6 pas | 0,1 s |
| Appui retenu avant l'atterrissage | 6 pas | 0,1 s |
| Boîte de l'automate | 180 × 216 unités | 0,75 × 0,9 case |
| Boîte des piques | moitié de la case où ils sont posés (basse pour `^`, haute pour `v`), réduite de 36 unités à gauche et à droite | |

Ces valeurs peuvent être ajustées pendant la conception des salles ; tout changement est consigné dans "Points tranchés à l'implémentation" (`technical-specifications.md`).

### Cases

| Caractère | Case |
|---|---|
| `.` | Vide |
| `#` | Mur |
| `^` | Piques au sol (pointe vers le haut) |
| `v` | Piques au plafond (pointe vers le bas) |
| `-` | Plateforme traversable (lame sur le haut de la case) |
| `s` | Ressort (sur le bas de la case) |
| `l` | Levier |
| `D` | Porte fermée au départ |
| `d` | Porte ouverte au départ |
| `E` | Entrée |
| `X` | Sortie |
| `c` | Rouage |

Hors de la grille, les côtés et le haut se comportent comme des murs ; le bas est le vide (chute).

### Plateforme mobile

`from` et `to` (case de départ et d'arrivée de son extrémité gauche, sur une même ligne ou une même colonne), `length` (1 à 3 cases), `period` (durée d'un aller-retour, en pas). Au pas t de la salle, sa position est l'interpolation linéaire en aller-retour (`t mod period`), arrondie à l'unité.

### Salle et niveau

Salle : `grid` (12 chaînes de 12 caractères), `facing` (`left` ou `right`, sens de départ), `movers` (plateformes mobiles). Niveau : `id`, deux salles.

## État de jeu

```ts
interface LeapState {
  room: 0 | 1;
  roomTick: number;          // pas écoulés depuis le lancement dans la salle (horloge des plateformes mobiles)
  runner: {
    x: number; y: number;    // coin haut gauche de la boîte
    vy: number;
    facing: 'left' | 'right';
    launched: boolean;
    grounded: boolean;
    coyote: number;          // pas restants de tolérance après le sol
    buffer: number;          // pas restants d'un appui retenu
    onLever: boolean;        // en contact avec un levier au pas précédent
  };
  doorsSwapped: boolean;     // portes basculées par rapport à l'état initial
  pendingSwap: boolean;      // bascule en attente de la sortie de l'automate d'une porte
  roomCog: boolean;          // rouage de la salle courante ramassé
  cogs: number;              // rouages acquis dans les salles franchies
  falls: number;
  runTicks: number;          // temps du niveau
  outcome: 'playing' | 'complete';
}
```

L'état est immuable : chaque transition retourne un nouvel état.

## Transitions

```ts
createState(level: Level): LeapState
step(level: Level, state: LeapState, pressed: boolean): LeapState   // un pas ; pressed : un appui a eu lieu depuis le pas précédent
```

### Déroulement d'un pas

Si l'automate n'est pas lancé, un appui le lance (`launched`) et le pas s'arrête là. Sinon, dans cet ordre :

1. `roomTick` et `runTicks` augmentent de 1. Les plateformes mobiles prennent leur position du pas ; un automate posé sur l'une d'elles au pas précédent se déplace avec elle.
2. Saut : un appui pose `buffer` à 6. Si `buffer` > 0 et (`grounded` ou `coyote` > 0), l'automate saute (`vy` = -66, `grounded` faux, `coyote` et `buffer` à 0). Sinon `buffer` et `coyote` diminuent de 1 (sans descendre sous 0).
3. Mouvement horizontal : x avance de 24 dans le sens de `facing`. En cas de chevauchement avec un solide (mur, porte fermée), x est ramené au contact et `facing` s'inverse.
4. Mouvement vertical : `vy` augmente de 4, sans dépasser 60 ; y avance de `vy`. Solides : en descendant, l'automate se pose sur le dessus (`vy` à 0, `grounded` vrai, `coyote` à 6) ; en montant, il s'arrête sous le dessous (`vy` à 0). Plateformes traversables et mobiles : elles ne l'arrêtent qu'en descendant, si le bas de sa boîte était au-dessus de leur dessus au pas précédent. Sans appui sous lui, `grounded` devient faux.
5. Ressort : un automate qui se pose sur un ressort repart aussitôt (`vy` = -93, `grounded` faux).
6. Contacts, avec la boîte de l'automate :
   - piques, ou bas de la boîte sous la grille : chute ;
   - levier, si `onLever` était faux : bascule des portes ; si une porte qui doit se fermer chevauche l'automate, la bascule est mise en attente (`pendingSwap`) et appliquée au premier pas sans chevauchement ;
   - rouage : `roomCog` vrai ;
   - sortie : fin de salle.
   `onLever` prend la valeur du contact avec un levier à ce pas. Une chute l'emporte sur les autres contacts du même pas.
7. Chute : `falls` augmente de 1 ; l'automate revient à l'entrée, arrêté (`launched` faux), tourné selon `facing` de la salle ; `roomTick`, portes, bascule en attente et `roomCog` reviennent à l'état initial.
8. Fin de salle : `cogs` augmente de 1 si `roomCog` ; on passe à la salle suivante, avec l'automate arrêté sur son entrée, ou `outcome` passe à `complete` après la seconde salle.

L'entrée place l'automate centré horizontalement sur sa case, posé sur le bas de la case.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/leap/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                  // kebab-case, stable : clé de sauvegarde
  rooms: [RoomSource, RoomSource];
}

interface RoomSource {
  grid: string[];              // 12 chaînes de 12 caractères
  facing: 'left' | 'right';
  movers?: { from: [number, number]; to: [number, number]; length: number; period: number }[];   // [col, row]
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

### Solveur

`logic/solver.ts` fait une recherche en largeur sur les pas d'une salle. À chaque pas où un saut est possible, il essaie d'appuyer ou non ; aux autres pas, il n'appuie pas. Les états déjà vus sont éliminés (position, vitesse, sens, portes, rouage, et `roomTick` modulo le plus petit commun multiple des périodes des plateformes mobiles). Il cherche une suite d'appuis qui atteint la sortie, puis une qui atteint la sortie après avoir ramassé le rouage, en au plus 3 600 pas (une minute). Il n'est utilisé que par les tests.

## Données persistées

Clé `play:leap`, version 1 :

```ts
interface LeapSave {
  levels: Record<string, {
    bestTicks: number;    // temps le plus court, en pas
    allCogs: boolean;     // terminé au moins une fois avec les deux rouages
  }>;
}
```

- Un niveau est terminé s'il a une entrée dans `levels`.
- Statuts : `available` pour le premier niveau non terminé qui suit un niveau terminé (ou le niveau 1), `completed` pour un niveau terminé, `perfect` si `allCogs`, `locked` sinon. Ils ne sont pas stockés.
- Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée.

La progression commune de `src/games/shell/progress.ts` ne s'applique pas : elle repose sur des coups et un par. La logique de statuts est la même que celle de Delta ; si elle devient commune, elle est extraite dans `src/games/shell/` (voir "Structure des fichiers" dans `technical-specifications.md`).

## Contraintes de validation

Vérifiées par les tests (AC-12) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ; exactement deux salles ;
- `grid` : 12 chaînes de 12 caractères, tous dans l'alphabet des cases ;
- exactement une entrée, une sortie et un rouage par salle ; la case sous l'entrée est un mur ou une porte fermée au départ ;
- leviers et portes vont ensemble : une salle qui a l'un a l'autre ;
- plateformes mobiles : `from` et `to` sur une même ligne ou colonne, trajet dans la grille et sur des cases vides, `length` de 1 à 3, `period` d'au moins 60 pas ;
- le solveur atteint la sortie, et atteint la sortie avec le rouage, en au plus 3 600 pas.
