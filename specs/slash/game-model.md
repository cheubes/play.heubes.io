# Modèle de jeu : Slash

Contrat de `src/games/slash/logic/`. Les règles sont définies dans `functional-specifications.md` ; ce fichier fixe leur représentation et leurs valeurs.

## Entités

### Unités et constantes

Positions et vitesses sont des entiers, comme dans Leap : 1 case = 240 unités, 1 pas = 1/60 s de temps de jeu. Les directions sont des vecteurs entiers de norme 1 000 (arrondis), les angles des entiers en degrés.

| Constante | Valeur | Équivalent |
|---|---|---|
| Rayon du héros | 84 unités | 0,35 case |
| Longueur d'un trait | 960 unités | 4 cases |
| Vitesse d'un trait | 120 unités par pas | 30 cases par seconde, 8 pas pour un trait complet |
| Récupération après un trait | 15 pas | 0,25 s |
| Rebond sur un bouclier | 120 unités | 0,5 case |
| Étourdissement | 30 pas | 0,5 s |
| Invulnérabilité après un coup | 60 pas | 1 s |
| Cœurs | 3 | |
| Jauge de ralenti | 120 | |
| Coût du ralenti | 5 par pas de jeu | 2 s de visée ralentie, en temps réel, jauge pleine |
| Recharge de la jauge | 1 par pas de jeu sans visée | 2 s pour une jauge pleine |
| Vitesse ralentie | 20 % | |

| Pantin | Rayon | Vitesse | Portée | Préparation | Autres |
|---|---|---|---|---|---|
| `puppet` (pantin) | 96 | 6 unités par pas | 288 (1,2 case), secteur de 90° | 36 pas | Récupération de 30 pas après une attaque |
| `shield` (porteur de bouclier) | 96 | 5 unités par pas | comme `puppet` | 36 pas | Bouclier sur un arc de 120° à l'avant, rotation de 2° par pas |
| `thrower` (lanceur) | 96 | immobile | ligne droite | 48 pas | Un tir toutes les 150 pas ; projectile de rayon 36, à 24 unités par pas |
| `colossus` (colosse) | 144 | 3 unités par pas | 432 (1,8 case), secteur de 120° | 60 pas | Deux traits ; chancelle 60 pas après le premier |

Ces valeurs peuvent être ajustées pendant la conception des niveaux ; tout changement est consigné dans "Points tranchés à l'implémentation" (`technical-specifications.md`).

### Arène et vagues

- Arène : 12 chaînes de 12 caractères : `.` sol, `#` pilier, `H` départ du héros (un sol).
- Vague : liste d'apparitions `{ type, at }` (case de sol).
- Niveau : `id`, arène, vagues (de deux à cinq).

## État de jeu

```ts
interface SlashState {
  tick: number;
  started: boolean;
  hero: {
    x: number; y: number;
    hearts: number;
    dash: { dir: Vector; travelled: number } | null;
    cooldown: number;
    stun: number;
    invulnerable: number;
  };
  gauge: number;
  slowed: boolean;                 // ralenti actif à ce pas, lu par la boucle de rendu
  enemies: readonly Enemy[];
  projectiles: readonly Projectile[];
  wave: number;                    // index de la vague en cours
  waveTimer: number;               // pas avant l'arrivée de la vague annoncée
  hitsTaken: number;
  outcome: 'playing' | 'won' | 'lost';
}

interface Enemy {
  id: number;
  type: 'puppet' | 'shield' | 'thrower' | 'colossus';
  x: number; y: number;
  facing: number;                  // degrés
  health: number;                  // 1, ou 2 pour un colosse
  windup: { remaining: number; facing: number } | null;  // attaque en préparation, direction fixée
  recover: number;                 // récupération, chancellement ou délai de tir
}

interface Projectile { x: number; y: number; dir: Vector }
```

L'état est immuable : chaque transition retourne un nouvel état. Aucun aléatoire : les vagues et les comportements sont déterministes.

## Transitions

```ts
createState(level: Level): SlashState
step(level: Level, state: SlashState, input: { aiming: boolean; dash: Vector | null }): SlashState   // un pas de jeu
previewDash(level: Level, state: SlashState, dir: Vector): DashPreview                                // point d'arrivée et premier bouclier, pour la ligne de visée et la stratégie de référence
```

`dash` est la direction d'un trait demandé depuis le pas précédent. Une demande refusée (trait en cours, récupération, étourdissement) est retenue jusqu'à 6 pas, puis oubliée.

### Déroulement d'un pas

Si `started` est faux, une visée ou un trait le met à vrai et le pas s'arrête là. Sinon, dans cet ordre :

