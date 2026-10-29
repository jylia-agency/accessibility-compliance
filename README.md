# accessibility-compliance

Skill open source **`accessibility-audit`** pour Claude Code, OpenAI Codex et les agents compatibles avec le format [Agent Skills](https://agentskills.io/). Il permet à un agent d'auditer l'accessibilité numérique d'un projet existant, de prouver ses constats, de proposer des corrections et de produire des livrables en français.

> **Ce skill ne délivre aucune certification.** Il assiste un audit technique. Les résultats automatisés ne couvrent qu'une partie des critères et ne constituent jamais une preuve de conformité. Les conclusions juridiques relèvent d'une analyse dédiée.

## Objectifs

- Auditer des sites institutionnels, applications SaaS, plateformes pédagogiques, PWA, interfaces d'administration : HTML/CSS, JavaScript, TypeScript, React, Next.js, Vue, Angular, Svelte, Tailwind.
- Distinguer rigoureusement **échec vérifié**, **risque potentiel**, **contrôle manuel**, **non testé** et **bonne pratique**.
- Calculer les contrastes avec l'algorithme officiel, sans jamais deviner une couleur.
- Séparer les référentiels (RGAA 4.1.2, WCAG 2.2) et les qualifications (obligation réglementaire, exigence du référentiel, bonne pratique, point juridique à analyser).
- Fonctionner en **lecture seule** par défaut ; corriger uniquement sur demande explicite.

## Référentiels couverts (état au 29/10/2026)

| Référentiel | Version | Données |
|---|---|---|
| RGAA | **4.1.2** (106 critères, 13 thématiques) | `data/rgaa-4.1.2-criteres.json`, extrait du dépôt officiel DISIC (Licence Ouverte 2.0) avec tests et méthodologies |
| WCAG | **2.2** (republiée le 12/12/2024) : 86 critères, 55 en A et AA | `scripts/lib/wcag22.mjs` |
| WAI-ARIA | 1.2 | `scripts/lib/aria.mjs` |
| EN 301 549 | V3.2.1 (harmonisée, directive 2016/2102) ; V4.1.1 (ETSI, 2026, non citée au JOUE à cette date) | `references/en-301-549.md` |
| Cadre juridique | Article 47 de la loi n° 2005-102 et article 47-1 ; décret n° 2019-768 modifié par le décret n° 2026-816 ; transposition de la directive 2019/882 ; directive 2016/2102 | `references/legal-framework.md` |

RGAA 5 : annoncé pour fin 2026, **non publié** au 29/10/2026. Les niveaux de vérification de chaque source sont indiqués dans [`references/official-sources.md`](references/official-sources.md).

## Installation

Le dossier d'installation doit s'appeler `accessibility-audit` (nom du skill).

### Claude Code

```bash
git clone https://github.com/jylia/accessibility-compliance.git ~/.claude/skills/accessibility-audit
```

Ou, pour un projet (skill partagé avec l'équipe) :

```bash
git clone https://github.com/jylia/accessibility-compliance.git .claude/skills/accessibility-audit
```

### OpenAI Codex

```bash
git clone https://github.com/jylia/accessibility-compliance.git ~/.codex/skills/accessibility-audit
```

Emplacement par défaut `$CODEX_HOME/skills` relevé dans des sources secondaires : vérifier la [documentation officielle de Codex](https://developers.openai.com/codex/skills) pour votre version, puis redémarrer Codex.

### Prérequis

- **Node.js 18 ou plus** pour les scripts (aucune dépendance à installer).
- Optionnel, pour l'analyse dynamique : **Playwright** et **Chromium** déjà présents (dans le projet audité ou installés globalement). Le skill ne les installe jamais.
- Optionnel : **axe-core** (fichier `axe.min.js` existant).

## Exemples de demandes

```text
Audite l'accessibilité de ce projet selon le RGAA 4.1.2.
Fais un audit WCAG 2.2 AA ciblé sur le formulaire d'inscription.
Vérifie les contrastes du design system, thèmes clair et sombre.
Contre-vérifie les constats A11Y-004 à A11Y-010 après correction.
Corrige A11Y-001 et A11Y-010 (mode remédiation).
Prépare un projet de déclaration d'accessibilité à partir de l'audit.
```

## Modes d'audit

| Mode | Usage | Modifie le projet |
|---|---|---|
| Audit complet | Échantillon représentatif, toutes thématiques | Non |
| Audit ciblé | Composants, pages ou thématiques désignés | Non |
| Contre-vérification | Constats d'un audit précédent et non-régression | Non |
| Remédiation | Sur demande explicite, constats désignés | Oui |

## Outils

```bash
node scripts/static-scan.mjs <projet> --json statique.json --md statique.md   # inventaire et analyse statique
node scripts/contrast.mjs "#FFFFFF" "#73B9B0" --size 16px --suggest both      # contraste et suggestions vérifiées
node scripts/criteria.mjs rgaa 3.2 --methodo                                  # critère RGAA, tests, méthodologie
node scripts/criteria.mjs wcag 2.5.8                                          # critère WCAG 2.2 et correspondances RGAA
node scripts/dynamic-audit.mjs <url> --dialog-trigger "#ouvrir" --out <dossier> # navigateur (avec autorisation)
node scripts/build-matrix.mjs statique.json <dossier>/resultats-dynamiques.json --md matrice.md
node scripts/rgaa-rate.mjs grille.json                                        # taux RGAA sur grille complète
node scripts/check-sources.mjs                                                # veille documentaire
```

Détails : [`references/tooling.md`](references/tooling.md).

## Livrables

Rapport d'audit, matrice de conformité, plan de remédiation, checklist des contrôles manuels, projet de déclaration d'accessibilité : voir [`templates/`](templates/) et l'exemple [`examples/example-audit.md`](examples/example-audit.md), produit à partir d'une exécution réelle sur une fixture.

## Limites

- **Analyse statique** : heuristique, sans exécution ; cascade CSS non résolue ; classes utilitaires (Tailwind) non converties en couleurs ; gabarits serveur (Twig, Blade, Jinja, Nunjucks, ERB) non analysés ; composants dont le rendu est inconnu non concluants.
- **Analyse dynamique** : état par défaut des pages, Chromium seulement, sans authentification ; états de survol et d'erreur non couverts sans scénario ; simulation de l'agrandissement du texte.
- **Aucun test avec technologie d'assistance** n'est réalisé par les outils : les critères qui l'exigent (RGAA 7.1, 7.5, 10.8...) restent des contrôles manuels.
- **Applications natives** : seulement inventoriées (`references/mobile-native.md`).
- **Documents** : inventaire et signalement ; l'audit documentaire requiert des outils dédiés.
- **Lecture seule** : consigne donnée à l'agent, pas une isolation technique ; voir [`references/agent-compatibility.md`](references/agent-compatibility.md) pour configurer chaque agent.
- **Sources** : plusieurs textes n'ont pu être vérifiés que par extraits (niveau V2) lors de la rédaction ; ils sont signalés comme tels.

## Méthode de test du skill

```bash
npm test                      # tests unitaires, fixtures statiques et dynamiques (si Playwright est disponible)
node tests/evaluate.mjs       # synthèse mesurée des vrais positifs, faux négatifs et faux positifs
```

Fixtures : [`tests/fixtures/inaccessible-app`](tests/fixtures/inaccessible-app/EXPECTED.md) (défauts volontaires) et [`tests/fixtures/accessible-app`](tests/fixtures/accessible-app/EXPECTED.md) (aucun échec attendu, thèmes clair et sombre). Résultats mesurés : [`tests/RESULTS.md`](tests/RESULTS.md).

## Maintenance

Procédure de veille et de mise à jour : [`references/maintenance.md`](references/maintenance.md). Registre des sources : [`data/sources.json`](data/sources.json).

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licence

Code sous licence MIT. Les données du RGAA (`data/rgaa-4.1.2-criteres.json`) proviennent du dépôt officiel de la DINUM et sont réutilisées sous Licence Ouverte 2.0 (Etalab). Voir [`LICENSE`](LICENSE).
