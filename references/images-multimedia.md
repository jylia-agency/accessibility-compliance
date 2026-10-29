# Images, icônes et multimédia

Critères : WCAG 2.2 **1.1.1**, **1.2.1 à 1.2.5** (A/AA), **1.4.2**, **1.4.5**, **2.2.2**, **4.1.2** ; RGAA thématiques **1** (images), **4** (multimédia), **13.5**, **13.6** (contenus cryptiques).

## Images

| Type | Attendu | Méthode |
|---|---|---|
| Image porteuse d'information | Alternative textuelle (`alt`, `aria-label`, `aria-labelledby`) **pertinente** ; description détaillée si nécessaire (graphique, schéma) | Présence : statique ; **pertinence : toujours manuelle** (RGAA 1.3, 1.7) |
| Image décorative | Ignorée : `alt=""` sans autre alternative, ou `aria-hidden="true"`, ou `role="presentation"` | Statique pour la présence ; caractère décoratif : manuel |
| Image-lien, image-bouton | L'alternative décrit la **fonction** (destination, action) | Statique + manuel |
| SVG porteur d'information | `role="img"` + alternative (`aria-label`, `<title>` référencé) | Statique (indices) + manuel |
| SVG décoratif ou icône accompagnée de texte | `aria-hidden="true"` (et `focusable="false"` pour d'anciens navigateurs) | Statique |
| Icône seule dans un bouton | Nom du bouton (`aria-label` ou texte masqué visuellement), icône masquée | Statique (échec si aucun nom) |
| Image texte | Remplacer par du texte stylé, sauf logo ou présentation essentielle | Manuel (RGAA 1.8 ; WCAG 1.4.5) |
| CAPTCHA image | Alternative identifiant la nature, et solution alternative d'accès | Manuel (RGAA 1.4, 1.5) |
| Légende (`<figure>`/`<figcaption>`) | Correctement reliée | Statique + manuel (RGAA 1.9) |
| Graphique, diagramme | Alternative courte + description détaillée ou tableau de données équivalent ; couleurs non seules porteuses d'information ; contraste 3:1 des éléments nécessaires | Manuel (+ contraste dynamique) |

**Règle impérative :** un attribut `alt` présent n'est jamais considéré comme pertinent par défaut. Les scripts produisent un constat « À vérifier manuellement » (`img-alt-review`) pour chaque fichier contenant des alternatives non vides. Les alternatives ressemblant à un nom de fichier ou à un mot générique (« image », « photo », « logo ») sont classées « Risque potentiel ».

## Multimédia

| Contenu | Exigences A et AA (WCAG) / RGAA | Vérification |
|---|---|---|
| Audio seul préenregistré | Transcription (1.2.1 ; RGAA 4.1) | Manuel |
| Vidéo seule préenregistrée | Transcription ou piste audio (1.2.1 ; RGAA 4.1) | Manuel |
| Vidéo avec son préenregistrée | **Sous-titres synchronisés** (1.2.2 ; RGAA 4.3, 4.4) ; **audiodescription** ou alternative (1.2.3 ; RGAA 4.1) ; **audiodescription** au niveau AA (1.2.5 ; RGAA 4.5, 4.6) | Manuel ; statique pour la présence de `<track>` |
| Direct | Sous-titres en direct (1.2.4, AA) ; contenus en direct **exemptés** de l'obligation française (contenu exempté n° 3 du site RGAA) | Manuel + qualification |
| Lecture automatique avec son plus de 3 s | Mécanisme d'arrêt ou de réglage du volume indépendant (1.4.2 ; RGAA 4.10) | Statique (risque) + manuel |
| Vidéo en mouvement automatique | Pause, arrêt ou masquage si plus de 5 s (2.2.2 ; RGAA 13.8) | Statique + dynamique + manuel |
| Lecteur | Contrôles atteignables et utilisables au clavier, nommés, avec états restitués (RGAA 4.11, 4.13 ; WCAG 2.1.1, 4.1.2) | Dynamique + manuel |
| Identification | Média clairement identifiable (titre adjacent) (RGAA 4.7) | Manuel |

Exemptions françaises à examiner (site RGAA, V1) : médias préenregistrés publiés avant le 23/09/2020 ; médias en direct ; contenus de tiers non financés ni contrôlés.

## Correction type

```html
<video controls preload="metadata" aria-describedby="video-desc">
  <source src="presentation.mp4" type="video/mp4">
  <track kind="captions" src="presentation.fr.vtt" srclang="fr" label="Français" default>
</video>
<p id="video-desc">Présentation du service (3 min). <a href="presentation-transcription.html">Transcription textuelle</a>.</p>
```
