# Contribuer

Merci de contribuer à `accessibility-compliance`. Le projet privilégie la **précision** et la **prudence des conclusions** sur l'exhaustivité.

## Principes non négociables

1. Toute exigence citée renvoie à une **source officielle** identifiée (texte, version, date de vérification). Pas de critère, de seuil ou d'obligation de mémoire.
2. Une règle d'analyse ne produit « Échec vérifié » que si la preuve est démonstrative. Dans le doute : « Risque potentiel » ou « À vérifier manuellement ».
3. Pas de bonne pratique présentée comme une obligation ; pas de taille de police minimale ; pas de seuil de 44 px présenté comme une exigence AA.
4. Les scripts restent **sans dépendance** et en **lecture seule** vis-à-vis du projet audité.
5. Pas de tiret cadratin dans les textes du dépôt (convention éditoriale vérifiée par les tests).

## Ajouter ou modifier une règle

1. Déclarer la règle dans `scripts/lib/rules.mjs` (titre, critères WCAG 2.2 et RGAA 4.1.2 existants, gravité, impact, correction, validation). Le test `tests/unit/rules.test.mjs` vérifie que les critères existent.
2. Implémenter la détection dans `scripts/static-scan.mjs` ou `scripts/lib/browser-checks.js` et l'ajouter à la liste de couverture.
3. Ajouter un cas **positif** dans `tests/fixtures/inaccessible-app/` et, si possible, un cas **négatif** (ne doit rien produire) dans `tests/fixtures/accessible-app/` ou `tests/unit/static-scan.test.mjs`.
4. Mettre à jour `expected.json` et `EXPECTED.md` de la fixture.
5. Lancer `npm test` puis `npm run evaluate`, et joindre la synthèse à la demande de fusion. Ne jamais annoncer de métrique non mesurée.

## Mettre à jour une source

Suivre `references/maintenance.md`. Indiquer le niveau de vérification (V1, V2, V3, NV) et la date dans `data/sources.json` et `references/official-sources.md`. Ne jamais écraser les données d'une version de référentiel : ajouter un fichier versionné.

## Style

- Documentation et rapports en français.
- Code : modules ES, Node.js 18 ou plus, pas de dépendance, commentaires en français.
- Messages de commit descriptifs.

## Signaler un faux positif ou un faux négatif

Ouvrir un ticket avec un extrait minimal reproductible, la sortie du script, le résultat attendu et le critère concerné (avec lien vers la source officielle).
