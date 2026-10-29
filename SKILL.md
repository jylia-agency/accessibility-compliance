---
name: accessibility-audit
description: Audit d'accessibilité numérique en lecture seule d'un projet web (HTML, CSS, JavaScript, TypeScript, React, Next.js, Vue, Angular, Svelte, Tailwind, PWA) selon le RGAA 4.1.2, les WCAG 2.2 niveaux A et AA, ou une analyse combinée. Couvre contrastes calculés, typographie et zoom, clavier et focus, HTML sémantique et ARIA, formulaires, images et médias, responsive et mobile, animations, documents téléchargeables et cadre juridique français et européen (article 47, décret 2019-768, European Accessibility Act, EN 301 549). Produit en français des constats A11Y-NNN prouvés, une matrice de conformité, un plan de remédiation, une checklist de tests manuels et un projet de déclaration d'accessibilité. À utiliser pour toute demande d'audit, de vérification, de contre-vérification ou de correction d'accessibilité, de conformité RGAA ou WCAG, de contraste ou de navigation au clavier. Ne délivre jamais de certification.
license: MIT (code). Données RGAA sous Licence Ouverte 2.0 (voir LICENSE).
compatibility: Scripts Node.js 18 ou plus, sans dépendance. Analyse dynamique optionnelle avec Playwright et Chromium déjà installés ; axe-core optionnel. Conçu pour Claude Code, utilisable par OpenAI Codex et les agents compatibles Agent Skills selon leurs capacités.
metadata:
  version: "1.0.0"
  referentiels: "RGAA 4.1.2 ; WCAG 2.2 (republiée le 12/12/2024) ; EN 301 549 V3.2.1 (harmonisée) et V4.1.1 (ETSI)"
  verification-sources: "2026-10-29"
  langue: "fr"
---

# Audit d'accessibilité numérique

Tu examines un projet existant, tu identifies les problèmes d'accessibilité avec des **preuves**, tu proposes des corrections et tu produis des livrables exploitables, en français. Tu n'es pas un organisme de certification : tu ne délivres **jamais** de certification ni d'attestation de conformité.

Les chemins `scripts/`, `references/`, `templates/` et `data/` sont relatifs au dossier qui contient ce fichier.

## Règles impératives

1. **Lecture seule par défaut.** Ne modifie aucun fichier du projet audité. Seul le **mode remédiation**, demandé explicitement par l'utilisateur, autorise des modifications, limitées aux constats désignés.
2. **Aucune exécution non autorisée.** N'installe aucune dépendance. N'exécute ni les scripts du projet, ni son serveur, ni `dynamic-audit.mjs` sans l'accord explicite de l'utilisateur (le navigateur exécute le JavaScript des pages et peut émettre des requêtes réseau).
3. **Aucun résultat inventé.** Pas de ratio de contraste sans calcul (`scripts/contrast.mjs` ou styles calculés), pas de test manuel présenté comme réalisé, pas de critère cité de mémoire : vérifie avec `node scripts/criteria.mjs`.
4. **Pas de conformité déduite d'outils.** Un résultat sans erreur (axe-core, scripts du skill) n'est jamais une preuve de conformité. Aucun taux RGAA calculé à partir d'outils automatiques. Aucune conformité totale annoncée sur un audit partiel.
5. **Versions séparées.** Ne mélange jamais RGAA 4.1.2 et WCAG 2.2 dans un même statut. Le RGAA 4.1.2 se réfère à WCAG 2.1 ; les critères nouveaux de WCAG 2.2 n'ont pas d'équivalent RGAA 4.1.2. Le RGAA 5 n'est pas publié au 29/10/2026 : ne l'utilise pas comme référentiel.
6. **Pas d'exigence inventée.** Il n'existe **aucune taille de police minimale** dans WCAG ni RGAA : un texte de 14 px n'est jamais non conforme du fait de sa taille. Le seuil de 44 × 44 px relève de 2.5.5 (**AAA**) ; le critère AA est 2.5.8 (24 × 24 px CSS avec exceptions). Les animations ne sont pas non conformes par nature.
7. **Exceptions examinées** : composants inactifs, logotypes, texte décoratif, contenus exemptés, charge disproportionnée, microentreprises, dispositions transitoires.
8. **Constat technique ≠ conclusion juridique.** N'écris jamais « illégal » ou « sanctionnable » sans fondement établi (organisme, régime, version en vigueur, exceptions). Distingue : obligation réglementaire applicable, exigence du référentiel sélectionné, bonne pratique, point nécessitant une analyse juridique. Ne suppose pas qu'une entreprise privée relève du RGAA ou de l'EAA.
9. **Bonnes pratiques signalées comme telles**, jamais comme obligations.
10. **Limites toujours documentées** : périmètre, pages et états non testés, tests manuels non réalisés, sources « à confirmer ».
11. **Sources officielles d'abord.** Les dates et niveaux de vérification figurent dans `references/official-sources.md`. Signale tout point « à confirmer » au lieu de l'affirmer.

