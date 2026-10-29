# Veille documentaire et procédure de mise à jour

Objectif : qu'aucune source obsolète ne soit présentée comme la dernière version sans vérification.

## Registre

- `data/sources.json` : registre lisible par machine (identifiant, titre, URL, version retenue, date et niveau de vérification, points à surveiller).
- `references/official-sources.md` : version lisible du même registre.
- `node scripts/check-sources.mjs` : liste les sources dont la vérification date de plus de 180 jours (`--max-age` pour changer le seuil) et les points « à confirmer ».
- `node scripts/check-sources.mjs --online` : interroge chaque URL (avec l'accord de l'utilisateur) et recherche des indices de nouvelle version (« RGAA 5 », « WCAG 2.3 », « V4.2 »...). Les résultats sont des **indices** : toute mise à jour exige une lecture humaine du texte officiel.

## Fréquence

| Source | Fréquence | Événements déclencheurs |
|---|---|---|
| RGAA | Trimestrielle, et immédiatement à l'annonce du RGAA 5 | Publication d'une version, d'un arrêté, d'errata |
| WCAG / WAI-ARIA | Semestrielle | Errata, nouvelle version, traduction autorisée |
| EN 301 549 | Semestrielle | Citation de la V4.1.1 au JOUE ; norme harmonisée au titre de la directive 2019/882 |
| Textes français (article 47, décret 2019-768, Code de la consommation) | Trimestrielle | Lois d'adaptation au droit de l'UE, décrets, décisions de l'Arcom |
| Directives européennes et actes d'exécution | Semestrielle | Décisions d'exécution, révisions |

## Procédure de mise à jour

1. Lire la source officielle (Légifrance, EUR-Lex, W3C, ETSI, site RGAA) dans sa version consolidée.
2. Mettre à jour `data/sources.json` (version, date, niveau de vérification) et `references/official-sources.md`.
3. Si le RGAA change : **ajouter** un fichier de données versionné (`node scripts/build-rgaa-data.mjs <criteres.json> <methodologies.json> <commit> data/rgaa-<version>-criteres.json`), sans écraser l'ancien ; adapter `criteria.mjs`, `build-matrix.mjs`, `rgaa-rate.mjs` et les règles (`rules.mjs`) avec une option de version ; documenter la période de transition (validité des déclarations antérieures).
4. Si WCAG change : ajouter une liste versionnée à côté de `wcag22.mjs` ; ne pas modifier rétroactivement les correspondances.
5. Mettre à jour les références concernées, le `CHANGELOG.md` et la date de vérification dans `SKILL.md` (champ `metadata`).
6. Exécuter `npm test`.
7. Publier une nouvelle version (étiquette Git, numérotation sémantique).

## Points à surveiller au 29/10/2026

- Publication du **RGAA 5** (annoncée pour fin 2026) et de l'arrêté correspondant.
- Texte consolidé du **décret n° 2019-768** après le décret n° 2026-816 (liste exacte des exemptions, article 5).
- Citation au JOUE d'**EN 301 549 V4.1.1** (directive 2016/2102) et de normes harmonisées au titre de la directive 2019/882.
- Libellé de l'**article R. 451-4** du Code de la consommation.
- Mise à jour 2026 de la **traduction française autorisée** de WCAG 2.2 (date exacte).
- Statut d'**ARIA 1.3**.
