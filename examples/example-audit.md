# Exemple : rapport d'audit de la fixture `inaccessible-app`

> **Exemple pédagogique.** Ce rapport a été produit à partir d'une **exécution réelle** des scripts du skill, le 29/10/2026, sur la fixture volontairement défaillante `tests/fixtures/inaccessible-app/`. Les mesures et constats sont ceux des sorties d'outils. Aucun test manuel ni test avec une technologie d'assistance n'a été réalisé : ces contrôles figurent en « À vérifier manuellement » ou « Non testé ». Le projet est fictif : aucune qualification juridique n'est possible.

| Élément | Valeur |
|---|---|
| Service audité | `tests/fixtures/inaccessible-app` (page `index.html`, composant `src/Toolbar.jsx`) |
| Date | 29/10/2026 |
| Mode | Audit ciblé (une page et un composant) |
| Référentiel | Analyse combinée : RGAA 4.1.2 et WCAG 2.2 niveaux A et AA (matrices distinctes) |
| Vérification des sources | 29/10/2026 (`references/official-sources.md`) |
| Outils | static-scan.mjs 1.0.0 ; dynamic-audit.mjs 1.0.0 ; Playwright 1.63.0 ; Chromium 153.0.8010.12 ; axe-core non exécuté |

## 1. Résumé exécutif

