# WCAG 2.2 : repères pour l'audit

Source normative : https://www.w3.org/TR/WCAG22/ (Recommandation du 5 octobre 2023, republiée le 12 décembre 2024, V2). Traduction française autorisée : https://www.w3.org/Translations/WCAG22-fr/. Liste machine : `scripts/lib/wcag22.mjs` ; consultation : `node scripts/criteria.mjs wcag <id>` et `node scripts/criteria.mjs liste-wcag AA`.

## Chiffres clés (vérifiés dans les données du skill)

- 86 critères de succès actifs : 31 A, 24 AA, 31 AAA.
- Conformité **AA = 55 critères** (A + AA).
- **4.1.1 Parsing** : obsolète et retiré en WCAG 2.2.
- Nouveaux en 2.2 : 2.4.11 (AA), 2.4.12 (AAA), 2.4.13 (AAA), 2.5.7 (AA), 2.5.8 (AA), 3.2.6 (A), 3.3.7 (A), 3.3.8 (AA), 3.3.9 (AAA).

## Conformité WCAG (section « Conformance »)

Les cinq exigences : niveau atteint ; **pages complètes** ; **processus complets** ; usages de technologies compatibles avec l'accessibilité uniquement ; non-interférence. Une affirmation de conformité porte sur des pages web identifiées, à une date donnée. **Le skill ne formule pas d'affirmation de conformité WCAG** : il rend compte de résultats de tests sur un périmètre.

## Versions et contexte juridique

- WCAG est un **standard technique**. Sa version la plus récente n'est pas automatiquement celle exigée par un texte : la directive 2016/2102 s'appuie sur EN 301 549 V3.2.1, fondée sur WCAG 2.1 ; le RGAA 4.1.2 se réfère à WCAG 2.1.
- Un audit « WCAG 2.2 AA » est un choix de référentiel du commanditaire, ou une anticipation (EN 301 549 V4.1.1, RGAA 5).
- WCAG 3.0 est un brouillon de travail : ne jamais l'utiliser comme exigence.

## Critères nouveaux en 2.2 : points d'audit

| Critère | Niveau | Exigence (résumé) | Méthode |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | L'élément qui a le focus n'est pas **entièrement** masqué par un contenu de l'auteur | `dynamic-audit.mjs` (échantillonnage de points) + vérification manuelle avec en-têtes fixes, bannières, zoom |
| 2.4.13 Focus Appearance | AAA | Indicateur d'au moins l'aire d'un périmètre de 2 px, contraste 3:1 entre états | Bonne pratique sauf engagement AAA |
| 2.5.7 Dragging Movements | AA | Alternative à pointeur unique pour tout glisser-déposer, sauf si essentiel | Revue des composants (tri, curseurs, cartes) + test manuel |
| 2.5.8 Target Size (Minimum) | AA | Cible d'au moins 24 × 24 px CSS, ou exceptions : **espacement** (cercle de 24 px sans intersection), **équivalent**, **en ligne**, **agent utilisateur**, **essentiel** | `dynamic-audit.mjs` mesure taille et espacement ; exceptions « équivalent » et « essentiel » à juger |
| 3.2.6 Consistent Help | A | Mécanismes d'aide présents sur plusieurs pages dans le même ordre relatif | Comparaison manuelle des pages |
| 3.3.7 Redundant Entry | A | Information déjà saisie dans le même processus : remplie automatiquement ou sélectionnable, sauf exceptions | Parcours des formulaires multi-étapes |
| 3.3.8 Accessible Authentication (Minimum) | AA | Pas de test cognitif (mémorisation, transcription, calcul) sans alternative ou aide ; copier-coller et gestionnaires de mots de passe autorisés | Revue de la page de connexion : `autocomplete="current-password"`, collage non bloqué, CAPTCHA |

## Pièges d'interprétation

- **Pas de taille de police minimale** dans WCAG 2.2 (voir `references/typography.md`).
- **44 × 44 px** est le seuil de 2.5.5, critère **AAA**. Le critère AA est 2.5.8 (24 px avec exceptions).
- **1.4.3** exclut le texte des composants inactifs, le texte purement décoratif ou invisible, le texte faisant partie d'une image contenant d'autres éléments visuels importants, et les logotypes.
- **1.4.11** : composants d'interface (et leurs états) et objets graphiques nécessaires à la compréhension ; exclut les composants inactifs et l'apparence déterminée par l'agent utilisateur et non modifiée par l'auteur.
- **2.2.2** : concerne le contenu en mouvement, clignotant ou défilant qui démarre automatiquement, dure plus de 5 secondes et est présenté en parallèle d'autre contenu, sauf s'il est essentiel. Toute animation n'est pas concernée.
- **1.4.10** : 320 px CSS de large pour un défilement vertical (256 px de haut pour un défilement horizontal) ; exceptions pour le contenu qui exige une disposition en deux dimensions (cartes, tableaux de données, diagrammes, jeux, présentations, barres d'outils).
- **1.4.12** : on vérifie qu'**aucune perte de contenu ou de fonctionnalité** n'apparaît quand l'utilisateur applique les valeurs d'espacement (hauteur de ligne 1,5 ; espacement des paragraphes 2 fois la taille ; espacement des lettres 0,12 fois ; espacement des mots 0,16 fois). Le critère n'impose pas ces valeurs par défaut.
- **4.1.2** : la présence d'attributs ARIA ne prouve pas l'accessibilité ; il faut vérifier le nom, le rôle, la valeur et les changements d'état restitués.

## Ressources W3C

- Understanding WCAG 2.2 : https://www.w3.org/WAI/WCAG22/Understanding/
- Techniques WCAG 2.2 : https://www.w3.org/WAI/WCAG22/Techniques/
- Quick Reference : https://www.w3.org/WAI/WCAG22/quickref/
- Nouveautés de WCAG 2.2 : https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
