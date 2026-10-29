# Matrice de conformité : [Nom du service]

> Point de départ : `node scripts/build-matrix.mjs <résultats>... --md matrice.md`. Cette matrice préliminaire ne contient **aucun** statut « Conforme ». L'auditeur complète chaque ligne avec les résultats de tests effectifs. Un critère n'est « C » sur une page que si **tous ses tests** ont été réalisés et réussis pour **tous les éléments** concernés de la page.

Référentiel : [RGAA 4.1.2 / WCAG 2.2 A et AA]. Date : [JJ/MM/AAAA]. Version du skill : [x.y.z].

## Légende

- **C** : conforme sur la page (tous les tests réalisés et réussis)
- **NC** : non conforme (au moins un échec vérifié, référencé par un identifiant A11Y-NNN)
- **NA** : non applicable (justification obligatoire)
- **NT** : non testé (interdit dans un résultat final)

## Matrice par page (RGAA)

| Critère | P01 Accueil | P02 Contact | P03 ... | Statut service | Constats | Preuves et commentaires |
|---|---|---|---|---|---|---|
| 1.1 | | | | | | |
| 1.2 | | | | | | |
| ... | | | | | | |
| 13.12 | | | | | | |

Liste complète des 106 critères : `node scripts/criteria.mjs liste-rgaa`.

## Correspondance composants et critères

| Composant | Critères concernés | Résultat | Constats | Preuve |
|---|---|---|---|---|
| Bouton (src/components/Button.tsx) | RGAA 3.2, 7.1, 10.7, 11.9 ; WCAG 1.4.3, 2.4.7, 4.1.2 | | | |

## Grille pour le calcul du taux RGAA

Format JSON attendu par `scripts/rgaa-rate.mjs` :

```json
{
  "echantillon": {
    "pages": ["accueil", "contact"],
    "conformeMethodeRgaa": false,
    "justification": "Décrire comment l'échantillon respecte la méthode (pages obligatoires, processus, 10 % aléatoires)"
  },
  "processus": [["panier", "paiement", "confirmation"]],
  "resultats": {
    "accueil": { "1.1": "C", "1.2": "NA", "3.2": "NC", "...": "..." },
    "contact": { "1.1": "C", "...": "..." }
  }
}
```

Le taux n'est qualifié que si les 106 critères sont renseignés sur chaque page, sans « NT », et si l'échantillon est déclaré conforme à la méthode. Sinon le script le marque **PROVISOIRE**.

## Matrice WCAG 2.2 (si demandée)

| Critère | Niveau | Pages testées | Résultat | Constats | Preuve |
|---|---|---|---|---|---|
| 1.1.1 Non-text Content | A | | | | |
| ... | | | | | |
| 4.1.3 Status Messages | AA | | | | |

Liste : `node scripts/criteria.mjs liste-wcag AA` (55 critères). 4.1.1 Parsing est retiré de WCAG 2.2.
