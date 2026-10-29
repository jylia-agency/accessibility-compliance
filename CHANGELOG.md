# Journal des modifications

Format inspiré de « Keep a Changelog » ; numérotation sémantique.

## [1.0.0] : 2026-10-29

### Ajouté

- `SKILL.md` du skill `accessibility-audit` (format Agent Skills) : règles impératives, quatre modes (audit complet, ciblé, contre-vérification, remédiation), procédure en douze étapes, classification des constats.
- Références : cadre juridique, sources officielles avec niveaux de vérification, applicabilité, RGAA, WCAG, EN 301 549, contrastes, typographie, clavier, HTML et ARIA, formulaires, images et multimédia, responsive et mobile, animations, documents, méthodologie, outils, compatibilité des agents, applications natives, maintenance.
- Données officielles RGAA 4.1.2 (106 critères, tests et méthodologies) extraites du dépôt DISIC (commit `ca4019f`, 18/08/2026).
- Scripts sans dépendance : `static-scan.mjs`, `contrast.mjs`, `criteria.mjs`, `dynamic-audit.mjs` (Playwright, axe-core optionnel), `build-matrix.mjs`, `rgaa-rate.mjs`, `check-sources.mjs`, `build-rgaa-data.mjs`.
- Modèles : rapport d'audit, matrice de conformité, plan de remédiation, checklist manuelle, projet de déclaration d'accessibilité.
- Fixtures `inaccessible-app` et `accessible-app` avec résultats attendus, tests unitaires et d'intégration, synthèse mesurée (`tests/RESULTS.md`).

### Sources vérifiées le 29/10/2026

- RGAA 4.1.2 en vigueur ; RGAA 5 annoncé, non publié.
- WCAG 2.2 (republiée le 12/12/2024) ; WCAG 3.0 au stade de brouillon.
- EN 301 549 V3.2.1 harmonisée ; V4.1.1 publiée par l'ETSI, non citée au JOUE.
- Décret n° 2019-768 modifié par le décret n° 2026-816 du 24 août 2026 (texte intégral non lu).
