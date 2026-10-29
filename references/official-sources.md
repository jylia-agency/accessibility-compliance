# Sources officielles et état de vérification

Dernière vérification documentaire : **29 octobre 2026**.

Ce registre indique, pour chaque source, la version retenue, la date et le **niveau de vérification**. Le skill ne doit jamais présenter comme certaine une information marquée « à confirmer ». Le registre lisible par machine est `data/sources.json`, contrôlé par `scripts/check-sources.mjs`.

## Niveaux de vérification

| Code | Signification |
|---|---|
| **V1** | Source officielle consultée directement (texte ou données intégrales lus). |
| **V2** | Extrait d'une page officielle obtenu par moteur de recherche. Le texte intégral n'a pas été ouvert. |
| **V3** | Source secondaire (cabinet d'avocats, presse spécialisée, prestataire). Plusieurs sources concordantes sont signalées. |
| **NV** | Non vérifié : point à confirmer avant toute utilisation dans un livrable. |

Limite de la vérification du 29/10/2026 : depuis l'environnement de rédaction, les domaines `legifrance.gouv.fr`, `w3.org`, `etsi.org`, `accessibilite.numerique.gouv.fr` et `developers.openai.com` étaient inaccessibles en lecture directe. `eur-lex.europa.eu` renvoyait des pages vides. Le dépôt source officiel du site RGAA (DISIC) a en revanche pu être lu intégralement. **Toute mise à jour du skill doit relire les textes sur les sites officiels** (voir `references/maintenance.md`).

## Hiérarchie documentaire appliquée

1. Textes juridiques officiels dans leur version applicable (Légifrance, EUR-Lex).
2. Référentiels désignés par ces textes (RGAA, normes harmonisées citées au JOUE).
3. Normes techniques (EN 301 549, ISO/IEC 40500).
4. Documentation officielle W3C (WCAG, Understanding, Techniques, WAI-ARIA, APG).
5. Recommandations complémentaires et bonnes pratiques.

En cas de conflit, le niveau supérieur prévaut. Une bonne pratique (niveau 5) n'est jamais présentée comme une obligation.

## Référentiel français (RGAA)

| Source | Version retenue | Vérification | Remarques |
|---|---|---|---|
| Site officiel RGAA : https://accessibilite.numerique.gouv.fr/ | RGAA **4.1.2** en vigueur | **V1**, via le dépôt source officiel `DISIC/accessibilite.numerique.gouv.fr`, commit `ca4019f` du 18/08/2026, changelog v1.3.4 : « La version en vigueur est maintenant la 4.1.2 » | 106 critères, 13 thématiques (vérifié sur `RGAA/criteres.json`) |
| Critères et tests : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/ | 4.1.2 | **V1**, données extraites dans `data/rgaa-4.1.2-criteres.json` | Licence Ouverte 2.0 |
| Méthodologie de test : https://accessibilite.numerique.gouv.fr/ressources/methodologie-de-test/ | 4.1.2 | **V1** (`RGAA/methodologies.json`) | Intégrée au fichier de données (champ `methodologie`) |
| Obligations (champ d'application, déclaration, évaluation, mentions, schéma) : https://accessibilite.numerique.gouv.fr/obligations/ | site au 18/08/2026 | **V1** (fichiers `src/obligations/*.md` du dépôt) | Référence EN 301 549 **V2.1.2 (2018-08)** indiquée par le site |
| Kit d'audit : https://accessibilite.numerique.gouv.fr/ressources/kit-audit/ | grille `rgaa4.1.2.modele-de-grille-d-audit.ods`, modèle de rapport 2019, exemple de déclaration 2019 | **V1** (présence des fichiers dans `src/doc/`) | |
| Date de publication du RGAA 4.1.2 | 18 avril 2023 | **V2** | Des sources secondaires divergent : à confirmer |
| RGAA 5 | Annoncé le 2 mars 2026 (DesignGouv), « publication prévue fin 2026 » ; intégration annoncée des WCAG 2.2, de critères pour applications mobiles et documents bureautiques | **V2** : https://design.numerique.gouv.fr/articles/2026-03-02-rgaa5/ et https://www.numerique.gouv.fr/actualites/nouvelle-version-rgaa-2026/ | **Non publié au 29/10/2026** d'après les sources consultées. Les déclarations antérieures resteraient valables 18 mois après publication, dans la limite de 3 ans (V2). |
| Arrêté du 20 septembre 2019 portant référentiel général d'amélioration de l'accessibilité | En vigueur | **V2** : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000039120412 | Aucun arrêté désignant un RGAA 5 trouvé |
| Outil Ara (DINUM) | https://ara.numerique.gouv.fr/ | **V3** | Outil d'aide à l'audit RGAA |

## WCAG et WAI-ARIA (W3C)

| Source | Version retenue | Vérification | Remarques |
|---|---|---|---|
| WCAG 2.2 : https://www.w3.org/TR/WCAG22/ | Recommandation du 5 octobre 2023, **republiée avec errata le 12 décembre 2024** | **V2** | 86 critères actifs (4.1.1 retiré), 55 aux niveaux A et AA, 9 nouveaux critères (vérifié dans `scripts/lib/wcag22.mjs`) |
| Traduction française autorisée : https://www.w3.org/Translations/WCAG22-fr/ | Première version autorisée du 17 mars 2025 (coordination Access42) ; mise à jour annoncée en 2026 | **V2** | Date exacte de la mise à jour 2026 à confirmer |
| ISO/IEC 40500:2025 | WCAG 2.2 adoptées comme norme ISO/IEC (annonce W3C du 21 octobre 2025) | **V2** | |
| WCAG 3.0 | Working Draft (dernier relevé : 10 septembre 2026) | **V2** | Document de travail : **jamais utilisé comme exigence** |
| Définition de la luminance relative | Seuil 0,04045 (0,03928 avant mai 2021) | **V2** + vérification mathématique (`tests/unit/color.test.mjs`) | Les deux seuils donnent des résultats identiques pour les couleurs 8 bits |
| WAI-ARIA 1.2 : https://www.w3.org/TR/wai-aria-1.2/ | Recommandation du 6 juin 2023 | **V2** | ARIA 1.3 : Working Draft (4 juin 2026), non normatif |
| ARIA Authoring Practices Guide : https://www.w3.org/WAI/ARIA/apg/ | Document vivant | NV (non consulté) | Recommandations, pas des exigences |
| Vue d'ensemble WCAG : https://www.w3.org/WAI/standards-guidelines/wcag/ | | NV | |

## Normes européennes

| Source | Version retenue | Vérification | Remarques |
|---|---|---|---|
| EN 301 549 V3.2.1 (2021-03) | Version harmonisée pour la directive (UE) 2016/2102, citée par la décision d'exécution (UE) 2021/1339 (applicable depuis le 12 février 2022, retrait de la V2.1.2) | **V2** | Fondée sur WCAG 2.1 |
| EN 301 549 V4.1.1 (2026) | Publiée par l'ETSI (dates relevées : adoption 24/08/2026, publication septembre ou octobre 2026) ; clauses web alignées sur WCAG 2.2 ; annexes ZA (2016/2102) et ZB (2019/882, à confirmer) | **V2** (PDF ETSI référencé par moteur de recherche) | **Aucune citation au JOUE trouvée au 29/10/2026** : pas de présomption de conformité établie sur cette version à cette date |
| EN 301 549 V2.1.2 (2018-08) | Version mentionnée par le site RGAA pour le RGAA 4.1.2 | **V1** (dépôt RGAA) | Citée à l'origine par la décision d'exécution (UE) 2018/2048 (V2) |
| Mandat M/587 (normalisation au titre de la directive 2019/882) | Décision C(2022) 6456 | **V2** | Publication de normes harmonisées EAA au JOUE non constatée (NV) |

## Textes européens

| Texte | Vérification | Lien |
|---|---|---|
| Directive (UE) 2016/2102 (sites et applications mobiles du secteur public) | **V2** | https://eur-lex.europa.eu/eli/dir/2016/2102/oj |
| Décision d'exécution (UE) 2018/1523 (modèle de déclaration d'accessibilité) | **V2** | https://eur-lex.europa.eu/eli/dec_impl/2018/1523/oj |
| Décision d'exécution (UE) 2018/1524 (méthode de contrôle) | **V2** | https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32018D1524 |
| Décision d'exécution (UE) 2018/2048 et 2021/1339 (références EN 301 549) | **V2** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021D1339 |
| Directive (UE) 2019/882 (European Accessibility Act) | **V2** | https://eur-lex.europa.eu/eli/dir/2019/882/oj |

## Textes français

| Texte | Version relevée | Vérification | Lien |
|---|---|---|---|
| Article 47 de la loi n° 2005-102 du 11 février 2005 | Version issue de l'ordonnance n° 2023-859 du 6 septembre 2023, en vigueur depuis le 8 septembre 2023 | **V2** (aucune modification postérieure relevée, NV au-delà de janvier 2025) | https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000047293300 |
| Article 47-1 de la même loi (contrôle et sanctions par l'Arcom) | Créé par l'ordonnance n° 2023-859 | **V2** | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048050174 |
| Décret n° 2019-768 du 24 juillet 2019 | **Modifié par le décret n° 2026-816 du 24 août 2026** (JO du 26 août 2026, en vigueur le 27 août 2026) | **V2** + **V3** concordantes ; texte intégral du décret 2026-816 non lu | https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038811937 ; https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054746617 |
| Loi n° 2023-171 du 9 mars 2023, article 16 (transposition de la directive 2019/882) | | **V2** | https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000047282795/ |
| Code de la consommation, article L. 412-13 | | **V2** | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047284913 |
| Décret n° 2023-931 du 9 octobre 2023 (articles D. 412-49 à D. 412-62 du Code de la consommation) | | **V2** | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048178349 |
| Arrêté du 9 octobre 2023 fixant les exigences en matière d'accessibilité applicables aux produits et services | | **V2** | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048178413 |
| Code de la consommation, article R. 451-4 (sanctions pénales) | Contravention de 5e classe selon la fiche DGCCRF | **NV** (libellé non lu) | |
| Décision Arcom n° 2026-358 du 24 juin 2026 (mise en demeure, impots.gouv.fr) | | **V2** | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054393304 |

## Autorités et ressources

| Ressource | Lien | Vérification |
|---|---|---|
| Arcom (contrôle de l'article 47) | https://www.arcom.fr/ | V2 |
| DGCCRF (contrôle des exigences EAA) | https://www.economie.gouv.fr/dgccrf | V2 |
| Défenseur des droits (voies de recours de la déclaration) | https://www.defenseurdesdroits.fr/ | V1 (URL issue du modèle de déclaration du dépôt RGAA) |
