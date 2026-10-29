# Couleurs et contrastes

Critères : WCAG 2.2 **1.4.3** (AA), **1.4.6** (AAA), **1.4.11** (AA), **1.4.1** (A) ; RGAA 4.1.2 **3.1**, **3.2**, **3.3**, **10.5**, **10.6**.

## Algorithme (obligatoire)

Toujours utiliser `scripts/lib/color.mjs` (CLI : `scripts/contrast.mjs`). Ne **jamais** estimer un ratio « à l'œil », à partir d'un nom de couleur supposé ou d'une valeur non résolue.

1. Composantes sRGB 8 bits divisées par 255.
2. Linéarisation : `c ≤ 0,04045 ? c / 12,92 : ((c + 0,055) / 1,055) ^ 2,4`. Le RGAA écrit 0,03928 (ancienne valeur WCAG) ; le résultat est identique pour toute couleur 8 bits (test automatisé).
3. Luminance relative : `L = 0,2126 R + 0,7152 G + 0,0722 B`.
4. Rapport : `(L1 + 0,05) / (L2 + 0,05)`, L1 étant la plus claire.
5. **Pas d'arrondi favorable** : 4,499:1 n'atteint pas 4,5:1. Le script affiche les ratios tronqués (jamais arrondis vers le haut) et compare la valeur exacte.

Transparences : une couleur translucide est composée sur le fond **réel** sous-jacent (en sRGB non linéaire, comme les navigateurs). Un fond translucide sans fond sous-jacent connu n'est pas évaluable : le script refuse de supposer un blanc.

## Seuils

| Élément | AA | AAA | RGAA 4.1.2 |
|---|---|---|---|
| Texte normal | 4,5:1 (1.4.3) | 7:1 (1.4.6) | 4,5:1 (3.2.1, 3.2.2) |
| Grand texte : 24 px ou plus ; gras 18,67 px ou plus (WCAG) / 18,5 px ou plus (RGAA) | 3:1 | 4,5:1 | 3:1 (3.2.3, 3.2.4) |
| Composants d'interface (bordures de champ, icônes fonctionnelles, indicateurs d'état, focus) et éléments graphiques nécessaires à la compréhension | 3:1 (1.4.11) | aucun critère spécifique | 3:1 (3.3) |

Le gras s'apprécie sur le rendu (graisse 700 ou plus en pratique). Pour les polices fines ou très grasses, documenter le jugement.

## Exceptions et cas particuliers

- **Composants inactifs** (`disabled`, `aria-disabled="true"`) : exclus de 1.4.3 et 1.4.11. Le script dynamique les compte à part et ne les évalue pas.
- **Texte purement décoratif**, **invisible**, ou faisant partie d'une **image contenant d'autres éléments visuels importants** : exclus.
- **Logotypes** (texte faisant partie d'un logo ou d'une marque) : exclus.
- **Apparence déterminée par l'agent utilisateur** et non modifiée par l'auteur (contrôles natifs non stylés) : exclue de 1.4.11.
- **Mécanisme de remplacement** (bouton « contraste renforcé ») : admis par le RGAA (tests 3.2.5 et 3.3.4) si le mécanisme est lui-même contrasté et accessible.
- **Placeholder** : c'est du texte, soumis à 1.4.3 tant qu'il est affiché.
- **États** : survol, focus, actif, sélectionné, visité, erreur sont des états à mesurer séparément.
- **Thèmes** : mesurer chaque thème (clair, sombre, contraste élevé) ; `dynamic-audit.mjs --color-scheme dark`.
- **Texte sur image ou dégradé** : non calculable automatiquement. Mesurer à la pipette sur la zone la plus défavorable et documenter la méthode.
- **Graphiques** : 3:1 entre les éléments nécessaires à la compréhension et leur fond adjacent, **ou** une information redondante (motifs, étiquettes directes) ; l'information ne doit pas reposer sur la seule couleur (1.4.1, RGAA 3.1).
- **Liens dans le texte** distingués uniquement par la couleur : 3:1 avec le texte environnant **et** un indice supplémentaire au survol et au focus (technique G183), ou soulignement (RGAA 10.6).

## Méthode

1. **Statique** : `static-scan.mjs` calcule les paires déclarées dans une même règle CSS (ou reconstituées avec la règle de base pour les états) et résout les variables CSS simples. Résultat : « Risque potentiel », car la cascade réelle n'est pas connue.
2. **Dynamique** : `dynamic-audit.mjs` lit les styles **calculés**, compose les fonds des ancêtres et l'opacité, détecte les images de fond et les superpositions. Résultat : « Échec vérifié » si le ratio est inférieur au seuil ; « À vérifier manuellement » si le fond est indéterminable.
3. **Manuel** : textes sur image, états non déclenchables automatiquement, graphiques, mécanismes alternatifs.

## Format d'un constat de contraste

```text
A11Y-012 : Contraste insuffisant du bouton « Valider »
- Élément : button.btn-primary (src/components/Button.tsx:14)
- Texte : #FFFFFF ; fond : #73B9B0
- Ratio calculé : 2,25:1 (texte de 16 px, graisse 400 : texte normal)
- Ratio attendu : 4,5:1 (WCAG 2.2 1.4.3 AA ; RGAA 4.1.2 critère 3.2, test 3.2.1)
- Gravité : Majeure
- Correction proposée : fond #418179 -> 4,52:1 (vérifié par scripts/contrast.mjs) ;
  ou texte #414141 -> 4,51:1
- Validation : relancer dynamic-audit.mjs ; vérifier survol, focus et thème sombre
```

## Proposer une couleur corrigée

```bash
node scripts/contrast.mjs "#FFFFFF" "#73B9B0" --size 16px --weight 400 --suggest both
```

Le script conserve la teinte et la saturation, ajuste la luminosité, **re-vérifie le ratio après arrondi 8 bits** et indique le nouveau ratio. Toute couleur proposée dans un rapport doit provenir de ce calcul, puis être vérifiée dans tous les états où elle s'applique. Préserver l'identité visuelle : proposer d'abord la variante la plus proche, en mentionnant l'impact sur les autres usages du même jeton.
