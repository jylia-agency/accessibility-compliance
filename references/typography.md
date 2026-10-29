# Typographie, agrandissement et espacement du texte

Critères : WCAG 2.2 **1.4.4** Resize Text (AA), **1.4.10** Reflow (AA), **1.4.12** Text Spacing (AA), **1.4.3** (lien avec la taille), **1.4.5** Images of Text (AA), **1.4.8** Visual Presentation (AAA) ; RGAA **10.4**, **10.11**, **10.12**, **1.8**, **3.2**.

## Règle impérative

**Aucune taille de police minimale universelle n'est imposée par WCAG 2.2 ni par le RGAA 4.1.2.** Un texte de 14 px, de 12 px ou de 11 px n'est **jamais** non conforme du seul fait de sa taille. La taille intervient uniquement :

- dans la **détermination du seuil de contraste** (grand texte : seuil de 3:1 au lieu de 4,5:1) ;
- dans l'exigence d'**agrandissement à 200 %** sans perte de contenu ni de fonctionnalité (1.4.4).

Les tailles « conseillées » (16 px pour le texte courant, par exemple) relèvent de la **bonne pratique de lisibilité** : `static-scan.mjs` les signale au mieux comme « Bonne pratique » (texte inférieur à 12 px), jamais comme échec.

## Ce qu'il faut contrôler

| Point | Critère | Méthode | Signal d'échec |
|---|---|---|---|
| Unités de police | 1.4.4 | Statique | Taille uniquement en `vw`/`vh` (technique d'échec F94) ; les px ne sont **pas** un échec : le zoom du navigateur les agrandit |
| Zoom 200 % | 1.4.4 / RGAA 10.4 | Dynamique + manuel | Texte coupé, superposé, contrôles inaccessibles. Le RGAA admet le zoom graphique, l'agrandissement du texte seul ou un composant du site |
| Zoom bloqué | 1.4.4 | Statique | `user-scalable=no`, `maximum-scale` inférieur à 2 dans la balise viewport |
| Hauteurs fixes | 1.4.4 / 1.4.12 | Statique (risque) puis dynamique | `height` fixe avec `overflow: hidden` sur un conteneur de texte |
| Troncature | 1.4.10 / 1.4.4 | Statique (« À vérifier ») | `text-overflow: ellipsis` : acceptable si le texte complet est disponible autrement |
| Redistribution | 1.4.10 / RGAA 10.11 | Dynamique à 320 px CSS | Défilement horizontal hors contenus exemptés |
| Espacement du texte | 1.4.12 / RGAA 10.12 | Dynamique | Perte de contenu après application de : hauteur de ligne 1,5 ; paragraphes 2 em ; lettres 0,12 em ; mots 0,16 em |
| Texte en image | 1.4.5 / RGAA 1.8 | Manuel | Texte informatif rendu en image alors que du texte stylé était possible (logos exclus) |
| Largeur des blocs, justification, interligne par défaut | 1.4.8 (AAA) | Manuel | Bonne pratique sauf engagement AAA |

## Distinguer les deux formes d'agrandissement

- **Zoom de page** (Chrome, Edge, Safari, Firefox par défaut) : tout est agrandi, y compris les hauteurs en px. Les défauts apparaissent surtout par la **redistribution** (fenêtre CSS plus étroite). Simulation : fenêtre de 640 px CSS pour 1 280 px à 200 %, ou de 320 px pour 400 %.
- **Agrandissement du texte seul** (Firefox « Zoom texte seulement », réglages de taille de police) : seules les polices grandissent ; les hauteurs fixes en px coupent le texte. `dynamic-audit.mjs` simule ce mode en doublant les tailles calculées (résultat « Risque potentiel » : simulation à confirmer dans un navigateur réel).

## Recommandations de correction

- Remplacer `height` par `min-height` sur les conteneurs de texte ; éviter `overflow: hidden` sur le texte.
- Utiliser `rem`/`em` ou `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` pour les tailles fluides.
- Exprimer `line-height` sans unité (`1.5`) pour qu'il suive la taille.
- Mises en page fluides : `flex-wrap`, `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))`, `max-width: 100%`.
- Ne jamais bloquer le zoom dans la balise viewport.
