# Plan de remédiation : [Nom du service]

> Ce plan propose des corrections ; **aucune n'est appliquée automatiquement**. Le mode remédiation n'est activé que sur demande explicite de l'utilisateur, constat par constat ou lot par lot.

Date : [JJ/MM/AAAA]. Audit de référence : [lien]. Référentiel : [ ].

## Priorisation

Score indicatif : **Priorité = gravité × fréquence d'usage du parcours**, ajusté par l'effort.

| Priorité | Règle |
|---|---|
| P1 | Échec vérifié bloquant sur un parcours essentiel (connexion, démarche, paiement, contact), ou défaut d'un composant partagé à fort impact |
| P2 | Échec vérifié majeur ; risque potentiel bloquant à confirmer rapidement |
| P3 | Échec vérifié mineur ; risques potentiels majeurs |
| P4 | Bonnes pratiques, critères AAA, améliorations ergonomiques |

Effort estimé : **S** (moins d'une demi-journée), **M** (1 à 3 jours), **L** (plus de 3 jours ou refonte de composant). L'effort est une estimation, à valider par l'équipe.

## Tableau de synthèse

| Priorité | Constat | Titre | Composant ou page | Impact utilisateur | Effort | Responsable | Échéance | Statut |
|---|---|---|---|---|---|---|---|---|
| P1 | A11Y-001 | | | | | | | À faire |

## Fiche de correction

### A11Y-001 : [Titre]

1. **Explication du défaut** : [ce qui ne fonctionne pas, et pourquoi]
2. **Impact sur les utilisateurs** : [qui, quelle tâche, quelle conséquence]
3. **Critère concerné** : RGAA 4.1.2 [n°] ; WCAG 2.2 [n°, niveau]
4. **Code existant** (`[fichier:lignes]`) :

```html
[extrait exact du code actuel]
```

5. **Code corrigé** :

```html
[proposition respectant les conventions du projet : framework, nommage, design system]
```

6. **Effets de bord** : [composants partagés, tests existants à adapter, traductions, impact visuel, autres états du même jeton de couleur]
7. **Tests à effectuer** : [tests unitaires ou de bout en bout à ajouter, par exemple jest-axe ou une assertion Playwright sur le nom accessible]
8. **Vérification de l'accessibilité après correction** :
   - Automatisée : `[commande exacte à relancer]`
   - Manuelle : [clavier, lecteur d'écran, zoom...]
   - Critère de clôture : [ce qui doit être observé]

Pour les couleurs : indiquer l'ancien et le nouveau ratio calculés par `scripts/contrast.mjs` (jamais estimés).

## Contre-vérification

| Constat | Correction (commit) | Méthode de vérification | Résultat | Date | Statut |
|---|---|---|---|---|---|
| A11Y-001 | | | | | Corrigé et vérifié / Corrigé, vérification humaine requise / Non corrigé / Régression |
