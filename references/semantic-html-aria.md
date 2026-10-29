# HTML sémantique et WAI-ARIA

Critères : WCAG 2.2 **1.3.1**, **1.3.2**, **2.4.1**, **2.4.2**, **2.4.4**, **2.4.6**, **2.5.3**, **3.1.1**, **3.1.2**, **4.1.2**, **4.1.3** ; RGAA thématiques **5** (tableaux), **6** (liens), **7** (scripts), **8** (éléments obligatoires), **9** (structuration), **12.6**.

Références : WAI-ARIA 1.2 (Recommandation du 6 juin 2023) https://www.w3.org/TR/wai-aria-1.2/ ; ARIA in HTML https://www.w3.org/TR/html-aria/ ; APG https://www.w3.org/WAI/ARIA/apg/.

## Principes

1. **Élément natif d'abord.** Un `<button>` apporte rôle, focus, activation Entrée/Espace et nom. Un `<div role="button">` n'apporte que le rôle.
2. **ARIA ne change que la sémantique**, jamais le comportement : tout rôle interactif exige la gestion du focus et du clavier.
3. **La présence d'ARIA ne prouve rien** : seule la restitution effective (arbre d'accessibilité, technologies d'assistance) le fait.
4. **Pas d'ARIA vaut mieux qu'un ARIA faux.**

## Contrôles et défauts fréquents

| Défaut | Critères | Détection |
|---|---|---|
| Contrôle sans nom accessible (bouton icône, lien image) | 4.1.2, 2.4.4 ; RGAA 6.2, 7.1, 11.9 | Statique (Échec vérifié si démontré) ; dynamique via axe-core |
| Nom accessible ne contenant pas l'intitulé visible | 2.5.3 ; RGAA 6.1, 7.1.3, 11.9.2 | Manuel (comparaison du nom et de l'intitulé visible) |
| `aria-hidden="true"` sur un élément focalisable ou contenant des éléments focalisables | 4.1.2 ; RGAA 10.8 | Statique (risque) |
| `role="button"` sans `tabindex` ni gestion clavier | 2.1.1, 4.1.2 ; RGAA 7.1, 7.3 | Statique (risque), dynamique (échec) |
| `aria-expanded`, `aria-selected`, `aria-checked` non synchronisés avec l'état visuel | 4.1.2 ; RGAA 7.1 | Manuel ou scénario dynamique |
| Rôle inexistant, abstrait ou mal orthographié | 4.1.2 | Statique |
| Références d'identifiant cassées (`aria-labelledby`, `for`...) | 1.3.1, 4.1.2 | Statique (documents complets) |
| Rôles redondants ou excessifs (`<nav role="navigation">`, `role="presentation"` sur un élément focalisable) | Bonne pratique ; risque 4.1.2 | Manuel |
| Messages de statut non annoncés (ajout au panier, résultats de recherche, erreurs) | 4.1.3 ; RGAA 7.5 | Manuel (lecteur d'écran) ; vérifier `role="status"`, `role="alert"` ou `aria-live` présents **avant** l'injection du message |
| Titres : absence, hiérarchie incohérente, faux titres stylés | 1.3.1, 2.4.6 ; RGAA 9.1 | Statique (indices) + manuel |
| Régions : `main` absent ou multiple, `header`/`footer` hors contexte, `nav` non différenciées | 1.3.1, 2.4.1 ; RGAA 12.6 | Statique + dynamique (liste des régions) |
| Listes simulées par des `<div>` ou des `<br>` | 1.3.1 ; RGAA 9.3 | Manuel |
| Tableaux de données sans `<th>`, sans `scope` ou `headers` pour les tableaux complexes, sans titre | 1.3.1 ; RGAA 5.4 à 5.7 | Statique (indices) + manuel |
| Tableaux de mise en forme avec `<th>`, `<caption>`, `summary` | 1.3.1 ; RGAA 5.8 | Statique |
| Langue absente ou erronée ; changements de langue non indiqués | 3.1.1, 3.1.2 ; RGAA 8.3, 8.4, 8.7, 8.8 | Statique, dynamique, manuel |
| Titre de page absent ou non pertinent, non mis à jour dans une SPA | 2.4.2 ; RGAA 8.5, 8.6 | Statique, dynamique, manuel |

## Exemples

```html
<!-- Défaut : bouton icône sans nom -->
<button class="icon-btn"><svg viewBox="0 0 16 16"><path d="..."/></svg></button>
<!-- Correction : nom accessible ; icône masquée -->
<button class="icon-btn" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="menu">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16"><path d="..."/></svg>
</button>
```

```html
<!-- Onglets : motif APG « Tabs » (tabindex itinérant, flèches) -->
<div role="tablist" aria-label="Préférences">
  <button role="tab" id="t1" aria-selected="true" aria-controls="p1">Notifications</button>
  <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Sécurité</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">...</div>
<div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>...</div>
```

## Vérification de l'arbre d'accessibilité

`dynamic-audit.mjs` enregistre un instantané de l'arbre (`arbre-accessibilite-N.yml`, format ARIA snapshot de Playwright). Il sert de **preuve** des noms et rôles calculés par Chromium. Il ne remplace pas un test avec lecteur d'écran (NVDA, JAWS, VoiceOver, TalkBack), qui reste une vérification humaine.
