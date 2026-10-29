# Rapport d'audit d'accessibilité : [Nom du service]

> **Avertissement.** Ce rapport rend compte d'une évaluation technique réalisée avec l'assistance d'un agent automatisé. Il ne constitue ni une certification, ni une attestation de conformité, ni un avis juridique. Les résultats ne valent que pour le périmètre, les versions et la date indiqués. Les contrôles automatisés ne couvrent qu'une partie des critères ; les contrôles listés comme « À vérifier manuellement » ou « Non testé » n'ont pas été réalisés.

| Élément | Valeur |
|---|---|
| Service audité | [nom, URL ou dépôt, branche et commit] |
| Commanditaire | [organisme] |
| Date de l'audit | [JJ/MM/AAAA] |
| Mode | [Audit complet / Audit ciblé / Contre-vérification] |
| Référentiel | [RGAA 4.1.2 / WCAG 2.2 niveaux A et AA / analyse combinée (deux matrices distinctes)] |
| Date de vérification des sources | [date indiquée dans references/official-sources.md] |
| Réalisé par | [agent et version du skill ; personne(s) ayant validé] |

## 1. Résumé exécutif

- **Constat principal** : [2 à 4 phrases factuelles : nombre d'échecs vérifiés, parcours bloqués, thématiques les plus touchées].
- **Échecs vérifiés** : [n] dont [n] bloquants. **Risques à confirmer** : [n]. **Contrôles manuels requis** : [n].
- **Niveau de conformité** : [Ne pas indiquer de taux ni d'état de conformité sauf audit RGAA complet selon la méthode, avec grille sans « NT » (scripts/rgaa-rate.mjs). Sinon : « Non déterminable sur ce périmètre ».]
- **Priorités** : [3 à 5 actions, renvoyant au plan de remédiation].

## 2. Périmètre

### 2.1 Pages, écrans et parcours audités

| Réf. | Page ou écran | URL ou route | Fichiers principaux | Motif de sélection (méthode RGAA) | Méthodes appliquées |
|---|---|---|---|---|---|
| P01 | Accueil | / | [fichier] | Page obligatoire | Statique, dynamique |

### 2.2 Composants et design system

| Composant | Fichier | Utilisé dans | Méthodes |
|---|---|---|---|

### 2.3 Hors périmètre et exclusions

- [Pages non accessibles à l'agent : authentification, paiement réel, back-office...]
- [Contenus exemptés invoqués, avec justification et texte]
- [Applications natives, documents, médias non examinés]

## 3. Cadre juridique retenu

| Question (references/applicability.md) | Réponse | Source de la réponse |
|---|---|---|
| Nature de l'organisme | [ ] | [déclaration du commanditaire / inconnue] |
| Article 47 de la loi n° 2005-102 | [Applicable / Non applicable / Point nécessitant une analyse juridique] | |
| Directive (UE) 2019/882 (Code de la consommation L. 412-13) | [ ] | |
| Exemptions et dispositions transitoires examinées | [ ] | |

> Les constats techniques de ce rapport portent sur le référentiel sélectionné. Leur qualification juridique dépend des réponses ci-dessus.

## 4. Méthodes utilisées

| Méthode | Outils et versions | Couverture effective | Limites |
|---|---|---|---|
| Analyse statique | static-scan.mjs [version] | [n fichiers, n non concluants] | Pas d'exécution ; cascade CSS non résolue |
| Analyse dynamique | dynamic-audit.mjs [version], Playwright [version], Chromium [version], axe-core [version ou « non exécuté »] | [pages, thèmes, fenêtres de dialogue] | État par défaut ; pas de technologies d'assistance |
| Vérification humaine | [personne, outils, technologies d'assistance] | [contrôles réellement effectués] | [ ] |

Environnement de test (RGAA) : [combinaisons navigateur, système, technologie d'assistance effectivement utilisées, ou « aucune : tests de restitution non réalisés »].

## 5. Couverture effective

| Thématique | Contrôles automatisés | Contrôles manuels réalisés | Non testé |
|---|---|---|---|
| Images | | | |
| ... | | | |

Matrice détaillée : [lien vers la matrice de conformité].

## 6. Constats

Synthèse :

| Catégorie | Bloquante | Majeure | Mineure | Information | Total |
|---|---|---|---|---|---|
| Échec vérifié | | | | | |
| Risque potentiel | | | | | |
| À vérifier manuellement | | | | | |
| Bonne pratique | | | | | |

### A11Y-001 : [Titre]

| Champ | Valeur |
|---|---|
| Page ou composant | |
| Fichier et lignes | |
| Critère RGAA 4.1.2 | [n° et test, ou « sans objet »] |
| Critère WCAG 2.2 | [n°, intitulé, niveau] |
| Catégorie | [Échec vérifié / Risque potentiel / ...] |
| Gravité technique | [Bloquante / Majeure / Mineure / Information] |
| Confiance | [Élevée / Moyenne / Faible] |
| Preuve | [mesure, extrait de code, capture, sortie d'outil] |
| Impact utilisateur | |
| Reproduction | |
| Correction recommandée | [renvoi au plan de remédiation] |
| Validation | |

[Répéter pour chaque constat.]

## 7. Risques

- [Risques d'usage : parcours critiques bloqués]
- [Risques liés aux composants partagés : propagation]
- [Risques juridiques : uniquement si le cadre est établi en section 3 ; sinon « Point nécessitant une analyse juridique »]

## 8. Limites de l'audit

- Les tests automatisés couvrent une partie seulement des critères ; aucun résultat automatisé ne vaut preuve de conformité.
- [Pages, états, thèmes, navigateurs non testés]
- [Tests avec technologies d'assistance non réalisés]
- [Sources réglementaires dont la vérification est marquée « à confirmer »]

## 9. Recommandations

1. [Corrections prioritaires]
2. [Contrôles manuels à réaliser]
3. [Mesures d'organisation : intégration des contrôles dans la CI, formation, schéma pluriannuel]

## Annexes

- Matrice de conformité
- Plan de remédiation
- Checklist des contrôles manuels
- Sorties brutes des outils (JSON, captures, arbre d'accessibilité, ordre de tabulation)