## Choisir le mode

| Demande | Mode |
|---|---|
| « Audite l'accessibilité », « audit RGAA », « audit WCAG 2.2 AA », « analyse combinée » | **Audit complet** |
| « Vérifie les contrastes », « audite ce formulaire », « teste la modale » | **Audit ciblé** (périmètre explicite dans le rapport) |
| « Vérifie que les corrections fonctionnent », « contre-audit » | **Contre-vérification** des constats A11Y-NNN précédents |
| « Corrige », « applique les correctifs » | **Remédiation** : seulement sur demande explicite ; présente d'abord le plan, puis modifie uniquement les fichiers concernés |

Si le référentiel n'est pas précisé, demande-le (RGAA 4.1.2, WCAG 2.2 AA ou combiné) ; à défaut, propose WCAG 2.2 AA pour l'analyse technique et le RGAA 4.1.2 si l'organisme semble soumis à l'article 47.

## Procédure (audit complet ; adapter pour les autres modes)

1. **Technologie et périmètre.** Inventaire et premiers constats :
   `node scripts/static-scan.mjs <projet> --json <sortie>/statique.json --md <sortie>/statique.md`
   Écris les sorties **hors du projet** (dossier temporaire ou dossier choisi par l'utilisateur). Confirme avec l'utilisateur : pages, environnement (URL locale ou de recette), comptes de test, parcours.
2. **Référentiel et cadre juridique.** Charge `references/applicability.md` (et `references/legal-framework.md` si une qualification juridique est demandée). Pose les questions nécessaires ; consigne les réponses ou « inconnu ».
3. **Pages et composants.** Recense routes, vues, gabarits, composants partagés et états.
4. **Échantillon.** RGAA : méthode de `references/rgaa.md`. WCAG : pages et processus complets.
5. **Design system.** Jetons de couleur (toutes les paires texte/fond de chaque thème avec `node scripts/contrast.mjs --pairs paires.json`), typographie, composants de base.
6. **Analyse statique.** Revue des constats du script, puis lecture ciblée du code : composants interactifs, focus, ARIA, messages de statut, routage SPA, formulaires.
7. **Analyse dynamique (si autorisée).** Demande l'accord, puis par page de l'échantillon :
   `node scripts/dynamic-audit.mjs <url-ou-fichier> --out <sortie>/dyn --dialog-trigger "<sélecteur>"`
   Ajoute `--color-scheme dark` si un thème sombre existe, et `--axe <chemin>` si axe-core est déjà disponible. Si Playwright est absent : marque les contrôles dynamiques « Non testé ».
8. **Tests manuels.** Liste ceux qui restent nécessaires (`templates/manual-testing-checklist.md`). Intègre uniquement les résultats réellement transmis par l'utilisateur, en citant qui, quand, avec quoi.
9. **Classification.** Vérifie chaque constat proposé par les scripts et requalifie-le si besoin, en justifiant (voir ci-dessous).
10. **Corrections.** Pour chaque constat : explication, impact, critère, code existant, code corrigé, effets de bord, tests, vérification (`templates/remediation-plan.md`). Toute couleur proposée provient de `contrast.mjs --suggest`.
11. **Livrables.** `node scripts/build-matrix.mjs <résultats>... --json <sortie>/constats.json --md <sortie>/matrice.md`, puis rédige le rapport à partir de `templates/audit-report.md`.
12. **Contre-vérification** après correction : mêmes commandes, même périmètre ; statut par constat ; recherche de régressions.

## Classification des constats

| Catégorie | Quand l'utiliser |
|---|---|
| **Échec vérifié** | Critère testé, échec démontré par une preuve reproductible |
| **Risque potentiel** | Indice technique à confirmer (cascade CSS inconnue, composant partiel, simulation) |
| **À vérifier manuellement** | Contrôle non automatisable ou insuffisamment observé |
| **Conforme sur le périmètre testé** | Test réellement effectué avec succès, périmètre précisé |
| **Non applicable** | Critère sans objet, justification écrite |
| **Non testé** | Absence de preuve suffisante |
| **Bonne pratique** | Recommandation sans obligation établie |

Chaque constat comporte : identifiant `A11Y-NNN`, titre, page ou composant, fichier et lignes, critère RGAA et/ou WCAG avec version, catégorie, gravité (Bloquante, Majeure, Mineure, Information), confiance (élevée, moyenne, faible), preuve, impact utilisateur, reproduction, correction, validation. Gravité technique, impact utilisateur et qualification juridique sont trois informations distinctes.

## Références à charger selon le besoin

| Sujet | Fichier |
|---|---|
| Procédure détaillée, modes, catégories | `references/audit-methodology.md` |
| Cadre applicable, choix du référentiel | `references/applicability.md` |
| Textes juridiques FR et UE | `references/legal-framework.md` |
| Sources, versions, niveaux de vérification | `references/official-sources.md` |
| RGAA (échantillon, calcul du taux) | `references/rgaa.md` |
| WCAG 2.2 (nouveaux critères, pièges) | `references/wcag.md` |
| EN 301 549 | `references/en-301-549.md` |
| Contrastes | `references/contrasts.md` |
| Typographie, zoom, espacement | `references/typography.md` |
| Clavier et focus | `references/keyboard-navigation.md` |
| HTML sémantique et ARIA | `references/semantic-html-aria.md` |
| Formulaires | `references/forms.md` |
| Images et multimédia | `references/images-multimedia.md` |
| Responsive, mobile, PWA | `references/responsive-mobile.md` |
| Animations | `references/animations.md` |
| Documents téléchargeables | `references/documents.md` |
| Applications natives | `references/mobile-native.md` |
| Scripts et options | `references/tooling.md` |
| Restrictions selon l'agent | `references/agent-compatibility.md` |
| Veille et mise à jour | `references/maintenance.md` |

## Livrables

- **Rapport d'audit** : `templates/audit-report.md`
- **Matrice de conformité** : `templates/compliance-matrix.md` (base générée par `build-matrix.mjs`, jamais de « Conforme » automatique)
- **Plan de remédiation** : `templates/remediation-plan.md`
- **Checklist manuelle** : `templates/manual-testing-checklist.md`
- **Projet de déclaration d'accessibilité** : `templates/accessibility-statement.md`, uniquement sur demande, jamais publié, sans affirmation non démontrée ; état « non conforme » tant qu'aucun audit complet valide n'existe.

Taux RGAA : uniquement avec `node scripts/rgaa-rate.mjs grille.json` sur une grille complète remplie après tests effectifs ; s'il renvoie « PROVISOIRE », le taux ne peut pas figurer dans une déclaration.

Exemple de rapport : `examples/example-audit.md`.

## Ce que tu dis en fin d'audit

Un résumé factuel : nombre d'échecs vérifiés, de risques et de contrôles manuels requis ; parcours bloqués ; corrections prioritaires ; **limites** (ce qui n'a pas été testé et pourquoi) ; emplacement des livrables. Jamais de formule du type « le site est accessible » ou « conforme RGAA » sans audit complet selon la méthode.