1. `tick` augmente de 1 ; les compteurs (`cooldown`, `stun`, `invulnerable`, `recover`, `windup`, `waveTimer`) diminuent de 1.
2. Jauge : si `aiming` et `gauge` ≥ 5, `slowed` est vrai et `gauge` perd 5 ; sinon `slowed` est faux, et `gauge` gagne 1 (au plus 120) si le joueur ne vise pas.
3. Trait : une demande retenue démarre un trait si aucun n'est en cours, `cooldown` et `stun` sont à 0. Un trait en cours avance de 120 unités au plus (moins pour finir sa longueur) en balayant le cercle du héros le long du segment :
   - un pilier ou un bord arrête le trait au contact ;
   - un pantin dont le corps est touché est coupé (`health` - 1), sauf si c'est un porteur de bouclier touché par l'avant : l'angle entre la direction du trait et l'opposé de son `facing` est d'au plus 60°. Le trait s'arrête alors au contact, le héros recule de 120 unités (sans traverser de solide), `stun` passe à 30 ;
   - un projectile touché est retiré ;
   - en fin de trait, `cooldown` passe à 15.
   Les contacts sont traités dans l'ordre où le segment les rencontre.
4. Pantins vaincus (`health` à 0) retirés ; un colosse qui passe à 1 chancelle (`recover` à 60, `windup` annulé).
5. Pantins, dans l'ordre de `id` :
   - porteur de bouclier : `facing` tourne vers le héros d'au plus 2° ;
   - sans `windup` ni `recover` : si le héros est à portée (et, pour un lanceur, en ligne de vue), il commence une préparation, direction fixée vers le héros ; sinon il avance vers la case voisine la plus proche du héros dans le champ de distances (recherche en largeur sur les cases de sol, depuis la case du héros, recalculée quand le héros change de case), sans chevaucher un autre pantin ni le héros ;
   - `windup` qui arrive à 0 : l'attaque frappe son secteur (ou part en projectile) ; `recover` passe à 30 (150 pour un lanceur).
6. Projectiles : avancent de 24 ; retirés sur un pilier ou un bord.
7. Coups : une frappe dont le secteur contient le centre du héros, ou un projectile qui touche son cercle, retire un cœur si aucun trait n'est en cours et `invulnerable` est à 0 ; `invulnerable` passe à 60, `hitsTaken` augmente de 1. Un projectile qui touche le héros est retiré.
8. Vagues : quand tous les pantins sont vaincus, la vague suivante est annoncée (`waveTimer` à 120 : 60 pas d'attente, puis 60 pas de marques au sol) ; à 0, ses pantins apparaissent, tournés vers le héros. La première vague est annoncée dès le départ, ses marques visibles.
9. `outcome` : `lost` si `hearts` est à 0 ; sinon `won` si la dernière vague est vaincue.

### Stratégie de référence

Utilisée par les tests de validation des niveaux. À chaque pas où un trait peut démarrer, elle évalue 32 directions régulières et, pour chaque pantin, les directions vers son dos et ses flancs, avec `previewDash` et une simulation du seul trait :

- score : +10 par pantin coupé, -100 si un bouclier arrête le trait, -50 si le point d'arrivée est dans un secteur en préparation ou sur la trajectoire d'un projectile, -5 par pantin à moins de 1,5 case du point d'arrivée ;
- elle fonce dans la direction de meilleur score si ce score est positif, ou si une frappe ou un projectile atteindrait le héros dans les 20 prochains pas (elle prend alors la meilleure direction hors pantins coupés) ;
- sinon elle attend, sans viser.

## Contenu

### Fichier et encodage

Les niveaux sont dans `src/games/slash/levels/levels.ts`, un tableau ordonné :

```ts
interface LevelSource {
  id: string;                   // kebab-case, stable : clé de sauvegarde
  arena: string[];              // 12 chaînes de 12 caractères
  waves: { type: 'puppet' | 'shield' | 'thrower' | 'colossus'; at: [number, number] }[][];   // [col, row]
}
```

Le libellé affiché d'un niveau est sa position ("Level 7" / "Niveau 7"), pas son `id`. Le contenu ne dépend pas de la langue.

## Données persistées

Clé `play:slash`, version 1, même forme que Delta :

```ts
interface SlashSave {
  levels: Record<string, {
    bestTicks: number;     // durée de la victoire la plus rapide, en pas de jeu
    flawless: boolean;     // au moins une victoire sans coup reçu
  }>;
}
```

- Un niveau est gagné s'il a une entrée dans `levels`. Une défaite n'écrit rien.
- Les entrées du sélecteur viennent de `getUnlockEntries` (`src/games/shell/unlock.ts`), avec `flawless` comme règle du statut `perfect`.
- Une entrée dont l'`id` n'existe plus dans `levels.ts` est ignorée.

## Contraintes de validation

Vérifiées par les tests (AC-12) sur chaque niveau de `levels.ts` :

- `id` unique, en kebab-case ;
- `arena` : 12 chaînes de 12 caractères de l'alphabet, exactement un `H` ; toutes les cases de sol sont reliées entre elles (par les côtés) ;
- de deux à cinq vagues, chacune d'un à huit pantins, sur des cases de sol distinctes, à au moins 3 cases (distance de Manhattan) du départ du héros ;
- la stratégie de référence gagne en moins de 10 800 pas (3 minutes) ;
- un héros qui ne fait aucun trait perd en moins de 3 600 pas (une minute).
