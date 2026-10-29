# Outils du skill

Tous les scripts sont en Node.js (18 ou plus), **sans dépendance**, en lecture seule vis-à-vis du projet audité. Les chemins sont relatifs au dossier du skill. Ils n'écrivent que dans les chemins de sortie indiqués explicitement (ou, pour l'analyse dynamique, dans un dossier temporaire par défaut).

| Script | Rôle | Exécute du code du projet ? | Réseau |
|---|---|---|---|
| `scripts/static-scan.mjs` | Inventaire et analyse statique (HTML, JSX/TSX, Vue, Svelte, Angular, CSS/SCSS/Less) | Non (lecture de fichiers) | Non |
| `scripts/contrast.mjs` | Calcul de contraste WCAG/RGAA, suggestions vérifiées | Non | Non |
| `scripts/criteria.mjs` | Consultation des critères RGAA 4.1.2 et WCAG 2.2 | Non | Non |
| `scripts/dynamic-audit.mjs` | Navigateur automatisé : contrastes calculés, clavier, focus, dialogues, redistribution, espacement, agrandissement, cibles, animations, axe-core optionnel | **Oui** : exécute le JavaScript des pages chargées | Oui si l'URL est distante |
| `scripts/build-matrix.mjs` | Consolidation des résultats, renumérotation A11Y-NNN, matrice préliminaire | Non | Non |
| `scripts/rgaa-rate.mjs` | Taux RGAA à partir d'une grille remplie par l'auditeur | Non | Non |
| `scripts/check-sources.mjs` | Veille : ancienneté des vérifications, contrôle en ligne optionnel des sources | Non | Seulement avec `--online` |

## Analyse statique

```bash
node scripts/static-scan.mjs <projet> --json /chemin/hors-projet/statique.json --md /chemin/hors-projet/statique.md
node scripts/static-scan.mjs <projet> --exclude "^legacy/" --exclude "\.stories\."
```

- Dossiers ignorés : `node_modules`, `dist`, `build`, `.next`, `coverage`, `vendor`, etc. ; fichiers minifiés et fichiers de plus de 1,5 Mo.
- Les composants (balises en majuscule, `<x-y>`) ne sont pas analysés comme des éléments HTML : leur rendu est inconnu.
- Les props étalées (`{...props}`) et identifiants dynamiques rendent un élément « non concluant » (compté dans `elementsNonConcluants`).
- Limites : pas d'exécution, cascade CSS non résolue, classes utilitaires (Tailwind) non traduites en couleurs (fournir les valeurs du thème à `contrast.mjs`), gabarits serveur (Twig, Blade, Jinja, Nunjucks, ERB) non analysés.

## Contraste

```bash
node scripts/contrast.mjs "#FFFFFF" "#73B9B0" --size 16px --weight 400 --suggest both
node scripts/contrast.mjs "#767676" "rgba(255,255,255,.8)" --backdrop "#1E1E1E"
node scripts/contrast.mjs "#949494" "#FFFFFF" --type non-text
node scripts/contrast.mjs --pairs paires.json --json
```

Formats acceptés : hexadécimal, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(srgb|srgb-linear|display-p3)`, couleurs nommées CSS. Refusés : `var()`, `currentColor`, `color-mix()` (à résoudre d'abord).

## Analyse dynamique

**À n'exécuter qu'avec l'autorisation de l'utilisateur.**

```bash
node scripts/dynamic-audit.mjs ./dist/index.html --out /tmp/audit-dyn
node scripts/dynamic-audit.mjs http://localhost:3000/ http://localhost:3000/contact --dialog-trigger "#open-login" --color-scheme dark
node scripts/dynamic-audit.mjs https://recette.example.fr/ --axe ./node_modules/axe-core/axe.min.js
```

- Playwright est recherché dans le projet courant, puis dans l'installation globale. Le script **ne l'installe jamais**. S'il est absent : se limiter à l'analyse statique et marquer les contrôles dynamiques « Non testé ».
- Le serveur de développement du projet n'est **pas** lancé par le skill : demander à l'utilisateur de le démarrer, ou d'autoriser explicitement la commande.
- Sorties : `resultats-dynamiques.json`, captures `page-N.png` et `page-N-320px.png`, `ordre-tabulation-N.json`, `arbre-accessibilite-N.yml`, `axe-N.json`.
- Couverture : état par défaut de chaque page, sans authentification. Les états de survol, d'erreur et les parcours authentifiés exigent des scénarios ou des tests manuels.

## Consolidation et matrice

```bash
node scripts/build-matrix.mjs statique.json dynamique/resultats-dynamiques.json --referentiel les-deux --json constats.json --md matrice.md
```

Statuts produits : « Non conforme (échec vérifié) », « À confirmer (risque) », « À vérifier manuellement », « Contrôle automatisé partiel sans échec détecté (non conclusif) », « Non testé ». Le statut « Conforme » n'est jamais généré automatiquement.

## Taux RGAA

```bash
node scripts/rgaa-rate.mjs grille.json
```

Format de la grille : voir l'en-tête du script et `templates/compliance-matrix.md`.