L'analyse statique a produit 28 constats et l'analyse dynamique 21, soit 49 constats consolidés, dont **22 « Échec vérifié »** (2 dans le composant `Toolbar.jsx` ; la langue absente est relevée par les deux méthodes). Les défauts bloquants concernent la **visibilité du focus** (aucun indicateur sur 6 des 8 éléments focalisables ; les deux champs conservent l'indicateur natif), un **élément d'action inaccessible au clavier** (« Enregistrer ») et des **contrôles sans nom accessible** (bouton de menu, bouton de suppression). La fenêtre « Modifier mon profil » ne déplace pas le focus à l'ouverture et ne le restitue pas à la fermeture.

- Taux de conformité : **non déterminable** (audit ciblé, aucun test manuel).
- Priorités : (1) restaurer un indicateur de focus visible ; (2) remplacer `div#save` par un `<button>` ; (3) nommer les boutons iconographiques ; (4) corriger la gestion du focus de la fenêtre ; (5) corriger les deux contrastes insuffisants.

## 2. Périmètre

| Réf. | Page ou composant | Fichiers | Méthodes |
|---|---|---|---|
| P01 | Tableau de bord (`index.html`) | `index.html`, `styles.css`, `app.js` | Statique ; dynamique (thème clair, déclencheur de dialogue `#open-modal`) |
| C01 | Barre d'outils (`src/Toolbar.jsx`) | `src/Toolbar.jsx` | Statique uniquement (composant non rendu) |

Hors périmètre : autres pages, thème sombre (absent), états de survol et d'erreur, technologies d'assistance.

## 3. Cadre juridique retenu

Projet fictif : nature de l'organisme inconnue. **Point nécessitant une analyse juridique** pour tout usage réel (`references/applicability.md`). Les constats ci-dessous portent sur les référentiels techniques sélectionnés.

## 4. Méthodes et couverture effective

| Méthode | Couverture |
|---|---|
| Analyse statique | 5 fichiers ; 0 élément non concluant |
| Analyse dynamique | 18 paires texte/fond mesurées sur styles calculés ; 8 arrêts de tabulation sur 8 éléments focalisables ; 1 fenêtre de dialogue testée ; redistribution à 320 px ; espacement du texte ; simulation d'agrandissement du texte à 200 % ; cibles de pointage ; animations |
| Vérification humaine | Non réalisée |

## 5. Constats principaux (consolidés)

Les identifiants de cet exemple sont ceux de la consolidation par `build-matrix.mjs`. Lorsqu'un risque statique est confirmé par l'analyse dynamique, la fiche cite les deux.

### A11Y-004 à A11Y-009 : Indicateur de focus invisible (confirmé par A11Y-026)

| Champ | Valeur |
|---|---|
| Éléments | `button#menu-btn`, liens « Accueil » et « Factures », `button#open-modal`, lien « En savoir plus », bouton « OK » |
| Fichier | `styles.css:5` : `a:focus, button:focus { outline: none; }` |
| Critères | RGAA 4.1.2 critère 10.7 (test 10.7.1) ; WCAG 2.2 2.4.7 Focus Visible (AA) |
| Catégorie | Échec vérifié ; gravité **Bloquante** ; confiance élevée |
| Preuve | Pour chaque élément, aucun pixel ne change dans la boîte de l'élément élargie de 6 px entre l'état sans focus et l'état focalisé au clavier (Tab). La règle CSS supprime le contour sans style de remplacement. |
| Impact | Les personnes naviguant au clavier ne savent pas où elles se trouvent. |
| Reproduction | Charger la page, appuyer sur Tab, observer. |
| Correction | Remplacer la règle par `:focus-visible { outline: 3px solid #1a5fb4; outline-offset: 2px; }` (contraste de #1A5FB4 sur #FFFFFF : 6,28:1, au moins 3:1 requis pour l'indicateur au titre de 1.4.11). |
| Validation | Relancer `dynamic-audit.mjs` : plus aucun constat `focus-not-visible` ; contrôle visuel. |

### A11Y-010 : Élément « Enregistrer » inaccessible au clavier (confirmé ; risque statique A11Y-023)

| Champ | Valeur |
|---|---|
| Élément | `div#save` (`index.html:29`) |
| Critères | RGAA 7.3, 12.8 ; WCAG 2.1.1 Keyboard (A) |
| Catégorie | Échec vérifié ; **Bloquante** ; confiance élevée |
| Preuve | Gestionnaire de clic détecté ; l'élément n'a jamais reçu le focus pendant le parcours au clavier (non focalisable). Aucune alternative équivalente au clavier n'a été identifiée dans la page (à confirmer humainement, RGAA 7.3.1). |
| Correction | `<button type="button" class="btn" id="save">Enregistrer</button>` (le style `.btn` est conservé ; ajouter `border: 0; font: inherit;` si nécessaire). |

### A11Y-001 : Bouton de menu sans nom accessible

| Champ | Valeur |
|---|---|
| Élément | `index.html:12` : `<button class="icon-btn" id="menu-btn" onclick="toggleMenu()">` contenant un SVG sans alternative |
| Critères | RGAA 7.1, 11.9 ; WCAG 4.1.2 Name, Role, Value (A) |
| Catégorie | Échec vérifié ; **Bloquante** ; confiance élevée |
| Correction | `aria-label="Ouvrir le menu"`, `aria-expanded` synchronisé, `aria-controls`, SVG `aria-hidden="true" focusable="false"`. |

### A11Y-017 et A11Y-018 : Contrastes insuffisants (confirmés ; risques statiques A11Y-030 et A11Y-031)

| Élément | Couleurs mesurées (styles calculés) | Ratio | Seuil | Correction vérifiée par `contrast.mjs` |
|---|---|---|---|---|
| `p.muted` « Dernière connexion il y a 2 jours. » (16 px, 400) | #999999 sur #FFFFFF | 2,84:1 | 4,5:1 | Texte #767676 : 4,54:1 |
| `button#open-modal` « Modifier mon profil » (16 px, 400) | #FFFFFF sur #73B9B0 | 2,25:1 | 4,5:1 | Fond #418179 : 4,52:1 ; ou texte #414141 : 4,51:1 |

Critères : RGAA 3.2 (test 3.2.1) ; WCAG 1.4.3 (AA). Gravité Majeure. Vérifier aussi les états survol et focus après correction.

### A11Y-019, A11Y-020, A11Y-036 : Fenêtre « Modifier mon profil »

| Constat | Preuve | Catégorie |
|---|---|---|
| A11Y-019 Focus non déplacé | Après Entrée sur `#open-modal`, le focus reste sur `button#open-modal`, hors de la fenêtre | Échec vérifié |
| A11Y-020 Focus non restitué | Après fermeture, le focus est sur `body` | Échec vérifié |
| A11Y-036 Focus sortant | La tabulation atteint le lien « En savoir plus » derrière la fenêtre ; la fenêtre n'est pas déclarée modale | Risque potentiel |
| A11Y-014 Fenêtre sans nom | `role="dialog"` sans `aria-labelledby` (`index.html:56`) | Échec vérifié |
| A11Y-047 Échap inopérant | Recommandation du motif APG | Bonne pratique |

Correction : `<dialog aria-labelledby="titre-profil">` ouvert par `showModal()`, retour du focus au déclencheur à l'événement `close` (voir `references/keyboard-navigation.md`).

### Autres échecs vérifiés

| Id | Constat | Critères |
|---|---|---|
| A11Y-002 | Champ `#code` sans étiquette | RGAA 11.1 ; WCAG 1.3.1, 3.3.2, 4.1.2 |
| A11Y-013 | Champ `#email` avec placeholder pour seule indication | RGAA 11.1 ; WCAG 3.3.2 |
| A11Y-003 | Bouton SVG sans nom (`src/Toolbar.jsx:13`) | RGAA 7.1, 11.9 ; WCAG 4.1.2 |
| A11Y-011 / A11Y-016 | Langue de la page absente (code et DOM rendu) | RGAA 8.3 ; WCAG 3.1.1 |
| A11Y-012 / A11Y-015 | Images sans alternative (`index.html:25`, `src/Toolbar.jsx:10`) | RGAA 1.1, 1.2 ; WCAG 1.1.1 |
| A11Y-021 | Titre de carte coupé avec l'espacement du texte de 1.4.12 (420×24, contenu 420×27) | RGAA 10.12 ; WCAG 1.4.12 |
| A11Y-022 | Défilement horizontal à 320 px (page de 752 px, `.content { min-width: 720px }`) | RGAA 10.11 ; WCAG 1.4.10 |

### Risques potentiels à confirmer (extrait)

Zoom bloqué par la balise viewport (A11Y-027) ; tableau sans en-têtes déclarés (A11Y-028) ; animation infinie du bandeau sans pause (A11Y-033, A11Y-035) ; texte coupé lors de l'agrandissement du texte seul (simulation, A11Y-037 à A11Y-039) ; zone principale et lien d'évitement absents (A11Y-040, A11Y-041) ; `autocomplete` absent sur l'e-mail (A11Y-042) ; dans `Toolbar.jsx`, éléments cliquables non focalisables (A11Y-024, A11Y-025), à confirmer une fois le composant rendu.

### Contrôles manuels requis (extrait)

Contexte du lien « En savoir plus » (A11Y-043) ; hiérarchie des titres h1 puis h3 (A11Y-044) ; messages d'erreur du formulaire (A11Y-045) ; restitution des composants avec un lecteur d'écran ; contrôles du composant `Toolbar` une fois rendu, dont `<button><TrashIcon /></button>`, que l'analyse statique ne peut pas conclure.

## 6. Extrait de la matrice préliminaire

| Critère | Statut préliminaire | Constats |
|---|---|---|
| RGAA 3.2 | Non conforme (échec vérifié) | A11Y-017, A11Y-018, A11Y-030, A11Y-031 |
| RGAA 10.7 | Non conforme (échec vérifié) | A11Y-004 à A11Y-009, A11Y-026 |
| RGAA 12.7 | À confirmer (risque) | A11Y-041 |
| WCAG 2.5.8 | Contrôle automatisé partiel sans échec détecté (non conclusif) | Le bouton de 20 × 20 px bénéficie de l'exception d'espacement (cercle de 24 px sans intersection) |
| RGAA 4.1 à 4.13 | Non testé (aucun média) ; à qualifier « Non applicable » par l'auditeur après vérification | |

## 7. Limites

- Une seule page, état par défaut, thème clair, Chromium uniquement.
- Aucun test avec technologie d'assistance : les critères RGAA 7.1, 7.5 et 10.8 ne peuvent pas être validés.
- La simulation d'agrandissement du texte double les tailles calculées : à confirmer avec la fonction réelle d'un navigateur.
- Le composant `Toolbar.jsx` n'a été analysé que statiquement.
- Aucun résultat de cet exemple ne permet de calculer un taux RGAA.

## 8. Commandes utilisées

```bash
node scripts/static-scan.mjs tests/fixtures/inaccessible-app --json /tmp/ex/statique.json
node scripts/dynamic-audit.mjs tests/fixtures/inaccessible-app/index.html --out /tmp/ex/dyn --dialog-trigger "#open-modal"
node scripts/build-matrix.mjs /tmp/ex/statique.json /tmp/ex/dyn/resultats-dynamiques.json --json /tmp/ex/constats.json --md /tmp/ex/matrice.md
node scripts/contrast.mjs "#FFFFFF" "#73B9B0" --size 16px --suggest both
```
