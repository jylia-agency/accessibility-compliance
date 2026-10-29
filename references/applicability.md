# Détermination du cadre applicable

À utiliser **avant** toute conclusion sur une obligation. Le code source ne permet presque jamais de trancher seul : poser les questions à l'utilisateur et consigner les réponses dans la section « Cadre juridique retenu » du rapport.

## 1. Questions à poser (ou à documenter comme inconnues)

| # | Question | Pourquoi |
|---|---|---|
| Q1 | Pays de l'organisme et pays des utilisateurs visés ? | Seul le droit français et européen est couvert par ce skill. |
| Q2 | Nature de l'organisme : personne publique, délégataire de service public, organisme financé ou contrôlé par une personne publique, entreprise, association ? | Article 47, I, 1° à 3°. |
| Q3 | Pour une entreprise : chiffre d'affaires moyen réalisé **en France** sur les trois derniers exercices clos supérieur à 250 M€ ? | Article 47, I, 4°. |
| Q4 | Effectif et chiffre d'affaires ou bilan (moins de 10 personnes et 2 M€ au plus) ? | Exemption des microentreprises de services (EAA). |
| Q5 | Type de service : site public, intranet, extranet, application mobile, progiciel web, commerce électronique, banque aux consommateurs, transport de voyageurs, livre numérique, communications électroniques, accès aux médias audiovisuels ? | Champ de l'article 47 et de l'article 2 de la directive 2019/882. |
| Q6 | Destinataires : grand public, consommateurs, professionnels uniquement, agents internes ? | L'EAA vise les services aux consommateurs ; l'article 47 couvre aussi les intranets. |
| Q7 | Dates : mise en ligne, refonte, contrats en cours avant le 28/06/2025 ? | Exemptions temporelles et dispositions transitoires. |
| Q8 | Contenus particuliers : documents anciens, médias en direct, cartes, contenus de tiers, archives ? | Contenus exemptés. |
| Q9 | Référentiel demandé par le commanditaire (RGAA 4.1.2, WCAG 2.2 AA, EN 301 549) ? | Le référentiel d'audit peut différer de l'obligation légale. |

## 2. Arbre de décision simplifié

```text
Organisme public ou assimilé (Q2 = 1° à 3°) ?
├── Oui : article 47 applicable (sauf exclusions). Méthode technique RGAA obligatoire.
│         Obligations : accessibilité (I), déclaration et schéma (III), mention (IV).
└── Non : entreprise dont le CA France moyen dépasse 250 M€ (Q3) ?
          ├── Oui : article 47 applicable. RGAA ou autre méthode documentée avec table de correspondance.
          │         Contrôle Arcom limité aux III et IV.
          └── Non : article 47 non applicable.
En parallèle, quelle que soit la réponse précédente :
Service relevant de l'article 2 § 2 de la directive 2019/882 et fourni à des consommateurs (Q5, Q6) ?
├── Non : EAA non applicable à ce service.
└── Oui : microentreprise de services (Q4) ?
          ├── Oui : dispensée.
          └── Non : exigences EAA applicables aux services fournis après le 28/06/2025,
                    sous réserve des dispositions transitoires (Q7) et des exceptions documentées.
Aucune obligation identifiée : l'audit reste possible au titre d'un référentiel choisi (WCAG 2.2 AA conseillé)
ou de bonnes pratiques, sans qualification juridique.
```

## 3. Qualification de chaque exigence dans le rapport

| Qualification | Condition | Formulation type |
|---|---|---|
| **Obligation réglementaire applicable** | Fondement juridique vérifié, organisme et service dans le champ, version en vigueur identifiée | « Au titre de l'article 47 de la loi n° 2005-102 (version en vigueur au JJ/MM/AAAA), l'organisme doit... » |
| **Exigence technique du référentiel sélectionné** | Critère du référentiel choisi pour l'audit | « Critère RGAA 4.1.2 n° 3.2 : non respecté sur la page X. » |
| **Bonne pratique recommandée** | Aucune obligation identifiée (y compris critères AAA hors engagement) | « Recommandation (WCAG 2.2, critère 2.3.3, niveau AAA) : ... » |
| **Point nécessitant une analyse juridique** | Applicabilité impossible à établir depuis le code ou les informations fournies | « L'applicabilité de [texte] dépend de [critère] : à confirmer par le service juridique. » |

## 4. Choix du référentiel d'audit

| Demande | Référentiel | Ne pas faire |
|---|---|---|
| « Audit RGAA » | RGAA 4.1.2, 106 critères, méthode et échantillon du RGAA | Citer des critères WCAG 2.2 nouveaux comme critères RGAA |
| « Audit WCAG 2.2 AA » | 55 critères A et AA de WCAG 2.2 | Calculer un « taux RGAA » |
| « Analyse combinée » | Deux matrices distinctes ; tableau de correspondance issu de `data/rgaa-4.1.2-criteres.json` (correspondance déclarée par le RGAA avec WCAG 2.1) | Fusionner les deux en un seul statut |
| « Conformité EAA » | Exigences de l'annexe I de la directive ; en pratique EN 301 549 comme base technique ; signaler l'absence de norme harmonisée citée au JOUE au titre de l'EAA si c'est toujours le cas | Affirmer une présomption de conformité |

Points d'attention sur les versions :

- Le RGAA 4.1.2 déclare ses correspondances avec **WCAG 2.1**. Les critères 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7 et 3.3.8 (A ou AA, nouveaux en 2.2) n'ont pas d'équivalent RGAA 4.1.2. En analyse combinée, ils figurent uniquement dans la matrice WCAG.
- Les critères RGAA 8.1 et 8.2 renvoient à WCAG 4.1.1 (Parsing), retiré de WCAG 2.2. Ils restent exigibles dans un audit RGAA 4.1.2.
- Le RGAA classe le texte en gras comme grand à partir de 18,5 px ; la définition WCAG (14 pt) donne 18,67 px. `scripts/contrast.mjs` signale les cas où les deux classements diffèrent.
