# Méthodologie d'audit

Procédure reproductible en douze étapes, trois modes d'audit, classification des constats.

## Modes

| Mode | Déclencheur | Périmètre | Écriture dans le projet |
|---|---|---|---|
| **Audit complet** | « audite l'accessibilité », « audit RGAA », « audit WCAG » | Échantillon représentatif, toutes thématiques | **Aucune** |
| **Audit ciblé** | « vérifie les contrastes », « audite ce formulaire », « teste la modale » | Composants, pages ou thématiques désignés ; la limite du périmètre figure dans le rapport | **Aucune** |
| **Contre-vérification** | « vérifie les corrections », « contre-audit » | Constats d'un audit précédent (identifiants A11Y-NNN) + non-régression | **Aucune** |
| **Remédiation** | Demande **explicite** de corriger (« corrige », « applique les correctifs ») | Constats désignés par l'utilisateur | Oui, seulement les fichiers concernés, après présentation du plan |

## Les douze étapes

1. **Technologie et périmètre.** Lancer `static-scan.mjs` pour l'inventaire (frameworks, bibliothèques d'interface, routes, composants, design system, documents, PWA, code natif). Confirmer le périmètre avec l'utilisateur : environnement, URL de recette, comptes de test, parcours authentifiés.
2. **Référentiel et cadre juridique.** Appliquer `references/applicability.md`. Consigner : référentiel (RGAA 4.1.2, WCAG 2.2 A/AA, ou combiné), version, date de vérification des sources, qualification juridique ou « Point nécessitant une analyse juridique ».
3. **Recensement des pages et composants.** Routes et vues de l'inventaire, gabarits, composants réutilisables, états (connecté, erreur, vide, chargement).
4. **Échantillon.** Audit RGAA : pages obligatoires de la méthode, pages de chaque type de service, processus complets, documents, pages distinctes, 10 % de pages au hasard (voir `references/rgaa.md`). Audit WCAG : pages complètes et processus complets. Documenter les pages non accessibles à l'agent (authentification, paiement réel).
5. **Design system.** Jetons de couleur (toutes les paires texte/fond utilisées, dans chaque thème, calculées avec `contrast.mjs --pairs`), typographie (unités, interlignes), composants de base (bouton, lien, champ, modale, menu, onglets, infobulle). Un défaut dans un composant partagé se propage : le signaler comme tel.
6. **Analyse statique.** `static-scan.mjs` puis revue ciblée du code (composants interactifs, gestion du focus, ARIA, messages de statut, routage SPA).
7. **Analyse dynamique autorisée.** Seulement avec l'accord explicite de l'utilisateur (navigateur sans interface, exécution du JavaScript des pages, requêtes réseau si l'URL est distante). `dynamic-audit.mjs` sur chaque page de l'échantillon, en thème clair puis sombre si le site en propose un, avec `--dialog-trigger` pour chaque fenêtre de dialogue. axe-core uniquement s'il est déjà présent ou fourni.
8. **Tests manuels nécessaires.** Générer la checklist (`templates/manual-testing-checklist.md`) : contrôles non automatisables et contrôles automatisés non conclusifs. **Ne jamais présenter comme réalisé un test manuel non effectué.** Si l'utilisateur réalise des tests et transmet ses résultats, les intégrer en citant la source (« test réalisé par [personne], le [date], avec [outil] »).
9. **Classification des constats** (voir ci-dessous).
10. **Corrections proposées** pour chaque constat (`templates/remediation-plan.md`).
11. **Génération des livrables** (`templates/`) : rapport, matrice (`build-matrix.mjs`), plan de remédiation, checklist manuelle, projet de déclaration si demandé.
12. **Contre-vérification** après correction : relancer les mêmes scripts avec les mêmes options sur le même périmètre ; mettre à jour le statut de chaque constat (« Corrigé et vérifié », « Corrigé, vérification humaine requise », « Non corrigé », « Régression ») ; rechercher les régressions.

## Classification des constats

| Catégorie | Définition | Exemples |
|---|---|---|
| **Échec vérifié** | Critère testé et échec démontré par une preuve reproductible | Ratio calculé sur styles calculés inférieur au seuil ; image sans `alt` dans le balisage ; élément cliquable jamais atteint par Tab |
| **Risque potentiel** | Indice technique nécessitant confirmation | `outline: none` en CSS ; paire de couleurs déclarée (cascade inconnue) ; `role="button"` sans `tabindex` (peut être ajouté par script) |
| **À vérifier manuellement** | Contrôle non automatisable ou insuffisamment observé | Pertinence d'une alternative ; cohérence d'un parcours ; restitution avec lecteur d'écran |
| **Conforme sur le périmètre testé** | Test effectivement réalisé avec succès, périmètre précisé | « Contrastes des 25 paires texte/fond de la page d'accueil, état par défaut, thèmes clair et sombre : seuils atteints » |
| **Non applicable** | Critère sans objet, avec justification | « Pas de média temporel dans l'échantillon » |
| **Non testé** | Absence de preuve suffisante | « Parcours de paiement non accessible à l'agent » |
| **Bonne pratique** | Recommandation hors exigence | `prefers-reduced-motion` ; taille de police de lecture ; critères AAA hors engagement |

Les catégories des scripts sont **des propositions** : l'auditeur (l'agent, puis l'humain) peut requalifier un constat en le justifiant (par exemple, un « Risque potentiel » confirmé par un test devient « Échec vérifié » ; un constat lié à un logotype devient « Non applicable »).

**Une absence de constat n'est jamais une preuve de conformité.** « Conforme sur le périmètre testé » exige un test documenté, avec un périmètre explicite.

### Trois axes à ne pas confondre

- **Gravité technique** (Bloquante, Majeure, Mineure, Information) : effet du défaut sur la réalisation de la tâche.
- **Impact utilisateur** : qui est gêné et comment (personnes aveugles, malvoyantes, sourdes, à mobilité réduite, avec troubles cognitifs ou vestibulaires...).
- **Qualification juridique** : obligation applicable, exigence du référentiel, bonne pratique, ou point à analyser.

### Niveau de confiance

- **Élevée** : preuve directe (styles calculés, test clavier réel, balisage sans ambiguïté).
- **Moyenne** : preuve indirecte ou contexte partiel (règle CSS isolée, composant partiel).
- **Faible** : heuristique (nom de classe, simulation).

## Fiche de constat (champs obligatoires)

Identifiant `A11Y-NNN` ; titre ; page ou composant ; fichier et lignes ; critère RGAA (si applicable) ; critère WCAG (si applicable) ; version du référentiel ; nature (catégorie) ; gravité ; confiance ; preuve ; impact utilisateur ; méthode de reproduction ; correction recommandée ; méthode de validation.

## Interdits méthodologiques

- Calculer un taux RGAA à partir d'axe-core ou des scripts du skill.
- Déclarer une conformité totale sur la base d'un audit partiel ou automatisé.
- Présenter un résultat axe-core sans violation comme une preuve de conformité.
- Inventer un test manuel, un résultat ou un ratio.
- Modifier le projet audité hors du mode remédiation.
- Installer des dépendances ou exécuter des scripts du projet sans autorisation.
