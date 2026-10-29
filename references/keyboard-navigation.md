# Navigation au clavier et gestion du focus

Critères : WCAG 2.2 **2.1.1**, **2.1.2**, **2.1.4**, **2.4.1**, **2.4.3**, **2.4.7**, **2.4.11** (AA), **2.4.13** (AAA), **3.2.1** ; RGAA **7.3**, **10.7**, **10.13**, **10.14**, **12.7**, **12.8**, **12.9**, **12.10**, **12.11**, **13.2**.

## Principe

La présence d'un attribut `tabindex`, d'un `role` ou d'un gestionnaire `keydown` **ne prouve pas** qu'un composant est utilisable au clavier. Seul un **test au clavier réel** (automatisé ou manuel) établit un échec ou un succès.

## Contrôles

| Contrôle | Attendu | Outil |
|---|---|---|
| Tab / Maj+Tab | Tous les éléments interactifs atteints, dans un ordre cohérent avec la lecture | `dynamic-audit.mjs` (séquence enregistrée dans `ordre-tabulation-N.json`) + revue humaine de la cohérence |
| Activation | Entrée sur les liens et boutons ; Espace sur les boutons, cases, options | Manuel ; le script ne déclenche pas les actions métier |
| Focus visible | Indicateur perceptible sur chaque élément | `dynamic-audit.mjs` compare les pixels de la zone avant et après focus |
| Focus non masqué (2.4.11) | Élément focalisé au moins partiellement visible (en-tête collant, bannière cookies, chat) | `dynamic-audit.mjs` (échantillonnage) + manuel avec zoom |
| Pièges | Possibilité de quitter tout composant au clavier | `dynamic-audit.mjs` (cycles) + manuel |
| Lien d'évitement | Premier élément focalisable, visible au focus, déplaçant réellement le focus | Statique (présence) + manuel |
| Modales | Focus déplacé à l'ouverture ; maintenu dans la fenêtre modale ; Échap ferme (recommandation APG) ; focus rendu au déclencheur | `dynamic-audit.mjs --dialog-trigger "<sélecteur>"` |
| Menus déroulants, onglets, accordéons, carrousels, listes déroulantes personnalisées | Interactions du motif APG correspondant, `aria-expanded` synchronisé | Manuel guidé par les motifs APG |
| Raccourcis à une touche (2.1.4) | Désactivables, reconfigurables, ou actifs seulement au focus du composant | Statique (indices) + manuel |
| Contenus au survol ou au focus (1.4.13) | Masquables (Échap) sans déplacer le pointeur, survolables, persistants | Manuel |
| SPA : changement de route | Focus déplacé (titre ou conteneur principal) et titre de page mis à jour ; annonce éventuelle | Manuel + dynamique ciblé |

## Interprétation des résultats outillés

- **`focus-not-visible`** : aucun pixel ne change dans la boîte de l'élément élargie de 6 px. « Échec vérifié » ; si le design affiche l'indicateur ailleurs (carte parente), confirmer visuellement.
- **`keyboard-unreachable`** : élément avec écouteur de clic (détecté par le protocole DevTools) ou rôle interactif, jamais atteint par Tab. « Échec vérifié » sauf **alternative équivalente au clavier dans la page** (RGAA 7.3.1), à vérifier.
- **`keyboard-trap`** : cycle de tabulation sans retour au début. « Risque potentiel » : légitime dans une fenêtre modale fermable.
- **`dialog-focus-escapes`** : « Échec vérifié » pour une fenêtre déclarée modale ; « Risque potentiel » sinon.
- La sortie du focus vers l'interface du navigateur (par exemple depuis un `<dialog>` natif ouvert avec `showModal()`) n'est **pas** un défaut.

## Corrections types

```css
/* Ne pas supprimer le focus ; si nécessaire, le masquer seulement pour la souris */
:focus-visible { outline: 3px solid #1a5fb4; outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }
html { scroll-padding-top: 5rem; } /* en-tête collant : évite le masquage du focus (2.4.11) */
```

```html
<!-- Fenêtre modale native : focus initial, inertie du fond et Échap gérés par le navigateur -->
<button type="button" id="open">Modifier mon profil</button>
<dialog id="dlg" aria-labelledby="dlg-title">
  <h2 id="dlg-title">Modifier mon profil</h2>
  ...
  <button type="button" id="close">Fermer</button>
</dialog>
<script>
  open.addEventListener('click', () => dlg.showModal());
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => open.focus()); // retour explicite au déclencheur
</script>
```

Préférer les éléments natifs (`<button>`, `<a href>`, `<details>`, `<dialog>`, `<select>`). À défaut, suivre le motif APG : https://www.w3.org/WAI/ARIA/apg/patterns/
