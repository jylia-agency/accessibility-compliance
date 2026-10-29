# RGAA 4.1.2 : structure, méthode, calcul

Source : https://accessibilite.numerique.gouv.fr/ (données officielles extraites dans `data/rgaa-4.1.2-criteres.json`, V1). Ne jamais citer un critère RGAA de mémoire : utiliser `node scripts/criteria.mjs rgaa <n°>`.

## Thématiques (106 critères)

| N° | Thématique | Critères |
|---|---|---|
| 1 | Images | 1.1 à 1.9 |
| 2 | Cadres | 2.1 à 2.2 |
| 3 | Couleurs | 3.1 à 3.3 |
| 4 | Multimédia | 4.1 à 4.13 |
| 5 | Tableaux | 5.1 à 5.8 |
| 6 | Liens | 6.1 à 6.2 |
| 7 | Scripts | 7.1 à 7.5 |
| 8 | Éléments obligatoires | 8.1 à 8.10 |
| 9 | Structuration de l'information | 9.1 à 9.4 |
| 10 | Présentation de l'information | 10.1 à 10.14 |
| 11 | Formulaires | 11.1 à 11.13 |
| 12 | Navigation | 12.1 à 12.11 |
| 13 | Consultation | 13.1 à 13.12 |

Chaque critère comprend un ou plusieurs **tests** (identifiés n.n.n) et, pour chaque test, une **méthodologie** officielle (champ `methodologie` du fichier de données ; `node scripts/criteria.mjs rgaa 3.2 --methodo`).

## Échantillon (page « Évaluation de la conformité », V1)

Au moins, lorsqu'elles existent : page d'accueil ; page contact ; mentions légales ; page « accessibilité » ; plan du site ; aide ; authentification.

En plus : au moins une page pertinente par type de service et utilisation principale (y compris la recherche) ; au moins un document téléchargeable pertinent par type de service ; **toutes les pages d'un processus** (formulaire en plusieurs étapes, transaction) ; des pages d'aspect ou de contenu distinct (tableaux, médias, formulaires...) ; enfin, des pages tirées **au hasard** représentant au moins **10 %** de l'échantillon. Les écrans d'applications mobiles comptent comme des pages.

Dans un projet de code, la correspondance avec les « pages » se fait par les routes, vues ou écrans identifiés (voir `references/audit-methodology.md`).

## Environnement de test

Certains critères (notamment la thématique 7) exigent des tests de restitution avec des technologies d'assistance. L'environnement de test (base de référence) combine les technologies d'assistance les plus utilisées et les navigateurs et systèmes pour lesquels elles sont optimisées (voir https://accessibilite.numerique.gouv.fr/methode/environnement-de-test/). **Un agent ne peut pas réaliser ces tests de restitution** : ils sont toujours listés dans la checklist manuelle.

## Statuts d'un critère par page

- **C** (conforme) : tous les éléments de la page passent tous les tests du critère.
- **NC** (non conforme) : au moins un élément échoue à un test.
- **NA** (non applicable) : contenu absent, contenu exempté, ou contenu sous dérogation pour charge disproportionnée **avec** alternative accessible.
- **NT** (non testé) : statut de travail, interdit dans un résultat final.

Pour une page faisant partie d'un processus, un critère n'est validé que s'il l'est sur **toutes** les pages du processus.

## Calcul du taux (V1)

- Critère **validé** pour le service : validé sur **toutes** les pages de l'échantillon où il est applicable.
- Critère **applicable** : applicable sur au moins une page.
- **Taux de critères respectés** = critères validés / critères applicables.
- **Taux moyen** (facultatif) = moyenne des taux de chaque page.
- État de conformité : **totalement conforme** (100 %), **partiellement conforme** (au moins 50 %), **non conforme** (moins de 50 %, ou aucun audit en cours de validité).

`scripts/rgaa-rate.mjs` applique ces règles à une grille remplie par l'auditeur. Il refuse de qualifier le taux s'il reste des « NT », si la grille est incomplète ou si l'échantillon n'est pas déclaré conforme à la méthode.

**Interdits :** calculer un taux RGAA à partir des résultats d'axe-core ou des scripts du skill ; présenter un taux comme officiel sans échantillon ni tests complets ; arrondir un taux pour franchir le seuil des 50 %.

## Points d'interprétation fréquents

- **1.1 et 1.2** : une image sans alt échoue dans tous les cas (porteuse d'information : 1.1 ; décorative : 1.2.1 exige `alt=""`).
- **1.3** : pertinence de l'alternative : toujours une **vérification humaine**.
- **3.2** : seuils 4,5:1 et 3:1 ; texte « de grande taille » : 24 px, ou 18,5 px en gras. Le texte dans un « mécanisme » de remplacement de contraste peut satisfaire le critère (tests 3.2.5 et 3.3.4).
- **7.1** : « compatible avec les technologies d'assistance » exige un test de restitution réel.
- **8.1 et 8.2** : doctype et validité du code ; renvoient à WCAG 4.1.1, retiré de WCAG 2.2, mais restent exigibles en audit RGAA 4.1.2.
- **10.7** : focus visible ; le style natif ne doit pas être supprimé ou dégradé, ou un style auteur doit être visible.
- **11.1** : le `placeholder` ne figure pas parmi les étiquettes admises par le test 11.1.1.
- **12.7** : lien d'évitement attendu, avec des cas particuliers (voir la note du critère).
- **13.3 et 13.4** : documents bureautiques en téléchargement.

## Correspondances

Le fichier de données reprend les correspondances WCAG **déclarées par le RGAA** (WCAG 2.1). Pour les WCAG 2.2 : `node scripts/criteria.mjs wcag <id>`.

## Évolution attendue

RGAA 5 annoncé pour fin 2026 (V2), non publié au 29/10/2026. À sa publication : ajouter un fichier de données distinct (`data/rgaa-5-criteres.json`), ne pas modifier les données 4.1.2, et documenter la période de transition (voir `references/maintenance.md`).
