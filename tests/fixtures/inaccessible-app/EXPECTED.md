# Fixture `inaccessible-app` : défauts volontaires et résultats attendus

Page de tableau de bord (`index.html`, `styles.css`, `app.js`) et composant React (`src/Toolbar.jsx`) contenant des défauts **volontaires**. Version machine : `expected.json` (utilisée par `tests/fixtures.test.mjs` et `tests/evaluate.mjs`).

## Défauts et détection attendue

| Id | Défaut | Emplacement | Analyse statique attendue | Analyse dynamique attendue |
|---|---|---|---|---|
| D01 | Texte #999999 sur #FFFFFF (2,84:1) | `styles.css` `.muted` | `css-contrast-text` : Risque potentiel | `contrast-text` : **Échec vérifié** |
| D01b | Bouton #FFFFFF sur #73B9B0 (2,25:1) | `.btn-primary` | `css-contrast-text` : Risque potentiel | `contrast-text` : **Échec vérifié** |
| D02 | Bouton icône sans nom accessible | `index.html` `#menu-btn` ; `Toolbar.jsx` | `button-name-missing` : **Échec vérifié** | (axe-core `button-name` si exécuté) |
| D03 | Image informative sans alternative | `index.html` ; `Toolbar.jsx` | `img-alt-missing` : **Échec vérifié** | (axe-core `image-alt`) |
| D04 | Champs sans étiquette / placeholder seul | `#code`, `#email` ; `Toolbar.jsx` (composant partiel) | `form-label-missing`, `form-placeholder-only` : **Échec vérifié** (document complet), Risque potentiel (composant partiel) | (axe-core `label`) |
| D05 | Focus invisible (`outline: none`) | `styles.css` | `focus-outline-removed` : Risque potentiel | `focus-not-visible` : **Échec vérifié** (6 éléments) |
| D06 | Modale : sans nom, focus non déplacé, non maintenu, non restitué, Échap inopérant | `#modal`, `app.js` | `dialog-unlabelled` : **Échec vérifié** ; `dialog-focus-management` : À vérifier manuellement | `dialog-focus-not-moved`, `dialog-focus-not-returned` : **Échec vérifié** ; `dialog-focus-escapes` : Risque potentiel (non déclarée modale) ; `dialog-escape` : Bonne pratique |
| D07 | Titre coupé (hauteur fixe + débordement masqué) ; largeur minimale fixe | `.card-title`, `.content` | `text-fixed-height-overflow`, `css-fixed-width` : Risque potentiel | `text-spacing-clipping` : **Échec vérifié** ; `text-resize-clipping` : Risque potentiel (simulation) ; `reflow-horizontal-scroll` : **Échec vérifié** |
| D08 | Élément cliquable non focalisable | `div#save` ; `Toolbar.jsx` | `click-non-interactive`, `role-interactive-not-focusable` : Risque potentiel | `keyboard-unreachable` : **Échec vérifié** |
| D09 | Tableau de données sans `<th>` (en-têtes simulés en gras) | `table.invoices` | `table-structure` : Risque potentiel | Non couvert |
| D10 | Animation infinie sans pause | `.ticker p` | `animation-infinite` : Risque potentiel ; `reduced-motion-missing` : Bonne pratique | `animation-infinite` : Risque potentiel ; `reduced-motion-missing` : Bonne pratique |
| D11 | Langue absente | `<html>` | `html-lang-missing` : **Échec vérifié** | `html-lang-missing` : **Échec vérifié** |
| D12 | Zoom bloqué | meta viewport | `viewport-zoom-disabled` : Risque potentiel | (axe-core `meta-viewport`) |
| D13 | Lien « En savoir plus » | `index.html` | `link-text-generic` : À vérifier manuellement | Non couvert |
| D14 à D19 | Absence de `main`, de lien d'évitement, d'`autocomplete` ; titres h1 puis h3 ; erreurs de formulaire ; `prefers-reduced-motion` | | Risques et contrôles manuels (voir `expected.json`) | |

## Ce qui ne doit **pas** être signalé

| Cas | Raison |
|---|---|
| `<button onClick={onDelete}><TrashIcon /></button>` | Contenu rendu par un composant : nom inconnu, l'analyse statique ne doit pas conclure (manque de preuve, et non conformité) |
| `if (count < 1)` dans `Toolbar.jsx` | Comparaison JavaScript : ne doit pas être interprétée comme une balise |
| Champ `#name` de la modale | Étiqueté par `<label for="name">` |
| Bouton `#menu-btn` de 20 × 20 px (2.5.8) | L'exception d'espacement s'applique : le cercle de 24 px centré sur la cible n'intersecte aucune autre cible |

## Distinction échec / validation humaine

La fixture vérifie que les outils :

- classent en **Échec vérifié** uniquement ce qui est démontré (balisage sans ambiguïté, styles calculés, test clavier réel) ;
- classent en **Risque potentiel** les indices de code non confirmés (règle CSS isolée, composant partiel, simulation) ;
- classent en **À vérifier manuellement** les contrôles de pertinence (contexte d'un lien, hiérarchie des titres, messages d'erreur, gestion du focus avant test dynamique).
