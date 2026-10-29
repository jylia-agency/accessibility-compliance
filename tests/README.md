# Tests du skill

## Lancer les tests

```bash
npm test                     # équivaut à : node --test tests/unit/*.test.mjs tests/fixtures.test.mjs
npm run evaluate             # écrit tests/RESULTS.md à partir d'une exécution réelle
```

Les tests dynamiques (`tests/fixtures.test.mjs`) s'exécutent si Playwright est disponible (projet ou installation globale) ; sinon ils sont marqués « skipped » avec la raison. Ils chargent uniquement les fichiers locaux des fixtures (aucune requête réseau).

## Contenu

| Fichier | Rôle |
|---|---|
| `unit/color.test.mjs` | Algorithme de contraste : valeurs de référence, équivalence des seuils 0,04045 et 0,03928 sur les 256 valeurs 8 bits, absence d'arrondi favorable, formats de couleur (dont oklch), transparences, grand texte WCAG et RGAA, contraste non textuel, suggestions vérifiées |
| `unit/rules.test.mjs` | Intégrité des données : 106 critères RGAA, 13 thématiques ; 86 critères WCAG 2.2 actifs, 55 en A et AA ; chaque règle ne référence que des critères existants |
| `unit/parser.test.mjs` | Analyseur de balisage (JSX, Vue, Angular, Svelte) et CSS (médias, variables) |
| `unit/static-scan.test.mjs` | Cas de non-faux-positifs : texte dynamique, étiquette englobante ou dans un autre composant, texte de 14 px, composants inactifs, `:focus:not(:focus-visible)` |
| `unit/skill.test.mjs` | Format Agent Skills du `SKILL.md`, présence des fichiers, liens internes, convention éditoriale |
| `fixtures.test.mjs` | Comparaison des sorties statiques et dynamiques avec `expected.json` des deux fixtures |
| `evaluate.mjs` | Synthèse mesurée des vrais positifs, faux négatifs, faux positifs |

## Fixtures

- `fixtures/inaccessible-app/` : défauts volontaires (voir `EXPECTED.md`).
- `fixtures/accessible-app/` : aucun échec ni risque attendu, thèmes clair et sombre (voir `EXPECTED.md`).

## Limites connues, observées pendant le développement

- **Faux négatif statique** : une couleur par défaut du navigateur (liens #0000EE en thème sombre) ne peut pas être vue par l'analyse statique ; seule l'analyse dynamique la détecte.
- **Gestionnaires d'événements ajoutés par script** (`addEventListener`) : invisibles pour l'analyse statique ; l'analyse dynamique les détecte via le protocole DevTools.
- **Composants** : un bouton dont le contenu est un composant (`<TrashIcon />`) n'est pas évalué statiquement (non concluant).
- **Corroboration statique / dynamique** : `build-matrix.mjs` propose des « candidats de corroboration » par type de règle, sans correspondance fine entre fichier et élément rendu : l'auditeur confirme.
- **Simulation d'agrandissement du texte** : approximation (tailles calculées doublées).
- Les chiffres de `RESULTS.md` portent sur des fixtures construites pour les défauts recherchés ; ils **ne mesurent pas** la fiabilité sur des projets réels.

## Essais exploratoires hors fixtures (29/10/2026)

L'analyse statique a été lancée, sans modification, sur trois corpus réels présents dans l'environnement de développement, pour vérifier la robustesse (aucune erreur d'exécution) et repérer des faux positifs grossiers :

- source du site RGAA (dépôt DISIC, 70 fichiers lus, gabarits Nunjucks non analysés) : 1 constat `hover-only-content` erroné (sélecteur combinant `:focus` et `:hover` dans la même règle), corrigé ;
- gabarits HTML de l'interface web de pprof (outil Go) : langue absente sur 5 pages, champs avec placeholder seul ; constats cohérents avec le code ;
- gabarit de diapositives de pandoc : image sans alternative, largeurs et hauteurs fixes ; constats cohérents avec le code.

Ces essais ne constituent pas une mesure de fiabilité.
