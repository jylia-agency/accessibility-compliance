# Animations et effets visuels

Critères : WCAG 2.2 **2.2.1**, **2.2.2** Pause, Stop, Hide (A), **2.3.1** Three Flashes or Below Threshold (A), **2.3.3** Animation from Interactions (**AAA**) ; RGAA **13.1**, **13.7**, **13.8**, **4.10**.

## Règle impérative

Les animations ne sont **pas** non conformes par nature. Il faut évaluer les conditions exactes de chaque critère.

## Conditions des critères

| Critère | S'applique si | Exigence | Exceptions |
|---|---|---|---|
| 2.2.2 (A) / RGAA 13.8 : mouvement, défilement, clignotement | Démarre **automatiquement**, dure **plus de 5 secondes**, présenté **en parallèle** d'autres contenus | Mécanisme pour mettre en pause, arrêter ou masquer | Mouvement essentiel à l'activité |
| 2.2.2 : mise à jour automatique | Démarre automatiquement, présenté en parallèle | Mettre en pause, arrêter, masquer ou contrôler la fréquence | Mise à jour essentielle |
| RGAA 13.8.1 | Contenu en mouvement déclenché automatiquement | Durée de 5 s au plus, **ou** arrêt et relance, **ou** affichage et masquage, **ou** information complète sans le mouvement | |
| 2.3.1 (A) / RGAA 13.7 | Contenu qui flashe | Pas plus de 3 flashs par seconde, ou sous les seuils de flash général et rouge | |
| 2.3.3 (AAA) | Animation déclenchée par une interaction | Possibilité de la désactiver | Animation essentielle |
| 1.4.2 (A) / RGAA 4.10 | Son automatique de plus de 3 s | Arrêt, pause ou volume indépendant | |

## Cas usuels

| Cas | Analyse |
|---|---|
| Indicateur de chargement (spinner) | Le document « Understanding 2.2.2 » admet qu'une animation de chargement puisse être considérée comme essentielle si aucune interaction n'est possible pendant cette phase et si l'absence d'indication pouvait dérouter l'utilisateur ; à documenter au cas par cas |
| Carrousel automatique | 2.2.2 et RGAA 13.8 si rotation automatique de plus de 5 s : bouton pause accessible, arrêt au focus recommandé |
| Bandeau défilant (« ticker ») | Concerné : pause, arrêt ou masquage requis |
| Vidéo d'arrière-plan en lecture automatique | Concernée si elle dure plus de 5 s : bouton pause |
| Parallaxe, zoom au défilement | 2.3.3 (AAA) : recommandation ; vigilance pour les troubles vestibulaires |
| Transition de 200 ms au survol | Non concernée par 2.2.2 |
| Animations GIF ou Lottie en boucle | Concernées si plus de 5 s et en parallèle d'un contenu |

## `prefers-reduced-motion`

Respecter la préférence système est une **bonne pratique** fortement recommandée, et une technique de 2.3.3 (AAA). Son absence n'est **pas** un échec AA. Elle ne remplace pas le mécanisme de pause exigé par 2.2.2, car l'utilisateur concerné n'a pas forcément activé ce réglage.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

## Outils

- `static-scan.mjs` : animations infinies (risque 2.2.2), absence de `prefers-reduced-motion` (bonne pratique), `<marquee>`, `<blink>`, médias en lecture automatique, `meta refresh`.
- `dynamic-audit.mjs` : animations réellement en cours (`document.getAnimations()`), comparaison avec `reducedMotion: 'reduce'`.
- Manuel : présence et fonctionnement du bouton pause, durée réelle, caractère essentiel, flashs (outil d'analyse de flashs type PEAT si le contenu le justifie).
