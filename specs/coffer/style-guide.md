# Charte graphique : Coffer

## Direction artistique

L'établi d'un ébéniste, le soir, sous une lampe. Chaque coffret est taillé dans un bois différent (érable blond, noyer, ébène, laque rouge), avec des ferrures en laiton et des incrustations d'ivoire. Les mécanismes sont précis et satisfaisants à manipuler : un tiroir qui coulisse, un cadran qui crante, une clé qui tourne. Les gravures sont fines, presque cachées dans le veinage. L'ouverture du couvercle libère une lueur chaude, comme un trésor de boîte à musique.

## Palette

Custom properties déclarées sur `.game-coffer`. Aucune couleur ne contraste avec les quatre bois à la fois : chaque mécanisme associe un corps `--coffer-brass` et un contour `--coffer-ink`. Le laiton est lisible sur le noyer, l'ébène et la laque, l'encre sur l'érable.

| Custom property | Valeur | Contraste | Usage |
|---|---|---|---|
| `--coffer-maple` | `#D8B98A` | 10,3:1 sur `--color-bg` | Bois d'érable. |
| `--coffer-walnut` | `#7A5233` | | Bois de noyer. |
| `--coffer-ebony` | `#2B2420` | 1,3:1 sur `--color-bg` | Bois d'ébène (le bord en laiton du coffret le détache du fond). |
| `--coffer-lacquer` | `#8E2B2B` | | Laque rouge. |
| `--coffer-grain` | `rgb(0 0 0 / 0.12)` | | Veinage du bois (décoratif). |
| `--coffer-brass` | `#E3BD6B` | 1,0 / 3,8 / 8,5 / 4,6:1 sur érable, noyer, ébène, laque ; 9,8:1 sur `--color-surface` | Corps des mécanismes, ferrures, objets. |
| `--coffer-ink` | `#1A1410` | 9,7 / 2,7 / 1,2 / 2,2:1 sur érable, noyer, ébène, laque ; 10,2:1 sur `--coffer-brass` | Contours, gravures sur l'érable, symboles des cadrans. |
| `--coffer-ivory` | `#F3EAD8` | 1,6 / 5,7 / 12,8 / 6,9:1 sur érable, noyer, ébène, laque | Gravures sur les bois sombres, incrustations. |
| `--coffer-glow` | `#FFD98A` | | Lueur de l'intérieur du coffret à la victoire (décorative). |

Les gravures sont en `--coffer-ink` sur l'érable, en `--coffer-ivory` sur les trois autres bois.

## Éléments de jeu

| Élément | Apparence |
|---|---|
| Face | Carré de bois avec son veinage, bord en laiton, coins renforcés. |
| Flèche de bord | Chevron `--color-text` (token du site) sur une pastille `--color-surface` à 85 %, à l'extérieur de la face, au milieu du bord. |
| Tiroir | Façade rectangulaire avec une poignée en laiton ; ouvert, il dépasse de la face et montre son fond plus sombre. |
| Panneau coulissant | Plaque de bois légèrement en relief, rainures sur deux bords ; ouvert, il a glissé et découvre une cavité. |
| Trappe | Plaque carrée à charnière en laiton ; ouverte, elle est basculée et montre la cavité. |
| Compartiment bloqué | Pas de signe distinctif avant qu'on le touche : le tremblement et le son l'indiquent. |
| Cadran | Disque en laiton cerclé d'encre, une fenêtre qui montre la valeur courante en `--coffer-ink`, une encoche en haut. |
| Bouton | Disque en laiton ; sorti, ombre portée et reflet ; enfoncé, cercle intérieur et sans ombre. |
| Levier | Manette en laiton sur un socle, inclinée à gauche ou à droite. |
| Serrure | Plaque en laiton avec un trou de serrure dont la forme répète l'anneau de la clé attendue ; remplie, la clé y est visible. |
| Emplacement | Creux en forme de l'objet attendu ; rempli, l'objet y est posé. |
| Couvercle | Toute la face du dessus, avec une ferrure centrale ; s'ouvre vers l'arrière. |
| Gravure | Points, symboles ou chiffres fins, en encre ou en ivoire selon le bois. |
| Clés | Tige en laiton, anneau rond, carré ou triangulaire. |
| Gemmes | Pierre ronde ou carrée, facettes claires sur fond `--coffer-brass` (même teinte, formes différentes). |
| Pièce, manivelle | Disque en laiton gravé ; manivelle coudée. |
| Breloque | Petit pendentif en forme d'étoile, en laiton poli, dans un emplacement à part, à gauche de l'inventaire. |
| Inventaire | Six places carrées de 48px, fond `--color-surface`, bord `--color-border` (tokens du site) ; l'objet sélectionné est cerclé de `--color-accent`. |
| Curseur clavier, anneau d'indice | Trait de 2px `--color-accent` (token du site) doublé à l'intérieur d'un trait de 2px `--coffer-ink` : le cyan reste lisible sur les bois sombres, l'encre sur l'érable. |
| Bulle d'indice | Fond `--color-surface-raised`, texte `--color-text` (tokens du site), `--radius-md`, au-dessus de la face. |

## Animations

Des gestes d'objet précieux : le coffret pivote avec un peu d'inertie, les tiroirs coulissent, les cadrans crantent, les objets filent vers l'inventaire. À la victoire, le couvercle s'ouvre lentement sur une lueur chaude. Durées et comportement en mouvement réduit : voir `technical-specifications.md`.

## Sons

Sons de bois et de métal fin : frottement à la rotation, toc sourd sur un mécanisme bloqué, glissement puis clic d'un tiroir, cliquetis de cadran, clic de bouton ou de levier, tintement d'un objet ramassé, clic de serrure, carillon de la breloque, et une petite mélodie de boîte à musique à l'ouverture. Détail de la synthèse dans `technical-specifications.md`.

## Assets tiers

Aucun.

## Couverture

Un coffret de noyer à ferrures en laiton, vu de trois quarts sous une lampe : un tiroir dérobé entrouvert laisse voir une petite clé, un cadran à trois chiffres sur la face avant, et le couvercle entrebâillé laisse filtrer une lueur dorée.
